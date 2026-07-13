import { ExternalSelectionFailureReason, InteractionDiagnostics } from "../powerbi/interactionDiagnostics";

const help: Record<ExternalSelectionFailureReason,{message:string;fix:string}> = {
    "interactions disabled": { message: "Power BI interactions are disabled in visual settings.", fix: "Enable Interact with other visuals in the HyperPBI format settings and verify Runtime Config interactions." },
    "host disallowed": { message: "The host did not allow interactions.", fix: "Use report edit/view mode that permits visual interactions and check tenant policy." },
    "no selection identities": { message: "No selection identities were created. Bind real table columns/measures in Values.", fix: "Add the source columns used by the component to the HyperPBI Values field well." },
    "no matching source rows": { message: "No source rows matched the clicked value.", fix: "Verify the component uses a current Field Manifest alias and that the field exists in its selected dataset." },
    "field has no Power BI filter target": { message: "The field has no Power BI filter target.", fix: "Bind a model column with source table and column metadata; calculated and display-only fields cannot externally filter." },
    "calculated field has no direct Power BI model filter target": { message: "A root calculated field is computed in HyperPBI and has no direct model-column target.", fix: "Use identity selection/highlight, or filter through a contributing Power BI source column." },
    "unsupported external filter operator": { message: "The filter operator is not supported for Power BI propagation.", fix: "Use =, in, contains, a numeric comparison, or between." },
    "host filter failed": { message: "Power BI rejected the external filter.", fix: "Verify the filter target, report permissions, and visual interaction settings." },
    "unsupported interaction action": { message: "This interaction action is not supported by the safe engine.", fix: "Use selectRow, selectWhere, setFilter, clearSelection, or another documented safe action." },
    "component did not call selectExternal": { message: "This legacy component did not request an external interaction.", fix: "Use component.interaction.externalMode for new specifications." },
    "external interaction disabled": { message: "This component is configured for internal interaction only.", fix: "Set interaction.externalMode to auto, selection, or filter when Power BI propagation is intended." },
    "interaction payload unavailable": { message: "The component could not produce an unambiguous interaction payload.", fix: "Set interaction.field and, for static components, interaction.value explicitly." }
};

export function interactionMessage(reason?: ExternalSelectionFailureReason): string { return reason ? help[reason].message : "The selection was sent to Power BI."; }
export function interactionSuggestedFix(diagnostics: InteractionDiagnostics): string {
    if(diagnostics.reasonExternalSelectionNotSent)return help[diagnostics.reasonExternalSelectionNotSent].fix;
    return "If the target does not respond, enable Power BI Edit interactions and confirm compatible semantic-model lineage and relationships.";
}
