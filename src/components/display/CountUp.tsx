import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import type { CountUpComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";

export function CountUp({ component }: { component: CountUpComponent }) {
    const context = useRenderContext();
    const { data } = context;
    const [displayValue, setDisplayValue] = useState(0);
    const rafRef = useRef<number>(0);
    const duration = Math.min(5000, Math.max(300, component.duration ?? 1500));

    // Resolve target value from field or static
    const targetValue: number = useMemo(() => {
        if (component.value !== undefined) return component.value;
        if (component.field && component.aggregation) {
            const values = data.rows.map(row => Number(row[component.field!])).filter(v => !isNaN(v));
            if (values.length === 0) return 0;
            switch (component.aggregation) {
                case "sum": return values.reduce((a, b) => a + b, 0);
                case "avg": return values.reduce((a, b) => a + b, 0) / values.length;
                case "min": return Math.min(...values);
                case "max": return Math.max(...values);
                case "count": return values.length;
                case "distinctCount": return new Set(values).size;
                default: return values[0];
            }
        }
        return 0;
    }, [component.field, component.aggregation, component.value, data.rows]);

    // Animate counting up on mount
    useEffect(() => {
        // Respect reduced motion preference
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
            setDisplayValue(targetValue);
            return;
        }

        const startTime = performance.now();
        const startValue = 0;

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(startValue + (targetValue - startValue) * eased);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [targetValue, duration]);

    const formatted = formatCountUpValue(displayValue, component.format);
    const prefix = component.prefix ?? "";
    const suffix = component.suffix ?? "";

    return (
        <span class="hp-count-up" aria-live="polite" aria-label={`${prefix}${formatted}${suffix}`}>
            {prefix && <span class="hp-count-up-prefix">{prefix}</span>}
            <span class="hp-count-up-value">{formatted}</span>
            {suffix && <span class="hp-count-up-suffix">{suffix}</span>}
        </span>
    );
}

import { useMemo } from "preact/hooks";

function formatCountUpValue(value: number, format?: string): string {
    if (format === "currency") return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (format === "integer") return Math.round(value).toLocaleString();
    if (format === "percent") return `${(value * 100).toFixed(1)}%`;
    if (format === "number") return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return Math.round(value).toLocaleString();
}
