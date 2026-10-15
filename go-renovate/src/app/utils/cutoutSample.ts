// A quick look at a product's cutout picture, for giving it volume in the
// Look-around room (see the room-visual-preview skill, "phase 2"):
//   - `colour`: the picture's average colour — the side and top faces of a boxy
//     piece (a wardrobe, a bed) are drawn in shades of it;
//   - `solidBottom`: how far down the picture the body goes before it narrows to
//     legs (0–1 of its height), so a sofa's side face stops where its legs begin.
//
// It runs in the browser on the same file the card already shows (cached, so
// each picture is read once). A picture from another website cannot be read
// (the canvas would be "tainted"); that returns null and the piece simply keeps
// the neutral look instead of failing.

export interface CutoutSample {
  colour: string; // "rgb(r, g, b)"
  solidBottom: number;
}

const SIZE = 48;
const OPAQUE = 200; // alpha above which a pixel counts as part of the product
// A row counts as "body" when at least this share of the widest row is opaque.
const BODY_ROW_SHARE = 0.5;

const cache = new Map<string, Promise<CutoutSample | null>>();

function read(url: string): Promise<CutoutSample | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(image, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        const rowOpaque = new Array<number>(SIZE).fill(0);
        for (let y = 0; y < SIZE; y += 1) {
          for (let x = 0; x < SIZE; x += 1) {
            const i = (y * SIZE + x) * 4;
            if (data[i + 3] < OPAQUE) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count += 1;
            rowOpaque[y] += 1;
          }
        }
        if (count === 0) return resolve(null);

        const widest = Math.max(...rowOpaque);
        let bottomRow = SIZE - 1;
        while (bottomRow > 0 && rowOpaque[bottomRow] < widest * BODY_ROW_SHARE) bottomRow -= 1;

        resolve({
          colour: `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`,
          solidBottom: (bottomRow + 1) / SIZE,
        });
      } catch {
        // Cross-origin picture: the canvas cannot be read. Not an error.
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export function sampleCutout(url: string): Promise<CutoutSample | null> {
  let sample = cache.get(url);
  if (!sample) {
    sample = read(url);
    cache.set(url, sample);
  }
  return sample;
}
