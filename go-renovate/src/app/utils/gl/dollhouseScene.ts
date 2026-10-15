// Draws a RoomMesh (utils/gl/roomMesh.ts) as a dollhouse you can turn and zoom.
// Same building blocks as the product viewer — buffers, two shaders, matrices —
// with a light fixed in the ROOM (not the camera), so shade stays put on the walls
// while you orbit, the way real light does.
import { Drawable, ViewState } from "./drawable";
import { ParsedModel } from "./glb";
import { FLOATS_PER_VERTEX, RoomMesh, SURFACE } from "./roomMesh";
import { multiply, perspective, rotationX, rotationY, scaling, transformDirection, translation } from "./mat4";
import { ModelGpu, ModelProgram, createModelProgram, uploadModel } from "./modelScene";
import { PiecePlan } from "./roomPieces";
import { WALK_FOV, walkView } from "./roomWalk";
import { createProgram } from "./shader";

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColour;
layout(location = 3) in float aSurface;

uniform mat4 uViewProjection;

out vec3 vWorld;
out vec3 vNormal;
out vec3 vColour;
out float vSurface;

void main() {
  vWorld = aPosition;
  vNormal = aNormal;
  vColour = aColour;
  vSurface = aSurface;
  gl_Position = uViewProjection * vec4(aPosition, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec3 vWorld;
in vec3 vNormal;
in vec3 vColour;
in float vSurface;

uniform vec3 uRoom;        // width, height, depth in metres
uniform vec3 uLightDir;    // in ROOM space, pointing toward the light
uniform vec3 uLineColour;  // floor plank lines, linear light

out vec4 outColour;

void main() {
  vec3 n = normalize(vNormal);
  vec3 base = vColour;
  int surface = int(vSurface + 0.5);

  // Windows glow (light comes through them) and so does the selection frame: not lit by the room.
  if (surface == ${SURFACE.emissive}) {
    outColour = vec4(pow(base * 1.15, vec3(1.0 / 2.2)), 1.0);
    return;
  }

  // Floor planks: a joint every 0.18 m across, and a short joint every 1.2 m along.
  if (surface == ${SURFACE.floor}) {
    float row = floor(vWorld.z / 0.18);
    float across = abs(fract(vWorld.z / 0.18 + 0.5) - 0.5) * 0.18;
    float along = abs(fract((vWorld.x + mod(row, 3.0) * 0.4) / 1.2 + 0.5) - 0.5) * 1.2;
    float line = (1.0 - smoothstep(0.0, 0.006, across)) + (1.0 - smoothstep(0.0, 0.006, along)) * 0.7;
    base = mix(base, uLineColour, clamp(line, 0.0, 1.0) * 0.55);
  }
  // Wall tiles: a 0.3 m grid, sliding along whichever wall this is.
  if (surface == ${SURFACE.tiles}) {
    float u = vWorld.x + vWorld.z;
    float gu = abs(fract(u / 0.3 + 0.5) - 0.5) * 0.3;
    float gv = abs(fract(vWorld.y / 0.3 + 0.5) - 0.5) * 0.3;
    float line = (1.0 - smoothstep(0.0, 0.004, gu)) + (1.0 - smoothstep(0.0, 0.004, gv));
    base = mix(base, base * 0.7, clamp(line, 0.0, 1.0));
  }

  // Corner darkening: a cheap stand-in for light that does not reach tight corners.
  float shade = 1.0;
  if (surface != ${SURFACE.block}) {
    if (abs(n.y) > 0.5) {
      float d = min(min(vWorld.x, uRoom.x - vWorld.x), min(vWorld.z, uRoom.z - vWorld.z));
      shade = mix(0.6, 1.0, smoothstep(0.0, 0.55, d));
    } else {
      float along = abs(n.z) > 0.5 ? vWorld.x : vWorld.z;
      float span = abs(n.z) > 0.5 ? uRoom.x : uRoom.z;
      float d = min(min(along, span - along), min(vWorld.y, uRoom.y - vWorld.y));
      shade = mix(0.7, 1.0, smoothstep(0.0, 0.5, d));
    }
  }

  // Sky above, floor bounce below, plus one soft key light from the window side.
  vec3 sky = vec3(0.95, 0.97, 1.0);
  vec3 ground = vec3(0.55, 0.5, 0.45);
  vec3 ambient = mix(ground, sky, n.y * 0.5 + 0.5) * 0.62;
  float diffuse = max(dot(n, normalize(uLightDir)), 0.0);
  vec3 lit = base * (ambient + vec3(1.0, 0.96, 0.9) * 0.62 * diffuse) * shade;
  outColour = vec4(pow(lit, vec3(1.0 / 2.2)), 1.0);
}`;

const SHADOW_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aCorner;
uniform mat4 uViewProjection;
uniform vec2 uCentre;
uniform vec2 uRadius;
out vec2 vCorner;
void main() {
  vCorner = aCorner;
  vec3 floorPoint = vec3(uCentre.x + aCorner.x * uRadius.x, 0.004, uCentre.y + aCorner.y * uRadius.y);
  gl_Position = uViewProjection * vec4(floorPoint, 1.0);
}`;

const SHADOW_FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec2 vCorner;
uniform float uStrength;
out vec4 outColour;
void main() {
  float fade = 1.0 - smoothstep(0.0, 1.0, length(vCorner));
  outColour = vec4(0.0, 0.0, 0.0, fade * fade * uStrength);
}`;

// A product photo standing in the room: one textured square, scaled to the piece.
const CARD_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aCorner;   // x -0.5..0.5 across, y 0..1 up
uniform mat4 uMatrix;                   // view-projection × placement × size
out vec2 vUv;
void main() {
  vUv = vec2(aCorner.x + 0.5, 1.0 - aCorner.y);
  gl_Position = uMatrix * vec4(aCorner.x, aCorner.y, 0.0, 1.0);
}`;

const CARD_FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uTexture;
out vec4 outColour;
void main() {
  vec4 photo = texture(uTexture, vUv);
  // The cut-out edge is a hard cut: a photo has no half-transparent furniture.
  if (photo.a < 0.4) discard;
  // Toned a touch toward the room so it does not glow against the shaded walls.
  outColour = vec4(pow(photo.rgb * 0.92, vec3(1.0 / 2.2)), 1.0);
}`;

const FIELD_OF_VIEW = (35 * Math.PI) / 180;
// Looking at the middle of the room, a little below its centre.
const TARGET_HEIGHT_SHARE = 0.38;
// The room's far corners must stay in frame at any turn: fit its bounding sphere.
const FIT_MARGIN = 1.08;
// Light from above, from the window side (the back wall), a little from the right.
const LIGHT_DIRECTION: [number, number, number] = [0.35, 0.85, 0.45];

// The 3D room on the graphics card. The room itself (walls, floor, blocks) is one
// mesh; models and photos are added and removed as they arrive, and the plan says
// which piece uses which. Everything but the room mesh survives a mesh change, so
// typing a new room depth does not re-upload every model.
export interface DollhouseScene extends Drawable {
  setMesh: (mesh: RoomMesh) => void;
  setModel: (id: string, model: ParsedModel, bitmaps: ImageBitmap[]) => void;
  removeModel: (id: string) => void;
  setCard: (url: string, source: TexImageSource) => void;
  removeCard: (url: string) => void;
  setPlan: (plan: PiecePlan[]) => void;
  // The matrix the room is drawn with for a given view — what a tap needs to find
  // the line through the room it points along (see roomPicking).
  viewProjection: (view: ViewState) => Float32Array;
}

interface MeshGpu {
  vao: WebGLVertexArrayObject;
  vertexBuffer: WebGLBuffer;
  indexBuffer: WebGLBuffer;
  indexCount: number;
}

export function createDollhouseScene(gl: WebGL2RenderingContext, initialMesh: RoomMesh): DollhouseScene {
  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const uViewProjection = gl.getUniformLocation(program, "uViewProjection");
  const uRoom = gl.getUniformLocation(program, "uRoom");
  const uLightDir = gl.getUniformLocation(program, "uLightDir");
  const uLineColour = gl.getUniformLocation(program, "uLineColour");

  // the room mesh (replaceable)
  const uploadMesh = (mesh: RoomMesh): MeshGpu => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
    const stride = FLOATS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;
    [
      [0, 3, 0], // position
      [1, 3, 3], // normal
      [2, 3, 6], // colour
      [3, 1, 9], // surface
    ].forEach(([location, size, offset]) => {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * Float32Array.BYTES_PER_ELEMENT);
    });
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao: vao as WebGLVertexArrayObject, vertexBuffer, indexBuffer, indexCount: mesh.indices.length };
  };
  const freeMesh = (m: MeshGpu) => {
    gl.deleteBuffer(m.vertexBuffer);
    gl.deleteBuffer(m.indexBuffer);
    gl.deleteVertexArray(m.vao);
  };

  // one unit square for every blob shadow and one for every photo
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const cardBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cardBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, 0, 0.5, 0, -0.5, 1, 0.5, 1]), gl.STATIC_DRAW);
  const quadVao = (buffer: WebGLBuffer) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vao;
  };
  const shadowVao = quadVao(quadBuffer);
  const cardVao = quadVao(cardBuffer);

  const shadowProgram = createProgram(gl, SHADOW_VERTEX_SHADER, SHADOW_FRAGMENT_SHADER);
  const sViewProjection = gl.getUniformLocation(shadowProgram, "uViewProjection");
  const sCentre = gl.getUniformLocation(shadowProgram, "uCentre");
  const sRadius = gl.getUniformLocation(shadowProgram, "uRadius");
  const sStrength = gl.getUniformLocation(shadowProgram, "uStrength");

  const cardProgram = createProgram(gl, CARD_VERTEX_SHADER, CARD_FRAGMENT_SHADER);
  const cMatrix = gl.getUniformLocation(cardProgram, "uMatrix");
  const cTexture = gl.getUniformLocation(cardProgram, "uTexture");

  // models are created on demand (their shader too, once)
  let modelShader: ModelProgram | null = null;
  const models = new Map<string, { gpu: ModelGpu; centreX: number; minY: number; centreZ: number }>();
  const cards = new Map<string, WebGLTexture>();

  let mesh = initialMesh;
  let meshGpu = uploadMesh(mesh);
  let plan: PiecePlan[] = [];
  let target: [number, number, number] = [0, 0, 0];
  let radius = 1;
  let fitDistance = 1;
  const fit = () => {
    target = [mesh.width / 2, mesh.height * TARGET_HEIGHT_SHARE, mesh.depth / 2];
    radius = Math.hypot(mesh.width, mesh.height, mesh.depth) / 2;
    fitDistance = (radius / Math.sin(FIELD_OF_VIEW / 2)) * FIT_MARGIN;
  };
  fit();

  // The camera for a view: turn about the room's middle, step back, look.
  const cameraFor = ({ width, height, yaw, pitch, zoom, walk }: ViewState) => {
    if (walk) {
      // standing inside: eyes at the person, a wider lens, no cut-away needed (every
      // wall faces in), and the whole room as far as the far wall.
      const view = walkView(walk, walk.eye, yaw, pitch);
      const far = Math.hypot(mesh.width, mesh.height, mesh.depth) * 1.2;
      const projection = perspective(WALK_FOV / zoom, width / Math.max(1, height), 0.05, far);
      return { turn: multiply(rotationX(-pitch), rotationY(-yaw)), view, projection, viewProjection: multiply(projection, view) };
    }
    const distance = fitDistance / zoom;
    const turn = multiply(rotationX(pitch), rotationY(yaw));
    const view = multiply(translation(0, 0, -distance), multiply(turn, translation(-target[0], -target[1], -target[2])));
    const projection = perspective(
      FIELD_OF_VIEW,
      width / Math.max(1, height),
      Math.max(0.05, distance - radius * 1.5),
      distance + radius * 1.5,
    );
    return { turn, view, projection, viewProjection: multiply(projection, view) };
  };

  return {
    setMesh(next) {
      freeMesh(meshGpu);
      mesh = next;
      meshGpu = uploadMesh(next);
      fit();
    },
    setModel(id, model, bitmaps) {
      models.get(id)?.gpu.dispose();
      modelShader ??= createModelProgram(gl);
      models.set(id, {
        gpu: uploadModel(gl, model, bitmaps),
        centreX: (model.min[0] + model.max[0]) / 2,
        minY: model.min[1],
        centreZ: (model.min[2] + model.max[2]) / 2,
      });
    },
    removeModel(id) {
      models.get(id)?.gpu.dispose();
      models.delete(id);
    },
    setCard(url, source) {
      const previous = cards.get(url);
      if (previous) gl.deleteTexture(previous);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      // SRGB8_ALPHA8: the picture is sRGB; the GPU hands the shader linear light.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (texture) cards.set(url, texture);
    },
    removeCard(url) {
      const texture = cards.get(url);
      if (texture) gl.deleteTexture(texture);
      cards.delete(url);
    },
    setPlan(next) {
      plan = next;
    },

    viewProjection(state) {
      return cameraFor(state).viewProjection;
    },

    draw(state: ViewState) {
      const { width, height, yaw, pitch } = state;
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      const { turn, view, projection, viewProjection } = cameraFor(state);
      const { walk } = state;

      // 1) the room
      gl.useProgram(program);
      gl.uniformMatrix4fv(uViewProjection, false, viewProjection);
      gl.uniform3f(uRoom, mesh.width, mesh.height, mesh.depth);
      gl.uniform3fv(uLightDir, LIGHT_DIRECTION);
      gl.uniform3fv(uLineColour, mesh.floorLine);
      gl.bindVertexArray(meshGpu.vao);
      gl.drawElements(gl.TRIANGLES, meshGpu.indexCount, gl.UNSIGNED_INT, 0);
      gl.bindVertexArray(null);

      // 2) models: the same room light, turned into camera space for the model shader
      if (modelShader) {
        const light = transformDirection(turn, LIGHT_DIRECTION);
        for (const entry of plan) {
          if (entry.mode !== "model" || !entry.modelId || !entry.modelScale) continue;
          const loaded = models.get(entry.modelId);
          if (!loaded) continue;
          const [sx, sy, sz] = entry.modelScale;
          const placement = multiply(
            translation(entry.x, entry.yBottom, entry.z),
            multiply(scaling(sx, sy, sz), translation(-loaded.centreX, -loaded.minY, -loaded.centreZ)),
          );
          loaded.gpu.draw(modelShader, multiply(view, placement), projection, light);
        }
      }

      // 3) photos
      gl.useProgram(cardProgram);
      gl.uniform1i(cTexture, 0);
      gl.disable(gl.CULL_FACE); // a photo seen from behind still shows (mirrored)
      gl.activeTexture(gl.TEXTURE0);
      gl.bindVertexArray(cardVao);
      for (const entry of plan) {
        if ((entry.mode !== "card" && entry.mode !== "block+card") || !entry.cardUrl) continue;
        const texture = cards.get(entry.cardUrl);
        if (!texture || entry.cardW === undefined || entry.cardH === undefined) continue;
        // "camera": turn the opposite way to the room, so the photo keeps facing the viewer
        // standing inside, each photo turns toward the person's own spot
        const facing =
          entry.facing !== "camera"
            ? null
            : walk
              ? rotationY(Math.atan2(walk.x - entry.x, walk.z - (entry.cardZ ?? entry.z)))
              : rotationY(-yaw);
        const place = translation(entry.x, entry.yBottom, entry.cardZ ?? entry.z);
        const placed = facing ? multiply(place, facing) : place;
        gl.uniformMatrix4fv(cMatrix, false, multiply(viewProjection, multiply(placed, scaling(entry.cardW, entry.cardH, 1))));
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.bindVertexArray(null);

      // 4) soft shadows under standing pieces (blended; never write depth)
      // (from inside the room the floor is always above the eye: always draw them)
      if (mesh.shadows.length > 0 && (walk || pitch > -0.05)) {
        gl.useProgram(shadowProgram);
        gl.uniformMatrix4fv(sViewProjection, false, viewProjection);
        gl.disable(gl.CULL_FACE);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindVertexArray(shadowVao);
        for (const shadow of mesh.shadows) {
          gl.uniform2f(sCentre, shadow.x, shadow.z);
          gl.uniform2f(sRadius, shadow.radiusX, shadow.radiusZ);
          gl.uniform1f(sStrength, shadow.strength);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        gl.bindVertexArray(null);
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      }
    },
    dispose() {
      freeMesh(meshGpu);
      models.forEach((loaded) => loaded.gpu.dispose());
      models.clear();
      cards.forEach((texture) => gl.deleteTexture(texture));
      cards.clear();
      if (modelShader) gl.deleteProgram(modelShader.program);
      gl.deleteProgram(program);
      gl.deleteProgram(shadowProgram);
      gl.deleteProgram(cardProgram);
      gl.deleteBuffer(quadBuffer);
      gl.deleteBuffer(cardBuffer);
      gl.deleteVertexArray(shadowVao);
      gl.deleteVertexArray(cardVao);
    },
  };
}
