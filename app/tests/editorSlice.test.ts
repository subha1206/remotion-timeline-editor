import { describe, it, expect } from "vitest";
import reducer, { moveClip, trimClipLeft, trimClipRight, selectClip } from "../src/store/editorSlice";
import type { EditorState } from "../src/model/types";

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
    expect(s.clips[0].from).toBe(80); // 50 + 30
    expect(s.clips[0].trimStart).toBe(50); // 20 + 30
    expect(s.clips[0].durationInFrames).toBe(70); // 100 - 30
  });

  it("trimClipLeft cannot push trimStart below 0", () => {
    const s = reducer(base(), trimClipLeft({ id: "c1", deltaFrames: -100 }));
    expect(s.clips[0].trimStart).toBe(0);
    expect(s.clips[0].from).toBe(30); // bounded by how far trimStart could go (20 frames)
    expect(s.clips[0].durationInFrames).toBe(120);
  });

  it("trimClipLeft clamps to MIN_CLIP_FRAMES (cannot invert the clip)", () => {
    const s = reducer(base(), trimClipLeft({ id: "c1", deltaFrames: 500 }));
    expect(s.clips[0].durationInFrames).toBe(1);
    expect(s.clips[0].from).toBe(149); // 50 + 99 (shrunk to min)
    expect(s.clips[0].trimStart).toBe(119); // 20 + 99
  });

  it("selectClip sets selectedClipId", () => {
    const s = reducer(base(), selectClip("c1"));
    expect(s.selectedClipId).toBe("c1");
  });
});
