// Matrix maths for the in-house 3D viewer (no libraries). Written to be READ:
// every function says what it does to a point, because 3D graphics is mostly
// "multiply the point by a few 4×4 matrices, in the right order".
//
// Conventions (the same ones WebGL uses):
//   - A Mat4 is a Float32Array of 16 numbers in COLUMN-MAJOR order: the first four
//     numbers are the first COLUMN. So element (row r, column c) is m[c * 4 + r], and
//     a translation lives in m[12], m[13], m[14].
//   - Right-handed axes: x → right, y ↑ up, z toward the viewer. The camera looks
//     down −z.
//   - A point is the column vector (x, y, z, 1). `multiply(a, b)` means "apply b
//     first, then a" — exactly like writing a × b on paper.
//   - Angles are in radians.

export type Mat4 = Float32Array;
// A 3×3 matrix, also column-major (9 numbers).
export type Mat3 = Float32Array;
export type Vec3 = readonly [number, number, number];

export function identity(): Mat4 {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

// out = a × b ("do b, then a").
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += a[k * 4 + row] * b[column * 4 + k];
      out[column * 4 + row] = sum;
    }
  }
  return out;
}

export function translation(x: number, y: number, z: number): Mat4 {
  const m = identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

export function scaling(x: number, y: number, z: number): Mat4 {
  const m = identity();
  m[0] = x;
  m[5] = y;
  m[10] = z;
  return m;
}

// Spin about the vertical (y) axis: turns a point left/right ("yaw").
export function rotationY(radians: number): Mat4 {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  const m = identity();
  m[0] = c;
  m[2] = -s;
  m[8] = s;
  m[10] = c;
  return m;
}

// Spin about the horizontal (x) axis: tips a point up/down ("pitch").
export function rotationX(radians: number): Mat4 {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  const m = identity();
  m[5] = c;
  m[6] = s;
  m[9] = -s;
  m[10] = c;
  return m;
}

// Build a matrix from the three things a 3D file stores for each object: where it
// is (translation), how it is turned (rotation, as a quaternion x, y, z, w) and how
// big it is (scale). Applied in the order: scale, then rotate, then move.
export function compose(
  translationXyz: Vec3,
  rotationXyzw: readonly [number, number, number, number],
  scaleXyz: Vec3,
): Mat4 {
  const [x, y, z, w] = rotationXyzw;
  const length = Math.hypot(x, y, z, w) || 1;
  const qx = x / length;
  const qy = y / length;
  const qz = z / length;
  const qw = w / length;
  const m = new Float32Array(16);
  // the rotation matrix of a unit quaternion, each column scaled by the matching scale
  m[0] = (1 - 2 * (qy * qy + qz * qz)) * scaleXyz[0];
  m[1] = 2 * (qx * qy + qz * qw) * scaleXyz[0];
  m[2] = 2 * (qx * qz - qy * qw) * scaleXyz[0];
  m[4] = 2 * (qx * qy - qz * qw) * scaleXyz[1];
  m[5] = (1 - 2 * (qx * qx + qz * qz)) * scaleXyz[1];
  m[6] = 2 * (qy * qz + qx * qw) * scaleXyz[1];
  m[8] = 2 * (qx * qz + qy * qw) * scaleXyz[2];
  m[9] = 2 * (qy * qz - qx * qw) * scaleXyz[2];
  m[10] = (1 - 2 * (qx * qx + qy * qy)) * scaleXyz[2];
  m[12] = translationXyz[0];
  m[13] = translationXyz[1];
  m[14] = translationXyz[2];
  m[15] = 1;
  return m;
}

const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (a: Vec3): Vec3 => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};

// The VIEW matrix: moves the whole world so that a camera standing at `eye` and
// looking at `target` ends up at the origin looking down −z. (Moving the camera
// is the same as moving the world the opposite way.)
export function lookAt(eye: Vec3, target: Vec3, up: Vec3 = [0, 1, 0]): Mat4 {
  const z = normalize(subtract(eye, target)); // from the target back toward the eye
  const x = normalize(cross(up, z)); // the camera's right
  const y = cross(z, x); // the camera's true up
  const m = new Float32Array(16);
  m[0] = x[0];
  m[1] = y[0];
  m[2] = z[0];
  m[4] = x[1];
  m[5] = y[1];
  m[6] = z[1];
  m[8] = x[2];
  m[9] = y[2];
  m[10] = z[2];
  m[12] = -dot(x, eye);
  m[13] = -dot(y, eye);
  m[14] = -dot(z, eye);
  m[15] = 1;
  return m;
}

// The PROJECTION matrix: squeezes the camera's view frustum (a pyramid with its
// tip at the camera) into the cube WebGL draws, so things further away get
// smaller. `fovY` is the vertical field of view; points nearer than `near` or
// further than `far` are cut off.
export function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1; // makes w = −z, and the GPU's divide-by-w is the "further = smaller" step
  m[14] = (2 * far * near) / (near - far);
  return m;
}

// The matrix that turns SURFACE DIRECTIONS (normals) the right way when a model
// is moved/scaled: the inverse-transpose of the model matrix's top-left 3×3. For a
// pure rotation it is just that rotation; with a squash or stretch it keeps
// normals perpendicular to their surface, which plain `m × normal` would not.
export function normalMatrix(m: Mat4): Mat3 {
  const m00 = m[0];
  const m01 = m[4];
  const m02 = m[8];
  const m10 = m[1];
  const m11 = m[5];
  const m12 = m[9];
  const m20 = m[2];
  const m21 = m[6];
  const m22 = m[10];

  // Cofactors; (inverse)ᵀ = cofactor matrix ÷ determinant.
  const c00 = m11 * m22 - m12 * m21;
  const c01 = -(m10 * m22 - m12 * m20);
  const c02 = m10 * m21 - m11 * m20;
  const c10 = -(m01 * m22 - m02 * m21);
  const c11 = m00 * m22 - m02 * m20;
  const c12 = -(m00 * m21 - m01 * m20);
  const c20 = m01 * m12 - m02 * m11;
  const c21 = -(m00 * m12 - m02 * m10);
  const c22 = m00 * m11 - m01 * m10;
  const det = m00 * c00 + m01 * c01 + m02 * c02 || 1;

  const out = new Float32Array(9);
  out[0] = c00 / det;
  out[1] = c10 / det;
  out[2] = c20 / det;
  out[3] = c01 / det;
  out[4] = c11 / det;
  out[5] = c21 / det;
  out[6] = c02 / det;
  out[7] = c12 / det;
  out[8] = c22 / det;
  return out;
}

// Apply a matrix to a point (x, y, z, 1) and return (x, y, z) — handy for tests
// and for working out where something ends up on screen.
export function transformPoint(m: Mat4, p: Vec3): Vec3 {
  const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
  const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
  const z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
  const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
  return [x / w, y / w, z / w];
}

// Apply only the rotation / scale part of a matrix to a DIRECTION (x, y, z, 0):
// directions, unlike points, are not moved by a translation. Handy for turning a
// light's direction from room space into camera space.
export function transformDirection(m: Mat4, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2],
  ];
}

// The inverse of a 4×4 matrix: undoes it. Used to turn a point on the screen back
// into a line through the room (see roomPicking). Returns null for a matrix that
// cannot be undone (e.g. everything squashed flat).
export function invert(m: Mat4): Mat4 | null {
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
  const k = 1 / det;

  const out = new Float32Array(16);
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * k;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * k;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * k;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * k;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * k;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * k;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * k;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * k;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * k;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * k;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * k;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * k;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * k;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * k;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * k;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * k;
  return out;
}
