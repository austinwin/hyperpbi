import type { MapLayerDefinition } from "../../../schema/mapSchema";
import type { MapSourceContext } from "../../../maps/sources/mapSourceResolver";
import { collectArcGisQueryFields } from "../../../maps/arcgis/mapArcGisQueryFields";
import { stableMapRevision } from "./mapFeatureRevisions";

/**
 * Network/query revision. Presentation-only edits are deliberately absent so
 * they cannot abort and restart a valid ArcGIS request.
 */
export function arcGisLayerRequestRevision(
  definition: MapLayerDefinition,
  context: MapSourceContext | undefined,
): string {
  if (definition.source.type !== "arcgisFeature") return "";
  const source = definition.source;
  const joinField = definition.join?.powerBiField;
  return stableMapRevision({
    id: definition.id,
    dataset: definition.dataset,
    source: {
      type: source.type,
      url: source.url,
      layerId: source.layerId,
      definitionExpression: source.definitionExpression,
      outFields: source.outFields,
      mode: source.mode,
      useServiceRenderer: source.useServiceRenderer,
      useServiceLabels: source.useServiceLabels,
    },
    join: definition.join,
    performance: {
      maxFeatures: definition.performance?.maxFeatures,
      cacheMinutes: definition.performance?.cacheMinutes,
      viewportQuery: definition.performance?.viewportQuery,
      generalizeByZoom: definition.performance?.generalizeByZoom,
      minimumGeneralization: definition.performance?.minimumGeneralization,
      maximumGeneralization: definition.performance?.maximumGeneralization,
      requestBatchSize: definition.performance?.requestBatchSize,
    },
    filter: definition.filter,
    conditionalVisibility: definition.visibility?.conditionField
      ? definition.visibility
      : undefined,
    requiredFields: [...collectArcGisQueryFields(definition, source)].sort(),
    datasetFound: context?.datasetFound,
    joinValues:
      source.mode === "join" && joinField
        ? context?.rows.map((row) => row[joinField])
        : undefined,
    rowKeys: source.mode === "join" ? context?.rowKeys : undefined,
  });
}

export function arcGisRefreshRevision(
  definitions: readonly MapLayerDefinition[],
): string {
  return stableMapRevision(
    definitions.flatMap((definition) =>
      definition.source.type === "arcgisFeature"
        ? [
            {
              id: definition.id,
              minutes: definition.source.refreshIntervalMinutes,
            },
          ]
        : [],
    ),
  );
}

