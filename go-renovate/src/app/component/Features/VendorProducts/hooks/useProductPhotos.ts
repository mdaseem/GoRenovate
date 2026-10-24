"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhotoRules } from "@/app/types/vendorProducts";
import { attachPhoto, ProductsApiError, removePhoto, requestPhotoTicket } from "@/app/utils/vendorProductsApi";
import { PhotoError, shrinkPhoto, uploadToCloudinary } from "@/app/utils/productPhotoUpload";

// The photos on the product form. A photo goes through: prepare (shrink on the phone) -> upload (straight to
// Cloudinary) -> save (our server checks it and puts it on the product). On the "edit" form the product
// exists, so each photo is saved the moment it is uploaded. On the "add" form it does not exist yet, so
// uploaded photos wait ("ready" with a publicId) until `attachAll` is called with the new product's id.

export type PhotoStep = "preparing" | "uploading" | "saving" | "removing";

export interface PhotoItem {
  key: string;
  status: "working" | "ready" | "error";
  step: PhotoStep | null;
  // 0..1 while uploading
  progress: number;
  // What the tile shows: the address saved on the product, or a local preview of the chosen file.
  previewUrl: string;
  isLocalPreview: boolean;
  // The address saved on the product (set once saved).
  savedUrl?: string;
  // Uploaded to Cloudinary but not saved on a product yet (the add form).
  publicId?: string;
  error?: string;
  // Kept so "Try again" does not have to start from the beginning.
  file?: File;
  blob?: Blob;
}

interface Options {
  token: string;
  rules: PhotoRules;
  // Present on the edit form: photos are saved on this product as soon as they are uploaded.
  productId?: string;
  initialUrls: string[];
}

const GENERIC_ERROR = "We couldn't upload that photo. Check your connection and try again.";

function messageFor(err: unknown): string {
  if (err instanceof PhotoError || err instanceof ProductsApiError) return err.message;
  return GENERIC_ERROR;
}

let counter = 0;
const nextKey = () => `photo-${Date.now()}-${counter++}`;

export function useProductPhotos({ token, rules, productId, initialUrls }: Options) {
  const [items, setItems] = useState<PhotoItem[]>(() =>
    initialUrls.map((url) => ({
      key: nextKey(),
      status: "ready",
      step: null,
      progress: 1,
      previewUrl: url,
      isLocalPreview: false,
      savedUrl: url,
    })),
  );
  const [notice, setNotice] = useState<string | null>(null);

  const itemsRef = useRef(items);
  const controllers = useRef(new Map<string, AbortController>());
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef({ token, rules, productId });
  latest.current = { token, rules, productId };

  const commit = useCallback((next: PhotoItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patchItem = useCallback(
    (key: string, patch: Partial<PhotoItem>) => {
      if (!itemsRef.current.some((item) => item.key === key)) return; // removed in the meantime
      commit(itemsRef.current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
    },
    [commit],
  );

  // On leaving the page: stop uploads and free the local previews.
  useEffect(() => {
    const running = controllers.current;
    return () => {
      running.forEach((controller) => controller.abort());
      itemsRef.current.forEach((item) => {
        if (item.isLocalPreview) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const process = useCallback(
    async (key: string) => {
      const start = itemsRef.current.find((item) => item.key === key);
      if (!start) return;
      const controller = new AbortController();
      controllers.current.set(key, controller);
      try {
        let blob = start.blob;
        let publicId = start.publicId;
        if (!blob && !publicId) {
          patchItem(key, { status: "working", step: "preparing", error: undefined, progress: 0 });
          if (!start.file) throw new PhotoError("Please choose that photo again.");
          blob = await shrinkPhoto(start.file, latest.current.rules);
          patchItem(key, { blob });
        }
        if (!publicId) {
          patchItem(key, { status: "working", step: "uploading", progress: 0 });
          const ticket = await requestPhotoTicket(latest.current.token, controller.signal);
          await uploadToCloudinary(ticket, blob as Blob, (progress) => patchItem(key, { progress }), controller.signal);
          publicId = ticket.publicId;
          patchItem(key, { publicId });
        }
        const targetProduct = latest.current.productId;
        if (targetProduct) {
          patchItem(key, { status: "working", step: "saving" });
          const product = await attachPhoto(latest.current.token, targetProduct, publicId);
          const savedUrl = product.photos.find((url) => url.includes(publicId as string));
          patchItem(key, { status: "ready", step: null, savedUrl, publicId: undefined, blob: undefined, file: undefined, progress: 1 });
        } else {
          patchItem(key, { status: "ready", step: null, blob: undefined, file: undefined, progress: 1 });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Photo upload failed:", err);
        patchItem(key, { status: "error", step: null, error: messageFor(err) });
      } finally {
        controllers.current.delete(key);
      }
    },
    [patchItem],
  );

  const enqueue = useCallback(
    (key: string) => {
      // One photo at a time: several at once only slow each other down on mobile data.
      queue.current = queue.current.then(() => process(key));
    },
    [process],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const chosen = Array.from(files);
      if (chosen.length === 0) return;
      const room = latest.current.rules.maxPerProduct - itemsRef.current.length;
      const taken = chosen.slice(0, Math.max(0, room));
      setNotice(
        chosen.length > taken.length
          ? `A product can have up to ${latest.current.rules.maxPerProduct} photos, so ${chosen.length - taken.length} ${
              chosen.length - taken.length === 1 ? "was" : "were"
            } not added.`
          : null,
      );
      if (taken.length === 0) return;
      const added: PhotoItem[] = taken.map((file) => ({
        key: nextKey(),
        status: "working",
        step: "preparing",
        progress: 0,
        previewUrl: URL.createObjectURL(file),
        isLocalPreview: true,
        file,
      }));
      commit([...itemsRef.current, ...added]);
      added.forEach((item) => enqueue(item.key));
    },
    [commit, enqueue],
  );

  const retry = useCallback(
    (key: string) => {
      patchItem(key, { status: "working", step: "preparing", error: undefined, progress: 0 });
      enqueue(key);
    },
    [enqueue, patchItem],
  );

  const drop = useCallback(
    (key: string) => {
      const item = itemsRef.current.find((candidate) => candidate.key === key);
      if (item?.isLocalPreview) URL.revokeObjectURL(item.previewUrl);
      commit(itemsRef.current.filter((candidate) => candidate.key !== key));
    },
    [commit],
  );

  const remove = useCallback(
    async (key: string) => {
      const item = itemsRef.current.find((candidate) => candidate.key === key);
      if (!item) return;
      controllers.current.get(key)?.abort();
      if (item.savedUrl && latest.current.productId) {
        patchItem(key, { status: "working", step: "removing", error: undefined });
        try {
          await removePhoto(latest.current.token, latest.current.productId, item.savedUrl);
          drop(key);
          setNotice(null);
        } catch (err) {
          console.error("Failed to remove a photo:", err);
          patchItem(key, { status: "ready", step: null, error: err instanceof ProductsApiError ? err.message : "We couldn't remove that photo. Please try again." });
        }
        return;
      }
      drop(key);
      setNotice(null);
    },
    [drop, patchItem],
  );

  // The add form: save the uploaded photos on the product that was just created. Returns how many failed.
  const attachAll = useCallback(
    async (newProductId: string): Promise<{ failed: number }> => {
      let failed = 0;
      for (const item of itemsRef.current) {
        if (item.status !== "ready" || !item.publicId || item.savedUrl) continue;
        try {
          patchItem(item.key, { status: "working", step: "saving" });
          const product = await attachPhoto(latest.current.token, newProductId, item.publicId);
          const savedUrl = product.photos.find((url) => url.includes(item.publicId as string));
          patchItem(item.key, { status: "ready", step: null, savedUrl, publicId: undefined });
        } catch (err) {
          failed += 1;
          console.error("Failed to save a photo on the new product:", err);
          patchItem(item.key, { status: "error", step: null, error: messageFor(err) });
        }
      }
      return { failed };
    },
    [patchItem],
  );

  const busy = items.some((item) => item.status === "working");
  const hasProblem = items.some((item) => item.status === "error");
  const readyCount = items.filter((item) => item.status === "ready").length;

  return { items, notice, busy, hasProblem, readyCount, addFiles, retry, remove, attachAll };
}

export type ProductPhotos = ReturnType<typeof useProductPhotos>;
