"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../VendorProducts.module.css";
import {
  FIT_CHOICES,
  FitZone,
  ManagedProduct,
  PhotoRules,
  PRODUCT_LIMITS,
  ProductField,
  ProductFieldErrors,
  ProductInput,
  ProductType,
} from "@/app/types/vendorProducts";
import { setFlashMessage } from "@/app/utils/flashMessage";
import { createProduct, ProductsApiError, updateProduct } from "@/app/utils/vendorProductsApi";
import { useProductPhotos } from "../hooks/useProductPhotos";
import PhotoPicker from "./PhotoPicker";

interface ProductFormProps {
  token: string;
  types: ProductType[];
  photoRules: PhotoRules;
  // Present when editing an existing product.
  product?: ManagedProduct;
}

interface Values {
  slot: string;
  // "" until chosen; only used for the types that ask how it is fitted
  fit: string;
  name: string;
  price: string;
  stock: string;
  untracked: boolean;
  w: string;
  h: string;
  d: string;
  description: string;
}

const FIELD_ORDER: ProductField[] = ["slot", "fit", "name", "price", "stock", "dimensionsCm", "description", "photos"];
const PHOTO_INPUT_ID = "product-photos";

function initialValues(product?: ManagedProduct): Values {
  return {
    slot: product?.slot ?? "",
    fit: product?.fit ?? "",
    name: product?.name ?? "",
    price: product ? String(product.price) : "",
    stock: product && product.stock !== null ? String(product.stock) : "",
    untracked: product ? product.stock === null : false,
    w: product?.dimensionsCm ? String(product.dimensionsCm.w) : "",
    h: product?.dimensionsCm ? String(product.dimensionsCm.h) : "",
    d: product?.dimensionsCm?.d ? String(product.dimensionsCm.d) : "",
    description: product?.description ?? "",
  };
}

const toNumber = (text: string) => (text.trim() === "" ? NaN : Number(text));

// Same rules as the server (services/vendorProductRules.ts); the server stays the authority.
function validate(values: Values, fits: FitZone[] | undefined): { errors: ProductFieldErrors; input: ProductInput | null } {
  const errors: ProductFieldErrors = {};
  if (fits && !fits.includes(values.fit as FitZone)) errors.fit = "Choose how it is fitted.";
  const name = values.name.trim().replace(/\s+/g, " ");
  if (!values.slot) errors.slot = "Choose what kind of product this is.";
  if (name.length < PRODUCT_LIMITS.nameMin || name.length > PRODUCT_LIMITS.nameMax) {
    errors.name = `Enter a name (${PRODUCT_LIMITS.nameMin} to ${PRODUCT_LIMITS.nameMax} characters).`;
  }
  const price = Number(values.price.replace(/[^\d]/g, ""));
  if (!values.price.trim() || !Number.isInteger(price) || price < PRODUCT_LIMITS.priceMin || price > PRODUCT_LIMITS.priceMax) {
    errors.price = `Enter the price in whole rupees (${PRODUCT_LIMITS.priceMin} to ${PRODUCT_LIMITS.priceMax.toLocaleString("en-IN")}).`;
  }
  let stock: number | null = null;
  if (!values.untracked) {
    const parsed = toNumber(values.stock);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > PRODUCT_LIMITS.stockMax) {
      errors.stock = `Enter how many you have (0 to ${PRODUCT_LIMITS.stockMax}), or tick "I don't count my stock".`;
    } else stock = parsed;
  }
  let dimensionsCm: ProductInput["dimensionsCm"] = null;
  const anySize = [values.w, values.h, values.d].some((part) => part.trim() !== "");
  if (anySize) {
    const w = toNumber(values.w);
    const h = toNumber(values.h);
    const d = toNumber(values.d);
    const ok = (value: number) => Number.isFinite(value) && value > 0 && value <= PRODUCT_LIMITS.sizeMax;
    if (!ok(w) || !ok(h) || (values.d.trim() !== "" && !ok(d))) {
      errors.dimensionsCm = "Enter the width and height in cm (and the depth if you know it), or leave all three empty.";
    } else {
      dimensionsCm = { w, h, ...(values.d.trim() !== "" ? { d } : {}) };
    }
  }
  const description = values.description.trim();
  if (description.length > PRODUCT_LIMITS.descriptionMax) {
    errors.description = `Keep the description under ${PRODUCT_LIMITS.descriptionMax} characters.`;
  }
  if (Object.keys(errors).length > 0) return { errors, input: null };
  return {
    errors,
    input: { name, description, slot: values.slot, price, stock, dimensionsCm, ...(fits ? { fit: values.fit as FitZone } : {}) },
  };
}

// Add a product, or edit one. Phone first: one column, big tiles for the product type, numbers with
// number keypads. A new product goes to review; price and stock edits on a live product are live at once.
const ProductForm: React.FC<ProductFormProps> = ({ token, types, photoRules, product }) => {
  const router = useRouter();
  const editing = Boolean(product);
  const [values, setValues] = useState<Values>(() => initialValues(product));
  const [errors, setErrors] = useState<ProductFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // The type the vendor picked decides whether the form asks "How is it fitted?".
  const selectedFits = types.find((type) => type.id === values.slot)?.fits;
  const photos = useProductPhotos({ token, rules: photoRules, productId: product?.id, initialUrls: product?.photos ?? [] });

  const set = <K extends keyof Values>(key: K, value: Values[K], field?: ProductField) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (field && errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const focusField = (field: ProductField) => {
    const target = formRef.current?.querySelector<HTMLElement>(
      field === "slot"
        ? 'input[name="slot"]'
        : field === "dimensionsCm"
          ? 'input[name="w"]'
          : field === "photos"
            ? `#${PHOTO_INPUT_ID}`
            : `[name="${field}"]`,
    );
    target?.focus();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setFormError(null);
    const result = validate(values, selectedFits);
    // A new product needs a photo (the owner cannot approve it without one) whenever photos can be uploaded.
    if (!editing && photoRules.enabled && photos.readyCount === 0 && !photos.busy) {
      result.errors.photos = photos.hasProblem
        ? "Fix or remove the photo that didn't upload, or add another one."
        : "Add at least one photo so buyers can see what they are buying.";
      result.input = null;
    }
    if (photos.busy) {
      setFormError("Please wait for your photos to finish uploading, then save.");
      return;
    }
    setErrors(result.errors);
    if (!result.input) {
      const first = FIELD_ORDER.find((field) => result.errors[field]);
      if (first) focusField(first);
      return;
    }
    setIsSaving(true);
    try {
      const saved = editing && product
        ? await updateProduct(token, product.id, result.input)
        : await createProduct(token, result.input);
      const note = editing
        ? product?.status === "live"
          ? "Changes saved. Price and stock are live now."
          : "Changes saved."
        : "Product added. It is in review, so buyers can't see it yet.";
      if (!editing) {
        // The product exists now, so the photos that were uploaded while filling the form can be saved on it.
        const { failed } = await photos.attachAll(saved.product.id);
        if (failed > 0) {
          setFlashMessage("Your product is saved, but some photos didn't make it. Add them again here.");
          router.push(`/vendor/products/${saved.product.id}/edit`);
          return;
        }
      }
      if (saved.warnings.length > 0) {
        setWarnings(saved.warnings);
        setFlashMessage(note);
        return;
      }
      setFlashMessage(note);
      router.push("/vendor/products");
    } catch (err) {
      console.error("Failed to save product:", err);
      if (err instanceof ProductsApiError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setErrors(err.fieldErrors);
        const first = FIELD_ORDER.find((field) => err.fieldErrors?.[field]);
        if (first) focusField(first);
        setFormError(err.message);
      } else {
        setFormError(
          err instanceof ProductsApiError
            ? err.message
            : "We couldn't save your product. Check your connection and try again.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Saved, but the size looks unusual: say so and let the vendor go back and check it.
  if (warnings) {
    return (
      <div className={styles.section} role="status">
        <h2 className={styles.sectionHeading}>Saved. Please double-check the size</h2>
        <ul className={styles.warningList}>
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
        <p className={styles.hint}>The product is saved either way. If the size is right, you don&apos;t need to do anything.</p>
        <div className={styles.actions}>
          <Link href="/vendor/products" className={styles.btnPrimary}>
            Back to my products
          </Link>
          <button type="button" className={styles.btnSecondary} onClick={() => setWarnings(null)}>
            Check the size
          </button>
        </div>
      </div>
    );
  }

  const fieldErr = (field: ProductField) => errors[field];
  const describedBy = (field: ProductField, extra?: string) =>
    [fieldErr(field) ? `product-${field}-error` : null, extra].filter(Boolean).join(" ") || undefined;

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSaving}>
      <fieldset
        className={`${styles.section} ${styles.fieldset}`}
        aria-describedby={fieldErr("slot") ? "product-slot-error" : undefined}
      >
        <legend className={styles.legend}>What are you selling?</legend>
        <div className={`${styles.typeGrid} ${fieldErr("slot") ? styles.typeGridInvalid : ""}`}>
          {types.map((type) => (
            <label key={type.id} className={styles.typeTile}>
              <input
                type="radio"
                name="slot"
                value={type.id}
                className={styles.typeInput}
                checked={values.slot === type.id}
                onChange={() => {
                  set("slot", type.id, "slot");
                  // an answer that does not make sense for the new type is dropped, so it must be chosen again
                  if (!type.fits?.includes(values.fit as FitZone)) set("fit", "", "fit");
                }}
              />
              <span className={styles.typeBox}>
                <span className={styles.typeIcon} aria-hidden="true">
                  {type.icon}
                </span>
                {type.label}
              </span>
            </label>
          ))}
        </div>
        {fieldErr("slot") && (
          <p id="product-slot-error" role="alert" className={styles.error}>
            {fieldErr("slot")}
          </p>
        )}
      </fieldset>

      {selectedFits && (
        <fieldset
          className={`${styles.section} ${styles.fieldset}`}
          aria-describedby={fieldErr("fit") ? "product-fit-error" : "product-fit-hint"}
        >
          <legend className={styles.legend}>How is it fitted?</legend>
          <p id="product-fit-hint" className={styles.hint}>
            So buyers see it in the right place in their room.
          </p>
          <div className={`${styles.typeGrid} ${fieldErr("fit") ? styles.typeGridInvalid : ""}`}>
            {FIT_CHOICES.filter((choice) => selectedFits.includes(choice.id)).map((choice) => (
              <label key={choice.id} className={styles.typeTile}>
                <input
                  type="radio"
                  name="fit"
                  value={choice.id}
                  className={styles.typeInput}
                  checked={values.fit === choice.id}
                  onChange={() => set("fit", choice.id, "fit")}
                />
                <span className={styles.typeBox}>
                  <span className={styles.typeIcon} aria-hidden="true">
                    {choice.icon}
                  </span>
                  {choice.label}
                </span>
              </label>
            ))}
          </div>
          {fieldErr("fit") && (
            <p id="product-fit-error" role="alert" className={styles.error}>
              {fieldErr("fit")}
            </p>
          )}
        </fieldset>
      )}

      <section className={styles.section} aria-labelledby="product-basics-heading">
        <h2 id="product-basics-heading" className={styles.sectionHeading}>
          The basics
        </h2>
        <div className={styles.fieldStack}>
          <div className={styles.field}>
            <label htmlFor="product-name" className={styles.label}>
              Product name
            </label>
            <input
              id="product-name"
              name="name"
              className={`${styles.input} ${fieldErr("name") ? styles.inputError : ""}`}
              value={values.name}
              maxLength={PRODUCT_LIMITS.nameMax + 20}
              autoComplete="off"
              onChange={(event) => set("name", event.target.value, "name")}
              aria-invalid={Boolean(fieldErr("name"))}
              aria-describedby={describedBy("name", "product-name-hint")}
            />
            <span id="product-name-hint" className={styles.hint}>
              For example: Teak 3-seater sofa, grey. One colour or size per listing: use Duplicate for the others.
            </span>
            {fieldErr("name") && (
              <p id="product-name-error" role="alert" className={styles.error}>
                {fieldErr("name")}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="product-price" className={styles.label}>
              Price
            </label>
            <div className={styles.moneyWrap}>
              <span className={styles.moneyPrefix} aria-hidden="true">
                ₹
              </span>
              <input
                id="product-price"
                name="price"
                inputMode="numeric"
                className={`${styles.input} ${styles.moneyInput} ${fieldErr("price") ? styles.inputError : ""}`}
                value={values.price}
                autoComplete="off"
                onChange={(event) => set("price", event.target.value, "price")}
                aria-invalid={Boolean(fieldErr("price"))}
                aria-describedby={describedBy("price", "product-price-hint")}
              />
            </div>
            <span id="product-price-hint" className={styles.hint}>
              What the buyer pays, in whole rupees. Include delivery within the cities you deliver to.
            </span>
            {fieldErr("price") && (
              <p id="product-price-error" role="alert" className={styles.error}>
                {fieldErr("price")}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="product-stock" className={styles.label}>
              How many do you have?
            </label>
            <input
              id="product-stock"
              name="stock"
              inputMode="numeric"
              className={`${styles.input} ${fieldErr("stock") ? styles.inputError : ""}`}
              value={values.untracked ? "" : values.stock}
              disabled={values.untracked}
              autoComplete="off"
              onChange={(event) => set("stock", event.target.value, "stock")}
              aria-invalid={Boolean(fieldErr("stock"))}
              aria-describedby={describedBy("stock")}
            />
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={values.untracked}
                onChange={(event) => set("untracked", event.target.checked, "stock")}
              />
              I don&apos;t count my stock (always available)
            </label>
            {fieldErr("stock") && (
              <p id="product-stock-error" role="alert" className={styles.error}>
                {fieldErr("stock")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="product-more-heading">
        <h2 id="product-more-heading" className={styles.sectionHeading}>
          More details <span className={styles.optional}>(optional)</span>
        </h2>
        <div className={styles.fieldStack}>
          <fieldset className={styles.fieldset} aria-describedby={describedBy("dimensionsCm", "product-size-hint")}>
            <legend className={styles.label}>Size in cm</legend>
            <div className={styles.sizeRow}>
              {(
                [
                  ["w", "Width"],
                  ["h", "Height"],
                  ["d", "Depth"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className={styles.field}>
                  <label htmlFor={`product-size-${key}`} className={styles.hint}>
                    {label}
                  </label>
                  <input
                    id={`product-size-${key}`}
                    name={key}
                    inputMode="decimal"
                    className={`${styles.input} ${fieldErr("dimensionsCm") ? styles.inputError : ""}`}
                    value={values[key]}
                    autoComplete="off"
                    onChange={(event) => set(key, event.target.value, "dimensionsCm")}
                    aria-invalid={Boolean(fieldErr("dimensionsCm"))}
                  />
                </div>
              ))}
            </div>
            <span id="product-size-hint" className={styles.hint}>
              In centimetres, not inches. Buyers like to know the size before they order.
            </span>
            {fieldErr("dimensionsCm") && (
              <p id="product-dimensionsCm-error" role="alert" className={styles.error}>
                {fieldErr("dimensionsCm")}
              </p>
            )}
          </fieldset>

          <div className={styles.field}>
            <label htmlFor="product-description" className={styles.label}>
              Description
            </label>
            <textarea
              id="product-description"
              name="description"
              className={`${styles.textarea} ${fieldErr("description") ? styles.inputError : ""}`}
              value={values.description}
              onChange={(event) => set("description", event.target.value, "description")}
              aria-invalid={Boolean(fieldErr("description"))}
              aria-describedby={describedBy("description", "product-description-hint")}
            />
            <span id="product-description-hint" className={styles.hint}>
              Material, finish, what is included. Up to {PRODUCT_LIMITS.descriptionMax} characters.
            </span>
            {fieldErr("description") && (
              <p id="product-description-error" role="alert" className={styles.error}>
                {fieldErr("description")}
              </p>
            )}
          </div>
        </div>
      </section>

      <PhotoPicker photos={photos} rules={photoRules} error={fieldErr("photos")} inputId={PHOTO_INPUT_ID} />

      {formError && (
        <p role="alert" className={styles.error}>
          {formError}
        </p>
      )}

      {editing && product?.status === "rejected" && (
        <p className={styles.hint}>Saving sends this product back for review.</p>
      )}
      {editing && product?.status === "live" && (
        <p className={styles.hint}>Price and stock changes go live at once.</p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={styles.btnPrimary} disabled={isSaving || photos.busy}>
          {isSaving ? "Saving…" : photos.busy ? "Waiting for photos…" : editing ? "Save changes" : "Submit for review"}
        </button>
        <Link href="/vendor/products" className={styles.btnSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
};

export default ProductForm;
