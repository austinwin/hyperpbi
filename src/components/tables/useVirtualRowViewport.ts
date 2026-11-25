import { useCallback, useEffect, useRef, useState } from "preact/hooks";

export function useVirtualRowViewport(enabled: boolean) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const frame = useRef<number>();
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(480);
    const onScroll = () => {
        if (frame.current !== undefined) return;
        frame.current = requestAnimationFrame(() => {
            frame.current = undefined;
            setScrollTop(viewportRef.current?.scrollTop ?? 0);
        });
    };
    const resetScroll = useCallback(() => {
        if (viewportRef.current) viewportRef.current.scrollTop = 0;
        setScrollTop(0);
    }, []);
    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport || !enabled) return;
        const measure = () => {
            if (viewport.clientHeight > 0) setViewportHeight(viewport.clientHeight);
        };
        measure();
        const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
        observer?.observe(viewport);
        return () => {
            observer?.disconnect();
            if (frame.current !== undefined) cancelAnimationFrame(frame.current);
            frame.current = undefined;
        };
    }, [enabled]);
    return { viewportRef, scrollTop, viewportHeight, onScroll, resetScroll };
}
