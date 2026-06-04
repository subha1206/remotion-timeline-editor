import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { EditorState, Clip } from "../model/types";
import { MIN_CLIP_FRAMES } from "../constants";
import { seedEditorState } from "../model/seed";

const findClip = (state: EditorState, id: string): Clip | undefined =>
  state.clips.find((c) => c.id === id);

const editorSlice = createSlice({
  name: "editor",
  initialState: seedEditorState,
  reducers: {
    addClip(state, action: PayloadAction<Clip>) {
      state.clips.push(action.payload);
    },
    selectClip(state, action: PayloadAction<string | null>) {
      state.selectedClipId = action.payload;
    },
    moveClip(state, action: PayloadAction<{ id: string; from: number; trackId?: string }>) {
      const clip = findClip(state, action.payload.id);
      if (!clip) return;
      clip.from = Math.max(0, action.payload.from);
      if (action.payload.trackId) clip.trackId = action.payload.trackId;
    },
    // RIGHT edge: only the visible length changes. The in-point (trimStart) and
    // the timeline start (from) are untouched. Clamp so the clip can't go below
    // the 1-frame minimum.
    trimClipRight(state, action: PayloadAction<{ id: string; deltaFrames: number }>) {
      const clip = findClip(state, action.payload.id);
      if (!clip) return;
      clip.durationInFrames = Math.max(
        MIN_CLIP_FRAMES,
        clip.durationInFrames + action.payload.deltaFrames,
      );
    },
    // LEFT edge: from, trimStart, and duration move together so the *visible
    // content stays anchored* — sliding the left edge right reveals less of the
    // head of the media (in-point advances). Bound the delta so trimStart can't
    // drop below 0 and duration can't drop below the 1-frame minimum.
    trimClipLeft(state, action: PayloadAction<{ id: string; deltaFrames: number }>) {
      const clip = findClip(state, action.payload.id);
      if (!clip) return;
      const maxLeftIntoMedia = clip.trimStart; // dragging left is limited by source start (trimStart >= 0)
      const maxRightShrink = clip.durationInFrames - MIN_CLIP_FRAMES; // dragging right is limited by min duration
      const delta = Math.max(
        -maxLeftIntoMedia,
        Math.min(action.payload.deltaFrames, maxRightShrink),
      );
      clip.from += delta;
      clip.trimStart += delta;
      clip.durationInFrames -= delta;
    },
  },
});

export const { addClip, selectClip, moveClip, trimClipRight, trimClipLeft } = editorSlice.actions;
export default editorSlice.reducer;
