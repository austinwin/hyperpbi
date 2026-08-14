import type { Diagnostic } from "./diagnostics";
import { geoLibreJsonSecurityError, geoLibreSecurityError } from "../components/geolibre/securityPolicy";

type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const nonblank = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
function issue(diagnostics: Diagnostic[], path: string, componentId: string | undefined, message: string, received?: unknown, code: Diagnostic["code"] = "INVALID_PROPERTY_TYPE"): void {
  diagnostics.push({ code, severity: "error", path, componentId, message, received });
}
function unknownKeys(value: Json, allowed: readonly string[], path: string, componentId: string | undefined, diagnostics: Diagnostic[]): void {
  const accepted = new Set(allowed);
  for (const key of Object.keys(value)) if (!accepted.has(key)) issue(diagnostics, `${path}/${key}`, componentId, `GeoLibre property “${key}” is not supported here.`, key, "UNKNOWN_PROPERTY");
}

export function validateGeoLibreComponentSchema(component: Json, path: string, componentId: string | undefined, datasetNames: ReadonlySet<string>): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (component.height !== undefined && (typeof component.height !== "number" || !Number.isFinite(component.height) || component.height < 280 || component.height > 2400)) issue(diagnostics, `${path}/height`, componentId, "GeoLibre height must be from 280 through 2,400 pixels.", component.height);
  if (component.heightMode !== undefined && !["fixed", "fill"].includes(String(component.heightMode))) issue(diagnostics, `${path}/heightMode`, componentId, "GeoLibre heightMode must be fixed or fill.", component.heightMode, "INVALID_ENUM_VALUE");
  if (component.capabilityProfile !== undefined && !["powerbi-embedded", "viewer"].includes(String(component.capabilityProfile))) issue(diagnostics, `${path}/capabilityProfile`, componentId, "GeoLibre capabilityProfile must be powerbi-embedded or viewer.", component.capabilityProfile, "INVALID_ENUM_VALUE");
  if (component.project !== undefined) {
    const securityError = geoLibreSecurityError(component.project);
    if (securityError) issue(diagnostics, `${path}/project`, componentId, securityError, undefined, "UNSUPPORTED_ADVANCED_OPTION");
  }
  if (component.runtime !== undefined) {
    if (!object(component.runtime)) issue(diagnostics, `${path}/runtime`, componentId, "GeoLibre runtime must be an object.", component.runtime);
    else {
      unknownKeys(component.runtime, ["channel", "theme", "panels"], `${path}/runtime`, componentId, diagnostics);
      const enums: Record<string, string[]> = { channel: ["managed", "official"], theme: ["light", "dark", "system"], panels: ["open", "collapsed"] };
      for (const [property, values] of Object.entries(enums)) if (component.runtime[property] !== undefined && !values.includes(String(component.runtime[property]))) issue(diagnostics, `${path}/runtime/${property}`, componentId, `GeoLibre runtime ${property} has an unsupported value.`, component.runtime[property], "INVALID_ENUM_VALUE");
    }
  }
  if (component.powerBi !== undefined) {
    if (!object(component.powerBi)) {
      issue(diagnostics, `${path}/powerBi`, componentId, "GeoLibre powerBi must be an object.", component.powerBi);
      return diagnostics;
    }
    unknownKeys(component.powerBi, ["layers", "selection"], `${path}/powerBi`, componentId, diagnostics);
    if (!Array.isArray(component.powerBi.layers)) issue(diagnostics, `${path}/powerBi/layers`, componentId, "GeoLibre powerBi.layers must be an array.", component.powerBi.layers);
    else {
      const ids = new Set<string>();
      component.powerBi.layers.forEach((raw, index) => {
        const layerPath = `${path}/powerBi/layers/${index}`;
        if (!object(raw)) { issue(diagnostics, layerPath, componentId, "GeoLibre Power BI layer must be an object.", raw); return; }
        unknownKeys(raw, ["id", "title", "dataset", "geometry", "fields", "initialStyle", "visible", "opacity"], layerPath, componentId, diagnostics);
        if (!nonblank(raw.id) || !/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(raw.id)) issue(diagnostics, `${layerPath}/id`, componentId, "GeoLibre Power BI layer id must be identifier-safe.", raw.id);
        else if (ids.has(raw.id)) issue(diagnostics, `${layerPath}/id`, componentId, `GeoLibre Power BI layer id “${raw.id}” is duplicated.`, raw.id, "DUPLICATE_COMPONENT_ID"); else ids.add(raw.id);
        const dataset = nonblank(raw.dataset) ? raw.dataset : nonblank(component.dataset) ? component.dataset : "powerbi";
        if (!datasetNames.has(dataset)) issue(diagnostics, `${layerPath}/dataset`, componentId, `Dataset “${dataset}” is not defined or powerbi.`, dataset, "UNKNOWN_DATASET");
        if (!object(raw.geometry)) issue(diagnostics, `${layerPath}/geometry`, componentId, "GeoLibre Power BI layer geometry is required.", raw.geometry, "MISSING_REQUIRED_PROPERTY");
        else if (raw.geometry.type === "geojson") {
          unknownKeys(raw.geometry, ["type", "field"], `${layerPath}/geometry`, componentId, diagnostics);
          if (!nonblank(raw.geometry.field)) issue(diagnostics, `${layerPath}/geometry/field`, componentId, "GeoJSON geometry field is required.", raw.geometry.field, "MISSING_REQUIRED_PROPERTY");
        } else {
          unknownKeys(raw.geometry, ["type", "latitudeField", "longitudeField"], `${layerPath}/geometry`, componentId, diagnostics);
          if (raw.geometry.type !== undefined && raw.geometry.type !== "coordinates") issue(diagnostics, `${layerPath}/geometry/type`, componentId, "Geometry type must be coordinates or geojson.", raw.geometry.type, "INVALID_ENUM_VALUE");
          for (const field of ["latitudeField", "longitudeField"]) if (!nonblank(raw.geometry[field])) issue(diagnostics, `${layerPath}/geometry/${field}`, componentId, `${field} is required.`, raw.geometry[field], "MISSING_REQUIRED_PROPERTY");
        }
        if (raw.fields !== undefined && (!Array.isArray(raw.fields) || raw.fields.some(field => !nonblank(field)))) issue(diagnostics, `${layerPath}/fields`, componentId, "GeoLibre fields must contain nonblank Field Manifest aliases.", raw.fields);
        if (raw.visible !== undefined && typeof raw.visible !== "boolean") issue(diagnostics, `${layerPath}/visible`, componentId, "GeoLibre layer visibility must be boolean.", raw.visible);
        if (raw.opacity !== undefined && (typeof raw.opacity !== "number" || !Number.isFinite(raw.opacity) || raw.opacity < 0 || raw.opacity > 1)) issue(diagnostics, `${layerPath}/opacity`, componentId, "GeoLibre layer opacity must be from 0 through 1.", raw.opacity);
        if (raw.initialStyle !== undefined && !object(raw.initialStyle)) issue(diagnostics, `${layerPath}/initialStyle`, componentId, "GeoLibre initialStyle must be an object.", raw.initialStyle);
        else if (raw.initialStyle !== undefined) {
          const securityError = geoLibreJsonSecurityError(raw.initialStyle);
          if (securityError) issue(diagnostics, `${layerPath}/initialStyle`, componentId, securityError, undefined, "UNSUPPORTED_ADVANCED_OPTION");
        }
      });
    }
    if (component.powerBi.selection !== undefined) {
      if (!object(component.powerBi.selection)) issue(diagnostics, `${path}/powerBi/selection`, componentId, "GeoLibre selection must be an object.", component.powerBi.selection);
      else {
        unknownKeys(component.powerBi.selection, ["enabled", "externalHighlight", "maxSelectionCount"], `${path}/powerBi/selection`, componentId, diagnostics);
        for (const property of ["enabled", "externalHighlight"]) if (component.powerBi.selection[property] !== undefined && typeof component.powerBi.selection[property] !== "boolean") issue(diagnostics, `${path}/powerBi/selection/${property}`, componentId, `${property} must be boolean.`, component.powerBi.selection[property]);
        const maximum = component.powerBi.selection.maxSelectionCount;
        if (maximum !== undefined && (!Number.isInteger(maximum) || Number(maximum) < 1 || Number(maximum) > 10_000)) issue(diagnostics, `${path}/powerBi/selection/maxSelectionCount`, componentId, "maxSelectionCount must be an integer from 1 through 10,000.", maximum);
      }
    }
  }
  return diagnostics;
}
