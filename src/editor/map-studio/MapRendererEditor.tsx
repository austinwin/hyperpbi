import { useState } from "preact/hooks";
import type { NormalizedField } from "../../data/normalizeData";
import type { MapLayerDefinition, MapRendererDefinition } from "../../schema/mapSchema";
import type { MapAttributeSource } from "../../maps/attributes/mapFeatureAttributes";
import type { ResolvedMapFeature, ResolvedMapSymbol } from "../../maps/model/resolvedMapTypes";
import { generateClassBreaks } from "../../maps/renderers/mapClassBreaks";
import { resolveMapLayerCapabilities } from "../../maps/model/mapLayerCapabilities";
import { DraftInput } from "./MapDraftInput";
import { FieldSelect } from "./MapFieldSelect";
import { MapColorPicker } from "./MapColorPicker";
import { MapLayerSymbol } from "./MapLayerSymbol";
type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => !!value && typeof value === "object" && !Array.isArray(value);
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const ramps = [
  { name: "Ocean", colors: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#172554"] },
  { name: "Forest", colors: ["#dcfce7", "#86efac", "#22c55e", "#15803d", "#14532d"] },
  { name: "Sunset", colors: ["#fef3c7", "#fcd34d", "#fb923c", "#ef4444", "#991b1b"] },
  { name: "Diverging", colors: ["#1d4ed8", "#93c5fd", "#f1f5f9", "#fda4af", "#be123c"] },
];
const methodLabels: Record<string, string> = { service: "Service symbology", simple: "Single symbol", icon: "Icon markers", line: "Line style", polygon: "Polygon style", uniqueValue: "Unique values", classBreaks: "Graduated colors / class breaks", continuousColor: "Continuous color", proportionalSize: "Proportional symbols", heatmap: "Heatmap", cluster: "Cluster points", densityGrid: "Density grid (experimental)" };
export function RendererEditor({
  layer,
  fieldSets,
  rows,
  geometryTypes = [],
  runtimeFeatures,
  mutate,
}: {
  layer: MapLayerDefinition;
  fieldSets: Record<MapAttributeSource, NormalizedField[]>;
  rows: Json[];
  runtimeFeatures?: ResolvedMapFeature[];
  geometryTypes?: import("../../schema/mapSchema").MapGeometryType[];
  mutate: (fn: (layer: MapLayerDefinition) => void) => boolean;
}) {
  const renderer = layer.renderer ?? { type: "simple", symbol: {} };
  const type = renderer.type;
  const defaultSource: MapAttributeSource =
    layer.source.type === "powerbi"
      ? "powerbi"
      : (layer.source.type === "arcgisFeature" && layer.source.mode === "join" || layer.source.type === "geoJson" && layer.join?.enabled)
        ? "joined"
        : "service";
  const setRenderer = (next: Json) =>
    mutate((candidate) => {
      candidate.renderer = next as unknown as MapRendererDefinition;
    });
  const initial = renderer as unknown as Json;
  const [chosenField, setChosenField] = useState(String(initial.field ?? initial.weightField ?? initial.aggregateField ?? ""));
  const [chosenSource, setChosenSource] = useState<MapAttributeSource>((initial.fieldSource as MapAttributeSource) ?? defaultSource);
  const changeType = (next: MapRendererDefinition["type"]) => {
    const numeric =
      fieldSets[chosenSource]?.find((field) => field.key === chosenField && field.dataType === "number")?.key ?? fieldSets[chosenSource]?.find((field) => field.dataType === "number")?.key ?? "";
    const any = chosenField || fieldSets[chosenSource]?.find(field=>field.dataType!=="number")?.key || fieldSets[chosenSource]?.[0]?.key || "";
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
      icon: {
        type: "icon",
        symbol: {
          shape: "icon",
          radius: 12,
          icon: { type: "builtIn", name: "location" },
          fillColor: "#2563eb",
          selectedStyle: { outlineColor: "#f59e0b", outlineWidth: 4 },
          hoverStyle: { outlineColor: "#06b6d4", outlineWidth: 3 },
        },
      },
      line: {
        type: "line",
        symbol: { shape: "line", color: "#2563eb", weight: 4, lineCap: "round", lineJoin: "round" },
      },
      polygon: {
        type: "polygon",
        symbol: { shape: "fill", fillColor: "#60a5fa", outlineColor: "#1d4ed8", fillOpacity: 0.45, weight: 2 },
      },
      uniqueValue: {
        type: "uniqueValue",
        field: any,
        fieldSource: chosenSource,
        defaultSymbol: { fillColor: "#64748b", radius: 6 },
      },
      classBreaks: {
        type: "classBreaks",
        field: numeric,
        fieldSource: chosenSource,
        method: "quantile",
        classes: 5,
        colorRamp: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#172554"],
      },
      continuousColor: {
        type: "continuousColor",
        field: numeric,
        fieldSource: chosenSource,
        minColor: "#dbeafe",
        maxColor: "#1d4ed8",
        clamp: true,
      },
      proportionalSize: {
        type: "proportionalSize",
        field: numeric,
        fieldSource: chosenSource,
        minSize: 4,
        maxSize: 24,
        color: "#2563eb",
      },
      heatmap: {
        type: "heatmap",
        weightField: numeric,
        fieldSource: chosenSource,
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
        fieldSource: chosenSource,
      },
      densityGrid: {
        type: "densityGrid",
        statistic: "count",
        cellSizePixels: 40,
        classes: 5,
        colorRamp: ["#dbeafe", "#1d4ed8"],
      },
    };
    const nextRenderer = defaults[next];
    if (next === "uniqueValue") {
      const samples = runtimeFeatures ? runtimeFeatures.slice(0, 200).map(feature => chosenSource === "powerbi" ? feature.powerBiAttributes : chosenSource === "joined" ? feature.joinedAttributes : feature.serviceAttributes) : chosenSource === "powerbi" ? rows : layer.source.type === "geoJson" && layer.source.data?.type === "FeatureCollection" ? (layer.source.data as GeoJSON.FeatureCollection).features.map(feature => feature.properties ?? {}) : [];
      nextRenderer.values = [...new Set(samples.map(row => row[any]).filter(value => value !== null && value !== undefined).map(String))].slice(0, 25).map((value, index) => ({ value, label: value, symbol: { fillColor: palette[index % palette.length], radius: 6 } }));
    }
    setChosenField(String(nextRenderer.field ?? nextRenderer.weightField ?? chosenField));
    setRenderer(nextRenderer);
  };
  const r = renderer as unknown as Json;
  const symbol = object(r.symbol) ? r.symbol : {};
  const fieldSource = String(
    r.fieldSource ?? chosenSource,
  ) as MapAttributeSource;
  const selectableFields = fieldSets[fieldSource] ?? [];
  const fieldKey = String(r.field ?? r.weightField ?? r.aggregateField ?? "");
  const numericRequired = [
    "classBreaks",
    "continuousColor",
    "proportionalSize",
    "heatmap",
  ].includes(type);
  const sourceRows: Json[] = runtimeFeatures ? runtimeFeatures.slice(0, 200).map(feature => fieldSource === "powerbi" ? feature.powerBiAttributes : fieldSource === "joined" ? feature.joinedAttributes : feature.serviceAttributes) : fieldSource === "powerbi" ? rows : fieldSource === "service" && layer.source.type === "geoJson" && layer.source.data?.type === "FeatureCollection" ? (layer.source.data as GeoJSON.FeatureCollection).features.map(feature => feature.properties ?? {}) : [];
  const values = fieldKey ? [...new Set(sourceRows.map(row => row[fieldKey]).filter(value => value !== null && value !== undefined).map(String))].slice(0, 25) : [];
  const numericValues = fieldKey ? sourceRows.map(row => row[fieldKey]).filter(value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))).map(Number) : [];
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
    const result = generateClassBreaks({ values: numericValues, classes: Number(r.classes ?? 5), method: r.method === "equalInterval" ? "equalInterval" : "quantile", colorRamp: Array.isArray(r.colorRamp) ? r.colorRamp as string[] : ramps[0].colors, resolveSymbol: symbol => symbol as ResolvedMapSymbol });
    setRenderer({ ...r, method: "manual", breaks: result.breaks.map(entry => ({ min: entry.min, max: entry.max, label: entry.label ?? `${entry.min.toLocaleString()}–${entry.max.toLocaleString()}`, symbol: entry.symbol })) });
  };
  const compatible = (method: string) => {
    if (method === "service") return resolveMapLayerCapabilities(layer.source.type).serviceRenderer;
    if (!geometryTypes.length) return true;
    const points = geometryTypes.every(type => type === "point" || type === "multipoint");
    if (["heatmap", "cluster", "densityGrid", "proportionalSize", "icon"].includes(method)) return points;
    if (method === "line") return geometryTypes.some(type => type === "polyline");
    if (method === "polygon") return geometryTypes.some(type => type === "polygon");
    return true;
  };
  const pointGeometry = !geometryTypes.length || geometryTypes.some(type => type === "point" || type === "multipoint");
  const analytic = !["service", "simple", "icon", "line", "polygon", "densityGrid"].includes(type);

  return (
    <div class="hp-map-form-grid">
      <div class="hp-map-style-heading"><MapLayerSymbol layer={layer} geometryTypes={geometryTypes} /><div><strong>Style by a field</strong><small>Choose an attribute, then a drawing method.</small></div></div>
      <label><span>Attribute source</span><select aria-label="Renderer field source" value={fieldSource} onChange={event => { const source = event.currentTarget.value as MapAttributeSource; setChosenSource(source); setChosenField(""); if (analytic) setRenderer({ ...r, fieldSource: source, [type === "heatmap" ? "weightField" : type === "cluster" ? "aggregateField" : "field"]: fieldSets[source].find(field => !numericRequired || field.dataType === "number")?.key ?? "" }); }}>
        {(["powerbi", "service", "joined"] as const).filter(source => source === fieldSource || fieldSets[source].length > 0).map(source => <option value={source}>{source === "powerbi" ? "Power BI" : source === "service" ? "Source attributes" : "Joined measures"}</option>)}
      </select></label>
      <FieldSelect label={type === "heatmap" ? "Weight field" : type === "cluster" ? "Aggregate field" : "Field or measure"} ariaLabel={type === "heatmap" ? "weight field" : type === "cluster" ? "aggregate field" : "field"} value={analytic ? fieldKey : chosenField} fields={selectableFields} numeric={analytic && numericRequired} onChange={value => { setChosenField(value); if (analytic) setRenderer({ ...r, [type === "heatmap" ? "weightField" : type === "cluster" ? "aggregateField" : "field"]: value }); }} />
      <label>
        <span>Drawing method</span>
        <select
          aria-label="Renderer type"
          value={type}
          onChange={(event) =>
            changeType(
              event.currentTarget.value as MapRendererDefinition["type"],
            )
          }
        >
          {Object.entries(methodLabels).filter(([value]) => compatible(value) || value === type).map(([value, label]) => <option value={value} disabled={!compatible(value)}>{label}</option>)}
        </select>
      </label>
      {!compatible(type) && <p role="note">The current renderer is preserved. Choose a method compatible with the loaded geometry.</p>}
      {["classBreaks", "continuousColor", "uniqueValue"].includes(type) && <fieldset class="hp-map-style-palettes"><legend>Color palette</legend>{ramps.map(ramp => <button type="button" aria-label={`Apply ${ramp.name} palette`} title={ramp.name} onClick={() => {
        if (type === "continuousColor") setRenderer({ ...r, minColor: ramp.colors[0], maxColor: ramp.colors.at(-1) });
        else if (type === "classBreaks") setRenderer({ ...r, colorRamp: ramp.colors, ...(breaks.length ? { breaks: breaks.map((entry, index) => ({ ...entry, symbol: { ...(object(entry.symbol) ? entry.symbol : {}), fillColor: ramp.colors[index % ramp.colors.length] } })) } : {}) });
        else setRenderer({ ...r, values: uniqueClasses.map((entry, index) => ({ ...entry, symbol: { ...(object(entry.symbol) ? entry.symbol : {}), fillColor: ramp.colors[index % ramp.colors.length] } })) });
      }}>{ramp.colors.map(color => <i style={{ background: color }} />)}<span>{ramp.name}</span></button>)}</fieldset>}
      {type === "densityGrid" && (
        <p class="hp-map-experimental">
          Experimental: bounded density-grid preview; capability limitations remain
          visible in diagnostics.
        </p>
      )}
      {["simple", "icon", "line", "polygon"].includes(type) && (
        <>
          {pointGeometry && !["line", "polygon"].includes(type) && <label>
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
              <option value="icon">icon</option>
              {!geometryTypes.length && <><option value="line">line</option><option value="fill">fill</option></>}
            </select>
          </label>}
          <MapColorPicker label={type === "line" ? "Line color" : "Fill color"} value={String(object(r.symbol) ? r.symbol.fillColor ?? r.symbol.color ?? "#2563eb" : "#2563eb")} opacity={Number(object(r.symbol) ? r.symbol.fillOpacity ?? 1 : 1)} onChange={value => setRenderer({ ...r, symbol: { ...(object(r.symbol) ? r.symbol : {}), [type === "line" ? "color" : "fillColor"]: value } })} onOpacity={value => setRenderer({ ...r, symbol: { ...(object(r.symbol) ? r.symbol : {}), fillOpacity: value } })} />
          <label><span>Opacity</span><input aria-label="Symbol opacity" type="range" min="0" max="1" step="0.05" value={Number(symbol.fillOpacity ?? 1)} onChange={event => setRenderer({ ...r, symbol: { ...symbol, [type === "line" ? "opacity" : "fillOpacity"]: Number(event.currentTarget.value) } })} /></label>
          <MapColorPicker label="Outline" value={String(object(r.symbol) ? r.symbol.outlineColor ?? r.symbol.color ?? "#1e40af" : "#1e40af")} onChange={value => setRenderer({ ...r, symbol: { ...(object(r.symbol) ? r.symbol : {}), outlineColor: value } })} />
          <label><span>Outline width</span><input type="number" min="0" max="12" step="0.5" value={Number(object(r.symbol) ? r.symbol.outlineWidth ?? r.symbol.weight ?? 1 : 1)} onChange={event => setRenderer({ ...r, symbol: { ...(object(r.symbol) ? r.symbol : {}), outlineWidth: Number(event.currentTarget.value), weight: Number(event.currentTarget.value) } })} /></label>
          {pointGeometry && !["line", "polygon"].includes(type) && <label>
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
          </label>}
        </>
      )}
      {type === "icon" && (
        <fieldset>
          <legend>Rich icon</legend>
          <label>
            <span>Built-in icon</span>
            <select
              aria-label="Built-in map icon"
              value={object(symbol.icon) ? String(symbol.icon.name ?? "location") : "location"}
              onChange={(event) => setRenderer({
                ...r,
                symbol: { ...symbol, shape: "icon", icon: { type: "builtIn", name: event.currentTarget.value } },
              })}
            >
              {["location", "pin", "home", "user", "alert", "activity", "map", "database"].map((name) => <option value={name}>{name}</option>)}
            </select>
          </label>
          <FieldSelect label="Icon mapping field" value={String(symbol.iconField ?? "")} fields={selectableFields} onChange={(value) => setRenderer({ ...r, symbol: { ...symbol, iconField: value || undefined, iconFieldSource: fieldSource } })} />
          <DraftInput
            label="Icon mapping JSON"
            value={object(symbol.iconMap) ? JSON.stringify(symbol.iconMap) : ""}
            onCommit={(value) => {
              let iconMap: Json | undefined;
              try { iconMap = value ? JSON.parse(value) as Json : undefined; } catch { return; }
              setRenderer({ ...r, symbol: { ...symbol, iconMap } });
            }}
          />
          <FieldSelect label="Rotation field" value={String(symbol.rotationField ?? "")} fields={selectableFields} numeric onChange={(value) => setRenderer({ ...r, symbol: { ...symbol, rotationField: value || undefined, rotationFieldSource: fieldSource } })} />
          <FieldSelect label="Size field" value={String(symbol.sizeField ?? "")} fields={selectableFields} numeric onChange={(value) => setRenderer({ ...r, symbol: { ...symbol, sizeField: value || undefined, sizeFieldSource: fieldSource } })} />
          <FieldSelect label="Color field" value={String(symbol.colorField ?? "")} fields={selectableFields} onChange={(value) => setRenderer({ ...r, symbol: { ...symbol, colorField: value || undefined, colorFieldSource: fieldSource } })} />
          <DraftInput label="Marker text" value={String(symbol.markerText ?? "")} onCommit={(value) => setRenderer({ ...r, symbol: { ...symbol, markerText: value || undefined } })} />
          <DraftInput label="Marker badge" value={String(symbol.badge ?? "")} onCommit={(value) => setRenderer({ ...r, symbol: { ...symbol, badge: value || undefined } })} />
        </fieldset>
      )}
      {["line", "polygon"].includes(type) && (
        <fieldset>
          <legend>Stroke and fill</legend>
          <label><span>Dash style</span><select value={String(symbol.dashStyle ?? "solid")} onChange={(event) => setRenderer({ ...r, symbol: { ...symbol, dashStyle: event.currentTarget.value } })}>
            <option value="solid">Solid</option><option value="dash">Dash</option><option value="dot">Dot</option><option value="dashDot">Dash-dot</option>
          </select></label>
          <label><span>Line cap</span><select value={String(symbol.lineCap ?? "round")} onChange={(event) => setRenderer({ ...r, symbol: { ...symbol, lineCap: event.currentTarget.value } })}>
            <option value="round">Round</option><option value="butt">Butt</option><option value="square">Square</option>
          </select></label>
          <label><span>Line join</span><select value={String(symbol.lineJoin ?? "round")} onChange={(event) => setRenderer({ ...r, symbol: { ...symbol, lineJoin: event.currentTarget.value } })}>
            <option value="round">Round</option><option value="miter">Miter</option><option value="bevel">Bevel</option>
          </select></label>
        </fieldset>
      )}
      {["simple", "icon", "line", "polygon"].includes(type) && (
        <details class="hp-map-style-advanced">
          <summary>Interaction styles</summary>
          <DraftInput label="Selected outline color" value={object(symbol.selectedStyle) ? String(symbol.selectedStyle.outlineColor ?? "") : ""} onCommit={(value) => setRenderer({ ...r, symbol: { ...symbol, selectedStyle: { ...(object(symbol.selectedStyle) ? symbol.selectedStyle : {}), outlineColor: value || undefined } } })} />
          <DraftInput label="Hover outline color" value={object(symbol.hoverStyle) ? String(symbol.hoverStyle.outlineColor ?? "") : ""} onCommit={(value) => setRenderer({ ...r, symbol: { ...symbol, hoverStyle: { ...(object(symbol.hoverStyle) ? symbol.hoverStyle : {}), outlineColor: value || undefined } } })} />
          <label><span>Dimmed opacity</span><input type="number" min="0" max="1" step="0.05" value={Number(symbol.dimmedOpacity ?? 0.2)} onChange={(event) => setRenderer({ ...r, symbol: { ...symbol, dimmedOpacity: Number(event.currentTarget.value) } })} /></label>
        </details>
      )}
      {type === "uniqueValue" && (
        <fieldset>
          <legend>Unique-value classes</legend>
          <button disabled={!values.length} title={!values.length ? "Load the layer and choose a field first" : "Replace classes with sampled values"}
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
              <MapColorPicker label={`Class ${index + 1} color`} value={String(object(entry.symbol) ? entry.symbol.fillColor ?? "#2563eb" : "#2563eb")} onChange={value => { const next = copy(uniqueClasses); next[index].symbol = { ...(object(next[index].symbol) ? next[index].symbol : {}), fillColor: value }; setRenderer({ ...r, values: next }); }} />
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
              disabled={breaks.length > 0}
              title={breaks.length ? "Custom breaks are active. Use automatic classes to replace them." : undefined}
              onChange={(event) =>
                setRenderer({ ...r, method: event.currentTarget.value })
              }
            >
              <option value="manual">manual</option>
              <option value="equalInterval">equal interval</option>
              <option value="quantile">quantile</option>
            </select>
          </label>
          {breaks.length > 0 && <button type="button" onClick={() => setRenderer({ ...r, breaks: undefined, method: "quantile" })}>Use automatic classes</button>}
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
          <button disabled={!numericValues.length} title={!numericValues.length ? "Load numeric Power BI or inline GeoJSON values first" : "Create editable classes from the current method"} onClick={generateBreaks}>
            Generate editable manual breaks
          </button>
          {breaks.map((entry, index) => (
            <div class="hp-map-class-edit">
              <MapColorPicker label={`Break ${index + 1} color`} value={String(object(entry.symbol) ? entry.symbol.fillColor ?? "#2563eb" : "#2563eb")} onChange={value => { const next = copy(breaks); next[index].symbol = { ...(object(next[index].symbol) ? next[index].symbol : {}), fillColor: value }; setRenderer({ ...r, breaks: next }); }} />
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
      {type === "continuousColor" && <><MapColorPicker label="Minimum color" value={String(r.minColor ?? "#dbeafe")} onChange={value => setRenderer({ ...r, minColor: value })} /><MapColorPicker label="Maximum color" value={String(r.maxColor ?? "#1d4ed8")} onChange={value => setRenderer({ ...r, maxColor: value })} /></>}
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
      {type === "heatmap" && (
        <fieldset>
          <legend>Heatmap canvas</legend>
          <label><span>Radius</span><input type="number" min="4" max="120" value={Number(r.radius ?? 25)} onChange={(event) => setRenderer({ ...r, radius: Number(event.currentTarget.value) })} /></label>
          <label><span>Blur</span><input type="number" min="0" max="80" value={Number(r.blur ?? 18)} onChange={(event) => setRenderer({ ...r, blur: Number(event.currentTarget.value) })} /></label>
          <label><span>Minimum opacity</span><input type="number" min="0" max="1" step="0.05" value={Number(r.minOpacity ?? 0.05)} onChange={(event) => setRenderer({ ...r, minOpacity: Number(event.currentTarget.value) })} /></label>
          <label><span>Maximum intensity</span><input type="number" min="0" value={r.maxIntensity === undefined ? "" : Number(r.maxIntensity)} onChange={(event) => setRenderer({ ...r, maxIntensity: event.currentTarget.value ? Number(event.currentTarget.value) : undefined })} /></label>
          <label><span>Normalization</span><select value={String(r.normalization ?? "global")} onChange={(event) => setRenderer({ ...r, normalization: event.currentTarget.value })}><option value="global">Global</option><option value="viewport">Visible viewport</option></select></label>
          <label><input type="checkbox" checked={r.interactivePoints !== false} onChange={(event) => setRenderer({ ...r, interactivePoints: event.currentTarget.checked })} /> Keep transparent selectable source points</label>
        </fieldset>
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
          <small>Preview uses up to 200 loaded features. Automatic classification uses the full runtime layer.</small>
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
