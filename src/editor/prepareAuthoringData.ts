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

/** The one calculation/configuration adapter used by saved runtime and authoring. */
export function prepareRuntimeData(
  data: NormalizedData,
  specification: HyperPbiSchema,
  config: HyperPbiConfig,
): PreparedRuntimeData {
  const calculated = applyCalculations(data, specification.calculations);
  if (calculated.errors.length) {
    return {
      errors: calculated.errors.map((error) => `Calculation: ${error}`),
      warnings: calculated.warnings,
    };
  }
  return {
    data: applyConfigToData(calculated.data, config),
    errors: [],
    warnings: calculated.warnings,
  };
}

/** The one logical-dataset evaluator used by runtime and authoring surfaces. */
export function prepareLogicalDatasets(
  data: NormalizedData,
  specification: HyperPbiSchema,
  lineageOptions: { sourceIndices?: number[]; sourceRowKeys?: string[] } = {},
  workspace?: DataWorkspace,
): DatasetEvaluation {
  return evaluateDatasets(
    data,
    specification.data?.datasets ?? {},
    new Map(),
    lineageOptions,
    workspace ? workspaceSourceData(workspace) : {},
  );
}

export function prepareAuthoringData(
  specificationJson: string,
  configurationJson: string,
  data: NormalizedData,
  workspace?: DataWorkspace,
): PreparedAuthoringData {
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

  const base: PreparedAuthoringData = {
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
  if (!prepared?.schema || !parsedConfig.config) return base;

  const runtime = prepareRuntimeData(
    data,
    prepared.schema,
    parsedConfig.config,
  );
  errors.push(...runtime.errors);
  warnings.push(...runtime.warnings);
  if (!runtime.data) return base;

  const datasetEvaluation = prepareLogicalDatasets(
    runtime.data,
    prepared.schema,
    {},
    workspace,
  );
  errors.push(
    ...datasetEvaluation.errors.map(
      (error) => `Dataset ${error.dataset}: ${error.message}`,
    ),
  );
  warnings.push(
    ...validateReferences(
      prepared.schema,
      runtime.data,
      workspace ? workspaceSourceData(workspace) : {},
    ),
  );

  return {
    ...base,
    configuredData: runtime.data,
    datasets: datasetEvaluation.datasets,
    datasetEvaluation,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}
