// Reading a .glb (binary glTF 2.0) file — the standard format for 3D products.
//
// A .glb is  [12-byte header][JSON chunk][binary chunk]:
//   - the JSON chunk DESCRIBES the scene: nodes (objects, with a position / turn /
//     size), meshes (shapes made of "primitives"), materials (colours, textures),
//     and "accessors" (how to read numbers out of the binary chunk);
//   - the binary chunk holds the numbers themselves: vertex positions, normals,
//     texture coordinates, triangle indices, and embedded images.
//
// The file is UNTRUSTED INPUT (a vendor will upload it): every length and index is
// checked before it is used, and anything outside the supported subset is refused
// with a plain message instead of being half-drawn. Supported subset:
//   - one scene of nodes, each with matrix OR translation / rotation / scale;
//   - triangle meshes: POSITION, NORMAL, TEXCOORD_0, COLOR_0; indices 8/16/32-bit;
//   - materials: base colour (factor + texture), roughness, metalness, doubleSided,
//     alphaMode OPAQUE or MASK;
//   - images EMBEDDED in the file (PNG / JPEG), samplers.
// Refused: compressed models (Draco, Meshopt), sparse accessors, files that point
// at outside data (a URL for a buffer or an image), anything bigger than the limits.
// Ignored with a warning: animation, skins, normal / occlusion / emissive maps,
// semi-transparency, and optional extensions.
import { Mat4, Vec3, compose, identity, multiply, normalMatrix, transformPoint } from "./mat4";

export const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12 MB
export const MAX_TRIANGLES = 300_000; // refused above this
export const RECOMMENDED_TRIANGLES = 50_000; // a warning above this
// Pictures bigger than this are refused (a 2048² picture is already 16 MB of GPU memory).
export const MAX_TEXTURE_SIZE = 2048;
export const MAX_VERTICES_PER_PRIMITIVE = 1_000_000;
const MAX_NODE_DEPTH = 64;

export type ModelErrorCode =
  | "not-glb"
  | "unsupported-version"
  | "truncated"
  | "too-large"
  | "bad-json"
  | "unsupported"
  | "external-data"
  | "invalid"
  | "too-complex";

// A problem with the file, written so it can be shown to the person who chose it.
export class ModelError extends Error {
  constructor(
    public readonly code: ModelErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ModelError";
  }
}

export interface ModelSampler {
  wrapS: number;
  wrapT: number;
  minFilter: number;
  magFilter: number;
}

export interface ModelMaterial {
  baseColour: [number, number, number, number]; // linear light
  // Index into ParsedModel.images, or null when the material is a plain colour.
  imageIndex: number | null;
  sampler: ModelSampler;
  roughness: number;
  metallic: number;
  alphaMask: boolean;
  alphaCutoff: number;
  doubleSided: boolean;
}

// A piece of the model with ONE material. Positions and normals are already in the
// model's own space (every node's move / turn / scale is applied while reading).
export interface ModelPrimitive {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array | null;
  colours: Float32Array | null; // vec3 per vertex (linear light), or none
  indices: Uint16Array | Uint32Array;
  materialIndex: number;
}

export interface ParsedModel {
  primitives: ModelPrimitive[];
  materials: ModelMaterial[];
  // Encoded images (PNG / JPEG bytes) still to be decoded by the browser.
  images: { bytes: Uint8Array; mimeType: string }[];
  min: Vec3;
  max: Vec3;
  triangleCount: number;
  warnings: string[];
}

// glTF constants
const MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;
const GL_REPEAT = 10497;
const GL_LINEAR = 9729;
const GL_LINEAR_MIPMAP_LINEAR = 9987;
const COMPONENT_BYTES: Record<number, number> = {
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4, // FLOAT
};
const TYPE_COUNTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

// ── the little structure the JSON is read into (only what we use) ───────────
interface GltfAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: number;
  normalized?: boolean;
  count: number;
  type: string;
  sparse?: unknown;
}
interface GltfBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
}
interface GltfNode {
  children?: number[];
  mesh?: number;
  matrix?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
}
interface GltfPrimitive {
  attributes: Record<string, number>;
  indices?: number;
  material?: number;
  mode?: number;
  extensions?: Record<string, unknown>;
}
interface GltfMaterial {
  pbrMetallicRoughness?: {
    baseColorFactor?: number[];
    baseColorTexture?: { index: number; texCoord?: number };
    metallicFactor?: number;
    roughnessFactor?: number;
  };
  normalTexture?: unknown;
  occlusionTexture?: unknown;
  emissiveTexture?: unknown;
  alphaMode?: string;
  alphaCutoff?: number;
  doubleSided?: boolean;
}
interface Gltf {
  extensionsRequired?: string[];
  extensionsUsed?: string[];
  buffers?: { byteLength: number; uri?: string }[];
  bufferViews?: GltfBufferView[];
  accessors?: GltfAccessor[];
  images?: { bufferView?: number; uri?: string; mimeType?: string }[];
  samplers?: Partial<ModelSampler>[];
  textures?: { source?: number; sampler?: number }[];
  materials?: GltfMaterial[];
  meshes?: { primitives: GltfPrimitive[] }[];
  nodes?: GltfNode[];
  scenes?: { nodes?: number[] }[];
  scene?: number;
  animations?: unknown[];
  skins?: unknown[];
}

const invalid = (message: string) => new ModelError("invalid", message);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

// ── step 1: the container ────────────────────────────────────────────────────
function splitChunks(buffer: ArrayBuffer): { json: Gltf; bin: Uint8Array } {
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new ModelError(
      "too-large",
      `This file is ${(buffer.byteLength / 1048576).toFixed(1)} MB. Models must be ${MAX_FILE_BYTES / 1048576} MB or less.`,
    );
  }
  if (buffer.byteLength < 20) throw new ModelError("not-glb", "This isn't a 3D model file (.glb).");
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== MAGIC) {
    throw new ModelError("not-glb", "This isn't a 3D model file (.glb). Export your model as “glTF Binary (.glb)”.");
  }
  if (view.getUint32(4, true) !== 2) {
    throw new ModelError("unsupported-version", "Only glTF version 2 models are supported.");
  }
  const declared = view.getUint32(8, true);
  if (declared > buffer.byteLength) {
    throw new ModelError("truncated", "This file is incomplete (it ends before the model does). Try exporting it again.");
  }

  let json: Gltf | null = null;
  let bin: Uint8Array | null = null;
  let offset = 12;
  while (offset + 8 <= declared) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    if (end > declared) throw new ModelError("truncated", "This file is incomplete (a part of it is cut off).");
    if (type === CHUNK_JSON && json === null) {
      try {
        json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, start, length))) as Gltf;
      } catch {
        throw new ModelError("bad-json", "The model's description is damaged. Try exporting it again.");
      }
    } else if (type === CHUNK_BIN && bin === null) {
      bin = new Uint8Array(buffer, start, length);
    }
    offset = end;
  }
  if (!json || typeof json !== "object") throw invalid("The model has no description part.");
  return { json, bin: bin ?? new Uint8Array(0) };
}

// ── step 2: refuse what we can't draw honestly ──────────────────────────────
const COMPRESSION_EXTENSIONS = new Set(["KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_mesh_quantization"]);

function checkSupported(gltf: Gltf, bin: Uint8Array, warnings: string[]) {
  for (const name of gltf.extensionsRequired ?? []) {
    if (COMPRESSION_EXTENSIONS.has(name)) {
      throw new ModelError(
        "unsupported",
        "This model is compressed (Draco / Meshopt / quantized), which isn't supported. Export it again with compression switched off.",
      );
    }
    throw new ModelError("unsupported", `This model needs “${name}”, which isn't supported yet.`);
  }
  const optional = (gltf.extensionsUsed ?? []).filter((name) => !(gltf.extensionsRequired ?? []).includes(name));
  if (optional.length > 0) warnings.push(`Ignored optional features: ${optional.join(", ")}.`);

  const buffers = gltf.buffers ?? [];
  if (buffers.length > 1 || buffers.some((buffer) => buffer.uri !== undefined)) {
    throw new ModelError(
      "external-data",
      "This model loads data from outside the file (a link or a second file). Export a single self-contained .glb.",
    );
  }
  if (buffers[0] && buffers[0].byteLength > bin.byteLength) {
    throw new ModelError("truncated", "This file is incomplete (its data is shorter than it says).");
  }
  if ((gltf.images ?? []).some((image) => image.uri !== undefined)) {
    throw new ModelError(
      "external-data",
      "This model's pictures are stored outside the file. Export it again with the textures embedded.",
    );
  }
  if ((gltf.animations?.length ?? 0) > 0) warnings.push("Animation is ignored.");
  if ((gltf.skins?.length ?? 0) > 0) warnings.push("Skinning (a rigged skeleton) is ignored.");
}

// ── step 3: reading numbers out of the binary chunk ─────────────────────────
class Reader {
  constructor(
    private readonly gltf: Gltf,
    private readonly bin: Uint8Array,
  ) {}

  // Reads accessor `index` into a plain array of floats (normalised integers become 0–1),
  // or of unsigned integers for indices. Every offset and length is checked first.
  read(index: unknown, allowedTypes: string[], asIndex = false): { data: Float32Array | Uint32Array; count: number; size: number } {
    if (!Number.isInteger(index)) throw invalid("The model refers to data that isn't there.");
    const accessor = this.gltf.accessors?.[index as number];
    if (!accessor) throw invalid("The model refers to data that isn't there.");
    if (accessor.sparse) throw new ModelError("unsupported", "Sparse data isn't supported. Export the model again.");
    if (accessor.bufferView === undefined) throw invalid("A part of the model has no data.");
    const view = this.gltf.bufferViews?.[accessor.bufferView];
    if (!view || view.buffer !== 0) throw invalid("The model refers to data that isn't there.");
    const componentBytes = COMPONENT_BYTES[accessor.componentType];
    const size = TYPE_COUNTS[accessor.type];
    if (!componentBytes || !size) throw new ModelError("unsupported", "The model uses a data format that isn't supported.");
    if (!allowedTypes.includes(accessor.type)) throw invalid("A part of the model has the wrong kind of data.");
    if (!Number.isInteger(accessor.count) || accessor.count < 0 || accessor.count > MAX_VERTICES_PER_PRIMITIVE * 3) {
      throw new ModelError("too-complex", "The model is too detailed to open here.");
    }

    const elementBytes = componentBytes * size;
    const stride = view.byteStride ?? elementBytes;
    const viewStart = view.byteOffset ?? 0;
    const start = viewStart + (accessor.byteOffset ?? 0);
    const last = accessor.count === 0 ? start : start + stride * (accessor.count - 1) + elementBytes;
    if (stride < elementBytes || last > viewStart + view.byteLength || last > this.bin.byteLength) {
      throw invalid("A part of the model reads past the end of the file.");
    }

    const data = new DataView(this.bin.buffer, this.bin.byteOffset, this.bin.byteLength);
    const out = asIndex ? new Uint32Array(accessor.count * size) : new Float32Array(accessor.count * size);
    const readOne = (offset: number): number => {
      switch (accessor.componentType) {
        case 5126:
          return data.getFloat32(offset, true);
        case 5121:
          return data.getUint8(offset);
        case 5123:
          return data.getUint16(offset, true);
        case 5125:
          return data.getUint32(offset, true);
        case 5120:
          return data.getInt8(offset);
        default:
          return data.getInt16(offset, true);
      }
    };
    // Normalised integers (colours, UVs) are stored as 0…max; bring them to 0…1.
    const divisor = accessor.normalized
      ? { 5121: 255, 5123: 65535, 5120: 127, 5122: 32767 }[accessor.componentType as 5121 | 5123 | 5120 | 5122] ?? 1
      : 1;
    for (let i = 0; i < accessor.count; i += 1) {
      for (let k = 0; k < size; k += 1) {
        out[i * size + k] = readOne(start + i * stride + k * componentBytes) / divisor;
      }
    }
    return { data: out, count: accessor.count, size };
  }
}

// ── step 4: building the model ───────────────────────────────────────────────
const srgbChannelToLinear = (v: number) => Math.pow(Math.max(0, v), 2.2);

function readMaterial(gltf: Gltf, index: number | undefined, warnings: string[]): ModelMaterial {
  const source = index === undefined ? undefined : gltf.materials?.[index];
  const pbr = source?.pbrMetallicRoughness;
  const factor = pbr?.baseColorFactor;
  const baseColour: ModelMaterial["baseColour"] =
    factor && factor.length === 4 && factor.every(isFiniteNumber)
      ? [factor[0], factor[1], factor[2], factor[3]]
      : [1, 1, 1, 1];

  let imageIndex: number | null = null;
  let sampler: ModelSampler = { wrapS: GL_REPEAT, wrapT: GL_REPEAT, minFilter: GL_LINEAR_MIPMAP_LINEAR, magFilter: GL_LINEAR };
  const textureRef = pbr?.baseColorTexture;
  if (textureRef) {
    const texture = gltf.textures?.[textureRef.index];
    if (texture?.source === undefined || !gltf.images?.[texture.source]) throw invalid("A picture on the model is missing.");
    imageIndex = texture.source;
    const declared = texture.sampler === undefined ? undefined : gltf.samplers?.[texture.sampler];
    sampler = {
      wrapS: declared?.wrapS ?? GL_REPEAT,
      wrapT: declared?.wrapT ?? GL_REPEAT,
      minFilter: declared?.minFilter ?? GL_LINEAR_MIPMAP_LINEAR,
      magFilter: declared?.magFilter ?? GL_LINEAR,
    };
    if ((textureRef.texCoord ?? 0) !== 0) warnings.push("A second set of texture coordinates is ignored.");
  }
  if (source?.normalTexture || source?.occlusionTexture || source?.emissiveTexture) {
    warnings.push("Normal, occlusion and emissive maps are ignored.");
  }
  let alphaMask = false;
  if (source?.alphaMode === "MASK") alphaMask = true;
  else if (source?.alphaMode === "BLEND") warnings.push("Semi-transparent materials are drawn solid.");

  return {
    baseColour,
    imageIndex,
    sampler,
    roughness: isFiniteNumber(pbr?.roughnessFactor) ? Math.min(1, Math.max(0, pbr.roughnessFactor)) : 1,
    metallic: isFiniteNumber(pbr?.metallicFactor) ? Math.min(1, Math.max(0, pbr.metallicFactor)) : 1,
    alphaMask,
    alphaCutoff: isFiniteNumber(source?.alphaCutoff) ? source.alphaCutoff : 0.5,
    doubleSided: Boolean(source?.doubleSided),
  };
}

// Flat (per-triangle) normals, for files that did not include any. Needs each
// triangle to have its own corners, so the shape is "un-shared" first.
function withFlatNormals(positions: Float32Array, indices: Uint32Array, uvs: Float32Array | null, colours: Float32Array | null) {
  const count = indices.length;
  const p = new Float32Array(count * 3);
  const n = new Float32Array(count * 3);
  const uv = uvs ? new Float32Array(count * 2) : null;
  const c = colours ? new Float32Array(count * 3) : null;
  for (let i = 0; i < count; i += 1) {
    const from = indices[i];
    p.set(positions.subarray(from * 3, from * 3 + 3), i * 3);
    if (uv && uvs) uv.set(uvs.subarray(from * 2, from * 2 + 2), i * 2);
    if (c && colours) c.set(colours.subarray(from * 3, from * 3 + 3), i * 3);
  }
  for (let t = 0; t < count; t += 3) {
    const ax = p[t * 3 + 3] - p[t * 3];
    const ay = p[t * 3 + 4] - p[t * 3 + 1];
    const az = p[t * 3 + 5] - p[t * 3 + 2];
    const bx = p[t * 3 + 6] - p[t * 3];
    const by = p[t * 3 + 7] - p[t * 3 + 1];
    const bz = p[t * 3 + 8] - p[t * 3 + 2];
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    const length = Math.hypot(nx, ny, nz) || 1;
    nx /= length;
    ny /= length;
    nz /= length;
    for (let k = 0; k < 3; k += 1) n.set([nx, ny, nz], (t + k) * 3);
  }
  const sequential = new Uint32Array(count);
  for (let i = 0; i < count; i += 1) sequential[i] = i;
  return { positions: p, normals: n, uvs: uv, colours: c, indices: sequential };
}

function toIndexArray(indices: Uint32Array, vertexCount: number): Uint16Array | Uint32Array {
  return vertexCount < 65536 ? Uint16Array.from(indices) : indices;
}

export function parseGlb(buffer: ArrayBuffer): ParsedModel {
  const warnings: string[] = [];
  const { json: gltf, bin } = splitChunks(buffer);
  checkSupported(gltf, bin, warnings);
  const reader = new Reader(gltf, bin);

  const nodes = gltf.nodes ?? [];
  const meshes = gltf.meshes ?? [];
  const sceneIndex = gltf.scene ?? 0;
  const roots = gltf.scenes?.[sceneIndex]?.nodes ?? (nodes.length > 0 ? [0] : []);
  if (roots.length === 0 || meshes.length === 0) throw invalid("There is nothing to show in this model.");

  const materials: ModelMaterial[] = [];
  const materialSlot = new Map<number | undefined, number>();
  const materialFor = (index: number | undefined) => {
    let slot = materialSlot.get(index);
    if (slot === undefined) {
      slot = materials.length;
      materials.push(readMaterial(gltf, index, warnings));
      materialSlot.set(index, slot);
    }
    return slot;
  };

  // Read each mesh's primitives once; a mesh used by several nodes (the table's
  // four legs) is then just moved / scaled per node.
  type RawPrimitive = Omit<ModelPrimitive, "positions" | "normals"> & { positions: Float32Array; normals: Float32Array };
  const meshCache = new Map<number, RawPrimitive[]>();
  const loadMesh = (meshIndex: number): RawPrimitive[] => {
    const cached = meshCache.get(meshIndex);
    if (cached) return cached;
    const mesh = meshes[meshIndex];
    if (!mesh || !Array.isArray(mesh.primitives)) throw invalid("The model refers to a shape that isn't there.");
    const out: RawPrimitive[] = [];
    for (const primitive of mesh.primitives) {
      if ((primitive.mode ?? 4) !== 4) {
        warnings.push("Lines and points are ignored (only triangles are drawn).");
        continue;
      }
      if (primitive.extensions && Object.keys(primitive.extensions).length > 0) {
        throw new ModelError("unsupported", "A shape in this model uses a feature that isn't supported.");
      }
      const position = reader.read(primitive.attributes?.POSITION, ["VEC3"]);
      let positions = position.data as Float32Array;
      const vertexCount = position.count;
      if (vertexCount > MAX_VERTICES_PER_PRIMITIVE) throw new ModelError("too-complex", "The model is too detailed to open here.");
      if (!positions.every(isFiniteNumber)) throw invalid("The model contains broken numbers.");

      let indices: Uint32Array;
      if (primitive.indices === undefined) {
        indices = new Uint32Array(vertexCount);
        for (let i = 0; i < vertexCount; i += 1) indices[i] = i;
      } else {
        indices = reader.read(primitive.indices, ["SCALAR"], true).data as Uint32Array;
      }
      if (indices.length % 3 !== 0) throw invalid("The model's triangles are incomplete.");
      for (let i = 0; i < indices.length; i += 1) {
        if (indices[i] >= vertexCount) throw invalid("The model's triangles point at corners that don't exist.");
      }

      let uvs = primitive.attributes.TEXCOORD_0 !== undefined ? (reader.read(primitive.attributes.TEXCOORD_0, ["VEC2"]).data as Float32Array) : null;
      let colours: Float32Array | null = null;
      if (primitive.attributes.COLOR_0 !== undefined) {
        const colour = reader.read(primitive.attributes.COLOR_0, ["VEC3", "VEC4"]);
        const source = colour.data as Float32Array;
        colours = new Float32Array(vertexCount * 3);
        for (let i = 0; i < vertexCount; i += 1) {
          for (let k = 0; k < 3; k += 1) colours[i * 3 + k] = srgbChannelToLinear(source[i * colour.size + k]);
        }
      }
      if (uvs && uvs.length / 2 !== vertexCount) throw invalid("The model's texture coordinates don't match its corners.");

      let normals: Float32Array;
      if (primitive.attributes.NORMAL !== undefined) {
        normals = reader.read(primitive.attributes.NORMAL, ["VEC3"]).data as Float32Array;
        if (normals.length !== positions.length) throw invalid("The model's surface directions don't match its corners.");
      } else {
        const flat = withFlatNormals(positions, indices, uvs, colours);
        positions = flat.positions;
        normals = flat.normals;
        uvs = flat.uvs;
        colours = flat.colours;
        indices = flat.indices;
      }
      out.push({
        positions,
        normals,
        uvs,
        colours,
        indices: toIndexArray(indices, positions.length / 3),
        materialIndex: materialFor(primitive.material),
      });
    }
    meshCache.set(meshIndex, out);
    return out;
  };

  const primitives: ModelPrimitive[] = [];
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  let triangleCount = 0;
  const seen = new Set<number>();

  const visit = (nodeIndex: number, parent: Mat4, depth: number) => {
    if (depth > MAX_NODE_DEPTH) throw invalid("The model's parts are nested too deeply.");
    const node = nodes[nodeIndex];
    if (!node || seen.has(nodeIndex)) throw invalid("The model's parts refer to each other in a loop.");
    seen.add(nodeIndex);

    let local: Mat4;
    if (node.matrix) {
      if (node.matrix.length !== 16 || !node.matrix.every(isFiniteNumber)) throw invalid("A part of the model has a broken position.");
      local = Float32Array.from(node.matrix);
    } else {
      const t = (node.translation ?? [0, 0, 0]) as number[];
      const r = (node.rotation ?? [0, 0, 0, 1]) as number[];
      const s = (node.scale ?? [1, 1, 1]) as number[];
      if (t.length !== 3 || r.length !== 4 || s.length !== 3 || ![...t, ...r, ...s].every(isFiniteNumber)) {
        throw invalid("A part of the model has a broken position.");
      }
      local = compose([t[0], t[1], t[2]], [r[0], r[1], r[2], r[3]], [s[0], s[1], s[2]]);
    }
    const world = multiply(parent, local);

    if (node.mesh !== undefined) {
      const normals3 = normalMatrix(world);
      for (const raw of loadMesh(node.mesh)) {
        const positions = new Float32Array(raw.positions.length);
        const normals = new Float32Array(raw.normals.length);
        for (let i = 0; i < raw.positions.length; i += 3) {
          const p = transformPoint(world, [raw.positions[i], raw.positions[i + 1], raw.positions[i + 2]]);
          positions.set(p, i);
          for (let k = 0; k < 3; k += 1) {
            min[k] = Math.min(min[k], p[k]);
            max[k] = Math.max(max[k], p[k]);
          }
          const nx = raw.normals[i];
          const ny = raw.normals[i + 1];
          const nz = raw.normals[i + 2];
          const x = normals3[0] * nx + normals3[3] * ny + normals3[6] * nz;
          const y = normals3[1] * nx + normals3[4] * ny + normals3[7] * nz;
          const z = normals3[2] * nx + normals3[5] * ny + normals3[8] * nz;
          const length = Math.hypot(x, y, z) || 1;
          normals.set([x / length, y / length, z / length], i);
        }
        triangleCount += raw.indices.length / 3;
        if (triangleCount > MAX_TRIANGLES) {
          throw new ModelError("too-complex", `This model has more than ${MAX_TRIANGLES.toLocaleString()} triangles — too detailed for a product page. Simplify it and export again.`);
        }
        primitives.push({ ...raw, positions, normals });
      }
    }
    for (const child of node.children ?? []) visit(child, world, depth + 1);
  };
  for (const root of roots) visit(root, identity(), 0);

  if (primitives.length === 0) throw invalid("There is nothing to show in this model.");
  if (triangleCount > RECOMMENDED_TRIANGLES) {
    warnings.push(`${triangleCount.toLocaleString()} triangles is heavy for phones; aim for ${RECOMMENDED_TRIANGLES.toLocaleString()} or fewer.`);
  }

  // Embedded pictures: just the encoded bytes (the browser decodes them when drawing).
  const images = (gltf.images ?? []).map((image) => {
    const view = image.bufferView === undefined ? undefined : gltf.bufferViews?.[image.bufferView];
    if (!view || view.buffer !== 0) throw invalid("A picture on the model is missing.");
    const start = view.byteOffset ?? 0;
    if (start + view.byteLength > bin.byteLength) throw invalid("A picture on the model reads past the end of the file.");
    const mimeType = image.mimeType ?? "";
    if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
      throw new ModelError("unsupported", "A picture on the model isn't a PNG or JPEG.");
    }
    return { bytes: bin.subarray(start, start + view.byteLength), mimeType };
  });

  return { primitives, materials, images, min, max, triangleCount, warnings };
}

// The model's size in centimetres, assuming (as glTF requires) that one unit is a metre.
export function modelSizeCm(model: ParsedModel): { w: number; h: number; d: number } {
  return {
    w: (model.max[0] - model.min[0]) * 100,
    h: (model.max[1] - model.min[1]) * 100,
    d: (model.max[2] - model.min[2]) * 100,
  };
}
