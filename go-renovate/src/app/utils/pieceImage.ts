import { Essential } from "@/app/types/category";

// The picture the rooms (2D scene, 3D rooms, thumbnails) draw for a product.
//
// - A CUTOUT (`cutoutUrl`) is the real thing: a transparent, tightly cropped front view that sits in a
//   room like an object.
// - Without one, the product's first PHOTO (`images[0]`, what a vendor uploads) stands in, so a piece the
//   user adds never turns into an empty tile just because nobody has made a cutout yet. A photo keeps
//   its own background, so it is drawn as a picture of the product (see `isPhotoStandIn`), not as an object.
// - With neither, null: the scene draws its labelled tile (2D) or a plain block (3D).
export function pieceImageUrl(item: Pick<Essential, "cutoutUrl" | "images">): string | null {
  if (item.cutoutUrl) return item.cutoutUrl;
  const photo = (item.images ?? []).find((url) => typeof url === "string" && url.length > 0);
  return photo ?? null;
}

// True when the room is showing a photo because the product has no cutout.
export function isPhotoStandIn(item: Pick<Essential, "cutoutUrl" | "images">): boolean {
  return !item.cutoutUrl && pieceImageUrl(item) !== null;
}
