import { useEffect, useRef } from "react";


let targetDepth = 0;
let pushedDepth = 0;
let reconcileQueued = false;

let pendingProgrammaticPops = 0;
let skipNextPop = false;

interface OpenEntry {
  onClose: () => void;
}
const openStack: OpenEntry[] = [];

export function skipHistoryPopOnNextClose() {
  skipNextPop = true;
}

function reconcile() {
  reconcileQueued = false;
  while (pushedDepth < targetDepth) {
    pushedDepth += 1;
    window.history.pushState({ overlayDepth: pushedDepth }, "");
  }
  while (pushedDepth > targetDepth) {
    pushedDepth -= 1;
    if (skipNextPop) {
      skipNextPop = false;
      continue;
    }
    const isOwnEntryOnTop =
      (window.history.state as { overlayDepth?: number } | null)
        ?.overlayDepth === pushedDepth + 1;
    if (isOwnEntryOnTop) {
      pendingProgrammaticPops += 1;
      window.history.back();
    }
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
    if (pendingProgrammaticPops > 0) {
      // Echo of a history.back() we issued ourselves — the corresponding
      // close already happened through the normal state-update path, so
      // don't react to it again here.
      pendingProgrammaticPops -= 1;
      return;
    }
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
