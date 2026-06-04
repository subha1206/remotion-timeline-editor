import type { Clip } from "../model/types";
import { useTrimClip } from "../hooks/useTrimClip";

export const TrimHandle = ({
  clip,
  pxPerFrame,
  edge,
}: {
  clip: Clip;
  pxPerFrame: number;
  edge: "left" | "right";
}) => {
  const onDown = useTrimClip(clip, pxPerFrame, edge);

  return (
    <div
      onMouseDown={onDown}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 8,
        left: edge === "left" ? 0 : undefined,
        right: edge === "right" ? 0 : undefined,
        background: "rgba(255,255,255,0.6)",
        cursor: "ew-resize",
        zIndex: 5,
      }}
    />
  );
};
