import type { RefObject } from "react";
import type { PlayerRef } from "@remotion/player";
import { useAppSelector } from "../store/hooks";
import { framesToPx, pxToFrames } from "../helpers/coords";

export const Playhead = ({
  pxPerFrame,
  playerRef,
}: {
  pxPerFrame: number;
  playerRef: RefObject<PlayerRef | null>;
}) => {
  const frame = useAppSelector((s) => s.playback.currentFrame);

  // Dragging seeks the player; we never write currentFrame directly. The seek
  // makes the PlayerRef emit frameupdate, which usePlayerSync mirrors into the
  // store, which moves this line. Bidirectional, single source of truth.
  const onMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startFrame = frame;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(0, startFrame + pxToFrames(ev.clientX - startX, pxPerFrame));
      playerRef.current?.seekTo(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: framesToPx(frame, pxPerFrame),
        width: 2,
        background: "#ef4444",
        cursor: "ew-resize",
        zIndex: 10,
      }}
    />
  );
};
