import { useState } from "react";
import type { RefObject } from "react";
import type { PlayerRef } from "@remotion/player";
import { useAppSelector } from "../store/hooks";
import { usePlayerSync } from "../hooks/usePlayerSync";
import { getTotalDurationInFrames } from "../model/seed";
import { framesToPx } from "../helpers/coords";
import { DEFAULT_PX_PER_FRAME } from "../constants";
import { Ruler } from "./Ruler";
import { TrackRow } from "./TrackRow";
import { Playhead } from "./Playhead";

export const Timeline = ({ playerRef }: { playerRef: RefObject<PlayerRef | null> }) => {
  usePlayerSync(playerRef);
  const { tracks, clips } = useAppSelector((s) => s.editor);
  const [pxPerFrame, setPxPerFrame] = useState(DEFAULT_PX_PER_FRAME);

  const durationInFrames = Math.max(1, getTotalDurationInFrames(clips));
  const width = framesToPx(durationInFrames, pxPerFrame) + 100;
  // Rows top-to-bottom by order (video first); independent of the player z-stack.
  const ordered = [...tracks].sort((a, b) => a.order - b.order);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12 }}>Zoom </label>
        <input
          type="range"
          min={1}
          max={20}
          value={pxPerFrame}
          onChange={(e) => setPxPerFrame(Number(e.target.value))}
        />
        <span style={{ fontSize: 12, marginLeft: 8, color: "#888" }}>{pxPerFrame} px/frame</span>
      </div>
      <div style={{ position: "relative", width, minWidth: "100%" }}>
        <Ruler durationInFrames={durationInFrames} pxPerFrame={pxPerFrame} />
        {ordered.map((t) => (
          <TrackRow key={t.id} track={t} clips={clips} pxPerFrame={pxPerFrame} />
        ))}
        <Playhead pxPerFrame={pxPerFrame} playerRef={playerRef} />
      </div>
    </div>
  );
};
