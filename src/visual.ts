"use strict";

import powerbi from "powerbi-visuals-api";
import { h, render } from "preact";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import { NormalizedData } from "./data/normalizeData";
import { mergeNormalizedData, parseDataView } from "./data/parseDataView";
import { defaultConfigJson, parseConfig } from "./config/hyperpbiConfig";
import { HyperPbiStudio } from "./editor/HyperPbiStudio";
import { LandingPage } from "./editor/LandingPage";
import { SetupExperience } from "./editor/SetupExperience";
import { HyperPbiRoot } from "./render/HyperPbiRoot";
import { ViewerRenderStability } from "./render/ViewerRenderStability";
import { createDefaultSchema } from "./schema/defaultSchema";
import { HyperPbiSchema } from "./schema/hyperpbiSchema";
import { validateReferences } from "./schema/validateReferences";
import { validateSchema } from "./schema/validateSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "./settings";
import { createInstanceId } from "./utils/ids";
import { parseJson } from "./utils/safeJson";
import { buildRowSelectionData, persistVisualState, readVisualState } from "./powerbi/visualState";
import { prepareRuntimeData } from "./editor/prepareAuthoringData";
import { defaultStudioLayout } from "./editor/studioLayout";
import { prepareSpecification } from "./schema/prepareSpecification";
import { createInteractionDiagnostics, ExternalSelectionFailureReason, ExternalSelectionResult, InteractionDetails, InteractionDiagnostics } from "./powerbi/interactionDiagnostics";
import { ExternalFilterResult } from "./powerbi/externalFilters";
import { FilterOperator } from "./schema/hyperpbiSchema";
import type { ProviderAccessState } from "./providers/providerTypes";
import { providerServiceOrigin } from "./providers/providerPolicy";
import { configuredMapEndpoints } from "./providers/configuredMapEndpoints";
import { shouldRenderLandingPage } from "./powerbi/visualRuntimeMode";
import { PowerBiHostBridge } from "./powerbi/PowerBiHostBridge";
import { configuredRemoteDataEndpoints } from "./data/remoteDataSources";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

export class Visual implements IVisual {
    private readonly target: HTMLElement;
    private readonly host: powerbi.extensibility.visual.IVisualHost;
    private readonly selectionManager: powerbi.extensibility.ISelectionManager;
    private readonly hostBridge: PowerBiHostBridge;
    private readonly instanceId = createInstanceId();
    private readonly formattingSettingsService = new FormattingSettingsService();
    private readonly viewerRenderStability = new ViewerRenderStability(900);
    private formattingSettings = new VisualFormattingSettingsModel();
    private data: NormalizedData = parseDataView();
    private selectionIds: Array<powerbi.visuals.ISelectionId | undefined> = [];
    private specification = "";
    private configuration = defaultConfigJson;
    private editMode = powerbi.EditMode.Default;
    private draftSpecification = "";
    private draftConfiguration = "";
    private renderMs = 0;
    private studioLayout = JSON.stringify(defaultStudioLayout);
    private webAccessAvailable = false;
    private providerAccess:ProviderAccessState={tiles:{allowed:false,reason:"Provider access has not been checked."},geocoder:{allowed:false,reason:"Provider access has not been checked."}};
    private providerAccessSequence=0;private providerAccessSignature="";
    private interactionDiagnostics: InteractionDiagnostics = createInteractionDiagnostics(false, false, 0);
    private moreRowsAvailable = false;
    private fetchMoreDataInProgress = false;
    private lastFetchRequestedRowCount = -1;

    constructor(options?: VisualConstructorOptions) {
        if (!options) throw new Error("HyperPBI requires Power BI visual constructor options.");
        this.target = options.element; this.host = options.host; this.selectionManager = this.host.createSelectionManager();
        this.hostBridge = new PowerBiHostBridge({ host: this.host, selectionManager: this.selectionManager, selectionIds: () => this.selectionIds, fields: () => this.data.fields, interactionsEnabled: () => toRuntimeSettings(this.formattingSettings).enableInteractions });
        this.target.classList.add("hyperpbi-visual-host");
        void this.checkProviderAccess();
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
        const wasFetching = this.fetchMoreDataInProgress;
        const parsedData = parseDataView(dataView);
        const selectionData = buildRowSelectionData(this.host, dataView);

        const incomingData: NormalizedData = {
            ...parsedData,
            rowKeys:
                selectionData.rowKeys.length === parsedData.rows.length
                    ? selectionData.rowKeys
                    : parsedData.rowKeys
        };

        const incomingSelectionIds = selectionData.selectionIds;

        this.fetchMoreDataInProgress = false; this.moreRowsAvailable = Boolean(dataView?.metadata?.segment);
        if (wasFetching && this.data.rows.length && incomingData.rows.length <= this.data.rows.length && !this.sameRows(this.data.rows, incomingData.rows)) {
            const previousSelectionByKey = new Map(
                this.data.rowKeys.map((key, index) => [
                    key,
                    this.selectionIds[index]
                ])
            );

            const incomingSelectionByKey = new Map(
                incomingData.rowKeys.map((key, index) => [
                    key,
                    incomingSelectionIds[index]
                ])
            );

            const merged = mergeNormalizedData(this.data, incomingData);

            this.selectionIds = merged.rowKeys.map(
                key =>
                    previousSelectionByKey.get(key) ??
                    incomingSelectionByKey.get(key)
            );

            this.data = merged;
        }
        else {
            this.data = incomingData;
            this.selectionIds = incomingSelectionIds;
        }
        this.data = { ...this.data, loadStatus: { loadedRowCount: this.data.rows.length, moreRowsAvailable: this.moreRowsAvailable, fetchInProgress: false } }; this.editMode = nextEditMode;void this.checkProviderAccess();
        this.interactionDiagnostics = { ...this.interactionDiagnostics, externalInteractionEnabled: toRuntimeSettings(this.formattingSettings).enableInteractions, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions === true, selectionIdentityCount: this.selectionIds.length };
        this.renderMs = performance.now() - started; this.renderCurrent(); this.host.eventService?.renderingFinished(options); this.requestMoreDataIfNeeded();
    }

    private renderCurrent(): void {
        const settings = toRuntimeSettings(this.formattingSettings);
        if (shouldRenderLandingPage(this.data, this.specification)) {
            this.viewerRenderStability.reset();
            render(h(LandingPage, {}), this.target);
            return;
        }
        if (this.editMode === powerbi.EditMode.Advanced) {
            this.viewerRenderStability.reset();
            const initialSpec = this.specification || JSON.stringify(createDefaultSchema(this.data), null, 2);
            render(h(HyperPbiStudio, { instanceId: this.instanceId, data: this.data, settings, initialSpecification: initialSpec, initialConfiguration: this.configuration || defaultConfigJson, initialLayout: this.studioLayout, onSave: this.saveAndCloseStudio, onDraftChange: this.captureDraft, onLayoutChange: this.saveStudioLayout, selectionIdentityCount: this.selectionIds.length, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions === true, initialInteractionDiagnostics: this.interactionDiagnostics, selectExternal: this.selectRows, clearExternal: this.clearSelection, applyExternalFilter:this.applyFilter,clearExternalFilter:this.clearFilter, initialEditorTab: "ai", webAccessAvailable: this.webAccessAvailable,providerAccess:this.providerAccess,remoteSourceHost:"powerbi" }), this.target);
            return;
        }
        if (!this.specification.trim()) {
            this.viewerRenderStability.reset();
            render(h(SetupExperience, { data: this.data }), this.target);
            return;
        }

        const schemaResult = this.parseSpecification(this.specification);
        const configResult = parseConfig(this.configuration);
        if (!schemaResult.schema || !configResult.config) {
            this.renderViewerFailure([...schemaResult.errors, ...configResult.errors]);
            return;
        }

        const runtimeData = prepareRuntimeData(this.data, schemaResult.schema, configResult.config);
        if (!runtimeData.data) {
            this.renderViewerFailure(runtimeData.errors);
            return;
        }

        this.viewerRenderStability.markSuccess();
        render(h(HyperPbiRoot, { instanceId: this.instanceId, schema: schemaResult.schema, data: runtimeData.data, settings, config: configResult.config, referenceWarnings: validateReferences(schemaResult.schema, runtimeData.data), renderMs: this.renderMs, selectExternal: this.selectRows, clearExternal: this.clearSelection, applyExternalFilter:this.applyFilter,clearExternalFilter:this.clearFilter, reportInteraction: this.reportInteraction, webAccessAvailable: this.webAccessAvailable,providerAccess:this.providerAccess,remoteSourceHost:"powerbi",ownerByRuntimeId:schemaResult.ownerByRuntimeId,componentPathById:schemaResult.componentPathById }), this.target);
    }

    private renderViewerFailure(errors: string[]): void {
        const signature = JSON.stringify([
            this.specification,
            this.configuration,
            Object.keys(this.data.fields).sort(),
            errors
        ]);

        this.viewerRenderStability.fail(signature, {
            showLoading: () => render(
                h("div", {
                    class: "hyperpbi-root",
                    role: "status",
                    "aria-live": "polite",
                    style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px",
                        background: "var(--hp-surface, #ffffff)",
                        color: "var(--hp-text, #182433)"
                    }
                }, h("div", {
                    style: {
                        fontSize: "12px",
                        color: "color-mix(in srgb, var(--hp-text, #182433) 62%, transparent)"
                    }
                }, "Loading visual…")),
                this.target
            ),
            showFailure: () => render(
                h("div", {
                    class: "hyperpbi-root",
                    role: "alert",
                    style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        background: "var(--hp-surface, #ffffff)",
                        color: "var(--hp-text, #182433)"
                    }
                }, h("div", {
                    style: {
                        width: "min(420px, 100%)",
                        padding: "14px 16px",
                        border: "1px solid var(--hp-border, #dce1e7)",
                        borderRadius: "8px",
                        background: "var(--hp-surface, #ffffff)"
                    }
                },
                    h("div", { style: { fontSize: "13px", fontWeight: 650 } }, "Unable to load this visual."),
                    h("div", {
                        style: {
                            marginTop: "4px",
                            fontSize: "11px",
                            lineHeight: 1.45,
                            color: "color-mix(in srgb, var(--hp-text, #182433) 62%, transparent)"
                        }
                    }, "Report authors can open Edit to review the visual configuration.")
                )),
                this.target
            )
        });
    }

    private async checkProviderAccess():Promise<void>{
        const activeConfiguration=this.editMode===powerbi.EditMode.Advanced&&this.draftConfiguration?this.draftConfiguration:this.configuration;
        const activeSpecification=this.editMode===powerbi.EditMode.Advanced&&this.draftSpecification?this.draftSpecification:this.specification;
        const providers=parseConfig(activeConfiguration||defaultConfigJson).config?.providers;
        const tile=providers?.basemap?.enabled?providers.basemap.tileUrl:undefined;
        const geocoder=providers?.geocoder?.enabled&&providers.geocoder.provider!=="none"?providers.geocoder.endpoint:undefined;
        const parsedSpecification=parseJson(activeSpecification).value;
        const serviceEndpoints=[...new Set([...configuredMapEndpoints(activeSpecification),...configuredRemoteDataEndpoints(parsedSpecification)])];
        const signature=JSON.stringify([tile,geocoder,serviceEndpoints]);
        if(signature===this.providerAccessSignature)return;
        this.providerAccessSignature=signature;
        const sequence=++this.providerAccessSequence;
        const safe=(endpoint:string|undefined)=>{
            if(!endpoint)return undefined;
            try{
                const url=new URL(endpoint.replace(/\{[^}]+\}/g,"0"));
                if(url.protocol!=="https:"||url.username||url.password)return undefined;
                return url.origin.toLowerCase();
            }catch{return undefined;}
        };
        const check=async(endpoint:string|undefined,label:string)=>{
            const sanitized=safe(endpoint);
            if(!endpoint)return{allowed:false,reason:`The ${label} provider is disabled.`};
            if(!sanitized)return{allowed:false,reason:`The ${label} endpoint configuration is invalid.`};
            try{
                const status=await this.host.webAccessService.webAccessStatus(sanitized);
                return{allowed:status===powerbi.PrivilegeStatus.Allowed,endpoint:sanitized,reason:status===powerbi.PrivilegeStatus.Allowed?undefined:`Power BI denied WebAccess to the configured ${label} endpoint.`};
            }catch{return{allowed:false,endpoint:sanitized,reason:`Power BI could not verify WebAccess for the configured ${label} endpoint.`};}
        };
        const [tiles,result,...serviceResults]=await Promise.all([check(tile,"tile"),check(geocoder,"geocoder"),...serviceEndpoints.map(endpoint=>check(endpoint,"external service"))]);
        if(sequence!==this.providerAccessSequence)return;
        const services=Object.fromEntries(serviceEndpoints.flatMap((endpoint,index)=>{
            const origin=providerServiceOrigin(endpoint);
            return origin?[[origin,serviceResults[index]]]:[];
        }));
        this.providerAccess={tiles,geocoder:result,services};
        this.webAccessAvailable=tiles.allowed||result.allowed||serviceResults.some(access=>access.allowed);
        this.renderCurrent();
    }

    private parseSpecification(text: string): { schema?: HyperPbiSchema; errors: string[]; ownerByRuntimeId?: Record<string,string>; componentPathById?: Record<string,string> } {
        const parsed = parseJson(text); if (parsed.error) return { errors: [`Specification JSON: ${parsed.error}`] };
        const aliases=parseConfig(this.configuration).config?.fields?.aliases;const prepared=prepareSpecification(parsed.value,this.data,{repair:false,aliasOverrides:aliases});return prepared.schema?{schema:prepared.schema,errors:[],ownerByRuntimeId:prepared.ownerByRuntimeId,componentPathById:prepared.componentPathById}:{errors:prepared.errors};
    }

    private saveAndCloseStudio = (specification: string, configuration: string): void => {
        this.specification = specification; this.configuration = configuration;
        persistVisualState(this.host, { specification, configuration, studioLayout: this.studioLayout });
        this.host.switchFocusModeState(false);
        this.editMode = powerbi.EditMode.Default; this.renderCurrent();
    };

    private captureDraft = (specification: string, configuration: string): void => { this.draftSpecification = specification; this.draftConfiguration = configuration;void this.checkProviderAccess(); };

    private saveStudioLayout = (studioLayout: string): void => { this.studioLayout = studioLayout; persistVisualState(this.host, { specification: this.specification, configuration: this.configuration, studioLayout }); };

    private updateInteractionDiagnostics = (rowIndices: number[], details: InteractionDetails, result: ExternalSelectionResult): void => {
        this.interactionDiagnostics = { ...this.interactionDiagnostics, externalInteractionEnabled: toRuntimeSettings(this.formattingSettings).enableInteractions, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions === true, selectionIdentityCount: this.selectionIds.length, lastClickedComponentId: details.componentId, lastClickedComponentType: details.componentType, lastClickedField: details.field, lastClickedValue: details.value, lastResolvedSourceRowCount:details.matchedRowCount??rowIndices.length, lastSelectedSourceRowIndices: rowIndices.slice(0, 25), externalMode:details.externalMode??"selection",filterSent:false,selectionSent:result.sent, externalSelectionSent: result.sent, filterTargetTable:undefined,filterTargetColumn:undefined,reasonExternalSelectionNotSent: result.sent ? undefined : result.reason };
    };

    private selectRows = (rowIndices: number[], multiSelect = false, details: InteractionDetails = {}): ExternalSelectionResult => {
        const indices = Array.from(new Set(rowIndices)).filter(index => Number.isInteger(index) && index >= 0 && index < this.selectionIds.length);
        const result = this.hostBridge.requestSelectionSync({ rowIndices: indices, multiSelect, details });
        rowIndices = result.sent ? indices : [];
        this.updateInteractionDiagnostics(rowIndices, details, result); return result;
    };

    private clearSelection = (details: InteractionDetails = {}): ExternalSelectionResult => {
        const result = this.hostBridge.requestSelectionSync({ rowIndices: [], clear: true, details });
        this.updateInteractionDiagnostics([], details, result); return result;
    };

    private updateFilterDiagnostics=(details:InteractionDetails,result:ExternalFilterResult):void=>{this.interactionDiagnostics={...this.interactionDiagnostics,externalInteractionEnabled:toRuntimeSettings(this.formattingSettings).enableInteractions,hostAllowsInteractions:this.host.hostCapabilities.allowInteractions===true,selectionIdentityCount:this.selectionIds.length,lastClickedComponentId:details.componentId,lastClickedComponentType:details.componentType,lastClickedField:details.field,lastClickedValue:details.value,lastResolvedSourceRowCount:details.matchedRowCount??0,lastSelectedSourceRowIndices:[],externalMode:"filter",filterSent:result.sent,selectionSent:false,externalSelectionSent:false,filterTargetTable:result.target?.table,filterTargetColumn:result.target?.column,reasonExternalSelectionNotSent:result.sent?undefined:result.reason};};
    private applyFilter=(field:string,operator:FilterOperator,value:unknown,details:InteractionDetails={}):ExternalFilterResult=>{const result=this.hostBridge.requestExternalFilterSync({field,operator,value,details});this.updateFilterDiagnostics({...details,field},result);return result;};
    private clearFilter=(details:InteractionDetails={}):ExternalFilterResult=>{const result=this.hostBridge.requestExternalFilterSync({clear:true,details});this.updateFilterDiagnostics(details,result);return result;};

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
    public destroy(): void { this.viewerRenderStability.dispose(); render(null, this.target); }
}
