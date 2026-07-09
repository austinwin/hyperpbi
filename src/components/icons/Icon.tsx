import { h } from "preact";
import type { IconName, UiSize } from "../../schema/uiSchema";
import { getIcon } from "./iconRegistry";
import { useMemo } from "preact/hooks";

export interface IconProps {
    name: IconName;
    size?: UiSize;
    className?: string;
    /** Required when the icon is the only content of a button or interactive element. */
    ariaLabel?: string;
    /** Set to true when the icon is purely decorative (alongside text). */
    decorative?: boolean;
}

const SIZE_MAP: Record<UiSize, number> = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
};

export function Icon({ name, size = "md", className = "", ariaLabel, decorative }: IconProps) {
    const definition = useMemo(() => getIcon(name), [name]);

    if (!definition) {
        // Render nothing for unknown icons — do not accept raw SVG
        return null;
    }

    const px = SIZE_MAP[size] ?? SIZE_MAP.md;

    const svg = h(
        "svg",
        {
            xmlns: "http://www.w3.org/2000/svg",
            width: px,
            height: px,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            class: `hp-icon hp-icon-${size} ${className}`.trim(),
            "aria-hidden": decorative || !ariaLabel ? "true" : undefined,
            "aria-label": ariaLabel || undefined,
            role: decorative ? "presentation" : ariaLabel ? "img" : undefined,
        },
        h("path", { d: definition.path })
    );

    return svg;
}
