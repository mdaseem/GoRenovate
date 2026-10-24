"use client";

import React, { useEffect, useState } from "react";
import styles from "./VendorProducts.module.css";
import AccountGate from "@/app/component/Features/VendorAccount/components/AccountGate";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import { ManagedProduct, PhotoRules, ProductType } from "@/app/types/vendorProducts";
import { fetchMyProduct, fetchProductTypes, ProductsApiError } from "@/app/utils/vendorProductsApi";
import ProductForm from "./components/ProductForm";

// Loads what the form needs (the product types, and the product when editing), then shows it.
const FormLoader: React.FC<{ token: string; productId?: string }> = ({ token, productId }) => {
  const [types, setTypes] = useState<ProductType[] | null>(null);
  const [photoRules, setPhotoRules] = useState<PhotoRules | null>(null);
  const [product, setProduct] = useState<ManagedProduct | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setNotFound(false);
    Promise.all([
      fetchProductTypes(token, controller.signal),
      productId ? fetchMyProduct(token, productId, controller.signal) : Promise.resolve(null),
    ])
      .then(([options, loaded]) => {
        if (controller.signal.aborted) return;
        setTypes(options.types);
        setPhotoRules(options.photos);
        setProduct(loaded);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ProductsApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        console.error("Failed to load the product form:", err);
        setError("We couldn't load this page. Please check your connection and try again.");
      });
    return () => controller.abort();
  }, [token, productId, reloadCount]);

  if (notFound) {
    return (
      <ErrorState
        variant="inline"
        role="status"
        icon="🔍"
        title="We couldn't find this product"
        message="It may not be one of yours, or the link may be wrong."
        actionLabel="Back to my products"
        href="/vendor/products"
      />
    );
  }
  if (error) {
    return (
      <ErrorState
        variant="inline"
        title="We couldn't load this page"
        message={error}
        actionLabel="Try again"
        onAction={() => setReloadCount((count) => count + 1)}
      />
    );
  }
  if (!types || !photoRules || (productId && !product)) {
    return (
      <div className={styles.skeleton} role="status" aria-label="Loading">
        <div className={styles.skeletonBlock} />
        <div className={styles.skeletonBlock} />
      </div>
    );
  }
  // Remount when the product changes so the form always starts from the product on screen.
  return (
    <ProductForm key={product?.id ?? "new"} token={token} types={types} photoRules={photoRules} product={product ?? undefined} />
  );
};

const VendorProductFormPage: React.FC<{ productId?: string }> = ({ productId }) => (
  <AccountGate
    heading={productId ? "Edit product" : "Add a product"}
    signedOutTitle="Sign in to manage your products"
    signedOutMessage="Sign in with your vendor account."
  >
    {(account, token) =>
      account.role === "vendor" ? (
        <FormLoader token={token} productId={productId} />
      ) : (
        <ErrorState
          variant="inline"
          role="status"
          icon="🏪"
          title="Products are for vendors"
          message="Once your application to sell has been approved, you can add your products here."
          actionLabel="Back to the site"
          href="/"
        />
      )
    }
  </AccountGate>
);

export default VendorProductFormPage;
