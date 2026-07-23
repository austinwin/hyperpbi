import * as L from "leaflet";
import type { ResolvedMapFeature, ResolvedMapRenderer } from "../../maps/model/resolvedMapTypes";
import { featureAttribute } from "../../maps/attributes/mapFeatureAttributes";

export interface HeatCanvasPoint {
    latitude: number;
    longitude: number;
    weight: number;
}

export interface LeafletHeatCanvasOptions {
    pane?: string;
    radius: number;
    blur: number;
    minOpacity: number;
    maxIntensity?: number;
    gradient: Record<number, string>;
    normalization: "global" | "viewport";
    minZoom?: number;
    maxZoom?: number;
    opacity?: number;
}

const DEFAULT_GRADIENT: Record<number, string> = {
    0.15: "#2563eb",
    0.35: "#06b6d4",
    0.55: "#22c55e",
    0.75: "#facc15",
    1: "#dc2626",
};

export function heatPointsFromFeatures(
    features: readonly ResolvedMapFeature[],
    renderer: ResolvedMapRenderer,
): HeatCanvasPoint[] {
    return features.flatMap((feature) => {
        const point = pointPosition(feature);
        if (!point) return [];
        const raw = renderer.weightField
            ? featureAttribute(feature, renderer.weightField, renderer.fieldSource ?? "joined")
            : 1;
        const weight = Number(raw);
        if (!Number.isFinite(weight) || weight <= 0) return [];
        return [{ latitude: point[0], longitude: point[1], weight }];
    });
}

export function normalizeHeatWeight(weight: number, maximum: number, minOpacity: number): number {
    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(maximum) || maximum <= 0) return 0;
    return Math.max(0, Math.min(1, minOpacity + weight / maximum * (1 - minOpacity)));
}

export class LeafletHeatCanvasLayer extends L.Layer {
    private points: HeatCanvasPoint[];
    private heatOptions: LeafletHeatCanvasOptions;
    private map?: L.Map;
    private canvas?: HTMLCanvasElement;
    private frame?: number;

    constructor(points: HeatCanvasPoint[], options: Partial<LeafletHeatCanvasOptions> = {}) {
        super();
        this.points = points;
        this.heatOptions = {
            radius: Math.max(4, Math.min(120, options.radius ?? 25)),
            blur: Math.max(0, Math.min(80, options.blur ?? 18)),
            minOpacity: Math.max(0, Math.min(1, options.minOpacity ?? 0.05)),
            gradient: options.gradient ?? DEFAULT_GRADIENT,
            normalization: options.normalization ?? "global",
            ...options,
        };
    }

    onAdd(map: L.Map): this {
        this.map = map;
        const canvas = document.createElement("canvas");
        canvas.className = "hp-map-heat-canvas";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.pointerEvents = "none";
        canvas.style.opacity = String(this.heatOptions.opacity ?? 1);
        this.canvas = canvas;
        const pane = map.getPane(this.heatOptions.pane ?? "overlayPane") ?? map.getPanes().overlayPane;
        pane.appendChild(canvas);
        map.on("moveend zoomend resize", this.scheduleDraw, this);
        this.scheduleDraw();
        return this;
    }

    onRemove(map: L.Map): this {
        map.off("moveend zoomend resize", this.scheduleDraw, this);
        if (this.frame !== undefined) cancelAnimationFrame(this.frame);
        this.frame = undefined;
        this.canvas?.remove();
        this.canvas = undefined;
        this.map = undefined;
        return this;
    }

    setData(points: HeatCanvasPoint[]): this {
        this.points = points;
        this.scheduleDraw();
        return this;
    }

    setOpacity(opacity: number): this {
        this.heatOptions.opacity = Math.max(0, Math.min(1, opacity));
        if (this.canvas) this.canvas.style.opacity = String(this.heatOptions.opacity);
        return this;
    }

    private scheduleDraw = (): void => {
        if (this.frame !== undefined) cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => {
            this.frame = undefined;
            this.draw();
        });
    };

    private draw(): void {
        const map = this.map;
        const canvas = this.canvas;
        if (!map || !canvas) return;
        const zoom = map.getZoom();
        const hidden =
            this.heatOptions.minZoom !== undefined && zoom < this.heatOptions.minZoom ||
            this.heatOptions.maxZoom !== undefined && zoom > this.heatOptions.maxZoom;
        canvas.hidden = hidden;
        if (hidden) return;
        const size = map.getSize();
        const ratio = Math.max(1, Math.min(2, globalThis.devicePixelRatio || 1));
        canvas.width = Math.max(1, Math.round(size.x * ratio));
        canvas.height = Math.max(1, Math.round(size.y * ratio));
        canvas.style.width = `${size.x}px`;
        canvas.style.height = `${size.y}px`;
        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(canvas, topLeft);
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, size.x, size.y);
        const bounds = map.getBounds().pad(0.2);
        const visible = this.points.filter((point) => bounds.contains([point.latitude, point.longitude]));
        const maximum = this.heatOptions.maxIntensity ??
            Math.max(1, ...(this.heatOptions.normalization === "viewport" ? visible : this.points).map((point) => point.weight));
        const radius = this.heatOptions.radius;
        const blur = this.heatOptions.blur;
        for (const point of visible) {
            const projected = map.latLngToContainerPoint([point.latitude, point.longitude]);
            const alpha = normalizeHeatWeight(point.weight, maximum, this.heatOptions.minOpacity);
            if (alpha <= 0) continue;
            const gradient = context.createRadialGradient(projected.x, projected.y, Math.max(0, radius - blur), projected.x, projected.y, radius + blur);
            gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
            gradient.addColorStop(Math.max(0.01, radius / (radius + blur || 1)), `rgba(0,0,0,${alpha * 0.65})`);
            gradient.addColorStop(1, "rgba(0,0,0,0)");
            context.fillStyle = gradient;
            context.fillRect(projected.x - radius - blur, projected.y - radius - blur, (radius + blur) * 2, (radius + blur) * 2);
        }
        colorize(context, canvas.width, canvas.height, this.heatOptions.gradient, ratio);
    }
}

function pointPosition(feature: ResolvedMapFeature): [number, number] | null {
    if (feature.lat !== null && feature.lon !== null && Number.isFinite(feature.lat) && Number.isFinite(feature.lon))
        return [feature.lat, feature.lon];
    if (feature.geometry?.type !== "Point") return null;
    const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

function colorize(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    authoredGradient: Record<number, string>,
    ratio: number,
): void {
    context.setTransform(1, 0, 0, 1, 0, 0);
    const image = context.getImageData(0, 0, width, height);
    const palette = gradientPalette(authoredGradient);
    for (let index = 0; index < image.data.length; index += 4) {
        const alpha = image.data[index + 3];
        if (!alpha) continue;
        const paletteIndex = Math.min(255, alpha) * 4;
        image.data[index] = palette[paletteIndex];
        image.data[index + 1] = palette[paletteIndex + 1];
        image.data[index + 2] = palette[paletteIndex + 2];
    }
    context.putImageData(image, 0, 0);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function gradientPalette(stops: Record<number, string>): Uint8ClampedArray {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) return new Uint8ClampedArray(256 * 4);
    const gradient = context.createLinearGradient(0, 0, 256, 0);
    const entries = Object.entries(stops).map(([stop, color]) => [Number(stop), color] as const)
        .filter(([stop]) => Number.isFinite(stop) && stop >= 0 && stop <= 1)
        .sort((left, right) => left[0] - right[0]);
    for (const [stop, color] of entries.length ? entries : Object.entries(DEFAULT_GRADIENT).map(([stop, color]) => [Number(stop), color] as const))
        gradient.addColorStop(stop, color);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 1);
    return context.getImageData(0, 0, 256, 1).data;
}
