import { useCallback, useEffect, useRef, useState } from "react";

// The WebGL2 life of a <canvas>, shared by the product viewer and the 3D room:
// open the context, keep the drawing buffer sized to the element, notice when the
// canvas is off screen or the tab is hidden, survive the browser taking the GPU
// away (context lost / restored), and hand the context back when the canvas goes.
//
// The component keeps what is specific to it (its scene objects, its frame loop)
// and gives the hook small callbacks for those; they are read through a ref, so
// they may change every render without ever restarting the context.

export type GLStatus = "starting" | "ready" | "unsupported" | "lost" | "error";

export interface GLCanvasHandlers {
  // Build the scene on the (new) context. May throw: the message is shown.
  attach: (gl: WebGL2RenderingContext) => void;
  // The GPU was taken away: forget the scene objects (their memory is already gone).
  onContextLost: () => void;
  // The canvas is going away: dispose the scene objects and anything else.
  onTeardown: () => void;
  // Stop the component's frame loop.
  cancelFrame: () => void;
  // The context is up and the scene built (first time, and after a restore).
  onReady?: () => void;
}

const MAX_DEVICE_PIXEL_RATIO = 2; // beyond this the extra pixels cost battery, not clarity

export function useGLCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  requestFrame: () => void,
  handlers: GLCanvasHandlers,
) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });
  const requestFrameRef = useRef(requestFrame);
  useEffect(() => {
    requestFrameRef.current = requestFrame;
  }, [requestFrame]);

  const glRef = useRef<WebGL2RenderingContext | null>(null);
  // False while the canvas is scrolled out of view: the frame loop should idle.
  const visibleRef = useRef(true);
  const [status, setStatus] = useState<GLStatus>("starting");
  const [message, setMessage] = useState("");

  const reportError = useCallback((text: string) => {
    setMessage(text);
    setStatus("error");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ask = () => requestFrameRef.current();

    const start = () => {
      const gl = canvas.getContext("webgl2", {
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
      if (!gl) {
        setStatus("unsupported");
        return null;
      }
      glRef.current = gl;
      try {
        handlersRef.current.attach(gl);
      } catch (error) {
        reportError(error instanceof Error ? error.message : "Unknown error");
        return null;
      }
      setStatus("ready");
      handlersRef.current.onReady?.();
      return gl;
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ask();
    };

    const gl = start();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) ask();
    });
    intersection.observe(canvas);
    const onVisibility = () => {
      if (!document.hidden) ask();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // The browser can take the GPU away (tab switch on a weak phone, driver reset).
    const onLost = (event: Event) => {
      event.preventDefault(); // allows the browser to give the context back
      handlersRef.current.cancelFrame();
      handlersRef.current.onContextLost();
      setStatus("lost");
    };
    const onRestored = () => {
      if (start()) resize();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    resize();

    return () => {
      handlersRef.current.cancelFrame();
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      handlersRef.current.onTeardown();
      // Browsers allow only a handful of live WebGL contexts: hand this one back
      // once the canvas is really gone. (React in development unmounts and remounts
      // straight away on the SAME canvas; a context lost on purpose can never be
      // reused, so wait a tick and only release it if the canvas left the page.)
      const release = gl?.getExtension("WEBGL_lose_context");
      setTimeout(() => {
        if (!canvas.isConnected) release?.loseContext();
      }, 0);
      glRef.current = null;
    };
  }, [canvasRef, reportError]);

  return { status, message, glRef, visibleRef, reportError };
}
