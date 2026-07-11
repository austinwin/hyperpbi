import type { ComponentInteractionDefinition } from "../../interactions/interactionTypes";
import type { UiAction } from "../../schema/uiSchema";

export const SVG_ELEMENT_TYPES = ["g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan", "defs", "linearGradient", "radialGradient", "stop", "clipPath", "mask", "marker", "title", "desc"] as const;
export type SvgElementType = typeof SVG_ELEMENT_TYPES[number];

export const SVG_ANIMATION_PRESETS = ["fade-in", "slide-in", "scale-in", "pulse", "float", "swim", "rotate", "draw-path", "progress-fill", "follow-progress", "flow-dash", "blink-status", "bounce", "shimmer"] as const;
export type SvgAnimationPreset = typeof SVG_ANIMATION_PRESETS[number];
export type SvgAnimationTrigger = "auto" | "hover" | "focus" | "selected" | "dataChange" | "state" | "none";
export type SvgPrimitive = string | number | boolean | null;

export interface SvgScaleDefinition {
    type?: "linear" | "threshold" | "ordinal";
    domain: number[] | string[] | "auto";
    range: SvgPrimitive[];
    clamp?: boolean;
}

export interface SvgConditionDefinition {
    field: string;
    operator: "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in" | "between";
    value: unknown;
}

export interface SvgBoundValue {
    bind?: string;
    template?: string;
    scale?: SvgScaleDefinition;
    map?: Record<string, SvgPrimitive>;
    fallback?: SvgPrimitive;
    when?: SvgConditionDefinition;
    then?: SvgPrimitive;
    else?: SvgPrimitive;
    state?: string;
    equals?: SvgPrimitive | { template: string };
}

export type SvgValue = SvgPrimitive | SvgBoundValue;

export interface SvgPositionDefinition {
    x?: SvgValue;
    y?: SvgValue;
    rotate?: SvgValue;
    scale?: SvgValue;
}

export interface SvgKeyframeDefinition {
    offset: number;
    opacity?: number;
    transform?: string;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeOpacity?: number;
    strokeWidth?: number;
    strokeDashoffset?: number;
    x?: number;
    y?: number;
    cx?: number;
    cy?: number;
    r?: number;
    width?: number;
    height?: number;
}

export interface SvgAnimationDefinition {
    preset?: SvgAnimationPreset;
    trigger?: SvgAnimationTrigger;
    durationMs?: number;
    delayMs?: number;
    easing?: string;
    iterationCount?: number | "infinite";
    direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
    fillMode?: "none" | "forwards" | "backwards" | "both";
    stateKey?: string;
    stateValue?: SvgPrimitive;
    keyframes?: SvgKeyframeDefinition[];
}

export interface SvgRepeatDefinition {
    dataset?: string;
    limit?: number;
    keyField?: string;
    children: SvgElementDefinition[];
}

interface SvgElementBase {
    type: SvgElementType;
    id?: string;
    className?: string;
    ariaLabel?: string;
    hidden?: SvgValue;
    opacity?: SvgValue;
    transform?: SvgValue;
    position?: SvgPositionDefinition;
    fill?: SvgValue;
    fillOpacity?: SvgValue;
    stroke?: SvgValue;
    strokeWidth?: SvgValue;
    strokeOpacity?: SvgValue;
    strokeDasharray?: SvgValue;
    strokeDashoffset?: SvgValue;
    strokeLinecap?: "butt" | "round" | "square";
    strokeLinejoin?: "miter" | "round" | "bevel";
    vectorEffect?: "none" | "non-scaling-stroke";
    paintOrder?: string;
    clipPath?: string;
    mask?: string;
    filter?: string;
    markerStart?: string;
    markerMid?: string;
    markerEnd?: string;
    visibility?: "visible" | "hidden" | "collapse";
    pointerEvents?: "none" | "auto" | "visiblePainted" | "visible" | "painted" | "fill" | "stroke" | "all";
    interaction?: ComponentInteractionDefinition;
    uiAction?: UiAction | UiAction[];
    animation?: SvgAnimationDefinition;
    repeat?: SvgRepeatDefinition;
    children?: SvgElementDefinition[];
}

export interface SvgShapeElement extends SvgElementBase {
    type: "path" | "rect" | "circle" | "ellipse" | "line" | "polyline" | "polygon";
    x?: SvgValue; y?: SvgValue; x1?: SvgValue; y1?: SvgValue; x2?: SvgValue; y2?: SvgValue;
    cx?: SvgValue; cy?: SvgValue; r?: SvgValue; rx?: SvgValue; ry?: SvgValue;
    width?: SvgValue; height?: SvgValue; d?: string; points?: string; pathLength?: SvgValue;
}

export interface SvgTextElement extends SvgElementBase {
    type: "text" | "tspan" | "title" | "desc";
    text?: SvgValue; x?: SvgValue; y?: SvgValue; dx?: SvgValue; dy?: SvgValue;
    textAnchor?: "start" | "middle" | "end"; dominantBaseline?: string;
    fontFamily?: string; fontSize?: SvgValue; fontWeight?: string | number; fontStyle?: "normal" | "italic" | "oblique"; letterSpacing?: SvgValue;
}

export interface SvgGradientElement extends SvgElementBase {
    type: "linearGradient" | "radialGradient" | "stop";
    x1?: SvgValue; y1?: SvgValue; x2?: SvgValue; y2?: SvgValue; cx?: SvgValue; cy?: SvgValue; r?: SvgValue; fx?: SvgValue; fy?: SvgValue;
    offset?: SvgValue; stopColor?: SvgValue; stopOpacity?: SvgValue; gradientUnits?: "objectBoundingBox" | "userSpaceOnUse";
    gradientTransform?: string; spreadMethod?: "pad" | "reflect" | "repeat";
}

export interface SvgContainerElement extends SvgElementBase {
    type: "g" | "defs" | "clipPath" | "mask" | "marker";
    markerWidth?: SvgValue; markerHeight?: SvgValue; refX?: SvgValue; refY?: SvgValue;
    orient?: string; markerUnits?: "strokeWidth" | "userSpaceOnUse"; viewBox?: string; preserveAspectRatio?: string;
}

export type SvgElementDefinition = SvgShapeElement | SvgTextElement | SvgGradientElement | SvgContainerElement;

export interface SvgDataContextDefinition {
    mode: "aggregate" | "selectedRow" | "first";
    sortBy?: string;
    sortDirection?: "asc" | "desc";
}

export interface SvgMotionOptions {
    enabled?: boolean;
    reducedMotion?: "respect-system" | "always-reduce" | "never-reduce";
    maxConcurrentAnimations?: number;
}

export interface SvgPerformanceOptions {
    maxElements?: number;
    maxAnimatedElements?: number;
    maxRepeatedRows?: number;
}

export const SVG_LIMITS = Object.freeze({
    maxElementsPerComponent: 500,
    maxElementsPerDashboard: 2_000,
    maxAnimatedPerComponent: 20,
    maxAnimatedPerDashboard: 50,
    defaultRepeatRows: 100,
    maxRepeatRows: 250,
    maxPathLength: 20_000,
    maxGradients: 50,
    maxMasks: 25,
    maxClipPaths: 50,
    maxMarkers: 50,
    maxDepth: 20,
    maxRepeatDepth: 1,
});
