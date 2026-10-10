import { SceneOverrides } from "@/app/utils/sceneSpec";

// Wall colours and floor materials the user can try in the Customize preview.
// These are presentation constants for now; the longer-term idea is to source
// them from the painting / flooring vendors' real catalogues so a swatch can
// map to something bookable (see the room-visual-preview skill).

export interface WallSwatch {
  id: string;
  name: string;
  color: string;
}

export interface FloorSwatch {
  id: string;
  name: string;
  color: string;
  lineColor: string;
}

export const WALL_SWATCHES: WallSwatch[] = [
  { id: "warm-white", name: "Warm white", color: "#f3ede2" },
  { id: "sage", name: "Sage", color: "#cfd9c6" },
  { id: "dusty-blue", name: "Dusty blue", color: "#cbd8e6" },
  { id: "blush", name: "Blush", color: "#efd6d2" },
  { id: "butter", name: "Butter", color: "#f3e6b8" },
  { id: "greige", name: "Greige", color: "#ddd6cb" },
  { id: "terracotta", name: "Terracotta", color: "#d9a58c" },
  { id: "deep-teal", name: "Deep teal", color: "#6f9a9b" },
];

export const FLOOR_SWATCHES: FloorSwatch[] = [
  { id: "oak", name: "Oak", color: "#caa77c", lineColor: "#b8946a" },
  { id: "walnut", name: "Walnut", color: "#8b6a4a", lineColor: "#765a3d" },
  { id: "pale-ash", name: "Pale ash", color: "#e0cfb2", lineColor: "#cdbb9c" },
  { id: "grey-stone", name: "Grey stone", color: "#bfc3c6", lineColor: "#aab0b4" },
  { id: "terracotta-tile", name: "Terracotta tile", color: "#c98a6a", lineColor: "#b5775a" },
  { id: "charcoal", name: "Charcoal", color: "#5d6063", lineColor: "#4e5154" },
];

// Slightly darker variant of a #rrggbb colour (used for the wall's top shading).
function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) =>
    Math.max(0, Math.round(((n >> shift) & 255) * (1 - amount)));
  return (
    "#" +
    [16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")
  );
}

// Turns the chosen swatch ids into scene overrides (null/unknown = keep the
// space's own colours).
export function sceneOverridesFor(
  wallId: string | null,
  floorId: string | null,
): SceneOverrides | undefined {
  const wall = WALL_SWATCHES.find((swatch) => swatch.id === wallId);
  const floor = FLOOR_SWATCHES.find((swatch) => swatch.id === floorId);
  if (!wall && !floor) return undefined;
  return {
    wall: wall ? { color: wall.color, shade: darken(wall.color, 0.05) } : undefined,
    floor: floor ? { color: floor.color, lineColor: floor.lineColor } : undefined,
  };
}
