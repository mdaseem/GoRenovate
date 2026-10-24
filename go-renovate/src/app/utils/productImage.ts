// How a product picture should be loaded by next/image.
//
// - A picture on this device (blob: / data:) and the SVG placeholder can't go through the optimizer.
// - A vendor photo on Cloudinary (https://res.cloudinary.com/<our cloud>/...) goes through it, so phones get
//   a small copy instead of the 1600 px original. next.config.ts allows that host.
// A picture that fails to load must be handled by the caller (onError -> placeholder).
export function productImageProps(url: string): { unoptimized: boolean } {
  const path = url.split(/[?#]/)[0].toLowerCase();
  const local = url.startsWith("blob:") || url.startsWith("data:");
  return { unoptimized: local || path.endsWith(".svg") };
}
