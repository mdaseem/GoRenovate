import { useEffect, useState } from "react";

// Matches Header's approx rendered height until measured.
const DEFAULT_HEADER_HEIGHT = 90;

/**
 * Header publishes its real, responsive height (see Header.tsx). Track it so
 * the sticky category headings and scroll-to-category math stay correct
 * across breakpoints instead of relying on a guessed offset.
 */
export function useHeaderHeight(): number {
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);

  useEffect(() => {
    const headerEl = document.querySelector<HTMLElement>("header.header");
    if (headerEl) setHeaderHeight(headerEl.offsetHeight);

    const handleHeaderResize = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") setHeaderHeight(detail);
    };

    window.addEventListener("site-header-resize", handleHeaderResize);
    return () =>
      window.removeEventListener("site-header-resize", handleHeaderResize);
  }, []);

  return headerHeight;
}
