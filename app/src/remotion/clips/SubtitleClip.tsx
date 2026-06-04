import { AbsoluteFill } from "remotion";
import type { Clip } from "../../model/types";

export const SubtitleClip = ({ clip }: { clip: Clip }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        top: clip.style?.top ?? 600,
        width: "100%",
        textAlign: "center",
        color: clip.style?.color ?? "#fff",
        fontSize: clip.style?.fontSize ?? 48,
        fontFamily: "sans-serif",
        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
      }}
    >
      {clip.text}
    </div>
  </AbsoluteFill>
);
