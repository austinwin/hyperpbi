import type { MapComponent } from "../../../schema/hyperpbiSchema";

export interface ResolvedMapSizing {
  mode: "fixed" | "fill" | "aspectRatio";
  className: string;
  frameStyle: Record<string, string>;
}

export function resolveMapSizing(
  component: MapComponent,
  options: { studioPreview?: boolean } = {},
): ResolvedMapSizing {
  const mode = component.heightMode ?? (options.studioPreview ? "fill" : "fixed");
  const minHeight = Math.max(160, Math.min(2000, component.minHeight ?? 220));
  if (mode === "fill")
    return {
      mode,
      className: "is-fill",
      frameStyle: { minHeight: `${minHeight}px`, height: "100%" },
    };
  if (mode === "aspectRatio") {
    const ratio = Math.max(0.25, Math.min(8, component.aspectRatio ?? 16 / 9));
    return {
      mode,
      className: "is-aspect-ratio",
      frameStyle: { minHeight: `${minHeight}px`, aspectRatio: String(ratio) },
    };
  }
  const height = Math.max(minHeight, Math.min(2000, component.height ?? 420));
  return {
    mode: "fixed",
    className: "is-fixed",
    frameStyle: { minHeight: `${minHeight}px`, height: `${height}px` },
  };
}
