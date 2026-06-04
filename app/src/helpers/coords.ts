// The one module that owns time<->space conversion. Canonical unit is frames;
// pixels (layout) and seconds (labels) are always derived through these helpers.

export const framesToPx = (frames: number, pxPerFrame: number): number =>
  frames * pxPerFrame;

// Pointer pixels -> frames. Rounds to the NEAREST frame: dragging/trimming
// always snaps to a whole frame, keeping the model frame-accurate (no sub-frame drift).
export const pxToFrames = (px: number, pxPerFrame: number): number =>
  Math.round(px / pxPerFrame);

export const framesToSeconds = (frames: number, fps: number): number =>
  frames / fps;

export const secondsToFrames = (seconds: number, fps: number): number =>
  Math.round(seconds * fps);
