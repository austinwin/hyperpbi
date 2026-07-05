import { SafeInteraction } from "../../schema/hyperpbiSchema";
import { DataRow } from "../../data/normalizeData";
import { evaluateCondition } from "../../calculations/conditionEvaluator";
import { RenderContextValue } from "../../render/RenderContext";

export function runSafeInteraction(interaction: SafeInteraction | undefined, context: RenderContextValue): void {
    if (!interaction) return;
    if (interaction.action === "clearSelection") { context.clearExternal(); context.dispatch({ type: "selectRows", rows: [] }); return; }
    if (interaction.action === "selectWhere") { const indices = context.sourceRows.map((row, index) => evaluateCondition(interaction.where, row) ? index : -1).filter(index => index >= 0); context.dispatch({ type: "selectRows", rows: indices }); context.selectExternal(indices); return; }
    if (interaction.action === "selectRow") { const index = Number(interaction.value ?? 0); context.selectExternal(Number.isInteger(index) ? [index] : []); return; }
    if (interaction.action === "setFilter" && interaction.field) { context.dispatch({ type: "filter", filter: { id: `custom-${interaction.field}`, field: interaction.field, operator: "=", value: interaction.value } }); return; }
    if (interaction.action === "clearFilter") { context.dispatch({ type: "clearFilters" }); return; }
    if (interaction.action === "setState" && interaction.target) { context.dispatch({ type: "value", id: interaction.target, value: interaction.value }); return; }
    if (interaction.action === "toggleState" && interaction.target) { context.dispatch({ type: "value", id: interaction.target, value: !context.state.values[interaction.target] }); return; }
    if (interaction.action === "openTab" && interaction.target) context.dispatch({ type: "tab", id: interaction.target, value: String(interaction.value ?? "") });
    if (interaction.action === "toggleCollapse" && interaction.target) context.dispatch({ type: "collapse", id: interaction.target });
}
export const rowsMatching = (rows: DataRow[], interaction?: SafeInteraction): number[] => interaction?.where ? rows.map((row, index) => evaluateCondition(interaction.where, row) ? index : -1).filter(index => index >= 0) : [];
