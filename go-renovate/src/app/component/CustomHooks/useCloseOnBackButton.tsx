import { useEffect, useRef } from "react";

// Shared across every hook instance so nested/stacked overlays each get
// their own history entry and only the topmost one reacts to a given
// back-button press, instead of every open overlay closing at once.
let openOverlayDepth = 0;

export function useCloseOnBackButton(isOpen: boolean, onClose: () => void) {
  const depthRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    openOverlayDepth += 1;
    depthRef.current = openOverlayDepth;
    window.history.pushState({ overlayDepth: depthRef.current }, "");

    const handlePopState = () => {
      if (depthRef.current === 0 || openOverlayDepth !== depthRef.current) {
        return;
      }
      openOverlayDepth -= 1;
      depthRef.current = 0;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (depthRef.current !== 0 && openOverlayDepth === depthRef.current) {
        openOverlayDepth -= 1;
        depthRef.current = 0;
        window.history.back();
      }
    };
  }, [isOpen]);
}
