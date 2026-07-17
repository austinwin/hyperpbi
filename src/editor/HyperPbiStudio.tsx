import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { CalculationSpecification } from "../calculations/calculationTypes";
import { HyperPbiConfig, parseConfig } from "../config/hyperpbiConfig";
import { NormalizedData } from "../data/normalizeData";
import { GeocodeResult } from "../providers/providerTypes";
import { HyperPbiRoot } from "../render/HyperPbiRoot";
import { DashboardComponent, HyperPbiSchema } from "../schema/hyperpbiSchema";
import { migrateSchema } from "../schema/schemaMigrations";
import { migrateFieldReferences } from "../schema/migrateFieldReferences";
import { validateReferences } from "../schema/validateReferences";
import { validateSchema } from "../schema/validateSchema";
import { RuntimeSettings } from "../settings";
import { parseJson } from "../utils/safeJson";
import { AiPromptTab } from "./ai/AiPromptTab";
import { CalculationsTab } from "./CalculationsTab";
import { CodeEditor } from "./CodeEditor";
import { DataPreview } from "./DataPreview";
import { FieldsPanel } from "./FieldsPanel";
import { HelpDocsPanel } from "./HelpDocsPanel";
import { InteractionsPanel } from "./InteractionsPanel";
import { MapServicesPanel } from "./MapServicesPanel";
import { StudioSettings } from "./StudioSettings";
import { SkillTab } from "./SkillTab";
import {
  defaultStudioLayout,
  parseStudioLayout,
  StudioLayoutPreference,
} from "./studioLayout";
import { copyText } from "./textActions";
import {
  createInteractionDiagnostics,
  ExternalSelectionFailureReason,
  ExternalSelectionResult,
  InteractionDetails,
  InteractionDiagnostics,
} from "../powerbi/interactionDiagnostics";
import { sanitizeCss } from "../security/sanitizeCss";
import { sanitizeHtml } from "../security/sanitizeHtml";
import { RuntimeConfigTab } from "./config/RuntimeConfigTab";
import { ExternalFilterResult } from "../powerbi/externalFilters";
import { FilterOperator } from "../schema/hyperpbiSchema";
import { prepareSpecification } from "../schema/prepareSpecification";
import { SpecificationInspector } from "./inspector/SpecificationInspector";
import { componentTree } from "./inspector/specificationEditor";
import { SpecificationHistory } from "./inspector/specificationEditor";
import { MapStudio } from "./map-studio/MapStudio";
import type { ProviderAccessState } from "../providers/providerTypes";
import {
  prepareAuthoringData,
  type PreparedAuthoringData,
} from "./prepareAuthoringData";
import type { MapViewportState } from "../components/maps/MapBlock";
import { StudioButton } from "./ui/StudioButton";
import { StudioStatusChip } from "./ui/StudioStatusChip";
import {
  StudioWorkspaceNav,
  type StudioWorkspaceId,
} from "./ui/StudioWorkspaceNav";

type EditorTab = StudioWorkspaceId;
type BottomTab =
  | "data"
  | "fields"
  | "logs"
  | "errors"
  | "mapServices"
  | "geocode"
  | "interactions";
const escapeAttributeValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const mapIdForSelection = (
  selected: string,
  tree: Array<{ id: string; type: string }>,
) =>
  tree.find((item) => item.id === selected && item.type === "map")?.id ??
  tree.find((item) => item.type === "map")?.id ??
  "";
interface StudioLog {
  level: "info" | "error" | "success";
  message: string;
  timestamp?: string;
}
interface ValidationResult {
  schema?: HyperPbiSchema;
  config?: HyperPbiConfig;
  data?: NormalizedData;
  errors: string[];
  warnings: string[];
  ownerByRuntimeId?: Record<string, string>;
  componentPathById?: Record<string, string>;
}

function sanitizerWarnings(
  schema: HyperPbiSchema,
  config: HyperPbiConfig,
): string[] {
  const warnings = sanitizeCss(
    `${schema.styles?.globalCss ?? ""}\n${schema.css ?? ""}`,
    "#studio-preview",
    { mode: config.security?.cssMode },
  ).warnings.map((warning) => `Sanitizer: ${warning}`);
  const visit = (component: DashboardComponent, path: string) => {
    if (component.css)
      warnings.push(
        ...sanitizeCss(component.css, `[data-hp-id="studio"]`, {
          mode: config.security?.cssMode,
        }).warnings.map((warning) => `${path}: ${warning}`),
      );
    if ("html" in component && component.html)
      warnings.push(
        ...sanitizeHtml(component.html, {
          mode: config.security?.htmlMode,
        }).warnings.map((warning) => `${path}: ${warning}`),
      );
    Object.entries(component.slots ?? {}).forEach(([name, html]) =>
      warnings.push(
        ...sanitizeHtml(html, { mode: config.security?.htmlMode }).warnings.map(
          (warning) => `${path} slot ${name}: ${warning}`,
        ),
      ),
    );
    if ("children" in component)
      component.children?.forEach((child, index) =>
        visit(child, `${path}/children/${index}`),
      );
    if ("tabs" in component)
      component.tabs.forEach((tab, index) =>
        (tab.children ?? tab.components ?? tab.content ?? []).forEach(
          (child, childIndex) =>
            visit(child, `${path}/tabs/${index}/${childIndex}`),
        ),
      );
    if ("chart" in component) visit(component.chart, `${path}/chart`);
  };
  [
    schema.toolbar ?? [],
    schema.leftPanel ?? [],
    schema.components,
    schema.rightPanel ?? [],
  ].forEach((items, group) =>
    items.forEach((component, index) =>
      visit(component, `Component ${group}/${index}`),
    ),
  );
  return Array.from(new Set(warnings));
}

function validateDraft(
  specification: string,
  configuration: string,
  data: NormalizedData,
): ValidationResult {
  const prepared = prepareAuthoringData(specification, configuration, data);
  const warnings = [...prepared.warnings];
  if (prepared.specification && prepared.config)
    warnings.push(
      ...sanitizerWarnings(prepared.specification, prepared.config),
    );
  return {
    schema: prepared.specification,
    config: prepared.config,
    data: prepared.configuredData,
    errors: prepared.errors,
    warnings: Array.from(new Set(warnings)),
    ownerByRuntimeId: prepared.ownerByRuntimeId,
    componentPathById: prepared.componentPathById,
  };
}
function validateStructure(
  specification: string,
  configuration: string,
  data: NormalizedData,
): { schema?: HyperPbiSchema; errors: string[] } {
  const errors: string[] = [];
  const config = parseConfig(configuration);
  const parsed = parseJson(specification);
  if (parsed.error) errors.push(`Specification JSON: ${parsed.error}`);
  const prepared = parsed.value
    ? prepareSpecification(parsed.value, data, {
        repair: false,
        aliasOverrides: config.config?.fields?.aliases,
      })
    : undefined;
  if (prepared && !prepared.schema)
    errors.push(...prepared.errors.map((error) => `Specification: ${error}`));
  errors.push(...config.errors);
  return { schema: prepared?.schema, errors };
}

export function HyperPbiStudio({
  instanceId,
  data,
  settings,
  initialSpecification,
  initialConfiguration,
  initialLayout,
  onSave,
  onDraftChange,
  onLayoutChange,
  selectionIdentityCount = 0,
  hostAllowsInteractions = false,
  initialInteractionDiagnostics,
  selectExternal: externalSelect = () => ({
    sent: false,
    reason: "component did not call selectExternal",
  }),
  clearExternal: externalClear = () => ({
    sent: false,
    reason: "component did not call selectExternal",
  }),
  applyExternalFilter: externalFilter = () => ({
    sent: false,
    reason: "component did not call selectExternal",
  }),
  clearExternalFilter: externalFilterClear = () => ({
    sent: false,
    reason: "component did not call selectExternal",
  }),
  initialEditorTab = "ai",
  webAccessAvailable = false,
  providerAccess,
}: {
  instanceId: string;
  data: NormalizedData;
  settings: RuntimeSettings;
  initialSpecification: string;
  initialConfiguration: string;
  initialLayout?: string;
  onSave: (specification: string, configuration: string) => void;
  onDraftChange?: (specification: string, configuration: string) => void;
  onLayoutChange?: (layout: string) => void;
  selectionIdentityCount?: number;
  hostAllowsInteractions?: boolean;
  initialInteractionDiagnostics?: InteractionDiagnostics;
  selectExternal?: (
    indices: number[],
    multiSelect?: boolean,
    details?: InteractionDetails,
  ) => ExternalSelectionResult;
  clearExternal?: (details?: InteractionDetails) => ExternalSelectionResult;
  applyExternalFilter?: (
    field: string,
    operator: FilterOperator,
    value: unknown,
    details?: InteractionDetails,
  ) => ExternalFilterResult;
  clearExternalFilter?: (details?: InteractionDetails) => ExternalFilterResult;
  initialEditorTab?: EditorTab;
  webAccessAvailable?: boolean;
  providerAccess?: ProviderAccessState;
}) {
  const [specification, setSpecification] = useState(initialSpecification);
  const [configuration, setConfiguration] = useState(initialConfiguration);
  const [editorTab, setEditorTab] = useState<EditorTab>(initialEditorTab);
  const [bottomTab, setBottomTab] = useState<BottomTab>("data");
  const [selectedComponentId, setSelectedComponentId] = useState("");
  const [selectedRuntimeComponentId, setSelectedRuntimeComponentId] =
    useState("");
  const [inspectorMode, setInspectorMode] = useState(false);
  const [focusMode, setFocusMode] = useState<"both" | "editor" | "preview">("both");
  const [workbenchStacked, setWorkbenchStacked] = useState(
    settings.editor.previewPosition === "bottom",
  );
  const [mapViewports, setMapViewports] = useState<
    Record<string, MapViewportState>
  >({});
  const specificationHistory = useRef(
    new SpecificationHistory(initialSpecification),
  );
  const [logs, setLogs] = useState<StudioLog[]>([
    {
      level: "info",
      message:
        "Builder ready. Describe the dashboard, copy the prompt, paste the AI response, validate, preview, and save.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [issueSource, setIssueSource] = useState<{
    specification: string;
    configuration: string;
  }>();
  const [preview, setPreview] = useState<{
    schema: HyperPbiSchema;
    config: HyperPbiConfig;
    data: NormalizedData;
    sourceSpecification: string;
    sourceConfiguration: string;
    ownerByRuntimeId?: Record<string, string>;
    componentPathById?: Record<string, string>;
  }>();
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [layout, setLayout] = useState<StudioLayoutPreference>(() =>
    initialLayout ? parseStudioLayout(initialLayout) : defaultStudioLayout,
  );
  const [interactionDiagnostics, setInteractionDiagnostics] =
    useState<InteractionDiagnostics>(
      () =>
        initialInteractionDiagnostics ??
        createInteractionDiagnostics(
          settings.enableInteractions,
          hostAllowsInteractions,
          selectionIdentityCount,
        ),
    );
  const workbenchRef = useRef<HTMLDivElement>(null);
  const activePointerCleanupRef = useRef<(() => void) | null>(null);
  const dirty =
    specification !== initialSpecification ||
    configuration !== initialConfiguration;
  const structure = useMemo(
    () => validateStructure(specification, configuration, data),
    [specification, configuration, data],
  );
  const preparedAuthoring = useMemo<PreparedAuthoringData>(
    () => prepareAuthoringData(specification, configuration, data),
    [specification, configuration, data],
  );
  const validateCandidate = useCallback(
    (candidateSpecificationJson: string) =>
      prepareAuthoringData(candidateSpecificationJson, configuration, data),
    [configuration, data],
  );
  const issuesAreCurrent =
    issueSource?.specification === specification &&
    issueSource.configuration === configuration;
  const visibleErrors = issuesAreCurrent ? errors : structure.errors;
  const visibleWarnings = issuesAreCurrent ? warnings : [];
  const issueCount = visibleErrors.length + visibleWarnings.length;
  const previewCurrent = Boolean(
    preview &&
      preview.sourceSpecification === specification &&
      preview.sourceConfiguration === configuration,
  );
  const status = visibleErrors.length
    ? "Invalid"
    : dirty
      ? previewCurrent
        ? "Unsaved"
        : "Not previewed"
      : previewCurrent
        ? "Ready"
        : "Saved";
  useEffect(
    () => onDraftChange?.(specification, configuration),
    [specification, configuration],
  );
  useEffect(() => {
    if (!inspectorMode) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInspectorMode(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [inspectorMode]);
  useEffect(() => {
    const host = workbenchRef.current;
    host
      ?.querySelectorAll(".hp-inspector-selected")
      .forEach((element) => element.classList.remove("hp-inspector-selected"));
    if (selectedComponentId) {
      const safe = escapeAttributeValue(selectedComponentId);
      host
        ?.querySelector(`[data-hp-id="${safe}"]`)
        ?.classList.add("hp-inspector-selected");
    }
  }, [selectedComponentId, preview, inspectorMode]);
  useEffect(() => () => activePointerCleanupRef.current?.(), []);
  useEffect(() => {
    const host = workbenchRef.current;
    if (!host) return;
    const update = () => {
      const width = host.getBoundingClientRect().width;
      setWorkbenchStacked(
        settings.editor.previewPosition === "bottom" ||
          (width > 0 && width < 900),
      );
    };
    update();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(update);
      observer.observe(host);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [settings.editor.previewPosition]);
  const appendLog = (message: string, level: StudioLog["level"] = "info") =>
    setLogs((current) => [
      ...current.slice(-199),
      { message, level, timestamp: new Date().toISOString() },
    ]);
  const updateInteraction = (
    indices: number[],
    details: InteractionDetails,
    result: ExternalSelectionResult,
  ) =>
    setInteractionDiagnostics((current) => ({
      ...current,
      externalInteractionEnabled: settings.enableInteractions,
      hostAllowsInteractions,
      selectionIdentityCount,
      lastClickedComponentId: details.componentId,
      lastClickedComponentType: details.componentType,
      lastClickedField: details.field,
      lastClickedValue: details.value,
      lastResolvedSourceRowCount: details.matchedRowCount ?? indices.length,
      lastSelectedSourceRowIndices: indices.slice(0, 25),
      externalMode: details.externalMode ?? "selection",
      filterSent: false,
      selectionSent: result.sent,
      externalSelectionSent: result.sent,
      filterTargetTable: undefined,
      filterTargetColumn: undefined,
      reasonExternalSelectionNotSent: result.sent ? undefined : result.reason,
    }));
  const selectExternal = (
    indices: number[],
    multiSelect = false,
    details: InteractionDetails = {},
  ) => {
    const result = externalSelect(indices, multiSelect, details);
    updateInteraction(indices, details, result);
    return result;
  };
  const clearExternal = (details: InteractionDetails = {}) => {
    const result = externalClear(details);
    updateInteraction([], details, result);
    return result;
  };
  const updateFilter = (
    details: InteractionDetails,
    result: ExternalFilterResult,
  ) =>
    setInteractionDiagnostics((current) => ({
      ...current,
      externalInteractionEnabled: settings.enableInteractions,
      hostAllowsInteractions,
      selectionIdentityCount,
      lastClickedComponentId: details.componentId,
      lastClickedComponentType: details.componentType,
      lastClickedField: details.field,
      lastClickedValue: details.value,
      lastResolvedSourceRowCount: details.matchedRowCount ?? 0,
      lastSelectedSourceRowIndices: [],
      externalMode: "filter",
      filterSent: result.sent,
      selectionSent: false,
      externalSelectionSent: false,
      filterTargetTable: result.target?.table,
      filterTargetColumn: result.target?.column,
      reasonExternalSelectionNotSent: result.sent ? undefined : result.reason,
    }));
  const applyExternalFilter = (
    field: string,
    operator: FilterOperator,
    value: unknown,
    details: InteractionDetails = {},
  ) => {
    const result = externalFilter(field, operator, value, details);
    updateFilter({ ...details, field }, result);
    return result;
  };
  const clearExternalFilter = (details: InteractionDetails = {}) => {
    const result = externalFilterClear(details);
    updateFilter(details, result);
    return result;
  };
  const reportInteraction = (
    details: InteractionDetails,
    reason: ExternalSelectionFailureReason = "component did not call selectExternal",
    indices: number[] = [],
  ) => updateInteraction(indices, details, { sent: false, reason });
  const validate = () => {
    try {
      const result = validateDraft(specification, configuration, data);
      setErrors(result.errors);
      setWarnings(result.warnings);
      setIssueSource({ specification, configuration });
      if (result.errors.length) {
        result.errors.forEach((message) => appendLog(message, "error"));
        setBottomTab("errors");
        return result;
      }
      appendLog(
        `Validation passed with ${result.warnings.length} warning(s).`,
        "success",
      );
      if (result.warnings.length)
        result.warnings.forEach((message) => appendLog(message));
      setBottomTab(result.warnings.length ? "errors" : "logs");
      return result;
    } catch (error) {
      const message = `Validation failed unexpectedly: ${error instanceof Error ? error.message : String(error)}`;
      setErrors([message]);
      setWarnings([]);
      setIssueSource({ specification, configuration });
      appendLog(message, "error");
      setBottomTab("errors");
      return { errors: [message], warnings: [] };
    }
  };
  const run = (
    candidate = specification,
    candidateConfig = configuration,
  ): boolean => {
    try {
      const result = validateDraft(candidate, candidateConfig, data);
      setErrors(result.errors);
      setWarnings(result.warnings);
      setIssueSource({
        specification: candidate,
        configuration: candidateConfig,
      });
      if (
        result.errors.length ||
        !result.schema ||
        !result.config ||
        !result.data
      ) {
        result.errors.forEach((message) => appendLog(message, "error"));
        setBottomTab("errors");
        return false;
      }
      setPreview({
        schema: result.schema,
        config: result.config,
        data: result.data,
        sourceSpecification: candidate,
        sourceConfiguration: candidateConfig,
        ownerByRuntimeId: result.ownerByRuntimeId,
        componentPathById: result.componentPathById,
      });
      appendLog(
        `Rendered ${result.data.rows.length.toLocaleString()} rows with ${result.warnings.length} warning(s).`,
        "success",
      );
      if (result.warnings.length) setBottomTab("errors");
      return true;
    } catch (error) {
      const message = `Render failed safely: ${error instanceof Error ? error.message : String(error)}`;
      setErrors([message]);
      setWarnings([]);
      setIssueSource({
        specification: candidate,
        configuration: candidateConfig,
      });
      appendLog(message, "error");
      setBottomTab("errors");
      return false;
    }
  };
  const save = () => {
    const result = validate();
    if (!result.errors.length && result.schema && result.config && run())
      onSave(specification, configuration);
  };
  const formatActive = () => {
    const target = editorTab === "config" ? "config" : "specification";
    try {
      if (target === "config")
        setConfiguration(JSON.stringify(JSON.parse(configuration), null, 2));
      else setSpecification(JSON.stringify(JSON.parse(specification), null, 2));
      setEditorTab(target);
      appendLog(`Formatted ${target} JSON.`, "success");
    } catch (error) {
      const message = `Cannot format invalid ${target} JSON: ${error instanceof Error ? error.message : String(error)}`;
      setErrors([message]);
      setWarnings([]);
      setIssueSource({ specification, configuration });
      appendLog(message, "error");
      setBottomTab("errors");
    }
  };
  const previewAi = (json: string, configJson?: string): boolean => {
    const nextConfiguration = configJson ?? configuration;
    if (!run(json, nextConfiguration)) return false;
    specificationHistory.current.commit(json);
    setSpecification(json);
    if (configJson) setConfiguration(configJson);
    appendLog(
      "Validated AI result promoted to the working JSON and preview together.",
      "success",
    );
    return true;
  };
  const updateCalculations = (calculations: CalculationSpecification) => {
    const parsed = parseJson(specification);
    if (parsed.value && typeof parsed.value === "object")
      setSpecification(
        JSON.stringify({ ...(parsed.value as object), calculations }, null, 2),
      );
  };
  const parsedConfig = parseConfig(configuration).config;
  const changeConfig = (config: HyperPbiConfig) =>
    setConfiguration(JSON.stringify(config, null, 2));
  const showBottom =
    (layout.advanced && layout.bottomOpen) ||
    (!layout.advanced && issueCount > 0);
  const authoringTree = useMemo(() => {
    try {
      return componentTree(JSON.parse(specification));
    } catch {
      return [];
    }
  }, [specification]);
  const selectedMeta = authoringTree.find(
    (item) => item.id === selectedComponentId,
  );
  const studioDomId = instanceId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const authoredVersion = useMemo(() => {
    try {
      return String(
        (JSON.parse(specification) as { version?: unknown }).version ??
          "unknown",
      );
    } catch {
      return "invalid";
    }
  }, [specification]);
  const inspectPreviewClick = (event: MouseEvent) => {
    if (!inspectorMode) return;
    event.preventDefault();
    event.stopPropagation();
    const element = (event.target as HTMLElement | null)?.closest?.(
      "[data-hp-id]",
    ) as HTMLElement | null;
    if (!element) return;
    const owner = element.dataset.hpOwnerId;
    const runtimeId = element.dataset.hpId ?? "";
    setSelectedRuntimeComponentId(runtimeId);
    setSelectedComponentId(
      owner && authoringTree.some((item) => item.id === owner)
        ? owner
        : runtimeId,
    );
    setEditorTab("inspector");
  };
  const persistLayout = (next: StudioLayoutPreference) => {
    setLayout(next);
    onLayoutChange?.(JSON.stringify(next));
  };
  const clampEditorPercent = (value: number) =>
    Math.min(75, Math.max(25, value));
  const mainResizeKeyDown = (
    event: preact.JSX.TargetedKeyboardEvent<HTMLDivElement>,
  ) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 2
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -2
          : 0;
    if (!delta && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const editorPercent =
      event.key === "Home"
        ? 25
        : event.key === "End"
          ? 75
          : clampEditorPercent(layout.editorPercent + delta);
    persistLayout({ ...layout, editorPercent });
  };
  const studioHeight = () =>
    workbenchRef.current?.closest<HTMLElement>(".hp-studio")?.clientHeight ??
    window.innerHeight;
  const maxBottomHeight = () =>
    Math.min(520, Math.max(120, studioHeight() * 0.55));
  const bottomResizeKeyDown = (
    event: preact.JSX.TargetedKeyboardEvent<HTMLDivElement>,
  ) => {
    const delta =
      event.key === "ArrowUp"
        ? 16
        : event.key === "ArrowDown"
          ? -16
          : 0;
    if (!delta && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const bottomHeight =
      event.key === "Home"
        ? 120
        : event.key === "End"
          ? maxBottomHeight()
          : Math.min(
              maxBottomHeight(),
              Math.max(120, layout.bottomHeight + delta),
            );
    persistLayout({ ...layout, bottomHeight });
  };
  const startMainResize = (
    event: preact.JSX.TargetedPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    const host = workbenchRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const vertical =
      settings.editor.previewPosition === "bottom" || rect.width < 900;
    const move = (pointer: PointerEvent) => {
      const raw = vertical
        ? ((pointer.clientY - rect.top) / rect.height) * 100
        : ((pointer.clientX - rect.left) / rect.width) * 100;
      setLayout((current) => ({
        ...current,
        editorPercent: clampEditorPercent(raw),
      }));
    };
    activePointerCleanupRef.current?.();
    const cleanup = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      if (activePointerCleanupRef.current === cleanup)
        activePointerCleanupRef.current = null;
    };
    const up = () => {
      cleanup();
      setLayout((current) => {
        onLayoutChange?.(JSON.stringify(current));
        return current;
      });
    };
    activePointerCleanupRef.current = cleanup;
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };
  const startBottomResize = (
    event: preact.JSX.TargetedPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    const startY = event.clientY;
    const maxHeight = maxBottomHeight();
    const startHeight = Math.min(layout.bottomHeight, maxHeight);
    const move = (pointer: PointerEvent) =>
      setLayout((current) => ({
        ...current,
        bottomHeight: Math.min(
          maxHeight,
          Math.max(120, startHeight + (startY - pointer.clientY)),
        ),
      }));
    activePointerCleanupRef.current?.();
    const cleanup = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      if (activePointerCleanupRef.current === cleanup)
        activePointerCleanupRef.current = null;
    };
    const up = () => {
      cleanup();
      setLayout((current) => {
        onLayoutChange?.(JSON.stringify(current));
        return current;
      });
    };
    activePointerCleanupRef.current = cleanup;
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };
  const bottomOutput = () => {
    if (bottomTab === "data")
      return JSON.stringify((preview?.data ?? data).rows, null, 2);
    if (bottomTab === "fields")
      return JSON.stringify((preview?.data ?? data).fields, null, 2);
    if (bottomTab === "logs")
      return logs
        .map(
          (log) =>
            `${log.timestamp ?? ""} ${log.level.toUpperCase()} ${log.message}`,
        )
        .join("\n");
    if (bottomTab === "errors")
      return [...visibleErrors, ...visibleWarnings].join("\n") ||
        "No validation issues.";
    if (bottomTab === "geocode") return JSON.stringify(geocodeResults, null, 2);
    if (bottomTab === "mapServices")
      return JSON.stringify(parsedConfig?.providers ?? {}, null, 2);
    return JSON.stringify(interactionDiagnostics, null, 2);
  };
  const copyBottom = async () => {
    const copied = await copyText(bottomOutput());
    appendLog(
      copied
        ? `Copied ${bottomTab} output.`
        : `Copy was blocked by the Power BI host.`,
      copied ? "success" : "error",
    );
  };
  const toggleAdvanced = () => {
    const next = { ...layout, advanced: !layout.advanced };
    persistLayout(next);
    if (layout.advanced) setEditorTab("ai");
  };
  const bottomTabs: Array<[BottomTab, string]> = layout.advanced
    ? [
        ["data", "Data"],
        ["fields", "Fields"],
        ["logs", "Logs"],
        ["errors", `Issues ${issueCount || ""}`],
        ["mapServices", "Map Services"],
        ["geocode", `Geocode ${geocodeResults.length || ""}`],
        ["interactions", "Interactions"],
      ]
    : [
        ["data", "Data preview"],
        ["fields", "Fields"],
        ["errors", `Issues ${issueCount || ""}`],
      ];
  const bottomTabKeyDown = (
    event: preact.JSX.TargetedKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
      return;
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? bottomTabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) +
              bottomTabs.length) %
            bottomTabs.length;
    const tablist = event.currentTarget.parentElement;
    setBottomTab(bottomTabs[nextIndex][0]);
    requestAnimationFrame(() => {
      const tabs = Array.from(
        tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
      );
      tabs[nextIndex]?.focus();
    });
  };
  return (
    <div
      class={`hp-studio hp-studio-${settings.theme.mode} hp-preview-${settings.editor.previewPosition} ${layout.advanced ? "hp-studio-advanced" : "hp-studio-simple"}`}
    >
      <header class="hp-studio-header">
        <div class="hp-header-left">
          <div class="hp-studio-brand">
            <span class="hp-studio-mark" aria-hidden="true">H</span>
            <div class="hp-studio-brand-copy">
              <strong>HyperPBI</strong>
              <small>Dashboard Builder</small>
            </div>
            <StudioStatusChip
              tone={
                status === "Invalid"
                  ? "invalid"
                  : status === "Unsaved" || status === "Not previewed"
                    ? "warning"
                    : status === "Ready"
                      ? "valid"
                      : "neutral"
              }
              announce
            >
              {status}
            </StudioStatusChip>
          </div>
        </div>
        <div class="hp-studio-actions">
          <StudioButton
            variant="ghost"
            class="hp-advanced-toggle"
            aria-pressed={layout.advanced}
            onClick={toggleAdvanced}
          >
            <span class="hp-studio-wide-label">
              {layout.advanced ? "Guided mode" : "Advanced controls"}
            </span>
            <span class="hp-studio-short-label">
              {layout.advanced ? "Guided" : "Advanced"}
            </span>
          </StudioButton>
          {issueCount > 0 && (
            <StudioButton
              variant="compact"
              class="hp-studio-issues-action"
              aria-label={`${issueCount} validation ${issueCount === 1 ? "issue" : "issues"}; open diagnostics`}
              onClick={() => {
                setBottomTab("errors");
                persistLayout({ ...layout, bottomOpen: true });
              }}
            >
              {issueCount} {issueCount === 1 ? "issue" : "issues"}
            </StudioButton>
          )}
          <details class="hp-studio-action-overflow">
            <summary aria-label="More Builder actions">More</summary>
            <div>
              {layout.advanced && (
                <>
                  <button type="button" onClick={formatActive}>
                    Format current JSON
                  </button>
                  <button type="button" onClick={() => validate()}>
                    Validate without previewing
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      persistLayout({
                        ...layout,
                        bottomOpen: !layout.bottomOpen,
                      })
                    }
                  >
                    {layout.bottomOpen
                      ? "Hide diagnostics"
                      : "Show diagnostics"}
                  </button>
                </>
              )}
              <button type="button" onClick={() => setEditorTab("help")}>
                Open documentation
              </button>
            </div>
          </details>
          <StudioButton
            variant="secondary"
            class="hp-run-button"
            aria-label="Preview changes"
            onClick={() => run()}
          >
            <span class="hp-studio-action-label">Preview changes</span>
            <span class="hp-studio-compact-label" aria-hidden="true">Preview</span>
          </StudioButton>
          <StudioButton
            variant="primary"
            class={`hp-save-return ${previewCurrent ? "is-ready" : ""}`}
            aria-label="Save & return"
            disabled={!layout.advanced && !previewCurrent}
            onClick={save}
          >
            <span class="hp-studio-action-label">Save & return</span>
            <span class="hp-studio-compact-label" aria-hidden="true">Save</span>
          </StudioButton>
        </div>
      </header>
      <div class="hp-studio-navigation-row">
        <StudioWorkspaceNav value={editorTab} advanced={layout.advanced} onChange={setEditorTab} />
        {settings.editor.previewPosition !== "hidden" && (
          <div
            class="hp-studio-focus-actions"
            role="group"
            aria-label="Workbench view"
          >
            <StudioButton
              variant="compact"
              aria-pressed={focusMode === "both"}
              onClick={() => setFocusMode("both")}
            >
              Split
            </StudioButton>
            <StudioButton
              variant="compact"
              aria-pressed={focusMode === "editor"}
              onClick={() => setFocusMode("editor")}
            >
              Editor
            </StudioButton>
            <StudioButton
              variant="compact"
              aria-pressed={focusMode === "preview"}
              onClick={() => setFocusMode("preview")}
            >
              Preview
            </StudioButton>
          </div>
        )}
      </div>
      <div
        ref={workbenchRef}
        class={`hp-studio-workbench is-focus-${focusMode}`}
        style={{ "--hp-editor-size": `${layout.editorPercent}%` }}
      >
        <section class="hp-studio-editor-pane">
          {editorTab === "specification" && (
            <CodeEditor
              value={specification}
              onChange={setSpecification}
              theme={settings.theme.mode}
              fontSize={settings.editor.fontSize}
              wordWrap={settings.editor.wordWrap}
              ariaLabel="HyperPBI specification JSON"
            />
          )}
          {editorTab === "inspector" && (
            <SpecificationInspector
              json={specification}
              data={data}
              prepared={preparedAuthoring}
              validateCandidate={validateCandidate}
              aliasOverrides={parsedConfig?.fields?.aliases}
              selectedComponentId={selectedComponentId}
              generatedRuntimeId={selectedRuntimeComponentId}
              history={specificationHistory.current}
              onOpenMapStudio={() => setEditorTab("mapStudio")}
              onSelect={(id) => {
                setSelectedComponentId(id);
                setSelectedRuntimeComponentId("");
              }}
              onChange={(next) => {
                setSpecification(next);
                run(next, configuration);
              }}
            />
          )}
          {editorTab === "mapStudio" && (
            <MapStudio
              json={specification}
              data={data}
              prepared={preparedAuthoring}
              validateCandidate={validateCandidate}
              aliasOverrides={parsedConfig?.fields?.aliases}
              selectedComponentId={selectedComponentId}
              liveViewport={
                mapViewports[
                  mapIdForSelection(selectedComponentId, authoringTree)
                ]
              }
              history={specificationHistory.current}
              webAccessAvailable={webAccessAvailable}
              providerAccess={providerAccess}
              onSelect={(id) => {
                setSelectedComponentId(id);
                setSelectedRuntimeComponentId("");
              }}
              onChange={(next) => {
                setSpecification(next);
                run(next, configuration);
              }}
            />
          )}
          {editorTab === "config" && (
            <RuntimeConfigTab
              data={data}
              configuration={configuration}
              onChange={setConfiguration}
              theme={settings.theme.mode}
              fontSize={settings.editor.fontSize}
              wordWrap={settings.editor.wordWrap}
            />
          )}{" "}
          {editorTab === "settings" && (
            <StudioSettings
              data={data}
              configuration={configuration}
              onChange={setConfiguration}
            />
          )}{" "}
          {editorTab === "ai" && (
            <AiPromptTab
              data={data}
              currentSpecification={specification}
              configuration={configuration}
              onConfigurationChange={setConfiguration}
              onPreview={previewAi}
              previewReady={previewCurrent}
              diagnostics={interactionDiagnostics}
              selectedComponentId={selectedComponentId}
              selectedComponentType={selectedMeta?.type}
              selectedComponentTitle={selectedMeta?.title}
              selectedComponentPath={selectedMeta?.path}
            />
          )}{" "}
          {editorTab === "skill" && <SkillTab data={data} />}{" "}
          {editorTab === "calculations" && (
            <CalculationsTab
              data={data}
              schema={structure.schema}
              onChange={updateCalculations}
              theme={settings.theme.mode}
              fontSize={settings.editor.fontSize}
              wordWrap={settings.editor.wordWrap}
            />
          )}{" "}
          {editorTab === "mapServices" && parsedConfig && (
            <MapServicesPanel
              data={data}
              config={parsedConfig}
              onChange={changeConfig}
              onResults={(results) =>
                setGeocodeResults((current) =>
                  results.length > 1
                    ? results
                    : [...current.slice(-199), ...results],
                )
              }
              onLog={appendLog}
              webAccessAvailable={webAccessAvailable}
              providerAccess={providerAccess}
            />
          )}{" "}
          {editorTab === "interactions" && (
            <InteractionsPanel diagnostics={interactionDiagnostics} />
          )}{" "}
          {editorTab === "help" && <HelpDocsPanel />}
        </section>
        {settings.editor.previewPosition !== "hidden" && (
          <>
            <div
              class="hp-main-resize-handle"
              role="separator"
              aria-label="Resize builder and preview"
              aria-orientation={workbenchStacked ? "horizontal" : "vertical"}
              aria-valuemin={25}
              aria-valuemax={75}
              aria-valuenow={Math.round(layout.editorPercent)}
              aria-valuetext={`${Math.round(layout.editorPercent)}% editor`}
              tabIndex={0}
              onPointerDown={startMainResize}
              onKeyDown={mainResizeKeyDown}
            >
              <span aria-hidden="true" />
            </div>
            <section
              class={`hp-studio-preview ${inspectorMode ? "is-inspecting" : ""}`}
              data-selected-component-id={selectedComponentId}
              onClickCapture={inspectPreviewClick}
              aria-label="Live preview"
            >
              <header class="hp-preview-toolbar">
                <div>
                  <strong>Live preview</strong>
                  <StudioStatusChip
                    tone={
                      previewCurrent ? "valid" : preview ? "warning" : "neutral"
                    }
                    announce
                  >
                    {previewCurrent
                      ? "Preview current"
                      : preview
                        ? "Preview out of date"
                        : "Not previewed"}
                  </StudioStatusChip>
                </div>
                <button
                  type="button"
                  class={`hp-preview-inspect ${inspectorMode ? "is-active" : ""}`}
                  aria-pressed={inspectorMode}
                  disabled={!preview}
                  onClick={(event) => {
                    event.stopPropagation();
                    setInspectorMode((value) => !value);
                  }}
                >
                  {inspectorMode
                    ? "Inspector on (Esc to exit)"
                    : "Inspect preview"}
                </button>
              </header>
              <div class="hp-preview-content">
                {preview ? (
                  <HyperPbiRoot
                    instanceId={`${instanceId}-preview`}
                    schema={preview.schema}
                    data={preview.data}
                    settings={settings}
                    config={preview.config}
                    referenceWarnings={validateReferences(
                      preview.schema,
                      preview.data,
                    )}
                    renderMs={0}
                    selectExternal={selectExternal}
                    clearExternal={clearExternal}
                    applyExternalFilter={applyExternalFilter}
                    clearExternalFilter={clearExternalFilter}
                    reportInteraction={reportInteraction}
                    webAccessAvailable={webAccessAvailable}
                    providerAccess={providerAccess}
                    ownerByRuntimeId={preview.ownerByRuntimeId}
                    componentPathById={preview.componentPathById}
                    onMapViewportChange={(id, viewport) =>
                      setMapViewports((current) => ({
                        ...current,
                        [id]: viewport,
                      }))
                    }
                  />
                ) : (
                  <div class="hp-preview-empty" role="status">
                    <span class="hp-preview-empty-icon" aria-hidden="true">▣</span>
                    <h2>Preview your working dashboard</h2>
                    <p>
                      Preview validates the current draft without changing the
                      saved Power BI visual.
                    </p>
                    <button
                      class="hp-studio-button hp-studio-button-primary hp-preview-validate"
                      type="button"
                      onClick={() => run()}
                    >
                      Preview changes
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
      {showBottom && (
        <section
          class="hp-studio-bottom"
          style={{ height: `${Math.min(layout.bottomHeight, maxBottomHeight())}px` }}
        >
          <div
            class="hp-bottom-resize-handle"
            role="separator"
            aria-label="Resize diagnostics panel"
            aria-orientation="horizontal"
            aria-valuemin={120}
            aria-valuemax={Math.round(maxBottomHeight())}
            aria-valuenow={Math.round(
              Math.min(layout.bottomHeight, maxBottomHeight()),
            )}
            aria-valuetext={`${Math.round(
              Math.min(layout.bottomHeight, maxBottomHeight()),
            )} pixels high`}
            tabIndex={0}
            onPointerDown={startBottomResize}
            onKeyDown={bottomResizeKeyDown}
          >
            <span aria-hidden="true" />
          </div>
          <nav class="hp-bottom-toolbar" aria-label="Diagnostics panel">
            <div class="hp-bottom-tabs" role="tablist" aria-label="Diagnostics">
              {bottomTabs.map(([id, label], index) => (
                <button
                  id={`${studioDomId}-diagnostics-tab-${id}`}
                  class={bottomTab === id ? "active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={bottomTab === id}
                  aria-controls={`${studioDomId}-diagnostics-panel-${id}`}
                  tabIndex={bottomTab === id ? 0 : -1}
                  onClick={() => setBottomTab(id)}
                  onKeyDown={(event) => bottomTabKeyDown(event, index)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div class="hp-bottom-actions">
              <button type="button" onClick={() => void copyBottom()}>
                Copy
              </button>
              <button
                type="button"
                aria-label="Close diagnostics"
                onClick={() => persistLayout({ ...layout, bottomOpen: false })}
              >
                Close
              </button>
            </div>
          </nav>
          <div
            id={`${studioDomId}-diagnostics-panel-${bottomTab}`}
            class="hp-bottom-content"
            role="tabpanel"
            aria-labelledby={`${studioDomId}-diagnostics-tab-${bottomTab}`}
            tabIndex={0}
          >
            {bottomTab === "data" && (
              <DataPreview data={preview?.data ?? data} />
            )}{" "}
            {bottomTab === "fields" && (
              <FieldsPanel data={preview?.data ?? data} />
            )}{" "}
            {bottomTab === "logs" && (
              <div class="hp-log-view">
                {logs.map((log) => (
                  <div class={`hp-log-${log.level}`}>
                    <span>{log.level.toUpperCase()}</span>
                    <time>{log.timestamp?.slice(11, 19)}</time>
                    <div>{log.message}</div>
                  </div>
                ))}
              </div>
            )}{" "}
            {bottomTab === "errors" && (
              <div
                class="hp-errors-panel"
                role={visibleErrors.length ? "alert" : "status"}
                aria-live="polite"
              >
                <header>
                  <div>
                    <strong>Validation issues</strong>
                    <span>
                      {visibleErrors.length} errors · {visibleWarnings.length}{" "}
                      warnings
                    </span>
                  </div>
                  <button type="button" onClick={() => void copyBottom()}>
                    Copy issues
                  </button>
                </header>
                {issueCount ? (
                  <div class="hp-issue-groups">
                    {visibleErrors.length > 0 && (
                      <section class="hp-issue-group is-error">
                        <h3>
                          Errors <span>{visibleErrors.length}</span>
                        </h3>
                        <ul>
                          {visibleErrors.map((error) => (
                            <li>{error}</li>
                          ))}
                        </ul>
                      </section>
                    )}
                    {visibleWarnings.length > 0 && (
                      <section class="hp-issue-group is-warning">
                        <h3>
                          Warnings <span>{visibleWarnings.length}</span>
                        </h3>
                        <ul>
                          {visibleWarnings.map((warning) => (
                            <li>{warning}</li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                ) : (
                  <div class="hp-ready-state">
                    <span aria-hidden="true">✓</span>
                    <div>
                      <strong>No validation issues</strong>
                      <p>The current draft is ready to preview or save.</p>
                    </div>
                  </div>
                )}
              </div>
            )}{" "}
            {bottomTab === "mapServices" && (
              <div class="hp-bottom-summary">
                <strong>{parsedConfig?.providers?.mode ?? "core"} mode</strong>
                <span>
                  Basemap:{" "}
                  {parsedConfig?.providers?.basemap?.provider ?? "none"}
                </span>
                <span>
                  Geocoder:{" "}
                  {parsedConfig?.providers?.geocoder?.provider ?? "none"}
                </span>
              </div>
            )}{" "}
            {bottomTab === "geocode" && (
              geocodeResults.length ? (
                <div class="hp-geocode-table">
                  <table>
                    <caption class="hp-visually-hidden">
                      Geocoding request results
                    </caption>
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th>Status</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Provider</th>
                        <th>Cache</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geocodeResults.map((result) => (
                        <tr>
                          <td>{result.sourceAddress}</td>
                          <td>{result.status}</td>
                          <td>{result.latitude ?? "—"}</td>
                          <td>{result.longitude ?? "—"}</td>
                          <td>{result.provider}</td>
                          <td>{result.cacheHit ? "Yes" : "No"}</td>
                          <td>{result.error ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div class="hp-bottom-empty" role="status">
                  <strong>No geocoding requests yet</strong>
                  <p>Test an address in Map services to see results here.</p>
                </div>
              )
            )}{" "}
            {bottomTab === "interactions" && (
              <InteractionsPanel diagnostics={interactionDiagnostics} />
            )}
          </div>
        </section>
      )}
      <footer class="hp-studio-status" aria-label="Builder status">
        <span class={`hp-studio-status-primary is-${status.toLowerCase().replace(/\s+/g, "-")}`}>
          <span class="hp-studio-status-dot" aria-hidden="true" />
          {status}
          {previewCurrent
            ? " · Preview current"
            : preview
              ? " · Preview out of date"
              : " · Not previewed"}
        </span>
        <span class="hp-studio-data-status">
          {data.rows.length.toLocaleString()} rows
          {data.loadStatus?.moreRowsAvailable ? "+" : ""} ·{" "}
          {Object.keys(data.fields).length} fields
        </span>
        {layout.advanced && (
          <span class="hp-studio-technical-status">
            Schema {authoredVersion} · {selectionIdentityCount.toLocaleString()}{" "}
            selection IDs · Package 1.0.0.0
          </span>
        )}
      </footer>
    </div>
  );
}
