import { InteractionDiagnostics } from "../powerbi/interactionDiagnostics";

const value = (input: unknown): string => input === undefined ? "—" : String(input);

export function InteractionsPanel({ diagnostics }: { diagnostics: InteractionDiagnostics }) {
    return <div class="hp-interactions-panel"><h3>Power BI report interactions</h3><dl>
        <div><dt>External interaction setting enabled</dt><dd>{diagnostics.externalInteractionEnabled ? "True" : "False"}</dd></div>
        <div><dt>Host allows interactions</dt><dd>{diagnostics.hostAllowsInteractions ? "True" : "False"}</dd></div>
        <div><dt>Selection identity count</dt><dd>{diagnostics.selectionIdentityCount.toLocaleString()}</dd></div>
        <div><dt>Last component</dt><dd>{value(diagnostics.lastClickedComponentId)} · {value(diagnostics.lastClickedComponentType)}</dd></div>
        <div><dt>Last field / value</dt><dd>{value(diagnostics.lastClickedField)} / {value(diagnostics.lastClickedValue)}</dd></div>
        <div><dt>Resolved source rows</dt><dd>{diagnostics.lastResolvedSourceRowCount.toLocaleString()}</dd></div>
        <div><dt>Selected source row indices</dt><dd>{diagnostics.lastSelectedSourceRowIndices.length ? diagnostics.lastSelectedSourceRowIndices.join(", ") : "None"}{diagnostics.lastResolvedSourceRowCount > diagnostics.lastSelectedSourceRowIndices.length ? " …" : ""}</dd></div>
        <div><dt>External selection sent</dt><dd>{diagnostics.externalSelectionSent ? "True" : "False"}</dd></div>
        <div><dt>Reason not sent</dt><dd>{diagnostics.reasonExternalSelectionNotSent ?? "—"}</dd></div>
    </dl><p>Internal HyperPBI filtering and external Power BI selection are separate. A sent selection affects compatible visuals only when semantic-model lineage and relationships are compatible and Power BI Edit interactions configure the target visual to filter or highlight.</p></div>;
}
