import { Audio } from "remotion";
import type { Clip } from "../../model/types";

export const AudioClip = ({ clip }: { clip: Clip }) => (
  <Audio src={clip.src ?? ""} trimBefore={clip.trimStart} />
);
