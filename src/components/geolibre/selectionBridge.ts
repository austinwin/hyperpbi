import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import type { RenderContextValue } from "../../render/RenderContext";
import type { GeoLibreComponent, GeoLibreSelectionEvent } from "./types";
import type { GeoLibrePowerBiBridgeResult } from "./powerBiBridge";

export interface ResolvedGeoLibreSelection {
  sourceRowIndices: number[];
  sourceRowKeys: string[];
  acceptedFeatureIds: string[];
  truncatedFeatureCount: number;
}

export function resolveGeoLibreSelection(
  event: GeoLibreSelectionEvent,
  bridge: GeoLibrePowerBiBridgeResult,
  maximum = 1_000,
): ResolvedGeoLibreSelection {
  const identities = event.layerId
    ? bridge.identityByLayer.get(event.layerId)
    : undefined;
  const requested = Array.from(new Set(event.featureIds));
  const accepted = requested.slice(0, Math.max(0, maximum));
  const selected = accepted
    .map((id) => identities?.get(id))
    .filter((identity): identity is NonNullable<typeof identity> => Boolean(identity));
  return {
    sourceRowIndices: Array.from(
      new Set(selected.flatMap((identity) => identity.sourceRowIndices)),
    ).sort((left, right) => left - right),
    sourceRowKeys: Array.from(
      new Set(selected.flatMap((identity) => identity.sourceRowKeys)),
    ),
    acceptedFeatureIds: selected.map((identity) => identity.featureId),
    truncatedFeatureCount: Math.max(0, requested.length - accepted.length),
  };
}

/** Submit GeoLibre's complete current selection as one identity-safe replace. */
export function commitGeoLibreSelection(
  component: GeoLibreComponent,
  event: GeoLibreSelectionEvent,
  bridge: GeoLibrePowerBiBridgeResult,
  context: RenderContextValue,
): ResolvedGeoLibreSelection | undefined {
  if (component.powerBi?.selection?.enabled === false) return undefined;
  if (event.layerId && !bridge.identityByLayer.has(event.layerId)) return undefined;
  const maximum = component.powerBi?.selection?.maxSelectionCount ?? 1_000;
  const resolved = resolveGeoLibreSelection(event, bridge, maximum);
  const sourceRows = context.powerBiSourceRows ?? context.sourceRows;
  const sourceRowKeys = context.powerBiSourceRowKeys ?? context.sourceRowKeys;
  const interactionContext: RenderContextValue = {
    ...context,
    sourceRows,
    sourceRowKeys,
    datasetLineage: undefined,
    interactionIndexSpace: "powerbi",
    interactionUsesSourceIdentity: true,
    selectExternal: context.selectSourceRows ?? context.selectExternal,
  };
  const policy = {
    ...resolveInteractionPolicy(component, context.config, "dataPoint"),
    // GeoLibre reports the full selected feature set, not a click delta.
    selectionMode: "replace" as const,
  };
  executeComponentInteraction(
    policy,
    createInteractionPayload(component, {
      rowIndices: resolved.sourceRowIndices,
      sourceRowKeys,
      field: policy.field,
      mapLayerId: event.layerId ?? undefined,
      mapFeatureId:
        resolved.acceptedFeatureIds.length === 1
          ? resolved.acceptedFeatureIds[0]
          : undefined,
    }),
    interactionContext,
    { trigger: "click" },
  );
  return resolved;
}
