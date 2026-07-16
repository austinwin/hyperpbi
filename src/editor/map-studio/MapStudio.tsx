import { useEffect, useMemo, useReducer, useRef, useState } from "preact/hooks";
import type { NormalizedData, NormalizedField } from "../../data/normalizeData";
import type { DatasetDefinition } from "../../data/datasets";
import type { MapComponent } from "../../schema/hyperpbiSchema";
import type {
  MapLayerDefinition,
  MapLayerSourceType,
  MapRendererDefinition,
} from "../../schema/mapSchema";
import { inspectArcGisService } from "../../maps/arcgis/arcGisServiceInspector";
import {
  componentTree,
  findComponent,
  locateComponent,
  SpecificationHistory,
} from "../inspector/specificationEditor";
import type { PreparedAuthoringData } from "../prepareAuthoringData";
import type { MapViewportState } from "../../components/maps/MapBlock";
import type { ProviderAccessState } from "../../providers/providerTypes";
import { prepareAuthoringData } from "../prepareAuthoringData";
import type {
  ArcGisLayerMetadata,
  ArcGisServiceInspection,
} from "../../maps/arcgis/arcGisServiceTypes";
import { externalServiceAccess } from "../../providers/providerPolicy";
import {
  runMapJoinPreview,
  type MapJoinPreviewResult,
} from "../../maps/join/mapJoinPreview";
import { normalizeJoinKey } from "../../maps/join/mapJoinNormalizer";
import type { MapAttributeSource } from "../../maps/attributes/mapFeatureAttributes";
import { parseArcGisUrl } from "../../maps/arcgis/arcGisUrl";
import { collectArcGisQueryFields } from "../../maps/arcgis/mapArcGisQueryFields";
import { appendJsonPointer } from "../../schema/jsonPointer";
import { MapDiagnosticsPanel } from "./MapDiagnosticsPanel";
import { DraftInput } from "./MapDraftInput";
import { FieldSelect } from "./MapFieldSelect";
import { StudioButton } from "../ui/StudioButton";
import { StudioCheckbox } from "../ui/StudioCheckbox";
import { StudioStatusChip } from "../ui/StudioStatusChip";
import {
  mapLayerCapabilityExplanation,
  resolveMapLayerCapabilities,
} from "../../maps/model/mapLayerCapabilities";
import {
  createMapStudioDraftState,
  mapStudioDraftReducer,
} from "./mapStudioDraftState";

type Json = Record<string, unknown>;
type PropertyTab =
  | "source"
  | "renderer"
  | "labels"
  | "popup"
  | "tooltip"
  | "join"
  | "visibility"
  | "interaction"
  | "performance"
  | "diagnostics";
type PropertyGroup = "Data" | "Appearance" | "Interaction" | "Advanced";
const propertyTabs: readonly { id: PropertyTab; label: string; group: PropertyGroup }[] = [
  { id: "source", label: "Source", group: "Data" },
  { id: "join", label: "Join", group: "Data" },
  { id: "renderer", label: "Renderer", group: "Appearance" },
  { id: "labels", label: "Labels", group: "Appearance" },
  { id: "tooltip", label: "Tooltip", group: "Appearance" },
  { id: "popup", label: "Feature details", group: "Interaction" },
  { id: "visibility", label: "Visibility", group: "Interaction" },
  { id: "interaction", label: "Interactions", group: "Interaction" },
  { id: "performance", label: "Performance", group: "Advanced" },
  { id: "diagnostics", label: "Diagnostics", group: "Advanced" },
];
const propertyGroups: readonly PropertyGroup[] = ["Data", "Appearance", "Interaction", "Advanced"];

function propertyTabSupported(
  tab: PropertyTab,
  sourceType: MapLayerSourceType,
): boolean {
  const capability = resolveMapLayerCapabilities(sourceType);
  if (tab === "join") return capability.join;
  if (tab === "renderer" || tab === "labels")
    return sourceType === "powerbi" || sourceType === "arcgisFeature";
  if (tab === "popup") return capability.popup;
  if (tab === "tooltip") return capability.tooltip;
  if (tab === "interaction") return capability.selection;
  return true;
}
const object = (value: unknown): value is Json =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const locationKeys = [
  "geometry",
  "latitude",
  "longitude",
  "x",
  "y",
  "address",
  "city",
  "state",
  "zip",
] as const;

export interface MapStudioProps {
  json: string;
  data: NormalizedData;
  aliasOverrides?: Record<string, string>;
  selectedComponentId?: string;
  onSelect?: (componentId: string) => void;
  onChange: (json: string) => void;
  history?: SpecificationHistory;
  prepared?: PreparedAuthoringData;
  liveViewport?: MapViewportState;
  webAccessAvailable?: boolean;
  providerAccess?: ProviderAccessState;
  configurationJson?: string;
  validateCandidate?: (candidateSpecificationJson: string) => PreparedAuthoringData;
}

export function MapStudio({
  json,
  data,
  aliasOverrides = {},
  selectedComponentId = "",
  onSelect = () => undefined,
  onChange,
  history: sharedHistory,
  prepared: sharedPrepared,
  liveViewport,
  webAccessAvailable = false,
  providerAccess,
  configurationJson,
  validateCandidate,
}: MapStudioProps) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(json) as Json;
    } catch {
      return undefined;
    }
  }, [json]);
  const maps = useMemo(
    () => componentTree(parsed).filter((item) => item.type === "map"),
    [parsed],
  );
  const mapId = maps.some((item) => item.id === selectedComponentId)
    ? selectedComponentId
    : (maps[0]?.id ?? "");
  const map =
    parsed && mapId
      ? (findComponent(parsed, mapId) as unknown as MapComponent | undefined)
      : undefined;
  const selectedMapPath = maps.find((item) => item.id === mapId)?.path ?? "";
  const [draftState, draftDispatch] = useReducer(
    mapStudioDraftReducer,
    createMapStudioDraftState(mapId),
  );
  const selectedLayerId = draftState.activeLayerId;
  const setSelectedLayerId = (layerId: string) =>
    draftDispatch({ type: "activateLayer", layerId });
  const propertyTab = draftState.activeSection as PropertyTab;
  const setPropertyTab = (section: PropertyTab) =>
    draftDispatch({ type: "activateSection", section });
  const [mobilePane, setMobilePane] = useState<"layers" | "properties">(
    "layers",
  );
  const [candidateErrors, setCandidateErrors] = useState<string[]>([]);
  const [candidateWarnings, setCandidateWarnings] = useState<string[]>([]);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState("");
  const [dragging, setDragging] = useState("");
  const [metadata, setMetadata] = useState<{
    loading?: boolean;
    result?: ArcGisServiceInspection;
    sourceUrl?: string;
    errors?: string[];
  }>({});
  const metadataCache = useRef(new Map<string, ArcGisServiceInspection>());
  const addMenuRef = useRef<HTMLDivElement>(null);
  const metadataRequest = useRef<{
    version: number;
    controller?: AbortController;
  }>({ version: 0 });
  const [joinPreview, setJoinPreview] = useState<{
    loading?: boolean;
    result?: MapJoinPreviewResult;
    error?: string;
  }>({});
  const joinPreviewRequest = useRef<{
    version: number;
    controller?: AbortController;
  }>({ version: 0 });
  const [revision, setRevision] = useState(0);
  const localHistory = useRef(new SpecificationHistory(json));
  const history = sharedHistory ?? localHistory.current;

  useEffect(() => {
    if (history.value !== json) history.reset(json);
  }, [json, history]);
  useEffect(() => {
    draftDispatch({ type: "activateMap", mapId });
    if (!mapId) return;
    if (selectedComponentId !== mapId) onSelect(mapId);
  }, [mapId]);
  useEffect(() => {
    const layerIds = map?.layers?.map((layer) => layer.id) ?? [];
    if (
      selectedLayerId !== "__basemap__" &&
      !layerIds.includes(selectedLayerId)
    )
      setSelectedLayerId(layerIds[0] ?? "__basemap__");
    setPendingDelete("");
  }, [mapId, json]);
  useEffect(() => {
    if (!addMenuOpen) return;
    const dismiss = (event: MouseEvent) => {
      if (!addMenuRef.current?.contains(event.target as Node)) setAddMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddMenuOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [addMenuOpen]);

  const datasetDefinitions = useMemo(
    () =>
      object(parsed?.data) && object(parsed.data.datasets)
        ? (parsed.data.datasets as unknown as Record<string, DatasetDefinition>)
        : {},
    [parsed],
  );
  const fallbackPrepared = useMemo(
    () =>
      configurationJson
        ? prepareAuthoringData(json, configurationJson, data)
        : ({
            aliases: aliasOverrides,
            diagnostics: [],
            errors: [
              "Map Studio requires configurationJson or validateCandidate for standalone use.",
            ],
            warnings: [],
          } satisfies PreparedAuthoringData),
    [json, configurationJson, data, aliasOverrides],
  );
  const prepared = sharedPrepared ?? fallbackPrepared;
  const layer = map?.layers?.find(
    (candidate) => candidate.id === selectedLayerId,
  );
  const selectedLayerIndex = map?.layers?.findIndex(
    (candidate) => candidate.id === selectedLayerId,
  ) ?? -1;
  const capabilityExplanation = layer
    ? mapLayerCapabilityExplanation(layer.source.type)
    : undefined;
  useEffect(() => {
    if (!layer || propertyTabSupported(propertyTab, layer.source.type)) return;
    setPropertyTab("source");
  }, [layer?.source.type, propertyTab]);
  const selectedLayerPath = selectedLayerIndex >= 0
    ? appendJsonPointer(selectedMapPath, "layers", selectedLayerIndex)
    : "";
  const layerUrl =
    layer && layer.source.type !== "powerbi" ? layer.source.url : undefined;
  const selectedMetadataKey = layerUrl
    ? arcGisMetadataKey(
        layerUrl,
        layer?.source.type === "arcgisFeature"
          ? layer.source.layerId
          : undefined,
      )
    : undefined;
  useEffect(() => {
    const cached = selectedMetadataKey
      ? metadataCache.current.get(selectedMetadataKey)
      : undefined;
    if (
      metadata.loading &&
      metadata.sourceUrl &&
      selectedMetadataKey === arcGisMetadataKey(metadata.sourceUrl)
    )
      return;
    if (cached) {
      metadataRequest.current.controller?.abort();
      setMetadata({ sourceUrl: layerUrl, result: cached, errors: cached.errors });
      return;
    }
    const currentRoot = metadata.result?.url
      ? parseArcGisUrl(metadata.result.url).serviceRootUrl ??
        parseArcGisUrl(metadata.result.url).normalizedUrl
      : undefined;
    const requestedRoot = layerUrl
      ? parseArcGisUrl(layerUrl).serviceRootUrl ?? parseArcGisUrl(layerUrl).normalizedUrl
      : undefined;
    if (metadata.result && currentRoot === requestedRoot) return;
    metadataRequest.current.controller?.abort();
    setMetadata({});
  }, [selectedMetadataKey]);
  useEffect(
    () => () => {
      metadataRequest.current.controller?.abort();
      joinPreviewRequest.current.controller?.abort();
    },
    [],
  );
  const effectiveDataset = layer?.dataset ?? map?.dataset ?? "powerbi";
  const dataset = prepared.datasets?.get(effectiveDataset);
  const fields = Object.values(dataset?.data.fields ?? {}).map((field) => ({
    ...field,
    displayName: prepared.aliases[field.key] ?? field.displayName,
  }));
  const rows = (dataset?.data.rows ?? []) as Json[];
  const serviceMetadata: ArcGisLayerMetadata | undefined =
    metadata.result?.selectedLayer ??
    metadata.result?.layers.find(
      (item) =>
        item.id ===
        (layer?.source.type === "arcgisFeature"
          ? layer.source.layerId
          : undefined),
    )?.metadata ??
    (metadata.result?.layers.length === 1
      ? metadata.result.layers[0].metadata
      : undefined);
  const fieldSets: Record<MapAttributeSource, NormalizedField[]> = {
    powerbi: fields,
    service: (serviceMetadata?.fields ?? []).map(serviceField),
    joined: (layer?.join?.aggregations ?? []).map((item) => ({
      key: item.as,
      displayName: item.as,
      type: "measure",
      roles: [],
      dataType:
        item.aggregation === "first" || item.aggregation === "last"
          ? "unknown"
          : "number",
    })),
  };
  const externalFieldWarnings = mapStudioExternalFieldWarnings(
    layer,
    serviceMetadata,
  );
  const visibleWarnings = Array.from(
    new Set([...candidateWarnings, ...externalFieldWarnings]),
  );

  const commit = (candidate: Json): boolean => {
    const next = JSON.stringify(candidate, null, 2);
    const validation = validateCandidate
      ? validateCandidate(next)
      : configurationJson
        ? prepareAuthoringData(next, configurationJson, data)
        : ({
            aliases: aliasOverrides,
            diagnostics: [],
            errors: [
              "Map Studio requires configurationJson or validateCandidate before it can commit edits.",
            ],
            warnings: [],
          } satisfies PreparedAuthoringData);
    if (!validation.specification) {
      setCandidateErrors(validation.errors);
      setCandidateWarnings(validation.warnings);
      return false;
    }
    history.commit(next);
    setCandidateErrors([]);
    setCandidateWarnings(validation.warnings);
    setRevision((value) => value + 1);
    onChange(next);
    return true;
  };
  const mutateMap = (mutate: (candidate: MapComponent) => void): boolean => {
    if (!parsed || !mapId) return false;
    const candidate = copy(parsed);
    const found = locateComponent(candidate, mapId);
    if (!found) return false;
    mutate(found.component as unknown as MapComponent);
    return commit(candidate);
  };
  const mutateLayer = (
    mutate: (candidate: MapLayerDefinition) => void,
  ): boolean =>
    mutateMap((candidateMap) => {
      const candidate = candidateMap.layers?.find(
        (item) => item.id === selectedLayerId,
      );
      if (candidate) mutate(candidate);
    });
  const restore = (next: string) => {
    setCandidateErrors([]);
    setCandidateWarnings([]);
    setRevision((value) => value + 1);
    onChange(next);
  };
  void revision;

  if (!parsed)
    return (
      <div class="hp-map-studio hp-map-studio-paused" role="status">
        Map Studio is paused until the specification JSON is valid.
      </div>
    );
  if (!maps.length)
    return (
      <div class="hp-map-studio hp-map-studio-empty">
        <strong>No map component is available.</strong>
        <p>Add a map through the Visual Inspector, then open it here.</p>
      </div>
    );
  if (!map) return null;

  const uniqueId = (base: string, extra: string[] = []) => {
    const used = new Set([
      ...(map.layers ?? []).map((item) => item.id),
      ...(map.layerGroups ?? []).map((item) => item.id),
      ...extra,
    ]);
    let result = base,
      index = 2;
    while (used.has(result)) result = `${base}-${index++}`;
    return result;
  };
  const addLayer = (type: MapLayerSourceType) => {
    const id = uniqueId(
      type === "powerbi"
        ? "powerbi-layer"
        : type === "arcgisFeature"
          ? "arcgis-feature"
          : type === "arcgisTile"
            ? "arcgis-tile"
            : "arcgis-dynamic",
    );
    const source =
      type === "powerbi" ? { type, bindings: {} } : { type, url: "" };
    if (
      mutateMap((candidate) => {
        candidate.layers = [
          ...(candidate.layers ?? []),
          {
            id,
            name:
              type === "powerbi"
                ? "Power BI layer"
                : type === "arcgisFeature"
                  ? "ArcGIS feature layer"
                  : type === "arcgisTile"
                    ? "ArcGIS tile layer"
                    : "ArcGIS dynamic layer",
            source,
          } as MapLayerDefinition,
        ];
      })
    ) {
      setSelectedLayerId(id);
      setMobilePane("properties");
      setPropertyTab("source");
    }
  };
  const addGroup = () =>
    mutateMap((candidate) => {
      const id = uniqueId("layer-group");
      candidate.layerGroups = [
        ...(candidate.layerGroups ?? []),
        {
          id,
          name: "Layer group",
          order: candidate.layerGroups?.length ?? 0,
        },
      ];
    });
  const moveLayer = (id: string, direction: -1 | 1) =>
    mutateMap((candidate) => {
      const layers = candidate.layers ?? [];
      const index = layers.findIndex((item) => item.id === id);
      const target = index + direction;
      if (
        index < 0 ||
        target < 0 ||
        target >= layers.length ||
        layers[index].groupId !== layers[target].groupId
      )
        return;
      [layers[index], layers[target]] = [layers[target], layers[index]];
      layers.forEach((item, order) => {
        item.order = order;
      });
    });
  const dropLayer = (targetId: string) =>
    mutateMap((candidate) => {
      if (!dragging || dragging === targetId) return;
      const layers = candidate.layers ?? [];
      const from = layers.findIndex((item) => item.id === dragging),
        to = layers.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0 || layers[from].groupId !== layers[to].groupId)
        return;
      layers.splice(to, 0, layers.splice(from, 1)[0]);
      layers.forEach((item, order) => {
        item.order = order;
      });
      setDragging("");
    });
  const duplicateLayer = () => {
    if (!layer) return;
    const id = uniqueId(`${layer.id}-copy`);
    if (
      mutateMap((candidate) => {
        const index =
          candidate.layers?.findIndex((item) => item.id === layer.id) ?? -1;
        candidate.layers?.splice(index + 1, 0, {
          ...copy(layer),
          id,
          name: `${layer.name} copy`,
        });
      })
    )
      setSelectedLayerId(id);
  };
  const deleteLayer = () => {
    if (!layer) return;
    if (pendingDelete !== layer.id) {
      setPendingDelete(layer.id);
      return;
    }
    mutateMap((candidate) => {
      candidate.layers = (candidate.layers ?? []).filter(
        (item) => item.id !== layer.id,
      );
    });
    setSelectedLayerId("");
    setPendingDelete("");
  };
  const inspectService = async (
    targetUrl?: string,
    eagerMetadata?: ArcGisLayerMetadata,
  ) => {
    if (!layer || layer.source.type === "powerbi") return;
    const url = targetUrl ?? layer.source.url;
    if (eagerMetadata)
      setMetadata((previous) => ({
        ...previous,
        result: previous.result
          ? { ...previous.result, selectedLayer: eagerMetadata }
          : previous.result,
      }));
    if (!url) {
      setMetadata({ errors: ["Enter a public ArcGIS REST URL first."] });
      return;
    }
    const access = externalServiceAccess(
      providerAccess,
      url,
      webAccessAvailable,
    );
    if (!access.allowed) {
      setMetadata({
        sourceUrl: url,
        errors: [
          access.reason ?? "Power BI denied access to this ArcGIS service.",
        ],
      });
      return;
    }
    metadataRequest.current.controller?.abort();
    const version = ++metadataRequest.current.version;
    const controller = new AbortController();
    metadataRequest.current.controller = controller;
    setMetadata((previous) => ({
      ...previous,
      loading: true,
      sourceUrl: url,
      errors: undefined,
    }));
    try {
      const result = await inspectArcGisService(url, {
        signal: controller.signal,
      });
      if (
        version !== metadataRequest.current.version ||
        controller.signal.aborted
      )
        return;
      const parsedTarget = parseArcGisUrl(url);
      const rootResult =
        metadata.result && !metadata.result.isLayer ? metadata.result : undefined;
      const combined = result.isLayer && rootResult
        ? {
            ...rootResult,
            selectedLayer: result.selectedLayer,
            querySupported: result.querySupported,
            warnings: [...rootResult.warnings, ...result.warnings],
            errors: result.errors,
          }
        : result;
      metadataCache.current.set(
        arcGisMetadataKey(
          parsedTarget.serviceRootUrl ?? url,
          parsedTarget.isLayer ? parsedTarget.layerId : undefined,
        ),
        combined,
      );
      setMetadata({ sourceUrl: url, result: combined, errors: combined.errors });
    } catch (error) {
      if (
        version !== metadataRequest.current.version ||
        controller.signal.aborted
      )
        return;
      setMetadata((previous) => ({
        ...previous,
        loading: false,
        errors: [error instanceof Error ? error.message : String(error)],
      }));
    }
  };
  const runJoin = async () => {
    if (
      !layer ||
      layer.source.type !== "arcgisFeature" ||
      !layer.join ||
      !dataset
    )
      return;
    const access = externalServiceAccess(
      providerAccess,
      layer.source.url,
      webAccessAvailable,
    );
    if (!access.allowed) {
      setJoinPreview((previous) => ({
        ...previous,
        loading: false,
        error:
          access.reason ?? "Power BI denied access to this ArcGIS service.",
      }));
      return;
    }
    joinPreviewRequest.current.controller?.abort();
    const version = ++joinPreviewRequest.current.version;
    const controller = new AbortController();
    joinPreviewRequest.current.controller = controller;
    setJoinPreview((previous) => ({
      ...previous,
      loading: true,
      error: undefined,
    }));
    try {
      const result = await runMapJoinPreview({
        source: layer.source,
        definition: layer.join,
        rows: dataset.data.rows,
        rowKeys: dataset.data.rowKeys,
        sourceRowIndices: dataset.lineage,
        sourceRowKeys: dataset.lineage.map((indices) =>
          indices.map(
            (index) => prepared.configuredData?.rowKeys[index] ?? String(index),
          ),
        ),
        signal: controller.signal,
      });
      if (
        version !== joinPreviewRequest.current.version ||
        controller.signal.aborted
      )
        return;
      setJoinPreview({ result });
    } catch (error) {
      if (
        version !== joinPreviewRequest.current.version ||
        controller.signal.aborted
      )
        return;
      setJoinPreview((previous) => ({
        ...previous,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const groups = [...(map.layerGroups ?? [])].sort(
    (left, right) => (left.order ?? 0) - (right.order ?? 0),
  );
  const orderedLayers = [...(map.layers ?? [])].sort(
    (left, right) => (left.order ?? 0) - (right.order ?? 0),
  );
  return (
    <div class="hp-studio hp-map-studio" data-mobile-pane={mobilePane}>
      <header class="hp-map-studio-toolbar">
        <div class="hp-map-studio-title">
          <strong>Map Studio</strong>
          <select
            aria-label="Selected map"
            value={mapId}
            onChange={(event) => onSelect(event.currentTarget.value)}
          >
            {maps.map((item) => (
              <option value={item.id}>{item.title ?? item.id}</option>
            ))}
          </select>
        </div>
        <div class="hp-map-studio-actions">
          <StudioButton
            variant="compact"
            disabled={!history.canUndo}
            onClick={() => restore(history.undo())}
          >
            Undo
          </StudioButton>
          <StudioButton
            variant="compact"
            disabled={!history.canRedo}
            onClick={() => restore(history.redo())}
          >
            Redo
          </StudioButton>
          <StudioStatusChip
            tone={prepared.specification ? "valid" : "invalid"}
            announce
          >
            {prepared.specification ? "Canonical JSON valid" : "Invalid"}
          </StudioStatusChip>
          {(candidateErrors.length > 0 || visibleWarnings.length > 0) && (
            <StudioButton
              variant="compact"
              onClick={() => setPropertyTab("diagnostics")}
            >
              {candidateErrors.length + visibleWarnings.length} issues
            </StudioButton>
          )}
        </div>
      </header>
      <div
        class="hp-map-studio-pane-switch"
        role="tablist"
        aria-label="Map Studio pane"
      >
        <button
          role="tab"
          aria-selected={mobilePane === "layers"}
          onClick={() => setMobilePane("layers")}
        >
          Layers
        </button>
        <button
          role="tab"
          aria-selected={mobilePane === "properties"}
          onClick={() => setMobilePane("properties")}
        >
          Properties
        </button>
      </div>
      {candidateErrors.length > 0 && (
        <details class="hp-map-studio-issues is-error" role="alert">
          <summary>
            <strong>{candidateErrors.length} edit issues</strong>
            <span>{candidateErrors[0]}</span>
          </summary>
          <p>Edit not applied; the last valid preview is unchanged.</p>
          <ul>{candidateErrors.slice(0, 12).map((error) => <li>{error}</li>)}</ul>
          <StudioButton variant="compact" onClick={() => setPropertyTab("diagnostics")}>Open diagnostics</StudioButton>
        </details>
      )}
      {candidateErrors.length === 0 && visibleWarnings.length > 0 && (
        <details class="hp-map-studio-issues is-warning">
          <summary><strong>{visibleWarnings.length} warnings</strong><span>{visibleWarnings[0]}</span></summary>
          <ul>{visibleWarnings.slice(0, 12).map((warning) => <li>{warning}</li>)}</ul>
          <StudioButton variant="compact" onClick={() => setPropertyTab("diagnostics")}>Open diagnostics</StudioButton>
        </details>
      )}
      <div class="hp-map-studio-body">
        <aside
          class={`hp-map-studio-layers ${mobilePane === "properties" ? "is-mobile-hidden" : ""}`}
        >
          <StudioButton
            variant="ghost"
            class={selectedLayerId === "__basemap__" ? "is-selected" : ""}
            onClick={() => {
              setSelectedLayerId("__basemap__");
              setMobilePane("properties");
            }}
          >
            Basemap & view
          </StudioButton>
          {groups.map((group, index) => groupTree(group, index))}
          {orderedLayers
            .filter(
              (item) =>
                !item.groupId ||
                !groups.some((group) => group.id === item.groupId),
            )
            .map((item, index, items) =>
              layerTreeRow(item, index, items.length),
            )}
          <div class="hp-map-studio-add" ref={addMenuRef}>
            <StudioButton
              variant="primary"
              aria-haspopup="menu"
              aria-expanded={addMenuOpen}
              onClick={() => setAddMenuOpen((open) => !open)}
            >
              + Add layer
            </StudioButton>
            {addMenuOpen && (
              <div class="hp-map-studio-add-menu" role="menu" aria-label="Add layer">
                {([
                  ["powerbi", "Power BI layer"],
                  ["arcgisFeature", "ArcGIS feature layer"],
                  ["arcgisTile", "ArcGIS tile layer"],
                  ["arcgisDynamic", "ArcGIS dynamic layer"],
                ] as const).map(([type, label]) => (
                  <button role="menuitem" onClick={() => { setAddMenuOpen(false); addLayer(type); }}>{label}</button>
                ))}
                <button role="menuitem" onClick={() => { setAddMenuOpen(false); addGroup(); }}>Layer group</button>
              </div>
            )}
          </div>
        </aside>
        <main
          class={`hp-map-studio-properties ${mobilePane === "layers" ? "is-mobile-hidden" : ""}`}
        >
          {selectedLayerId === "__basemap__" ? (
            <BasemapViewEditor
              map={map}
              mutateMap={mutateMap}
              liveViewport={liveViewport}
            />
          ) : layer ? (
            <>
              <header class="hp-map-layer-editor-heading">
                <DraftInput
                  label="Layer name"
                  value={layer.name}
                  onCommit={(value) =>
                    mutateLayer((candidate) => {
                      candidate.name = value;
                    })
                  }
                />
                <div>
                  <StudioButton variant="secondary" onClick={duplicateLayer}>Duplicate layer</StudioButton>
                  <StudioButton variant="danger" onClick={deleteLayer}>
                    {pendingDelete === layer.id
                      ? "Confirm delete layer"
                      : "Delete layer"}
                  </StudioButton>
                </div>
              </header>
              <label class="hp-map-property-select">
                <span>Property category</span>
                <select value={propertyTab} onChange={(event) => setPropertyTab(event.currentTarget.value as PropertyTab)}>
                  {propertyTabs.map((tab) => (
                    <option
                      value={tab.id}
                      disabled={!propertyTabSupported(tab.id, layer.source.type)}
                    >
                      {tab.label}
                    </option>
                  ))}
                </select>
              </label>
              <div class="hp-map-property-workspace">
                <nav class="hp-map-property-tabs" role="tablist" aria-orientation="vertical" aria-label="Layer properties">
                {propertyGroups.map((group) => (
                  <div class="hp-map-property-group" data-property-group={group.toLowerCase()}>
                    <strong>{group}</strong>
                    {propertyTabs.filter((tab) => tab.group === group).map((tab) => {
                      const supported = propertyTabSupported(tab.id, layer.source.type);
                      return (
                        <button
                          role="tab"
                          aria-selected={propertyTab === tab.id}
                          aria-disabled={!supported}
                          disabled={!supported}
                          title={supported ? undefined : capabilityExplanation}
                          onClick={() => setPropertyTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                ))}
                </nav>
                <section class="hp-map-property-panel" role="tabpanel">
                {capabilityExplanation && (
                  <p class="hp-map-capability-note" role="note">
                    {capabilityExplanation}
                  </p>
                )}
                {propertyTab === "source" && (
                  <SourceEditor
                    layer={layer}
                    fields={fields}
                    datasets={["powerbi", ...Object.keys(datasetDefinitions)]}
                    effectiveDataset={effectiveDataset}
                    rowCount={rows.length}
                    groups={groups}
                    mutate={mutateLayer}
                    inspect={() => void inspectService()}
                    metadata={metadata}
                    serviceMetadata={serviceMetadata}
                  />
                )}
                {propertyTab === "renderer" && (
                  <RendererEditor
                    layer={layer}
                    fields={fields}
                    fieldSets={fieldSets}
                    rows={rows}
                    mutate={mutateLayer}
                  />
                )}
                {propertyTab === "labels" && (
                  <LabelsEditor
                    layer={layer}
                    fieldSets={fieldSets}
                    mutate={mutateLayer}
                  />
                )}
                {propertyTab === "popup" && (
                  <PopupEditor
                    layer={layer}
                    fieldSets={fieldSets}
                    mutate={mutateLayer}
                    section="popup"
                  />
                )}
                {propertyTab === "tooltip" && (
                  <PopupEditor
                    layer={layer}
                    fieldSets={fieldSets}
                    mutate={mutateLayer}
                    section="tooltip"
                  />
                )}
                {propertyTab === "join" && (
                  <JoinEditor
                    layer={layer}
                    fields={fields}
                    rows={rows}
                    mutate={mutateLayer}
                    serviceMetadata={serviceMetadata}
                    preview={joinPreview}
                    runPreview={() => void runJoin()}
                    invalidatePreview={() => setJoinPreview({})}
                  />
                )}
                {propertyTab === "visibility" && (
                  <VisibilityEditor
                    layer={layer}
                    fieldSets={fieldSets}
                    mutate={mutateLayer}
                  />
                )}
                {propertyTab === "interaction" && (
                  <InteractionEditor
                    layer={layer}
                    fieldSets={fieldSets}
                    mutate={mutateLayer}
                  />
                )}
                {propertyTab === "performance" && (
                  <PerformanceEditor layer={layer} mutate={mutateLayer} />
                )}
                {propertyTab === "diagnostics" && (
                  <MapDiagnosticsPanel
                    layer={layer}
                    dataset={effectiveDataset}
                    rows={rows}
                    fields={fields}
                    prepared={prepared}
                    selectedMapPath={selectedMapPath}
                    selectedLayerPath={selectedLayerPath}
                  />
                )}
                </section>
              </div>
            </>
          ) : (
            <div>Select a layer.</div>
          )}
        </main>
      </div>
    </div>
  );

  function groupTree(
    group: NonNullable<MapComponent["layerGroups"]>[number],
    index: number,
  ) {
    const children = orderedLayers.filter((item) => item.groupId === group.id);
    return (
      <section data-group-id={group.id}>
        <header>
          <button
            aria-label={`${group.collapsed ? "Expand" : "Collapse"} ${group.name}`}
            onClick={() =>
              mutateMap((candidate) => {
                const found = candidate.layerGroups?.find(
                  (item) => item.id === group.id,
                );
                if (found) found.collapsed = !found.collapsed;
              })
            }
          >
            {group.collapsed ? "▸" : "▾"}
          </button>
          <input
            type="checkbox"
            aria-label={`Show group ${group.name}`}
            checked={group.visible !== false}
            onChange={(event) =>
              mutateMap((candidate) => {
                const found = candidate.layerGroups?.find(
                  (item) => item.id === group.id,
                );
                if (found) found.visible = event.currentTarget.checked;
              })
            }
          />
          <DraftInput
            ariaLabel={`Group ${index + 1} name`}
            value={group.name}
            onCommit={(value) =>
              mutateMap((candidate) => {
                const found = candidate.layerGroups?.find(
                  (item) => item.id === group.id,
                );
                if (found) found.name = value;
              })
            }
          />
          <input
            aria-label={`Group ${index + 1} opacity`}
            title="Group opacity"
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={group.opacity ?? 1}
            onChange={(event) =>
              mutateMap((candidate) => {
                const found = candidate.layerGroups?.find(
                  (item) => item.id === group.id,
                );
                if (found) found.opacity = Number(event.currentTarget.value);
              })
            }
          />
          <button
            disabled={index === 0}
            aria-label={`Move group ${group.name} up`}
            onClick={() =>
              mutateMap((candidate) => {
                if (!candidate.layerGroups || index === 0) return;
                [
                  candidate.layerGroups[index - 1],
                  candidate.layerGroups[index],
                ] = [
                  candidate.layerGroups[index],
                  candidate.layerGroups[index - 1],
                ];
                candidate.layerGroups.forEach((item, order) => {
                  item.order = order;
                });
              })
            }
          >
            ↑
          </button>
          <button
            aria-label={`Delete group ${group.name}`}
            onClick={() =>
              mutateMap((candidate) => {
                candidate.layerGroups = candidate.layerGroups?.filter(
                  (item) => item.id !== group.id,
                );
                candidate.layers?.forEach((item) => {
                  if (item.groupId === group.id) item.groupId = undefined;
                });
              })
            }
          >
            ×
          </button>
          <span>{children.length}</span>
        </header>
        {!group.collapsed &&
          children.map((item, childIndex) =>
            layerTreeRow(item, childIndex, children.length),
          )}
      </section>
    );
  }

  function layerTreeRow(
    item: MapLayerDefinition,
    index: number,
    count: number,
  ) {
    const selected = selectedLayerId === item.id;
    const sourceLabel: Record<MapLayerSourceType, string> = {
      powerbi: "Power BI",
      arcgisFeature: "ArcGIS Feature",
      arcgisDynamic: "ArcGIS Dynamic",
      arcgisTile: "ArcGIS Tile",
    };
    const authoredIndex = map?.layers?.findIndex(
      (candidate) => candidate.id === item.id,
    ) ?? -1;
    const itemPath = authoredIndex >= 0
      ? appendJsonPointer(selectedMapPath, "layers", authoredIndex)
      : "";
    const itemIssues = itemPath
      ? prepared.diagnostics.filter(
          (diagnostic) =>
            diagnostic.path === itemPath || diagnostic.path.startsWith(`${itemPath}/`),
        )
      : [];
    const errorCount = itemIssues.filter(
      (diagnostic) => diagnostic.severity === "error",
    ).length;
    const warningCount = itemIssues.filter(
      (diagnostic) => diagnostic.severity === "warning",
    ).length;
    const loading = selected && metadata.loading === true;
    const featureCount =
      item.source.type === "powerbi"
        ? `${rows.length.toLocaleString()} features`
        : selected && joinPreview.result
          ? `${joinPreview.result.outputFeatureCount.toLocaleString()} preview features`
          : "Count after preview";
    return (
      <div
        class={`hp-map-studio-layer ${selected ? "is-selected" : ""}`}
        draggable
        onDragStart={() => setDragging(item.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => dropLayer(item.id)}
      >
        <span class="hp-map-layer-drag" aria-hidden="true">⋮⋮</span>
        <StudioCheckbox
          label={<span class="hp-visually-hidden">Show {item.name}</span>}
          checked={item.visible !== false}
          onChange={(visible) => mutateMap((candidate) => {
            const found = candidate.layers?.find((candidateLayer) => candidateLayer.id === item.id);
            if (found) found.visible = visible;
          })}
          className="hp-map-layer-visibility"
        />
        <button
          aria-label={`Select layer ${item.name}`}
          onClick={() => {
            setSelectedLayerId(item.id);
            setMobilePane("properties");
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") moveLayer(item.id, -1);
            if (event.key === "ArrowDown") moveLayer(item.id, 1);
          }}
        >
          <strong title={item.name}>{item.name}</strong>
          <small>
            <span class={`hp-map-source-badge is-${item.source.type === "powerbi" ? "powerbi" : item.join ? "joined" : "service"}`}>
              {item.join?.enabled ? "Joined" : sourceLabel[item.source.type]}
            </span>
            <span title={featureCount}>{featureCount}</span>
          </small>
        </button>
        <span
          class={`hp-map-layer-status ${loading ? "is-loading" : errorCount ? "is-error" : warningCount ? "is-warning" : "is-ready"}`}
          title={
            loading
              ? "Loading source metadata"
              : errorCount
                ? `${errorCount} error${errorCount === 1 ? "" : "s"}`
                : warningCount
                  ? `${warningCount} warning${warningCount === 1 ? "" : "s"}`
                  : "Ready"
          }
          aria-label={loading ? "Loading" : errorCount ? "Error" : warningCount ? "Warning" : "Ready"}
        >
          {loading ? "…" : errorCount ? "!" : warningCount ? "△" : "✓"}
        </span>
        <details class="hp-map-layer-actions">
          <summary aria-label={`Actions for ${item.name}`}>⋯</summary>
          <div>
            <button
              disabled={index === 0}
              aria-label={`Move ${item.name} up`}
              onClick={() => moveLayer(item.id, -1)}
            >
              Move up
            </button>
            <button
              disabled={index === count - 1}
              aria-label={`Move ${item.name} down`}
              onClick={() => moveLayer(item.id, 1)}
            >
              Move down
            </button>
          </div>
        </details>
      </div>
    );
  }
}

function SourceEditor({
  layer,
  fields,
  datasets,
  effectiveDataset,
  rowCount,
  groups,
  mutate,
  inspect,
  metadata,
  serviceMetadata,
}: {
  layer: MapLayerDefinition;
  fields: NormalizedField[];
  datasets: string[];
  effectiveDataset: string;
  rowCount: number;
  groups: NonNullable<MapComponent["layerGroups"]>;
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
  inspect: (targetUrl?: string, eagerMetadata?: ArcGisLayerMetadata) => void;
  metadata: {
    loading?: boolean;
    result?: ArcGisServiceInspection;
    sourceUrl?: string;
    errors?: string[];
  };
  serviceMetadata?: ArcGisLayerMetadata;
}) {
  const source = layer.source as unknown as Json;
  const binding = object(source.bindings) ? source.bindings : {};
  const setBinding = (key: string, value: unknown) =>
    mutate((candidate) => {
      if (candidate.source.type !== "powerbi") return;
      candidate.source.bindings = {
        ...(candidate.source.bindings ?? {}),
        [key]: value || undefined,
      };
    });
  return (
    <div class="hp-map-form-grid">
      <label>
        <span>Effective dataset</span>
        <select
          aria-label="Layer dataset"
          value={effectiveDataset}
          onChange={(event) =>
            mutate((candidate) => {
              candidate.dataset =
                event.currentTarget.value === "powerbi"
                  ? undefined
                  : event.currentTarget.value;
            })
          }
        >
          {datasets.map((name) => (
            <option value={name}>{name}</option>
          ))}
        </select>
      </label>
      <output>
        {rowCount.toLocaleString()} rows · {fields.length} fields · source
        lineage retained
      </output>
      <label>
        <span>Group</span>
        <select
          aria-label="Layer group"
          value={layer.groupId ?? ""}
          onChange={(event) =>
            mutate((candidate) => {
              candidate.groupId = event.currentTarget.value || undefined;
            })
          }
        >
          <option value="">Ungrouped</option>
          {groups.map((group) => (
            <option value={group.id}>{group.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Initial visibility</span>
        <input
          type="checkbox"
          checked={layer.visible !== false}
          onChange={(event) =>
            mutate((candidate) => {
              candidate.visible = event.currentTarget.checked;
            })
          }
        />
      </label>
      <label>
        <span>Opacity</span>
        <input
          type="number"
          min="0"
          max="1"
          step="0.05"
          value={layer.opacity ?? 1}
          onChange={(event) =>
            mutate((candidate) => {
              candidate.opacity = Number(event.currentTarget.value);
            })
          }
        />
      </label>
      {layer.source.type === "powerbi" ? (
        <>
          <fieldset>
            <legend>Location fields</legend>
            {locationKeys.map((key) => (
              <FieldSelect
                label={key}
                value={
                  typeof binding[key] === "string" ? String(binding[key]) : ""
                }
                fields={fields}
                numeric={["latitude", "longitude", "x", "y"].includes(key)}
                onChange={(value) => setBinding(key, value)}
              />
            ))}
          </fieldset>
          <fieldset>
            <legend>Attributes</legend>
            {["layer", "type", "color", "size"].map((key) => (
              <FieldSelect
                label={key}
                value={
                  typeof binding[key] === "string" ? String(binding[key]) : ""
                }
                fields={fields}
                numeric={key === "size"}
                onChange={(value) => setBinding(key, value)}
              />
            ))}
            {["tooltip", "details"].map((key) => (
              <label>
                <span>{key} fields (comma separated)</span>
                <DraftInput
                  value={
                    Array.isArray(binding[key])
                      ? (binding[key] as unknown[]).join(", ")
                      : ""
                  }
                  onCommit={(value) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "powerbi")
                        candidate.source.bindings = {
                          ...(candidate.source.bindings ?? {}),
                          [key]: value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        };
                    })
                  }
                />
              </label>
            ))}
            <label>
              <span>Layer value (optional)</span>
              <DraftInput
                value={layer.source.layerValue ?? ""}
                onCommit={(value) =>
                  mutate((candidate) => {
                    if (candidate.source.type === "powerbi")
                      candidate.source.layerValue = value || undefined;
                  })
                }
              />
            </label>
          </fieldset>
        </>
      ) : (
        <>
          <DraftInput
            label="Public service URL"
            ariaLabel="ArcGIS service URL"
            value={String(source.url ?? "")}
            onCommit={(value) =>
              mutate((candidate) => {
                if (candidate.source.type !== "powerbi")
                  candidate.source.url = value;
              })
            }
          />
          <button onClick={() => inspect()} disabled={metadata.loading}>
            {metadata.loading ? "Inspecting…" : "Fetch service metadata"}
          </button>
          {metadata.result && (
            <output>
              {metadata.result.name ?? metadata.result.serviceType}:{" "}
              {metadata.result.layers.length} layer(s),{" "}
              {metadata.result.querySupported
                ? "query supported"
                : "query unavailable"}
              .
            </output>
          )}
          {metadata.errors?.map((error) => (
            <p role="alert">{error}</p>
          ))}
          {layer.source.type === "arcgisFeature" && (
            <>
              {metadata.result && metadata.result.layers.length > 1 && (
                <label>
                  <span>Service sublayer</span>
                  <select
                    aria-label="Service sublayer"
                    value={layer.source.layerId ?? ""}
                    onChange={(event) => {
                      const selectedId = Number(event.currentTarget.value);
                      const item = metadata.result?.layers.find(
                        (candidate) => candidate.id === selectedId,
                      );
                      if (!item || (item.kind !== undefined && item.kind !== "spatialLayer")) return;
                      mutate((candidate) => {
                        if (candidate.source.type === "arcgisFeature")
                          candidate.source.layerId = selectedId;
                      });
                      inspect(
                        `${metadata.result!.url.replace(/\/$/, "")}/${selectedId}`,
                        item.metadata,
                      );
                    }}
                  >
                    <option value="">Choose a layer</option>
                    <optgroup label="Map layers">
                      {metadata.result.layers
                        .filter((item) => item.kind === "spatialLayer" || item.kind === undefined)
                        .map((item) => (
                          <option value={item.id}>
                            {item.name} · spatial layer
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Groups (navigation only)">
                      {metadata.result.layers
                        .filter((item) => item.kind === "groupLayer")
                        .map((item) => (
                          <option value={item.id} disabled>
                            {item.name} · group layer
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Join-only tables">
                      {metadata.result.layers
                        .filter((item) => item.kind === "table")
                        .map((item) => (
                          <option value={item.id} disabled>
                            {item.name} · nonspatial table
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <small>
                    Spatial layers can render. Group layers are navigation only;
                    nonspatial tables are not renderable geometry sources.
                  </small>
                </label>
              )}
              <label>
                <span>Layer ID</span>
                <input
                  type="number"
                  value={layer.source.layerId ?? ""}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisFeature")
                        candidate.source.layerId = event.currentTarget.value
                          ? Number(event.currentTarget.value)
                          : undefined;
                    })
                  }
                />
              </label>
              <label>
                <span>Mode</span>
                <select
                  value={layer.source.mode ?? "reference"}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisFeature")
                        candidate.source.mode = event.currentTarget.value as
                          "reference" | "join";
                    })
                  }
                >
                  <option value="reference">reference</option>
                  <option value="join">join</option>
                </select>
              </label>
              <DraftInput
                label="Definition expression"
                value={layer.source.definitionExpression ?? ""}
                onCommit={(value) =>
                  mutate((candidate) => {
                    if (candidate.source.type === "arcgisFeature")
                      candidate.source.definitionExpression =
                        value || undefined;
                  })
                }
              />
              <label>
                <span>Out fields</span>
                <select
                  multiple
                  aria-label="Out fields"
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisFeature")
                        candidate.source.outFields = Array.from(
                          event.currentTarget.selectedOptions,
                        ).map((option) => option.value);
                    })
                  }
                >
                  {(serviceMetadata?.fields ?? []).map((field) => (
                    <option
                      value={field.name}
                      selected={
                        Array.isArray(source.outFields) &&
                        source.outFields.includes(field.name)
                      }
                    >
                      {field.alias || field.name} · {field.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Refresh interval minutes</span>
                <input
                  type="number"
                  min="0"
                  value={layer.source.refreshIntervalMinutes ?? ""}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisFeature")
                        candidate.source.refreshIntervalMinutes = event
                          .currentTarget.value
                          ? Number(event.currentTarget.value)
                          : undefined;
                    })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layer.source.useServiceRenderer === true}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisFeature")
                        candidate.source.useServiceRenderer =
                          event.currentTarget.checked;
                    })
                  }
                />{" "}
                Use service renderer
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layer.source.useServiceLabels === true}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisFeature")
                        candidate.source.useServiceLabels =
                          event.currentTarget.checked;
                    })
                  }
                />{" "}
                Use service labels
              </label>
            </>
          )}
          {serviceMetadata && (
            <fieldset class="hp-map-service-metadata">
              <legend>Inspected layer metadata</legend>
              <dl>
                <div>
                  <dt>Name</dt>
                  <dd>{serviceMetadata.name}</dd>
                </div>
                <div>
                  <dt>Geometry</dt>
                  <dd>{serviceMetadata.geometryType ?? "unknown"}</dd>
                </div>
                <div>
                  <dt>Object ID</dt>
                  <dd>{serviceMetadata.objectIdField ?? "unavailable"}</dd>
                </div>
                <div>
                  <dt>Fields</dt>
                  <dd>{serviceMetadata.fields?.length ?? 0}</dd>
                </div>
                <div>
                  <dt>Query</dt>
                  <dd>
                    {serviceMetadata.capabilities
                      ?.toLowerCase()
                      .includes("query")
                      ? "available"
                      : "unavailable"}
                  </dd>
                </div>
                <div>
                  <dt>Max records</dt>
                  <dd>{serviceMetadata.maxRecordCount ?? "unknown"}</dd>
                </div>
                <div>
                  <dt>Spatial reference</dt>
                  <dd>
                    {serviceMetadata.spatialReference?.latestWkid ??
                      serviceMetadata.spatialReference?.wkid ??
                      "unknown"}
                  </dd>
                </div>
                <div>
                  <dt>Renderer</dt>
                  <dd>
                    {serviceMetadata.drawingInfo?.renderer
                      ? "available"
                      : "none"}
                  </dd>
                </div>
                <div>
                  <dt>Labels</dt>
                  <dd>
                    {serviceMetadata.drawingInfo?.labelingInfo?.length
                      ? "available"
                      : "none"}
                  </dd>
                </div>
              </dl>
            </fieldset>
          )}
          {layer.source.type === "arcgisTile" && (
            <>
              <DraftInput
                label="Attribution"
                value={layer.source.attribution ?? ""}
                onCommit={(value) =>
                  mutate((candidate) => {
                    if (candidate.source.type === "arcgisTile")
                      candidate.source.attribution = value || undefined;
                  })
                }
              />
              <label>
                <span>Minimum zoom</span>
                <input
                  type="number"
                  value={layer.source.minZoom ?? ""}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisTile")
                        candidate.source.minZoom = event.currentTarget.value
                          ? Number(event.currentTarget.value)
                          : undefined;
                    })
                  }
                />
              </label>
              <label>
                <span>Maximum zoom</span>
                <input
                  type="number"
                  value={layer.source.maxZoom ?? ""}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisTile")
                        candidate.source.maxZoom = event.currentTarget.value
                          ? Number(event.currentTarget.value)
                          : undefined;
                    })
                  }
                />
              </label>
            </>
          )}
          {layer.source.type === "arcgisDynamic" && (
            <>
              <DraftInput
                label="Layer IDs (comma separated)"
                value={layer.source.layerIds?.join(", ") ?? ""}
                onCommit={(value) =>
                  mutate((candidate) => {
                    if (candidate.source.type === "arcgisDynamic")
                      candidate.source.layerIds = value
                        .split(",")
                        .map(Number)
                        .filter(Number.isFinite);
                  })
                }
              />
              <label>
                <span>Image format</span>
                <select
                  value={layer.source.format ?? "png32"}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisDynamic")
                        candidate.source.format = event.currentTarget
                          .value as "png";
                    })
                  }
                >
                  <option>png</option>
                  <option>png24</option>
                  <option>png32</option>
                  <option>jpg</option>
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layer.source.transparent !== false}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisDynamic")
                        candidate.source.transparent =
                          event.currentTarget.checked;
                    })
                  }
                />{" "}
                Transparent
              </label>
              <label>
                <span>Request debounce milliseconds</span>
                <input
                  type="number"
                  min="0"
                  value={layer.source.debounceMs ?? 250}
                  onChange={(event) =>
                    mutate((candidate) => {
                      if (candidate.source.type === "arcgisDynamic")
                        candidate.source.debounceMs = Number(
                          event.currentTarget.value,
                        );
                    })
                  }
                />
              </label>
              <fieldset>
                <legend>Click identify</legend>
                <label>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={layer.source.identify?.enabled !== false}
                    onChange={(event) =>
                      mutate((candidate) => {
                        if (candidate.source.type === "arcgisDynamic")
                          candidate.source.identify = {
                            ...(candidate.source.identify ?? {}),
                            enabled: event.currentTarget.checked,
                          };
                      })
                    }
                  />{" "}
                  Enable read-only identify
                </label>
                <label>
                  <span>Pixel tolerance</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={layer.source.identify?.tolerance ?? 6}
                    onChange={(event) =>
                      mutate((candidate) => {
                        if (candidate.source.type === "arcgisDynamic")
                          candidate.source.identify = {
                            ...(candidate.source.identify ?? {}),
                            tolerance: Number(event.currentTarget.value),
                          };
                      })
                    }
                  />
                </label>
                <label>
                  <span>Layers to identify</span>
                  <select
                    value={layer.source.identify?.layerOption ?? "visible"}
                    onChange={(event) =>
                      mutate((candidate) => {
                        if (candidate.source.type === "arcgisDynamic")
                          candidate.source.identify = {
                            ...(candidate.source.identify ?? {}),
                            layerOption: event.currentTarget.value as
                              | "visible"
                              | "all"
                              | "top",
                          };
                      })
                    }
                  >
                    <option value="visible">Visible sublayers</option>
                    <option value="top">Top matching sublayer</option>
                    <option value="all">All sublayers</option>
                  </select>
                </label>
                <label>
                  <span>Maximum results</span>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={layer.source.identify?.maxResults ?? 10}
                    onChange={(event) =>
                      mutate((candidate) => {
                        if (candidate.source.type === "arcgisDynamic")
                          candidate.source.identify = {
                            ...(candidate.source.identify ?? {}),
                            maxResults: Number(event.currentTarget.value),
                          };
                      })
                    }
                  />
                </label>
                <small>
                  Results are temporary details only. Dynamic layers do not
                  support Power BI joins or persistent feature selection.
                </small>
              </fieldset>
            </>
          )}
        </>
      )}
    </div>
  );
}

function RendererEditor({
  layer,
  fields,
  fieldSets,
  rows,
  mutate,
}: {
  layer: MapLayerDefinition;
  fields: NormalizedField[];
  fieldSets: Record<MapAttributeSource, NormalizedField[]>;
  rows: Json[];
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
}) {
  const renderer = layer.renderer ?? { type: "simple", symbol: {} };
  const type = renderer.type;
  const defaultSource: MapAttributeSource =
    layer.source.type === "powerbi"
      ? "powerbi"
      : layer.source.type === "arcgisFeature" && layer.source.mode === "join"
        ? "joined"
        : "service";
  const setRenderer = (next: Json) =>
    mutate((candidate) => {
      candidate.renderer = next as unknown as MapRendererDefinition;
    });
  const changeType = (next: MapRendererDefinition["type"]) => {
    const numeric =
      fields.find((field) => field.dataType === "number")?.key ?? "";
    const any = fields[0]?.key ?? "";
    const defaults: Record<string, Json> = {
      service: { type: "service" },
      simple: {
        type: "simple",
        symbol: {
          shape: "circle",
          fillColor: "#2563eb",
          outlineColor: "#1d4ed8",
          radius: 6,
        },
      },
      uniqueValue: {
        type: "uniqueValue",
        field: any,
        fieldSource: defaultSource,
        defaultSymbol: { fillColor: "#64748b", radius: 6 },
      },
      classBreaks: {
        type: "classBreaks",
        field: numeric,
        fieldSource: defaultSource,
        method: "quantile",
        classes: 5,
        colorRamp: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#172554"],
      },
      continuousColor: {
        type: "continuousColor",
        field: numeric,
        fieldSource: defaultSource,
        minColor: "#dbeafe",
        maxColor: "#1d4ed8",
        clamp: true,
      },
      proportionalSize: {
        type: "proportionalSize",
        field: numeric,
        fieldSource: defaultSource,
        minSize: 4,
        maxSize: 24,
        color: "#2563eb",
      },
      heatmap: {
        type: "heatmap",
        weightField: numeric,
        fieldSource: defaultSource,
        radius: 24,
        blur: 18,
        minOpacity: 0.2,
      },
      cluster: {
        type: "cluster",
        radius: 44,
        disableAtZoom: 16,
        showCoverageOnHover: false,
        clusterLabel: "count",
        fieldSource: defaultSource,
      },
      densityGrid: {
        type: "densityGrid",
        statistic: "count",
        cellSizePixels: 40,
        classes: 5,
        colorRamp: ["#dbeafe", "#1d4ed8"],
      },
    };
    setRenderer(defaults[next]);
  };
  const r = renderer as unknown as Json;
  const fieldSource = String(
    r.fieldSource ?? defaultSource,
  ) as MapAttributeSource;
  const selectableFields = fieldSets[fieldSource] ?? [];
  const fieldKey = String(r.field ?? r.weightField ?? r.aggregateField ?? "");
  const numericRequired = [
    "classBreaks",
    "continuousColor",
    "proportionalSize",
    "heatmap",
  ].includes(type);
  const values =
    fieldKey && fieldSource === "powerbi"
      ? Array.from(
          new Set(
            rows
              .map((row) => row[fieldKey])
              .filter((value) => value !== null && value !== undefined)
              .map(String),
          ),
        ).slice(0, 25)
      : [];
  const numericValues =
    fieldKey && fieldSource === "powerbi"
      ? rows.map((row) => Number(row[fieldKey])).filter(Number.isFinite)
      : [];
  const uniqueClasses = Array.isArray(r.values) ? r.values.filter(object) : [];
  const breaks = Array.isArray(r.breaks) ? r.breaks.filter(object) : [];
  const palette = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#ea580c",
    "#0891b2",
    "#4f46e5",
    "#be123c",
  ];
  const generateBreaks = () => {
    if (!numericValues.length) return;
    const count = Math.max(2, Math.min(12, Number(r.classes ?? 5)));
    const min = Math.min(...numericValues),
      max = Math.max(...numericValues),
      step = (max - min || 1) / count;
    setRenderer({
      ...r,
      method: "manual",
      breaks: Array.from({ length: count }, (_value, index) => ({
        min: min + step * index,
        max: index === count - 1 ? max : min + step * (index + 1),
        label: `${(min + step * index).toFixed(2)}–${(index === count - 1 ? max : min + step * (index + 1)).toFixed(2)}`,
        symbol: { fillColor: palette[index % palette.length] },
      })),
    });
  };
  return (
    <div class="hp-map-form-grid">
      <label>
        <span>Renderer</span>
        <select
          aria-label="Renderer type"
          value={type}
          onChange={(event) =>
            changeType(
              event.currentTarget.value as MapRendererDefinition["type"],
            )
          }
        >
          {[
            "service",
            "simple",
            "uniqueValue",
            "classBreaks",
            "continuousColor",
            "proportionalSize",
            "heatmap",
            "cluster",
            "densityGrid",
          ].map((value) => (
            <option value={value}>{value}</option>
          ))}
        </select>
      </label>
      {["heatmap", "densityGrid"].includes(type) && (
        <p class="hp-map-experimental">
          Experimental: bounded fallback preview; capability limitations remain
          visible in diagnostics.
        </p>
      )}
      {type === "simple" && (
        <>
          <label>
            <span>Point shape</span>
            <select
              aria-label="Point shape"
              value={String(
                object(r.symbol) ? (r.symbol.shape ?? "circle") : "circle",
              )}
              onChange={(event) =>
                setRenderer({
                  ...r,
                  symbol: {
                    ...(object(r.symbol) ? r.symbol : {}),
                    shape: event.currentTarget.value,
                  },
                })
              }
            >
              <option value="circle">circle</option>
              <option value="square">square</option>
              <option value="diamond">diamond</option>
              <option value="triangle">triangle</option>
            </select>
          </label>
          <DraftInput
            label="Fill color"
            value={String(
              (object(r.symbol)
                ? (r.symbol.fillColor ?? r.symbol.color)
                : "") ?? "",
            )}
            onCommit={(value) =>
              setRenderer({
                ...r,
                symbol: {
                  ...(object(r.symbol) ? r.symbol : {}),
                  fillColor: value,
                },
              })
            }
          />
          <label>
            <span>Radius / size</span>
            <input
              type="number"
              value={Number(
                object(r.symbol) ? (r.symbol.radius ?? r.symbol.size ?? 6) : 6,
              )}
              onChange={(event) =>
                setRenderer({
                  ...r,
                  symbol: {
                    ...(object(r.symbol) ? r.symbol : {}),
                    radius: Number(event.currentTarget.value),
                  },
                })
              }
            />
          </label>
        </>
      )}
      {!["service", "simple"].includes(type) &&
        (type !== "cluster" || r.clusterLabel === "sum") && (
          <>
            <label>
              <span>Field source</span>
              <select
                aria-label="Renderer field source"
                value={fieldSource}
                onChange={(event) => {
                  const source = event.currentTarget
                    .value as MapAttributeSource;
                  setRenderer({
                    ...r,
                    fieldSource: source,
                    [type === "heatmap"
                      ? "weightField"
                      : type === "cluster"
                        ? "aggregateField"
                        : "field"]: fieldSets[source][0]?.key ?? "",
                  });
                }}
              >
                <option value="powerbi">Power BI</option>
                <option value="service">ArcGIS service</option>
                <option value="joined">Joined output</option>
              </select>
            </label>
            <FieldSelect
              label={
                type === "heatmap"
                  ? "weight field"
                  : type === "cluster"
                    ? "aggregate field"
                    : "field"
              }
              value={fieldKey}
              fields={selectableFields}
              numeric={numericRequired || type === "cluster"}
              onChange={(value) =>
                setRenderer({
                  ...r,
                  [type === "heatmap"
                    ? "weightField"
                    : type === "cluster"
                      ? "aggregateField"
                      : "field"]: value,
                })
              }
            />
          </>
        )}
      {type === "uniqueValue" && (
        <fieldset>
          <legend>Unique-value classes</legend>
          <button
            onClick={() =>
              setRenderer({
                ...r,
                values: values.slice(0, 25).map((value, index) => ({
                  value,
                  label: value,
                  symbol: {
                    fillColor: palette[index % palette.length],
                    radius: 6,
                  },
                })),
              })
            }
          >
            Generate bounded unique classes
          </button>
          {uniqueClasses.map((entry, index) => (
            <div class="hp-map-class-edit">
              <span>{String(entry.value ?? "(Blank)")}</span>
              <DraftInput
                ariaLabel={`Class ${index + 1} label`}
                value={String(entry.label ?? entry.value ?? "")}
                onCommit={(value) => {
                  const next = copy(uniqueClasses);
                  next[index].label = value;
                  setRenderer({ ...r, values: next });
                }}
              />
              <DraftInput
                ariaLabel={`Class ${index + 1} color`}
                value={String(
                  object(entry.symbol) ? (entry.symbol.fillColor ?? "") : "",
                )}
                onCommit={(value) => {
                  const next = copy(uniqueClasses);
                  next[index].symbol = {
                    ...(object(next[index].symbol) ? next[index].symbol : {}),
                    fillColor: value,
                  };
                  setRenderer({ ...r, values: next });
                }}
              />
            </div>
          ))}
        </fieldset>
      )}
      {type === "classBreaks" && (
        <>
          <label>
            <span>Method</span>
            <select
              value={String(r.method ?? "quantile")}
              onChange={(event) =>
                setRenderer({ ...r, method: event.currentTarget.value })
              }
            >
              <option value="manual">manual</option>
              <option value="equalInterval">equal interval</option>
              <option value="quantile">quantile</option>
            </select>
          </label>
          <label>
            <span>Classes</span>
            <input
              type="number"
              min="2"
              max="12"
              value={Number(r.classes ?? 5)}
              onChange={(event) =>
                setRenderer({
                  ...r,
                  classes: Number(event.currentTarget.value),
                })
              }
            />
          </label>
          <button onClick={generateBreaks}>
            Generate editable manual breaks
          </button>
          {breaks.map((entry, index) => (
            <div class="hp-map-class-edit">
              <input
                aria-label={`Break ${index + 1} minimum`}
                type="number"
                value={Number(entry.min ?? 0)}
                onChange={(event) => {
                  const next = copy(breaks);
                  next[index].min = Number(event.currentTarget.value);
                  setRenderer({ ...r, breaks: next });
                }}
              />
              <input
                aria-label={`Break ${index + 1} maximum`}
                type="number"
                value={Number(entry.max ?? 0)}
                onChange={(event) => {
                  const next = copy(breaks);
                  next[index].max = Number(event.currentTarget.value);
                  setRenderer({ ...r, breaks: next });
                }}
              />
              <DraftInput
                ariaLabel={`Break ${index + 1} label`}
                value={String(entry.label ?? "")}
                onCommit={(value) => {
                  const next = copy(breaks);
                  next[index].label = value;
                  setRenderer({ ...r, breaks: next });
                }}
              />
            </div>
          ))}
        </>
      )}
      {type === "continuousColor" && (
        <>
          <DraftInput
            label="Minimum color"
            value={String(r.minColor ?? "#dbeafe")}
            onCommit={(value) => setRenderer({ ...r, minColor: value })}
          />
          <DraftInput
            label="Maximum color"
            value={String(r.maxColor ?? "#1d4ed8")}
            onCommit={(value) => setRenderer({ ...r, maxColor: value })}
          />
        </>
      )}
      {type === "proportionalSize" && (
        <>
          <label>
            <span>Minimum size</span>
            <input
              type="number"
              value={Number(r.minSize ?? 4)}
              onChange={(event) =>
                setRenderer({
                  ...r,
                  minSize: Number(event.currentTarget.value),
                })
              }
            />
          </label>
          <label>
            <span>Maximum size</span>
            <input
              type="number"
              value={Number(r.maxSize ?? 24)}
              onChange={(event) =>
                setRenderer({
                  ...r,
                  maxSize: Number(event.currentTarget.value),
                })
              }
            />
          </label>
        </>
      )}
      {type === "cluster" && (
        <>
          <label>
            <span>Cluster label</span>
            <select
              aria-label="Cluster label"
              value={String(r.clusterLabel ?? "count")}
              onChange={(event) =>
                setRenderer({
                  ...r,
                  clusterLabel: event.currentTarget.value,
                  aggregateField:
                    event.currentTarget.value === "sum"
                      ? (fieldSets[fieldSource].find(
                          (field) => field.dataType === "number",
                        )?.key ?? "")
                      : undefined,
                })
              }
            >
              <option value="count">count</option>
              <option value="sum">sum</option>
            </select>
          </label>
          <DraftInput
            label="Cluster number format"
            value={String(r.format ?? "")}
            onCommit={(value) =>
              setRenderer({ ...r, format: value || undefined })
            }
          />
          <label>
            <span>Cluster radius</span>
            <input
              type="number"
              value={Number(r.radius ?? 44)}
              onChange={(event) =>
                setRenderer({ ...r, radius: Number(event.currentTarget.value) })
              }
            />
          </label>
          <label>
            <span>Disable at zoom</span>
            <input
              type="number"
              value={Number(r.disableAtZoom ?? 16)}
              onChange={(event) =>
                setRenderer({
                  ...r,
                  disableAtZoom: Number(event.currentTarget.value),
                })
              }
            />
          </label>
        </>
      )}
      {values.length > 0 && (
        <div class="hp-map-domain-preview">
          <strong>Bounded values/domain preview</strong>
          <span>{values.join(" · ")}</span>
          {numericValues.length > 0 && (
            <small>
              Numeric domain {Math.min(...numericValues).toLocaleString()}…
              {Math.max(...numericValues).toLocaleString()} ·{" "}
              {numericValues.length} value(s)
            </small>
          )}
        </div>
      )}
    </div>
  );
}

function LabelsEditor({
  layer,
  fieldSets,
  mutate,
}: {
  layer: MapLayerDefinition;
  fieldSets: Record<MapAttributeSource, NormalizedField[]>;
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
}) {
  const labels = layer.labels ?? { enabled: false };
  const source = (labels.fieldSource ??
    defaultFieldSource(layer)) as MapAttributeSource;
  const set = (patch: Json) =>
    mutate((candidate) => {
      const nextPatch =
        "field" in patch && !("fieldSource" in patch)
          ? {
              ...patch,
              fieldSource:
                candidate.labels?.fieldSource ??
                (candidate.source.type === "powerbi" ? "powerbi" : "service"),
            }
          : patch;
      candidate.labels = { ...(candidate.labels ?? {}), ...nextPatch };
    });
  return (
    <div class="hp-map-form-grid">
      <label>
        <input
          type="checkbox"
          checked={labels.enabled === true}
          onChange={(event) => set({ enabled: event.currentTarget.checked })}
        />{" "}
        Enable labels
      </label>
      <FieldSelect
        label="Label field"
        value={labels.field ?? ""}
        fields={fieldSets[source]}
        onChange={(value) => set({ field: value || undefined })}
      />
      <label>
        <span>Field source</span>
        <select
          value={labels.fieldSource ?? defaultFieldSource(layer)}
          onChange={(event) => {
            const next = event.currentTarget.value as MapAttributeSource;
            set({ fieldSource: next, field: fieldSets[next][0]?.key });
          }}
        >
          <option>powerbi</option>
          <option>service</option>
          <option>joined</option>
        </select>
      </label>
      <DraftInput
        label="Template"
        value={labels.template ?? ""}
        onCommit={(value) => set({ template: value || undefined })}
      />
      <label>
        <span>Placement</span>
        <select
          value={labels.placement ?? "center"}
          onChange={(event) => set({ placement: event.currentTarget.value })}
        >
          {["center", "above", "below", "left", "right", "lineCenter"].map(
            (value) => (
              <option>{value}</option>
            ),
          )}
        </select>
      </label>
      {[
        ["Minimum zoom", "minZoom"],
        ["Maximum zoom", "maxZoom"],
        ["Text size", "size"],
        ["Halo size", "haloSize"],
        ["Padding", "padding"],
        ["Maximum labels", "maxLabels"],
      ].map(([label, key]) => (
        <label>
          <span>{label}</span>
          <input
            type="number"
            value={Number((labels as unknown as Json)[key] ?? "")}
            onChange={(event) =>
              set({
                [key]: event.currentTarget.value
                  ? Number(event.currentTarget.value)
                  : undefined,
              })
            }
          />
        </label>
      ))}
      <DraftInput
        label="Text weight"
        value={String(labels.weight ?? "normal")}
        onCommit={(value) => set({ weight: value })}
      />
      <DraftInput
        label="Text color"
        value={labels.color ?? "#333333"}
        onCommit={(value) => set({ color: value })}
      />
      <DraftInput
        label="Halo color"
        value={labels.haloColor ?? ""}
        onCommit={(value) => set({ haloColor: value || undefined })}
      />
      <DraftInput
        label="Background"
        value={labels.backgroundColor ?? ""}
        onCommit={(value) => set({ backgroundColor: value || undefined })}
      />
      <label>
        <span>Collision</span>
        <select
          value={labels.collision ?? "none"}
          onChange={(event) => set({ collision: event.currentTarget.value })}
        >
          <option value="none">none</option>
          <option value="hideOverlaps">basic hide overlaps</option>
        </select>
      </label>
      <p>
        hideOverlaps is bounded basic collision hiding, not advanced
        cartographic placement.
      </p>
    </div>
  );
}

function PopupEditor({
  layer,
  fieldSets,
  mutate,
  section,
}: {
  layer: MapLayerDefinition;
  fieldSets: Record<MapAttributeSource, NormalizedField[]>;
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
  section: "popup" | "tooltip";
}) {
  const definition = layer[section] ?? { enabled: false, fields: [] };
  const items = definition.fields ?? [];
  const set = (patch: Json) =>
    mutate((candidate) => {
      (candidate as unknown as Json)[section] = {
        ...(((candidate as unknown as Json)[section] as Json) ?? {}),
        ...patch,
      };
    });
  const actions = section === "popup" ? (layer.popup?.actions ?? []) : [];
  return (
    <div class="hp-map-form-grid">
      <label>
        <input
          type="checkbox"
          checked={definition.enabled === true}
          onChange={(event) => set({ enabled: event.currentTarget.checked })}
        />{" "}
        Enable {section}
      </label>
      <label>
        <span>Template field source</span>
        <select
          aria-label={`${section} template field source`}
          value={definition.defaultFieldSource ?? defaultFieldSource(layer)}
          onChange={(event) =>
            set({
              defaultFieldSource: event.currentTarget.value as MapAttributeSource,
            })
          }
        >
          <option value="powerbi">Power BI</option>
          <option value="service">Service</option>
          <option value="joined">Joined</option>
        </select>
      </label>
      {section === "popup" && (
        <DraftInput
          label="Title template"
          value={layer.popup?.title ?? ""}
          onCommit={(value) => set({ title: value || undefined })}
        />
      )}
      <DraftInput
        multiline
        label="Safe template"
        value={
          section === "popup"
            ? (layer.popup?.html ?? "")
            : (layer.tooltip?.template ?? "")
        }
        onCommit={(value) =>
          set({
            [section === "popup" ? "html" : "template"]: value || undefined,
          })
        }
      />
      <button
        onClick={() =>
          set({
            fields: [
              ...items,
              {
                field:
                  fieldSets[
                    definition.defaultFieldSource ?? defaultFieldSource(layer)
                  ][0]?.key ?? "",
                fieldSource:
                  definition.defaultFieldSource ?? defaultFieldSource(layer),
                label:
                  fieldSets[
                    definition.defaultFieldSource ?? defaultFieldSource(layer)
                  ][0]?.displayName ??
                  "Field",
              },
            ],
          })
        }
      >
        Add field
      </button>
      <div class="hp-map-field-list">
        {items.map((item, index) => (
          <div>
            <FieldSelect
              label={`Field ${index + 1}`}
              value={item.field}
              fields={
                fieldSets[
                  (item.fieldSource ??
                    defaultFieldSource(layer)) as MapAttributeSource
                ]
              }
              onChange={(value) => {
                const next = copy(items);
                next[index] = { ...next[index], field: value };
                set({ fields: next });
              }}
            />
            <select
              aria-label={`Field ${index + 1} source`}
              value={item.fieldSource ?? defaultFieldSource(layer)}
              onChange={(event) => {
                const next = copy(items);
                const source = event.currentTarget.value as MapAttributeSource;
                next[index] = {
                  ...next[index],
                  fieldSource: source,
                  field: fieldSets[source][0]?.key ?? "",
                };
                set({ fields: next });
              }}
            >
              <option>powerbi</option>
              <option>service</option>
              <option>joined</option>
            </select>
            <DraftInput
              ariaLabel={`Field ${index + 1} label`}
              value={item.label ?? ""}
              onCommit={(value) => {
                const next = copy(items);
                next[index] = { ...next[index], label: value };
                set({ fields: next });
              }}
            />
            {section === "popup" && (
              <select
                aria-label={`Field ${index + 1} display`}
                value={(item as { display?: string }).display ?? "text"}
                onChange={(event) => {
                  const next = copy(items) as Array<
                    typeof item & { display?: string }
                  >;
                  next[index] = {
                    ...next[index],
                    display: event.currentTarget.value,
                  };
                  set({ fields: next });
                }}
              >
                <option>text</option>
                <option>badge</option>
                <option>number</option>
                <option>date</option>
              </select>
            )}
            <DraftInput
              ariaLabel={`Field ${index + 1} format`}
              value={item.format ?? ""}
              onCommit={(value) => {
                const next = copy(items);
                next[index] = { ...next[index], format: value || undefined };
                set({ fields: next });
              }}
            />
            <button
              disabled={index === 0}
              onClick={() => {
                const next = copy(items);
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                set({ fields: next });
              }}
            >
              ↑
            </button>
            <button
              disabled={index === items.length - 1}
              onClick={() => {
                const next = copy(items);
                [next[index + 1], next[index]] = [next[index], next[index + 1]];
                set({ fields: next });
              }}
            >
              ↓
            </button>
            <button
              onClick={() =>
                set({
                  fields: items.filter(
                    (_item, itemIndex) => itemIndex !== index,
                  ),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {section === "popup" && (
        <fieldset>
          <legend>Safe UI actions</legend>
          <button
            onClick={() =>
              set({
                actions: [
                  ...actions,
                  {
                    id: `action-${actions.length + 1}`,
                    label: "Show message",
                    uiAction: {
                      type: "showToast",
                      message: "Selected map feature",
                    },
                  },
                ],
              })
            }
          >
            Add safe action
          </button>
          {actions.map((action, index) => (
            <div class="hp-map-action-edit">
              <DraftInput
                ariaLabel={`Action ${index + 1} label`}
                value={action.label}
                onCommit={(value) => {
                  const next = copy(actions);
                  next[index].label = value;
                  set({ actions: next });
                }}
              />
              <select
                aria-label={`Action ${index + 1} type`}
                value={action.uiAction?.type ?? "showToast"}
                onChange={(event) => {
                  const next = copy(actions);
                  next[index].uiAction = {
                    ...(next[index].uiAction ?? { type: "showToast" }),
                    type: event.currentTarget.value as "showToast",
                  };
                  set({ actions: next });
                }}
              >
                {[
                  "showToast",
                  "setTab",
                  "setState",
                  "openOverlay",
                  "closeOverlay",
                  "clearFilters",
                  "refresh",
                ].map((type) => (
                  <option>{type}</option>
                ))}
              </select>
              <DraftInput
                ariaLabel={`Action ${index + 1} target`}
                value={action.uiAction?.target ?? ""}
                onCommit={(value) => {
                  const next = copy(actions);
                  next[index].uiAction = {
                    ...(next[index].uiAction ?? { type: "showToast" }),
                    target: value || undefined,
                  };
                  set({ actions: next });
                }}
              />
              <button
                onClick={() =>
                  set({
                    actions: actions.filter(
                      (_action, actionIndex) => actionIndex !== index,
                    ),
                  })
                }
              >
                Remove action
              </button>
            </div>
          ))}
        </fieldset>
      )}
      <p>
        Scripts, event handlers, iframes, unsafe URLs, and arbitrary callbacks
        are rejected by the existing sanitization boundary.
      </p>
    </div>
  );
}

function JoinEditor({
  layer,
  fields,
  rows,
  mutate,
  serviceMetadata,
  preview,
  runPreview,
  invalidatePreview,
}: {
  layer: MapLayerDefinition;
  fields: NormalizedField[];
  rows: Json[];
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
  serviceMetadata?: ArcGisLayerMetadata;
  preview: { loading?: boolean; result?: MapJoinPreviewResult; error?: string };
  runPreview: () => void;
  invalidatePreview: () => void;
}) {
  if (layer.source.type !== "arcgisFeature")
    return <p>Join mode is available for ArcGIS feature layers.</p>;
  const join = layer.join ?? {
    enabled: false,
    powerBiField: fields[0]?.key ?? "",
    serviceField: "",
  };
  const set = (patch: Json) => {
    invalidatePreview();
    return mutate((candidate) => {
      candidate.join = {
        ...(candidate.join ?? join),
        ...patch,
        enabled: false,
      } as typeof join;
      if (candidate.source.type === "arcgisFeature")
        candidate.source.mode = "reference";
    });
  };
  const normalization = join.normalization ?? ["trim", "upper"];
  const values = rows.map((row) => row[join.powerBiField]);
  const normalized = values
    .map((value) => normalizeJoinKey(value, normalization))
    .filter((value): value is string => value !== null);
  const counts = new Map<string, number>();
  normalized.forEach((value) =>
    counts.set(value, (counts.get(value) ?? 0) + 1),
  );
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
  const powerBiFieldExists = fields.some((field) => field.key === join.powerBiField);
  const serviceFieldExists = Boolean(
    join.serviceField &&
      serviceMetadata?.fields?.some((field) => field.name === join.serviceField),
  );
  const matchRate = preview.result?.matchRate;
  const previewReady = Boolean(preview.result && !preview.loading && !preview.error);
  const discardedAggregationValues =
    preview.result?.aggregationDiagnostics.some(
      (item) => item.discardedCount > 0,
    ) ?? false;
  const saveBlocked =
    !previewReady ||
    !powerBiFieldExists ||
    !serviceFieldExists ||
    preview.result?.cardinalityValid === false ||
    discardedAggregationValues;
  return (
    <div class="hp-map-form-grid">
      <header class="hp-map-join-intro">
        <strong>Guided feature join</strong>
        <p>Build and validate the relationship before saving it to the map layer.</p>
      </header>
      <ol class="hp-map-join-steps" aria-label="Join workflow progress">
        {[
          ["ArcGIS feature source", true],
          ["Power BI dataset", true],
          ["Power BI key", powerBiFieldExists],
          ["Service key", serviceFieldExists],
          ["Key normalization", normalization.length > 0],
          ["Normalized key samples", normalized.length > 0],
          ["Match rate", previewReady],
          ["Unmatched samples", previewReady],
          ["Duplicate samples", previewReady],
          ["Expected cardinality", Boolean(join.cardinality)],
          ["Required aggregations", (join.aggregations?.length ?? 0) > 0 || join.cardinality !== "manyToOne"],
          ["Resulting joined fields", previewReady],
          ["Selection behavior", Boolean(layer.interaction)],
          ["Save join", join.enabled && previewReady],
        ].map(([label, complete], index) => (
          <li class={complete ? "is-complete" : ""}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>
      <div class="hp-map-join-status" role="status">
        <strong>{join.enabled ? "Join is active" : "Join is not active"}</strong>
        <span>
          Configuration edits disable the runtime join until a current preview
          is confirmed.
        </span>
        {join.enabled && (
          <StudioButton variant="secondary" onClick={() => set({})}>
            Disable join
          </StudioButton>
        )}
      </div>
      <FieldSelect
        label="Power BI / logical dataset field"
        value={join.powerBiField}
        fields={fields}
        onChange={(value) => set({ powerBiField: value })}
      />
      {!powerBiFieldExists && join.powerBiField && (
        <p class="hp-map-join-blocker" role="alert">The selected Power BI key does not exist in this dataset.</p>
      )}
      <label>
        <span>Service field</span>
        <select
          aria-label="Join service field"
          value={join.serviceField}
          onChange={(event) => set({ serviceField: event.currentTarget.value })}
        >
          <option value="">Not set</option>
          {(serviceMetadata?.fields ?? []).map((field) => (
            <option value={field.name}>
              {field.alias || field.name} · {field.name}
            </option>
          ))}
        </select>
      </label>
      {join.serviceField && !serviceFieldExists && (
        <p class="hp-map-join-blocker" role="alert">Inspect the service and choose an existing service key before previewing.</p>
      )}
      <label>
        <span>Cardinality</span>
        <select
          value={join.cardinality ?? "manyToOne"}
          onChange={(event) => set({ cardinality: event.currentTarget.value })}
        >
          <option value="oneToOne">one to one</option>
          <option value="manyToOne">many to one</option>
        </select>
      </label>
      <label>
        <span>Key type (partial)</span>
        <select
          value={join.keyType ?? "auto"}
          onChange={(event) => set({ keyType: event.currentTarget.value })}
        >
          <option>auto</option>
          <option>string</option>
          <option>number</option>
        </select>
      </label>
      <label>
        <span>Query strategy</span>
        <select
          value={join.queryStrategy ?? "auto"}
          onChange={(event) =>
            set({ queryStrategy: event.currentTarget.value })
          }
        >
          <option>auto</option>
          <option>keyBatches</option>
        </select>
      </label>
      <fieldset>
        <legend>Normalization pipeline</legend>
        {[
          "trim",
          "upper",
          "lower",
          "removeNonAlphanumeric",
          "numberString",
        ].map((step) => (
          <label>
            <input
              type="checkbox"
              checked={normalization.includes(step as never)}
              onChange={(event) =>
                set({
                  normalization: event.currentTarget.checked
                    ? [...normalization, step]
                    : normalization.filter((item) => item !== step),
                })
              }
            />{" "}
            {step}
          </label>
        ))}
      </fieldset>
      <label>
        <span>Power BI duplicates</span>
        <select
          value={join.powerBiDuplicatePolicy ?? "aggregate"}
          onChange={(event) =>
            set({ powerBiDuplicatePolicy: event.currentTarget.value })
          }
        >
          <option>aggregate</option>
          <option>first</option>
          <option>error</option>
        </select>
      </label>
      <label>
        <span>Service duplicates</span>
        <select
          value={join.serviceDuplicatePolicy ?? "first"}
          onChange={(event) =>
            set({ serviceDuplicatePolicy: event.currentTarget.value })
          }
        >
          <option>first</option>
          <option>all</option>
          <option>error</option>
        </select>
      </label>
      <label>
        <span>Unmatched policy</span>
        <select
          value={join.unmatchedPolicy ?? "diagnose"}
          onChange={(event) =>
            set({ unmatchedPolicy: event.currentTarget.value })
          }
        >
          <option>ignore</option>
          <option>warn</option>
          <option>diagnose</option>
        </select>
      </label>
      <button
        onClick={() =>
          set({
            aggregations: [
              ...(join.aggregations ?? []),
              {
                field:
                  fields.find((field) => field.dataType === "number")?.key ??
                  fields[0]?.key ??
                  "",
                aggregation: "sum",
                as: `joined_${(join.aggregations?.length ?? 0) + 1}`,
              },
            ],
          })
        }
      >
        Add aggregation
      </button>
      {(join.aggregations ?? []).map((aggregation, index) => (
        <div class="hp-map-join-aggregation">
          <FieldSelect
            label={`Aggregation ${index + 1} field`}
            value={aggregation.field}
            fields={fields}
            onChange={(value) => {
              const next = copy(join.aggregations ?? []);
              next[index].field = value;
              set({ aggregations: next });
            }}
          />
          <select
            aria-label={`Aggregation ${index + 1} operation`}
            value={aggregation.aggregation}
            onChange={(event) => {
              const next = copy(join.aggregations ?? []);
              next[index].aggregation = event.currentTarget
                .value as typeof aggregation.aggregation;
              set({ aggregations: next });
            }}
          >
            {[
              "count",
              "distinctCount",
              "sum",
              "avg",
              "min",
              "max",
              "first",
              "last",
            ].map((value) => (
              <option>{value}</option>
            ))}
          </select>
          <DraftInput
            ariaLabel={`Aggregation ${index + 1} alias`}
            value={aggregation.as}
            onCommit={(value) => {
              const next = copy(join.aggregations ?? []);
              next[index].as = value;
              return set({ aggregations: next });
            }}
          />
          <button
            onClick={() =>
              set({
                aggregations: (join.aggregations ?? []).filter(
                  (_item, itemIndex) => itemIndex !== index,
                ),
              })
            }
          >
            Remove aggregation
          </button>
        </div>
      ))}
      <div class="hp-map-join-preview">
        <strong>Local join preview key statistics</strong>
        <dl>
          <div>
            <dt>Power BI rows</dt>
            <dd>{rows.length}</dd>
          </div>
          <div>
            <dt>Unique keys</dt>
            <dd>{counts.size}</dd>
          </div>
          <div>
            <dt>Blank keys</dt>
            <dd>{values.length - normalized.length}</dd>
          </div>
          <div>
            <dt>Duplicate keys</dt>
            <dd>{duplicates.length}</dd>
          </div>
        </dl>
        {duplicates.length > 0 && (
          <small>
            Sample duplicates:{" "}
            {duplicates
              .slice(0, 10)
              .map(([key]) => key)
              .join(", ")}
          </small>
        )}
        <button
          disabled={
            !powerBiFieldExists ||
            !serviceFieldExists ||
            preview.loading
          }
          onClick={runPreview}
        >
          {preview.loading ? "Running join preview…" : "Run join preview"}
        </button>
        {preview.error && <p role="alert">{preview.error}</p>}
        {matchRate !== undefined && matchRate < 0.2 && (
          <p class="hp-map-join-blocker" role="alert">
            Match rate is extremely low ({(matchRate * 100).toFixed(1)}%). Review both keys and normalization before saving.
          </p>
        )}
        {preview.result && (
          <>
            <dl>
              {previewMetrics(preview.result).map(([label, value]) => (
                <div>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {preview.result.truncated && (
              <p role="status">
                Preview was truncated at the safe 500-feature limit.
              </p>
            )}
            <small>
              Cardinality: {preview.result.cardinality} ({preview.result.cardinalityValid ? "valid" : "violated"}). Policies: Power BI {preview.result.powerBiDuplicatePolicy};
              service {preview.result.serviceDuplicatePolicy}; unmatched{" "}
              {preview.result.unmatchedPolicy}. Aggregations:{" "}
              {preview.result.aggregationAliases.join(", ") || "none"}.
              Requests: {preview.result.requestCount}. Duration:{" "}
              {preview.result.durationMs.toFixed(1)} ms.
            </small>
            {preview.result.warnings.length > 0 && (
              <ul>
                {preview.result.warnings.map((warning) => <li>{warning}</li>)}
              </ul>
            )}
            {preview.result.aggregationDiagnostics.some(
              (item) => item.blankCount > 0 || item.discardedCount > 0,
            ) && (
              <details>
                <summary>Aggregation input diagnostics</summary>
                <dl>
                  {preview.result.aggregationDiagnostics.map((item) => (
                    <div>
                      <dt>{item.alias}</dt>
                      <dd>{item.validCount} valid · {item.blankCount} blank · {item.discardedCount} discarded</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
            <details>
              <summary>Bounded normalization samples</summary>
              <ul>
                {preview.result.normalizationSamples.map((sample) => (
                  <li>{String(sample.raw)} → {sample.normalized ?? "blank"}</li>
                ))}
              </ul>
            </details>
            <details>
              <summary>Bounded mismatch and duplicate samples</summary>
              <dl>
                <div>
                  <dt>Unmatched Power BI keys</dt>
                  <dd>
                    {preview.result.sampleUnmatchedPowerBiKeys.join(", ") ||
                      "none"}
                  </dd>
                </div>
                <div>
                  <dt>Unmatched service keys</dt>
                  <dd>
                    {preview.result.sampleUnmatchedServiceKeys.join(", ") ||
                      "none"}
                  </dd>
                </div>
                <div>
                  <dt>Duplicate Power BI keys</dt>
                  <dd>
                    {preview.result.sampleDuplicatePowerBiKeys.join(", ") ||
                      "none"}
                  </dd>
                </div>
                <div>
                  <dt>Duplicate service keys</dt>
                  <dd>
                    {preview.result.sampleDuplicateServiceKeys.join(", ") ||
                      "none"}
                  </dd>
                </div>
              </dl>
            </details>
          </>
        )}
        {discardedAggregationValues && (
          <p class="hp-map-join-blocker" role="alert">
            The configured aggregations discard invalid values. Choose
            compatible fields or aggregations before saving.
          </p>
        )}
        <StudioButton
          variant="primary"
          disabled={saveBlocked}
          onClick={() =>
            mutate((candidate) => {
              candidate.join = {
                ...(candidate.join ?? join),
                enabled: true,
              } as typeof join;
              if (candidate.source.type === "arcgisFeature")
                candidate.source.mode = "join";
            })
          }
        >
          Save join
        </StudioButton>
        <p>
          This explicit preview uses the runtime query and join engines, is
          bounded to 500 service features, and does not create a Power BI model
          relationship.
        </p>
      </div>
    </div>
  );
}

function VisibilityEditor({
  layer,
  fieldSets,
  mutate,
}: {
  layer: MapLayerDefinition;
  fieldSets: Record<MapAttributeSource, NormalizedField[]>;
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
}) {
  const visibility = layer.visibility ?? {};
  const visibilitySource = (visibility.conditionFieldSource ??
    defaultFieldSource(layer)) as MapAttributeSource;
  const filters = layer.filter
    ? Array.isArray(layer.filter)
      ? layer.filter
      : [layer.filter]
    : [];
  const set = (patch: Json) =>
    mutate((candidate) => {
      candidate.visibility = { ...(candidate.visibility ?? {}), ...patch };
    });
  const setFilters = (next: typeof filters) =>
    mutate((candidate) => {
      candidate.filter = next.length ? next : undefined;
    });
  return (
    <div class="hp-map-form-grid">
      <label>
        <span>Minimum zoom</span>
        <input
          type="number"
          value={visibility.minZoom ?? ""}
          onChange={(event) =>
            set({
              minZoom: event.currentTarget.value
                ? Number(event.currentTarget.value)
                : undefined,
            })
          }
        />
      </label>
      <label>
        <span>Maximum zoom</span>
        <input
          type="number"
          value={visibility.maxZoom ?? ""}
          onChange={(event) =>
            set({
              maxZoom: event.currentTarget.value
                ? Number(event.currentTarget.value)
                : undefined,
            })
          }
        />
      </label>
      <FieldSelect
        label="Condition field"
        value={visibility.conditionField ?? ""}
        fields={fieldSets[visibilitySource]}
        onChange={(value) => set({ conditionField: value || undefined })}
      />
      <label>
        <span>Condition field source</span>
        <select
          aria-label="Condition field source"
          value={visibilitySource}
          onChange={(event) => {
            const source = event.currentTarget.value as MapAttributeSource;
            set({
              conditionFieldSource: source,
              conditionField: fieldSets[source][0]?.key,
            });
          }}
        >
          <option value="powerbi">Power BI</option>
          <option value="service">ArcGIS service</option>
          <option value="joined">Joined output</option>
        </select>
      </label>
      <label>
        <span>Condition values (comma separated)</span>
        <DraftInput
          value={visibility.conditionValues?.join(", ") ?? ""}
          onCommit={(value) =>
            set({
              conditionValues: value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={visibility.scaleDependent === true}
          onChange={(event) =>
            set({ scaleDependent: event.currentTarget.checked })
          }
        />{" "}
        Scale-dependent visibility (partial)
      </label>
      <fieldset>
        <legend>Structured layer filters</legend>
        <button
          onClick={() =>
            setFilters([
              ...filters,
              {
                field: fieldSets[defaultFieldSource(layer)][0]?.key ?? "",
                fieldSource: defaultFieldSource(layer),
                operator: "=",
                value: "",
              },
            ])
          }
        >
          Add filter
        </button>
        {filters.map((filter, index) => (
          <div class="hp-map-filter-edit">
            <FieldSelect
              label={`Filter ${index + 1} field`}
              value={filter.field}
              fields={
                fieldSets[
                  (filter.fieldSource ??
                    defaultFieldSource(layer)) as MapAttributeSource
                ]
              }
              onChange={(value) => {
                const next = copy(filters);
                next[index].field = value;
                setFilters(next);
              }}
            />
            <select
              aria-label={`Filter ${index + 1} source`}
              value={filter.fieldSource ?? defaultFieldSource(layer)}
              onChange={(event) => {
                const next = copy(filters);
                const source = event.currentTarget.value as MapAttributeSource;
                next[index].fieldSource = source;
                next[index].field = fieldSets[source][0]?.key ?? "";
                setFilters(next);
              }}
            >
              <option value="powerbi">Power BI</option>
              <option value="service">ArcGIS service</option>
              <option value="joined">Joined output</option>
            </select>
            <select
              aria-label={`Filter ${index + 1} operator`}
              value={filter.operator}
              onChange={(event) => {
                const next = copy(filters);
                next[index].operator = event.currentTarget
                  .value as typeof filter.operator;
                setFilters(next);
              }}
            >
              {[
                "=",
                "!=",
                ">",
                ">=",
                "<",
                "<=",
                "contains",
                "in",
                "between",
              ].map((operator) => (
                <option>{operator}</option>
              ))}
            </select>
            <DraftInput
              ariaLabel={`Filter ${index + 1} value`}
              value={
                Array.isArray(filter.value)
                  ? filter.value.join(", ")
                  : String(filter.value ?? "")
              }
              onCommit={(value) => {
                const next = copy(filters);
                next[index].value = ["in", "between"].includes(filter.operator)
                  ? value.split(",").map((item) => item.trim())
                  : value;
                setFilters(next);
              }}
            />
            <button
              onClick={() =>
                setFilters(
                  filters.filter(
                    (_filter, filterIndex) => filterIndex !== index,
                  ),
                )
              }
            >
              Remove filter
            </button>
          </div>
        ))}
      </fieldset>
    </div>
  );
}

function InteractionEditor({
  layer,
  fieldSets,
  mutate,
}: {
  layer: MapLayerDefinition;
  fieldSets: Record<MapAttributeSource, NormalizedField[]>;
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
}) {
  const interaction = layer.interaction ?? {};
  const source = (interaction.fieldSource ??
    defaultFieldSource(layer)) as MapAttributeSource;
  const set = (patch: Json) =>
    mutate((candidate) => {
      candidate.interaction = {
        ...(candidate.interaction ?? {}),
        trigger: "click",
        ...patch,
      };
    });
  const referenceOnly =
    layer.source.type !== "powerbi" &&
    !(
      layer.source.type === "arcgisFeature" &&
      layer.source.mode === "join" &&
      layer.join?.enabled
    );
  const selectionAvailable = !referenceOnly;
  const filterField = fieldSets.powerbi.find(
    (field) => field.key === interaction.field,
  );
  const filterAvailable =
    !referenceOnly &&
    source === "powerbi" &&
    Boolean(
      filterField?.sourceTable &&
      filterField.sourceColumn &&
      filterField.origin !== "calculated-field" &&
      filterField.origin !== "dataset-derived" &&
      filterField.origin !== "dataset-metric",
    );
  return (
    <div class="hp-map-form-grid hp-map-interaction-editor">
      <label class="hp-map-switch hp-map-interaction-master">
        <input
          type="checkbox"
          role="switch"
          checked={interaction.enabled !== false}
          onChange={(event) => set({ enabled: event.currentTarget.checked })}
        />
        <span>
          <strong>Enable map feature interactions</strong>
          <small>One feature click can update HyperPBI components and Power BI selection as a single transaction.</small>
        </span>
      </label>
      <label>
        <span>Trigger</span>
        <input value="click" readOnly aria-label="Map interaction trigger" />
        <small>Map features currently run interactions on click only.</small>
      </label>
      <fieldset disabled={interaction.enabled === false}>
        <legend>Internal HyperPBI components</legend>
        <p class="hp-map-interaction-help">Control how this map feature affects components inside the same HyperPBI dashboard.</p>
        <label>
          <span>Internal mode</span>
          <select
            value={interaction.internalMode ?? "highlight"}
            onChange={(event) => set({ internalMode: event.currentTarget.value })}
          >
            <option value="none">No internal update</option>
            <option value="highlight">Highlight matching rows</option>
            <option value="filter">Filter matching rows</option>
          </select>
        </label>
        <label>
          <span>Internal scope</span>
          <select
            value={interaction.internalScope ?? "all"}
            onChange={(event) => set({ internalScope: event.currentTarget.value })}
          >
            <option value="self">This map only</option>
            <option value="others">Other components</option>
            <option value="all">Map and other components</option>
          </select>
        </label>
      </fieldset>
      <fieldset disabled={interaction.enabled === false}>
        <legend>External Power BI visuals</legend>
        <p class="hp-map-interaction-help">Use retained Power BI row identities for report selection, or a direct model column for filtering.</p>
        <label>
          <span>External mode</span>
          <select
            value={interaction.externalMode ?? "selection"}
            onChange={(event) => set({ externalMode: event.currentTarget.value })}
          >
            <option value="none">No external update</option>
            <option value="auto">Automatic</option>
            <option value="selection" disabled={!selectionAvailable}>Power BI selection</option>
            <option value="filter" disabled={!filterAvailable}>Power BI filter</option>
          </select>
        </label>
      </fieldset>
      <fieldset disabled={interaction.enabled === false}>
        <legend>Matching field and value</legend>
        <p class="hp-map-interaction-help">The selected field drives internal filtering and external filter mode. Selection mode uses retained row identities.</p>
        <label>
          <span>Interaction field source</span>
          <select
            aria-label="Interaction field source"
            value={source}
            onChange={(event) => {
              const next = event.currentTarget.value as MapAttributeSource;
              set({ fieldSource: next, field: fieldSets[next][0]?.key });
            }}
          >
            <option value="powerbi">Power BI</option>
            <option value="service">ArcGIS service</option>
            <option value="joined">Joined output</option>
          </select>
        </label>
        <FieldSelect
          label="Interaction field"
          value={interaction.field ?? ""}
          fields={fieldSets[source]}
          onChange={(value) => set({ field: value || undefined })}
        />
        <label>
          <span>Operator</span>
          <select
            value={interaction.operator ?? "="}
            onChange={(event) => set({ operator: event.currentTarget.value })}
          >
            {["=", "!=", ">", ">=", "<", "<=", "contains", "in", "between"].map(
              (value) => <option>{value}</option>,
            )}
          </select>
        </label>
        <DraftInput
          label="Explicit value"
          value={interaction.value === undefined ? "" : String(interaction.value)}
          onCommit={(value) => set({ value: value || undefined })}
        />
      </fieldset>
      <fieldset disabled={interaction.enabled === false}>
        <legend>Selection behavior</legend>
        <label>
          <span>Selection mode</span>
          <select
            value={interaction.selectionMode ?? "replace"}
            onChange={(event) => set({ selectionMode: event.currentTarget.value })}
          >
            <option value="replace">Replace selection</option>
            <option value="toggle">Toggle selection</option>
            <option value="add">Add to selection</option>
          </select>
        </label>
        {[
          ["Allow Ctrl/Cmd multi-select", "multiSelect", interaction.multiSelect !== false],
          ["Show selector", "showSelector", interaction.showSelector === true],
          ["Clear on second click", "clearOnSecondClick", interaction.clearOnSecondClick === true],
        ].map(([label, key, checked]) => (
          <label class="hp-map-switch">
            <input
              type="checkbox"
              role="switch"
              checked={Boolean(checked)}
              onChange={(event) => set({ [String(key)]: event.currentTarget.checked })}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Compatibility</legend>
        <dl>
          <div>
            <dt>Local highlight</dt>
            <dd>Available</dd>
          </div>
          <div>
            <dt>Power BI selection</dt>
            <dd>
              {selectionAvailable
                ? "Available through retained source identities"
                : "Unavailable — reference-only ArcGIS features have no Power BI identities"}
            </dd>
          </div>
          <div>
            <dt>Power BI filter</dt>
            <dd>
              {filterAvailable
                ? "Available for the selected model column"
                : "Unavailable — choose a direct Power BI model column on a Power BI-backed or joined layer"}
            </dd>
          </div>
        </dl>
      </fieldset>
    </div>
  );
}

function PerformanceEditor({
  layer,
  mutate,
}: {
  layer: MapLayerDefinition;
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
}) {
  const performance = layer.performance ?? {};
  const set = (patch: Json) =>
    mutate((candidate) => {
      candidate.performance = { ...(candidate.performance ?? {}), ...patch };
    });
  return (
    <div class="hp-map-form-grid">
      {[
        ["Maximum features", "maxFeatures", 10000],
        ["Cache minutes", "cacheMinutes", 5],
        ["Request batch size", "requestBatchSize", 500],
      ].map(([label, key, fallback]) => (
        <label>
          <span>{label}</span>
          <input
            type="number"
            value={Number(
              (performance as unknown as Json)[String(key)] ?? fallback,
            )}
            onChange={(event) =>
              set({ [String(key)]: Number(event.currentTarget.value) })
            }
          />
        </label>
      ))}
      {[
        ["Viewport query", "viewportQuery"],
        ["Generalize by zoom (experimental)", "generalizeByZoom"],
        ["Progressive rendering (experimental)", "progressiveRendering"],
      ].map(([label, key]) => (
        <label>
          <input
            type="checkbox"
            checked={(performance as unknown as Json)[String(key)] === true}
            onChange={(event) =>
              set({ [String(key)]: event.currentTarget.checked })
            }
          />{" "}
          {label}
        </label>
      ))}
    </div>
  );
}

function BasemapViewEditor({
  map,
  mutateMap,
  liveViewport,
}: {
  map: MapComponent;
  mutateMap: (fn: (map: MapComponent) => void) => boolean;
  liveViewport?: MapViewportState;
}) {
  const basemap = map.basemap ?? { type: "none" as const };
  const view = map.view ?? {};
  const bookmarks = map.bookmarks ?? [];
  const setView = (patch: Json) =>
    mutateMap((candidate) => {
      candidate.view = { ...(candidate.view ?? {}), ...patch };
    });
  return (
    <div class="hp-map-form-grid">
      <fieldset>
        <legend>Container sizing</legend>
        <label>
          <span>Height mode</span>
          <select
            aria-label="Map height mode"
            value={map.heightMode ?? "fixed"}
            onChange={(event) =>
              mutateMap((candidate) => {
                candidate.heightMode = event.currentTarget.value as MapComponent["heightMode"];
              })
            }
          >
            <option value="fixed">Fixed</option>
            <option value="fill">Fill available space</option>
            <option value="aspectRatio">Aspect ratio</option>
          </select>
        </label>
        {(!map.heightMode || map.heightMode === "fixed") && (
          <label>
            <span>Height (pixels)</span>
            <input type="number" min="160" value={map.height ?? 420} onChange={(event) => mutateMap((candidate) => { candidate.height = Number(event.currentTarget.value); })} />
          </label>
        )}
        <label>
          <span>Minimum height (pixels)</span>
          <input type="number" min="160" value={map.minHeight ?? 220} onChange={(event) => mutateMap((candidate) => { candidate.minHeight = Number(event.currentTarget.value); })} />
        </label>
        {map.heightMode === "aspectRatio" && (
          <label>
            <span>Aspect ratio</span>
            <input type="number" min="0.25" max="8" step="0.05" value={map.aspectRatio ?? 16 / 9} onChange={(event) => mutateMap((candidate) => { candidate.aspectRatio = Number(event.currentTarget.value); })} />
          </label>
        )}
        <p>Fill mode is used by Studio preview when no explicit mode is authored. The runtime still respects the Power BI host viewport.</p>
      </fieldset>
      <fieldset>
        <legend>Basemap gallery</legend>
        <label>
          <span>Provider</span>
          <select
            aria-label="Basemap provider"
            value={basemap.type ?? "none"}
            onChange={(event) =>
              mutateMap((candidate) => {
                candidate.basemap = {
                  ...(candidate.basemap ?? {}),
                  type: event.currentTarget.value as "none",
                };
              })
            }
          >
            <option value="none">None</option>
            <option value="osm">OpenStreetMap</option>
            <option value="customTile">Configured custom tile</option>
            <option value="arcgisTile">Configured ArcGIS tile</option>
          </select>
        </label>
        {["customTile", "arcgisTile"].includes(basemap.type ?? "") && (
          <>
            <DraftInput
              label="Approved HTTPS tile URL"
              value={basemap.url ?? ""}
              onCommit={(value) =>
                mutateMap((candidate) => {
                  candidate.basemap = {
                    ...(candidate.basemap ?? {}),
                    url: value,
                  };
                })
              }
            />
            <DraftInput
              label="Attribution"
              value={basemap.attribution ?? ""}
              onCommit={(value) =>
                mutateMap((candidate) => {
                  candidate.basemap = {
                    ...(candidate.basemap ?? {}),
                    attribution: value,
                  };
                })
              }
            />
          </>
        )}
        <label>
          <span>Basemap maximum zoom</span>
          <input
            type="number"
            value={basemap.maxZoom ?? 19}
            onChange={(event) =>
              mutateMap((candidate) => {
                candidate.basemap = {
                  ...(candidate.basemap ?? {}),
                  maxZoom: Number(event.currentTarget.value),
                };
              })
            }
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={basemap.visible !== false}
            onChange={(event) =>
              mutateMap((candidate) => {
                candidate.basemap = {
                  ...(candidate.basemap ?? {}),
                  visible: event.currentTarget.checked,
                };
              })
            }
          />{" "}
          Basemap initially visible
        </label>
        <p>
          No provider URL is invented; custom and ArcGIS tiles require an
          explicitly approved HTTPS URL and attribution.
        </p>
      </fieldset>
      <fieldset>
        <legend>Map view</legend>
        <label>
          <span>Center latitude</span>
          <input
            type="number"
            value={view.center?.[0] ?? 0}
            onChange={(event) =>
              setView({
                center: [
                  Number(event.currentTarget.value),
                  view.center?.[1] ?? 0,
                ],
              })
            }
          />
        </label>
        <label>
          <span>Center longitude</span>
          <input
            type="number"
            value={view.center?.[1] ?? 0}
            onChange={(event) =>
              setView({
                center: [
                  view.center?.[0] ?? 0,
                  Number(event.currentTarget.value),
                ],
              })
            }
          />
        </label>
        <label>
          <span>Zoom</span>
          <input
            type="number"
            value={view.zoom ?? 4}
            onChange={(event) =>
              setView({ zoom: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          <span>Minimum zoom</span>
          <input
            type="number"
            value={view.minZoom ?? 0}
            onChange={(event) =>
              setView({ minZoom: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          <span>Maximum zoom</span>
          <input
            type="number"
            value={view.maxZoom ?? 19}
            onChange={(event) =>
              setView({ maxZoom: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          <span>Fit mode</span>
          <select
            value={view.fitMode ?? "data"}
            onChange={(event) =>
              setView({ fitMode: event.currentTarget.value })
            }
          >
            {["data", "allVisibleLayers", "firstLayer", "none"].map((value) => (
              <option>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Fit padding ratio</span>
          <input
            type="number"
            min="0"
            max="0.5"
            step="0.01"
            value={view.fitPadding ?? 0.08}
            onChange={(event) =>
              setView({ fitPadding: Number(event.currentTarget.value) })
            }
          />
          <small>0.08 adds 8% padding around fitted bounds.</small>
        </label>
        <label>
          <input
            type="checkbox"
            checked={view.preserveView === true}
            onChange={(event) =>
              setView({ preserveView: event.currentTarget.checked })
            }
          />{" "}
          Preserve mounted view (experimental)
        </label>
      </fieldset>
      <fieldset>
        <legend>View bookmarks</legend>
        <button
          onClick={() =>
            mutateMap((candidate) => {
              const id = uniqueBookmarkId(candidate.bookmarks ?? []);
              candidate.bookmarks = [
                ...(candidate.bookmarks ?? []),
                {
                  id,
                  label: liveViewport
                    ? "Current live preview view"
                    : "Current authored view",
                  center: liveViewport?.center ??
                    candidate.view?.center ?? [0, 0],
                  zoom: liveViewport?.zoom ?? candidate.view?.zoom ?? 4,
                },
              ];
            })
          }
        >
          Add current view
        </button>
        <p role="status">
          {liveViewport
            ? "Capturing live preview view"
            : "No live preview available; using authored view"}
        </p>
        {bookmarks.map((bookmark, index) => (
          <div class="hp-map-bookmark-edit">
            <DraftInput
              ariaLabel={`Bookmark ${index + 1} label`}
              value={bookmark.label}
              onCommit={(value) =>
                mutateMap((candidate) => {
                  if (candidate.bookmarks?.[index])
                    candidate.bookmarks[index].label = value;
                })
              }
            />
            <button
              disabled={index === 0}
              onClick={() =>
                mutateMap((candidate) => {
                  if (!candidate.bookmarks) return;
                  [candidate.bookmarks[index - 1], candidate.bookmarks[index]] =
                    [
                      candidate.bookmarks[index],
                      candidate.bookmarks[index - 1],
                    ];
                })
              }
            >
              ↑
            </button>
            <button
              onClick={() =>
                mutateMap((candidate) => {
                  candidate.bookmarks = candidate.bookmarks?.filter(
                    (item) => item.id !== bookmark.id,
                  );
                })
              }
            >
              Delete
            </button>
          </div>
        ))}
      </fieldset>
    </div>
  );
}

function defaultFieldSource(layer: MapLayerDefinition): MapAttributeSource {
  return layer.source.type === "powerbi"
    ? "powerbi"
    : layer.source.type === "arcgisFeature" && layer.source.mode === "join"
      ? "joined"
      : "service";
}

function arcGisMetadataKey(url: string, layerId?: number): string {
  const parsed = parseArcGisUrl(url);
  const normalized = parsed.serviceRootUrl ?? parsed.normalizedUrl ?? url.trim();
  return `${normalized}::${layerId ?? parsed.layerId ?? "root"}`;
}

function serviceField(
  field: NonNullable<ArcGisLayerMetadata["fields"]>[number],
): NormalizedField {
  const numeric = /Integer|Double|Single|OID|SmallInteger/i.test(field.type);
  const date = /Date/i.test(field.type);
  return {
    key: field.name,
    displayName: field.alias || field.name,
    type: numeric ? "measure" : date ? "date" : "dimension",
    dataType: numeric ? "number" : date ? "datetime" : "text",
    roles: [],
  };
}

function mapStudioExternalFieldWarnings(
  layer: MapLayerDefinition | undefined,
  metadata: ArcGisLayerMetadata | undefined,
): string[] {
  if (!layer || layer.source.type !== "arcgisFeature") return [];
  const referenced = collectArcGisQueryFields(layer, layer.source);
  if (!referenced.length) return [];
  if (!metadata)
    return [
      "Service metadata not inspected. ArcGIS service-field names are preserved and exact validation is deferred to runtime diagnostics.",
    ];
  const available = new Set((metadata.fields ?? []).map((field) => field.name));
  return referenced
    .filter((field) => !available.has(field))
    .map(
      (field) =>
        `Unknown ArcGIS service field “${field}” in the inspected layer metadata.`,
    );
}

function previewMetrics(
  result: MapJoinPreviewResult,
): Array<[string, string | number]> {
  return [
    ["Power BI / logical rows", result.powerBiRowCount],
    ["Unique Power BI keys", result.powerBiDistinctKeyCount],
    ["Blank Power BI keys", result.blankPowerBiKeyCount],
    ["Duplicate Power BI keys", result.duplicatePowerBiKeyCount],
    ["Service features", result.serviceFeatureCount],
    ["Unique service keys", result.serviceDistinctKeyCount],
    ["Blank service keys", result.blankServiceKeyCount],
    ["Duplicate service keys", result.duplicateServiceKeyCount],
    ["Cardinality", result.cardinality],
    ["Cardinality satisfied", result.cardinalityValid ? "yes" : "no"],
    ["Power BI cardinality violations", result.powerBiCardinalityViolationCount],
    ["Service cardinality violations", result.serviceCardinalityViolationCount],
    ["Matched Power BI rows", result.matchedPowerBiRowCount],
    ["Matched service features", result.matchedServiceFeatureCount],
    ["Unmatched Power BI keys", result.unmatchedPowerBiKeyCount],
    ["Unmatched service features", result.unmatchedServiceFeatureCount],
    ["Output features", result.outputFeatureCount],
  ];
}

function locationMode(layer: MapLayerDefinition): string {
  if (layer.source.type !== "powerbi") return "service";
  const bindings = layer.source.bindings ?? {};
  return bindings.geometry
    ? "geometry"
    : bindings.latitude || bindings.longitude
      ? "latitude/longitude"
      : bindings.x || bindings.y
        ? "X/Y"
        : bindings.address
          ? "address"
          : "semantic or exact-name inference";
}
function uniqueBookmarkId(
  bookmarks: NonNullable<MapComponent["bookmarks"]>,
): string {
  const used = new Set(bookmarks.map((item) => item.id));
  let id = "view",
    index = 2;
  while (used.has(id)) id = `view-${index++}`;
  return id;
}
