import { SafeInteraction, SelectionMode } from "../../schema/hyperpbiSchema";
import { DataRow, Primitive } from "../../data/normalizeData";
import { evaluateCondition } from "../../calculations/conditionEvaluator";
import { RenderContextValue } from "../../render/RenderContext";
import { InteractionDetails } from "../../powerbi/interactionDiagnostics";
import { FilterOperator } from "../../schema/hyperpbiSchema";

export interface InteractionEventOptions extends InteractionDetails {
    multiSelect?: boolean;
}

export interface InteractionExecutionResult {
    matchedRows: number[];
    selectedRows: number[];
    externalSelectionSent: boolean;
    externalFilterSent: boolean;
}

export function resolveSelection(current: number[], matching: number[], mode: SelectionMode = "replace", modifier = false): number[] {
    const selected = new Set(current); const matches = Array.from(new Set(matching.filter(Number.isInteger)));
    const effectiveMode: SelectionMode = modifier && mode === "replace" ? "toggle" : mode;
    if (effectiveMode === "replace") return matches;
    if (effectiveMode === "add") { matches.forEach(index => selected.add(index)); return Array.from(selected); }
    const remove = matches.length > 0 && matches.every(index => selected.has(index));
    matches.forEach(index => remove ? selected.delete(index) : selected.add(index));
    return Array.from(selected);
}

function interactionDetails(options: InteractionEventOptions, interaction: SafeInteraction, clickedRow?: DataRow): InteractionDetails {
    const field = options.field ?? (interaction.where && "left" in interaction.where && typeof interaction.where.left === "object" && interaction.where.left && "field" in interaction.where.left ? String(interaction.where.left.field) : undefined);
    return { componentId: options.componentId, componentType: options.componentType, field, value: options.value ?? (field && clickedRow ? clickedRow[field] : undefined) as Primitive };
}

export function runSafeInteraction(interaction: SafeInteraction | undefined, context: RenderContextValue, clickedRow?: DataRow, clickedRowSourceIndex?: number, eventOptions: InteractionEventOptions = {}): InteractionExecutionResult {
    const empty = { matchedRows: [], selectedRows: context.state.selectedRows, externalSelectionSent: false,externalFilterSent:false };
    if (!interaction) { context.reportInteraction(eventOptions, "component did not call selectExternal"); return empty; }
    const details = interactionDetails(eventOptions, interaction, clickedRow);
    const componentId = eventOptions.componentId ?? "custom";
    if (interaction.action === "clearSelection") {
        if (interaction.internal !== false) context.dispatch({ type: "selectRows", rows: [] });
        context.dispatch({ type: "selectComponentRows", id: componentId, rows: [] });
        const externalMode=interaction.externalMode??(context.config.interactions?.externalMode==="selection"?"selection":details.field?"filter":"selection");const result = interaction.external === false ? (context.reportInteraction(details), { sent: false }) : externalMode==="filter"?context.clearExternalFilter(details):context.clearExternal(details);
        return { matchedRows: [], selectedRows: [], externalSelectionSent: externalMode==="selection"&&result.sent,externalFilterSent:externalMode==="filter"&&result.sent };
    }
    if (interaction.action === "selectWhere" || interaction.action === "selectRow") {
        const matchedRows = interaction.action === "selectWhere"
            ? context.sourceRows.map((row, index) => evaluateCondition(interaction.where, row, { clickedRow, knownFieldKeys: new Set(Object.keys(context.data.fields)) }) ? index : -1).filter(index => index >= 0)
            : Number.isInteger(clickedRowSourceIndex) ? [clickedRowSourceIndex as number] : Number.isInteger(Number(interaction.value)) ? [Number(interaction.value)] : [];
        const current = context.state.componentSelectedRows[componentId] ?? (interaction.internal === false ? [] : context.state.selectedRows);
        const selectedRows = resolveSelection(current, matchedRows, interaction.selectionMode, eventOptions.multiSelect === true);
        context.dispatch({ type: "selectComponentRows", id: componentId, rows: selectedRows });
        if (interaction.internal !== false) context.dispatch({ type: "selectRows", rows: selectedRows });
        if (interaction.external === false) { context.reportInteraction(details, "component did not call selectExternal", selectedRows); return { matchedRows, selectedRows, externalSelectionSent: false,externalFilterSent:false }; }
        const externalMode=interaction.externalMode??(context.config.interactions?.externalMode==="selection"?"selection":interaction.action==="selectWhere"&&details.field?"filter":"selection");
        if(externalMode==="filter"&&details.field){const values=Array.from(new Set(selectedRows.map(index=>context.sourceRows[index]?.[details.field as string]).filter(value=>value!==undefined)));const where=interaction.where as Record<string,unknown>|undefined;const candidate=where?.op;const supported=new Set<FilterOperator>(["=","!=",">",">=","<","<=","contains","in","between"]);const baseOperator=typeof candidate==="string"&&supported.has(candidate as FilterOperator)?candidate as FilterOperator:"=";const operator:FilterOperator=values.length>1?"in":baseOperator;const value=values.length>1?values:values[0];const filterDetails={...details,matchedRowCount:matchedRows.length,value};const result=values.length?context.applyExternalFilter(details.field,operator,value,filterDetails):context.clearExternalFilter(filterDetails);return{matchedRows,selectedRows,externalSelectionSent:false,externalFilterSent:result.sent};}
        const multiSelect = eventOptions.multiSelect === true || interaction.selectionMode === "add" || interaction.selectionMode === "toggle";
        const result = context.selectExternal(selectedRows, multiSelect, details);
        return { matchedRows, selectedRows, externalSelectionSent: result.sent,externalFilterSent:false };
    }
    if (interaction.action === "setFilter" && interaction.field) { context.dispatch({ type: "filter", filter: { id: `custom-${interaction.field}`, field: interaction.field, operator: "=", value: interaction.value } }); context.reportInteraction(details); return empty; }
    if (interaction.action === "clearFilter") { context.dispatch({ type: "clearFilters" }); context.reportInteraction(details); return empty; }
    if (interaction.action === "setState" && interaction.target) { context.dispatch({ type: "value", id: interaction.target, value: interaction.value }); context.reportInteraction(details); return empty; }
    if (interaction.action === "toggleState" && interaction.target) { context.dispatch({ type: "value", id: interaction.target, value: !context.state.values[interaction.target] }); context.reportInteraction(details); return empty; }
    if (interaction.action === "openTab" && interaction.target) { context.dispatch({ type: "tab", id: interaction.target, value: String(interaction.value ?? "") }); context.reportInteraction(details); return empty; }
    if (interaction.action === "toggleCollapse" && interaction.target) { context.dispatch({ type: "collapse", id: interaction.target }); context.reportInteraction(details); return empty; }
    context.reportInteraction(details, "unsupported interaction action");
    return empty;
}

export const rowsMatching = (rows: DataRow[], interaction?: SafeInteraction, clickedRow?: DataRow, knownFieldKeys: ReadonlySet<string> = new Set()): number[] => interaction?.where ? rows.map((row, index) => evaluateCondition(interaction.where, row, { clickedRow, knownFieldKeys }) ? index : -1).filter(index => index >= 0) : [];
