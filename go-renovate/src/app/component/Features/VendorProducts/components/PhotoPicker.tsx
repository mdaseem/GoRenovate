"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "../VendorProducts.module.css";
import { PhotoRules } from "@/app/types/vendorProducts";
import { PHOTO_ACCEPT } from "@/app/utils/productPhotoUpload";
import { productImageProps } from "@/app/utils/productImage";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/app/utils/productFacts";
import { PhotoItem, PhotoStep, ProductPhotos } from "../hooks/useProductPhotos";

interface PhotoPickerProps {
  photos: ProductPhotos;
  rules: PhotoRules;
  // Shown under the pictures when the form wants a photo and has none (validation message).
  error?: string;
  // Needed so the form can scroll to / focus the picker when it asks for a photo.
  inputId: string;
}

const STEP_LABEL: Record<PhotoStep, string> = {
  preparing: "Preparing…",
  uploading: "Uploading…",
  saving: "Saving…",
  removing: "Removing…",
};

const megabytes = (bytes: number) => Math.round(bytes / (1024 * 1024));

// The photo step of the product form: a grid of the product's pictures (the first is the main one), a big
// "Add photo" tile, per-photo progress, and a plain message with "Try again" for any photo that failed.
const PhotoPicker: React.FC<PhotoPickerProps> = ({ photos, rules, error, inputId }) => {
  const { items, notice, addFiles, retry, remove } = photos;
  const full = items.length >= rules.maxPerProduct;
  const problems = items.map((item, index) => ({ item, index })).filter(({ item }) => item.status === "error");
  const hintId = `${inputId}-hint`;

  return (
    <fieldset className={`${styles.section} ${styles.fieldset}`} aria-describedby={error ? `${inputId}-error` : hintId}>
      <legend className={styles.legend}>Photos</legend>

      {!rules.enabled ? (
        <p className={styles.hint} role="status">
          Photo upload isn&apos;t available right now. You can save your product and add photos later.
        </p>
      ) : (
        <>
          <p id={hintId} className={styles.hint}>
            Add up to {rules.maxPerProduct} photos, with the first as the main picture. Show the whole product in good
            light. A product needs at least one photo before we can approve it.
          </p>

          <ul className={styles.photoGrid}>
            {items.map((item, index) => (
              <PhotoTile key={item.key} item={item} index={index} onRemove={() => remove(item.key)} />
            ))}
            {!full && (
              <li className={styles.photoCell}>
                <label className={`${styles.photoAdd} ${error ? styles.photoAddInvalid : ""}`}>
                  <span aria-hidden="true" className={styles.photoAddIcon}>
                    ＋
                  </span>
                  <span>{items.length === 0 ? "Add photos" : "Add more"}</span>
                  <input
                    id={inputId}
                    name="photos"
                    type="file"
                    accept={PHOTO_ACCEPT}
                    multiple
                    className={styles.photoInput}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error ${hintId}` : hintId}
                    onChange={(event) => {
                      if (event.target.files) addFiles(event.target.files);
                      // Allow choosing the same file again after removing it.
                      event.target.value = "";
                    }}
                  />
                </label>
              </li>
            )}
          </ul>

          <p className={styles.hint}>
            JPG, PNG or WebP, up to {megabytes(rules.maxBytes)} MB each (we shrink big photos for you).
          </p>
          {notice && (
            <p className={styles.hint} role="status">
              {notice}
            </p>
          )}
          {problems.length > 0 && (
            <ul className={styles.photoProblems}>
              {problems.map(({ item, index }) => (
                <li key={item.key} className={styles.photoProblem} role="alert">
                  <span className={styles.photoProblemText}>
                    <strong>Photo {index + 1}:</strong> {item.error}
                  </span>
                  <span className={styles.photoProblemActions}>
                    <button type="button" className={styles.btnSecondary} onClick={() => retry(item.key)}>
                      Try again
                    </button>
                    <button type="button" className={styles.btnSecondary} onClick={() => remove(item.key)}>
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && (
        <p id={`${inputId}-error`} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
};

const PhotoTile: React.FC<{ item: PhotoItem; index: number; onRemove: () => void }> = ({ item, index, onRemove }) => {
  const working = item.status === "working";
  const failed = item.status === "error";
  const label = `Photo ${index + 1}${index === 0 ? ", main picture" : ""}`;
  // A saved photo that cannot be loaded shows the default picture instead of a broken-image icon.
  const [broken, setBroken] = useState(false);
  return (
    <li className={styles.photoCell}>
      <div className={`${styles.photoTile} ${failed ? styles.photoTileFailed : ""}`}>
        <Image
          src={broken ? PRODUCT_PLACEHOLDER_IMAGE : item.previewUrl}
          alt={label}
          width={240}
          height={240}
          sizes="(max-width: 480px) 45vw, 160px"
          className={styles.photoImg}
          onError={() => setBroken(true)}
          {...productImageProps(broken ? PRODUCT_PLACEHOLDER_IMAGE : item.previewUrl)}
        />
        {index === 0 && <span className={styles.photoMain}>Main</span>}
        {working && (
          <div className={styles.photoOverlay} role="status">
            <span>{item.step ? STEP_LABEL[item.step] : "Working…"}</span>
            {item.step === "uploading" && (
              <progress className={styles.photoProgress} value={Math.round(item.progress * 100)} max={100} aria-label={`${label} upload progress`} />
            )}
          </div>
        )}
        {failed && (
          <div className={styles.photoOverlay} aria-hidden="true">
            <span className={styles.photoFailMark}>!</span>
          </div>
        )}
        {!working && (
          <button type="button" className={styles.photoRemove} onClick={onRemove} aria-label={`Remove ${label.toLowerCase()}`}>
            <span aria-hidden="true" className={styles.photoRemoveMark}>
              ✕
            </span>
          </button>
        )}
      </div>
      {item.status === "ready" && item.error && (
        <p role="alert" className={styles.error}>
          {item.error}
        </p>
      )}
    </li>
  );
};

export default PhotoPicker;
