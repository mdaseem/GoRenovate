// Milestone 2 of the in-house product viewer: draw a model read by glb.ts.
// Same pipeline as the cube (vertex buffers → shaders → matrices → lighting), but
// the geometry comes from the file, each piece has its own material, and a
// material can carry a picture (texture).
import { Drawable, ViewState } from "./drawable";
import { MAX_TEXTURE_SIZE, ModelError, ModelMaterial, ModelSampler, ParsedModel } from "./glb";
import { lookAt, multiply, normalMatrix, perspective, rotationX, rotationY, translation } from "./mat4";
import { createProgram } from "./shader";

// ── pictures ────────────────────────────────────────────────────────────────
// The browser decodes the PNG / JPEG for us. "none" keeps the colours exactly as
// stored: the GPU converts them from sRGB to linear light when it reads them.
export async function decodeImages(model: ParsedModel): Promise<ImageBitmap[]> {
  const bitmaps: ImageBitmap[] = [];
  try {
    for (const image of model.images) {
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(new Blob([image.bytes as BlobPart], { type: image.mimeType }), {
          premultiplyAlpha: "none",
          colorSpaceConversion: "none",
        });
      } catch {
        throw new ModelError("invalid", "A picture on the model couldn't be read. Try exporting it again.");
      }
      if (bitmap.width > MAX_TEXTURE_SIZE || bitmap.height > MAX_TEXTURE_SIZE) {
        bitmap.close();
        throw new ModelError(
          "too-complex",
          `A picture on the model is larger than ${MAX_TEXTURE_SIZE} × ${MAX_TEXTURE_SIZE} pixels. Shrink it and export again.`,
        );
      }
      bitmaps.push(bitmap);
    }
  } catch (error) {
    bitmaps.forEach((bitmap) => bitmap.close());
    throw error;
  }
  return bitmaps;
}

// ── shaders ─────────────────────────────────────────────────────────────────
const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec3 aColour;   // per-vertex colour (white when the file has none)

uniform mat4 uModelView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;

out vec3 vNormal;
out vec2 vUv;
out vec3 vColour;
out vec3 vViewPosition;

void main() {
  vec4 viewPosition = uModelView * vec4(aPosition, 1.0);
  vViewPosition = viewPosition.xyz;
  vNormal = uNormalMatrix * aNormal;
  vUv = aUv;
  vColour = aColour;
  gl_Position = uProjection * viewPosition;
}`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec3 vNormal;
in vec2 vUv;
in vec3 vColour;
in vec3 vViewPosition;

uniform vec4 uBaseColour;        // the material's colour factor (linear light)
uniform sampler2D uTexture;
uniform bool uHasTexture;
uniform bool uAlphaMask;
uniform float uAlphaCutoff;
uniform float uShininess;
uniform float uSpecular;
uniform vec3 uLightDirection;    // camera space, pointing TOWARD the light

out vec4 outColour;

void main() {
  vec4 base = uBaseColour * vec4(vColour, 1.0);
  // The texture is stored as sRGB; the GPU hands us linear light when it is read.
  if (uHasTexture) base *= texture(uTexture, vUv);
  if (uAlphaMask && base.a < uAlphaCutoff) discard;

  vec3 normal = normalize(vNormal);
  // A two-sided surface seen from behind: flip the normal so it is lit like a front.
  if (!gl_FrontFacing) normal = -normal;
  vec3 light = normalize(uLightDirection);

  float diffuse = max(dot(normal, light), 0.0);
  vec3 toEye = normalize(-vViewPosition);
  vec3 halfway = normalize(light + toEye);
  float glint = pow(max(dot(normal, halfway), 0.0), uShininess) * uSpecular;

  vec3 lit = base.rgb * (0.3 + 0.8 * diffuse) + vec3(glint);
  outColour = vec4(pow(lit, vec3(1.0 / 2.2)), 1.0);
}`;

// The contact shadow: a flat square under the model whose pixels fade from dark
// at the middle to clear at the edge — a soft blob that makes the model look
// like it is standing on something instead of floating.
const SHADOW_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 aCorner;   // (-1..1, -1..1) across the ground square
uniform mat4 uModelView;
uniform mat4 uProjection;
uniform vec3 uCentre;                   // middle of the square, on the ground
uniform float uHalfSize;
out vec2 vCorner;
void main() {
  vCorner = aCorner;
  vec3 ground = uCentre + vec3(aCorner.x, 0.0, aCorner.y) * uHalfSize;
  gl_Position = uProjection * uModelView * vec4(ground, 1.0);
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

const LIGHT_DIRECTION = [-0.45, 0.65, 0.6];
const FIELD_OF_VIEW = (35 * Math.PI) / 180;
// Leave a little air around the model when it is fitted to the frame.
const FIT_MARGIN = 1.12;

const needsMipmaps = (sampler: ModelSampler) => sampler.minFilter >= 9984 && sampler.minFilter <= 9987;

interface GpuPrimitive {
  vao: WebGLVertexArrayObject;
  buffers: WebGLBuffer[];
  indexCount: number;
  indexType: number;
  material: ModelMaterial;
  hasUvs: boolean;
  hasColours: boolean;
}

// The model shader and where its inputs live. One per context, shared by every
// model drawn with it (the product viewer draws one; the 3D room draws several).
export interface ModelProgram {
  program: WebGLProgram;
  uModelView: WebGLUniformLocation | null;
  uProjection: WebGLUniformLocation | null;
  uNormalMatrix: WebGLUniformLocation | null;
  uLightDirection: WebGLUniformLocation | null;
  uBaseColour: WebGLUniformLocation | null;
  uTexture: WebGLUniformLocation | null;
  uHasTexture: WebGLUniformLocation | null;
  uAlphaMask: WebGLUniformLocation | null;
  uAlphaCutoff: WebGLUniformLocation | null;
  uShininess: WebGLUniformLocation | null;
  uSpecular: WebGLUniformLocation | null;
}

export function createModelProgram(gl: WebGL2RenderingContext): ModelProgram {
  const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  const uniform = (name: string) => gl.getUniformLocation(program, name);
  return {
    program,
    uModelView: uniform("uModelView"),
    uProjection: uniform("uProjection"),
    uNormalMatrix: uniform("uNormalMatrix"),
    uLightDirection: uniform("uLightDirection"),
    uBaseColour: uniform("uBaseColour"),
    uTexture: uniform("uTexture"),
    uHasTexture: uniform("uHasTexture"),
    uAlphaMask: uniform("uAlphaMask"),
    uAlphaCutoff: uniform("uAlphaCutoff"),
    uShininess: uniform("uShininess"),
    uSpecular: uniform("uSpecular"),
  };
}

// A model on the graphics card (geometry + pictures), ready to be drawn any
// number of times at any position.
export interface ModelGpu {
  // Draw with the given matrices; the light direction is in CAMERA space.
  draw: (
    shader: ModelProgram,
    modelView: Float32Array,
    projection: Float32Array,
    lightDirection: readonly number[],
  ) => void;
  dispose: () => void;
}

export function uploadModel(gl: WebGL2RenderingContext, model: ParsedModel, bitmaps: ImageBitmap[]): ModelGpu {
  // ── pictures → GPU textures (one per picture, using the first material's sampler)
  const textures: (WebGLTexture | null)[] = bitmaps.map(() => null);
  model.materials.forEach((material) => {
    const index = material.imageIndex;
    if (index === null || textures[index]) return;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // glTF's texture origin is already top-left
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // SRGB8_ALPHA8 = "these bytes are sRGB; give me linear light" (also correct for mipmaps)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, bitmaps[index]);
    if (needsMipmaps(material.sampler)) gl.generateMipmap(gl.TEXTURE_2D);
    const { sampler } = material;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
    textures[index] = texture;
  });

  // ── each primitive → buffers + a vertex array object
  const gpu: GpuPrimitive[] = model.primitives.map((primitive) => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffers: WebGLBuffer[] = [];
    const attribute = (location: number, data: Float32Array, size: number) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      buffers.push(buffer);
    };
    attribute(0, primitive.positions, 3);
    attribute(1, primitive.normals, 3);
    if (primitive.uvs) attribute(2, primitive.uvs, 2);
    if (primitive.colours) attribute(3, primitive.colours, 3);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, primitive.indices, gl.STATIC_DRAW);
    buffers.push(indexBuffer);
    gl.bindVertexArray(null);
    return {
      vao: vao as WebGLVertexArrayObject,
      buffers,
      indexCount: primitive.indices.length,
      indexType: primitive.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
      material: model.materials[primitive.materialIndex],
      hasUvs: primitive.uvs !== null,
      hasColours: primitive.colours !== null,
    };
  });

  return {
    draw(shader, modelView, projection, lightDirection) {
      gl.useProgram(shader.program);
      gl.uniformMatrix4fv(shader.uModelView, false, modelView);
      gl.uniformMatrix4fv(shader.uProjection, false, projection);
      gl.uniformMatrix3fv(shader.uNormalMatrix, false, normalMatrix(modelView));
      gl.uniform3fv(shader.uLightDirection, lightDirection);
      gl.uniform1i(shader.uTexture, 0);

      for (const primitive of gpu) {
        const { material } = primitive;
        // Missing optional data: the attribute stays off and uses these fixed values.
        if (!primitive.hasUvs) gl.vertexAttrib2f(2, 0, 0);
        if (!primitive.hasColours) gl.vertexAttrib3f(3, 1, 1, 1);

        if (material.doubleSided) gl.disable(gl.CULL_FACE);
        else {
          gl.enable(gl.CULL_FACE);
          gl.cullFace(gl.BACK);
        }
        gl.uniform4fv(shader.uBaseColour, material.baseColour);
        const texture = material.imageIndex === null ? null : textures[material.imageIndex];
        gl.uniform1i(shader.uHasTexture, texture ? 1 : 0);
        if (texture) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
        }
        gl.uniform1i(shader.uAlphaMask, material.alphaMask ? 1 : 0);
        gl.uniform1f(shader.uAlphaCutoff, material.alphaCutoff);
        // A rough stand-in for physically based shading: smooth = a tight, strong glint.
        gl.uniform1f(shader.uShininess, 6 + (1 - material.roughness) * 120);
        gl.uniform1f(shader.uSpecular, (0.04 + 0.3 * material.metallic) * (1 - 0.7 * material.roughness));

        gl.bindVertexArray(primitive.vao);
        gl.drawElements(gl.TRIANGLES, primitive.indexCount, primitive.indexType, 0);
      }
      gl.bindVertexArray(null);
    },
    dispose() {
      gpu.forEach((primitive) => {
        primitive.buffers.forEach((buffer) => gl.deleteBuffer(buffer));
        gl.deleteVertexArray(primitive.vao);
      });
      textures.forEach((texture) => texture && gl.deleteTexture(texture));
    },
  };
}

export function createModelScene(
  gl: WebGL2RenderingContext,
  model: ParsedModel,
  bitmaps: ImageBitmap[],
): Drawable {
  const shader = createModelProgram(gl);
  const uploaded = uploadModel(gl, model, bitmaps);

  // ── the contact shadow (one small square, its own tiny program)
  const shadowProgram = createProgram(gl, SHADOW_VERTEX_SHADER, SHADOW_FRAGMENT_SHADER);
  const shadowUniform = (name: string) => gl.getUniformLocation(shadowProgram, name);
  const sModelView = shadowUniform("uModelView");
  const sProjection = shadowUniform("uProjection");
  const sCentre = shadowUniform("uCentre");
  const sHalfSize = shadowUniform("uHalfSize");
  const sStrength = shadowUniform("uStrength");
  const shadowVao = gl.createVertexArray();
  gl.bindVertexArray(shadowVao);
  const shadowBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, shadowBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // ── fit the camera: centre the model's bounding box, and back off until its
  //    bounding SPHERE fits the field of view, so any model, big or small, fills the frame.
  const centre: [number, number, number] = [
    (model.min[0] + model.max[0]) / 2,
    (model.min[1] + model.max[1]) / 2,
    (model.min[2] + model.max[2]) / 2,
  ];
  const radius = Math.max(
    1e-3,
    Math.hypot(model.max[0] - model.min[0], model.max[1] - model.min[1], model.max[2] - model.min[2]) / 2,
  );
  const fitDistance = (radius / Math.sin(FIELD_OF_VIEW / 2)) * FIT_MARGIN;
  const recentre = translation(-centre[0], -centre[1], -centre[2]);
  // The shadow sits at the model's lowest point, a little wider than its footprint.
  const shadowHalfSize = (Math.max(model.max[0] - model.min[0], model.max[2] - model.min[2]) / 2) * 1.35 + 1e-3;

  return {
    draw({ width, height, yaw, pitch, zoom }: ViewState) {
      // Zooming = moving the camera closer along its line of sight.
      const distance = fitDistance / zoom;
      const view = lookAt([0, 0, distance], [0, 0, 0], [0, 1, 0]);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      // turn about the model's own centre, then look at it from `distance`
      const modelView = multiply(view, multiply(rotationX(pitch), multiply(rotationY(yaw), recentre)));
      const projection = perspective(
        FIELD_OF_VIEW,
        width / Math.max(1, height),
        Math.max(0.01, distance - radius * 2),
        distance + radius * 2,
      );

      // Ground shadow first (it is under everything), only when seen from above the
      // floor. It blends over the transparent page and never writes depth.
      if (pitch > -0.05) {
        gl.useProgram(shadowProgram);
        gl.uniformMatrix4fv(sModelView, false, modelView);
        gl.uniformMatrix4fv(sProjection, false, projection);
        gl.uniform3f(sCentre, centre[0], model.min[1], centre[2]);
        gl.uniform1f(sHalfSize, shadowHalfSize);
        gl.uniform1f(sStrength, 0.4);
        gl.disable(gl.CULL_FACE);
        gl.depthMask(false);
        gl.enable(gl.BLEND);
        // The canvas expects premultiplied colour, so alpha is added up separately.
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindVertexArray(shadowVao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      }

      uploaded.draw(shader, modelView, projection, LIGHT_DIRECTION);
    },
    dispose() {
      uploaded.dispose();
      gl.deleteProgram(shader.program);
      gl.deleteBuffer(shadowBuffer);
      gl.deleteVertexArray(shadowVao);
      gl.deleteProgram(shadowProgram);
    },
  };
}
