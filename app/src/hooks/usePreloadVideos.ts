import { useEffect } from "react";
import { preloadVideo } from "@remotion/preload";
import type { Clip } from "../model/types";

// Warm the browser cache for VIDEO sources via <link rel="preload"> ahead of
// playback. Lighter than prefetch (no full in-memory blob) — a better fit here
// since only the videos need help streaming smoothly. Keyed on the SET of video
// URLs so dragging/trimming (same srcs) doesn't re-trigger preloads; each
// preload is undone when the set changes or on unmount.
export const usePreloadVideos = (clips: Clip[]) => {
  const srcs = Array.from(
    new Set(
      clips
        .filter((c) => c.type === "video")
        .map((c) => c.src)
        .filter((s): s is string => Boolean(s)),
    ),
  );
  const key = JSON.stringify(srcs);

  useEffect(() => {
    const list: string[] = JSON.parse(key);
    const unpreloads = list.map((src) => preloadVideo(src));
    return () => unpreloads.forEach((unpreload) => unpreload());
  }, [key]);
};
