import type { Clip, ClipType } from "../model/types";
import { framesToPx } from "../helpers/coords";
import { useAppSelector } from "../store/hooks";
import { useDragClip } from "../hooks/useDragClip";
import { TrimHandle } from "./TrimHandle";

const COLORS: Record<ClipType, string> = {
  video: "#3b82f6",
  audio: "#10b981",
  visual: "#a855f7",
  subtitle: "#f59e0b",
};

// A clip block is a pure projection of the model: its left edge is
// framesToPx(from) and its width is framesToPx(durationInFrames). Nothing here
// stores layout — change the document and the block moves/resizes on re-render.
export const ClipBlock = ({ clip, pxPerFrame }: { clip: Clip; pxPerFrame: number }) => {
  const selected = useAppSelector((s) => s.editor.selectedClipId === clip.id);
  const onDragDown = useDragClip(clip, pxPerFrame);

  return (
    <div
      onMouseDown={onDragDown}
      style={{
        position: "absolute",
        left: framesToPx(clip.from, pxPerFrame),
        width: framesToPx(clip.durationInFrames, pxPerFrame),
        top: 4,
        bottom: 4,
        background: COLORS[clip.type],
        border: selected ? "2px solid #fff" : "2px solid transparent",
        borderRadius: 4,
        color: "#fff",
        fontSize: 11,
        padding: "2px 6px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        cursor: "grab",
        boxSizing: "border-box",
      }}
    >
      {clip.text ?? clip.type}
      {selected && <TrimHandle clip={clip} pxPerFrame={pxPerFrame} edge="left" />}
      {selected && <TrimHandle clip={clip} pxPerFrame={pxPerFrame} edge="right" />}
    </div>
  );
};
