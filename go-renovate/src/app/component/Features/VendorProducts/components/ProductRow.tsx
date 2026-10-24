"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import styles from "../VendorProducts.module.css";
import { ManagedProduct, PRODUCT_LIMITS, ProductFieldErrors } from "@/app/types/vendorProducts";
import { summariseProduct } from "@/app/utils/productFormat";
import {
  duplicateProduct,
  pauseProduct,
  ProductsApiError,
  resumeProduct,
  updateProduct,
} from "@/app/utils/vendorProductsApi";
import ProductStatusChip from "./ProductStatusChip";
import ProductThumb from "./ProductThumb";

interface ProductRowProps {
  product: ManagedProduct;
  token: string;
  // The server's version of the product after an action, and a sentence to tell the vendor.
  onChanged: (product: ManagedProduct, message: string) => void;
  // A copy was created (it goes to the review list).
  onDuplicated: (copy: ManagedProduct) => void;
}

type Busy = null | "save" | "pause" | "resume" | "duplicate";

// One product in "My products": its status, what the vendor needs to know about it, a quick editor for
// price and stock (live at once), and pause / resume / duplicate / edit.
const ProductRow: React.FC<ProductRowProps> = ({ product, token, onChanged, onDuplicated }) => {
  const uid = useId();
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(product.stock === null ? "" : String(product.stock));
  const [untracked, setUntracked] = useState(product.stock === null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({});
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) panelRef.current?.querySelector<HTMLElement>("input")?.focus();
  }, [editing]);

  const fail = (err: unknown, fallback: string) => {
    console.error(fallback, err);
    if (err instanceof ProductsApiError) {
      setError(err.message);
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } else {
      setError("We couldn't do that. Check your connection and try again.");
    }
  };

  const openEditor = () => {
    setPrice(String(product.price));
    setStock(product.stock === null ? "" : String(product.stock));
    setUntracked(product.stock === null);
    setError(null);
    setFieldErrors({});
    setEditing(true);
  };

  const saveQuick = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: ProductFieldErrors = {};
    const priceNumber = Number(price.replace(/[^\d]/g, ""));
    if (!price.trim() || priceNumber < PRODUCT_LIMITS.priceMin || priceNumber > PRODUCT_LIMITS.priceMax) {
      errors.price = "Enter the price in whole rupees.";
    }
    let stockValue: number | null = null;
    if (!untracked) {
      const parsed = Number(stock);
      if (stock.trim() === "" || !Number.isInteger(parsed) || parsed < 0 || parsed > PRODUCT_LIMITS.stockMax) {
        errors.stock = `Enter a whole number from 0 to ${PRODUCT_LIMITS.stockMax}.`;
      } else stockValue = parsed;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setBusy("save");
    setError(null);
    setFieldErrors({});
    try {
      const { product: updated } = await updateProduct(token, product.id, { price: priceNumber, stock: stockValue });
      setEditing(false);
      onChanged(
        updated,
        updated.status === "live"
          ? `${updated.name}: price and stock saved. They are live now.`
          : `${updated.name}: saved.`,
      );
    } catch (err) {
      fail(err, "Failed to save price and stock:");
    } finally {
      setBusy(null);
    }
  };

  const run = async (kind: Exclude<Busy, null | "save">) => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === "duplicate") {
        const copy = await duplicateProduct(token, product.id);
        onDuplicated(copy);
        return;
      }
      const updated = kind === "pause" ? await pauseProduct(token, product.id) : await resumeProduct(token, product.id);
      onChanged(updated, kind === "pause" ? `${updated.name} is paused. Buyers can't see it.` : `${updated.name} is live again.`);
    } catch (err) {
      fail(err, `Failed to ${kind} a product:`);
    } finally {
      setBusy(null);
    }
  };

  const canPause = product.status === "live";
  const canResume = product.status === "paused" && product.pausedBy === "vendor";

  return (
    <li className={styles.card}>
      <div className={styles.cardMain}>
        <ProductThumb imageUrl={product.imageUrl} />
        <div className={styles.cardBody}>
          <div className={styles.cardHead}>
            <h3 className={styles.name}>{product.name}</h3>
            <ProductStatusChip status={product.status} />
          </div>
          <p className={styles.meta}>{summariseProduct(product)}</p>
        </div>
      </div>

      {product.status === "pending" && product.hasPhoto && (
        <p className={styles.note}>Waiting for our review. Buyers can&apos;t see it yet.</p>
      )}
      {product.status === "pending" && !product.hasPhoto && (
        <p className={`${styles.note} ${styles.noteBad}`}>
          <strong>Add a photo:</strong> we can&apos;t approve a product without one.{" "}
          <Link href={`/vendor/products/${product.id}/edit`} className={styles.noteLink}>
            Add photos
          </Link>
        </p>
      )}
      {product.status !== "pending" && !product.hasPhoto && product.status !== "rejected" && (
        <p className={styles.note}>
          This product has no photo yet.{" "}
          <Link href={`/vendor/products/${product.id}/edit`} className={styles.noteLink}>
            Add photos
          </Link>
        </p>
      )}
      {product.status === "rejected" && (
        <p className={`${styles.note} ${styles.noteBad}`}>
          <strong>Needs changes:</strong> {product.reviewNote || "Please check the details and save again."}
        </p>
      )}
      {product.status === "paused" && product.pausedBy === "admin" && (
        <p className={styles.note}>Go Renovate paused this product. Please contact us to put it back on sale.</p>
      )}

      {editing ? (
        <form className={styles.panel} onSubmit={saveQuick} noValidate aria-busy={busy === "save"}>
          <div ref={panelRef} className={styles.panelRow}>
            <div className={styles.field}>
              <label htmlFor={`${uid}-price`} className={styles.label}>
                Price (₹)
              </label>
              <input
                id={`${uid}-price`}
                className={`${styles.input} ${fieldErrors.price ? styles.inputError : ""}`}
                inputMode="numeric"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                aria-invalid={Boolean(fieldErrors.price)}
                aria-describedby={fieldErrors.price ? `${uid}-price-error` : undefined}
              />
              {fieldErrors.price && (
                <p id={`${uid}-price-error`} role="alert" className={styles.error}>
                  {fieldErrors.price}
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor={`${uid}-stock`} className={styles.label}>
                In stock
              </label>
              <input
                id={`${uid}-stock`}
                className={`${styles.input} ${fieldErrors.stock ? styles.inputError : ""}`}
                inputMode="numeric"
                value={untracked ? "" : stock}
                disabled={untracked}
                onChange={(event) => setStock(event.target.value)}
                aria-invalid={Boolean(fieldErrors.stock)}
                aria-describedby={fieldErrors.stock ? `${uid}-stock-error` : undefined}
              />
              {fieldErrors.stock && (
                <p id={`${uid}-stock-error`} role="alert" className={styles.error}>
                  {fieldErrors.stock}
                </p>
              )}
            </div>
          </div>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={untracked} onChange={(event) => setUntracked(event.target.checked)} />
            I don&apos;t count my stock
          </label>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.actions}>
            <button type="submit" className={styles.btnPrimary} disabled={busy === "save"}>
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => setEditing(false)} disabled={busy === "save"}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className={styles.actions}>
            {product.status === "rejected" ? (
              <Link href={`/vendor/products/${product.id}/edit`} className={styles.btnPrimary}>
                Fix and resubmit
              </Link>
            ) : (
              <button type="button" className={styles.btnSecondary} onClick={openEditor}>
                Price &amp; stock
              </button>
            )}
            {product.status !== "rejected" && (
              <Link href={`/vendor/products/${product.id}/edit`} className={styles.btnSecondary}>
                Edit details
              </Link>
            )}
            {canPause && (
              <button type="button" className={styles.btnSecondary} onClick={() => run("pause")} disabled={busy !== null}>
                {busy === "pause" ? "Pausing…" : "Pause"}
              </button>
            )}
            {canResume && (
              <button type="button" className={styles.btnSecondary} onClick={() => run("resume")} disabled={busy !== null}>
                {busy === "resume" ? "Saving…" : "Put back on sale"}
              </button>
            )}
            <button type="button" className={styles.btnSecondary} onClick={() => run("duplicate")} disabled={busy !== null}>
              {busy === "duplicate" ? "Copying…" : "Duplicate"}
            </button>
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </>
      )}
    </li>
  );
};

export default ProductRow;
