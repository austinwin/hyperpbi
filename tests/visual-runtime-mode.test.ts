import { describe, expect, it } from "vitest";
import { parseDataView } from "../src/data/parseDataView";
import { shouldRenderLandingPage } from "../src/powerbi/visualRuntimeMode";

describe("Power BI empty-data runtime mode", () => {
  it("renders a saved external-source specification without Values fields", () => {
    const emptyData = parseDataView();

    expect(shouldRenderLandingPage(emptyData, "")).toBe(true);
    expect(
      shouldRenderLandingPage(
        emptyData,
        '{"version":"2.0","components":[{"type":"map"}]}',
      ),
    ).toBe(false);
  });
});
