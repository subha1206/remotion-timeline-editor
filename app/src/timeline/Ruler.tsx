import { framesToPx } from "../helpers/coords";
import { FPS } from "../constants";

export const Ruler = ({
  durationInFrames,
  pxPerFrame,
}: {
  durationInFrames: number;
  pxPerFrame: number;
}) => {
  const seconds = Math.ceil(durationInFrames / FPS);
  const ticks = Array.from({ length: seconds + 1 }, (_, i) => i);

  return (
    <div
      style={{
        position: "relative",
        height: 24,
        borderBottom: "1px solid #333",
        background: "#181818",
      }}
    >
      {ticks.map((s) => (
        <div
          key={s}
          style={{
            position: "absolute",
            left: framesToPx(s * FPS, pxPerFrame),
            top: 0,
            bottom: 0,
            borderLeft: "1px solid #444",
            paddingLeft: 4,
            fontSize: 10,
            color: "#888",
          }}
        >
          {s}s
        </div>
      ))}
    </div>
  );
};
