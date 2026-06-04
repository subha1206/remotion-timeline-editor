# Multilayer Timeline Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a from-scratch multilayer timeline editor (video / audio / visual / subtitle tracks; drag-to-move and trim) with a Remotion `<Player>` preview, where one Redux edit-document drives both the player and the timeline.

**Architecture:** One source of truth (Redux edit document) → two pure views: the Remotion composition (`model → <Sequence>`s) and the timeline UI (`model → clip blocks`). Interactions dispatch actions that mutate the document; both views re-derive. Canonical time unit is frames.

**Tech Stack:** Vite + React 18 + TypeScript, `@remotion/player` + `remotion`, Redux Toolkit + react-redux, Vitest for the pure layers.

---

## File structure (locked before tasks)

```
src/
  model/
    types.ts          ClipType, Clip, Track, EditorState shapes
    seed.ts           makeClip/makeTrack factories + initial demo document
  helpers/
    coords.ts         frames<->px<->seconds pure conversions
    id.ts             stable id generator
  store/
    editorSlice.ts    tracks/clips reducers (move, trim, add, select)
    playbackSlice.ts  currentFrame, isPlaying mirror
    store.ts          configureStore + RootState/AppDispatch types
    hooks.ts          typed useAppDispatch/useAppSelector
  remotion/
    Composition.tsx   model -> <Sequence>s, ordered by track
    clips/
      VideoClip.tsx
      AudioClip.tsx
      VisualClip.tsx
      SubtitleClip.tsx
  timeline/
    Timeline.tsx      owns pxPerFrame (zoom); composes ruler/tracks/playhead
    Ruler.tsx         time ticks + second labels
    TrackRow.tsx      one track row; lays out its clips
    ClipBlock.tsx     positioned block + trim handles
    Playhead.tsx      draggable vertical line
  hooks/
    usePlayerSync.ts  PlayerRef frameupdate <-> playhead
    useDragClip.ts    pointer drag -> moveClip
    useTrimClip.ts    pointer drag on handle -> trim actions
  constants.ts        FPS, COMPOSITION_WIDTH/HEIGHT, MIN_CLIP_FRAMES, TRACK_HEIGHT
  App.tsx             <Player/> (top) + <Timeline/> (bottom)
tests/
  coords.test.ts
  editorSlice.test.ts
```

---

## Task 0: Scaffold project

**Files:**
- Create: whole project under `~/Projects/remotion-timeline-editor`

- [ ] **Step 1: Scaffold Vite React-TS in the existing repo folder**

Run:
```bash
cd ~/Projects/remotion-timeline-editor
npm create vite@latest . -- --template react-ts
```
If prompted that the directory is not empty (docs/ + .git exist), choose "Ignore files and continue".

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
npm install remotion @remotion/player @reduxjs/toolkit react-redux
npm install -D vitest
```

- [ ] **Step 3: Add the test script and a vitest config**

Modify `package.json` scripts to include:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

- [ ] **Step 4: Verify the dev server boots**

Run: `npm run dev`
Expected: Vite serves on localhost without errors. Stop it (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
printf "node_modules\ndist\n.DS_Store\n" > .gitignore
git add -A
git commit -m "chore: scaffold vite react-ts project with remotion + redux"
```

---

## Task 1: Constants + domain model + seed document

**Files:**
- Create: `src/constants.ts`, `src/model/types.ts`, `src/helpers/id.ts`, `src/model/seed.ts`

- [ ] **Step 1: Constants**

Create `src/constants.ts`:
```ts
export const FPS = 30;
export const COMPOSITION_WIDTH = 1280;
export const COMPOSITION_HEIGHT = 720;
export const MIN_CLIP_FRAMES = 1;
export const TRACK_HEIGHT = 56;
export const DEFAULT_PX_PER_FRAME = 4;
```

- [ ] **Step 2: Types**

Create `src/model/types.ts`:
```ts
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
  from: number;
  durationInFrames: number;
  trimStart: number;
  src?: string;
  text?: string;
  style?: ClipStyle;
}

export interface Track {
  id: string;
  type: ClipType;
  order: number;
}

export interface EditorState {
  tracks: Track[];
  clips: Clip[];
  selectedClipId: string | null;
}
```

- [ ] **Step 3: Id helper**

Create `src/helpers/id.ts`:
```ts
let counter = 0;
export const makeId = (prefix: string): string => {
  counter += 1;
  return `${prefix}_${counter}`;
};
```

- [ ] **Step 4: Seed document**

Create `src/model/seed.ts`. Use public Remotion sample assets so it runs with no setup:
```ts
import { EditorState, Track, Clip } from "./types";

const VIDEO_SRC =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const AUDIO_SRC =
  "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3";
const IMAGE_SRC = "https://picsum.photos/seed/overlay/400/200";

const tracks: Track[] = [
  { id: "track_video", type: "video", order: 0 },
  { id: "track_visual", type: "visual", order: 1 },
  { id: "track_subtitle", type: "subtitle", order: 2 },
  { id: "track_audio", type: "audio", order: 3 },
];

const clips: Clip[] = [
  { id: "clip_v1", trackId: "track_video", type: "video", from: 0, durationInFrames: 120, trimStart: 0, src: VIDEO_SRC },
  { id: "clip_v2", trackId: "track_video", type: "video", from: 130, durationInFrames: 90, trimStart: 300, src: VIDEO_SRC },
  { id: "clip_img", trackId: "track_visual", type: "visual", from: 20, durationInFrames: 80, trimStart: 0, src: IMAGE_SRC, style: { top: 40, left: 40 } },
  { id: "clip_sub", trackId: "track_subtitle", type: "subtitle", from: 10, durationInFrames: 100, trimStart: 0, text: "Hello from the timeline", style: { top: 600, color: "#fff", fontSize: 48 } },
  { id: "clip_aud", trackId: "track_audio", type: "audio", from: 0, durationInFrames: 220, trimStart: 0, src: AUDIO_SRC },
];

export const seedEditorState: EditorState = { tracks, clips, selectedClipId: null };

export const getTotalDurationInFrames = (clips: Clip[]): number =>
  clips.reduce((max, c) => Math.max(max, c.from + c.durationInFrames), 0);
```

- [ ] **Step 5: Commit**

```bash
git add src/constants.ts src/model src/helpers/id.ts
git commit -m "feat: domain types, constants, and seed edit document"
```

---

## Task 2: Coordinate helpers (TDD)

**Files:**
- Create: `src/helpers/coords.ts`
- Test: `tests/coords.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/coords.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { framesToPx, pxToFrames, framesToSeconds, secondsToFrames } from "../src/helpers/coords";

describe("coords", () => {
  it("framesToPx multiplies by pxPerFrame", () => {
    expect(framesToPx(10, 4)).toBe(40);
  });
  it("pxToFrames is the rounded inverse of framesToPx", () => {
    expect(pxToFrames(40, 4)).toBe(10);
    expect(pxToFrames(42, 4)).toBe(11); // rounds to nearest frame
  });
  it("framesToSeconds divides by fps", () => {
    expect(framesToSeconds(60, 30)).toBe(2);
  });
  it("secondsToFrames multiplies by fps and rounds", () => {
    expect(secondsToFrames(2, 30)).toBe(60);
    expect(secondsToFrames(1.51, 30)).toBe(45);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- coords`
Expected: FAIL — module `../src/helpers/coords` not found.

- [ ] **Step 3: Implement**

Create `src/helpers/coords.ts`:
```ts
export const framesToPx = (frames: number, pxPerFrame: number): number =>
  frames * pxPerFrame;

export const pxToFrames = (px: number, pxPerFrame: number): number =>
  Math.round(px / pxPerFrame);

export const framesToSeconds = (frames: number, fps: number): number =>
  frames / fps;

export const secondsToFrames = (seconds: number, fps: number): number =>
  Math.round(seconds * fps);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- coords`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/helpers/coords.ts tests/coords.test.ts
git commit -m "feat: pure frame/px/second coordinate helpers with tests"
```

---

## Task 3: Redux store + editorSlice (TDD reducers)

**Files:**
- Create: `src/store/editorSlice.ts`, `src/store/playbackSlice.ts`, `src/store/store.ts`, `src/store/hooks.ts`
- Test: `tests/editorSlice.test.ts`

- [ ] **Step 1: Write the failing reducer tests** (this is the highest-value test file — the trim asymmetry lives here)

Create `tests/editorSlice.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import reducer, { moveClip, trimClipLeft, trimClipRight, selectClip } from "../src/store/editorSlice";
import { EditorState } from "../src/model/types";

const base = (): EditorState => ({
  tracks: [{ id: "t1", type: "video", order: 0 }],
  clips: [{ id: "c1", trackId: "t1", type: "video", from: 50, durationInFrames: 100, trimStart: 20 }],
  selectedClipId: null,
});

describe("editorSlice", () => {
  it("moveClip sets a new from and clamps at 0", () => {
    const s1 = reducer(base(), moveClip({ id: "c1", from: 80 }));
    expect(s1.clips[0].from).toBe(80);
    const s2 = reducer(base(), moveClip({ id: "c1", from: -10 }));
    expect(s2.clips[0].from).toBe(0);
  });

  it("trimClipRight changes only duration, never from/trimStart", () => {
    const s = reducer(base(), trimClipRight({ id: "c1", deltaFrames: -30 }));
    expect(s.clips[0].durationInFrames).toBe(70);
    expect(s.clips[0].from).toBe(50);
    expect(s.clips[0].trimStart).toBe(20);
  });

  it("trimClipRight clamps to MIN_CLIP_FRAMES", () => {
    const s = reducer(base(), trimClipRight({ id: "c1", deltaFrames: -500 }));
    expect(s.clips[0].durationInFrames).toBe(1);
  });

  it("trimClipLeft moves from, trimStart, and duration together", () => {
    const s = reducer(base(), trimClipLeft({ id: "c1", deltaFrames: 30 }));
    expect(s.clips[0].from).toBe(80);          // 50 + 30
    expect(s.clips[0].trimStart).toBe(50);     // 20 + 30
    expect(s.clips[0].durationInFrames).toBe(70); // 100 - 30
  });

  it("trimClipLeft cannot push trimStart below 0", () => {
    const s = reducer(base(), trimClipLeft({ id: "c1", deltaFrames: -100 }));
    expect(s.clips[0].trimStart).toBe(0);
    expect(s.clips[0].from).toBe(30);          // bounded by how far trimStart could go (20 frames)
    expect(s.clips[0].durationInFrames).toBe(120);
  });

  it("selectClip sets selectedClipId", () => {
    const s = reducer(base(), selectClip("c1"));
    expect(s.selectedClipId).toBe("c1");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- editorSlice`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement editorSlice**

Create `src/store/editorSlice.ts`:
```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EditorState, Clip } from "../model/types";
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
    trimClipRight(state, action: PayloadAction<{ id: string; deltaFrames: number }>) {
      const clip = findClip(state, action.payload.id);
      if (!clip) return;
      clip.durationInFrames = Math.max(MIN_CLIP_FRAMES, clip.durationInFrames + action.payload.deltaFrames);
    },
    trimClipLeft(state, action: PayloadAction<{ id: string; deltaFrames: number }>) {
      const clip = findClip(state, action.payload.id);
      if (!clip) return;
      // Bound the delta so trimStart can't go below 0 and duration can't go below the minimum.
      const maxLeftIntoMedia = clip.trimStart; // can't move left earlier than source start
      const maxRightShrink = clip.durationInFrames - MIN_CLIP_FRAMES;
      const delta = Math.max(-maxLeftIntoMedia, Math.min(action.payload.deltaFrames, maxRightShrink));
      clip.from += delta;
      clip.trimStart += delta;
      clip.durationInFrames -= delta;
    },
  },
});

export const { addClip, selectClip, moveClip, trimClipRight, trimClipLeft } = editorSlice.actions;
export default editorSlice.reducer;
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- editorSlice`
Expected: PASS (6 tests). If the `trimClipLeft cannot push trimStart below 0` case fails, re-check the delta-bounding math.

- [ ] **Step 5: playbackSlice, store, typed hooks**

Create `src/store/playbackSlice.ts`:
```ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
```

Create `src/store/store.ts`:
```ts
import { configureStore } from "@reduxjs/toolkit";
import editor from "./editorSlice";
import playback from "./playbackSlice";

export const store = configureStore({ reducer: { editor, playback } });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

Create `src/store/hooks.ts`:
```ts
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { RootState, AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

- [ ] **Step 6: Commit**

```bash
git add src/store tests/editorSlice.test.ts
git commit -m "feat: redux editor + playback slices with move/trim reducer tests"
```

---

## Task 4: Remotion composition (model -> Sequences)

**Files:**
- Create: `src/remotion/Composition.tsx`, `src/remotion/clips/VideoClip.tsx`, `AudioClip.tsx`, `VisualClip.tsx`, `SubtitleClip.tsx`

- [ ] **Step 1: Per-type clip renderers**

Create `src/remotion/clips/VideoClip.tsx`:
```tsx
import { OffthreadVideo } from "remotion";
import { Clip } from "../../model/types";

export const VideoClip = ({ clip }: { clip: Clip }) => (
  <OffthreadVideo src={clip.src ?? ""} startFrom={clip.trimStart} />
);
```

Create `src/remotion/clips/AudioClip.tsx`:
```tsx
import { Audio } from "remotion";
import { Clip } from "../../model/types";

export const AudioClip = ({ clip }: { clip: Clip }) => (
  <Audio src={clip.src ?? ""} startFrom={clip.trimStart} />
);
```

Create `src/remotion/clips/VisualClip.tsx`:
```tsx
import { AbsoluteFill, Img } from "remotion";
import { Clip } from "../../model/types";

export const VisualClip = ({ clip }: { clip: Clip }) => (
  <AbsoluteFill>
    <Img
      src={clip.src ?? ""}
      style={{ position: "absolute", top: clip.style?.top ?? 0, left: clip.style?.left ?? 0 }}
    />
  </AbsoluteFill>
);
```

Create `src/remotion/clips/SubtitleClip.tsx`:
```tsx
import { AbsoluteFill } from "remotion";
import { Clip } from "../../model/types";

export const SubtitleClip = ({ clip }: { clip: Clip }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        top: clip.style?.top ?? 600,
        width: "100%",
        textAlign: "center",
        color: clip.style?.color ?? "#fff",
        fontSize: clip.style?.fontSize ?? 48,
        fontFamily: "sans-serif",
        textShadow: "0 2px 8px rgba(0,0,0,0.8)",
      }}
    >
      {clip.text}
    </div>
  </AbsoluteFill>
);
```

- [ ] **Step 2: Composition that orders tracks and wraps each clip in a Sequence**

Create `src/remotion/Composition.tsx`:
```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { Clip, Track, ClipType } from "../model/types";
import { VideoClip } from "./clips/VideoClip";
import { AudioClip } from "./clips/AudioClip";
import { VisualClip } from "./clips/VisualClip";
import { SubtitleClip } from "./clips/SubtitleClip";

const RENDERERS: Record<ClipType, (props: { clip: Clip }) => JSX.Element> = {
  video: VideoClip,
  audio: AudioClip,
  visual: VisualClip,
  subtitle: SubtitleClip,
};

export interface CompositionProps {
  tracks: Track[];
  clips: Clip[];
}

export const Composition = ({ tracks, clips }: CompositionProps) => {
  const ordered = [...tracks].sort((a, b) => b.order - a.order); // lowest order on top
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {ordered.map((track) =>
        clips
          .filter((c) => c.trackId === track.id)
          .map((clip) => {
            const Renderer = RENDERERS[clip.type];
            return (
              <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
                <Renderer clip={clip} />
              </Sequence>
            );
          })
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/remotion
git commit -m "feat: remotion composition mapping clips to sequences per track"
```

---

## Task 5: Wire the Player into App

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `src/components/PreviewPlayer.tsx`

- [ ] **Step 1: Provide the store**

Modify `src/main.tsx` to wrap `<App/>`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

- [ ] **Step 2: PreviewPlayer reads the model from the store and feeds inputProps**

Create `src/components/PreviewPlayer.tsx`:
```tsx
import { forwardRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { Composition } from "../remotion/Composition";
import { useAppSelector } from "../store/hooks";
import { getTotalDurationInFrames } from "../model/seed";
import { FPS, COMPOSITION_WIDTH, COMPOSITION_HEIGHT } from "../constants";

export const PreviewPlayer = forwardRef<PlayerRef>((_props, ref) => {
  const { tracks, clips } = useAppSelector((s) => s.editor);
  const durationInFrames = Math.max(1, getTotalDurationInFrames(clips));

  return (
    <Player
      ref={ref}
      component={Composition}
      inputProps={{ tracks, clips }}
      durationInFrames={durationInFrames}
      fps={FPS}
      compositionWidth={COMPOSITION_WIDTH}
      compositionHeight={COMPOSITION_HEIGHT}
      style={{ width: "100%", aspectRatio: `${COMPOSITION_WIDTH} / ${COMPOSITION_HEIGHT}` }}
      controls
    />
  );
});
PreviewPlayer.displayName = "PreviewPlayer";
```

- [ ] **Step 3: App lays out player on top, timeline placeholder below**

Modify `src/App.tsx`:
```tsx
import { useRef } from "react";
import { PlayerRef } from "@remotion/player";
import { PreviewPlayer } from "./components/PreviewPlayer";

export default function App() {
  const playerRef = useRef<PlayerRef>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a1a", color: "#eee" }}>
      <div style={{ flex: "0 0 auto", padding: 16, maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <PreviewPlayer ref={playerRef} />
      </div>
      <div style={{ flex: 1, borderTop: "1px solid #333", overflow: "auto" }}>
        {/* Timeline mounts here in Task 6 */}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`
Expected: the player shows the video with the overlay image, subtitle, and audio; pressing play composites all layers. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/components/PreviewPlayer.tsx
git commit -m "feat: wire remotion player to the redux edit document"
```

---

## Task 6: Timeline render (ruler + tracks + clip blocks, read-only)

**Files:**
- Create: `src/timeline/Timeline.tsx`, `Ruler.tsx`, `TrackRow.tsx`, `ClipBlock.tsx`
- Modify: `src/App.tsx` (mount `<Timeline/>`)

- [ ] **Step 1: ClipBlock (positioned from the model)**

Create `src/timeline/ClipBlock.tsx`:
```tsx
import { Clip } from "../model/types";
import { framesToPx } from "../helpers/coords";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectClip } from "../store/editorSlice";

const COLORS: Record<string, string> = {
  video: "#3b82f6", audio: "#10b981", visual: "#a855f7", subtitle: "#f59e0b",
};

export const ClipBlock = ({ clip, pxPerFrame }: { clip: Clip; pxPerFrame: number }) => {
  const dispatch = useAppDispatch();
  const selected = useAppSelector((s) => s.editor.selectedClipId === clip.id);
  return (
    <div
      onMouseDown={() => dispatch(selectClip(clip.id))}
      style={{
        position: "absolute",
        left: framesToPx(clip.from, pxPerFrame),
        width: framesToPx(clip.durationInFrames, pxPerFrame),
        top: 4, bottom: 4,
        background: COLORS[clip.type],
        border: selected ? "2px solid #fff" : "2px solid transparent",
        borderRadius: 4, color: "#fff", fontSize: 11, padding: "2px 6px",
        overflow: "hidden", whiteSpace: "nowrap", cursor: "grab", boxSizing: "border-box",
      }}
    >
      {clip.text ?? clip.type}
    </div>
  );
};
```

- [ ] **Step 2: TrackRow**

Create `src/timeline/TrackRow.tsx`:
```tsx
import { Track, Clip } from "../model/types";
import { ClipBlock } from "./ClipBlock";
import { TRACK_HEIGHT } from "../constants";

export const TrackRow = ({ track, clips, pxPerFrame }: { track: Track; clips: Clip[]; pxPerFrame: number }) => (
  <div style={{ position: "relative", height: TRACK_HEIGHT, borderBottom: "1px solid #2a2a2a", background: "#202020" }}>
    {clips.filter((c) => c.trackId === track.id).map((c) => (
      <ClipBlock key={c.id} clip={c} pxPerFrame={pxPerFrame} />
    ))}
  </div>
);
```

- [ ] **Step 3: Ruler**

Create `src/timeline/Ruler.tsx`:
```tsx
import { framesToPx } from "../helpers/coords";
import { FPS } from "../constants";

export const Ruler = ({ durationInFrames, pxPerFrame }: { durationInFrames: number; pxPerFrame: number }) => {
  const seconds = Math.ceil(durationInFrames / FPS);
  const ticks = Array.from({ length: seconds + 1 }, (_, i) => i);
  return (
    <div style={{ position: "relative", height: 24, borderBottom: "1px solid #333", background: "#181818" }}>
      {ticks.map((s) => (
        <div key={s} style={{ position: "absolute", left: framesToPx(s * FPS, pxPerFrame), top: 0, bottom: 0, borderLeft: "1px solid #444", paddingLeft: 4, fontSize: 10, color: "#888" }}>
          {s}s
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 4: Timeline (owns zoom, composes everything)**

Create `src/timeline/Timeline.tsx`:
```tsx
import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import { getTotalDurationInFrames } from "../model/seed";
import { framesToPx } from "../helpers/coords";
import { DEFAULT_PX_PER_FRAME } from "../constants";
import { Ruler } from "./Ruler";
import { TrackRow } from "./TrackRow";

export const Timeline = () => {
  const { tracks, clips } = useAppSelector((s) => s.editor);
  const [pxPerFrame, setPxPerFrame] = useState(DEFAULT_PX_PER_FRAME);
  const durationInFrames = Math.max(1, getTotalDurationInFrames(clips));
  const width = framesToPx(durationInFrames, pxPerFrame) + 100;
  const ordered = [...tracks].sort((a, b) => a.order - b.order);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12 }}>Zoom </label>
        <input type="range" min={1} max={20} value={pxPerFrame} onChange={(e) => setPxPerFrame(Number(e.target.value))} />
      </div>
      <div style={{ position: "relative", width, minWidth: "100%" }}>
        <Ruler durationInFrames={durationInFrames} pxPerFrame={pxPerFrame} />
        {ordered.map((t) => (
          <TrackRow key={t.id} track={t} clips={clips} pxPerFrame={pxPerFrame} />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Mount it in App**

Modify the timeline container `div` in `src/App.tsx` to render `<Timeline/>`:
```tsx
import { Timeline } from "./timeline/Timeline";
// ...
<div style={{ flex: 1, borderTop: "1px solid #333", overflow: "auto" }}>
  <Timeline />
</div>
```

- [ ] **Step 6: Verify**

Run: `npm run dev`
Expected: four track rows with colored clip blocks at the right positions; zoom slider rescales them; clicking a clip outlines it (selection). Stop server.

- [ ] **Step 7: Commit**

```bash
git add src/timeline src/App.tsx
git commit -m "feat: read-only timeline with ruler, tracks, clip blocks, zoom, selection"
```

---

## Task 7: Playhead + player sync

**Files:**
- Create: `src/hooks/usePlayerSync.ts`, `src/timeline/Playhead.tsx`
- Modify: `src/App.tsx` (share playerRef into Timeline), `src/timeline/Timeline.tsx`

- [ ] **Step 1: usePlayerSync — mirror PlayerRef frame into redux, expose seek**

Create `src/hooks/usePlayerSync.ts`:
```ts
import { useEffect } from "react";
import { PlayerRef } from "@remotion/player";
import { useAppDispatch } from "../store/hooks";
import { setCurrentFrame, setIsPlaying } from "../store/playbackSlice";

export const usePlayerSync = (playerRef: React.RefObject<PlayerRef>) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrame = (e: { detail: { frame: number } }) => dispatch(setCurrentFrame(e.detail.frame));
    const onPlay = () => dispatch(setIsPlaying(true));
    const onPause = () => dispatch(setIsPlaying(false));

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
```

- [ ] **Step 2: Playhead — reads currentFrame, drag to seek**

Create `src/timeline/Playhead.tsx`:
```tsx
import { PlayerRef } from "@remotion/player";
import { useAppSelector } from "../store/hooks";
import { framesToPx, pxToFrames } from "../helpers/coords";

export const Playhead = ({ pxPerFrame, playerRef }: { pxPerFrame: number; playerRef: React.RefObject<PlayerRef> }) => {
  const frame = useAppSelector((s) => s.playback.currentFrame);

  const onMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startFrame = frame;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(0, startFrame + pxToFrames(ev.clientX - startX, pxPerFrame));
      playerRef.current?.seekTo(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{ position: "absolute", top: 0, bottom: 0, left: framesToPx(frame, pxPerFrame), width: 2, background: "#ef4444", cursor: "ew-resize", zIndex: 10 }}
    />
  );
};
```

- [ ] **Step 3: Thread playerRef through App → Timeline, call sync, render Playhead**

Modify `src/App.tsx` to pass `playerRef` to `<Timeline playerRef={playerRef} />`.

Modify `src/timeline/Timeline.tsx` signature and body:
```tsx
import { PlayerRef } from "@remotion/player";
import { usePlayerSync } from "../hooks/usePlayerSync";
import { Playhead } from "./Playhead";

export const Timeline = ({ playerRef }: { playerRef: React.RefObject<PlayerRef> }) => {
  usePlayerSync(playerRef);
  // ...existing state/derived values...
  // inside the positioned container, after the track rows:
  //   <Playhead pxPerFrame={pxPerFrame} playerRef={playerRef} />
```

- [ ] **Step 4: Verify**

Run: `npm run dev`
Expected: playing the video moves the red playhead across the timeline; dragging the playhead seeks the player. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePlayerSync.ts src/timeline/Playhead.tsx src/timeline/Timeline.tsx src/App.tsx
git commit -m "feat: bidirectional playhead<->player sync via PlayerRef events"
```

---

## Task 8: Drag-to-move clips

**Files:**
- Create: `src/hooks/useDragClip.ts`
- Modify: `src/timeline/ClipBlock.tsx`

- [ ] **Step 1: useDragClip — pointer delta to moveClip**

Create `src/hooks/useDragClip.ts`:
```ts
import { useAppDispatch } from "../store/hooks";
import { moveClip, selectClip } from "../store/editorSlice";
import { pxToFrames } from "../helpers/coords";
import { Clip } from "../model/types";

export const useDragClip = (clip: Clip, pxPerFrame: number) => {
  const dispatch = useAppDispatch();

  return (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(selectClip(clip.id));
    const startX = e.clientX;
    const startFrom = clip.from;

    const onMove = (ev: MouseEvent) => {
      const next = startFrom + pxToFrames(ev.clientX - startX, pxPerFrame);
      dispatch(moveClip({ id: clip.id, from: next }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
};
```

- [ ] **Step 2: Wire the drag handler to the block body**

Modify `src/timeline/ClipBlock.tsx`: replace the `onMouseDown={() => dispatch(selectClip(clip.id))}` with the drag handler:
```tsx
import { useDragClip } from "../hooks/useDragClip";
// inside component:
const onDragDown = useDragClip(clip, pxPerFrame);
// on the block div:
onMouseDown={onDragDown}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`
Expected: dragging a clip body moves it along its track; the player preview reflects the new timing (it re-derives from the model). Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useDragClip.ts src/timeline/ClipBlock.tsx
git commit -m "feat: drag-to-move clips updating the edit document"
```

---

## Task 9: Trim edges

**Files:**
- Create: `src/hooks/useTrimClip.ts`, `src/timeline/TrimHandle.tsx`
- Modify: `src/timeline/ClipBlock.tsx`

- [ ] **Step 1: useTrimClip — edge-aware delta to trim actions**

Create `src/hooks/useTrimClip.ts`:
```ts
import { useAppDispatch } from "../store/hooks";
import { trimClipLeft, trimClipRight } from "../store/editorSlice";
import { pxToFrames } from "../helpers/coords";
import { Clip } from "../model/types";

export const useTrimClip = (clip: Clip, pxPerFrame: number, edge: "left" | "right") => {
  const dispatch = useAppDispatch();

  return (e: React.MouseEvent) => {
    e.stopPropagation();
    let lastFrames = 0;
    const startX = e.clientX;

    const onMove = (ev: MouseEvent) => {
      const totalFrames = pxToFrames(ev.clientX - startX, pxPerFrame);
      const stepDelta = totalFrames - lastFrames;
      lastFrames = totalFrames;
      if (stepDelta === 0) return;
      if (edge === "left") dispatch(trimClipLeft({ id: clip.id, deltaFrames: stepDelta }));
      else dispatch(trimClipRight({ id: clip.id, deltaFrames: stepDelta }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
};
```

- [ ] **Step 2: TrimHandle component**

Create `src/timeline/TrimHandle.tsx`:
```tsx
import { Clip } from "../model/types";
import { useTrimClip } from "../hooks/useTrimClip";

export const TrimHandle = ({ clip, pxPerFrame, edge }: { clip: Clip; pxPerFrame: number; edge: "left" | "right" }) => {
  const onDown = useTrimClip(clip, pxPerFrame, edge);
  return (
    <div
      onMouseDown={onDown}
      style={{
        position: "absolute", top: 0, bottom: 0, width: 8,
        [edge]: 0, background: "rgba(255,255,255,0.6)", cursor: "ew-resize", zIndex: 5,
      }}
    />
  );
};
```

- [ ] **Step 3: Render handles only on the selected clip**

Modify `src/timeline/ClipBlock.tsx` to render handles when `selected`:
```tsx
import { TrimHandle } from "./TrimHandle";
// inside the block div, after the label:
{selected && <TrimHandle clip={clip} pxPerFrame={pxPerFrame} edge="left" />}
{selected && <TrimHandle clip={clip} pxPerFrame={pxPerFrame} edge="right" />}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`
Expected: selecting a clip shows two grips; dragging the right grip shortens/extends only the duration; dragging the left grip moves the start while keeping later content anchored (in-point shifts). Player reflects both. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTrimClip.ts src/timeline/TrimHandle.tsx src/timeline/ClipBlock.tsx
git commit -m "feat: trim handles with correct left/right in-point semantics"
```

---

## Task 10 (stretch): Undo / redo

**Files:**
- Create: `src/store/undoable.ts`
- Modify: `src/store/store.ts`, add a toolbar with buttons

- [ ] **Step 1: Generic dual-stack undo enhancer over the editor reducer**

Create `src/store/undoable.ts`:
```ts
import { Reducer, AnyAction } from "@reduxjs/toolkit";

export interface History<S> { past: S[]; present: S; future: S[]; }

export const UNDO = "history/undo";
export const REDO = "history/redo";

const LIMIT = 50;

export function undoable<S>(reducer: Reducer<S>): Reducer<History<S>> {
  const initialPresent = reducer(undefined, { type: "@@INIT" } as AnyAction);
  const initial: History<S> = { past: [], present: initialPresent, future: [] };

  return (state = initial, action: AnyAction): History<S> => {
    if (action.type === UNDO) {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] };
    }
    if (action.type === REDO) {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return { past: [...state.past, state.present], present: next, future: state.future.slice(1) };
    }
    const newPresent = reducer(state.present, action);
    if (newPresent === state.present) return state;
    return { past: [...state.past, state.present].slice(-LIMIT), present: newPresent, future: [] };
  };
}

export const undo = () => ({ type: UNDO });
export const redo = () => ({ type: REDO });
```

- [ ] **Step 2: Wrap editor reducer + update selectors**

Modify `src/store/store.ts`:
```ts
import { undoable } from "./undoable";
// ...
export const store = configureStore({ reducer: { editor: undoable(editor), playback } });
```
Update every `useAppSelector((s) => s.editor.X)` to `s.editor.present.X` across the codebase (ClipBlock, Timeline, PreviewPlayer).

- [ ] **Step 3: Toolbar buttons**

Add Undo/Redo buttons in `App.tsx` dispatching `undo()` / `redo()`.

- [ ] **Step 4: Verify**

Run: `npm run dev`
Expected: move/trim a clip, Undo reverts it, Redo re-applies; 50-step cap holds. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/store App.tsx
git commit -m "feat: dual-stack undo/redo history over the edit document"
```

---

## Task 11 (stretch): Split at playhead

**Files:**
- Modify: `src/store/editorSlice.ts` (add `splitClip`), `App.tsx` (button)

- [ ] **Step 1: splitClip reducer** — at the playhead frame, cut one clip into two with a correctly advanced in-point.

Add to `editorSlice.ts` reducers:
```ts
splitClip(state, action: PayloadAction<{ id: string; atFrame: number }>) {
  const clip = state.clips.find((c) => c.id === action.payload.id);
  if (!clip) return;
  const offset = action.payload.atFrame - clip.from;
  if (offset <= 0 || offset >= clip.durationInFrames) return;
  const right = {
    ...clip,
    id: `${clip.id}_b_${state.clips.length}`,
    from: clip.from + offset,
    durationInFrames: clip.durationInFrames - offset,
    trimStart: clip.trimStart + offset,
  };
  clip.durationInFrames = offset;
  state.clips.push(right);
}
```
Export `splitClip`.

- [ ] **Step 2: Button** in `App.tsx`: split the selected clip at `playback.currentFrame`.

- [ ] **Step 3: Verify** — split produces two abutting clips; both play continuously across the cut. Commit:
```bash
git add src/store/editorSlice.ts App.tsx
git commit -m "feat: split clip at playhead with advanced in-point"
```

---

## Task 12 (stretch): Merge adjacent clips

**Files:**
- Modify: `src/store/editorSlice.ts` (add `mergeAdjacent`), `App.tsx` (button)

- [ ] **Step 1: mergeAdjacent reducer** — join two same-track, same-source, contiguous-in-point clips.

Add to reducers:
```ts
mergeAdjacent(state, action: PayloadAction<{ leftId: string; rightId: string }>) {
  const left = state.clips.find((c) => c.id === action.payload.leftId);
  const right = state.clips.find((c) => c.id === action.payload.rightId);
  if (!left || !right) return;
  const sameTrackSource = left.trackId === right.trackId && left.src === right.src;
  const contiguousInPoint = left.trimStart + left.durationInFrames === right.trimStart;
  const abuts = left.from + left.durationInFrames === right.from;
  if (!sameTrackSource || !contiguousInPoint || !abuts) return;
  left.durationInFrames += right.durationInFrames;
  state.clips = state.clips.filter((c) => c.id !== right.id);
}
```
Export `mergeAdjacent`.

- [ ] **Step 2: Button** in `App.tsx` to merge the selected clip with its right neighbor (find by track + abutment).

- [ ] **Step 3: Verify** — splitting then merging returns to one clip; merge is rejected when sources/in-points don't line up. Commit:
```bash
git add src/store/editorSlice.ts App.tsx
git commit -m "feat: merge contiguous same-source clips"
```

---

## Task 13: README + approach write-up

**Files:**
- Create: `README.md`, `APPROACH.md`

- [ ] **Step 1: README** — what it is, `npm install && npm run dev`, `npm test`, the four tracks, what works (move/trim/sync) and what's stretch.

- [ ] **Step 2: APPROACH.md** — the interview narrative: the one-source-of-truth thesis, clip→`<Sequence>` mapping, frames-canonical decision, the `trimStart` left/right asymmetry, Remotion-as-renderer-only, what was scoped in/out for 24h and why, and how you'd extend it (snapping, waveforms, keyframes). Reference the prompting workflow used to build it.

- [ ] **Step 3: Final verification**

Run: `npm test` (all pure-layer tests pass) and `npm run dev` (full demo works end to end).

- [ ] **Step 4: Commit**

```bash
git add README.md APPROACH.md
git commit -m "docs: readme and approach write-up"
```

---

## Self-review notes (spec coverage)

- Four layer types → Task 4 renderers + seed. ✓
- Drag-to-move (must) → Task 8. ✓
- Trim with in-point (must) → Task 9 + reducer tests Task 3. ✓
- Player↔playhead sync → Task 7. ✓
- One-source-of-truth → Tasks 4–8 all derive from `editor` state. ✓
- Merge (brief, stretch) → Task 12; data model supports it from Task 1. ✓
- Undo/redo (stretch, narrative) → Task 10. ✓
- Tests on pure layers (spec §10) → Tasks 2 & 3. ✓
- Type consistency: `moveClip/trimClipLeft/trimClipRight/selectClip/splitClip/mergeAdjacent` names match across slice, hooks, and tests. ✓
