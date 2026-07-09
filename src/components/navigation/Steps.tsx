import { h } from "preact";
import { useMemo } from "preact/hooks";
import type { StepsComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";

export function Steps({ component }: { component: StepsComponent }) {
    const context = useRenderContext();
    const { state } = context;
    const stateKey = component.stateKey ?? component.id ?? component.type;
    const orientation = component.orientation ?? "horizontal";
    const clickable = component.clickable ?? false;

    const activeStep = component.activeStep ?? String(state.activeSteps[stateKey] ?? component.items[0]?.id ?? "");
    const activeIndex = component.items.findIndex(item => item.id === activeStep);

    return (
        <nav class={`hp-steps hp-steps-${orientation}`} aria-label="Progress">
            <ol>
                {component.items.map((step, index) => {
                    const isComplete = index < activeIndex;
                    const isCurrent = index === activeIndex;
                    const isUpcoming = index > activeIndex;
                    const isDisabled = step.disabled ?? false;

                    const stepState = isComplete ? "complete" : isCurrent ? "current" : "upcoming";
                    const classes = [
                        "hp-step-item",
                        `hp-step-${stepState}`,
                        isDisabled ? "hp-step-disabled" : "",
                        clickable && !isDisabled ? "hp-step-clickable" : "",
                    ].filter(Boolean).join(" ");

                    return (
                        <li key={step.id} class={classes} aria-current={isCurrent ? "step" : undefined}>
                            <button
                                type="button"
                                class="hp-step-button"
                                disabled={isDisabled || (!clickable && !isCurrent)}
                                onClick={() => {
                                    if (clickable && !isDisabled) {
                                        context.executeUiAction({
                                            type: "setStep",
                                            target: stateKey,
                                            value: step.id,
                                        });
                                    }
                                }}
                            >
                                <span class="hp-step-indicator">
                                    {isComplete ? (
                                        <Icon name="check" size="sm" decorative />
                                    ) : step.icon ? (
                                        <Icon name={step.icon} size="sm" decorative />
                                    ) : (
                                        <span class="hp-step-number">{index + 1}</span>
                                    )}
                                </span>
                                <span class="hp-step-content">
                                    <span class="hp-step-label">{step.label}</span>
                                    {step.description && (
                                        <span class="hp-step-description">{step.description}</span>
                                    )}
                                </span>
                            </button>
                            {index < component.items.length - 1 && (
                                <div class="hp-step-connector" aria-hidden="true" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
