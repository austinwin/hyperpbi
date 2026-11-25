type ResizeListener = (width: number, height: number) => void;
type SizeObserver = {
    observer: ResizeObserver;
    listeners: WeakMap<Element, ResizeListener>;
    count: number;
};

const observers = new WeakMap<Document, SizeObserver>();

/** A single native size observer serves the chart surfaces in a document. */
export function observeChartSize(element: HTMLElement, onSize: ResizeListener): (() => void) | undefined {
    if (typeof ResizeObserver === "undefined") return undefined;
    const owner = element.ownerDocument;
    let subscription = observers.get(owner);
    if (!subscription) {
        const listeners = new WeakMap<Element, ResizeListener>();
        const observer = new ResizeObserver(entries => {
            for (const { target, contentRect } of entries) {
                listeners.get(target)?.(Math.round(contentRect.width), Math.round(contentRect.height));
            }
        });
        subscription = { observer, listeners, count: 0 };
        observers.set(owner, subscription);
    }
    const { observer, listeners } = subscription;
    listeners.set(element, onSize);
    subscription.count++;
    observer.observe(element);
    return () => {
        listeners.delete(element);
        observer.unobserve(element);
        if (--subscription.count === 0) {
            observer.disconnect();
            observers.delete(owner);
        }
    };
}
