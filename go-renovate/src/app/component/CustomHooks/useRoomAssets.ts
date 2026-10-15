import { useEffect, useMemo, useRef, useState } from "react";
import { WorldPiece } from "@/app/utils/roomWorld";
import { LoadedModel, closeLoaded, loadModelFromUrl } from "@/app/utils/gl/modelLoader";

// The pictures and 3D models the 3D room needs for the pieces in it, fetched in
// the background while the room is already on screen (pieces start as plain
// blocks and "upgrade" as their files arrive). Nothing here blocks the room, and
// everything is released when the room closes.

// Budgets that keep the room smooth on a phone. A model beyond them is simply not
// loaded — its photo stands in instead — and the person is told.
export const MAX_ROOM_MODELS = 6;
export const MAX_ROOM_TRIANGLES = 150_000;
export const MAX_ROOM_TEXTURE_PIXELS = 16_000_000;
// Photos are drawn into a canvas at most this big (long side) before upload.
const CARD_MAX_SIDE = 512;

export interface RoomAssets {
  models: Map<string, LoadedModel>; // by product id
  cards: Map<string, HTMLCanvasElement>; // by cutout URL
}

export interface RoomAssetStatus {
  loading: number; // models still downloading
  failed: string[]; // names of models that could not be loaded
  skipped: string[]; // names left out to stay within the budgets
}

// One read of each photo for the whole session (the browser also caches the file).
const cardCache = new Map<string, Promise<HTMLCanvasElement | null>>();

function loadCard(url: string): Promise<HTMLCanvasElement | null> {
  const cached = cardCache.get(url);
  if (cached) return cached;
  const promise = new Promise<HTMLCanvasElement | null>((resolve) => {
    const image = new Image();
    // A vendor's photo from another site only works if that site allows it; if not,
    // the canvas would be unreadable and the piece keeps its block.
    image.crossOrigin = "anonymous";
    image.onload = () => {
      // An SVG without its own size reports 0: draw it square, as the flat room does.
      const natural = { w: image.naturalWidth || 1, h: image.naturalHeight || 1 };
      const scale = CARD_MAX_SIDE / Math.max(natural.w, natural.h);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(natural.w * scale));
      canvas.height = Math.max(1, Math.round(natural.h * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
  cardCache.set(url, promise);
  return promise;
}

const modelTriangles = (loaded: LoadedModel) => loaded.model.triangleCount;
const modelPixels = (loaded: LoadedModel) => loaded.bitmaps.reduce((sum, bitmap) => sum + bitmap.width * bitmap.height, 0);

export function useRoomAssets(pieces: WorldPiece[]): { assets: RoomAssets; status: RoomAssetStatus } {
  const [models, setModels] = useState<Map<string, LoadedModel>>(() => new Map());
  const [cards, setCards] = useState<Map<string, HTMLCanvasElement>>(() => new Map());
  const [failed, setFailed] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [loading, setLoading] = useState(0);

  // What the room needs: one entry per distinct product / photo, in a stable order.
  const needs = useMemo(() => {
    const modelNeeds = new Map<string, { url: string; name: string }>();
    const cardUrls = new Set<string>();
    for (const { item } of pieces) {
      if (item.model3d && !modelNeeds.has(item._id)) modelNeeds.set(item._id, { url: item.model3d.url, name: item.name });
      if (item.cutoutUrl) cardUrls.add(item.cutoutUrl);
    }
    return { modelNeeds, cardUrls: [...cardUrls] };
  }, [pieces]);
  const modelKey = [...needs.modelNeeds.entries()].map(([id, n]) => `${id}=${n.url}`).join("|");
  const cardKey = needs.cardUrls.join("|");

  // Everything started or finished, so a re-render never loads the same file twice.
  const requested = useRef(new Set<string>());
  const loadedRef = useRef(new Map<string, LoadedModel>());
  const aborts = useRef(new Set<AbortController>());
  // False once the room has closed: late results are dropped instead of stored.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const abortSet = aborts.current;
    const loaded = loadedRef.current;
    const asked = requested.current;
    return () => {
      // The room closed: stop downloads and give the pictures back.
      alive.current = false;
      abortSet.forEach((abort) => abort.abort());
      abortSet.clear();
      loaded.forEach((m) => closeLoaded(m));
      loaded.clear();
      asked.clear();
    };
  }, []);

  useEffect(() => {
    needs.cardUrls.forEach((url) => {
      if (requested.current.has("card:" + url)) return;
      requested.current.add("card:" + url);
      loadCard(url).then((canvas) => {
        if (!alive.current || !canvas) return;
        setCards((previous) => new Map(previous).set(url, canvas));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey]);

  useEffect(() => {
    needs.modelNeeds.forEach(({ url, name }, id) => {
      const mark = "model:" + id + ":" + url;
      if (requested.current.has(mark)) return;
      requested.current.add(mark);
      if (countModels(requested.current) > MAX_ROOM_MODELS) {
        setSkipped((previous) => [...previous, name]);
        return;
      }
      const abort = new AbortController();
      aborts.current.add(abort);
      setLoading((count) => count + 1);
      loadModelFromUrl(url, abort.signal)
        .then((loaded) => {
          if (!alive.current) {
            closeLoaded(loaded);
            return;
          }
          const total = [...loadedRef.current.values()];
          const triangles = total.reduce((sum, m) => sum + modelTriangles(m), 0) + modelTriangles(loaded);
          const pixels = total.reduce((sum, m) => sum + modelPixels(m), 0) + modelPixels(loaded);
          if (triangles > MAX_ROOM_TRIANGLES || pixels > MAX_ROOM_TEXTURE_PIXELS) {
            closeLoaded(loaded);
            setSkipped((previous) => [...previous, name]);
            return;
          }
          loadedRef.current.set(id, loaded);
          setModels((previous) => new Map(previous).set(id, loaded));
        })
        .catch((error: unknown) => {
          if (abort.signal.aborted) return;
          console.error("Could not load the 3D model for", name, error);
          setFailed((previous) => [...previous, name]);
        })
        .finally(() => {
          aborts.current.delete(abort);
          setLoading((count) => Math.max(0, count - 1));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelKey]);

  return { assets: { models, cards }, status: { loading, failed, skipped } };
}

function countModels(asked: Set<string>) {
  let count = 0;
  asked.forEach((mark) => {
    if (mark.startsWith("model:")) count += 1;
  });
  return count;
}
