if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver = class ResizeObserver {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
    };
}

const canvasContexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value(this: HTMLCanvasElement, contextId: string) {
        if (contextId !== "2d") return null;
        const existing = canvasContexts.get(this);
        if (existing) return existing;
        const noop = () => undefined;
        const gradient = { addColorStop: noop };
        const target: Record<string, unknown> = {
            canvas: this,
            measureText: (text: string) => ({ width: String(text).length * 7 }),
            createLinearGradient: () => gradient,
            createRadialGradient: () => gradient,
            createPattern: () => null,
            getLineDash: () => [],
            setLineDash: noop,
        };
        const proxy = new Proxy(target, {
            get(object, property) {
                if (property in object) return object[String(property)];
                return noop;
            },
            set(object, property, value) {
                object[String(property)] = value;
                return true;
            },
        }) as unknown as CanvasRenderingContext2D;
        canvasContexts.set(this, proxy);
        return proxy;
    },
});
