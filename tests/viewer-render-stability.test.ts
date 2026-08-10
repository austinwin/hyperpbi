import { afterEach, describe, expect, it, vi } from "vitest";
import { ViewerRenderStability } from "../src/render/ViewerRenderStability";

describe("ViewerRenderStability", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("keeps a previously valid viewer visible during a transient invalid state", () => {
        vi.useFakeTimers();
        const stability = new ViewerRenderStability(900);
        const showLoading = vi.fn();
        const showFailure = vi.fn();

        stability.markSuccess();
        stability.fail("missing-fields", { showLoading, showFailure });

        expect(showLoading).not.toHaveBeenCalled();
        expect(showFailure).not.toHaveBeenCalled();

        vi.advanceTimersByTime(500);
        stability.markSuccess();
        vi.advanceTimersByTime(500);

        expect(showFailure).not.toHaveBeenCalled();
    });

    it("shows a neutral loading state before the first stable viewer render", () => {
        vi.useFakeTimers();
        const stability = new ViewerRenderStability(900);
        const showLoading = vi.fn();
        const showFailure = vi.fn();

        stability.fail("initial-invalid", { showLoading, showFailure });

        expect(showLoading).toHaveBeenCalledTimes(1);
        expect(showFailure).not.toHaveBeenCalled();

        vi.advanceTimersByTime(899);
        expect(showFailure).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(showFailure).toHaveBeenCalledTimes(1);
    });

    it("does not restart the delay for repeated copies of the same invalid state", () => {
        vi.useFakeTimers();
        const stability = new ViewerRenderStability(900);
        const showLoading = vi.fn();
        const showFailure = vi.fn();

        stability.markSuccess();
        stability.fail("same-invalid-state", { showLoading, showFailure });
        vi.advanceTimersByTime(600);
        stability.fail("same-invalid-state", { showLoading, showFailure });
        vi.advanceTimersByTime(300);

        expect(showFailure).toHaveBeenCalledTimes(1);
    });

    it("restarts stabilization when the invalid state materially changes", () => {
        vi.useFakeTimers();
        const stability = new ViewerRenderStability(900);
        const showLoading = vi.fn();
        const showFailure = vi.fn();

        stability.markSuccess();
        stability.fail("invalid-a", { showLoading, showFailure });
        vi.advanceTimersByTime(600);
        stability.fail("invalid-b", { showLoading, showFailure });
        vi.advanceTimersByTime(300);

        expect(showFailure).not.toHaveBeenCalled();

        vi.advanceTimersByTime(600);
        expect(showFailure).toHaveBeenCalledTimes(1);
    });
});
