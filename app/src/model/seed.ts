import type { EditorState, Track, Clip } from "./types";

const AUDIO_SRC =
  "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3";
const IMAGE_SRC = "https://picsum.photos/seed/overlay/400/200";

// Three separate video layers (each its own track), then visual / subtitle /
// audio above them. order drives both row position (ascending) and player
// z-index (higher order paints on top), so videos sit at the bottom of the stack.
const tracks: Track[] = [
  { id: "track_video", type: "video", order: 0 },
  { id: "track_visual", type: "visual", order: 1 },
  { id: "track_subtitle", type: "subtitle", order: 2 },
  { id: "track_audio", type: "audio", order: 3 },
];

const clips: Clip[] = [
  {
    id: "clip_v1",
    trackId: "track_video",
    type: "video",
    from: 0,
    durationInFrames: 120,
    trimStart: 0,
    src: "https://storage.googleapis.com/bkt-vidyoaipoc-vidyo-bucket/logs/output-videos/3a4e86e9-f444-417a-a619-96e61e71da18/jelfFVonRkZDU3wpHpuL-.mp4",
  },
  {
    id: "clip_v2",
    trackId: "track_video",
    type: "video",
    from: 130,
    durationInFrames: 90,
    trimStart: 0,
    src: "https://storage.googleapis.com/bkt-vidyoaipoc-vidyo-bucket/logs/output-videos/8e29a4f7-57e6-4500-92e5-f83056f66b13/qFQhKmMzfOxgV0A01dXvr.mp4",
  },
  {
    id: "clip_img",
    trackId: "track_visual",
    type: "visual",
    from: 20,
    durationInFrames: 80,
    trimStart: 0,
    src: IMAGE_SRC,
    style: { top: 40, left: 40 },
  },
  {
    id: "clip_sub",
    trackId: "track_subtitle",
    type: "subtitle",
    from: 10,
    durationInFrames: 100,
    trimStart: 0,
    text: "Hello from the timeline",
    style: { top: 600, color: "#fff", fontSize: 48 },
  },
  {
    id: "clip_aud",
    trackId: "track_audio",
    type: "audio",
    from: 0,
    durationInFrames: 220,
    trimStart: 0,
    src: AUDIO_SRC,
  },
];

export const seedEditorState: EditorState = {
  tracks,
  clips,
  selectedClipId: null,
};

export const getTotalDurationInFrames = (clips: Clip[]): number =>
  clips.reduce((max, c) => Math.max(max, c.from + c.durationInFrames), 0);
