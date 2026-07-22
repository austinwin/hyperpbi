import { describe, expect, it, vi } from "vitest";
import { BrowserHostBridge } from "../src/host/BrowserHostBridge";

describe("BrowserHostBridge", () => {
    it("clearly rejects Power BI selection and external filtering", async () => {
        const report = vi.fn();
        const bridge = new BrowserHostBridge(report);
        await expect(bridge.requestSelection({ rowIndices: [0] })).resolves.toMatchObject({ supported: false, success: false, code: "WEB_HOST_SELECTION_UNSUPPORTED" });
        await expect(bridge.requestExternalFilter({ field: "status", operator: "=", value: "Open" })).resolves.toMatchObject({ supported: false, success: false, code: "WEB_HOST_EXTERNAL_FILTER_UNSUPPORTED" });
        expect(bridge.selectExternal([0])).toEqual({ sent: false, reason: "unsupported by web host" });
        expect(bridge.applyExternalFilter("status", "=", "Open")).toEqual({ sent: false, reason: "unsupported by web host" });
        expect(report).toHaveBeenCalled();
    });

    it("rejects executable URL schemes", () => {
        const bridge = new BrowserHostBridge();
        bridge.openUrl("javascript:alert(1)");
        expect(bridge.diagnostics.at(-1)?.code).toBe("WEB_HOST_URL_REJECTED");
    });
});
