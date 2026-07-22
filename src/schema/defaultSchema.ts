import type {
  ChartComponent,
  DashboardComponent,
  HyperPbiSchema,
  MapComponent,
  TableComponent,
} from "./hyperpbiSchema";
import type { NormalizedData, NormalizedField } from "../data/normalizeData";

export const defaultSchema: HyperPbiSchema = {
  version: "2.0",
  title: "Operations Dashboard",
  theme: {
    mode: "light",
    density: "compact",
    primaryColor: "#206bc4",
    accentColor: "#4299e1",
    surfaceColor: "#ffffff",
    textColor: "#182433",
    radius: 8,
    cardPadding: 12,
    gap: 8,
  },
  layout: { type: "grid", columns: 12, gap: 8 },
  state: { search: "", activeTab: "overview", filters: {} },
  toolbar: [
    {
      type: "searchBox",
      id: "global-search",
      placeholder: "Search records...",
    },
    {
      type: "button",
      id: "clear-filters",
      title: "Clear filters",
      uiAction: { type: "clearFilters" },
    },
  ],
  components: [
    {
      type: "metricGrid",
      id: "record-summary",
      span: 12,
      metrics: [
        { title: "Records", aggregation: "count", format: "integer" },
      ],
    },
    {
      type: "infoCard",
      id: "getting-started",
      title: "HyperPBI is ready",
      text: "Open Studio to generate an AI prompt, import JSON, validate, and preview your dashboard.",
      span: 12,
    },
  ],
};

export const smallWorkingSchema = JSON.stringify(defaultSchema, null, 2);

function isNumeric(field: NormalizedField): boolean {
  return field.dataType === "number" || field.type === "measure";
}

function isCategory(field: NormalizedField): boolean {
  return field.type === "dimension" || field.type === "date";
}

function cloneDefault(): HyperPbiSchema {
  return JSON.parse(JSON.stringify(defaultSchema)) as HyperPbiSchema;
}

export function createDefaultSchema(data: NormalizedData): HyperPbiSchema {
  const availableFields = Object.values(data.fields).filter(
    (field) => field.type !== "schema",
  );
  if (!availableFields.length) return cloneDefault();

  const measure = availableFields.find(isNumeric);
  const category = availableFields.find(isCategory);
  const hasSpatialFields = data.map.mode !== "none";
  const components: DashboardComponent[] = [
    {
      type: "metricGrid",
      id: "record-summary",
      span: 12,
      metrics: [
        {
          title: "Records",
          aggregation: "count",
          format: "integer",
          intent: "primary",
        },
        ...(measure
          ? [
              {
                title: `Total ${measure.displayName}`,
                field: measure.key,
                aggregation: "sum" as const,
                format: measure.format,
              },
            ]
          : []),
      ],
    },
  ];

  if (measure && category) {
    components.push({
      type: "barChart",
      id: "overview-chart",
      title: `${measure.displayName} by ${category.displayName}`,
      category: category.key,
      measure: measure.key,
      aggregation: "sum",
      interaction: {
        enabled: true,
        trigger: "click",
        internalMode: "highlight",
        internalScope: "others",
        externalMode: "selection",
      },
      span: hasSpatialFields ? 7 : 12,
    } as ChartComponent);
  }

  if (hasSpatialFields) {
    components.push({
      type: "map",
      id: "overview-map",
      title: "Locations",
      view: { fitMode: "data", fitPadding: 0.08 },
      basemap: { type: "none", visible: true },
      layers: [
        {
          id: "overview-map-data",
          name: "Map data",
          source: { type: "powerbi", bindings: { ...data.map.bindings } },
          renderer: {
            type: "simple",
            symbol: {
              shape: "circle",
              fillColor: "#206bc4",
              outlineColor: "#1d4ed8",
              size: 6,
              fillOpacity: 0.7,
            },
          },
          interaction: {
            enabled: true,
            internalMode: "highlight",
            externalMode: "selection",
          },
        },
      ],
      layerPanel: { visible: true, defaultOpen: false },
      legend: { defaultOpen: false },
      span: measure && category ? 5 : 12,
    } as MapComponent);
  }

  components.push({
    type: "table",
    id: "record-details",
    title: "Record Details",
    columns: availableFields.slice(0, 12).map((field) => field.key),
    pagination: true,
    pageSize: 25,
    maxRows: 5000,
    search: true,
    interaction: {
      enabled: true,
      trigger: "click",
      internalMode: "highlight",
      internalScope: "self",
      externalMode: "selection",
      selectionMode: "replace",
      multiSelect: true,
      showSelector: true,
      clearOnSecondClick: true,
    },
    span: 12,
  } as TableComponent);

  return {
    ...cloneDefault(),
    toolbar: [
      {
        type: "searchBox",
        id: "global-search",
        placeholder: "Search all records...",
      },
      { type: "filterChips", id: "active-filters" },
      {
        type: "button",
        id: "clear-filters",
        title: "Clear filters",
        uiAction: { type: "clearFilters" },
      },
    ],
    components,
  };
}
