import type { EditorState, Track, Clip } from "./types";

// Local videos live in app/public/. import.meta.env.BASE_URL makes the URL work
// both in dev ("/") and on GitHub Pages ("/remotion-timeline-editor/"). They are
// served same-origin, so OffthreadVideo's canvas frame extraction needs no CORS.
const VIDEO_1_SRC = `${import.meta.env.BASE_URL}video-1.mp4`;
const VIDEO_2_SRC = `${import.meta.env.BASE_URL}video-2.mp4`;
const AUDIO_SRC =
  "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3";
const IMAGE_SRC = "https://picsum.photos/seed/overlay/400/200";

// One video track (two clips), then visual / subtitle / audio above it. order
// drives both row position (ascending) and player z-index (higher order paints
// on top), so the video sits at the bottom of the stack.
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
    src: VIDEO_2_SRC,
  },
  {
    id: "clip_v2",
    trackId: "track_video",
    type: "video",
    from: 130,
    durationInFrames: 90,
    trimStart: 0,
    src: VIDEO_1_SRC,
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
