"use client";
import { useEffect, useRef, useState } from "react";

// True once the element has been within `rootMargin` of the viewport — and it
// stays true after that (content that has mounted is not torn down again on
// scroll). Lets heavy, off-screen content (e.g. a scene thumbnail with its
// images) wait until it is about to be seen. Without IntersectionObserver
// (very old browsers) content simply renders straight away.
export function useInView<T extends Element>(rootMargin = "300px") {
  const ref = useRef<T>(null);
  // Always false on the first render so server and client markup agree.
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView] as const;
}
