import { InteractionDiagnostics } from "../powerbi/interactionDiagnostics";
import { interactionMessage, interactionSuggestedFix } from "./interactionHelp";

const value = (input: unknown): string => input === undefined ? "—" : String(input);
const yesNo=(input:boolean)=>input?"Yes":"No";

export function InteractionsPanel({ diagnostics, compact=false }: { diagnostics: InteractionDiagnostics; compact?: boolean }) {
    const sent=diagnostics.externalMode==="filter"?diagnostics.filterSent:diagnostics.selectionSent;
    return <div class={`hp-interactions-panel ${compact?"hp-interactions-compact":""}`}><header><div><h3>Interaction status</h3><p>Slicer controls use Power BI filters; data-point clicks use Power BI selection.</p></div><span class={sent?"is-ok":"is-muted"}>{sent?`${diagnostics.externalMode??"External"} sent`:"Not sent"}</span></header><dl>
        <div><dt>enableInteractions setting</dt><dd>{yesNo(diagnostics.externalInteractionEnabled)}</dd></div>
        <div><dt>hostAllowsInteractions</dt><dd>{yesNo(diagnostics.hostAllowsInteractions)}</dd></div>
        <div><dt>selectionIdentityCount</dt><dd>{diagnostics.selectionIdentityCount.toLocaleString()}</dd></div>
        <div><dt>Last clicked component</dt><dd>{value(diagnostics.lastClickedComponentId)}{diagnostics.lastClickedComponentType?` · ${diagnostics.lastClickedComponentType}`:""}</dd></div>
        <div><dt>Last clicked field</dt><dd>{value(diagnostics.lastClickedField)}</dd></div>
        <div><dt>Last clicked value</dt><dd>{value(diagnostics.lastClickedValue)}</dd></div>
        <div><dt>externalMode</dt><dd>{diagnostics.externalMode??"—"}</dd></div>
        <div><dt>Power BI target</dt><dd>{diagnostics.filterTargetTable&&diagnostics.filterTargetColumn?`${diagnostics.filterTargetTable}.${diagnostics.filterTargetColumn}`:"—"}</dd></div>
        <div><dt>Matched row count</dt><dd>{diagnostics.lastResolvedSourceRowCount.toLocaleString()}</dd></div>
        <div><dt>filterSent</dt><dd>{yesNo(diagnostics.filterSent)}</dd></div>
        <div><dt>selectionSent</dt><dd>{yesNo(diagnostics.selectionSent)}</dd></div>
        <div><dt>Failure reason</dt><dd>{diagnostics.reasonExternalSelectionNotSent??"—"}</dd></div>
    </dl><div class="hp-interaction-guidance"><strong>{diagnostics.lastClickedComponentId?interactionMessage(diagnostics.reasonExternalSelectionNotSent):"No selectable component has been clicked yet."}</strong><span>Suggested fix: {diagnostics.lastClickedComponentId?interactionSuggestedFix(diagnostics):"Validate the preview, then click a table row, chart category, map feature, timeline event, or custom slicer item."}</span><small>The target visual may not have Edit interactions enabled, or it may not share compatible model lineage/relationships.</small></div></div>;
}
