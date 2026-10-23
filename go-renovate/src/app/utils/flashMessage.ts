// A one-time message that survives a page change ("Product added..."), kept in sessionStorage so it
// shows once on the next screen and is then gone. Storage can be missing or full, so every call is
// wrapped: without it the screens simply show no message.
const KEY = "gr.flash";

export function setFlashMessage(text: string): void {
  try {
    window.sessionStorage.setItem(KEY, text);
  } catch {
    // No storage: the next screen just shows no message.
  }
}

export function takeFlashMessage(): string | null {
  try {
    const text = window.sessionStorage.getItem(KEY);
    if (text) window.sessionStorage.removeItem(KEY);
    return text;
  } catch {
    return null;
  }
}
