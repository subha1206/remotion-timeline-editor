import type { Track, Clip } from "../model/types";
import { ClipBlock } from "./ClipBlock";
import { TRACK_HEIGHT } from "../constants";

export const TrackRow = ({
  track,
  clips,
  pxPerFrame,
}: {
  track: Track;
  clips: Clip[];
  pxPerFrame: number;
}) => (
  <div
    style={{
      position: "relative",
      height: TRACK_HEIGHT,
      borderBottom: "1px solid #2a2a2a",
      background: "#202020",
    }}
  >
    {clips
      .filter((c) => c.trackId === track.id)
      .map((c) => (
        <ClipBlock key={c.id} clip={c} pxPerFrame={pxPerFrame} />
      ))}
  </div>
);
