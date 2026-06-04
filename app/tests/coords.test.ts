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
