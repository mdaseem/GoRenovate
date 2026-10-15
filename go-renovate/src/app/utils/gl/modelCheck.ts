// Checks a 3D model against what we know about the product and against our own
// budgets. Pure functions, no browser needed, so they can be tested in plain node
// and reused by a future vendor upload form. The server applies the same size
// thresholds (services/dimensionRules.ts) — keep the two in step.
import { MAX_FILE_BYTES, MAX_TEXTURE_SIZE, RECOMMENDED_TRIANGLES } from "./glb";

export interface SizeCm {
  w: number;
  h: number;
  d: number;
}

// Up to 5% apart is measurement noise; beyond 25% the model is clearly a different object.
export const CLOSE_TOLERANCE = 0.05;
export const MISMATCH_TOLERANCE = 0.25;

export type FitStatus = "match" | "close" | "mismatch" | "unknown";

export interface AxisFit {
  axis: "w" | "h" | "d";
  label: string;
  model: number;
  listed: number;
  // |model − listed| ÷ listed
  difference: number;
}

export interface FitResult {
  status: FitStatus;
  axes: AxisFit[];
  // The model's sizes match the listing with width and depth swapped: probably turned 90°.
  looksRotated: boolean;
}

const AXES = [
  ["w", "width"],
  ["h", "height"],
  ["d", "depth"],
] as const;

const isSize = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

// Compares each axis that the listing actually gives (depth is often missing).
export function compareToListing(model: SizeCm, listed?: Partial<SizeCm> | null): FitResult {
  const axes: AxisFit[] = [];
  for (const [axis, label] of AXES) {
    const wanted = listed?.[axis];
    if (!isSize(wanted)) continue;
    axes.push({ axis, label, model: model[axis], listed: wanted, difference: Math.abs(model[axis] - wanted) / wanted });
  }
  if (axes.length === 0) return { status: "unknown", axes, looksRotated: false };

  const worst = Math.max(...axes.map((axis) => axis.difference));
  const status: FitStatus = worst <= CLOSE_TOLERANCE ? "match" : worst <= MISMATCH_TOLERANCE ? "close" : "mismatch";

  // Width and depth swapped makes it fit? A model exported facing sideways.
  let looksRotated = false;
  if (status !== "match" && isSize(listed?.w) && isSize(listed?.d)) {
    const swapped = Math.max(
      Math.abs(model.d - listed.w) / listed.w,
      Math.abs(model.w - listed.d) / listed.d,
      isSize(listed.h) ? Math.abs(model.h - listed.h) / listed.h : 0,
    );
    looksRotated = swapped <= CLOSE_TOLERANCE && swapped < worst;
  }
  return { status, axes, looksRotated };
}

const fmt = (value: number) => String(Math.round(value * 10) / 10);

export function describeFit(result: FitResult): string {
  if (result.status === "unknown") return "This product has no listed size to compare with.";
  if (result.status === "match") return "The model's size matches the listed size.";
  const off = result.axes
    .filter((axis) => axis.difference > CLOSE_TOLERANCE)
    .map((axis) => `${axis.label} ${fmt(axis.model)} cm vs ${fmt(axis.listed)} cm listed`)
    .join(", ");
  const rotated = result.looksRotated ? " It looks turned 90° — try exporting it facing front." : "";
  return result.status === "close"
    ? `The model is a little off the listed size (${off}).${rotated}`
    : `The model does not match the listed size (${off}).${rotated}`;
}

// ── file report (for the lab and, later, the vendor upload form) ─────────────
export interface ModelFacts {
  fileBytes: number;
  triangles: number;
  sizeCm: SizeCm;
  // Pixel size of each embedded picture.
  textures: { width: number; height: number }[];
}

export type CheckStatus = "pass" | "warn" | "fail";
export interface CheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

const MB = 1024 * 1024;
// Files bigger than this are slow on a phone connection even though they load.
const RECOMMENDED_FILE_BYTES = 3 * MB;
const RECOMMENDED_TEXTURE_SIZE = 1024;

export function buildReport(facts: ModelFacts, listed?: Partial<SizeCm> | null): CheckItem[] {
  const items: CheckItem[] = [];

  items.push(
    facts.fileBytes > MAX_FILE_BYTES
      ? { id: "file", label: "File size", status: "fail", detail: `${fmt(facts.fileBytes / MB)} MB is over the ${MAX_FILE_BYTES / MB} MB limit` }
      : facts.fileBytes > RECOMMENDED_FILE_BYTES
        ? { id: "file", label: "File size", status: "warn", detail: `${fmt(facts.fileBytes / MB)} MB — slow on mobile data; aim for under ${RECOMMENDED_FILE_BYTES / MB} MB` }
        : { id: "file", label: "File size", status: "pass", detail: `${fmt(facts.fileBytes / 1024)} KB` },
  );

  items.push(
    facts.triangles > RECOMMENDED_TRIANGLES
      ? { id: "triangles", label: "Detail", status: "warn", detail: `${facts.triangles.toLocaleString()} triangles — heavy for phones; aim for under ${RECOMMENDED_TRIANGLES.toLocaleString()}` }
      : { id: "triangles", label: "Detail", status: "pass", detail: `${facts.triangles.toLocaleString()} triangles` },
  );

  const biggest = facts.textures.reduce((max, t) => Math.max(max, t.width, t.height), 0);
  items.push(
    biggest > MAX_TEXTURE_SIZE
      ? { id: "textures", label: "Pictures", status: "fail", detail: `${biggest}px is over the ${MAX_TEXTURE_SIZE}px limit` }
      : biggest > RECOMMENDED_TEXTURE_SIZE
        ? { id: "textures", label: "Pictures", status: "warn", detail: `${facts.textures.length} picture(s), largest ${biggest}px — 1024px is enough for most products` }
        : { id: "textures", label: "Pictures", status: "pass", detail: facts.textures.length === 0 ? "none (plain colours)" : `${facts.textures.length} picture(s), largest ${biggest}px` },
  );

  const fit = compareToListing(facts.sizeCm, listed);
  items.push(
    fit.status === "unknown"
      ? { id: "size", label: "Real-world size", status: "warn", detail: `Measures ${fmt(facts.sizeCm.w)} × ${fmt(facts.sizeCm.d)} × ${fmt(facts.sizeCm.h)} cm (w × d × h). ${describeFit(fit)}` }
      : { id: "size", label: "Real-world size", status: fit.status === "match" ? "pass" : fit.status === "close" ? "warn" : "fail", detail: describeFit(fit) },
  );
  return items;
}
