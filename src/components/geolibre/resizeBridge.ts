export interface GeoLibreResizeHandle {
  notify(): void;
  disconnect(): void;
}

/**
 * Keep the iframe viewport exactly aligned with its responsive host. Browsers
 * fire the framed window's resize event when these dimensions change, which is
 * the supported MapLibre/GeoLibre resize path and avoids cross-origin access.
 */
export function observeGeoLibreResize(
  host: HTMLElement,
  iframe: HTMLIFrameElement,
): GeoLibreResizeHandle {
  let frame = 0;
  let lastWidth = -1;
  let lastHeight = -1;
  let disconnected = false;

  const apply = () => {
    frame = 0;
    if (disconnected) return;
    const bounds = host.getBoundingClientRect();
    const width = Math.max(0, Math.round(bounds.width));
    const height = Math.max(0, Math.round(bounds.height));
    if (width === 0 || height === 0 || (width === lastWidth && height === lastHeight)) return;
    lastWidth = width;
    lastHeight = height;
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
  };
  const notify = () => {
    if (disconnected || frame) return;
    frame = requestAnimationFrame(apply);
  };

  const resizeObserver =
    typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(notify);
  resizeObserver?.observe(host);
  const intersectionObserver =
    typeof IntersectionObserver === "undefined"
      ? undefined
      : new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) notify();
        });
  intersectionObserver?.observe(host);
  window.addEventListener("resize", notify);
  iframe.addEventListener("load", notify);
  notify();

  return {
    notify,
    disconnect() {
      if (disconnected) return;
      disconnected = true;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener("resize", notify);
      iframe.removeEventListener("load", notify);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
