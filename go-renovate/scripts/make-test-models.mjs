// Generates the small 3D test models in public/models/test/ — written by us, from
// scratch, so they have no outside author, licence or provenance question:
//
//   node scripts/make-test-models.mjs
//
// Output: test-table.glb  (5 boxes as nodes sharing one mesh; metres, origin at the
//                          bottom centre, +Y up — the conventions the viewer expects)
//         test-crate.glb  (one box with UVs and an embedded 64×64 PNG texture)
//
// A .glb is: a 12-byte header, then a JSON chunk (the scene description) and a
// binary chunk (all the numbers: vertices, indices, images). This script writes
// exactly that, by hand, with no libraries (zlib is built into Node).
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync, crc32 } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "models", "test");
mkdirSync(OUT, { recursive: true });

// ── a box: 24 corners (4 per face so each face has its own flat normal) ────────
function boxGeometry(w, h, d, { bottomAtZero = false } = {}) {
  const hx = w / 2;
  const hy = h / 2;
  const hz = d / 2;
  const oy = bottomAtZero ? hy : 0;
  // face: normal, and its two edge directions (u across, v up), corners counter-clockwise from outside
  const faces = [
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  ];
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  faces.forEach((face, faceIndex) => {
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      positions.push(
        (face.n[0] + su * face.u[0] + sv * face.v[0]) * hx,
        (face.n[1] + su * face.u[1] + sv * face.v[1]) * hy + oy,
        (face.n[2] + su * face.u[2] + sv * face.v[2]) * hz,
      );
      normals.push(...face.n);
      // glTF's texture origin is the TOP-left: v runs downward
      uvs.push((su + 1) / 2, 1 - (sv + 1) / 2);
    }
    const base = faceIndex * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return { positions, normals, uvs, indices };
}

// ── a tiny PNG encoder (RGBA, 8-bit) ─────────────────────────────────────────
function png(width, height, rgba) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const out = Buffer.alloc(8 + data.length + 4);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc32(body) >>> 0, 8 + data.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  // each row is preceded by a filter byte (0 = none)
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Wooden planks with a darker frame, so a turned crate shows which way is which.
function plankTexture(size = 64) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const plank = Math.floor(y / 16);
      const grain = Math.sin((x + plank * 23) * 0.35) * 8 + Math.sin(y * 1.7 + plank) * 4;
      let r = 176 + (plank % 2) * 10 + grain;
      let g = 120 + (plank % 2) * 8 + grain * 0.8;
      let b = 70 + grain * 0.6;
      if (y % 16 === 0) { r *= 0.55; g *= 0.55; b *= 0.55; } // gap between planks
      if (x < 4 || x >= size - 4 || y < 4 || y >= size - 4) { r *= 0.7; g *= 0.7; b *= 0.7; } // frame
      if (Math.abs(x - y) < 3 || Math.abs(x + y - (size - 1)) < 3) { r *= 0.78; g *= 0.78; b *= 0.78; } // cross brace
      const i = (y * size + x) * 4;
      rgba[i] = Math.max(0, Math.min(255, r));
      rgba[i + 1] = Math.max(0, Math.min(255, g));
      rgba[i + 2] = Math.max(0, Math.min(255, b));
      rgba[i + 3] = 255;
    }
  }
  return png(size, size, rgba);
}

// ── assembling a .glb ───────────────────────────────────────────────────────
class GlbBuilder {
  constructor() {
    this.chunks = [];
    this.length = 0;
    this.gltf = { asset: { version: "2.0", generator: "go-renovate make-test-models" }, bufferViews: [], accessors: [] };
  }

  // Appends bytes (padded to a multiple of 4) and returns the buffer view index.
  addView(bytes, target) {
    const view = { buffer: 0, byteOffset: this.length, byteLength: bytes.length };
    if (target) view.target = target;
    this.gltf.bufferViews.push(view);
    const padded = Buffer.concat([bytes, Buffer.alloc((4 - (bytes.length % 4)) % 4)]);
    this.chunks.push(padded);
    this.length += padded.length;
    return this.gltf.bufferViews.length - 1;
  }

  addAccessor(view, componentType, count, type, extra = {}) {
    this.gltf.accessors.push({ bufferView: view, componentType, count, type, ...extra });
    return this.gltf.accessors.length - 1;
  }

  // Writes all of a box's data and returns the mesh primitive that uses it.
  addBox(geometry, material) {
    const pos = this.addAccessor(
      this.addView(Buffer.from(new Float32Array(geometry.positions).buffer), 34962),
      5126,
      geometry.positions.length / 3,
      "VEC3",
      boundsOf(geometry.positions),
    );
    const nor = this.addAccessor(
      this.addView(Buffer.from(new Float32Array(geometry.normals).buffer), 34962),
      5126,
      geometry.normals.length / 3,
      "VEC3",
    );
    const uv = this.addAccessor(
      this.addView(Buffer.from(new Float32Array(geometry.uvs).buffer), 34962),
      5126,
      geometry.uvs.length / 2,
      "VEC2",
    );
    const idx = this.addAccessor(
      this.addView(Buffer.from(new Uint16Array(geometry.indices).buffer), 34963),
      5123,
      geometry.indices.length,
      "SCALAR",
    );
    return { attributes: { POSITION: pos, NORMAL: nor, TEXCOORD_0: uv }, indices: idx, material };
  }

  build() {
    const bin = Buffer.concat(this.chunks);
    this.gltf.buffers = [{ byteLength: bin.length }];
    const json = Buffer.from(JSON.stringify(this.gltf), "utf8");
    const jsonPadded = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]); // pad with spaces
    const total = 12 + 8 + jsonPadded.length + 8 + bin.length;
    const out = Buffer.alloc(total);
    out.writeUInt32LE(0x46546c67, 0); // "glTF"
    out.writeUInt32LE(2, 4);
    out.writeUInt32LE(total, 8);
    out.writeUInt32LE(jsonPadded.length, 12);
    out.writeUInt32LE(0x4e4f534a, 16); // "JSON"
    jsonPadded.copy(out, 20);
    const binStart = 20 + jsonPadded.length;
    out.writeUInt32LE(bin.length, binStart);
    out.writeUInt32LE(0x004e4942, binStart + 4); // "BIN\0"
    bin.copy(out, binStart + 8);
    return out;
  }
}

function boundsOf(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k += 1) {
      min[k] = Math.min(min[k], positions[i + k]);
      max[k] = Math.max(max[k], positions[i + k]);
    }
  }
  return { min, max };
}

// ── model 1: a table, built from ONE box mesh reused five times by nodes ────
{
  const b = new GlbBuilder();
  const primitive = b.addBox(boxGeometry(1, 1, 1), 0); // a unit box; the nodes below scale it
  b.gltf.meshes = [{ name: "box", primitives: [primitive] }];
  b.gltf.materials = [{ name: "oak", pbrMetallicRoughness: { baseColorFactor: [0.55, 0.34, 0.18, 1], metallicFactor: 0, roughnessFactor: 0.55 } }];
  // metres, origin on the floor at the middle of the table: 120 × 74 × 60 cm
  const top = { name: "top", mesh: 0, translation: [0, 0.72, 0], scale: [1.2, 0.04, 0.6] };
  const leg = (name, x, z) => ({ name, mesh: 0, translation: [x, 0.35, z], scale: [0.05, 0.7, 0.05] });
  b.gltf.nodes = [
    { name: "table", children: [1, 2, 3, 4, 5] },
    top,
    leg("leg-fl", -0.55, 0.25),
    leg("leg-fr", 0.55, 0.25),
    leg("leg-bl", -0.55, -0.25),
    leg("leg-br", 0.55, -0.25),
  ];
  b.gltf.scenes = [{ nodes: [0] }];
  b.gltf.scene = 0;
  writeFileSync(path.join(OUT, "test-table.glb"), b.build());
}

// ── model 2: a crate with a texture embedded in the file ────────────────────
{
  const b = new GlbBuilder();
  const primitive = b.addBox(boxGeometry(0.5, 0.5, 0.5, { bottomAtZero: true }), 0);
  b.gltf.meshes = [{ name: "crate", primitives: [primitive] }];
  const imageView = b.addView(plankTexture());
  b.gltf.images = [{ bufferView: imageView, mimeType: "image/png" }];
  b.gltf.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
  b.gltf.textures = [{ source: 0, sampler: 0 }];
  b.gltf.materials = [{ name: "planks", pbrMetallicRoughness: { baseColorTexture: { index: 0 }, baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.8 } }];
  b.gltf.nodes = [{ name: "crate", mesh: 0 }];
  b.gltf.scenes = [{ nodes: [0] }];
  b.gltf.scene = 0;
  writeFileSync(path.join(OUT, "test-crate.glb"), b.build());
}

console.log("wrote test-table.glb and test-crate.glb to", OUT);
