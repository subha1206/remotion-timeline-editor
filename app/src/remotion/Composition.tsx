import { AbsoluteFill, Sequence } from "remotion";
import type { ComponentType } from "react";
import type { Clip, Track, ClipType } from "../model/types";
import { VideoClip } from "./clips/VideoClip";
import { AudioClip } from "./clips/AudioClip";
import { VisualClip } from "./clips/VisualClip";
import { SubtitleClip } from "./clips/SubtitleClip";

// type -> renderer lookup (object map, not a switch). Adding a clip type is a
// one-line entry here; the rest of the composition is type-agnostic.
const RENDERERS: Record<ClipType, ComponentType<{ clip: Clip }>> = {
  video: VideoClip,
  audio: AudioClip,
  visual: VisualClip,
  subtitle: SubtitleClip,
};

export interface CompositionProps {
  tracks: Track[];
  clips: Clip[];
}

// Pure function of its props — no store access. The player passes (tracks, clips)
// in via inputProps, so the exact same model that drives the timeline drives this.
export const Composition = ({ tracks, clips }: CompositionProps) => {
  // Ascending by order so higher-order tracks render later in the DOM AND carry a
  // higher zIndex: video (order 0) sits at the bottom, overlays/subtitles on top.
  const ordered = [...tracks].sort((a, b) => a.order - b.order);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {ordered.flatMap((track) =>
        clips
          .filter((c) => c.trackId === track.id)
          .map((clip) => {
            const Renderer = RENDERERS[clip.type];
            return (
              <Sequence
                key={clip.id}
                from={clip.from}
                durationInFrames={clip.durationInFrames}
                style={{ zIndex: track.order }}
              >
                <Renderer clip={clip} />
              </Sequence>
            );
          }),
      )}
    </AbsoluteFill>
  );
};
