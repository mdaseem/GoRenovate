"use client";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./GLViewer.module.css";
import { useGLCanvas } from "../../CustomHooks/useGLCanvas";
import { ZOOM_STEP, useOrbitCamera } from "../../CustomHooks/useOrbitCamera";
import { createCubeScene } from "@/app/utils/gl/cubeScene";
import { Drawable, MAX_ZOOM, MIN_ZOOM } from "@/app/utils/gl/drawable";
import { MAX_FILE_BYTES, ModelError, ParsedModel, RECOMMENDED_TRIANGLES, modelSizeCm, parseGlb } from "@/app/utils/gl/glb";
import { createModelScene, decodeImages } from "@/app/utils/gl/modelScene";
import { fetchGlb } from "@/app/utils/gl/modelLoader";
import { ModelFacts } from "@/app/utils/gl/modelCheck";

// What the viewer shows: the built-in test cube, a .glb served by us, or a .glb
// the visitor picked on their own device (read in the browser, never uploaded).
export type ViewerSource =
  | { type: "cube" }
  | { type: "url"; url: string; label: string }
  | { type: "file"; file: File; label: string };

// What the viewer learned about the model it is showing (null = none / the cube).
export type LoadedModelFacts = ModelFacts & { label: string; warnings: string[] };

type LoadState = "idle" | "loading" | "failed";

interface Loaded {
  model: ParsedModel;
  bitmaps: ImageBitmap[];
}

const SPIN_RADIANS_PER_SECOND = 0.6;
const MAX_PITCH = Math.PI / 2 - 0.05;
const START_VIEW = { yaw: 0.6, pitch: 0.45, zoom: 1 };

const closeAll = (loaded: Loaded | null) => loaded?.bitmaps.forEach((bitmap) => bitmap.close());

async function readSource(source: ViewerSource, signal: AbortSignal): Promise<ArrayBuffer> {
  if (source.type === "file") {
    if (source.file.size > MAX_FILE_BYTES) {
      throw new ModelError("too-large", "This file is bigger than 12 MB. Compress its pictures or simplify it, then try again.");
    }
    return source.file.arrayBuffer();
  }
  if (source.type !== "url") throw new ModelError("invalid", "Nothing to load.");
  return fetchGlb(source.url, signal);
}

// The in-house product viewer. React owns the element, the buttons and the loading
// states; the drawing is plain WebGL in utils/gl. The loop only runs while something
// is moving AND the viewer is on screen — nothing is drawn when idle, offscreen or in
// a hidden tab, and the GPU context is released on unmount.
// `poster` is the product's flat picture: shown while the model downloads, and kept
// as the fallback if 3D is unavailable or the model fails.
export default function GLViewer({
  source,
  poster,
  showInfo = true,
  onModelChange,
}: {
  source: ViewerSource;
  poster?: { src: string; alt: string };
  // The technical panel (triangles, size) is for the lab, not shoppers.
  showInfo?: boolean;
  // Called when a model finishes loading (with its measurements) or the cube replaces it.
  onModelChange?: (facts: LoadedModelFacts | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Drawable | null>(null);
  const loadedRef = useRef<Loaded | null>(null); // null = the test cube
  const loadToken = useRef(0);
  const onModelChangeRef = useRef(onModelChange);
  useEffect(() => {
    onModelChangeRef.current = onModelChange;
  }, [onModelChange]);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const spinningRef = useRef(false);

  const [spinning, setSpinning] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [loadMessage, setLoadMessage] = useState("");
  const [info, setInfo] = useState<{ label: string; triangles: number; size: string; warnings: string[] } | null>(null);

  // The frame loop is defined below; this stable function lets the camera hook ask for a frame.
  const tickRef = useRef<FrameRequestCallback>(() => {});
  const requestFrame = useCallback(() => {
    if (!frameRef.current) frameRef.current = requestAnimationFrame((time) => tickRef.current(time));
  }, []);
  // Grabbing or keying the camera stops the idle spin.
  const stopSpin = useCallback(() => {
    spinningRef.current = false;
    setSpinning(false);
  }, []);
  const orbit = useOrbitCamera({
    initial: START_VIEW,
    minPitch: -MAX_PITCH,
    maxPitch: MAX_PITCH,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    canvasRef,
    requestFrame,
    onUserInput: stopSpin,
  });
  const { camera, coast } = orbit;

  // WebGL context, sizing, visibility and context loss live in the shared hook;
  // the scene objects and frame loop stay here (the handlers are read at call time).
  const firstReady = useRef(true);
  const { status, message, glRef, visibleRef, reportError } = useGLCanvas(canvasRef, requestFrame, {
    attach: (gl) => attachScene(gl),
    onContextLost: () => {
      sceneRef.current = null;
    },
    onTeardown: () => {
      loadToken.current += 1; // any load still in flight is now stale
      sceneRef.current?.dispose();
      sceneRef.current = null;
      closeAll(loadedRef.current);
      loadedRef.current = null;
    },
    cancelFrame: () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    },
    onReady: () => {
      // People who asked for less motion get a still model they can turn themselves.
      if (firstReady.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setSpin(true);
      firstReady.current = false;
    },
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene) return;
    scene.draw({
      width: canvas.width,
      height: canvas.height,
      ...camera.current,
    });
  }, [camera]);

  // One frame; asks for the next only while the model is spinning on screen.
  const tick = useCallback(
    (time: number) => {
      frameRef.current = 0;
      const elapsed = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;
      const active = visibleRef.current && !document.hidden;
      const dt = Math.min(elapsed, 0.1);
      const shouldSpin = spinningRef.current && active;
      if (shouldSpin) camera.current.yaw += SPIN_RADIANS_PER_SECOND * dt;

      // Coasting after a flick: keep turning, slowing down, until nearly still.
      const coasting = coast(dt, active);

      draw();
      if (shouldSpin || coasting) frameRef.current = requestAnimationFrame(tick);
      else lastTimeRef.current = 0;
    },
    [draw, camera, coast, visibleRef],
  );
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const setSpin = useCallback(
    (on: boolean) => {
      spinningRef.current = on;
      setSpinning(on);
      if (on) requestFrame();
    },
    [requestFrame],
  );

  // (Re)build what is drawn from whatever is currently loaded; the old one's GPU
  // memory is released first. Throws if the GPU refuses (the callers report it).
  const attachScene = useCallback((gl: WebGL2RenderingContext | null) => {
    sceneRef.current?.dispose();
    sceneRef.current = null;
    if (!gl) return;
    const loaded = loadedRef.current;
    sceneRef.current = loaded ? createModelScene(gl, loaded.model, loaded.bitmaps) : createCubeScene(gl);
    requestFrame();
  }, [requestFrame]);


  // Load whatever `source` asks for. A newer request makes an older one stale, so
  // quickly switching never shows (or leaks) the wrong model; a failed load leaves
  // the previous model on screen and says what went wrong.
  useEffect(() => {
    const token = ++loadToken.current;
    const abort = new AbortController();

    if (source.type === "cube") {
      closeAll(loadedRef.current);
      loadedRef.current = null;
      setLoadState("idle");
      setInfo(null);
      onModelChangeRef.current?.(null);
      try {
        attachScene(glRef.current);
      } catch (error) {
        reportError(error instanceof Error ? error.message : "Unknown error");
      }
      return () => abort.abort();
    }

    setLoadState("loading");
    setLoadMessage("");
    (async () => {
      try {
        const buffer = await readSource(source, abort.signal);
        const model = parseGlb(buffer);
        const bitmaps = await decodeImages(model);
        if (token !== loadToken.current) {
          bitmaps.forEach((bitmap) => bitmap.close());
          return;
        }
        const previous = loadedRef.current;
        loadedRef.current = { model, bitmaps };
        try {
          attachScene(glRef.current);
        } catch (error) {
          // The GPU refused this model: put the previous one back.
          closeAll(loadedRef.current);
          loadedRef.current = previous;
          try {
            attachScene(glRef.current);
          } catch {
            /* the previous scene built once already; if it fails now the context is gone */
          }
          throw error instanceof ModelError
            ? error
            : new ModelError("too-complex", "This model is too heavy for the graphics card to show.");
        }
        closeAll(previous);
        const size = modelSizeCm(model);
        setInfo({
          label: source.label,
          triangles: model.triangleCount,
          size: `${Math.round(size.w)} × ${Math.round(size.d)} × ${Math.round(size.h)} cm`,
          warnings: model.warnings,
        });
        setLoadState("idle");
        onModelChangeRef.current?.({
          label: source.label,
          fileBytes: buffer.byteLength,
          triangles: model.triangleCount,
          sizeCm: size,
          textures: bitmaps.map((bitmap) => ({ width: bitmap.width, height: bitmap.height })),
          warnings: model.warnings,
        });
      } catch (error) {
        if (token !== loadToken.current || abort.signal.aborted) return;
        setLoadMessage(
          error instanceof ModelError
            ? error.message
            : "This file couldn't be opened as a 3D model.",
        );
        setLoadState("failed");
      }
    })();

    return () => abort.abort();
  }, [source, attachScene, glRef, reportError]);

  // The flat picture shows until a model is actually on screen, and stays if 3D cannot run.
  const showPoster = Boolean(poster) && !posterFailed && (status !== "ready" || loadState !== "idle" || !info);
  const unavailable = status === "unsupported" || status === "error" || status === "lost";
  const subject = source.type === "cube" ? "test cube" : source.label;

  return (
    <section
      className={styles.viewer}
      data-gl-status={status}
      data-load-state={loadState}
      aria-label="3D viewer"
    >
      <div className={styles.stage}>
        {showPoster && poster && (
          <Image
            src={poster.src}
            alt={poster.alt}
            fill
            sizes="(max-width: 760px) 100vw, 760px"
            className={styles.poster}
            onError={() => setPosterFailed(true)}
          />
        )}
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={`A 3D view of the ${subject}. Drag it, or use the arrow keys, to turn it. Pinch, or press plus and minus, to zoom.`}
          tabIndex={0}
          {...orbit.handlers}
        />
        {loadState === "loading" && (
          <p className={styles.loading} role="status">
            Loading the model…
          </p>
        )}
        {unavailable && (
          <p className={styles.message} role="alert">
            {status === "unsupported" &&
              "This browser can't show 3D here. You'll still see the normal photos."}
            {status === "lost" &&
              "The 3D view was paused by your device. Reload the page to bring it back."}
            {status === "error" && `The 3D view couldn't start. ${message}`}
          </p>
        )}
        {!unavailable && loadState === "failed" && (
          <p className={styles.message} role="alert">
            {loadMessage}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          onClick={() => setSpin(!spinning)}
          aria-pressed={spinning}
          disabled={status !== "ready"}
        >
          {spinning ? "Pause spin" : "Spin"}
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={orbit.reset}
          disabled={status !== "ready"}
        >
          Reset view
        </button>
        <button
          type="button"
          className={styles.zoomButton}
          onClick={() => orbit.zoomBy(1 / ZOOM_STEP)}
          aria-label="Zoom out"
          disabled={status !== "ready" || orbit.zoomLimit === "min"}
        >
          −
        </button>
        <button
          type="button"
          className={styles.zoomButton}
          onClick={() => orbit.zoomBy(ZOOM_STEP)}
          aria-label="Zoom in"
          disabled={status !== "ready" || orbit.zoomLimit === "max"}
        >
          +
        </button>
      </div>

      {showInfo && info && (
        <dl className={styles.info} aria-label="About this model">
          <div>
            <dt>Model</dt>
            <dd>{info.label}</dd>
          </div>
          <div>
            <dt>Triangles</dt>
            <dd>
              {info.triangles.toLocaleString()}
              {info.triangles > RECOMMENDED_TRIANGLES ? " (heavy for phones)" : ""}
            </dd>
          </div>
          <div>
            <dt>Size (w × d × h)</dt>
            <dd>{info.size}</dd>
          </div>
          {info.warnings.length > 0 && (
            <div>
              <dt>Notes</dt>
              <dd>{info.warnings.join(" ")}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
