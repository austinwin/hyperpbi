import { applyCalculations } from "../calculations/calculationEngine";
import { parseConfig, type HyperPbiConfig } from "../config/hyperpbiConfig";
import { applyConfigToData } from "../data/applyConfig";
import {
  evaluateDatasets,
  type DatasetEvaluation,
  type DatasetResult,
} from "../data/datasets";
import type { DatasetSchemaEvaluation } from "../data/datasetSchema";
import type { NormalizedData } from "../data/normalizeData";
import type { DataWorkspace } from "../data/dataWorkspace";
import { workspaceSourceData } from "../data/dataWorkspace";
import { remoteSourcePlaceholderData } from "../data/remoteDataSources";
import {
  prepareSpecification,
  type PreparedSpecification,
} from "../schema/prepareSpecification";
import type { Diagnostic } from "../schema/diagnostics";
import type { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { validateReferences } from "../schema/validateReferences";
import { parseJson } from "../utils/safeJson";

export interface PreparedRuntimeData {
  data?: NormalizedData;
  errors: string[];
  warnings: string[];
}

export interface PreparedAuthoringData {
  specification?: HyperPbiSchema;
  config?: HyperPbiConfig;
  configuredData?: NormalizedData;
  datasets?: Map<string, DatasetResult>;
  datasetEvaluation?: DatasetEvaluation;
  datasetSchemas?: DatasetSchemaEvaluation;
  aliases: Record<string, string>;
  diagnostics: Diagnostic[];
  errors: string[];
  warnings: string[];
  ownerByRuntimeId?: Record<string, string>;
  componentPathById?: Record<string, string>;
  preparedSpecification?: PreparedSpecification;
}

interface RuntimeCacheEntry {
  fields: NormalizedData["fields"];
  rowKeys: string[];
  calculationKey: string;
  calculated: ReturnType<typeof applyCalculations>;
  mapKey?: string;
  configured?: NormalizedData;
}
const runtimeCache = new WeakMap<NormalizedData["rows"], RuntimeCacheEntry>();

/** Reuse row calculations across presentation edits and host resize updates. */
export function prepareRuntimeData(
  data: NormalizedData,
  specification: HyperPbiSchema,
  config: HyperPbiConfig,
): PreparedRuntimeData {
  const calculationKey = JSON.stringify(specification.calculations ?? {});
  let entry = runtimeCache.get(data.rows);
  if (!entry || entry.fields !== data.fields || entry.rowKeys !== data.rowKeys || entry.calculationKey !== calculationKey) {
    const started = performance.now();
    entry = {
      fields: data.fields, rowKeys: data.rowKeys, calculationKey,
      calculated: applyCalculations(data, specification.calculations),
    };
    runtimeCache.set(data.rows, entry);
    data.performance?.record("calculations", started);
  }
  const calculated = entry.calculated;
  if (calculated.errors.length) {
    return { errors: calculated.errors.map(error => `Calculation: ${error}`), warnings: calculated.warnings };
  }
  const mapKey = JSON.stringify([config.bindings?.map, config.providers?.geocoder?.cacheEntries]);
  if (!entry.configured || entry.mapKey !== mapKey) {
    entry.configured = applyConfigToData(calculated.data, config);
    entry.mapKey = mapKey;
  }
  const configured = entry.configured;
  return {
    data: configured.loadStatus === data.loadStatus ? configured : { ...configured, loadStatus: data.loadStatus },
    errors: [],
    warnings: calculated.warnings,
  };
}

/** The one logical-dataset evaluator used by runtime and authoring surfaces. */
export function prepareLogicalDatasets(
  data: NormalizedData,
  specification: HyperPbiSchema,
  lineageOptions: { sourceIndices?: number[]; sourceRowKeys?: string[]; hostData?: NormalizedData } = {},
  workspace?: DataWorkspace,
  cache = new Map<string, DatasetResult>(),
  lazy = false,
): DatasetEvaluation {
  return evaluateDatasets(
    data,
    specification.data?.datasets ?? {},
    cache,
    lineageOptions,
    { ...remoteSourcePlaceholderData(specification), ...(workspace ? workspaceSourceData(workspace) : {}) },
    lazy,
    lineageOptions.hostData,
  );
}

export function validateAuthoringData(
  specificationJson: string,
  configurationJson: string,
  data: NormalizedData,
  workspace?: DataWorkspace,
): PreparedAuthoringData {
  const started = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsedConfig = parseConfig(configurationJson);
  errors.push(...parsedConfig.errors);
  const parsedSpecification = parseJson(specificationJson);
  if (parsedSpecification.error)
    errors.push(`Specification JSON: ${parsedSpecification.error}`);

  const aliases = parsedConfig.config?.fields?.aliases ?? {};
  const prepared = parsedSpecification.value
      ? prepareSpecification(parsedSpecification.value, data, {
        repair: false,
        aliasOverrides: aliases,
        sourceData: workspace ? workspaceSourceData(workspace) : {},
      })
    : undefined;
  if (prepared) {
    if (!prepared.schema)
      errors.push(...prepared.errors.map((error) => `Specification: ${error}`));
    warnings.push(...prepared.warnings);
  }

  data.performance?.record("validation", started);
  return {
    specification: prepared?.schema,
    config: parsedConfig.config,
    aliases,
    diagnostics: prepared?.diagnostics ?? [],
    datasetSchemas: prepared?.datasets,
    errors,
    warnings,
    ownerByRuntimeId: prepared?.ownerByRuntimeId,
    componentPathById: prepared?.componentPathById,
    preparedSpecification: prepared,
  };
}

export function evaluateAuthoringData(
  base: PreparedAuthoringData,
  data: NormalizedData,
  workspace?: DataWorkspace,
  mode: "runtime" | "lazy" | "all" = "all",
  cache?: Map<string, DatasetResult>,
): PreparedAuthoringData {
  const { specification, config } = base;
  if (!specification || !config) return base;
  const runtime = prepareRuntimeData(data, specification, config);
  const errors = [...base.errors, ...runtime.errors];
  const warnings = [...base.warnings, ...runtime.warnings];
  if (!runtime.data) return { ...base, errors, warnings };
  const datasetEvaluation = mode === "runtime" ? undefined : prepareLogicalDatasets(
    runtime.data, specification, {}, workspace, cache, mode === "lazy",
  );
  errors.push(...(datasetEvaluation?.errors ?? []).map(error => `Dataset ${error.dataset}: ${error.message}`));
  warnings.push(...validateReferences(specification, runtime.data, workspace ? workspaceSourceData(workspace) : {}));
  return {
    ...base, configuredData: runtime.data, datasets: datasetEvaluation?.datasets, datasetEvaluation,
    errors: Array.from(new Set(errors)), warnings: Array.from(new Set(warnings)),
  };
}

export function prepareAuthoringData(
  specificationJson: string,
  configurationJson: string,
  data: NormalizedData,
  workspace?: DataWorkspace,
): PreparedAuthoringData {
  return evaluateAuthoringData(validateAuthoringData(specificationJson, configurationJson, data, workspace), data, workspace);
}
