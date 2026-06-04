export type ClipType = "video" | "audio" | "visual" | "subtitle";

export interface ClipStyle {
  top?: number;
  left?: number;
  color?: string;
  fontSize?: number;
}

export interface Clip {
  id: string;
  trackId: string;
  type: ClipType;
  from: number; // timeline start position, in frames
  durationInFrames: number; // length shown on the timeline, in frames
  trimStart: number; // in-point into the source media, in frames
  src?: string; // media url (video / audio / visual)
  text?: string; // subtitle / text content
  style?: ClipStyle; // subtitle styling + visual position
}

export interface Track {
  id: string;
  type: ClipType; // gates which clip types this track accepts
  order: number; // vertical order + z-index in the player
}

export interface EditorState {
  tracks: Track[];
  clips: Clip[];
  selectedClipId: string | null;
}
