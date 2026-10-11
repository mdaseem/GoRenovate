// Draws the room preview (backdrop + every piece, as currently arranged) onto a
// canvas and returns a PNG — for "Download image" / sharing to a chat app.
//
// It reads what is ON SCREEN (positions, sizes, flips, z-order) from the DOM
// instead of recomputing the layout, so the image always matches what the user
// sees. Pieces are same-origin SVG/PNG files; a cross-origin image would taint
// the canvas and make toBlob throw, which the caller reports as a plain error.

const MAX_WIDTH = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image failed to load"));
    image.src = src;
  });
}

// "50% 100%" -> [0.5, 1]
function parseObjectPosition(value: string): [number, number] {
  const [x, y] = value.split(" ").map((part) => parseFloat(part) / 100);
  return [Number.isFinite(x) ? x : 0.5, Number.isFinite(y) ? y : 0.5];
}

export async function renderSceneToBlob(sceneEl: HTMLElement, caption: string): Promise<Blob> {
  const sceneRect = sceneEl.getBoundingClientRect();
  if (sceneRect.width === 0 || sceneRect.height === 0) throw new Error("scene has no size");
  const ratio = Math.min(2, MAX_WIDTH / sceneRect.width);
  const width = Math.round(sceneRect.width * ratio);
  const height = Math.round(sceneRect.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  // Backdrop: the inline SVG, re-sized to the canvas so its own
  // "slice" cropping matches what is on screen.
  const backdrop = sceneEl.querySelector<SVGSVGElement>("svg[data-scene-backdrop]");
  if (backdrop) {
    const clone = backdrop.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }),
    );
    try {
      ctx.drawImage(await loadImage(url), 0, 0, width, height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Pieces, back to front.
  const pieces = [...sceneEl.querySelectorAll<HTMLElement>("button, [data-scene-piece]")]
    .map((el) => ({ el, z: Number(getComputedStyle(el).zIndex) || 0 }))
    .sort((a, b) => a.z - b.z);

  for (const { el } of pieces) {
    const style = getComputedStyle(el);
    ctx.save();
    ctx.globalAlpha = Number(style.opacity) || 1;
    const img = el.querySelector<HTMLImageElement>("img");
    if (img && img.complete && img.naturalWidth > 0) {
      const box = img.getBoundingClientRect();
      const imgStyle = getComputedStyle(img);
      const bx = (box.left - sceneRect.left) * ratio;
      const by = (box.top - sceneRect.top) * ratio;
      const bw = box.width * ratio;
      const bh = box.height * ratio;
      // object-fit: contain, anchored by object-position (floor pieces sit on their bottom edge).
      const fit = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
      const dw = img.naturalWidth * fit;
      const dh = img.naturalHeight * fit;
      const [px, py] = parseObjectPosition(imgStyle.objectPosition);
      const dx = bx + (bw - dw) * px;
      const dy = by + (bh - dh) * py;
      // A flipped piece is mirrored by CSS (scaleX(-1)): read the matrix back.
      const matrix = imgStyle.transform !== "none" ? new DOMMatrix(imgStyle.transform) : null;
      if (matrix && matrix.a < 0) {
        ctx.translate(bx + bw / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(bx + bw / 2), 0);
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      // No cutout (labelled tile): a soft box with the product name.
      const box = el.getBoundingClientRect();
      const bx = (box.left - sceneRect.left) * ratio;
      const by = (box.top - sceneRect.top) * ratio;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.strokeStyle = "rgba(26,31,46,0.35)";
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(bx, by, box.width * ratio, box.height * ratio, 8);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1a1f2e";
      ctx.font = `${Math.max(11, 11 * ratio)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        (el.getAttribute("aria-label") ?? "").split(".")[0].slice(0, 28),
        bx + (box.width * ratio) / 2,
        by + (box.height * ratio) / 2,
      );
    }
    ctx.restore();
  }

  // Caption, so a shared picture says what it is.
  const fontSize = Math.max(13, Math.round(width * 0.022));
  ctx.font = `600 ${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(caption).width;
  const pad = fontSize * 0.6;
  ctx.fillStyle = "rgba(26,31,46,0.62)";
  ctx.beginPath();
  ctx.roundRect(pad, height - fontSize * 2.2, textWidth + pad * 2, fontSize * 1.7, fontSize * 0.85);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.fillText(caption, pad * 2, height - fontSize * 1.0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("could not encode PNG"))), "image/png");
  });
}
