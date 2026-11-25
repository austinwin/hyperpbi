"use strict";

import powerbi from "powerbi-visuals-api";
import { h, render } from "preact";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import { NormalizedData } from "./data/normalizeData";
import { IncrementalData, type DataOperation } from "./powerbi/IncrementalData";
import { defaultConfigJson, parseConfig } from "./config/hyperpbiConfig";
import { HyperPbiStudio } from "./editor/HyperPbiStudio";
import { LandingPage } from "./editor/LandingPage";
import { SetupExperience } from "./editor/SetupExperience";
import { HyperPbiRoot } from "./render/HyperPbiRoot";
import { ViewerRenderStability } from "./render/ViewerRenderStability";
import { createDefaultSchema } from "./schema/defaultSchema";
import { HyperPbiSchema } from "./schema/hyperpbiSchema";
import { validateReferences } from "./schema/validateReferences";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "./settings";
import { createInstanceId } from "./utils/ids";
import { parseJson } from "./utils/safeJson";
import { persistVisualState, readVisualState } from "./powerbi/visualState";
import { prepareRuntimeData } from "./editor/prepareAuthoringData";
import { defaultStudioLayout } from "./editor/studioLayout";
import { prepareSpecification } from "./schema/prepareSpecification";
import { createInteractionDiagnostics, ExternalSelectionFailureReason, ExternalSelectionResult, InteractionDetails, InteractionDiagnostics } from "./powerbi/interactionDiagnostics";
import { ExternalFilterResult } from "./powerbi/externalFilters";
import { FilterOperator } from "./schema/hyperpbiSchema";
import type { ProviderAccessState } from "./providers/providerTypes";
import { providerServiceOrigin } from "./providers/providerPolicy";
import { EXTERNAL_PROVIDERS_AVAILABLE } from "./providers/providerBuild";
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
    private readonly ingestion = new IncrementalData();
    private data = this.ingestion.data;
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
    private nextFetchQueued = false;
    private fetchTimeout?: ReturnType<typeof setTimeout>;
    private destroyed = false;
    private parsedSpecification?: { text: string; configuration: string; fields: NormalizedData["fields"]; result: ReturnType<Visual["parseSpecification"]> };
    private configCache?: { text: string; result: ReturnType<typeof parseConfig> };
    private referenceCache?: { schema: HyperPbiSchema; fields: NormalizedData["fields"]; warnings: string[] };
    private providerInput?: { specification: string; configuration: string };

    constructor(options?: VisualConstructorOptions) {
        if (!options) throw new Error("HyperPBI requires Power BI visual constructor options.");
        this.target = options.element; this.host = options.host; this.selectionManager = this.host.createSelectionManager();
        this.hostBridge = new PowerBiHostBridge({ host: this.host, selectionManager: this.selectionManager, selectionRowCount: () => this.ingestion.selectionCount ? this.data.rows.length : 0, selectionIdForRow: index => this.ingestion.getSelectionId(this.host, index), fields: () => this.data.fields, interactionsEnabled: () => toRuntimeSettings(this.formattingSettings).enableInteractions });
        this.target.classList.add("hyperpbi-visual-host");
        void this.checkProviderAccess();
    }

    public update(options: VisualUpdateOptions): void {
        if (this.destroyed) return;
        const started = performance.now(); this.host.eventService?.renderingStarted(options);
        const dataView = options.dataViews?.[0];
        const operation: DataOperation = options.operationKind === powerbi.VisualDataChangeOperationKind.Segment ? "segment"
            : options.operationKind === powerbi.VisualDataChangeOperationKind.Append ? "append" : "replace";
        // Segment callbacks carry data for the active query. Formatting,
        // persisted edits, and provider access are handled by regular updates.
        if (operation !== "replace" && (options.editMode === undefined || options.editMode === this.editMode)) {
            this.acceptData(dataView, operation, started);
            this.host.eventService?.renderingFinished(options);
            this.scheduleFetch();
            return;
        }
        const previousEditMode = this.editMode;
        const nextEditMode = options.editMode ?? powerbi.EditMode.Default;
        if (dataView) this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dataView);
        const leavingNativeEditor = previousEditMode === powerbi.EditMode.Advanced && nextEditMode !== powerbi.EditMode.Advanced && Boolean(this.draftSpecification);
        if (leavingNativeEditor && this.parseSpecification(this.draftSpecification).schema && parseConfig(this.draftConfiguration).config) {
            this.specification = this.draftSpecification; this.configuration = this.draftConfiguration; persistVisualState(this.host, { specification: this.specification, configuration: this.configuration });
        } else {
            const persisted = readVisualState(dataView); if (persisted.specification !== undefined) this.specification = persisted.specification; if (persisted.configuration !== undefined) this.configuration = persisted.configuration || defaultConfigJson; if (persisted.studioLayout !== undefined) this.studioLayout = persisted.studioLayout;
        }
        if ((options.type & powerbi.VisualUpdateType.Data) !== 0 || options.operationKind !== undefined) {
            if (this.ingestion.accept(dataView, operation)) {
                this.clearFetchTimeout();
                this.data = this.ingestion.data;
            }
        }
        this.editMode = nextEditMode;
        void this.checkProviderAccess();
        this.interactionDiagnostics = { ...this.interactionDiagnostics, externalInteractionEnabled: toRuntimeSettings(this.formattingSettings).enableInteractions, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions === true, selectionIdentityCount: this.ingestion.selectionCount };
        this.renderMs = performance.now() - started;
        this.renderCurrent();
        this.host.eventService?.renderingFinished(options);
        this.scheduleFetch();
    }

    private acceptData(dataView: powerbi.DataView | undefined, operation: DataOperation, started: number): void {
        if (!this.ingestion.accept(dataView, operation)) return;
        this.clearFetchTimeout();
        this.data = this.ingestion.data;
        this.interactionDiagnostics = { ...this.interactionDiagnostics, selectionIdentityCount: this.ingestion.selectionCount };
        const showProgress = this.readConfig(this.configuration).config?.renderer?.showDataLoadProgress !== false;
        if (this.data.loadStatus?.completeness === "loading" && this.editMode !== powerbi.EditMode.Advanced && !showProgress) return;
        this.renderMs = performance.now() - started;
        this.renderCurrent();
    }

    private renderCurrent(): void {
        if (this.destroyed) return;
        const settings = toRuntimeSettings(this.formattingSettings);
        if (shouldRenderLandingPage(this.data, this.specification)) {
            this.viewerRenderStability.reset();
            render(h(LandingPage, {}), this.target);
            return;
        }
        if (this.editMode === powerbi.EditMode.Advanced) {
            this.viewerRenderStability.reset();
            const initialSpec = this.specification || JSON.stringify(createDefaultSchema(this.data), null, 2);
            render(h(HyperPbiStudio, { instanceId: this.instanceId, data: this.data, settings, initialSpecification: initialSpec, initialConfiguration: this.configuration || defaultConfigJson, initialLayout: this.studioLayout, onSave: this.saveAndCloseStudio, onDraftChange: this.captureDraft, onLayoutChange: this.saveStudioLayout, selectionIdentityCount: this.ingestion.selectionCount, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions === true, initialInteractionDiagnostics: this.interactionDiagnostics, selectExternal: this.selectRows, clearExternal: this.clearSelection, applyExternalFilter:this.applyFilter,clearExternalFilter:this.clearFilter, initialEditorTab: "ai", webAccessAvailable: this.webAccessAvailable,providerAccess:this.providerAccess,remoteSourceHost:"powerbi" }), this.target);
            return;
        }
        if (!this.specification.trim()) {
            this.viewerRenderStability.reset();
            const showProgress = this.readConfig(this.configuration).config?.renderer?.showDataLoadProgress;
            render(h(SetupExperience, { data: this.data, showProgress }), this.target);
            return;
        }

        const schemaResult = this.parseSpecification(this.specification);
        const configResult = this.readConfig(this.configuration);
        if (!schemaResult.schema || !configResult.config) {
            this.renderViewerFailure([...schemaResult.errors, ...configResult.errors]);
            return;
        }

        const loading = this.data.loadStatus?.completeness === "loading";
        const runtimeData = loading ? { data: this.data, errors: [] } : prepareRuntimeData(this.data, schemaResult.schema, configResult.config);
        if (!runtimeData.data) {
            this.renderViewerFailure(runtimeData.errors);
            return;
        }

        if (!loading && (this.referenceCache?.schema !== schemaResult.schema || this.referenceCache.fields !== runtimeData.data.fields)) {
            this.referenceCache = {
                schema: schemaResult.schema, fields: runtimeData.data.fields,
                warnings: validateReferences(schemaResult.schema, runtimeData.data),
            };
        }
        this.viewerRenderStability.markSuccess();
        render(h(HyperPbiRoot, { instanceId: this.instanceId, schema: schemaResult.schema, data: runtimeData.data, settings, config: configResult.config, referenceWarnings: this.referenceCache?.warnings, renderMs: this.renderMs, selectExternal: this.selectRows, clearExternal: this.clearSelection, applyExternalFilter:this.applyFilter,clearExternalFilter:this.clearFilter, reportInteraction: this.reportInteraction, webAccessAvailable: this.webAccessAvailable,providerAccess:this.providerAccess,remoteSourceHost:"powerbi",ownerByRuntimeId:schemaResult.ownerByRuntimeId,componentPathById:schemaResult.componentPathById }), this.target);
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
        if(!EXTERNAL_PROVIDERS_AVAILABLE)return;
        const activeConfiguration=this.editMode===powerbi.EditMode.Advanced&&this.draftConfiguration?this.draftConfiguration:this.configuration;
        const activeSpecification=this.editMode===powerbi.EditMode.Advanced&&this.draftSpecification?this.draftSpecification:this.specification;
        if (this.providerInput?.specification === activeSpecification && this.providerInput.configuration === activeConfiguration) return;
        this.providerInput = { specification: activeSpecification, configuration: activeConfiguration };
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
        if(this.destroyed||sequence!==this.providerAccessSequence)return;
        const services=Object.fromEntries(serviceEndpoints.flatMap((endpoint,index)=>{
            const origin=providerServiceOrigin(endpoint);
            return origin?[[origin,serviceResults[index]]]:[];
        }));
        this.providerAccess={tiles,geocoder:result,services};
        this.webAccessAvailable=tiles.allowed||result.allowed||serviceResults.some(access=>access.allowed);
        this.renderCurrent();
    }

    private readConfig(text: string): ReturnType<typeof parseConfig> {
        if (this.configCache?.text !== text) this.configCache = { text, result: parseConfig(text) };
        return this.configCache.result;
    }

    private parseSpecification(text: string): { schema?: HyperPbiSchema; errors: string[]; ownerByRuntimeId?: Record<string,string>; componentPathById?: Record<string,string> } {
        if (this.parsedSpecification?.text === text && this.parsedSpecification.configuration === this.configuration &&
            this.parsedSpecification.fields === this.data.fields) return this.parsedSpecification.result;

        const started = performance.now();
        const parsed = parseJson(text);
        const prepared = parsed.error ? undefined : prepareSpecification(parsed.value, this.data, {
            repair: false, aliasOverrides: this.readConfig(this.configuration).config?.fields?.aliases,
        });
        const result = prepared?.schema
            ? { schema: prepared.schema, errors: [], ownerByRuntimeId: prepared.ownerByRuntimeId, componentPathById: prepared.componentPathById }
            : { errors: prepared?.errors ?? [`Specification JSON: ${parsed.error}`] };
        this.parsedSpecification = { text, configuration: this.configuration, fields: this.data.fields, result };
        this.ingestion.performance.record("validation", started);
        return result;
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
        this.interactionDiagnostics = { ...this.interactionDiagnostics, externalInteractionEnabled: toRuntimeSettings(this.formattingSettings).enableInteractions, hostAllowsInteractions: this.host.hostCapabilities.allowInteractions === true, selectionIdentityCount: this.ingestion.selectionCount, lastClickedComponentId: details.componentId, lastClickedComponentType: details.componentType, lastClickedField: details.field, lastClickedValue: details.value, lastResolvedSourceRowCount:details.matchedRowCount??rowIndices.length, lastSelectedSourceRowIndices: rowIndices.slice(0, 25), externalMode:details.externalMode??"selection",filterSent:false,selectionSent:result.sent, externalSelectionSent: result.sent, filterTargetTable:undefined,filterTargetColumn:undefined,reasonExternalSelectionNotSent: result.sent ? undefined : result.reason };
    };

    private selectRows = (rowIndices: number[], multiSelect = false, details: InteractionDetails = {}): ExternalSelectionResult => {
        const indices = rowIndices;
        const result = this.hostBridge.requestSelectionSync({ rowIndices: indices, multiSelect, details });
        rowIndices = result.sent ? indices : [];
        this.updateInteractionDiagnostics(rowIndices, details, result); return result;
    };

    private clearSelection = (details: InteractionDetails = {}): ExternalSelectionResult => {
        const result = this.hostBridge.requestSelectionSync({ rowIndices: [], clear: true, details });
        this.updateInteractionDiagnostics([], details, result); return result;
    };

    private updateFilterDiagnostics=(details:InteractionDetails,result:ExternalFilterResult):void=>{this.interactionDiagnostics={...this.interactionDiagnostics,externalInteractionEnabled:toRuntimeSettings(this.formattingSettings).enableInteractions,hostAllowsInteractions:this.host.hostCapabilities.allowInteractions===true,selectionIdentityCount:this.ingestion.selectionCount,lastClickedComponentId:details.componentId,lastClickedComponentType:details.componentType,lastClickedField:details.field,lastClickedValue:details.value,lastResolvedSourceRowCount:details.matchedRowCount??0,lastSelectedSourceRowIndices:[],externalMode:"filter",filterSent:result.sent,selectionSent:false,externalSelectionSent:false,filterTargetTable:result.target?.table,filterTargetColumn:result.target?.column,reasonExternalSelectionNotSent:result.sent?undefined:result.reason};};
    private applyFilter=(field:string,operator:FilterOperator,value:unknown,details:InteractionDetails={}):ExternalFilterResult=>{const result=this.hostBridge.requestExternalFilterSync({field,operator,value,details});this.updateFilterDiagnostics({...details,field},result);return result;};
    private clearFilter=(details:InteractionDetails={}):ExternalFilterResult=>{const result=this.hostBridge.requestExternalFilterSync({clear:true,details});this.updateFilterDiagnostics(details,result);return result;};

    private reportInteraction = (details: InteractionDetails, reason: ExternalSelectionFailureReason = "component did not call selectExternal", rowIndices: number[] = []): void => this.updateInteractionDiagnostics(rowIndices, details, { sent: false, reason });

    private scheduleFetch(): void {
        if (!this.ingestion.canFetch || this.nextFetchQueued || this.destroyed) return;
        this.nextFetchQueued = true;
        // Avoid the per-window timer delay and stay outside any synchronous
        // update callback the host might make while accepting a request.
        queueMicrotask(() => {
            this.nextFetchQueued = false;
            if (!this.ingestion.canFetch || this.destroyed) return;
            this.fetchTimeout = setTimeout(() => {
                this.fetchTimeout = undefined;
                this.ingestion.markIncomplete("Power BI did not finish sending data. Refresh the visual to retry.");
                this.data = this.ingestion.data;
                this.renderCurrent();
            }, 60_000);
            if (!this.ingestion.requestNext(this.host)) {
                this.clearFetchTimeout();
                this.data = this.ingestion.data;
                this.renderCurrent();
            }
        });
    }

    private clearFetchTimeout(): void {
        clearTimeout(this.fetchTimeout);
        this.fetchTimeout = undefined;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel { return this.formattingSettingsService.buildFormattingModel(this.formattingSettings); }
    public destroy(): void {
        this.destroyed = true;
        this.clearFetchTimeout();
        this.viewerRenderStability.dispose();
        render(null, this.target);
        this.ingestion.reset();
        this.data = this.ingestion.data;
        this.parsedSpecification = undefined;
        this.referenceCache = undefined;
        this.configCache = undefined;
    }
}
