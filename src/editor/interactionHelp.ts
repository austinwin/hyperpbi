import { ExternalSelectionFailureReason, InteractionDiagnostics } from "../powerbi/interactionDiagnostics";

const help: Record<ExternalSelectionFailureReason,{message:string;fix:string}> = {
    "interactions disabled": { message: "Power BI interactions are disabled in visual settings.", fix: "Enable Interact with other visuals in the HyperPBI format settings and verify Runtime Config interactions." },
    "host disallowed": { message: "The host did not allow interactions.", fix: "Use report edit/view mode that permits visual interactions and check tenant policy." },
    "no selection identities": { message: "No selection identities were created. Bind real table columns/measures in Values.", fix: "Add the source columns used by the component to the HyperPBI Values field well." },
    "no matching source rows": { message: "No source rows matched the clicked value.", fix: "Verify the component uses normalized field keys and the clicked value exists in the bound data." },
    "unsupported interaction action": { message: "This interaction action is not supported by the safe engine.", fix: "Use selectRow, selectWhere, setFilter, clearSelection, or another documented safe action." },
    "component did not call selectExternal": { message: "This component was configured for internal interaction only.", fix: "Set external:true on a supported selectable component or safe interaction when report selection is intended." }
};

export function interactionMessage(reason?: ExternalSelectionFailureReason): string { return reason ? help[reason].message : "The selection was sent to Power BI."; }
export function interactionSuggestedFix(diagnostics: InteractionDiagnostics): string {
    if(diagnostics.reasonExternalSelectionNotSent)return help[diagnostics.reasonExternalSelectionNotSent].fix;
    return "If the target does not respond, enable Power BI Edit interactions and confirm compatible semantic-model lineage and relationships.";
}

