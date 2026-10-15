// Milestone 1 of the in-house product viewer: one lit cube. It exists to prove the
// whole pipeline end to end — geometry in GPU buffers, a vertex + fragment shader,
// the model → view → projection matrices, lighting — with the smallest possible
// shape. Later milestones swap the cube's buffers for a loaded model's (same
// pipeline, more triangles).
import { Mat4, lookAt, multiply, normalMatrix, perspective, rotationX, rotationY } from "./mat4";
import { Drawable } from "./drawable";
import { createProgram } from "./shader";

// One vertex = position (3) + normal (3) + colour (3) floats, packed together
// ("interleaved"): the GPU reads a vertex's data from one place.
const FLOATS_PER_VERTEX = 9;
const BYTES = Float32Array.BYTES_PER_ELEMENT;

// sRGB hex → LINEAR light (0–1). Lighting maths is only right in linear light; the
// fragment shader converts back to sRGB for the screen.
const srgbToLinear = (hex: number): [number, number, number] =>
  [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => Math.pow(v / 255, 2.2)) as [
    number,
    number,
    number,
  ];

// Each face has 4 corners (u × v) around its centre, an outward normal, a colour.
// The corners are listed counter-clockwise as seen from outside: that winding is
// how the GPU knows which side of a triangle is the front (back faces are culled).
const FACES: { normal: [number, number, number]; u: [number, number, number]; v: [number, number, number]; colour: number }[] = [
  { normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], colour: 0xe0674f }, // front  (+z)
  { normal: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], colour: 0x4f8fe0 }, // back   (−z)
  { normal: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], colour: 0x6cc070 }, // right  (+x)
  { normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], colour: 0xe0c24f }, // left   (−x)
  { normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], colour: 0xb36be0 }, // top    (+y)
  { normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], colour: 0x6bd1d1 }, // bottom (−y)
];

function buildCube(half: number) {
  const vertices: number[] = [];
  const indices: number[] = [];
  FACES.forEach((face, faceIndex) => {
    const colour = srgbToLinear(face.colour);
    // corner = normal·half ± u·half ± v·half
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      vertices.push(
        (face.normal[0] + su * face.u[0] + sv * face.v[0]) * half,
        (face.normal[1] + su * face.u[1] + sv * face.v[1]) * half,
        (face.normal[2] + su * face.u[2] + sv * face.v[2]) * half,
        ...face.normal,
        ...colour,
      );
    }
    const base = faceIndex * 4;
    // two triangles per square face
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
}

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColour;

uniform mat4 uModelView;     // model → camera space
uniform mat4 uProjection;    // camera space → screen
uniform mat3 uNormalMatrix;  // turns normals along with the model

out vec3 vNormal;
out vec3 vColour;
out vec3 vViewPosition;

void main() {
  vec4 viewPosition = uModelView * vec4(aPosition, 1.0);
  vViewPosition = viewPosition.xyz;
  vNormal = uNormalMatrix * aNormal;
  vColour = aColour;
  gl_Position = uProjection * viewPosition;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec3 vNormal;
in vec3 vColour;
in vec3 vViewPosition;

uniform vec3 uLightDirection; // camera space, pointing TOWARD the light

out vec4 outColour;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 light = normalize(uLightDirection);

  // Diffuse: a surface facing the light is bright, one edge-on is dark.
  float diffuse = max(dot(normal, light), 0.0);

  // Specular: a small glint where the surface mirrors the light toward the eye.
  vec3 toEye = normalize(-vViewPosition);
  vec3 halfway = normalize(light + toEye);
  float glint = pow(max(dot(normal, halfway), 0.0), 32.0) * 0.25;

  // A little ambient light so the shadow side is not pitch black.
  vec3 lit = vColour * (0.3 + 0.8 * diffuse) + vec3(glint);

  // Linear light → sRGB for the screen.
  outColour = vec4(pow(lit, vec3(1.0 / 2.2)), 1.0);
}`;

// Light toward the upper left, in front of the cube, fixed to the CAMERA: the
// cube turns under the light the way a product is turned in your hand.
const LIGHT_DIRECTION = [-0.45, 0.65, 0.6];
// Far enough that the cube's corners (up to 1.56 from its centre) stay inside the frame at any turn.
const CAMERA_DISTANCE = 5.6;
const FIELD_OF_VIEW = (40 * Math.PI) / 180;

export function createCubeScene(gl: WebGL2RenderingContext): Drawable {
  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const uModelView = gl.getUniformLocation(program, "uModelView");
  const uProjection = gl.getUniformLocation(program, "uProjection");
  const uNormalMatrix = gl.getUniformLocation(program, "uNormalMatrix");
  const uLightDirection = gl.getUniformLocation(program, "uLightDirection");

  const { vertices, indices } = buildCube(0.9);
  // A vertex array object remembers how the buffers below are laid out, so drawing
  // is just "bind it and go".
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const stride = FLOATS_PER_VERTEX * BYTES;
  [
    [0, 0], // position at float 0
    [1, 3], // normal at float 3
    [2, 6], // colour at float 6
  ].forEach(([location, offset]) => {
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, stride, offset * BYTES);
  });

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  return {
    draw({ width, height, yaw, pitch, zoom }) {
      // Zooming = moving the camera closer along its line of sight.
      const view: Mat4 = lookAt([0, 0, CAMERA_DISTANCE / zoom], [0, 0, 0], [0, 1, 0]);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0); // transparent: the page's own background shows through
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); // nearer surfaces hide further ones
      gl.enable(gl.CULL_FACE); // skip faces turned away from the camera
      gl.cullFace(gl.BACK);

      const model = multiply(rotationX(pitch), rotationY(yaw));
      const modelView = multiply(view, model);
      const projection = perspective(FIELD_OF_VIEW, width / Math.max(1, height), 0.05, 50);

      gl.useProgram(program);
      gl.uniformMatrix4fv(uModelView, false, modelView);
      gl.uniformMatrix4fv(uProjection, false, projection);
      gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix(modelView));
      gl.uniform3fv(uLightDirection, LIGHT_DIRECTION);

      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
