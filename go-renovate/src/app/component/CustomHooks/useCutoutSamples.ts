"use client";
import { useEffect, useState } from "react";
import { CutoutSample, sampleCutout } from "@/app/utils/cutoutSample";

// Colour / body-height samples (see utils/cutoutSample) for a list of cutout
// URLs, filled in as each picture is read. Pieces render at once with a neutral
// look and pick their colours up a moment later; nothing waits on this.
export function useCutoutSamples(urls: readonly string[]): Record<string, CutoutSample> {
  const [samples, setSamples] = useState<Record<string, CutoutSample>>({});

  useEffect(() => {
    let cancelled = false;
    urls.forEach((url) => {
      sampleCutout(url).then((sample) => {
        if (cancelled || !sample) return;
        setSamples((previous) => (previous[url] ? previous : { ...previous, [url]: sample }));
      });
    });
    return () => {
      cancelled = true;
    };
  }, [urls]);

  return samples;
}
