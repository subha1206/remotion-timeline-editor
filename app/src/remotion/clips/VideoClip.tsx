import { OffthreadVideo } from "remotion";
import type { Clip } from "../../model/types";

// trimBefore is the media in-point (frames). Sequence handles WHERE on the
// timeline this plays (from/duration); trimBefore handles WHICH part of the source.
export const VideoClip = ({ clip }: { clip: Clip }) => (
  <OffthreadVideo src={clip.src ?? ""} trimBefore={clip.trimStart} volume={0} />
);
