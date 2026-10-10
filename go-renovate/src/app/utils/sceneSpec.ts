import {
  Category,
  CategoryDetail,
  SpaceFixture,
  SpaceKind,
  SpaceSpec,
  SpaceTemplate,
  SpaceZone,
} from "@/app/types/category";

// What the room preview renders. It comes from a Space (a selectable base
// layout, see the room-visual-preview skill) — or, for a category that has no
// spaces seeded yet, from the legacy single-scene settings so nothing regresses.
//
// EVERYTHING here is in real-world centimetres: the room's width and ceiling
// height, and each fixture's position and size. Products carry their own cm
// dimensions, so they are drawn to scale against the room.

// A door/window/frame/counter in centimetres: distance from the left wall,
// height of its bottom edge above the floor, and its size.
export interface SceneFixture {
  type: SpaceFixture["type"];
  xCm: number;
  bottomCm: number;
  widthCm: number;
  heightCm: number;
  color?: string;
}

export interface ResolvedSpec {
  wall: SpaceSpec["wall"];
  floor: SpaceSpec["floor"];
  baseboard?: string;
  // 0–1 from the top of the scene: where the wall meets the floor (derived).
  floorLine: number;
  fixtures: SceneFixture[];
  zones: SpaceZone[];
}

export interface ResolvedScene {
  slug: string;
  kind: SpaceKind;
  // Real-world width the scene's full width represents.
  sceneWidthCm: number;
  // Real-world height of the VISIBLE scene (wall + the floor strip). The scene
  // box's shape is width / height; the user editing the room changes it.
  heightCm: number;
  aspect: number;
  ceilingHeightCm: number;
  floorViewDepthCm: number;
  spec: ResolvedSpec;
}

// Colour overrides the user picked (see utils/surfaceSwatches) — applied on top
// of whichever space is shown.
export interface SceneOverrides {
  wall?: { color: string; shade: string };
  floor?: { color: string; lineColor: string };
}

// Range of room widths "Fit my room" accepts (cm).
export const MIN_ROOM_WIDTH_CM = 150;
export const MAX_ROOM_WIDTH_CM = 1200;
// Range of ceiling heights "Fit my room" accepts (cm).
export const MIN_CEILING_HEIGHT_CM = 200;
export const MAX_CEILING_HEIGHT_CM = 500;

const DEFAULT_CEILING_CM = 270;
const DEFAULT_FLOOR_VIEW_DEPTH_CM = 90;
const LEGACY_ASPECT = 1.6;
const DEFAULT_SCENE_WIDTH_CM = 450;
const DEFAULT_FLOOR_LINE = 0.6;
// A very narrow/tall (or wide/short) room is cropped to a sensible box rather
// than producing a sliver: tall rooms show the lower part (ceiling cut off).
const MIN_ASPECT = 0.75;
const MAX_ASPECT = 2.6;
const ALL_ZONES: SpaceZone[] = ["floor", "wall", "ceiling"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface LegacyPalette {
  wall: string;
  wallShade: string;
  floor: string;
  floorLine: string;
  baseboard: string;
  decor: "window" | "tiles" | "none";
}

// The palettes the preview used before spaces existed (keyed by
// Category.scene.backdrop). Only used as a fallback.
const LEGACY_PALETTES: Record<string, LegacyPalette> = {
  "living-room": {
    wall: "#efe7da",
    wallShade: "#e6dccb",
    floor: "#caa77c",
    floorLine: "#b8946a",
    baseboard: "#faf6ee",
    decor: "window",
  },
  bedroom: {
    wall: "#e4e9f0",
    wallShade: "#d8dfe9",
    floor: "#c2a37f",
    floorLine: "#ae8f6b",
    baseboard: "#f8f9fb",
    decor: "window",
  },
  kitchen: {
    wall: "#f4f0e6",
    wallShade: "#e9e3d4",
    floor: "#d6d1c6",
    floorLine: "#c3bdb0",
    baseboard: "#ffffff",
    decor: "tiles",
  },
  bathroom: {
    wall: "#e3f0f1",
    wallShade: "#d3e5e7",
    floor: "#cfd8dc",
    floorLine: "#bcc7cc",
    baseboard: "#ffffff",
    decor: "tiles",
  },
  default: {
    wall: "#eceff1",
    wallShade: "#e0e5e8",
    floor: "#cdbba0",
    floorLine: "#baa688",
    baseboard: "#f7f8f9",
    decor: "none",
  },
};

// A category with no spaces seeded: describe its old single scene as a
// (legacy-geometry) space so it goes through the same conversion.
function legacyTemplate(category: Category | undefined): SpaceTemplate {
  const config = category?.scene;
  const palette =
    LEGACY_PALETTES[config?.backdrop ?? category?.slug ?? "default"] ??
    LEGACY_PALETTES.default;
  const floorLine = config?.floorLine ?? DEFAULT_FLOOR_LINE;
  return {
    slug: "legacy",
    categorySlug: category?.slug ?? "",
    name: "Room",
    sortOrder: 0,
    kind: "room-elevation",
    aspect: LEGACY_ASPECT,
    sceneWidthCm: config?.sceneWidthCm ?? DEFAULT_SCENE_WIDTH_CM,
    spec: {
      wall: {
        color: palette.wall,
        shade: palette.wallShade,
        pattern: palette.decor === "tiles" ? "tiles" : "plain",
      },
      floor: { color: palette.floor, lineColor: palette.floorLine },
      baseboard: palette.baseboard,
      floorLine,
      fixtures:
        palette.decor === "window"
          ? [{ type: "window", x: 0.69, y: floorLine * 0.14, w: 0.23, h: floorLine * 0.56 }]
          : [],
      zones: ALL_ZONES,
    },
  };
}

// Normalise one fixture to centimetres. Spaces seeded before the true-scale
// model stored 0–1 fractions of the old fixed box (x,y,w,h); convert those using
// the old box's geometry so they still look the same.
function fixtureToCm(
  fixture: SpaceFixture,
  widthCm: number,
  legacyHeightCm: number,
  legacyCeilingCm: number,
): SceneFixture {
  if (fixture.xCm !== undefined && fixture.widthCm !== undefined) {
    return {
      type: fixture.type,
      xCm: fixture.xCm,
      bottomCm: fixture.bottomCm ?? 0,
      widthCm: fixture.widthCm,
      heightCm: fixture.heightCm ?? 100,
      color: fixture.color,
    };
  }
  const x = fixture.x ?? 0;
  const y = fixture.y ?? 0;
  const w = fixture.w ?? 0.1;
  const h = fixture.h ?? 0.1;
  return {
    type: fixture.type,
    xCm: x * widthCm,
    widthCm: w * widthCm,
    heightCm: h * legacyHeightCm,
    bottomCm: Math.max(0, legacyCeilingCm - (y + h) * legacyHeightCm),
    color: fixture.color,
  };
}

// Derive the scene's shape from real dimensions. The visible height is the
// ceiling plus a floor strip; if that would make the box too tall/short it is
// cropped (tall rooms lose the top of the ceiling, never the floor).
function buildScene(
  space: SpaceTemplate,
  widthCm: number,
  overrides?: SceneOverrides,
  ceilingOverrideCm?: number,
): ResolvedScene {
  const isLegacy = space.ceilingHeightCm === undefined;
  const legacyAspect = space.aspect || LEGACY_ASPECT;
  const legacyHeightCm = space.sceneWidthCm / legacyAspect;
  const legacyFloorLine = space.spec.floorLine ?? DEFAULT_FLOOR_LINE;
  const legacyCeilingCm = legacyFloorLine * legacyHeightCm;

  const ceilingHeightCm =
    ceilingOverrideCm ??
    (isLegacy ? legacyCeilingCm : (space.ceilingHeightCm ?? DEFAULT_CEILING_CM));
  const floorViewDepthCm = isLegacy
    ? legacyHeightCm - legacyCeilingCm
    : (space.floorViewDepthCm ?? DEFAULT_FLOOR_VIEW_DEPTH_CM);

  const aspect = clamp(widthCm / (ceilingHeightCm + floorViewDepthCm), MIN_ASPECT, MAX_ASPECT);
  const heightCm = widthCm / aspect;
  const floorLine = clamp((heightCm - floorViewDepthCm) / heightCm, 0.3, 0.85);

  const fixtures = space.spec.fixtures.map((fixture) =>
    fixtureToCm(fixture, space.sceneWidthCm, legacyHeightCm, legacyCeilingCm),
  );

  return {
    slug: space.slug,
    kind: space.kind,
    sceneWidthCm: widthCm,
    heightCm,
    aspect,
    ceilingHeightCm,
    floorViewDepthCm,
    spec: {
      wall: { ...space.spec.wall, ...overrides?.wall },
      floor: { ...space.spec.floor, ...overrides?.floor },
      baseboard: space.spec.baseboard,
      floorLine,
      fixtures,
      zones: space.spec.zones?.length ? space.spec.zones : ALL_ZONES,
    },
  };
}

// For thumbnails (space picker): a space at its own size, no user overrides.
export function resolveSpaceTemplate(space: SpaceTemplate): ResolvedScene {
  return buildScene(space, space.sceneWidthCm);
}

// Spaces the user can pick between. Only "room-elevation" is rendered today,
// so other kinds (shelf-grid, plan) are hidden until they're implemented.
export function getSelectableSpaces(
  detail: CategoryDetail | null | undefined,
): SpaceTemplate[] {
  return (detail?.spaces ?? []).filter((space) => space.kind === "room-elevation");
}

// The space a category opens with: the one flagged isDefault, else the first.
export function getDefaultSpace(
  spaces: SpaceTemplate[] | undefined,
): SpaceTemplate | undefined {
  if (!spaces || spaces.length === 0) return undefined;
  return spaces.find((space) => space.isDefault) ?? spaces[0];
}

// The scene to draw: the chosen space if there is one, else the category's
// default space, else (a category with no spaces seeded) the legacy scene.
// Only "room-elevation" is rendered today, so other kinds never get picked.
export interface ResolveSceneOptions {
  // "Fit my room": the user's real room width / ceiling height in cm override
  // the space's own (and, because the box's shape follows real dimensions,
  // change its shape).
  roomWidthCm?: number | null;
  ceilingHeightCm?: number | null;
  // Wall colour / floor material the user picked.
  overrides?: SceneOverrides;
}

export function resolveScene(
  detail: CategoryDetail | null | undefined,
  spaceSlug?: string | null,
  options: ResolveSceneOptions = {},
): ResolvedScene {
  const selectable = getSelectableSpaces(detail);
  const space =
    selectable.find((candidate) => candidate.slug === spaceSlug) ??
    getDefaultSpace(selectable) ??
    legacyTemplate(detail?.category);
  return buildScene(
    space,
    options.roomWidthCm || space.sceneWidthCm,
    options.overrides,
    options.ceilingHeightCm || undefined,
  );
}
