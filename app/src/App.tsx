import { useRef } from "react";
import { type PlayerRef } from "@remotion/player";
import { PreviewPlayer } from "./components/PreviewPlayer";
import { Timeline } from "./timeline/Timeline";

export default function App() {
  const playerRef = useRef<PlayerRef>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a1a", color: "#eee" }}>
      <div style={{ flex: "0 0 auto", padding: 16, maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <PreviewPlayer ref={playerRef} />
      </div>
      <div style={{ flex: 1, borderTop: "1px solid #333", overflow: "auto" }}>
        <Timeline playerRef={playerRef} />
      </div>
    </div>
  );
}
