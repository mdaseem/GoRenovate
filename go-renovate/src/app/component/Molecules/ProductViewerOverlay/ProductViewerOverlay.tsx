"use client";
import React, { useMemo, useState } from "react";
import styles from "./ProductViewerOverlay.module.css";
import GLViewer, { LoadedModelFacts, ViewerSource } from "../../Atoms/GLViewer/GLViewer";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { setProductViewerId } from "@/app/store/features/categorySlice";
import { RootState } from "@/app/store/store";
import { Essential, Model3dSource } from "@/app/types/category";
import { compareToListing } from "@/app/utils/gl/modelCheck";

const SOURCE_LABELS: Record<Model3dSource, string> = {
  vendor: "Supplied by the vendor",
  commissioned: "Made for Go Renovate",
  scanned: "3D scan of the product",
  "test-placeholder": "Test model — not the real product",
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

// "View in 3D" for one product, opened from a piece's row (global overlay
// mechanism). The product comes from the loaded category, and its flat cutout /
// photo is the poster while the model downloads — and stays as the picture if
// the browser can't do 3D or the model fails.
export default function ProductViewerOverlay() {
  const dispatch = useAppDispatch();
  const detail = useAppSelector((state: RootState) => state.categoryState.activeCategoryDetail);
  const productId = useAppSelector((state: RootState) => state.categoryState.productViewerId);

  const essential = useMemo<Essential | null>(() => {
    if (!detail || !productId) return null;
    for (const options of Object.values(detail.essentialsBySlot)) {
      const found = options.find((option) => option._id === productId);
      if (found) return found;
    }
    return null;
  }, [detail, productId]);

  // What the viewer measured on the model it loaded; compared with the listed size.
  const group = useAppSelector((state: RootState) => state.categoryState.productViewerGroup);
  const [facts, setFacts] = useState<LoadedModelFacts | null>(null);

  // The other pieces of the room that have a model, to switch between.
  const siblings = useMemo(() => {
    if (!detail || group.length < 2) return [];
    const all = Object.values(detail.essentialsBySlot).flat();
    return group
      .map((id) => all.find((item) => item._id === id))
      .filter((item): item is Essential => Boolean(item?.model3d));
  }, [detail, group]);

  const source = useMemo<ViewerSource | null>(
    () =>
      essential?.model3d
        ? { type: "url", url: essential.model3d.url, label: essential.name }
        : null,
    [essential],
  );

  if (!essential || !source) {
    return (
      <div className={styles.overlay}>
        <p className={styles.alert} role="alert">
          This product has no 3D model. Please close this and try another piece.
        </p>
      </div>
    );
  }

  const fit = facts ? compareToListing(facts.sizeCm, essential.dimensionsCm) : null;
  const model = essential.model3d;
  const checkedOn = model?.checkedAt ? formatDate(model.checkedAt) : null;
  const provenance = [
    model?.source ? SOURCE_LABELS[model.source] : null,
    model?.credit ?? null,
    checkedOn ? `size checked ${checkedOn}` : null,
  ].filter(Boolean);

  const posterSrc = essential.cutoutUrl ?? essential.images[0];
  const size = essential.dimensionsCm;

  return (
    <div className={styles.overlay}>
      <h2 className={styles.title}>{essential.name}</h2>
      <p className={styles.hint}>
        Drag to turn it, pinch or use + and − to zoom.
      </p>
      {siblings.length > 1 && (
        <ul className={styles.switcher} aria-label="Pieces with a 3D view">
          {siblings.map((item) => (
            <li key={item._id}>
              <button
                type="button"
                className={styles.switchButton}
                aria-pressed={item._id === essential._id}
                onClick={() => {
                  setFacts(null);
                  dispatch(setProductViewerId({ id: item._id, group }));
                }}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <GLViewer key={essential._id} source={source} showInfo={false} onModelChange={setFacts} poster={posterSrc ? { src: posterSrc, alt: essential.name } : undefined} />

      <dl className={styles.facts}>
        <div>
          <dt>Price</dt>
          <dd>₹{essential.price.toLocaleString("en-IN")}</dd>
        </div>
        <div>
          <dt>Sold by</dt>
          <dd>{essential.vendorName}</dd>
        </div>
        {size && (
          <div>
            <dt>Listed size (w × d × h)</dt>
            <dd>
              {size.w} × {size.d} × {size.h} cm
            </dd>
          </div>
        )}
      </dl>

      {fit && (fit.status === "close" || fit.status === "mismatch") && (
        <p className={styles.warning}>
          The 3D shape is a guide only — it doesn&apos;t exactly match the listed size, so go by the
          listed size above when you plan your room.
        </p>
      )}
      {provenance.length > 0 && (
        <p className={`${styles.note} ${model?.source === "test-placeholder" ? styles.noteStrong : ""}`}>
          3D model: {provenance.join(" · ")}
        </p>
      )}

      <p className={styles.note}>
        An illustrative 3D preview — real colours and finish may differ from the photos.
      </p>
    </div>
  );
}
