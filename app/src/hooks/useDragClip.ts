import { useAppDispatch } from "../store/hooks";
import { moveClip, selectClip } from "../store/editorSlice";
import { pxToFrames } from "../helpers/coords";
import type { Clip } from "../model/types";

// Drag the clip body: translate the pointer's pixel delta into a frame delta and
// dispatch moveClip. The interaction is "dumb" — it never clamps or touches the
// player; the reducer clamps (from >= 0) and both views re-derive from the store.
export const useDragClip = (clip: Clip, pxPerFrame: number) => {
  const dispatch = useAppDispatch();

  return (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(selectClip(clip.id));
    const startX = e.clientX;
    const startFrom = clip.from;

    const onMove = (ev: MouseEvent) => {
      const next = startFrom + pxToFrames(ev.clientX - startX, pxPerFrame);
      dispatch(moveClip({ id: clip.id, from: next }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
};
