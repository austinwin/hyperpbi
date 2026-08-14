import { afterEach, describe, expect, it, vi } from "vitest";
import { observeGeoLibreResize } from "../src/components/geolibre/resizeBridge";

afterEach(() => vi.restoreAllMocks());

describe("GeoLibre responsive resize bridge", () => {
  it("updates the iframe only for visible, changed shell dimensions and disconnects cleanly", () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { callbacks.push(callback); return callbacks.length; });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    const host = document.createElement("div");
    const iframe = document.createElement("iframe");
    let bounds = { width: 801.4, height: 499.6 };
    vi.spyOn(host, "getBoundingClientRect").mockImplementation(() => ({ ...bounds, x: 0, y: 0, top: 0, left: 0, right: bounds.width, bottom: bounds.height, toJSON: () => ({}) }));
    const handle = observeGeoLibreResize(host, iframe);
    callbacks.shift()!(0);
    expect(iframe.style.width).toBe("801px");
    expect(iframe.style.height).toBe("500px");
    handle.notify();
    callbacks.shift()!(1);
    expect(iframe.style.cssText).toContain("width: 801px");
    bounds = { width: 640, height: 360 };
    handle.notify();
    callbacks.shift()!(2);
    expect(iframe.style.width).toBe("640px");
    expect(iframe.style.height).toBe("360px");
    handle.disconnect();
    handle.notify();
    expect(callbacks).toHaveLength(0);
  });
});
