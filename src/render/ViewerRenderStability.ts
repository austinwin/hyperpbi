export interface ViewerFailureCallbacks {
    showLoading: () => void;
    showFailure: () => void;
}

/**
 * Keeps transient Power BI data-view churn from replacing a valid viewer with
 * validation diagnostics. Valid renders stay immediate; only invalid viewer
 * states are delayed long enough to determine whether they are stable.
 */
export class ViewerRenderStability {
    private pending?: { signature: string; timer: ReturnType<typeof setTimeout> };
    private shownFailureSignature?: string;
    private hasStableViewer = false;

    constructor(private readonly delayMs = 900) {}

    public markSuccess(): void {
        this.hasStableViewer = true;
        this.cancelPending();
        this.shownFailureSignature = undefined;
    }

    /** Reset when the DOM is intentionally replaced by editor/setup/landing UI. */
    public reset(): void {
        this.hasStableViewer = false;
        this.cancelPending();
        this.shownFailureSignature = undefined;
    }

    public fail(signature: string, callbacks: ViewerFailureCallbacks): void {
        if (this.shownFailureSignature === signature || this.pending?.signature === signature) return;

        this.cancelPending();
        this.shownFailureSignature = undefined;

        if (!this.hasStableViewer) callbacks.showLoading();

        const timer = setTimeout(() => {
            if (this.pending?.signature !== signature) return;
            this.pending = undefined;
            this.shownFailureSignature = signature;
            callbacks.showFailure();
        }, this.delayMs);

        this.pending = { signature, timer };
    }

    public dispose(): void {
        this.reset();
    }

    private cancelPending(): void {
        if (this.pending) clearTimeout(this.pending.timer);
        this.pending = undefined;
    }
}
