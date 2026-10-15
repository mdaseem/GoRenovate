// The 3D room ("dollhouse") as triangles. Pure maths, no browser: the same World
// the CSS look-around uses (utils/roomWorld.ts, centimetres) plus the resolved
// space (wall / floor colours, door, window …) become one list of coloured,
// lit-able triangles, ready to upload to the graphics card.
//
// Units here are METRES (centimetres ÷ 100) so near/far planes and light falloff
// are the same size for a bathroom and a hall.
//   x  from the left wall, →            (0 … width)
//   y  up from the floor, ↑             (0 … ceiling)
//   z  from the BACK wall toward you, ⤢ (0 … depth)
//
// Walls, floor and ceiling are single-sided planes facing INTO the room. With
// back-face culling that gives the dollhouse cut-away for free: a wall seen from
// outside is simply not drawn, so you always see in past the near walls.
import { SceneFixture, ResolvedScene, bookcaseLayout } from "../sceneSpec";
import { World, WorldPiece } from "../roomWorld";
import { PiecePlan, drawsBlock, planPieces } from "./roomPieces";

// Vertex = position(3) normal(3) colour(3, LINEAR light) surface(1).
export const FLOATS_PER_VERTEX = 10;

// How the shader treats a surface (the `surface` attribute).
export const SURFACE = {
  plain: 0,
  floor: 1, // plank lines
  tiles: 2, // wall tile grid
  emissive: 3, // window glass and the selection outline: bright, not shaded
  block: 4, // a product stand-in: no corner darkening
} as const;

export interface Shadow {
  x: number; // metres, centre on the floor
  z: number;
  radiusX: number;
  radiusZ: number;
  strength: number;
}

// A spot on the floor that stands in the way of walking (metres).
export interface FloorObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface RoomMesh {
  vertices: Float32Array;
  indices: Uint32Array;
  shadows: Shadow[];
  // Fixtures that stand on the floor (a counter, a bookcase): walls of furniture to walk around.
  obstacles: FloorObstacle[];
  // Room size in metres, for the camera and the shader's corner darkening.
  width: number;
  height: number;
  depth: number;
  // sRGB hex colours the shader uses for the floor's plank lines.
  floorLine: [number, number, number];
}

type V3 = readonly [number, number, number];

const M = (cm: number) => cm / 100;

// "#rrggbb" / "#rgb" → LINEAR light (the lighting maths is only right in linear
// light; the fragment shader converts back to sRGB at the end).
export function hexToLinear(hex: string): [number, number, number] {
  const clean = hex.trim().replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  const channel = (v: number) => Math.pow(v / 255, 2.2);
  return Number.isFinite(n)
    ? [channel((n >> 16) & 255), channel((n >> 8) & 255), channel(n & 255)]
    : [0.5, 0.5, 0.5];
}

const mix = (a: V3, b: V3, t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const scale = (a: V3, k: number): [number, number, number] => [a[0] * k, a[1] * k, a[2] * k];

// A stand-in colour per product kind until it has a real model (R2). Muted and
// natural, so the blocks read as "something goes here", not as the product.
const SLOT_COLOURS: Record<string, string> = {
  sofa: "#8d7f72",
  bed: "#b5a48f",
  "coffee-table": "#a07c56",
  "dining-table": "#a07c56",
  chairs: "#8a7156",
  rug: "#b7a78f",
  wardrobe: "#7b6a59",
  "bedside-table": "#8a735a",
  storage: "#85735f",
  vanity: "#8d8174",
  lighting: "#d9c98e",
  decor: "#7e946f",
  accessories: "#9a8f80",
  "wall-decor": "#6b7f8c",
  mirror: "#9fb2bd",
  countertop: "#a49a8d",
};
const DEFAULT_BLOCK = "#a39a8f";

class MeshBuilder {
  private vertices: number[] = [];
  private indices: number[] = [];

  // One flat rectangle (or any planar quad). Corners in any order; they are
  // reordered so the triangle faces the same way as `normal` (the side that is drawn).
  quad(a: V3, b: V3, c: V3, d: V3, normal: V3, colour: V3, surface: number) {
    const e1: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const e2: V3 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const cross: V3 = [
      e1[1] * e2[2] - e1[2] * e2[1],
      e1[2] * e2[0] - e1[0] * e2[2],
      e1[0] * e2[1] - e1[1] * e2[0],
    ];
    const facing = cross[0] * normal[0] + cross[1] * normal[1] + cross[2] * normal[2] >= 0;
    const corners = facing ? [a, b, c, d] : [a, d, c, b];
    const base = this.vertices.length / FLOATS_PER_VERTEX;
    for (const p of corners) this.vertices.push(p[0], p[1], p[2], normal[0], normal[1], normal[2], colour[0], colour[1], colour[2], surface);
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // An axis-aligned box with a colour for the top and one for the sides. `skip`
  // leaves faces out (e.g. the underside nobody sees).
  box(min: V3, max: V3, side: V3, top: V3, surface: number, skip: Partial<Record<"top" | "bottom" | "front" | "back" | "left" | "right", boolean>> = {}) {
    const [x0, y0, z0] = min;
    const [x1, y1, z1] = max;
    if (!skip.top) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], top, surface);
    if (!skip.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], scale(side, 0.6), surface);
    if (!skip.front) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], side, surface);
    if (!skip.back) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], scale(side, 0.85), surface);
    if (!skip.left) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], scale(side, 0.9), surface);
    if (!skip.right) this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], scale(side, 0.9), surface);
  }

  build() {
    return { vertices: new Float32Array(this.vertices), indices: new Uint32Array(this.indices) };
  }
}

// Door, window, frame, counter, bookcase: drawn on the BACK wall, a hair in front
// of it (the flat editor is a front elevation, so fixtures live on the back wall).
function addFixture(b: MeshBuilder, fixture: SceneFixture, obstacles: FloorObstacle[]) {
  const x0 = M(fixture.xCm);
  const x1 = M(fixture.xCm + fixture.widthCm);
  const y0 = M(fixture.bottomCm);
  const y1 = M(fixture.bottomCm + fixture.heightCm);
  const lift = 0.004; // 4 mm: no flicker where it meets the wall
  const frame = Math.min(0.05, (x1 - x0) / 6, (y1 - y0) / 6);
  const front: V3 = [0, 0, 1];
  const flat = (xa: number, ya: number, xb: number, yb: number, z: number, colour: V3, surface: number = SURFACE.plain) =>
    b.quad([xa, ya, z], [xb, ya, z], [xb, yb, z], [xa, yb, z], front, colour, surface);

  switch (fixture.type) {
    case "window": {
      const white = hexToLinear("#f4f1ea");
      flat(x0, y0, x1, y1, lift, white);
      flat(x0 + frame, y0 + frame, x1 - frame, y1 - frame, lift * 2, hexToLinear("#cfe8f6"), SURFACE.emissive);
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      flat(mx - frame / 2, y0 + frame, mx + frame / 2, y1 - frame, lift * 3, white);
      flat(x0 + frame, my - frame / 2, x1 - frame, my + frame / 2, lift * 3, white);
      // sill
      b.box([x0 - 0.02, y0 - 0.025, 0], [x1 + 0.02, y0, 0.07], white, white, SURFACE.plain, { back: true });
      break;
    }
    case "door": {
      const wood = hexToLinear(fixture.color ?? "#d9cdb8");
      flat(x0, y0, x1, y1, lift, wood);
      const inset = (x1 - x0) * 0.14;
      const panel = scale(wood, 0.88);
      flat(x0 + inset, y0 + (y1 - y0) * 0.07, x1 - inset, y0 + (y1 - y0) * 0.45, lift * 2, panel);
      flat(x0 + inset, y0 + (y1 - y0) * 0.52, x1 - inset, y0 + (y1 - y0) * 0.92, lift * 2, panel);
      b.box([x1 - inset * 1.1, y0 + (y1 - y0) * 0.48, lift * 2], [x1 - inset * 0.5, y0 + (y1 - y0) * 0.52, 0.05], hexToLinear("#8a7a62"), hexToLinear("#8a7a62"), SURFACE.plain);
      break;
    }
    case "artframe": {
      const border = Math.min(0.03, (x1 - x0) / 8);
      flat(x0, y0, x1, y1, lift, hexToLinear("#5b4a3a"));
      flat(x0 + border, y0 + border, x1 - border, y1 - border, lift * 2, hexToLinear(fixture.color ?? "#cdbf9f"));
      break;
    }
    case "counter": {
      const wood = hexToLinear(fixture.color ?? "#b69a76");
      const topColour = hexToLinear("#d8d1c3");
      const top = Math.min(0.04, (y1 - y0) * 0.18);
      b.box([x0, y0, 0], [x1, y1 - top, 0.6], wood, wood, SURFACE.block, { back: true });
      if (y0 < 0.3) obstacles.push({ minX: x0, maxX: x1, minZ: 0, maxZ: 0.6 });
      b.box([x0 - 0.02, y1 - top, 0], [x1 + 0.02, y1, 0.63], topColour, topColour, SURFACE.block, { back: true });
      break;
    }
    case "bookcase": {
      const layout = bookcaseLayout(fixture);
      const wood = hexToLinear(fixture.color ?? "#b58a56");
      const dark = scale(wood, 0.6);
      b.box([x0, y0, 0], [x1, y1, 0.3], wood, wood, SURFACE.block, { back: true });
      if (y0 < 0.3) obstacles.push({ minX: x0, maxX: x1, minZ: 0, maxZ: 0.3 });
      // shelf boards stand slightly proud of the front so the shelves read
      for (const bottom of layout.boardBottomsCm) {
        b.box([x0 + M(layout.frameCm), M(bottom), 0.28], [x1 - M(layout.frameCm), M(bottom + layout.boardCm), 0.31], dark, dark, SURFACE.block);
      }
      break;
    }
    default:
      break;
  }
}

// A plain block for a piece (also the body behind a photo on solid furniture).
function blockFor(b: MeshBuilder, piece: WorldPiece, plan: PiecePlan) {
  const { x, z, w, h, d } = plan;
  const y0 = plan.yBottom;
  const base = hexToLinear(SLOT_COLOURS[piece.item.slot] ?? DEFAULT_BLOCK);
  const top = mix(base, [1, 1, 1], 0.18);
  if (piece.kind === "rug") {
    b.box([x - w / 2, 0.002, z - d / 2], [x + w / 2, 0.002 + Math.max(0.012, h), z + d / 2], base, top, SURFACE.block, { bottom: true });
    return;
  }
  b.box([x - w / 2, y0, z - d / 2], [x + w / 2, y0 + h, z + d / 2], base, top, SURFACE.block, { bottom: piece.kind !== "ceiling" });
}

export interface RoomMeshInput {
  world: World;
  scene: ResolvedScene;
  // How each piece is drawn right now (see roomPieces.ts); without it every piece
  // is a plain block.
  plan?: PiecePlan[];
  // The piece the person has selected: it gets a glowing outline on the floor.
  selectedKey?: string | null;
}

export function buildRoomMesh({ world, scene, plan, selectedKey }: RoomMeshInput): RoomMesh {
  const W = M(world.widthCm);
  const H = M(world.heightCm);
  const D = M(world.depthCm);
  const { spec } = scene;
  const b = new MeshBuilder();
  const shadows: Shadow[] = [];

  const wall = hexToLinear(spec.wall.color);
  const wallSide = hexToLinear(spec.wall.shade ?? spec.wall.color);
  const wallSurface = spec.wall.pattern === "tiles" ? SURFACE.tiles : SURFACE.plain;
  const floor = hexToLinear(spec.floor.color);
  const ceiling = mix(wall, [1, 1, 1], 0.55);

  // floor and ceiling
  b.quad([0, 0, 0], [W, 0, 0], [W, 0, D], [0, 0, D], [0, 1, 0], floor, SURFACE.floor);
  b.quad([0, H, 0], [W, H, 0], [W, H, D], [0, H, D], [0, -1, 0], ceiling, SURFACE.plain);
  // four walls, facing in
  b.quad([0, 0, 0], [W, 0, 0], [W, H, 0], [0, H, 0], [0, 0, 1], wall, wallSurface); // back
  b.quad([0, 0, 0], [0, 0, D], [0, H, D], [0, H, 0], [1, 0, 0], wallSide, wallSurface); // left
  b.quad([W, 0, 0], [W, 0, D], [W, H, D], [W, H, 0], [-1, 0, 0], wallSide, wallSurface); // right
  b.quad([0, 0, D], [W, 0, D], [W, H, D], [0, H, D], [0, 0, -1], wallSide, wallSurface); // front

  // baseboard along every wall
  const board = hexToLinear(spec.baseboard ?? "#f1ede4");
  const bh = 0.09;
  const bt = 0.012;
  b.box([0, 0, 0], [W, bh, bt], board, board, SURFACE.plain, { back: true, bottom: true });
  b.box([0, 0, bt], [bt, bh, D - bt], board, board, SURFACE.plain, { left: true, bottom: true });
  b.box([W - bt, 0, bt], [W, bh, D - bt], board, board, SURFACE.plain, { right: true, bottom: true });
  b.box([0, 0, D - bt], [W, bh, D], board, board, SURFACE.plain, { front: true, bottom: true });

  // the floor slab: a base to stand the room on, so it reads as a model not a void
  const slab = hexToLinear("#cfc7b8");
  const lip = 0.06;
  b.box([-lip, -0.07, -lip], [W + lip, -0.002, D + lip], slab, slab, SURFACE.plain, { top: true });

  const obstacles: FloorObstacle[] = [];
  for (const fixture of spec.fixtures) addFixture(b, fixture, obstacles);
  const plans = plan ?? planPieces(world, { models: new Map(), cards: new Map() });
  const pieceByKey = new Map(world.pieces.map((piece) => [piece.key, piece] as const));
  for (const entry of plans) {
    const piece = pieceByKey.get(entry.key);
    if (!piece) continue;
    if (drawsBlock(entry)) blockFor(b, piece, entry);
    if (entry.shadow) {
      shadows.push({ x: entry.x, z: entry.z, radiusX: entry.w * 0.62, radiusZ: entry.d * 0.62 + 0.04, strength: 0.4 });
    }
  }

  // the selected piece: a thin green frame around it — on the floor around a standing
  // piece's footprint, on the wall around a hung one's face, on the ceiling around a hanging one's
  const selected = selectedKey ? plans.find((entry) => entry.key === selectedKey) : undefined;
  if (selected && selected.kind === "hung") {
    const glow = hexToLinear("#2fd14a");
    const t = 0.04; // frame width, metres
    const z0 = selected.z + selected.d / 2 + 0.004;
    const z1 = z0 + 0.008;
    const x0 = selected.x - selected.w / 2 - t;
    const x1 = selected.x + selected.w / 2 + t;
    const y0 = selected.yBottom - t;
    const y1 = selected.yBottom + selected.h + t;
    const frame = (a: V3, c: V3) => b.box(a, c, glow, glow, SURFACE.emissive, { back: true });
    frame([x0, y0, z0], [x1, y0 + t, z1]); // bottom
    frame([x0, y1 - t, z0], [x1, y1, z1]); // top
    frame([x0, y0 + t, z0], [x0 + t, y1 - t, z1]); // left
    frame([x1 - t, y0 + t, z0], [x1, y1 - t, z1]); // right
  } else if (selected && selected.kind === "ceiling") {
    const glow = hexToLinear("#2fd14a");
    const t = 0.04;
    const y1 = H - 0.004;
    const y0 = y1 - 0.008;
    const x0 = selected.x - selected.w / 2 - t;
    const x1 = selected.x + selected.w / 2 + t;
    const z0 = selected.z - selected.d / 2 - t;
    const z1 = selected.z + selected.d / 2 + t;
    // every face: seen from above in the dollhouse, from below when standing inside
    const frame = (a: V3, c: V3) => b.box(a, c, glow, glow, SURFACE.emissive);
    frame([x0, y0, z0], [x1, y1, z0 + t]); // back
    frame([x0, y0, z1 - t], [x1, y1, z1]); // front
    frame([x0, y0, z0 + t], [x0 + t, y1, z1 - t]); // left
    frame([x1 - t, y0, z0 + t], [x1, y1, z1 - t]); // right
  } else if (selected) {
    const glow = hexToLinear("#2fd14a");
    const t = 0.04; // frame width, metres (a thin line vanishes on a phone)
    const y0 = 0.004;
    const y1 = 0.012;
    const x0 = selected.x - selected.w / 2 - t;
    const x1 = selected.x + selected.w / 2 + t;
    const z0 = selected.z - selected.d / 2 - t;
    const z1 = selected.z + selected.d / 2 + t;
    const frame = (a: V3, c: V3) => b.box(a, c, glow, glow, SURFACE.emissive, { bottom: true });
    frame([x0, y0, z0], [x1, y1, z0 + t]); // back
    frame([x0, y0, z1 - t], [x1, y1, z1]); // front
    frame([x0, y0, z0 + t], [x0 + t, y1, z1 - t]); // left
    frame([x1 - t, y0, z0 + t], [x1, y1, z1 - t]); // right
  }

  const { vertices, indices } = b.build();
  return {
    vertices,
    indices,
    shadows,
    obstacles,
    width: W,
    height: H,
    depth: D,
    floorLine: hexToLinear(spec.floor.lineColor ?? "#000000"),
  };
}
