# Multilayer Timeline Editor — Design Spec

> Take-home assignment. Build a multilayer timeline editor with a Remotion-powered preview.
> Timebox: ~24h. Submission: GitHub repo + short write-up.

## 1. Problem

Build a video-editor timeline with multiple layers:

- Multiple **video** clips on video track(s) — movable and trimmable, mergeable (stretch).
- An **audio** track.
- A **visual / overlay** layer (images, shapes, graphics).
- A **subtitle** layer.

The preview/playback uses Remotion's `<Player>` (`@remotion/player`). The **timeline component itself is built from scratch** — Remotion does not ship a reusable timeline; it only provides the playback engine and a `PlayerRef`.

### Must-have (core demo)
- Render all four layer types in the player, in sync.
- **Drag to move** clips along their track.
- **Trim edges** (resize) to shorten/extend a clip, with a correct source in-point.
- Playhead synced bidirectionally with the player.

### Stretch (only if core lands with time to spare)
- Undo / redo (dual-stack command history).
- Split at playhead.
- Merge adjacent clips.

## 2. Architectural thesis

**One source of truth — the edit document — with two pure views of it.**

```
                 ┌──────────────────┐
   interactions  │   Edit document  │
   (drag, trim) ─▶│  (Redux store)   │
                 └────────┬─────────┘
                          │ both views derive from the model
            ┌─────────────┴──────────────┐
            ▼                             ▼
   Remotion <Player>               Timeline UI
   (renders frame N from           (draws clips as blocks
    the model)                      from the model)
```

Interactions never mutate the player or the DOM directly — they dispatch actions that mutate the document, and both views re-derive. This collapses the classic "keep two stateful things in sync" problem into a single state with two render functions.

**Remotion mapping:** a clip maps 1:1 onto a Remotion `<Sequence>`:

```tsx
<Sequence from={clip.from} durationInFrames={clip.durationInFrames}>
  <OffthreadVideo src={clip.src} startFrom={clip.trimStart} />
</Sequence>
```

The timing primitive already exists; the composition is just `model → Sequences`.

## 3. Domain model

Canonical time unit = **frames** (single `FPS` constant). Frames-canonical = no rounding drift, frame-accurate trims, exact player. Pixels and seconds are *derived* via pure helpers.

```ts
type ClipType = "video" | "audio" | "visual" | "subtitle";

interface Clip {
  id: string;
  trackId: string;
  type: ClipType;
  from: number;             // timeline start position, in frames
  durationInFrames: number; // length shown on the timeline
  trimStart: number;        // in-point into the source media (frames)
  src?: string;             // media url (video / audio / visual)
  text?: string;            // subtitle / text content
  style?: ClipStyle;        // subtitle styling + position
}

interface Track {
  id: string;
  type: ClipType;           // gates which clip types it accepts
  order: number;            // vertical order + z-index in the player
}
```

**The `trimStart` rule (the correctness core):**
- Trim **left** edge → change `from` **and** `trimStart` (and `durationInFrames`); the media in-point shifts so the visible content stays anchored.
- Trim **right** edge → change only `durationInFrames`; in-point unchanged.
- Clamp so `trimStart >= 0` and the clip can't invert (min duration = 1 frame).

This in-point is what separates a real NLE model from a toy, and makes merge trivial later (adjacent same-source clips with contiguous in-points collapse into one).

## 4. State (Redux Toolkit)

- `editorSlice`: `{ tracks, clips, fps, durationInFrames, selectedClipId }`
  - actions: `addClip`, `moveClip({id, from, trackId?})`, `trimClipLeft({id, deltaFrames})`, `trimClipRight({id, deltaFrames})`, `selectClip`.
  - reducers contain the clamping/validation so interactions stay dumb.
- `playbackSlice` (thin): `{ currentFrame, isPlaying }` — a *mirror* for the playhead. The `PlayerRef` is the real clock; Redux follows it via the `frameupdate` event.
- **Stretch** `history`: past/present/future wrapper (dual-stack command pattern) enabling undo/redo.

## 5. Coordinate layer (pure)

One module owns all unit math — nothing else does time conversion:

```ts
framesToPx(frames, pxPerFrame)      // layout
pxToFrames(px, pxPerFrame)          // pointer → model
framesToSeconds(frames, fps)        // labels
secondsToFrames(seconds, fps)
```

`pxPerFrame` is the zoom factor (single number). Zoom = change it.

## 6. Remotion composition

`Composition.tsx` reads the model and emits, per track (ordered) → per clip, a `<Sequence>` wrapping a small per-type renderer:

- `video`  → `<OffthreadVideo src startFrom={trimStart} />`
- `audio`  → `<Audio src startFrom={trimStart} />`
- `visual` → absolutely-positioned `<Img>` / element
- `subtitle` → absolutely-positioned styled `<div>` (visible for its sequence window)

Track `order` → z-index / stacking. Composition is a pure function of props (the model is passed via the player's `inputProps`).

## 7. Timeline UI

```
timeline/
  Timeline      orchestrates ruler + tracks + playhead; owns pxPerFrame (zoom)
  Ruler         time ticks + labels (frames→seconds)
  Track         one row; lays out its clips
  Clip          absolutely positioned block: left = from*pxPerFrame, width = dur*pxPerFrame
  TrimHandle    left/right edge grips on a selected clip
  Playhead      draggable vertical line
```

- **Drag-to-move** (`useDragClip`): pointerdown on clip → track pointer delta → `pxToFrames` → `moveClip`. Optional snapping to grid/neighbors. Cross-track move only onto a type-compatible track.
- **Trim** (`useTrimClip`): pointerdown on a handle → delta → `trimClipLeft/Right`. Live preview from store updates.
- **Playhead sync** (`usePlayerSync`): subscribe to `PlayerRef` `frameupdate` → update `currentFrame`; drag playhead → `playerRef.seekTo(frame)`. Bidirectional, event-driven.

## 8. Folder structure

```
src/
  model/        types.ts, factories (makeClip, makeTrack), seed data
  store/        store.ts, editorSlice.ts, playbackSlice.ts, selectors.ts
  remotion/     Composition.tsx, VideoClip, AudioClip, VisualClip, SubtitleClip
  timeline/     Timeline, Ruler, Track, Clip, TrimHandle, Playhead
  helpers/      coords.ts, id.ts, snapping.ts
  hooks/        usePlayerSync, useDragClip, useTrimClip
  App.tsx       <Player/> (top) + <Timeline/> (bottom)
```

## 9. Build order

1. Model + store + seed + static Remotion composition → clips render & play. *(Proves the source-of-truth thesis end to end.)*
2. Timeline render (ruler, tracks, clip blocks) + playhead sync.
3. Drag-to-move.
4. Trim edges.
5. Stretch: undo/redo → split → merge.

Each step is independently demoable; if time runs out, every completed step is a working slice.

## 10. Testing

- Unit-test the pure layers without React: `coords.ts` conversions, and the `editorSlice` reducers (move clamps to track bounds; left-trim adjusts `from`+`trimStart`+`duration` together; right-trim adjusts only `duration`; min-duration guard). These reducer tests are where the assignment's real logic lives, so they're the highest-value tests.

## 11. Scope discipline / tradeoffs (for the write-up)

- **Build core first, stretch last** — a polished move+trim+sync beats four half-features.
- **Frames-canonical** chosen over seconds for player exactness and drift-free trims.
- **Remotion = renderer only**; timeline, model, interactions are all hand-built.
- **Redux** chosen (over lighter options) to keep the door open for the dual-stack undo/redo as the stretch.
- Source media: a small set of public sample assets (video/audio/image) committed or linked; no upload pipeline (out of scope).
