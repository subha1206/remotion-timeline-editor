import { configureStore } from "@reduxjs/toolkit";
import editor from "./editorSlice";
import playback from "./playbackSlice";

export const store = configureStore({ reducer: { editor, playback } });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
