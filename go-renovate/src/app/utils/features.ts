// The one switch for the renovation-SERVICES marketplace, mirrored on the server (SERVICES_ENABLED).
// Off by default: the site is a product shop (vendors sell products, rooms bundle products). Setting
// NEXT_PUBLIC_SERVICES_ENABLED=true brings the service pages, copy and links back - nothing is deleted.
// Keep it equal to the server's value. Components that can tell from the DATA they receive whether an
// item is a product or a service (`isProduct` in types/vendor.ts) should do that instead of reading this.
export const SERVICES_ENABLED = process.env.NEXT_PUBLIC_SERVICES_ENABLED === "true";
