import { useEffect } from "react";
import type { RefObject } from "react";
import type { PlayerRef, CallbackListener } from "@remotion/player";
import { useAppDispatch } from "../store/hooks";
import { setCurrentFrame, setIsPlaying } from "../store/playbackSlice";

// The PlayerRef is the real clock. This subscribes to its events and mirrors them
// into the playback slice so the timeline can render the playhead from the store
// like every other view. One direction only: player -> store.
export const usePlayerSync = (playerRef: RefObject<PlayerRef | null>) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame: CallbackListener<"frameupdate"> = (e) =>
      dispatch(setCurrentFrame(e.detail.frame));
    const onPlay: CallbackListener<"play"> = () => dispatch(setIsPlaying(true));
    const onPause: CallbackListener<"pause"> = () => dispatch(setIsPlaying(false));

    player.addEventListener("frameupdate", onFrame);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("frameupdate", onFrame);
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerRef, dispatch]);
};
