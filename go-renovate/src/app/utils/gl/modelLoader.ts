// Fetching a .glb from a URL and turning it into something the graphics card can
// take: the bytes (size-checked before and after download), the parsed model and
// its decoded pictures. Used by the product viewer and the 3D room.
import { MAX_FILE_BYTES, ModelError, ParsedModel, parseGlb } from "./glb";
import { decodeImages } from "./modelScene";

export interface LoadedModel {
  model: ParsedModel;
  bitmaps: ImageBitmap[];
  fileBytes: number;
}

// Download only. Throws a ModelError with a plain-language message; an abort
// rethrows the browser's own AbortError so callers can tell it from a failure.
export async function fetchGlb(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ModelError("invalid", "The model couldn't be downloaded. Check your connection and try again.");
  }
  if (!response.ok) throw new ModelError("invalid", "The model couldn't be found. Please try again later.");
  const declared = Number(response.headers.get("content-length"));
  if (declared > MAX_FILE_BYTES) {
    throw new ModelError("too-large", "This model is bigger than 12 MB, so it isn't shown.");
  }
  return response.arrayBuffer();
}

// Download + parse + decode pictures. On any failure nothing is left open.
export async function loadModelFromUrl(url: string, signal?: AbortSignal): Promise<LoadedModel> {
  const buffer = await fetchGlb(url, signal);
  const model = parseGlb(buffer);
  const bitmaps = await decodeImages(model);
  if (signal?.aborted) {
    bitmaps.forEach((bitmap) => bitmap.close());
    throw new DOMException("Aborted", "AbortError");
  }
  return { model, bitmaps, fileBytes: buffer.byteLength };
}

export const closeLoaded = (loaded: LoadedModel | null | undefined) =>
  loaded?.bitmaps.forEach((bitmap) => bitmap.close());
