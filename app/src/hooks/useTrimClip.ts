import { useAppDispatch } from "../store/hooks";
import { trimClipLeft, trimClipRight } from "../store/editorSlice";
import { pxToFrames } from "../helpers/coords";
import type { Clip } from "../model/types";

// Trim a handle: dispatch INCREMENTAL deltas (this move minus the last), not the
// absolute drag distance. That keeps each reducer call relative, so the reducer's
// own clamping (trimStart >= 0, duration >= MIN) composes correctly across the
// whole drag. Left vs right edge maps to the two asymmetric reducers from Task 3.
export const useTrimClip = (clip: Clip, pxPerFrame: number, edge: "left" | "right") => {
  const dispatch = useAppDispatch();

  return (e: React.MouseEvent) => {
    e.stopPropagation(); // don't let the clip-body drag handler also fire
    const startX = e.clientX;
    let lastFrames = 0;

    const onMove = (ev: MouseEvent) => {
      const totalFrames = pxToFrames(ev.clientX - startX, pxPerFrame);
      const stepDelta = totalFrames - lastFrames;
      lastFrames = totalFrames;
      if (stepDelta === 0) return;
      if (edge === "left") dispatch(trimClipLeft({ id: clip.id, deltaFrames: stepDelta }));
      else dispatch(trimClipRight({ id: clip.id, deltaFrames: stepDelta }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
};
