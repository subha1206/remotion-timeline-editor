import { AbsoluteFill, Img } from "remotion";
import type { Clip } from "../../model/types";

export const VisualClip = ({ clip }: { clip: Clip }) => (
  <AbsoluteFill>
    <Img
      src={clip.src ?? ""}
      style={{ position: "absolute", top: clip.style?.top ?? 0, left: clip.style?.left ?? 0 }}
    />
  </AbsoluteFill>
);
