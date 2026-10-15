"use client";
import React, { useRef, useState } from "react";
import styles from "./ShareDesign.module.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { saveDesignRequest } from "@/app/store/features/designSlice";
import { SharedDesign } from "@/app/types/design";
import { renderSceneToBlob } from "@/app/utils/exportSceneImage";

type Props = {
  categorySlug: string;
  categoryName: string;
  // The space the room is shown in right now (its positions are the ones saved).
  spaceSlug: string;
  // Inside the room dock: no card of its own, the heading is for screen readers only.
  embedded?: boolean;
};

// "Share your room": save the design to a link anyone can open (no login), or
// download the picture. The link keeps pieces, positions, room size (width, height and 3D depth) and colours
// — prices and stock are always read live when it is opened.
export default function ShareDesign({
  categorySlug,
  categoryName,
  spaceSlug,
  embedded = false,
}: Props) {
  const dispatch = useAppDispatch();
  const customEssentialIds = useAppSelector((s: RootState) => s.categoryState.customEssentialIds);
  const customPositions = useAppSelector((s: RootState) => s.categoryState.customPositions);
  const roomWidthCm = useAppSelector((s: RootState) => s.categoryState.customRoomWidthCm);
  const roomHeightCm = useAppSelector((s: RootState) => s.categoryState.customRoomHeightCm);
  const roomDepthCm = useAppSelector((s: RootState) => s.categoryState.customRoomDepthCm);
  const surfaces = useAppSelector((s: RootState) => s.categoryState.customSurfaces);
  const designState = useAppSelector((s: RootState) => s.designState);
  const { isSaving, savedSignature, saveError } = designState;
  // A link saved in another category does not describe this room.
  const savedDesignId =
    designState.savedCategorySlug === categorySlug ? designState.savedDesignId : null;

  const [status, setStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  const design: SharedDesign = {
    categorySlug,
    spaceSlug,
    essentialIds: customEssentialIds,
    positions: customPositions[spaceSlug] ?? {},
    roomWidthCm,
    roomHeightCm,
    roomDepthCm,
    wallId: surfaces.wallId,
    floorId: surfaces.floorId,
  };
  const signature = JSON.stringify(design);
  const isStale = savedDesignId !== null && savedSignature !== signature;
  const link =
    savedDesignId && typeof window !== "undefined"
      ? `${window.location.origin}/roomCategory/${categorySlug}?design=${savedDesignId}`
      : "";
  const canShareNatively = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const save = () => {
    setStatus(null);
    dispatch(saveDesignRequest({ design, signature }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setStatus("Link copied.");
    } catch {
      // Clipboard blocked (insecure context / permissions): select the text for a manual copy.
      linkRef.current?.select();
      setStatus("Press Ctrl+C (or long-press) to copy the selected link.");
    }
  };

  const shareLink = async () => {
    try {
      await navigator.share({
        title: `My ${categoryName.toLowerCase()} design`,
        text: `Have a look at the ${categoryName.toLowerCase()} I put together on Go Renovate.`,
        url: link,
      });
    } catch (error) {
      // Closing the share sheet is not an error.
      if ((error as DOMException).name !== "AbortError") setStatus("Sharing isn't available here — copy the link instead.");
    }
  };

  const downloadImage = async () => {
    const scene = document.querySelector<HTMLElement>("[data-room-scene]");
    if (!scene) return;
    setStatus(null);
    setIsExporting(true);
    try {
      const blob = await renderSceneToBlob(scene, `${categoryName} design · Go Renovate · illustrative preview`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `my-${categorySlug}-design.png`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Image saved to your downloads.");
    } catch {
      setStatus("We couldn't create the image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section
      className={`${styles.share}${embedded ? ` ${styles.embedded}` : ""}`}
      aria-labelledby="share-design-heading"
    >
      <h2
        id="share-design-heading"
        className={`${styles.heading}${embedded ? ` ${styles.headingHidden}` : ""}`}
      >
        Share your room
      </h2>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={save} disabled={isSaving}>
          {isSaving ? "Saving…" : savedDesignId ? (isStale ? "Save again for a new link" : "Link ready") : "Save & get a link"}
        </button>
        <button type="button" className={styles.secondary} onClick={downloadImage} disabled={isExporting}>
          {isExporting ? "Preparing…" : "Download image"}
        </button>
      </div>

      {saveError && (
        <p className={styles.error} role="alert">
          {saveError}
        </p>
      )}

      {savedDesignId && (
        <div className={styles.panel}>
          <label htmlFor="share-design-link" className={styles.label}>
            {isStale ? "Link to your earlier version" : "Anyone with this link can open your design"}
          </label>
          <div className={styles.linkRow}>
            <input
              id="share-design-link"
              ref={linkRef}
              className={styles.input}
              value={link}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
            <button type="button" className={styles.secondary} onClick={copyLink}>
              Copy
            </button>
            {canShareNatively && (
              <button type="button" className={styles.secondary} onClick={shareLink}>
                Share…
              </button>
            )}
          </div>
          <p className={styles.note}>
            {isStale
              ? "You've changed the room since saving — this link still shows the earlier version."
              : "The link keeps your pieces, their positions, the room size (including its depth in 3D) and colours. Prices and stock are always up to date when it's opened. It doesn't include your name and expires after a year."}
          </p>
        </div>
      )}

      <p className={styles.status} role="status">
        {status}
      </p>
    </section>
  );
}
