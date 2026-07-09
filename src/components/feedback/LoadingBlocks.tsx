import { h } from "preact";
import type { PlaceholderComponent, SpinnerComponent } from "../../schema/hyperpbiSchema";

export function PlaceholderBlock({ component }: { component: PlaceholderComponent }) {
    const lines = component.lines ?? 3;
    const variant = component.placeholderVariant ?? "text";

    if (variant === "card") {
        return (
            <div class="hp-placeholder hp-placeholder-card" aria-hidden="true">
                <div class="hp-placeholder-line hp-placeholder-short" />
                <div class="hp-placeholder-line" />
                <div class="hp-placeholder-line hp-placeholder-long" />
            </div>
        );
    }

    if (variant === "table") {
        return (
            <div class="hp-placeholder hp-placeholder-table" aria-hidden="true">
                {Array.from({ length: lines }).map((_, i) => (
                    <div key={i} class="hp-placeholder-row">
                        <div class="hp-placeholder-cell hp-placeholder-short" />
                        <div class="hp-placeholder-cell" />
                        <div class="hp-placeholder-cell hp-placeholder-long" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div class="hp-placeholder hp-placeholder-text" aria-hidden="true">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    class={`hp-placeholder-line ${i === lines - 1 ? "hp-placeholder-short" : ""}`}
                />
            ))}
        </div>
    );
}

export function SpinnerBlock({ component }: { component: SpinnerComponent }) {
    const inline = component.inline ?? false;

    return (
        <div
            class={`hp-spinner ${inline ? "hp-spinner-inline" : "hp-spinner-centered"}`}
            role="status"
            aria-label={component.label ?? "Loading"}
        >
            <div class="hp-spinner-icon" aria-hidden="true" />
            {component.label && <span class="hp-spinner-label">{component.label}</span>}
        </div>
    );
}
