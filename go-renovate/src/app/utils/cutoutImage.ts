// How a product cutout should be loaded by next/image.
//
// - SVG: Next can't resize or re-encode it (and serving SVG through the
//   optimizer is off for safety), so it is loaded as-is. Today's placeholder
//   art is SVG.
// - Raster served from this site (a path like "/essentials/x.png"): goes
//   through the optimizer — resized to what the screen needs and sent as
//   WebP/AVIF.
// - Raster on another host (a vendor CDN): loaded as-is. next/image throws for
//   a host that isn't in next.config's `images.remotePatterns`, which would
//   break the whole scene. Vendor photos on Cloudinary ARE in remotePatterns
//   (next.config.ts), so they get the same resizing as a local path.
export function cutoutImageProps(url: string): { unoptimized: boolean } {
  const path = url.split(/[?#]/)[0].toLowerCase();
  const isSvg = path.endsWith(".svg");
  const isLocal = url.startsWith("/") && !url.startsWith("//");
  const isOurPhotoHost = url.startsWith("https://res.cloudinary.com/");
  return { unoptimized: isSvg || !(isLocal || isOurPhotoHost) };
}

// `sizes` for a piece drawn at `widthPct` % of the scene. Pieces are small
// slices of the scene, so the browser should not be told they are viewport
// wide. The full scene is at most ~640px; thumbnails (Browse All cards) are
// ~170px.
export function cutoutSizes(widthPct: number, compact: boolean): string {
  const scenePx = compact ? 170 : 640;
  return `${Math.max(32, Math.ceil((widthPct / 100) * scenePx))}px`;
}
