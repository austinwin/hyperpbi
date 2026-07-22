#!/usr/bin/env node

/**
 * Temporary developer utility for converting a legacy dashboard schema 1.0 JSON
 * file into the canonical schema 2.0 contract. This file is intentionally kept
 * outside src/ and must never be imported by the PBIVIZ production runtime.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function installTypeScriptLoader() {
  const ts = require("typescript");
  const compile = (module, filename) => {
    const source = fs.readFileSync(filename, "utf8");
    const output = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        esModuleInterop: true,
        resolveJsonModule: true,
        jsx: ts.JsxEmit.React,
        jsxFactory: "h",
      },
    }).outputText;
    module._compile(output, filename);
  };
  require.extensions[".ts"] = compile;
  require.extensions[".tsx"] = compile;
}

function usage() {
  return "Usage: npm run schema:migrate-v1 -- <input.json> <output.json> [--overwrite-input]";
}

function record(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function slug(value) {
  const normalized = String(value ?? "component")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "component";
}

function convertUiAction(action, actionValue, componentId, errors) {
  if (action === "clearFilters") return { type: "clearFilters" };
  if (action === "setTab") {
    if (!actionValue) {
      errors.push(`${componentId}: action "setTab" requires actionValue for a safe conversion.`);
      return undefined;
    }
    return { type: "setTab", target: "mainTabs", value: actionValue };
  }
  errors.push(`${componentId}: unsupported legacy button action "${String(action)}"; convert it to uiAction manually.`);
  return undefined;
}

function convertLegacyInteraction(component) {
  const hasLegacy =
    component.internal !== undefined ||
    component.external !== undefined ||
    component.selectable !== undefined ||
    component.showSelector !== undefined ||
    (component.type === "table" && component.selectionMode !== undefined);
  if (!hasLegacy) return;

  const interaction = record(component.interaction) ? { ...component.interaction } : {};
  const selectable = component.selectable === true || component.showSelector === true;
  const tableMode = component.type === "table" ? component.selectionMode : undefined;
  interaction.enabled ??= selectable || component.internal === true || component.external !== false;
  if (component.internal === false) interaction.internalMode ??= "none";
  else if (tableMode === "highlight") interaction.internalMode ??= "highlight";
  else if (tableMode === "filter" || selectable || component.internal === true)
    interaction.internalMode ??= "filter";
  if (component.external === false) interaction.externalMode ??= "none";
  else if (component.external === true || selectable) interaction.externalMode ??= "selection";
  if (component.type === "table" && tableMode === "filter") interaction.internalScope ??= "self";
  if (component.showSelector !== undefined) interaction.showSelector ??= component.showSelector === true;
  else if (selectable) interaction.showSelector ??= true;
  component.interaction = interaction;
  delete component.internal;
  delete component.external;
  delete component.selectable;
  delete component.showSelector;
  if (component.type === "table") delete component.selectionMode;
}

function convertLegacyMap(component) {
  const settings = record(component.settings) ? component.settings : {};
  const oldStyle = record(component.style) && [
    "defaultPointColor", "colorMode", "radius", "minRadius", "maxRadius",
    "lineWeight", "fillOpacity", "opacity",
  ].some((key) => key in component.style) ? component.style : undefined;
  const oldPopup = record(component.popup) ? component.popup : undefined;

  if (!Array.isArray(component.layers)) {
    const layerId = `${component.id}-powerbi`;
    const symbol = {
      shape: "circle",
      fillColor: oldStyle?.defaultPointColor ?? "#2563eb",
      outlineColor: oldStyle?.defaultPointColor ?? "#1d4ed8",
      size: oldStyle?.radius ?? oldStyle?.minRadius ?? 7,
      fillOpacity: oldStyle?.fillOpacity ?? 0.7,
      opacity: oldStyle?.opacity ?? 1,
      weight: oldStyle?.lineWeight ?? 1,
    };
    component.layers = [{
      id: layerId,
      name: component.title ?? "Power BI locations",
      source: {
        type: "powerbi",
        bindings: { latitude: "latitude", longitude: "longitude" },
      },
      renderer: { type: "simple", symbol },
    }];
  }

  for (const layer of component.layers) {
    if (!record(layer)) continue;
    if (record(layer.source) && record(layer.source.bindings)) {
      const bindings = layer.source.bindings;
      if (bindings.category !== undefined && bindings.layer === undefined)
        bindings.layer = bindings.category;
      if (bindings.label !== undefined && bindings.tooltip === undefined)
        bindings.tooltip = [bindings.label];
      delete bindings.category;
      delete bindings.label;
    }
    if (record(layer.interaction) && layer.interaction.trigger !== undefined && layer.interaction.trigger !== "click")
      layer.interaction.trigger = "click";
  }
  if (record(component.toolbar)) delete component.toolbar.fullscreenWithinVisual;

  if (!component.view && settings.fitBounds !== undefined)
    component.view = { fitMode: settings.fitBounds === false ? "none" : "data" };
  if (!component.basemap && typeof settings.basemap === "string")
    component.basemap = { type: settings.basemap === "none" ? "none" : "openStreetMap" };
  if (!component.featureDetails && oldPopup)
    component.featureDetails = { mode: "auto" };

  delete component.settings;
  delete component.popup;
  if (oldStyle) delete component.style;
}

function migrateSpecification(input) {
  const errors = [];
  if (!record(input)) return { errors: ["The input must be a JSON object."] };
  if (input.version !== "1.0")
    return { errors: [`Expected dashboard schema version "1.0"; received ${JSON.stringify(input.version)}.`] };

  const output = structuredClone(input);
  output.version = "2.0";
  const usedIds = new Set();
  let sequence = 0;

  const uniqueId = (preferred, type) => {
    const base = slug(preferred || `${type}-${++sequence}`);
    let candidate = base;
    let suffix = 2;
    while (usedIds.has(candidate)) candidate = `${base}-${suffix++}`;
    usedIds.add(candidate);
    return candidate;
  };

  const walkList = (items) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!record(item) || typeof item.type !== "string") continue;
      item.id = uniqueId(item.id, item.type);
      if (item.type === "drawer" || item.type === "filterDrawer") {
        item.type = "offcanvas";
      } else if (item.type === "stepper") {
        item.type = "collapsible";
        delete item.direction;
        delete item.columns;
        delete item.gap;
      }

      if ((item.type === "button" || item.type === "buttonGroup") && typeof item.action === "string" && !item.uiAction)
        item.uiAction = convertUiAction(item.action, item.actionValue, item.id, errors);
      delete item.action;
      delete item.actionValue;
      if (item.type === "buttonGroup" && Array.isArray(item.items)) {
        for (const button of item.items) {
          if (!record(button) || typeof button.action !== "string" || button.uiAction) continue;
          button.uiAction = convertUiAction(button.action, button.actionValue, `${item.id}/${button.id ?? "item"}`, errors);
          delete button.action;
          delete button.actionValue;
        }
      }

      if (item.type === "table") delete item.engine;
      convertLegacyInteraction(item);
      if (item.type === "map") convertLegacyMap(item);

      if (item.type === "accordion" && Array.isArray(item.children) && !Array.isArray(item.items)) {
        const itemId = `${item.id}-item`;
        item.items = [{ id: itemId, title: item.title ?? "Section", children: item.children }];
        if (item.defaultOpen === true) item.defaultOpenItems = [itemId];
        delete item.children;
      }
      if (item.type === "accordion") {
        delete item.direction;
        delete item.columns;
        delete item.gap;
        delete item.collapsible;
        delete item.defaultOpen;
      }
      if (item.type === "tabs" && Array.isArray(item.tabs)) {
        for (const tab of item.tabs) {
          if (!record(tab)) continue;
          tab.children = tab.children ?? tab.components ?? tab.content ?? [];
          delete tab.components;
          delete tab.content;
          walkList(tab.children);
        }
      }
      for (const key of ["children", "footer"]) walkList(item[key]);
      if (record(item.chart) && typeof item.chart.type === "string") {
        if (item.chart.aggregation === "count" && item.chart.measure === undefined)
          item.chart.measure = item.chart.category;
        walkList([item.chart]);
      }
      if (item.type === "accordion" && Array.isArray(item.items))
        for (const section of item.items) if (record(section)) walkList(section.children);
    }
  };

  for (const key of ["components", "toolbar", "leftPanel", "rightPanel"]) walkList(output[key]);
  if (record(output.definitions))
    for (const definition of Object.values(output.definitions))
      if (record(definition) && typeof definition.type === "string") walkList([definition]);

  return errors.length ? { errors } : { value: output, errors: [] };
}

async function main() {
  const overwriteInput = process.argv.includes("--overwrite-input");
  const positional = process.argv.slice(2).filter((arg) => arg !== "--overwrite-input");
  if (positional.length !== 2) throw new Error(usage());
  const inputPath = path.resolve(positional[0]);
  const outputPath = path.resolve(positional[1]);
  if (inputPath === outputPath && !overwriteInput)
    throw new Error("Refusing to overwrite the input file. Pass --overwrite-input explicitly or choose a different output path.");
  if (!fs.existsSync(inputPath)) throw new Error(`Input file does not exist: ${inputPath}`);

  let input;
  try {
    input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not parse input JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const converted = migrateSpecification(input);
  if (!converted.value) throw new Error(`Conversion failed:\n- ${converted.errors.join("\n- ")}`);

  installTypeScriptLoader();
  const { validateSchema } = require(path.resolve("src/schema/validateSchema.ts"));
  const validation = validateSchema(converted.value);
  if (!validation.valid)
    throw new Error(`Converted schema 2.0 is invalid:\n- ${validation.errors.join("\n- ")}`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(converted.value, null, 2)}\n`, "utf8");
  process.stdout.write(`Converted dashboard schema 1.0 to 2.0: ${outputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
