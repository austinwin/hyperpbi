import { h } from "preact";
import { useMemo } from "preact/hooks";
import type { TrackingComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";

export function Tracking({ component }: { component: TrackingComponent }) {
    const context = useRenderContext();
    const { data, state } = context;

    // Determine active stage from static value or field-bound data
    const activeStage = useMemo(() => {
        if (component.activeStage) return component.activeStage;
        if (component.stageField && data.rows.length > 0) {
            return String(data.rows[0][component.stageField] ?? component.stages[0]?.id ?? "");
        }
        const stateKey = component.id ?? component.type;
        return String(state.activeSteps[stateKey] ?? component.stages[0]?.id ?? "");
    }, [component.activeStage, component.stageField, data.rows, state.activeSteps, component.id, component.type, component.stages]);

    const activeIndex = component.stages.findIndex(s => s.id === activeStage);
    const orientation = component.orientation ?? "horizontal";
    const compact = component.compact ?? false;

    return (
        <div class={`hp-tracking hp-tracking-${orientation} ${compact ? "hp-tracking-compact" : ""}`} role="list">
            {component.stages.map((stage, index) => {
                const state = index < activeIndex ? "complete" : index === activeIndex ? "current" : "upcoming";
                const stageState = stage.state ?? state;

                return (
                    <div
                        key={stage.id}
                        class={`hp-tracking-stage hp-tracking-${stageState}`}
                        role="listitem"
                        aria-current={stageState === "current" ? "step" : undefined}
                    >
                        <div class="hp-tracking-indicator">
                            {stageState === "complete" ? (
                                <Icon name="check" size="sm" decorative />
                            ) : stage.icon ? (
                                <Icon name={stage.icon} size="sm" decorative />
                            ) : (
                                <span class="hp-tracking-number">{index + 1}</span>
                            )}
                        </div>
                        <div class="hp-tracking-content">
                            <span class="hp-tracking-label">{stage.label}</span>
                            {stage.description && !compact && (
                                <span class="hp-tracking-description">{stage.description}</span>
                            )}
                        </div>
                        {index < component.stages.length - 1 && orientation === "horizontal" && (
                            <div class="hp-tracking-connector" aria-hidden="true" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
