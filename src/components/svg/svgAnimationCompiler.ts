import type { SvgAnimationDefinition, SvgAnimationPreset, SvgElementType, SvgKeyframeDefinition } from "./svgTypes";
import { safeSvgIdentifier } from "./svgIdIsolation";

interface Preset { duration: number; easing: string; iterations: number | "infinite"; infinite: boolean; frames: string; elements?: SvgElementType[]; }
const presets: Record<SvgAnimationPreset, Preset> = {
    "fade-in": { duration: 500, easing: "ease-out", iterations: 1, infinite: false, frames: "0%{opacity:0}100%{opacity:1}" },
    "slide-in": { duration: 600, easing: "ease-out", iterations: 1, infinite: false, frames: "0%{opacity:0;transform:translate(-16px,0)}100%{opacity:1;transform:translate(0,0)}" },
    "scale-in": { duration: 500, easing: "ease-out", iterations: 1, infinite: false, frames: "0%{opacity:0;transform:scale(.85)}100%{opacity:1;transform:scale(1)}" },
    pulse: { duration: 1600, easing: "ease-in-out", iterations: "infinite", infinite: true, frames: "0%,100%{opacity:.75}50%{opacity:1}" },
    float: { duration: 2400, easing: "ease-in-out", iterations: "infinite", infinite: true, frames: "0%,100%{transform:translate(0,0)}50%{transform:translate(0,-6px)}" },
    swim: { duration: 1600, easing: "ease-in-out", iterations: "infinite", infinite: true, frames: "0%,100%{transform:translate(0,0) rotate(-2deg)}50%{transform:translate(8px,-3px) rotate(2deg)}" },
    rotate: { duration: 2400, easing: "linear", iterations: "infinite", infinite: true, frames: "0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}" },
    "draw-path": { duration: 1200, easing: "ease-out", iterations: 1, infinite: false, elements: ["path", "line", "polyline", "polygon"], frames: "0%{stroke-dashoffset:1}100%{stroke-dashoffset:0}" },
    "progress-fill": { duration: 1000, easing: "ease-out", iterations: 1, infinite: false, elements: ["rect", "line", "path"], frames: "0%{transform:scaleX(0)}100%{transform:scaleX(1)}" },
    "follow-progress": { duration: 1000, easing: "ease-out", iterations: 1, infinite: false, frames: "0%{opacity:.4;transform:translate(-10px,0)}100%{opacity:1;transform:translate(0,0)}" },
    "flow-dash": { duration: 1800, easing: "linear", iterations: "infinite", infinite: true, elements: ["path", "line", "polyline", "polygon"], frames: "0%{stroke-dashoffset:24}100%{stroke-dashoffset:0}" },
    "blink-status": { duration: 2200, easing: "ease-in-out", iterations: 3, infinite: false, frames: "0%,100%{opacity:.7}50%{opacity:1}" },
    bounce: { duration: 1200, easing: "ease-in-out", iterations: "infinite", infinite: true, frames: "0%,100%{transform:translate(0,0)}50%{transform:translate(0,-8px)}" },
    shimmer: { duration: 1800, easing: "linear", iterations: "infinite", infinite: true, frames: "0%{opacity:.55}50%{opacity:1}100%{opacity:.55}" },
};
const propertyNames: Record<string, string> = { fillOpacity: "fill-opacity", strokeOpacity: "stroke-opacity", strokeWidth: "stroke-width", strokeDashoffset: "stroke-dashoffset" };
const formatFrame = (frame: SvgKeyframeDefinition): string => { const declarations = Object.entries(frame).filter(([key]) => key !== "offset").map(([key, value]) => `${propertyNames[key] ?? key}:${String(value)}`).join(";"); return `${Math.round(frame.offset * 10000) / 100}%{${declarations}}`; };

export interface CompiledSvgAnimation { className: string; css: string; warning?: string; infinite: boolean; }
export function compileSvgAnimation(animation: SvgAnimationDefinition, elementType: SvgElementType, namespace: string, localKey: string, reduced: boolean): CompiledSvgAnimation {
    const preset = animation.preset ? presets[animation.preset] : undefined;
    if (preset?.elements && !preset.elements.includes(elementType)) return { className: "", css: "", warning: `${animation.preset} is not supported on ${elementType}.`, infinite: false };
    const frames = animation.keyframes?.length ? animation.keyframes.map(formatFrame).join("") : preset?.frames ?? "0%{opacity:1}100%{opacity:1}";
    const duration = Math.max(100, Math.min(60_000, animation.durationMs ?? preset?.duration ?? 600)); const delay = Math.max(0, Math.min(30_000, animation.delayMs ?? 0)); const requested = animation.iterationCount ?? preset?.iterations ?? 1; const infinite = requested === "infinite" && (preset?.infinite ?? false); const iterations = reduced ? 1 : requested === "infinite" && !infinite ? 1 : requested;
    const name = safeSvgIdentifier(`${namespace}-${localKey}-${animation.preset ?? "keyframes"}`); const className = safeSvgIdentifier(`${name}-target`); const trigger = animation.trigger ?? "auto"; const selector = trigger === "hover" ? `.${className}:hover` : trigger === "focus" ? `.${className}:focus` : trigger === "none" ? `.${className}.hp-svg-animation-disabled` : `.${className}`;
    if (trigger === "none" || reduced) return { className, css: `.${className}{animation:none!important}`, infinite };
    const shorthand = `${name} ${duration}ms ${animation.easing ?? preset?.easing ?? "ease"} ${delay}ms ${iterations} ${animation.direction ?? "normal"} ${animation.fillMode ?? "both"}`;
    return { className, css: `@keyframes ${name}{${frames}}${selector}{animation:${shorthand};transform-box:fill-box;transform-origin:center}.hp-svg-paused .${className}{animation-play-state:paused!important}@media (prefers-reduced-motion:reduce){.${className}{animation:none!important}}`, infinite };
}
export const svgAnimationPresets = presets;
