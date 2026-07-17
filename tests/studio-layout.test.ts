import { describe, expect, it } from "vitest";
import {
  defaultStudioLayout,
  parseStudioLayout,
} from "../src/editor/studioLayout";

describe("Studio layout preferences", () => {
  it("uses guided, diagnostics-open defaults", () => {
    expect(defaultStudioLayout).toEqual({
      editorPercent: 38,
      bottomHeight: 210,
      bottomOpen: true,
      advanced: false,
    });
  });

  it.each([
    [
      { editorPercent: 99, bottomHeight: 20, advanced: true },
      { editorPercent: 75, bottomHeight: 120, advanced: true },
    ],
    [
      { editorPercent: -5, bottomHeight: 900, bottomOpen: false },
      { editorPercent: 25, bottomHeight: 520, bottomOpen: false },
    ],
    [
      { editorPercent: 25, bottomHeight: 120 },
      { editorPercent: 25, bottomHeight: 120 },
    ],
    [
      { editorPercent: 75, bottomHeight: 520 },
      { editorPercent: 75, bottomHeight: 520 },
    ],
  ])("normalizes persisted pane sizes for %j", (input, expected) => {
    expect(parseStudioLayout(JSON.stringify(input))).toMatchObject(expected);
  });

  it.each([undefined, "", "bad", "null", "[]"])(
    "recovers from an unusable persisted value %j",
    (value) => {
      expect(parseStudioLayout(value)).toEqual(defaultStudioLayout);
    },
  );

  it("fills omitted values from defaults without discarding valid choices", () => {
    expect(parseStudioLayout(JSON.stringify({ advanced: true }))).toEqual({
      ...defaultStudioLayout,
      advanced: true,
    });
  });
});
