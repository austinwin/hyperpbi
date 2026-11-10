import type { ComponentBase } from "../../schema/hyperpbiSchema";
import type { ComponentInteractionDefinition } from "../../interactions/interactionTypes";
import { componentKindForType, resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { defaultConfig } from "../../config/hyperpbiConfig";

export interface InteractionFieldChoice {
  key: string;
  label: string;
  powerBiTarget?: string;
}

export interface InteractionComponentChoice {
  id: string;
  type: string;
}

function inferredField(component: Record<string, unknown>): string | undefined {
  if (typeof component.field === "string") return component.field;
  if (typeof component.category === "string") return component.category;
  return undefined;
}

/** One-click cross-component setup, expressed entirely in the existing 2.0 schema. */
export function recommendedInteraction(
  component: ComponentBase,
  fields: readonly InteractionFieldChoice[],
): ComponentInteractionDefinition {
  const kind = componentKindForType(component.type);
  const hint = inferredField(component as unknown as Record<string, unknown>);
  const field = component.interaction?.field ?? (hint && fields.some(item => item.key === hint) ? hint : undefined);
  return {
    ...component.interaction,
    enabled: true,
    internalMode: "filter",
    internalScope: "others",
    externalMode: "auto",
    ...(field ? { field } : {}),
    target: undefined,
    targets: undefined,
    clearOnSecondClick: kind !== "control",
  };
}

export function InteractionQuickSetup({
  component,
  components,
  fields,
  onChange,
}: {
  component: Record<string, unknown>;
  components: InteractionComponentChoice[];
  fields: InteractionFieldChoice[];
  onChange: (next: ComponentInteractionDefinition) => boolean | void;
}) {
  const kind = componentKindForType(String(component.type ?? ""));
  if (kind !== "dataPoint" && kind !== "control" && !component.interaction) return null;
  const definition: ComponentInteractionDefinition =
    component.interaction && typeof component.interaction === "object" && !Array.isArray(component.interaction)
      ? component.interaction as ComponentInteractionDefinition
      : {};
  const policy = resolveInteractionPolicy(component as unknown as ComponentBase, defaultConfig, kind);
  const otherComponents = components.filter(item => item.id !== component.id);
  const targets = definition.targets?.length ? definition.targets : definition.target ? [definition.target] : undefined;
  const selectedField = definition.field ?? inferredField(component);
  const fieldChoice = fields.find(field => field.key === selectedField);
  const explicitExternal = definition.externalMode ?? "auto";
  const update = (changes: Partial<ComponentInteractionDefinition>) => {
    onChange({ ...definition, enabled: true, ...changes });
  };
  const updateTarget = (id: string, checked: boolean) => {
    const current = targets ?? otherComponents.map(item => item.id);
    const next = checked ? Array.from(new Set([...current, id])) : current.filter(item => item !== id);
    // An empty target list means "all" in the runtime, so never silently turn
    // the last unchecked target into a broadcast interaction.
    if (next.length === 0) return;
    update({ targets: next, target: undefined });
  };

  return (
    <section class="hp-inspector-interaction-setup" aria-label="Connect components">
      <h4>Connect components</h4>
      <p>Set up linked dashboard behavior without editing JSON. Component IDs identify receivers; field keys identify data. The Power BI report is a separate target.</p>
      <button
        type="button"
        onClick={() => onChange(recommendedInteraction(component as unknown as ComponentBase, fields))}
      >
        Connect to other components (recommended)
      </button>
      <div class="hp-inspector-control-grid">
        <label>
          <span>Within HyperPBI</span>
          <select
            aria-label="Within HyperPBI"
            value={policy.internalMode}
            onChange={event => update({ internalMode: event.currentTarget.value as "none" | "highlight" | "filter", internalScope: "others" })}
          >
            <option value="none">No internal linking</option>
            <option value="highlight">Highlight matching rows</option>
            <option value="filter">Filter matching rows</option>
          </select>
        </label>
        <label>
          <span>Linked components</span>
          <select
            aria-label="Linked components"
            disabled={!otherComponents.length || policy.internalMode === "none"}
            value={targets?.length ? "specific" : "all"}
            onChange={event => {
              const specific = event.currentTarget.value === "specific";
              update({ targets: specific ? [otherComponents[0].id] : undefined, target: undefined, internalScope: "others" });
            }}
          >
            <option value="all">All other components</option>
            <option value="specific">Only selected components</option>
          </select>
        </label>
        {targets?.length && policy.internalMode !== "none" ? (
          <fieldset>
            <legend>Choose receiving component IDs</legend>
            {otherComponents.map(item => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={targets.includes(item.id)}
                  onChange={event => updateTarget(item.id, event.currentTarget.checked)}
                />
                {item.id} ({item.type})
              </label>
            ))}
          </fieldset>
        ) : null}
        <label>
          <span>Other Power BI visuals</span>
          <select
            aria-label="Other Power BI visuals"
            value={explicitExternal}
            onChange={event => update({ externalMode: event.currentTarget.value as "none" | "auto" | "selection" | "filter" })}
          >
            <option value="auto">Automatic (filter controls, select chart rows)</option>
            <option value="selection">Select using Power BI row identities</option>
            <option value="filter">Filter using a Power BI model column</option>
            <option value="none">Do not affect external visuals</option>
          </select>
        </label>
        <label>
          <span>Interaction field key</span>
          <select
            aria-label="Interaction field key"
            value={definition.field ?? ""}
            onChange={event => update({ field: event.currentTarget.value || undefined })}
          >
            <option value="">Automatic from component data</option>
            {fields.map(field => (
              <option key={field.key} value={field.key}>
                {field.key} — {field.label}{field.powerBiTarget ? " · Power BI column" : ""}
              </option>
            ))}
            {definition.field && !fields.some(field => field.key === definition.field)
              ? <option value={definition.field}>{definition.field} (not found in the selected dataset)</option>
              : null}
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">
        HyperPBI: {policy.enabled && policy.internalMode !== "none" ? policy.internalMode + " → " + (targets?.join(", ") ?? "all other components") : "not linked"}.
        Power BI: {policy.enabled ? policy.externalMode : "disabled"}.
        {policy.externalMode === "filter"
          ? fieldChoice?.powerBiTarget
            ? " Model column: " + fieldChoice.powerBiTarget + "."
            : " Select a genuine Power BI model column. Computed fields and measures cannot be external filter targets."
          : policy.externalMode === "selection"
            ? " Requires valid Power BI row selection identities."
            : ""}
      </p>
      <small>Power BI Edit interactions and compatible model relationships are controlled in the report. Remote datasets do not automatically join by matching text keys.</small>
    </section>
  );
}
