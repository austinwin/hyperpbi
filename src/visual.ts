"use strict";

import powerbi from "powerbi-visuals-api";
import { h, render } from "preact";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import { applyConfigToData } from "./data/applyConfig";
import { NormalizedData } from "./data/normalizeData";
import { mergeNormalizedData, parseDataView } from "./data/parseDataView";
import { defaultConfigJson, parseConfig } from "./config/hyperpbiConfig";
import { HyperPbiStudio } from "./editor/HyperPbiStudio";
import { LandingPage } from "./editor/LandingPage";
import { SetupExperience } from "./editor/SetupExperience";
import { ErrorPanel } from "./components/system/ErrorPanel";
import { HyperPbiRoot } from "./render/HyperPbiRoot";
import { createDefaultSchema } from "./schema/defaultSchema";
import { HyperPbiSchema } from "./schema/hyperpbiSchema";
import { migrateSchema } from "./schema/schemaMigrations";
import { validateReferences } from "./schema/validateReferences";
import { validateSchema } from "./schema/validateSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "./settings";
import { createInstanceId } from "./utils/ids";
import { parseJson } from "./utils/safeJson";
import { buildTableSelectionIds, persistVisualState, readVisualState } from "./powerbi/visualState";
import { applyCalculations } from "./calculations/calculationEngine";
import { defaultStudioLayout } from "./editor/studioLayout";
import { migrateFieldReferences } from "./schema/migrateFieldReferences";
import { createInteractionDiagnostics, ExternalSelectionFailureReason, ExternalSelectionResult, InteractionDetails, InteractionDiagnostics } from "./powerbi/interactionDiagnostics";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

export class Visual implements IVisual {
    private readonly target: HTMLElement;
    private readonly host: powerbi.extensibility.visual.IVisualHost;
    private readonly selectionManager: powerbi.extensibility.ISelectionManager;
    private readonly instanceId = createInstanceId();
    private readonly formattingSettingsService = new FormattingSettingsService();
    private formattingSettings = new VisualFormattingSettingsModel();
    private data: NormalizedData = parseDataView();
    private selectionIds: powerbi.visuals.ISelectionId[] = [];
    private specification = "";
    private configuration = defaultConfigJson;
    private editMode = powerbi.EditMode.Default;
    private draftSpecification = "";
    private draftConfiguration = "";
    private renderMs = 0;
    private studioLayout = JSON.stringify(defaultStudioLayout);
    private webAccessAvailable = false;
    private interactionDiagnostics: InteractionDiagnostics = createInteractionDiagnostics(false, false, 0);
    private moreRowsAvailable = false;
    private fetchMoreDataInProgress = false;
    private lastFetchRequestedRowCount = -1;

    constructor(options?: VisualConstructorOptions) {
        if (!options) throw new Error("HyperPBI requires Power BI visual constructor options.");
        this.target = options.element; this.host = options.host; this.selectionManager = this.host.createSelectionManager();
        this.target.classList.add("hyperpbi-visual-host");
        void Promise.all([this.host.webAccessService.webAccessStatus("https://tile.openstreetmap.org"), this.host.webAccessService.webAccessStatus("https://nominatim.openstreetmap.org")]).then(statuses => { this.webAccessAvailable = statuses.every(status => status === powerbi.PrivilegeStatus.Allowed); this.renderCurrent(); }).catch(() => { this.webAccessAvailable = false; });
    }

    public update(options: VisualUpdateOptions): void {
        const started = performance.now(); this.host.eventService?.renderingStarted(options);
        const dataView = options.dataViews?.[0]; const previousEditMode = this.editMode; const nextEditMode = options.editMode ?? powerbi.EditMode.Default;
        if (dataView) this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dataView);
        const leavingNativeEditor = previousEditMode === powerbi.EditMode.Advanced && nextEditMode !== powerbi.EditMode.Advanced && Boolean(this.draftSpecification);
        if (leavingNativeEditor && this.parseSpecification(this.draftSpecification).schema && parseConfig(this.draftConfiguration).config) {
            this.specification = this.draftSpecification; this.configuration = this.draftConfiguration; persistVisualState(this.host, { specification: this.specification, configuration: this.configuration });
        } else {
            const persisted = readVisualState(dataView); if (persisted.specification !== undefined) this.specification = persisted.specification; if (persisted.configuration !== undefined) this.configuration = persisted.configuration || defaultConfigJson; if (persisted.studioLayout !== undefined) this.studioLayout = persisted.studioLayout;
        }
        const wasFetching = this.fetchMoreDataInProgress; const incomingData = parseDataView(dataView); const incomingSelectionIds = buildTableSelectionIds(this.host, dataView);
        this.fetchMoreDataInProgress = false; this.moreRowsAvailable = Boolean(dataView?.metadata?.segment);
        if (wasFetching && this.data.rows.length && incomingData.rows.length <= this.data.rows.length && !this.sameRows(this.data.rows, incomingData.rows)) { this.data = mergeNormalizedData(this.data, incomingData); this.selectionIds = [...this.selectionIds, ...incomingSelectionIds]; }
        else { this.data = incomingData; this.selectionIds = incomingSelectionIds; }
        this.data = { ...this.data, loadStatus: { loadedRowCount: this.data.rows.length, moreRowsAvailable: this.moreRowsAvailable, fetchInProgress: false } }; this.editMode = nextEditMode;
        this.interactionDiagnostics = { ...this.interactionDiagnostics, externalInteractionEnabled: toRuntimeSettings(this.formattingSettings).enableInteractions, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions === true, selectionIdentityCount: this.selectionIds.length };
        this.target.style.width = `${Math.max(0, options.viewport.width)}px`; this.target.style.height = `${Math.max(0, options.viewport.height)}px`;
        this.renderMs = performance.now() - started; this.renderCurrent(); this.host.eventService?.renderingFinished(options); this.requestMoreDataIfNeeded();
    }

    private renderCurrent(): void {
        const settings = toRuntimeSettings(this.formattingSettings);
        if (!Object.keys(this.data.fields).length) { render(h(LandingPage, {}), this.target); return; }
        if (this.editMode === powerbi.EditMode.Advanced) {
            const initialSpec = this.specification || JSON.stringify(createDefaultSchema(this.data), null, 2);
            render(h(HyperPbiStudio, { instanceId: this.instanceId, data: this.data, settings, initialSpecification: initialSpec, initialConfiguration: this.configuration || defaultConfigJson, initialLayout: this.studioLayout, onSave: this.saveAndCloseStudio, onDraftChange: this.captureDraft, onLayoutChange: this.saveStudioLayout, selectionIdentityCount: this.selectionIds.length, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions, initialInteractionDiagnostics: this.interactionDiagnostics, selectExternal: this.selectRows, clearExternal: this.clearSelection, initialEditorTab: "ai", webAccessAvailable: this.webAccessAvailable }), this.target); return;
        }
        if (!this.specification.trim()) { render(h(SetupExperience, { data: this.data }), this.target); return; }
        const schemaResult = this.parseSpecification(this.specification); const configResult = parseConfig(this.configuration);
        if (!schemaResult.schema || !configResult.config) {
            const errors = [...schemaResult.errors, ...configResult.errors];
            render(h("div", { class: "hyperpbi-root hp-invalid-report" }, h(ErrorPanel, { title: "The saved dashboard needs attention", errors, fields: Object.keys(this.data.fields), showExample: false }), h("p", { class: "hp-native-edit-hint" }, "Open the visual menu (…) and select Edit to repair this dashboard.")), this.target); return;
        }
        const calculated = applyCalculations(this.data, schemaResult.schema.calculations);
        if (calculated.errors.length) { render(h("div", { class: "hyperpbi-root hp-invalid-report" }, h(ErrorPanel, { title: "Calculation validation failed", errors: calculated.errors, fields: Object.keys(this.data.fields), showExample: false }), h("p", { class: "hp-native-edit-hint" }, "Open the visual menu (…) and select Edit to repair this dashboard.")), this.target); return; }
        const configuredData = applyConfigToData(calculated.data, configResult.config);
        render(h(HyperPbiRoot, { instanceId: this.instanceId, schema: schemaResult.schema, data: configuredData, settings, config: configResult.config, referenceWarnings: validateReferences(schemaResult.schema, configuredData), renderMs: this.renderMs, selectExternal: this.selectRows, clearExternal: this.clearSelection, reportInteraction: this.reportInteraction, webAccessAvailable: this.webAccessAvailable }), this.target);
    }

    private parseSpecification(text: string): { schema?: HyperPbiSchema; errors: string[] } {
        const parsed = parseJson(text); if (parsed.error) return { errors: [`Specification JSON: ${parsed.error}`] };
        const validation = validateSchema(migrateFieldReferences(migrateSchema(parsed.value), this.data.fields)); return validation.valid && validation.schema ? { schema: validation.schema, errors: [] } : { errors: validation.errors };
    }

    private saveAndCloseStudio = (specification: string, configuration: string): void => {
        this.specification = specification; this.configuration = configuration;
        persistVisualState(this.host, { specification, configuration, studioLayout: this.studioLayout });
        this.host.switchFocusModeState(false);
        this.editMode = powerbi.EditMode.Default; this.renderCurrent();
    };

    private captureDraft = (specification: string, configuration: string): void => { this.draftSpecification = specification; this.draftConfiguration = configuration; };

    private saveStudioLayout = (studioLayout: string): void => { this.studioLayout = studioLayout; persistVisualState(this.host, { specification: this.specification, configuration: this.configuration, studioLayout }); };

    private updateInteractionDiagnostics = (rowIndices: number[], details: InteractionDetails, result: ExternalSelectionResult): void => {
        this.interactionDiagnostics = { ...this.interactionDiagnostics, externalInteractionEnabled: toRuntimeSettings(this.formattingSettings).enableInteractions, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions === true, selectionIdentityCount: this.selectionIds.length, lastClickedComponentId: details.componentId, lastClickedComponentType: details.componentType, lastClickedField: details.field, lastClickedValue: details.value, lastResolvedSourceRowCount: rowIndices.length, lastSelectedSourceRowIndices: rowIndices.slice(0, 25), externalSelectionSent: result.sent, reasonExternalSelectionNotSent: result.sent ? undefined : result.reason };
    };

    private selectRows = (rowIndices: number[], multiSelect = false, details: InteractionDetails = {}): ExternalSelectionResult => {
        const enabled = toRuntimeSettings(this.formattingSettings).enableInteractions;
        let result: ExternalSelectionResult;
        if (!enabled) result = { sent: false, reason: "interactions disabled" };
        else if (!this.host.hostCapabilities.allowInteractions) result = { sent: false, reason: "host disallowed" };
        else if (!this.selectionIds.length) result = { sent: false, reason: "no selection identities" };
        else {
            const indices = Array.from(new Set(rowIndices)).filter(index => Number.isInteger(index) && index >= 0 && index < this.selectionIds.length);
            if (!indices.length) { void this.selectionManager.clear(); result = { sent: false, reason: "no matching source rows" }; }
            else { const identities = indices.map(index => this.selectionIds[index]); void this.selectionManager.select(identities, multiSelect); result = { sent: true }; rowIndices = indices; }
        }
        this.updateInteractionDiagnostics(rowIndices, details, result); return result;
    };

    private clearSelection = (details: InteractionDetails = {}): ExternalSelectionResult => {
        const enabled = toRuntimeSettings(this.formattingSettings).enableInteractions;
        const result: ExternalSelectionResult = !enabled ? { sent: false, reason: "interactions disabled" } : !this.host.hostCapabilities.allowInteractions ? { sent: false, reason: "host disallowed" } : !this.selectionIds.length ? { sent: false, reason: "no selection identities" } : { sent: true };
        if (result.sent) void this.selectionManager.clear(); this.updateInteractionDiagnostics([], details, result); return result;
    };

    private reportInteraction = (details: InteractionDetails, reason: ExternalSelectionFailureReason = "component did not call selectExternal", rowIndices: number[] = []): void => this.updateInteractionDiagnostics(rowIndices, details, { sent: false, reason });

    private sameRows(left: NormalizedData["rows"], right: NormalizedData["rows"]): boolean {
        if (left.length !== right.length) return false; const keys = Object.keys(this.data.fields);
        return left.every((row, index) => keys.every(key => row[key] === right[index]?.[key]));
    }

    private requestMoreDataIfNeeded(): void {
        if (!this.moreRowsAvailable || this.fetchMoreDataInProgress || this.lastFetchRequestedRowCount === this.data.rows.length) return;
        this.fetchMoreDataInProgress = true; this.lastFetchRequestedRowCount = this.data.rows.length;
        this.data = { ...this.data, loadStatus: { loadedRowCount: this.data.rows.length, moreRowsAvailable: true, fetchInProgress: true } };
        if (!this.host.fetchMoreData(true)) { this.fetchMoreDataInProgress = false; this.moreRowsAvailable = false; this.data = { ...this.data, loadStatus: { loadedRowCount: this.data.rows.length, moreRowsAvailable: false, fetchInProgress: false } }; this.renderCurrent(); }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel { return this.formattingSettingsService.buildFormattingModel(this.formattingSettings); }
    public destroy(): void { render(null, this.target); }
}
