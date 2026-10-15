// What the viewer needs from anything it can show (the test cube, a loaded model):
// draw it for the current view, and let go of its GPU memory when done.
export interface ViewState {
  width: number; // drawing-buffer size in device pixels
  height: number;
  yaw: number; // radians, turn about the vertical axis
  pitch: number; // radians, tip toward / away from the camera
  zoom: number; // 1 = the whole model fits the frame; 2 = twice as close
  // The 3D room only: stand INSIDE it. Where the person stands (metres) and the
  // height of their eyes; yaw / pitch are then where they look and zoom narrows
  // their field of view. Absent = the dollhouse camera.
  walk?: { x: number; z: number; eye: number };
}

export const MIN_ZOOM = 0.7;
export const MAX_ZOOM = 4;

export interface Drawable {
  draw: (view: ViewState) => void;
  dispose: () => void;
}
