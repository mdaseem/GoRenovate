import { useEffect, useRef } from "react";

// Shared across every hook instance so nested/stacked overlays each get
// their own history entry and only the topmost one reacts to a given
// back-button press, instead of every open overlay closing at once.
let targetDepth = 0;
let pushedDepth = 0;
let reconcileQueued = false;

interface OpenEntry {
  onClose: () => void;
}
const openStack: OpenEntry[] = [];

function reconcile() {
  reconcileQueued = false;
  while (pushedDepth < targetDepth) {
    pushedDepth += 1;
    window.history.pushState({ overlayDepth: pushedDepth }, "");
  }
  while (pushedDepth > targetDepth) {
    pushedDepth -= 1;
    window.history.back();
  }
}

function queueReconcile() {
  if (reconcileQueued) return;
  reconcileQueued = true;
  queueMicrotask(reconcile);
}

let popstateAttached = false;
function ensurePopstateListener() {
  if (popstateAttached) return;
  popstateAttached = true;
  window.addEventListener("popstate", () => {
    pushedDepth = Math.max(0, pushedDepth - 1);
    const top = openStack[openStack.length - 1];
    if (top) top.onClose();
  });
}

export function useCloseOnBackButton(isOpen: boolean, onClose: () => void) {
  const entryRef = useRef<OpenEntry | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    ensurePopstateListener();

    targetDepth += 1;
    const entry: OpenEntry = { onClose: () => onCloseRef.current() };
    entryRef.current = entry;
    openStack.push(entry);
    queueReconcile();

    return () => {
      const idx = openStack.indexOf(entry);
      if (idx !== -1) openStack.splice(idx, 1);
      entryRef.current = null;
      targetDepth -= 1;
      queueReconcile();
    };
  }, [isOpen]);
}
