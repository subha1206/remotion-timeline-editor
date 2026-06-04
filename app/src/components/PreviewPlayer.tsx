import { forwardRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Composition } from "../remotion/Composition";
import { useAppSelector } from "../store/hooks";
import { usePreloadVideos } from "../hooks/usePreloadVideos";
import { getTotalDurationInFrames } from "../model/seed";
import { FPS, COMPOSITION_WIDTH, COMPOSITION_HEIGHT } from "../constants";

// A pure view of the edit document: it reads (tracks, clips) from the store and
// hands them to the Player as inputProps. It owns no edit state — every change
// flows back through Redux, and this re-derives.
export const PreviewPlayer = forwardRef<PlayerRef>((_props, ref) => {
  const { tracks, clips } = useAppSelector((s) => s.editor);
  usePreloadVideos(clips);
  const durationInFrames = Math.max(1, getTotalDurationInFrames(clips));

  return (
    <Player
      ref={ref}
      component={Composition}
      inputProps={{ tracks, clips }}
      durationInFrames={durationInFrames}
      fps={FPS}
      compositionWidth={COMPOSITION_WIDTH}
      compositionHeight={COMPOSITION_HEIGHT}
      style={{ width: "100%", aspectRatio: `${COMPOSITION_WIDTH} / ${COMPOSITION_HEIGHT}` }}
      controls
    />
  );
});
PreviewPlayer.displayName = "PreviewPlayer";
