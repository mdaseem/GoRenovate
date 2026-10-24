import { PhotoRules, PhotoTicket } from "@/app/types/vendorProducts";

// Getting a vendor's photo from their phone to Cloudinary. Two steps, both in the browser:
//  1. shrinkPhoto: a phone photo is 3-8 MB; buyers need about 1600 px. Shrinking makes the upload fast on
//     mobile data, and drawing it on a canvas also drops the hidden camera details (location, device).
//  2. uploadToCloudinary: sends it straight to Cloudinary with the signed ticket from our server (with
//     progress, which fetch cannot report). Our server never sees the file.

export class PhotoError extends Error {}

const MAX_SIDE = 1600;
// Refuse to even try on something that is clearly not a phone photo.
const MAX_INPUT_BYTES = 40 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const PHOTO_ACCEPT = ACCEPTED_TYPES.join(",");

function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    // "from-image" applies the phone's rotation, so a portrait photo is not drawn sideways.
    return createImageBitmap(file, { imageOrientation: "from-image" }).then((bitmap) => ({
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    }));
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function shrinkPhoto(file: File, rules: PhotoRules): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new PhotoError("Please choose a JPG, PNG or WebP photo.");
  if (file.size > MAX_INPUT_BYTES) throw new PhotoError("That file is too big to be a photo. Please choose another.");

  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new PhotoError("We couldn't read that photo. Please try another one.");
  }
  try {
    const { width, height } = decoded;
    if (Math.min(width, height) < rules.minSide) {
      throw new PhotoError(`That photo is too small. It should be at least ${rules.minSide} pixels on each side.`);
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new PhotoError("Your browser can't prepare photos. Please try another browser.");
    // JPEG has no transparency: put a transparent PNG on white, not black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

    let blob = await toBlob(canvas, 0.86);
    if (blob && blob.size > rules.maxBytes) blob = await toBlob(canvas, 0.7);
    if (!blob) throw new PhotoError("We couldn't prepare that photo. Please try another one.");
    if (blob.size > rules.maxBytes) throw new PhotoError("That photo is still too large after shrinking. Please try another one.");
    return blob;
  } finally {
    decoded.close();
  }
}

// Sends the prepared photo to Cloudinary. Resolves when it has arrived; rejects with a PhotoError that says
// what to do. `onProgress` gets 0..1.
export function uploadToCloudinary(
  ticket: PhotoTicket,
  blob: Blob,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(ticket.fields)) form.append(key, value);
    form.append("file", blob, "photo.jpg");

    const request = new XMLHttpRequest();
    request.open("POST", ticket.uploadUrl);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new PhotoError("The upload didn't go through. Please try again."));
      }
    };
    request.onerror = () => reject(new PhotoError("The upload stopped. Check your connection and try again."));
    request.ontimeout = () => reject(new PhotoError("The upload is taking too long. Check your connection and try again."));
    request.timeout = 120_000;
    const abort = () => {
      request.abort();
      reject(new DOMException("Upload cancelled", "AbortError"));
    };
    if (signal.aborted) return abort();
    signal.addEventListener("abort", abort, { once: true });
    request.send(form);
  });
}
