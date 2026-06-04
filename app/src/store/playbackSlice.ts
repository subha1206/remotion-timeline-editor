import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// Thin mirror of the player's clock. The PlayerRef is the real source of the
// current frame; this slice just follows it (via the frameupdate event) so the
// timeline UI can render the playhead from the store like everything else.
interface PlaybackState {
  currentFrame: number;
  isPlaying: boolean;
}

const initialState: PlaybackState = { currentFrame: 0, isPlaying: false };

const playbackSlice = createSlice({
  name: "playback",
  initialState,
  reducers: {
    setCurrentFrame(state, action: PayloadAction<number>) {
      state.currentFrame = action.payload;
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
  },
});

export const { setCurrentFrame, setIsPlaying } = playbackSlice.actions;
export default playbackSlice.reducer;
