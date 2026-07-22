<!-- GENERATED FILE. Edit canonical metadata and run npm run docs:generate. -->
# HyperPBI component catalog reference

**Project:** [hyperpbi.com](https://hyperpbi.com) · **Source:** [austinwin/hyperpbi](https://github.com/austinwin/hyperpbi)

HyperPBI currently defines **81 component types across 12 categories**. This file is generated from the canonical explicit `componentDescriptors.ts` registry and `patternRegistry.ts`; strict schema 2.0 validator maps are derived from those descriptors.

For the complete authoring model, see the [specification reference](hyperpbi-spec-reference.md), [data model](data-model.md), [interactions](interactions.md), and [SVG reference](svg-visuals.md).

## HyperPBI 2.0 shared contract

Every 2.0 component requires `type` and a globally unique stable `id` matching `^[A-Za-z][A-Za-z0-9_-]{0,99}$`. `dataset` selects a named logical dataset; omission selects `powerbi`. Field references use Field Manifest aliases during authoring and are resolved to canonical runtime keys during preparation.

Allowed shared properties:

`type`, `id`, `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

The three behavior systems are independent: `uiAction` changes interface state; `interaction` controls universal internal/Power BI data behavior; `interactions` maps safe component-specific events to allowlisted payloads. None is mandatory on every component.

External filtering requires a field whose metadata identifies a real model column (`sourceTable` and `sourceColumn`). True measures, dataset-derived fields, and dataset metrics cannot directly filter the Power BI model. Exact identity selection can still use source-row lineage when available.

## Maturity governance

Maturity is explicit per canonical descriptor and independent of authoring complexity. Stable means the descriptor records renderer, strict schema, applicable field traversal, Inspector controls, valid example, responsive and empty-state behavior, accessibility guidance, focused tests, and documentation evidence. Beta is implemented but misses one or more stable requirements. Experimental is intentionally unstable and advanced. AI includes beta only for explicit/advanced authoring and experimental only when explicitly requested.

## Application patterns

Patterns are 2.0 authoring constructs expanded before strict component validation. Generated child IDs are deterministic derivatives of the pattern ID.

### kpi-row

Required: `id`, `fields`

Optional: `title`, `dataset`, `variant`, `span`

Field properties: `fields`

```json
{
  "type": "pattern",
  "pattern": "kpi-row",
  "id": "summary",
  "fields": [
    "revenue",
    "orders"
  ]
}
```

### trend-and-breakdown

Required: `id`, `date`, `measure`, `breakdown`

Optional: `title`, `dataset`, `aggregation`

Field properties: `date`, `measure`, `breakdown`

```json
{
  "type": "pattern",
  "pattern": "trend-and-breakdown",
  "id": "performance",
  "date": "month",
  "measure": "completed",
  "breakdown": "status"
}
```

### record-explorer

Required: `id`, `columns`, `details`

Optional: `title`, `dataset`, `pageSize`

Field properties: `columns`

```json
{
  "type": "pattern",
  "pattern": "record-explorer",
  "id": "records",
  "columns": [
    "recordId",
    "status"
  ],
  "details": {
    "titleField": "recordId",
    "fields": [
      "status"
    ]
  }
}
```

### map-and-details

Required: `id`

Optional: `title`, `dataset`, `height`, `details`

Field properties: —

```json
{
  "type": "pattern",
  "pattern": "map-and-details",
  "id": "locations",
  "title": "Locations"
}
```

## Universal interaction reference

```json
{
  "enabled": true,
  "trigger": "auto",
  "internalMode": "highlight",
  "internalScope": "self",
  "externalMode": "auto",
  "field": "__field_key__",
  "operator": "=",
  "value": "__value__",
  "selectionMode": "replace",
  "multiSelect": true,
  "showSelector": false,
  "clearOnSecondClick": true
}
```

`externalMode: "auto"` resolves to `filter` for controls and `selection` for data-point/custom components. See [interactions](interactions.md) for lineage and field-origin restrictions.

## UI actions

`clearFilters`, `setTab`, `setState`, `toggleState`, `toggleSidebar`, `openOverlay`, `closeOverlay`, `toggleOverlay`, `setStep`, `nextStep`, `previousStep`, `showToast`, `dismissToast`, `scrollTo`, and `refresh` (a safe no-op because Power BI owns refresh).

## Layout

_9 components_

### `grid` — Grid

**Status:** stable

**Level:** recommended

**Recommended use:** Responsive 12-column dashboard sections

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Related:** `flex`, `section`

```json
{
  "type": "grid",
  "id": "grid",
  "title": "Responsive grid",
  "span": 12,
  "className": "hp-example-grid",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-grid { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "direction": "column",
  "columns": 12,
  "gap": 12,
  "children": [
    {
      "type": "kpi",
      "id": "kpi",
      "title": "Total records",
      "span": 4,
      "className": "hp-example-kpi",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-kpi { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "field": "__field_key__",
      "aggregation": "count",
      "format": "integer",
      "intent": "primary"
    },
    {
      "type": "text",
      "id": "supporting_text",
      "span": 12,
      "text": "Supporting content",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      }
    }
  ]
}
```

### `flex` — Flex row/column

**Status:** stable

**Level:** standard

**Recommended use:** Compact toolbars and flowing groups

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Related:** `grid`, `toolbar`

```json
{
  "type": "flex",
  "id": "flex",
  "title": "Flexible content row",
  "span": 12,
  "className": "hp-example-flex",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-flex { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "direction": "row",
  "columns": 12,
  "gap": 10,
  "children": [
    {
      "type": "select",
      "id": "select",
      "title": "Status",
      "span": 4,
      "className": "hp-example-select",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-select { min-width: 0; }",
      "interaction": {
        "enabled": true,
        "trigger": "auto",
        "internalMode": "filter",
        "internalScope": "all",
        "externalMode": "auto",
        "field": "__field_key__",
        "operator": "=",
        "selectionMode": "replace",
        "multiSelect": true,
        "showSelector": false,
        "clearOnSecondClick": false
      },
      "field": "__field_key__",
      "label": "Status",
      "placeholder": "Choose status",
      "defaultValue": ""
    },
    {
      "type": "searchBox",
      "id": "searchBox",
      "title": "Search",
      "span": 4,
      "className": "hp-example-searchBox",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-searchBox { min-width: 0; }",
      "interaction": {
        "enabled": true,
        "trigger": "auto",
        "internalMode": "filter",
        "internalScope": "all",
        "externalMode": "auto",
        "field": "__field_key__",
        "operator": "contains",
        "selectionMode": "replace",
        "multiSelect": true,
        "showSelector": false,
        "clearOnSecondClick": false
      },
      "field": "__field_key__",
      "label": "Search",
      "placeholder": "Choose search",
      "defaultValue": ""
    }
  ]
}
```

### `split` — Split layout

**Status:** beta

**Level:** standard

**Recommended use:** Two coordinated content regions

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `sizes`, `minSizes`, `maxSizes`, `resizable`, `persist`, `storageKey`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `maxSizes`, `minHeight`, `minSizes`, `order`, `persist`, `props`, `resizable`, `responsive`, `size`, `sizes`, `slots`, `span`, `storageKey`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Related:** `leftPanel`, `rightPanel`

```json
{
  "type": "split",
  "id": "split",
  "title": "Split workspace",
  "span": 12,
  "className": "hp-example-split",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-split { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "direction": "row",
  "columns": 12,
  "gap": 12,
  "children": [
    {
      "type": "section",
      "id": "section",
      "title": "Summary",
      "span": 5,
      "className": "hp-example-section",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-section { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "direction": "column",
      "columns": 12,
      "gap": 8,
      "children": [
        {
          "type": "text",
          "id": "supporting_text",
          "span": 12,
          "text": "Supporting content",
          "interaction": {
            "enabled": false,
            "internalMode": "none",
            "externalMode": "none"
          }
        }
      ]
    },
    {
      "type": "section",
      "id": "section_2",
      "title": "Details",
      "span": 7,
      "className": "hp-example-section",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-section { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "direction": "column",
      "columns": 12,
      "gap": 8,
      "children": [
        {
          "type": "text",
          "id": "supporting_text_2",
          "span": 12,
          "text": "Supporting content",
          "interaction": {
            "enabled": false,
            "internalMode": "none",
            "externalMode": "none"
          }
        }
      ]
    }
  ]
}
```

### `section` — Section

**Status:** stable

**Level:** recommended

**Recommended use:** Named content grouping

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Related:** `card`, `collapsible`

```json
{
  "type": "section",
  "id": "section",
  "title": "Operations section",
  "span": 12,
  "className": "hp-example-section",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-section { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "direction": "column",
  "columns": 12,
  "gap": 8,
  "children": [
    {
      "type": "text",
      "id": "section_content",
      "span": 12,
      "text": "Supporting content",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      }
    }
  ],
  "collapsible": true,
  "defaultCollapsed": false
}
```

### `toolbar` — Toolbar

**Status:** stable

**Level:** standard

**Recommended use:** Compact controls above content

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Related:** `flex`

```json
{
  "type": "toolbar",
  "id": "toolbar",
  "title": "Dashboard toolbar",
  "span": 12,
  "className": "hp-example-toolbar",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-toolbar { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "direction": "row",
  "columns": 12,
  "gap": 6,
  "children": [
    {
      "type": "select",
      "id": "select",
      "title": "Status",
      "span": 4,
      "className": "hp-example-select",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-select { min-width: 0; }",
      "interaction": {
        "enabled": true,
        "trigger": "auto",
        "internalMode": "filter",
        "internalScope": "all",
        "externalMode": "auto",
        "field": "__field_key__",
        "operator": "=",
        "selectionMode": "replace",
        "multiSelect": true,
        "showSelector": false,
        "clearOnSecondClick": false
      },
      "field": "__field_key__",
      "label": "Status",
      "placeholder": "Choose status",
      "defaultValue": ""
    },
    {
      "type": "button",
      "id": "button",
      "title": "Reset",
      "span": 2,
      "className": "hp-example-button",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-button { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "label": "Reset filters",
      "uiAction": {
        "type": "clearFilters"
      }
    }
  ]
}
```

### `leftPanel` — Left panel

**Status:** beta

**Level:** standard

**Recommended use:** Persistent filter rail

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Related:** `rightPanel`, `offcanvas`

```json
{
  "type": "leftPanel",
  "id": "leftPanel",
  "title": "Filter panel",
  "span": 12,
  "className": "hp-example-leftPanel",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-leftPanel { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "direction": "column",
  "columns": 12,
  "gap": 8,
  "children": [
    {
      "type": "select",
      "id": "select",
      "title": "Category",
      "span": 4,
      "className": "hp-example-select",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-select { min-width: 0; }",
      "interaction": {
        "enabled": true,
        "trigger": "auto",
        "internalMode": "filter",
        "internalScope": "all",
        "externalMode": "auto",
        "field": "__field_key__",
        "operator": "=",
        "selectionMode": "replace",
        "multiSelect": true,
        "showSelector": false,
        "clearOnSecondClick": false
      },
      "field": "__field_key__",
      "label": "Category",
      "placeholder": "Choose category",
      "defaultValue": ""
    },
    {
      "type": "dateRange",
      "id": "dateRange",
      "title": "Date range",
      "span": 4,
      "className": "hp-example-dateRange",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-dateRange { min-width: 0; }",
      "interaction": {
        "enabled": true,
        "trigger": "auto",
        "internalMode": "filter",
        "internalScope": "all",
        "externalMode": "auto",
        "field": "__field_key__",
        "operator": "between",
        "selectionMode": "replace",
        "multiSelect": true,
        "showSelector": false,
        "clearOnSecondClick": false
      },
      "field": "__field_key__",
      "label": "Date range",
      "placeholder": "Choose date range",
      "defaultValue": ""
    }
  ],
  "width": 280,
  "collapsible": true,
  "defaultCollapsed": false
}
```

### `rightPanel` — Right panel

**Status:** beta

**Level:** standard

**Recommended use:** Persistent details rail

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Related:** `leftPanel`, `offcanvas`

```json
{
  "type": "rightPanel",
  "id": "rightPanel",
  "title": "Detail panel",
  "span": 12,
  "className": "hp-example-rightPanel",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-rightPanel { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "direction": "column",
  "columns": 12,
  "gap": 8,
  "children": [
    {
      "type": "detailPanel",
      "id": "detailPanel",
      "title": "Selected record",
      "span": 12,
      "className": "hp-example-detailPanel",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-detailPanel { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "selectedRow": true,
      "emptyText": "Select a record",
      "groups": [
        {
          "title": "Details",
          "fields": [
            "__field_key__"
          ]
        }
      ]
    }
  ],
  "width": 340,
  "collapsible": true,
  "defaultCollapsed": false
}
```

### `spacer` — Spacer

**Status:** beta

**Level:** advanced

**Recommended use:** Small intentional separation

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `height`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "spacer",
  "id": "spacer",
  "title": "Vertical spacing",
  "span": 12,
  "className": "hp-example-spacer",
  "hidden": false,
  "style": {
    "height": 24,
    "minHeight": 24
  },
  "css": ".hp-example-spacer { display: block; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  }
}
```

### `divider` — Divider

**Status:** beta

**Level:** standard

**Recommended use:** Subtle visual separation

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "divider",
  "id": "divider",
  "title": "Section divider",
  "span": 12,
  "className": "hp-example-divider",
  "hidden": false,
  "style": {
    "marginTop": 8,
    "marginBottom": 8
  },
  "css": ".hp-example-divider { border-color: #d8dee8; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  }
}
```

## Controls

_12 components_

### `searchBox` — Search box

**Status:** stable

**Level:** recommended

**Recommended use:** Search all visible row values

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "searchBox",
  "id": "searchBox",
  "title": "Search records",
  "span": 4,
  "className": "hp-example-searchBox",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-searchBox { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "contains",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Search records",
  "placeholder": "Search all records…",
  "defaultValue": "",
  "filter": {
    "operator": "contains",
    "value": ""
  }
}
```

### `textInput` — Text input

**Status:** beta

**Level:** standard

**Recommended use:** Text field filtering

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "textInput",
  "id": "textInput",
  "title": "Contains text",
  "span": 4,
  "className": "hp-example-textInput",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-textInput { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "contains",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Contains text",
  "placeholder": "Enter text…",
  "defaultValue": "",
  "filter": {
    "operator": "contains",
    "value": ""
  }
}
```

### `numberInput` — Number input

**Status:** beta

**Level:** standard

**Recommended use:** Numeric thresholds

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "numberInput",
  "id": "numberInput",
  "title": "Minimum amount",
  "span": 4,
  "className": "hp-example-numberInput",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-numberInput { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Minimum amount",
  "placeholder": "Choose minimum amount",
  "defaultValue": 0,
  "min": 0,
  "max": 1000000,
  "step": 100,
  "filter": {
    "operator": ">=",
    "value": 0
  }
}
```

### `slider` — Slider

**Status:** beta

**Level:** standard

**Recommended use:** Bounded numeric filtering

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "slider",
  "id": "slider",
  "title": "Minimum score",
  "span": 4,
  "className": "hp-example-slider",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-slider { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Minimum score",
  "placeholder": "Choose minimum score",
  "defaultValue": 50,
  "min": 0,
  "max": 100,
  "step": 5,
  "filter": {
    "operator": ">=",
    "value": 50
  }
}
```

### `select` — Select

**Status:** stable

**Level:** recommended

**Recommended use:** Compact categorical filtering

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Uses native <select> element.

```json
{
  "type": "select",
  "id": "select",
  "title": "Status",
  "span": 4,
  "className": "hp-example-select",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-select { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Status",
  "placeholder": "Choose status",
  "defaultValue": "",
  "options": [
    {
      "label": "Open",
      "value": "Open"
    },
    {
      "label": "Closed",
      "value": "Closed"
    }
  ],
  "filter": {
    "operator": "=",
    "value": ""
  }
}
```

### `multiSelect` — Multi-select

**Status:** stable

**Level:** standard

**Recommended use:** Filtering by several categories

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "multiSelect",
  "id": "multiSelect",
  "title": "Statuses",
  "span": 4,
  "className": "hp-example-multiSelect",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-multiSelect { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "in",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Statuses",
  "placeholder": "Choose statuses",
  "defaultValue": [],
  "multiple": true,
  "options": [
    {
      "label": "Open",
      "value": "Open"
    },
    {
      "label": "Closed",
      "value": "Closed"
    }
  ],
  "filter": {
    "operator": "in",
    "value": []
  }
}
```

### `segmentedControl` — Segmented control

**Status:** beta

**Level:** recommended

**Recommended use:** Two to seven high-frequency choices

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Related:** `buttonGroup`

```json
{
  "type": "segmentedControl",
  "id": "segmentedControl",
  "title": "Priority",
  "span": 4,
  "className": "hp-example-segmentedControl",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-segmentedControl { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Priority",
  "placeholder": "Choose priority",
  "defaultValue": "",
  "options": [
    {
      "label": "High",
      "value": "High"
    },
    {
      "label": "Medium",
      "value": "Medium"
    },
    {
      "label": "Low",
      "value": "Low"
    }
  ],
  "filter": {
    "operator": "=",
    "value": ""
  }
}
```

### `toggle` — Toggle

**Status:** beta

**Level:** standard

**Recommended use:** Boolean state or view switch

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "toggle",
  "id": "toggle",
  "title": "Active records only",
  "span": 4,
  "className": "hp-example-toggle",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-toggle { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Active records only",
  "placeholder": "Choose active records only",
  "defaultValue": false,
  "filter": {
    "operator": "=",
    "value": true
  }
}
```

### `button` — Button

**Status:** stable

**Level:** standard

**Recommended use:** Clear filters or open a view

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "button",
  "id": "button",
  "title": "Reset filters",
  "span": 2,
  "className": "hp-example-button",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-button { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "change",
    "internalMode": "none",
    "internalScope": "all",
    "externalMode": "none",
    "selectionMode": "replace",
    "multiSelect": false,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "label": "Reset filters",
  "uiAction": {
    "type": "clearFilters"
  }
}
```

### `buttonGroup` — Button group

**Status:** beta

**Level:** standard

**Recommended use:** Small action groups

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "buttonGroup",
  "id": "buttonGroup",
  "title": "View options",
  "span": 4,
  "className": "hp-example-buttonGroup",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-buttonGroup { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "change",
    "internalMode": "none",
    "internalScope": "self",
    "externalMode": "none",
    "selectionMode": "replace",
    "multiSelect": false,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "label": "View",
  "defaultValue": "summary",
  "buttons": [
    {
      "id": "summary",
      "label": "Summary",
      "value": "summary",
      "action": "setTab"
    },
    {
      "id": "details",
      "label": "Details",
      "value": "details",
      "action": "setTab"
    }
  ]
}
```

### `filterChips` — Filter chips

**Status:** beta

**Level:** recommended

**Recommended use:** Visible applied-filter summary

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "filterChips",
  "id": "filterChips",
  "title": "Applied filters",
  "span": 12,
  "className": "hp-example-filterChips",
  "hidden": false,
  "style": {
    "display": "flex",
    "gap": 6,
    "minWidth": 0
  },
  "css": ".hp-example-filterChips { flex-wrap: wrap; }",
  "interaction": {
    "enabled": true,
    "trigger": "change",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  }
}
```

### `dateRange` — Date range

**Status:** beta

**Level:** standard

**Recommended use:** Start/end date filtering

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "dateRange",
  "id": "dateRange",
  "title": "Reporting period",
  "span": 4,
  "className": "hp-example-dateRange",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-dateRange { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "between",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Reporting period",
  "placeholder": "Choose reporting period",
  "defaultValue": [
    "2026-01-01",
    "2026-12-31"
  ],
  "filter": {
    "operator": "between",
    "value": [
      "2026-01-01",
      "2026-12-31"
    ]
  }
}
```

## Navigation

_4 components_

### `tabs` — Tabs

**Status:** stable

**Level:** recommended

**Recommended use:** Separate overview, map, and details

**Required properties:** `type`, `id`, `tabs`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `tabs`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `tabs`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "tabs",
  "id": "tabs",
  "title": "Dashboard views",
  "span": 12,
  "className": "hp-example-tabs",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-tabs { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "click",
    "internalMode": "none",
    "internalScope": "self",
    "externalMode": "none",
    "selectionMode": "replace",
    "multiSelect": false,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "tabs": [
    {
      "id": "overview",
      "title": "Overview",
      "children": [
        {
          "type": "text",
          "id": "overview_content",
          "span": 12,
          "text": "Supporting content",
          "interaction": {
            "enabled": false,
            "internalMode": "none",
            "externalMode": "none"
          }
        }
      ]
    },
    {
      "id": "details",
      "title": "Details",
      "children": [
        {
          "type": "table",
          "id": "table",
          "title": "Records",
          "span": 12,
          "className": "hp-example-table",
          "hidden": false,
          "style": {
            "minWidth": 0
          },
          "css": ".hp-example-table { min-width: 0; }",
          "interaction": {
            "enabled": false,
            "internalMode": "none",
            "externalMode": "none"
          },
          "columns": [
            "__field_key__"
          ],
          "pagination": true,
          "pageSize": 25
        }
      ]
    }
  ]
}
```

### `collapsible` — Collapsible section

**Status:** stable

**Level:** standard

**Recommended use:** Hide secondary content

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Related:** `accordion`

```json
{
  "type": "collapsible",
  "id": "collapsible",
  "title": "Optional details",
  "span": 12,
  "className": "hp-example-collapsible",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-collapsible { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "direction": "column",
  "columns": 12,
  "gap": 8,
  "children": [
    {
      "type": "text",
      "id": "collapsible_content",
      "span": 12,
      "text": "Supporting content",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      }
    }
  ],
  "collapsible": true,
  "defaultOpen": true
}
```

### `accordion` — Accordion

**Status:** beta

**Level:** standard

**Recommended use:** Compact grouped filters

**Required properties:** `type`, `id`, `items`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `multiple`, `defaultOpenItems`, `items`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `defaultOpenItems`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `items`, `minHeight`, `multiple`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Supports arrow-key navigation between headers. Enter/Space toggles. Proper aria-expanded.

**Related:** `collapsible`

```json
{
  "type": "accordion",
  "id": "accordion",
  "title": "Filter groups",
  "multiple": true,
  "defaultOpenItems": [
    "filters"
  ],
  "items": [
    {
      "id": "filters",
      "title": "Filters",
      "children": [
        {
          "type": "select",
          "id": "accordion_status",
          "title": "Status",
          "field": "__field_key__",
          "interaction": {
            "enabled": true,
            "trigger": "change",
            "internalMode": "filter",
            "externalMode": "auto"
          }
        }
      ]
    }
  ],
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  }
}
```

### `steps` — Steps

**Status:** beta

**Level:** standard

**Recommended use:** Sequential workflow progression

**Required properties:** `type`, `id`, `items`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `orientation`, `activeStep`, `stateKey`, `clickable`, `items`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `activeStep`, `ariaLabel`, `aspectRatio`, `className`, `clickable`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `items`, `minHeight`, `order`, `orientation`, `props`, `responsive`, `size`, `slots`, `span`, `stateKey`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Related:** `tracking`

```json
{
  "type": "steps",
  "id": "steps",
  "title": "Workflow progress",
  "span": 12,
  "className": "hp-example-steps",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-steps { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "orientation": "horizontal",
  "activeStep": "review",
  "stateKey": "workflow_steps",
  "clickable": true,
  "items": [
    {
      "id": "draft",
      "label": "Draft",
      "description": "Initial preparation"
    },
    {
      "id": "review",
      "label": "Review",
      "description": "Quality check"
    },
    {
      "id": "complete",
      "label": "Complete",
      "description": "Finalized"
    }
  ]
}
```

## Display

_9 components_

### `kpi` — KPI card

**Status:** stable

**Level:** recommended

**Recommended use:** One decision-critical number

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `format`, `intent`, `metrics`, `value`, `text`, `items`, `max`, `selectedRow`, `groups`, `emptyText`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `emptyText`, `field`, `format`, `groups`, `heightMode`, `hidden`, `icon`, `id`, `intent`, `interaction`, `interactions`, `items`, `max`, `metrics`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "kpi",
  "id": "kpi",
  "title": "Total value",
  "span": 3,
  "className": "hp-example-kpi",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-kpi { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "field": "__field_key__",
  "aggregation": "sum",
  "format": "currency",
  "intent": "primary"
}
```

### `metricGrid` — Metric grid

**Status:** stable

**Level:** recommended

**Recommended use:** Three to six summary metrics

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `format`, `intent`, `metrics`, `value`, `text`, `items`, `max`, `selectedRow`, `groups`, `emptyText`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `emptyText`, `field`, `format`, `groups`, `heightMode`, `hidden`, `icon`, `id`, `intent`, `interaction`, `interactions`, `items`, `max`, `metrics`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "metricGrid",
  "id": "metricGrid",
  "title": "Executive metrics",
  "span": 12,
  "className": "hp-example-metricGrid",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-metricGrid { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "metrics": [
    {
      "title": "Records",
      "aggregation": "count",
      "format": "integer",
      "intent": "primary",
      "prefix": "",
      "suffix": ""
    },
    {
      "title": "Total value",
      "field": "__measure_field_key__",
      "aggregation": "sum",
      "format": "currency",
      "intent": "success",
      "prefix": "$",
      "suffix": ""
    },
    {
      "title": "Open records",
      "field": "__field_key__",
      "aggregation": "countWhere",
      "where": {
        "field": "__category_field_key__",
        "equals": "Open"
      },
      "format": "integer",
      "intent": "warning",
      "metric": "open_records"
    }
  ]
}
```

### `infoCard` — Info card

**Status:** beta

**Level:** standard

**Recommended use:** Short explanatory or record content

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `format`, `intent`, `metrics`, `value`, `text`, `items`, `max`, `selectedRow`, `groups`, `emptyText`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `emptyText`, `field`, `format`, `groups`, `heightMode`, `hidden`, `icon`, `id`, `intent`, `interaction`, `interactions`, `items`, `max`, `metrics`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "infoCard",
  "id": "infoCard",
  "title": "Record summary",
  "span": 4,
  "className": "hp-example-infoCard",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-infoCard { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "field": "__field_key__",
  "aggregation": "first",
  "format": "",
  "intent": "neutral",
  "text": "Context and guidance for this dashboard.",
  "value": "Optional static fallback"
}
```

### `statusBadge` — Status badge

**Status:** stable

**Level:** standard

**Recommended use:** Compact status labeling

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `format`, `intent`, `metrics`, `value`, `text`, `items`, `max`, `selectedRow`, `groups`, `emptyText`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `emptyText`, `field`, `format`, `groups`, `heightMode`, `hidden`, `icon`, `id`, `intent`, `interaction`, `interactions`, `items`, `max`, `metrics`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "statusBadge",
  "id": "statusBadge",
  "title": "Current status",
  "span": 3,
  "className": "hp-example-statusBadge",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-statusBadge { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "field": "__field_key__",
  "aggregation": "first",
  "format": "",
  "intent": "success",
  "value": "Active"
}
```

### `progressBar` — Progress bar

**Status:** stable

**Level:** standard

**Recommended use:** Progress toward a target

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `format`, `intent`, `metrics`, `value`, `text`, `items`, `max`, `selectedRow`, `groups`, `emptyText`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `emptyText`, `field`, `format`, `groups`, `heightMode`, `hidden`, `icon`, `id`, `intent`, `interaction`, `interactions`, `items`, `max`, `metrics`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "progressBar",
  "id": "progressBar",
  "title": "Completion",
  "span": 4,
  "className": "hp-example-progressBar",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-progressBar { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "field": "__measure_field_key__",
  "aggregation": "first",
  "format": "percent",
  "intent": "primary",
  "value": 72,
  "max": 100
}
```

### `alert` — Alert

**Status:** stable

**Level:** standard

**Recommended use:** Actionable exception banner

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `format`, `intent`, `metrics`, `value`, `text`, `items`, `max`, `selectedRow`, `groups`, `emptyText`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `emptyText`, `field`, `format`, `groups`, `heightMode`, `hidden`, `icon`, `id`, `intent`, `interaction`, `interactions`, `items`, `max`, `metrics`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "alert",
  "id": "alert",
  "title": "Attention required",
  "span": 12,
  "className": "hp-example-alert",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-alert { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "field": "__field_key__",
  "aggregation": "count",
  "format": "integer",
  "intent": "warning",
  "text": "Some records require review.",
  "value": "Review"
}
```

### `statList` — Stat list

**Status:** beta

**Level:** standard

**Recommended use:** Compact label/value summary

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `format`, `intent`, `metrics`, `value`, `text`, `items`, `max`, `selectedRow`, `groups`, `emptyText`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `emptyText`, `field`, `format`, `groups`, `heightMode`, `hidden`, `icon`, `id`, `intent`, `interaction`, `interactions`, `items`, `max`, `metrics`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "statList",
  "id": "statList",
  "title": "Record statistics",
  "span": 4,
  "className": "hp-example-statList",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-statList { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "items": [
    {
      "label": "Owner",
      "field": "__field_key__",
      "format": ""
    },
    {
      "label": "Amount",
      "field": "__measure_field_key__",
      "format": "currency"
    },
    {
      "label": "Target",
      "value": 100,
      "format": "integer"
    }
  ]
}
```

### `detailPanel` — Detail panel

**Status:** stable

**Level:** recommended

**Recommended use:** Selected-row fields, groups, badges, and copyable values

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `format`, `intent`, `metrics`, `value`, `text`, `items`, `max`, `selectedRow`, `groups`, `emptyText`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `emptyText`, `field`, `format`, `groups`, `heightMode`, `hidden`, `icon`, `id`, `intent`, `interaction`, `interactions`, `items`, `max`, `metrics`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "detailPanel",
  "id": "detailPanel",
  "title": "Selected record",
  "span": 5,
  "className": "hp-example-detailPanel",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-detailPanel { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "selectedRow": true,
  "emptyText": "Select a table row, chart point, map feature, or timeline event.",
  "groups": [
    {
      "title": "Overview",
      "fields": [
        {
          "field": "__field_key__",
          "label": "Record",
          "badge": true,
          "copyable": true,
          "format": ""
        },
        {
          "field": "__category_field_key__",
          "label": "Category"
        }
      ]
    },
    {
      "title": "Measures",
      "fields": [
        {
          "field": "__measure_field_key__",
          "label": "Amount",
          "format": "currency",
          "copyable": true
        }
      ]
    }
  ],
  "items": [
    {
      "label": "Record",
      "field": "__field_key__"
    },
    {
      "label": "Amount",
      "field": "__measure_field_key__",
      "format": "currency"
    }
  ]
}
```

### `timeline` — Timeline / activity feed

**Status:** beta

**Level:** recommended

**Recommended use:** Operational history and status events

**Required properties:** `type`, `id`, `dateField`, `titleField`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `dateField`, `titleField`, `categoryField`, `statusField`, `descriptionField`, `sortDirection`, `limit`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `categoryField`, `className`, `css`, `data`, `dataset`, `dateField`, `descriptionField`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `limit`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `sortDirection`, `span`, `statusField`, `style`, `subtitle`, `title`, `titleField`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "timeline",
  "id": "timeline",
  "title": "Activity timeline",
  "span": 6,
  "className": "hp-example-timeline",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-timeline { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "dateField": "__date_field_key__",
  "titleField": "__field_key__",
  "categoryField": "__category_field_key__",
  "statusField": "__status_field_key__",
  "descriptionField": "__description_field_key__",
  "sortDirection": "desc",
  "limit": 50
}
```

## Primitives

_13 components_

### `card` — Card

**Status:** stable

**Level:** recommended

**Recommended use:** Professional content container with header

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `padding`, `header`, `actions`, `footer`, `status`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `actions`, `ariaLabel`, `aspectRatio`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `footer`, `gap`, `header`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `padding`, `props`, `responsive`, `size`, `slots`, `span`, `status`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Related:** `section`, `collapsible`

```json
{
  "type": "card",
  "id": "card",
  "title": "Analysis card",
  "span": 6,
  "className": "hp-example-card",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-card { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "header": {
    "title": "Performance",
    "subtitle": "Current period",
    "icon": "chart"
  },
  "padding": "compact",
  "status": {
    "intent": "primary",
    "position": "top"
  },
  "children": [
    {
      "type": "text",
      "id": "card_content",
      "span": 12,
      "text": "Supporting content",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      }
    }
  ],
  "footer": [
    {
      "type": "text",
      "id": "text",
      "title": "Footer note",
      "span": 12,
      "className": "hp-example-text",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-text { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "text": "Updated from Power BI"
    }
  ]
}
```

### `icon` — Icon

**Status:** stable

**Level:** standard

**Recommended use:** Safe SVG icon from bundled registry

**Required properties:** `type`, `id`, `icon`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Accessibility:** Use ariaLabel when the icon is the only visible content.

```json
{
  "type": "icon",
  "id": "icon",
  "title": "Information icon",
  "span": 1,
  "className": "hp-example-icon",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-icon { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "icon": "info",
  "size": "md",
  "ariaLabel": "Information"
}
```

### `iconButton` — Icon button

**Status:** stable

**Level:** standard

**Recommended use:** Compact accessible icon action

**Required properties:** `type`, `id`, `icon`, `ariaLabel`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** ariaLabel is required. Tooltips provide additional context.

```json
{
  "type": "iconButton",
  "id": "iconButton",
  "title": "Refresh dashboard",
  "span": 1,
  "className": "hp-example-iconButton",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-iconButton { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "icon": "refresh",
  "ariaLabel": "Refresh data",
  "variant": "ghost",
  "size": "sm",
  "uiAction": {
    "type": "showToast",
    "message": "Dashboard refreshed",
    "intent": "primary",
    "durationMs": 3000
  }
}
```

### `avatar` — Avatar

**Status:** beta

**Level:** standard

**Recommended use:** Identity indicator with initials

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `initials`, `label`, `shape`, `status`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `initials`, `interaction`, `interactions`, `label`, `minHeight`, `order`, `props`, `responsive`, `shape`, `size`, `slots`, `span`, `status`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "avatar",
  "id": "avatar",
  "title": "User avatar",
  "span": 1,
  "className": "hp-example-avatar",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-avatar { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "initials": "JD",
  "label": "Jane Doe",
  "size": "md",
  "shape": "circle",
  "status": "online"
}
```

### `avatarGroup` — Avatar group

**Status:** beta

**Level:** standard

**Recommended use:** Stacked identity indicators

**Required properties:** `type`, `id`, `avatars`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `avatars`, `max`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `avatars`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `max`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "avatarGroup",
  "id": "avatarGroup",
  "title": "Team members",
  "span": 3,
  "className": "hp-example-avatarGroup",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-avatarGroup { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "avatars": [
    {
      "type": "avatar",
      "id": "avatar",
      "title": "Member 1",
      "span": 12,
      "className": "hp-example-avatar",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-avatar { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "initials": "JD",
      "size": "sm",
      "shape": "circle"
    },
    {
      "type": "avatar",
      "id": "avatar_2",
      "title": "Member 2",
      "span": 12,
      "className": "hp-example-avatar",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-avatar { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "initials": "AK",
      "size": "sm",
      "shape": "circle"
    }
  ],
  "max": 5
}
```

### `listGroup` — List group

**Status:** stable

**Level:** recommended

**Recommended use:** Compact row list with badges and actions

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `items`, `source`, `primaryField`, `secondaryField`, `badgeField`, `valueField`, `maxItems`, `compact`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `badgeField`, `className`, `compact`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `items`, `maxItems`, `minHeight`, `order`, `primaryField`, `props`, `responsive`, `secondaryField`, `size`, `slots`, `source`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `valueField`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Related:** `dataGrid`

```json
{
  "type": "listGroup",
  "id": "listGroup",
  "title": "Recent items",
  "span": 12,
  "className": "hp-example-listGroup",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-listGroup { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "source": "rows",
  "primaryField": "__field_key__",
  "secondaryField": "__category_field_key__",
  "badgeField": "__status_field_key__",
  "maxItems": 10,
  "compact": false
}
```

### `dataGrid` — Data grid

**Status:** stable

**Level:** recommended

**Recommended use:** Record detail label/value layout

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `items`, `source`, `columns`, `selectedRow`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `columns`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `items`, `minHeight`, `order`, `props`, `responsive`, `selectedRow`, `size`, `slots`, `source`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Related:** `listGroup`, `detailPanel`

```json
{
  "type": "dataGrid",
  "id": "dataGrid",
  "title": "Record details",
  "span": 12,
  "className": "hp-example-dataGrid",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-dataGrid { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "selectedRow": true,
  "columns": 2,
  "items": [
    {
      "label": "Record",
      "field": "__field_key__",
      "copyable": true
    },
    {
      "label": "Status",
      "field": "__category_field_key__",
      "badge": true
    },
    {
      "label": "Value",
      "field": "__measure_field_key__",
      "format": "currency"
    }
  ]
}
```

### `countUp` — Count-up

**Status:** beta

**Level:** standard

**Recommended use:** Animated number with prefix/suffix

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `aggregation`, `value`, `prefix`, `suffix`, `duration`, `format`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `duration`, `field`, `format`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `prefix`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `suffix`, `title`, `tooltip`, `type`, `uiAction`, `value`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Accessibility:** Respects prefers-reduced-motion. Animation disabled under reduced motion.

```json
{
  "type": "countUp",
  "id": "countUp",
  "title": "Total value",
  "span": 3,
  "className": "hp-example-countUp",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-countUp { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "field": "__measure_field_key__",
  "aggregation": "sum",
  "prefix": "$",
  "suffix": "",
  "duration": 2000,
  "format": "currency"
}
```

### `tracking` — Tracking

**Status:** beta

**Level:** standard

**Recommended use:** Compact stage progress display

**Required properties:** `type`, `id`, `stages`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `stages`, `activeStage`, `stageField`, `orientation`, `compact`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `activeStage`, `ariaLabel`, `aspectRatio`, `className`, `compact`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `orientation`, `props`, `responsive`, `size`, `slots`, `span`, `stageField`, `stages`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Related:** `steps`

```json
{
  "type": "tracking",
  "id": "tracking",
  "title": "Approval progress",
  "span": 12,
  "className": "hp-example-tracking",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-tracking { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "stages": [
    {
      "id": "submitted",
      "label": "Submitted",
      "state": "complete"
    },
    {
      "id": "review",
      "label": "In Review",
      "state": "current"
    },
    {
      "id": "approved",
      "label": "Approved",
      "state": "upcoming"
    }
  ],
  "activeStage": "review",
  "orientation": "horizontal",
  "compact": false
}
```

### `dropdown` — Dropdown

**Status:** beta

**Level:** recommended

**Recommended use:** Compact action menu

**Required properties:** `type`, `id`, `items`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `trigger`, `items`, `placement`, `closeOnSelect`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `closeOnSelect`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `items`, `minHeight`, `order`, `placement`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `trigger`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Menu roles, roving arrow-key focus, Home/End, nested-menu keys, Escape/Tab dismissal, and trigger focus restoration are supported.

```json
{
  "type": "dropdown",
  "id": "dropdown",
  "title": "Row actions",
  "span": 12,
  "className": "hp-example-dropdown",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-dropdown { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "trigger": {
    "label": "Actions",
    "icon": "dots",
    "variant": "ghost"
  },
  "items": [
    {
      "id": "view",
      "label": "View details",
      "icon": "eye",
      "action": {
        "type": "openOverlay",
        "target": "detail_modal"
      }
    },
    {
      "id": "divider",
      "divider": true
    },
    {
      "id": "delete",
      "label": "Remove",
      "icon": "trash",
      "disabled": true
    }
  ],
  "placement": "bottom-end",
  "closeOnSelect": true
}
```

### `modal` — Modal

**Status:** beta

**Level:** recommended

**Recommended use:** Focused overlay with children

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `backdropClose`, `footer`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `backdropClose`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `footer`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Initial focus, focus trap, Escape close, labelled dialog semantics, and trigger focus restoration are supported.

```json
{
  "type": "modal",
  "id": "modal",
  "title": "Record Details",
  "span": 12,
  "className": "hp-example-modal",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-modal { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "size": "md",
  "backdropClose": true,
  "children": [
    {
      "type": "dataGrid",
      "id": "dataGrid",
      "title": "Details",
      "span": 12,
      "className": "hp-example-dataGrid",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-dataGrid { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "items": [
        {
          "label": "Record",
          "field": "__field_key__"
        },
        {
          "label": "Value",
          "field": "__measure_field_key__",
          "format": "currency"
        }
      ]
    }
  ],
  "footer": [
    {
      "type": "button",
      "id": "button",
      "title": "Close",
      "span": 12,
      "className": "hp-example-button",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-button { min-width: 0; }",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      },
      "label": "Close",
      "uiAction": {
        "type": "closeOverlay",
        "target": "detail_modal"
      }
    }
  ]
}
```

### `offcanvas` — Offcanvas

**Status:** beta

**Level:** recommended

**Recommended use:** Slide-over panel for details/filters

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `position`, `openWhen`, `stateKey`, `backdrop`, `backdropClose`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `backdrop`, `backdropClose`, `children`, `className`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `openWhen`, `order`, `position`, `props`, `responsive`, `size`, `slots`, `span`, `stateKey`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Uses dialog semantics, managed focus, Escape/backdrop close, an accessible close button, and internal scrolling.

**Related:** `modal`

```json
{
  "type": "offcanvas",
  "id": "offcanvas",
  "title": "Filters",
  "span": 12,
  "className": "hp-example-offcanvas",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-offcanvas { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "position": "left",
  "width": 320,
  "openWhen": "state",
  "stateKey": "filter_offcanvas",
  "children": [
    {
      "type": "select",
      "id": "select",
      "title": "Category",
      "span": 4,
      "className": "hp-example-select",
      "hidden": false,
      "style": {
        "minWidth": 0
      },
      "css": ".hp-example-select { min-width: 0; }",
      "interaction": {
        "enabled": true,
        "trigger": "auto",
        "internalMode": "filter",
        "internalScope": "all",
        "externalMode": "auto",
        "field": "__field_key__",
        "operator": "=",
        "selectionMode": "replace",
        "multiSelect": true,
        "showSelector": false,
        "clearOnSecondClick": false
      },
      "field": "__field_key__",
      "label": "Category",
      "placeholder": "Choose category",
      "defaultValue": ""
    }
  ]
}
```

### `popover` — Popover

**Status:** beta

**Level:** standard

**Recommended use:** Rich tooltip with actions

**Required properties:** `type`, `id`, `trigger`, `children`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `children`, `direction`, `columns`, `gap`, `width`, `collapsible`, `defaultCollapsed`, `defaultOpen`, `trigger`, `placement`, `closeOnOutsideClick`, `closeOnEscape`, `showArrow`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `children`, `className`, `closeOnEscape`, `closeOnOutsideClick`, `collapsible`, `columns`, `css`, `data`, `dataset`, `defaultCollapsed`, `defaultOpen`, `direction`, `disabled`, `gap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `placement`, `props`, `responsive`, `showArrow`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `trigger`, `type`, `uiAction`, `variant`, `visibility`, `width`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Uses role=dialog, managed focus, Escape/outside dismissal, ARIA trigger relationships, and focus restoration.

```json
{
  "type": "popover",
  "id": "popover",
  "title": "Help popover",
  "span": 1,
  "className": "hp-example-popover",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-popover { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "trigger": {
    "label": "?",
    "icon": "info"
  },
  "children": [
    {
      "type": "text",
      "id": "popover_content",
      "span": 12,
      "text": "Supporting content",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      }
    }
  ]
}
```

## Feedback

_3 components_

### `emptyState` — Empty state

**Status:** stable

**Level:** recommended

**Recommended use:** Placeholder when no data is available

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `description`, `primaryAction`, `secondaryAction`, `compact`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `compact`, `css`, `data`, `dataset`, `description`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `primaryAction`, `props`, `responsive`, `secondaryAction`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "emptyState",
  "id": "emptyState",
  "title": "No data available",
  "span": 12,
  "className": "hp-example-emptyState",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-emptyState { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "icon": "info",
  "description": "No records match the current filters.",
  "primaryAction": {
    "type": "clearFilters"
  },
  "compact": false
}
```

### `placeholder` — Placeholder

**Status:** stable

**Level:** standard

**Recommended use:** Skeleton loading indicator

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `lines`, `placeholderVariant`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `lines`, `minHeight`, `order`, `placeholderVariant`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Accessibility:** Uses aria-hidden. Respects prefers-reduced-motion.

```json
{
  "type": "placeholder",
  "id": "placeholder",
  "title": "Loading content",
  "span": 12,
  "className": "hp-example-placeholder",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-placeholder { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "lines": 4,
  "placeholderVariant": "text"
}
```

### `spinner` — Spinner

**Status:** stable

**Level:** standard

**Recommended use:** Inline or centered loading indicator

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `label`, `inline`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `inline`, `interaction`, `interactions`, `label`, `minHeight`, `order`, `props`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

**Accessibility:** Uses role=status with accessible label.

```json
{
  "type": "spinner",
  "id": "spinner",
  "title": "Loading data",
  "span": 12,
  "className": "hp-example-spinner",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-spinner { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "label": "Loading records...",
  "inline": false
}
```

## Forms

_5 components_

### `textarea` — Text area

**Status:** beta

**Level:** standard

**Recommended use:** Multi-line text input

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Associated label via generated ID.

```json
{
  "type": "textarea",
  "id": "textarea",
  "title": "Notes",
  "span": 4,
  "className": "hp-example-textarea",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-textarea { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Notes",
  "placeholder": "Enter notes...",
  "defaultValue": "",
  "rows": 4,
  "maxLength": 500
}
```

### `checkbox` — Checkbox

**Status:** beta

**Level:** standard

**Recommended use:** Single boolean toggle

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "checkbox",
  "id": "checkbox",
  "title": "Include inactive",
  "span": 12,
  "className": "hp-example-checkbox",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-checkbox { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Include inactive records",
  "defaultValue": false
}
```

### `checkboxGroup` — Checkbox group

**Status:** beta

**Level:** standard

**Recommended use:** Multiple choice selection

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "checkboxGroup",
  "id": "checkboxGroup",
  "title": "Categories",
  "span": 12,
  "className": "hp-example-checkboxGroup",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-checkboxGroup { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "in",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__category_field_key__",
  "label": "Select categories",
  "options": [
    {
      "label": "Category A",
      "value": "A"
    },
    {
      "label": "Category B",
      "value": "B"
    }
  ],
  "multiple": true,
  "defaultValue": []
}
```

### `radioGroup` — Radio group

**Status:** beta

**Level:** standard

**Recommended use:** Single choice from options

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "radioGroup",
  "id": "radioGroup",
  "title": "Priority",
  "span": 12,
  "className": "hp-example-radioGroup",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-radioGroup { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "label": "Priority level",
  "options": [
    {
      "label": "High",
      "value": "High"
    },
    {
      "label": "Medium",
      "value": "Medium"
    },
    {
      "label": "Low",
      "value": "Low"
    }
  ],
  "defaultValue": "Medium"
}
```

### `inputGroup` — Input group

**Status:** beta

**Level:** standard

**Recommended use:** Input with safe prefix/suffix

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `field`, `label`, `placeholder`, `min`, `max`, `step`, `multiple`, `defaultValue`, `options`, `targets`, `filter`, `buttons`, `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, `prefixText`, `prefixIcon`, `suffixText`, `suffixIcon`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `buttons`, `className`, `css`, `data`, `dataset`, `defaultValue`, `description`, `disabled`, `errorText`, `field`, `filter`, `heightMode`, `helpText`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `label`, `max`, `maxLength`, `min`, `minHeight`, `multiple`, `options`, `order`, `orientation`, `placeholder`, `prefixIcon`, `prefixText`, `props`, `required`, `responsive`, `rows`, `size`, `slots`, `span`, `step`, `style`, `subtitle`, `suffixIcon`, `suffixText`, `targets`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "inputGroup",
  "id": "inputGroup",
  "title": "Search with icon",
  "span": 12,
  "className": "hp-example-inputGroup",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-inputGroup { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "filter",
    "internalScope": "all",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "contains",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": false
  },
  "field": "__field_key__",
  "placeholder": "Search...",
  "prefixIcon": "search",
  "suffixText": "items"
}
```

## Charts

_16 components_

### `barChart` — Bar chart

**Status:** stable

**Level:** recommended

**Recommended use:** Ranked category comparison

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "barChart",
  "id": "barChart",
  "title": "Value by category",
  "span": 6,
  "className": "hp-example-barChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-barChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "height": 320,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false,
    "silent": false
  },
  "options": {
    "animation": true,
    "tooltip": {
      "trigger": "axis",
      "formatter": "{b}: {c}"
    },
    "legend": {
      "show": true,
      "bottom": 0
    },
    "grid": {
      "left": 48,
      "right": 20,
      "top": 32,
      "bottom": 52,
      "containLabel": true
    },
    "xAxis": {
      "axisLabel": {
        "rotate": 0,
        "hideOverlap": true
      }
    },
    "series": [
      {
        "type": "bar",
        "barMaxWidth": 42,
        "label": {
          "show": false
        }
      }
    ]
  }
}
```

### `horizontalBarChart` — Horizontal bar

**Status:** stable

**Level:** recommended

**Recommended use:** Long category labels

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "horizontalBarChart",
  "id": "horizontalBarChart",
  "title": "Ranked categories",
  "span": 6,
  "className": "hp-example-horizontalBarChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-horizontalBarChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "height": 320,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false,
    "silent": false
  },
  "options": {
    "animation": true,
    "tooltip": {
      "trigger": "axis",
      "formatter": "{b}: {c}"
    },
    "legend": {
      "show": true,
      "bottom": 0
    },
    "grid": {
      "left": 48,
      "right": 20,
      "top": 32,
      "bottom": 52,
      "containLabel": true
    },
    "yAxis": {
      "axisLabel": {
        "width": 120,
        "overflow": "truncate"
      }
    },
    "series": [
      {
        "type": "bar",
        "barMaxWidth": 32,
        "label": {
          "show": true,
          "position": "right"
        }
      }
    ]
  }
}
```

### `lineChart` — Line chart

**Status:** stable

**Level:** recommended

**Recommended use:** Time or ordered trends

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "lineChart",
  "id": "lineChart",
  "title": "Trend over time",
  "span": 6,
  "className": "hp-example-lineChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-lineChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "height": 320,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false,
    "silent": false
  },
  "options": {
    "animation": true,
    "tooltip": {
      "trigger": "axis"
    },
    "legend": {
      "show": true,
      "bottom": 0
    },
    "grid": {
      "left": 48,
      "right": 20,
      "top": 32,
      "bottom": 52,
      "containLabel": true
    },
    "series": [
      {
        "type": "line",
        "smooth": true,
        "showSymbol": false,
        "connectNulls": true
      }
    ]
  }
}
```

### `areaChart` — Area chart

**Status:** stable

**Level:** standard

**Recommended use:** Trend plus magnitude

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "areaChart",
  "id": "areaChart",
  "title": "Volume trend",
  "span": 6,
  "className": "hp-example-areaChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-areaChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "height": 320,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false,
    "silent": false
  },
  "options": {
    "animation": true,
    "tooltip": {
      "trigger": "axis",
      "formatter": "{b}: {c}"
    },
    "legend": {
      "show": true,
      "bottom": 0
    },
    "grid": {
      "left": 48,
      "right": 20,
      "top": 32,
      "bottom": 52,
      "containLabel": true
    },
    "series": [
      {
        "type": "line",
        "smooth": true,
        "areaStyle": {
          "opacity": 0.24
        },
        "showSymbol": false
      }
    ]
  }
}
```

### `pieChart` — Pie chart

**Status:** beta

**Level:** standard

**Recommended use:** Few-part composition only

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "pieChart",
  "id": "pieChart",
  "title": "Category share",
  "span": 6,
  "className": "hp-example-pieChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-pieChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "height": 320,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false,
    "silent": false
  },
  "options": {
    "animation": true,
    "tooltip": {
      "trigger": "item",
      "formatter": "{b}: {c} ({d}%)"
    },
    "legend": {
      "show": true,
      "bottom": 0
    },
    "grid": {
      "left": 48,
      "right": 20,
      "top": 32,
      "bottom": 52,
      "containLabel": true
    },
    "series": [
      {
        "type": "pie",
        "radius": "72%",
        "label": {
          "show": true,
          "formatter": "{b}: {d}%"
        }
      }
    ]
  }
}
```

### `donutChart` — Donut chart

**Status:** beta

**Level:** standard

**Recommended use:** Few-part composition with central space

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "donutChart",
  "id": "donutChart",
  "title": "Category distribution",
  "span": 6,
  "className": "hp-example-donutChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-donutChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "height": 320,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false,
    "silent": false
  },
  "options": {
    "animation": true,
    "tooltip": {
      "trigger": "item",
      "formatter": "{b}: {c} ({d}%)"
    },
    "legend": {
      "show": true,
      "bottom": 0
    },
    "grid": {
      "left": 48,
      "right": 20,
      "top": 32,
      "bottom": 52,
      "containLabel": true
    },
    "series": [
      {
        "type": "pie",
        "radius": [
          "46%",
          "72%"
        ],
        "avoidLabelOverlap": true
      }
    ]
  }
}
```

### `scatterChart` — Scatter chart

**Status:** beta

**Level:** standard

**Recommended use:** Relationship between two measures

**Required properties:** `type`, `id`, `x`, `y`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "scatterChart",
  "id": "scatterChart",
  "title": "Measure relationship",
  "span": 6,
  "className": "hp-example-scatterChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-scatterChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "x": "__x_measure_field_key__",
  "y": "__y_measure_field_key__",
  "pointSize": "__size_measure_field_key__",
  "height": 340,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false
  },
  "options": {
    "tooltip": {
      "trigger": "item"
    },
    "xAxis": {
      "name": "X measure",
      "scale": true
    },
    "yAxis": {
      "name": "Y measure",
      "scale": true
    },
    "series": [
      {
        "type": "scatter",
        "emphasis": {
          "focus": "series"
        }
      }
    ]
  }
}
```

### `gauge` — Gauge

**Status:** beta

**Level:** standard

**Recommended use:** Single target attainment

**Required properties:** `type`, `id`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "gauge",
  "id": "gauge",
  "title": "Target attainment",
  "span": 4,
  "className": "hp-example-gauge",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-gauge { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "measure": "__measure_field_key__",
  "aggregation": "avg",
  "height": 300,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false
  },
  "options": {
    "series": [
      {
        "type": "gauge",
        "min": 0,
        "max": 100,
        "progress": {
          "show": true,
          "width": 14
        },
        "axisLine": {
          "lineStyle": {
            "width": 14
          }
        },
        "detail": {
          "formatter": "{value}%"
        }
      }
    ]
  }
}
```

### `heatmap` — Heatmap

**Status:** beta

**Level:** standard

**Recommended use:** Dense intensity comparison

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "heatmap",
  "id": "heatmap",
  "title": "Category intensity",
  "span": 6,
  "className": "hp-example-heatmap",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-heatmap { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "height": 320,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": false
  },
  "setOption": {
    "notMerge": true,
    "lazyUpdate": false,
    "silent": false
  },
  "options": {
    "animation": true,
    "tooltip": {
      "trigger": "axis",
      "formatter": "{b}: {c}"
    },
    "legend": {
      "show": true,
      "bottom": 0
    },
    "grid": {
      "left": 48,
      "right": 20,
      "top": 32,
      "bottom": 52,
      "containLabel": true
    },
    "visualMap": {
      "min": 0,
      "max": 100,
      "calculable": true,
      "orient": "horizontal",
      "bottom": 0
    },
    "series": [
      {
        "type": "heatmap",
        "label": {
          "show": true
        },
        "emphasis": {
          "itemStyle": {
            "shadowBlur": 8
          }
        }
      }
    ]
  }
}
```

### `comboChart` — Combo chart

**Status:** beta

**Level:** recommended

**Recommended use:** Compare bar and line measures on shared categories

**Required properties:** `type`, `id`, `category`, `series`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `series`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `series`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Each series/category point maps back to its source rows.

**Related:** `barChart`, `lineChart`

```json
{
  "type": "comboChart",
  "id": "comboChart",
  "title": "Actual vs. target",
  "span": 8,
  "className": "hp-example-comboChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-comboChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "series": [
    {
      "field": "__measure_field_key__",
      "label": "Actual",
      "chartType": "bar",
      "aggregation": "sum",
      "axis": "left"
    },
    {
      "field": "__target_measure_field_key__",
      "label": "Target",
      "chartType": "line",
      "aggregation": "sum",
      "axis": "left"
    },
    {
      "field": "__rate_measure_field_key__",
      "label": "Completion",
      "chartType": "line",
      "aggregation": "avg",
      "axis": "right",
      "format": "percent"
    }
  ],
  "height": 340,
  "options": {
    "legend": {
      "top": 0
    },
    "animation": true
  }
}
```

### `waterfallChart` — Waterfall chart

**Status:** beta

**Level:** recommended

**Recommended use:** Explain positive and negative contributions to a total

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `showStart`, `showEnd`, `positiveIntent`, `negativeIntent`, `totalIntent`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `negativeIntent`, `options`, `order`, `pointSize`, `positiveIntent`, `props`, `responsive`, `setOption`, `showEnd`, `showStart`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `totalIntent`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "waterfallChart",
  "id": "waterfallChart",
  "title": "Budget variance",
  "span": 6,
  "className": "hp-example-waterfallChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-waterfallChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "showStart": true,
  "showEnd": true,
  "positiveIntent": "success",
  "negativeIntent": "danger",
  "totalIntent": "primary",
  "height": 320
}
```

### `sankeyChart` — Sankey chart

**Status:** beta

**Level:** standard

**Recommended use:** Show weighted flow between stages

**Required properties:** `type`, `id`, `sourceField`, `targetField`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `sourceField`, `targetField`, `valueField`, `orientation`, `nodeAlign`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `nodeAlign`, `options`, `order`, `orientation`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `sourceField`, `span`, `style`, `subtitle`, `targetField`, `title`, `tooltip`, `type`, `uiAction`, `valueField`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Node and edge clicks retain distinct row bindings; accompany dense flows with a table when exact values matter.

```json
{
  "type": "sankeyChart",
  "id": "sankeyChart",
  "title": "Work order flow",
  "span": 8,
  "className": "hp-example-sankeyChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-sankeyChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "sourceField": "__source_field_key__",
  "targetField": "__target_field_key__",
  "valueField": "__measure_field_key__",
  "aggregation": "sum",
  "orientation": "horizontal",
  "nodeAlign": "justify",
  "height": 380
}
```

### `treemapChart` — Treemap chart

**Status:** beta

**Level:** standard

**Recommended use:** Explore hierarchical contribution

**Required properties:** `type`, `id`, `pathFields`, `valueField`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `pathFields`, `valueField`, `labelField`, `maxDepth`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `labelField`, `maxDataRows`, `maxDepth`, `measure`, `minHeight`, `options`, `order`, `pathFields`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `valueField`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Every hierarchy node maps to the contributing source rows.

```json
{
  "type": "treemapChart",
  "id": "treemapChart",
  "title": "Cost hierarchy",
  "span": 8,
  "className": "hp-example-treemapChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-treemapChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "pathFields": [
    "__department_field_key__",
    "__program_field_key__",
    "__project_field_key__"
  ],
  "valueField": "__measure_field_key__",
  "aggregation": "sum",
  "labelField": "__project_field_key__",
  "maxDepth": 3,
  "height": 380
}
```

### `funnelChart` — Funnel chart

**Status:** beta

**Level:** standard

**Recommended use:** Compare ordered process stages

**Required properties:** `type`, `id`, `category`, `measure`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `sort`, `gap`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `gap`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `sort`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Labels include stage values and percentages.

```json
{
  "type": "funnelChart",
  "id": "funnelChart",
  "title": "Project pipeline",
  "span": 6,
  "className": "hp-example-funnelChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-funnelChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "aggregation": "sum",
  "sort": "descending",
  "gap": 3,
  "height": 340
}
```

### `radarChart` — Radar chart

**Status:** beta

**Level:** advanced

**Recommended use:** Compare multivariate profiles

**Required properties:** `type`, `id`, `indicators`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `groupField`, `indicators`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `groupField`, `height`, `heightMode`, `hidden`, `icon`, `id`, `indicators`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "radarChart",
  "id": "radarChart",
  "title": "Team performance",
  "span": 6,
  "className": "hp-example-radarChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-radarChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "groupField": "__category_field_key__",
  "indicators": [
    {
      "field": "__safety_measure_field_key__",
      "label": "Safety",
      "max": 100
    },
    {
      "field": "__quality_measure_field_key__",
      "label": "Quality",
      "max": 100
    },
    {
      "field": "__schedule_measure_field_key__",
      "label": "Schedule",
      "max": 100
    }
  ],
  "height": 360
}
```

### `smallMultiples` — Small multiples

**Status:** beta

**Level:** recommended

**Recommended use:** Repeat one comparison across a split field

**Required properties:** `type`, `id`, `splitField`, `chart`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `splitField`, `chart`, `maxPanels`, `sharedScale`, `height`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `chart`, `className`, `css`, `data`, `dataset`, `disabled`, `height`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `maxPanels`, `minHeight`, `order`, `props`, `responsive`, `sharedScale`, `size`, `slots`, `span`, `splitField`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

```json
{
  "type": "smallMultiples",
  "id": "smallMultiples",
  "title": "Regional comparisons",
  "span": 12,
  "className": "hp-example-smallMultiples",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-smallMultiples { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "splitField": "__split_field_key__",
  "maxPanels": 6,
  "sharedScale": true,
  "height": 200,
  "chart": {
    "type": "barChart",
    "id": "small_multiple_chart",
    "title": "Value by category",
    "span": 12,
    "className": "hp-example-barChart",
    "hidden": false,
    "style": {
      "minWidth": 0
    },
    "css": ".hp-example-barChart { min-width: 0; }",
    "interaction": {
      "enabled": true,
      "trigger": "auto",
      "internalMode": "highlight",
      "internalScope": "self",
      "externalMode": "auto",
      "selectionMode": "replace",
      "multiSelect": true,
      "showSelector": false,
      "clearOnSecondClick": true
    },
    "category": "__category_field_key__",
    "measure": "__measure_field_key__",
    "aggregation": "sum",
    "height": 200,
    "maxDataRows": 30000,
    "initOptions": {
      "renderer": "canvas",
      "useDirtyRect": false
    },
    "setOption": {
      "notMerge": true,
      "lazyUpdate": false,
      "silent": false
    },
    "options": {
      "animation": true,
      "tooltip": {
        "trigger": "axis",
        "formatter": "{b}: {c}"
      },
      "legend": {
        "show": true,
        "bottom": 0
      },
      "grid": {
        "left": 48,
        "right": 20,
        "top": 32,
        "bottom": 52,
        "containLabel": true
      }
    }
  }
}
```

## Tables

_2 components_

### `table` — Detail table

**Status:** stable

**Level:** recommended

**Recommended use:** Row-level investigation and export-ready detail

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `columns`, `pagination`, `pageSize`, `search`, `resizableColumns`, `maxRows`, `stickyHeader`, `density`, `striped`, `hover`, `showRowCount`, `pageSizeOptions`, `rowActions`, `emptyState`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `export`, `virtualization`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `columns`, `css`, `data`, `dataset`, `density`, `disabled`, `emptyState`, `export`, `heightMode`, `hidden`, `hover`, `icon`, `id`, `interaction`, `interactions`, `maxRows`, `minHeight`, `order`, `pageSize`, `pageSizeOptions`, `pagination`, `props`, `resizableColumns`, `responsive`, `rowActions`, `search`, `showRowCount`, `size`, `slots`, `span`, `stickyHeader`, `striped`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `virtualization`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Row actions use safe UiAction. Column resizing prevents row selection while active.

**Related:** `matrix`

```json
{
  "type": "table",
  "id": "table",
  "title": "Record details",
  "span": 12,
  "className": "hp-example-table",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-table { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": true,
    "clearOnSecondClick": true
  },
  "columns": [
    {
      "field": "__field_key__",
      "title": "Record",
      "width": 180,
      "format": "",
      "hozAlign": "left",
      "conditional": [
        {
          "operator": "=",
          "value": "Critical",
          "color": "#991b1b",
          "background": "#fee2e2"
        }
      ]
    },
    {
      "field": "__measure_field_key__",
      "title": "Amount",
      "width": 120,
      "format": "currency",
      "hozAlign": "right",
      "conditional": [
        {
          "operator": ">=",
          "value": 1000,
          "color": "#166534",
          "background": "#dcfce7"
        }
      ]
    }
  ],
  "pagination": true,
  "pageSize": 25,
  "search": true,
  "resizableColumns": true,
  "maxRows": 1000,
  "stickyHeader": true
}
```

### `matrix` — Matrix / pivot

**Status:** stable

**Level:** recommended

**Recommended use:** Summarized row-by-column comparison

**Required properties:** `type`, `id`, `rows`, `values`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `rows`, `columns`, `values`, `showTotals`, `heatmap`, `maxRows`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `columns`, `css`, `data`, `dataset`, `disabled`, `heatmap`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `maxRows`, `minHeight`, `order`, `props`, `responsive`, `rows`, `showTotals`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `values`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Related:** `table`

```json
{
  "type": "matrix",
  "id": "matrix",
  "title": "Category matrix",
  "span": 12,
  "className": "hp-example-matrix",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-matrix { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "rows": [
    "__category_field_key__",
    "__field_key__"
  ],
  "columns": [
    "__column_field_key__"
  ],
  "values": [
    {
      "field": "__measure_field_key__",
      "title": "Total amount",
      "aggregation": "sum",
      "format": "currency"
    },
    {
      "title": "Records",
      "aggregation": "count",
      "format": "integer"
    }
  ],
  "showTotals": true,
  "heatmap": true,
  "maxRows": 200
}
```

## Maps

_1 components_

### `map` — Map

**Status:** beta

**Level:** recommended

**Recommended use:** Values-only Power BI fields need independent layer datasets/bindings or practical public ArcGIS REST layers authored in Map Studio

**Required properties:** `type`, `id`, `layers`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `engine`, `view`, `basemap`, `layers`, `layerGroups`, `bookmarks`, `search`, `legend`, `featureDetails`, `layerPanel`, `toolbar`, `height`, `heightMode`, `minHeight`, `aspectRatio`, `order`, `responsive`, `tools`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `basemap`, `bookmarks`, `className`, `css`, `data`, `dataset`, `disabled`, `engine`, `featureDetails`, `height`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `layerGroups`, `layerPanel`, `layers`, `legend`, `minHeight`, `order`, `props`, `responsive`, `search`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `toolbar`, `tools`, `tooltip`, `type`, `uiAction`, `variant`, `view`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Related:** `offcanvas`, `dataGrid`

```json
{
  "type": "map",
  "id": "map",
  "title": "Locations",
  "span": 12,
  "className": "hp-example-map",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-map { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "height": 420,
  "view": {
    "center": [
      29.75,
      -95.35
    ],
    "zoom": 10,
    "fitMode": "data"
  },
  "basemap": {
    "type": "none"
  },
  "search": {
    "enabled": true,
    "placeholder": "Search for a place or address",
    "zoom": 16,
    "showResultMarker": true,
    "clearMarkerOnClose": false
  },
  "legend": {
    "defaultOpen": false
  },
  "layerGroups": [
    {
      "id": "operations",
      "name": "Operations",
      "visible": true,
      "order": 0
    }
  ],
  "bookmarks": [
    {
      "id": "home_view",
      "label": "Home view",
      "center": [
        29.75,
        -95.35
      ],
      "zoom": 10
    }
  ],
  "layers": [
    {
      "id": "powerbi_locations",
      "name": "Locations",
      "dataset": "powerbi",
      "groupId": "operations",
      "source": {
        "type": "powerbi",
        "bindings": {
          "latitude": "__latitude_field_key__",
          "longitude": "__longitude_field_key__"
        }
      },
      "renderer": {
        "type": "simple",
        "symbol": {
          "shape": "circle",
          "fillColor": "#2563eb",
          "outlineColor": "#1d4ed8",
          "size": 7
        }
      },
      "popup": {
        "enabled": true,
        "title": "{{__field_key__}}",
        "fields": [
          {
            "field": "__field_key__",
            "fieldSource": "powerbi",
            "label": "Location"
          }
        ]
      },
      "tooltip": {
        "enabled": true,
        "fields": [
          {
            "field": "__field_key__",
            "fieldSource": "powerbi",
            "label": "Location"
          }
        ]
      },
      "interaction": {
        "enabled": true,
        "trigger": "click",
        "internalMode": "highlight",
        "externalMode": "selection",
        "selectionMode": "replace",
        "multiSelect": true
      }
    }
  ],
  "layerPanel": {
    "visible": true,
    "defaultOpen": false,
    "allowViewerReorder": true,
    "allowViewerOpacity": true,
    "allowViewerLabels": true
  },
  "toolbar": {
    "visible": true,
    "home": true,
    "layers": true,
    "legend": true,
    "search": true,
    "clearSelection": true,
    "zoomToSelection": true,
    "bookmarks": true
  }
}
```

## Custom components

_5 components_

### `text` — Text

**Status:** stable

**Level:** standard

**Recommended use:** Safe plain text

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `text`, `repeat`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `repeat`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "text",
  "id": "text",
  "title": "Text content",
  "span": 12,
  "className": "hp-example-text",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-text { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "text": "Plain text content for the dashboard."
}
```

### `markdown` — Markdown

**Status:** stable

**Level:** standard

**Recommended use:** Structured explanatory content

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `text`, `repeat`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `repeat`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML No.

**Data interaction:** No. **UI action:** Yes.

```json
{
  "type": "markdown",
  "id": "markdown",
  "title": "Markdown content",
  "span": 12,
  "className": "hp-example-markdown",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-markdown { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "text": "## Dashboard notes\n\n- Current period\n- Key operational context\n\n**Field:** {{__field_key__}}"
}
```

### `html` — Sanitized HTML

**Status:** beta

**Level:** advanced

**Recommended use:** Branded static content

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `html`, `repeat`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `html`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `repeat`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields No; calculations No; scoped CSS Yes; slots Yes; interactions No; identity selection No; custom HTML Yes.

**Data interaction:** No. **UI action:** Yes.

**Accessibility:** HTML is sanitized with DOMPurify. No scripts, iframes, or event handlers allowed.

```json
{
  "type": "html",
  "id": "html",
  "title": "Formatted content",
  "span": 12,
  "className": "hp-example-html",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-html { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "html": "<section class=\"summary\"><strong>Summary</strong><span>{{__field_key__}}</span></section>",
  "slots": {
    "header": "<span>Header content</span>",
    "footer": "<small>Updated from Power BI data</small>"
  }
}
```

### `custom` — Custom HTML/CSS

**Status:** beta

**Level:** advanced

**Recommended use:** Safe app-like cards, lists, and slicers

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `html`, `text`, `repeat`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataset`, `disabled`, `heightMode`, `hidden`, `html`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `order`, `props`, `repeat`, `responsive`, `size`, `slots`, `span`, `style`, `subtitle`, `text`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML Yes.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** Custom HTML is sanitized. Repeat rows support keyboard interaction.

**Related:** `html`, `listGroup`, `card`

```json
{
  "type": "custom",
  "id": "custom",
  "title": "Interactive record list",
  "span": 12,
  "className": "hp-example-custom",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-custom { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "click",
    "internalMode": "none",
    "internalScope": "self",
    "externalMode": "filter",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "html": "<header><strong>Records</strong></header>",
  "repeat": {
    "source": "rows",
    "as": "row",
    "limit": 100,
    "template": "<span>{{__field_key__}}</span><small>{{__category_field_key__}}</small>",
    "distinctBy": "__field_key__",
    "sortBy": "__field_key__",
    "sortDirection": "asc"
  },
  "slots": {
    "empty": "<p>No records available.</p>",
    "footer": "<small>Select a record to filter the report.</small>"
  },
  "data": {
    "variant": "compact-list"
  },
  "interactions": {
    "onClick": {
      "action": "selectWhere",
      "where": {
        "op": "=",
        "left": {
          "field": "__field_key__"
        },
        "right": {
          "valueFromRow": "__field_key__"
        }
      }
    }
  }
}
```

### `svg` — Declarative SVG

**Status:** stable

**Level:** recommended

**Recommended use:** Animated KPI cards, diagrams, gauges, pictorial marks, and schematics

**Required properties:** `type`, `id`, `viewBox`, `elements`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `viewBox`, `width`, `height`, `preserveAspectRatio`, `role`, `description`, `elements`, `dataContext`, `motion`, `performance`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataContext`, `dataset`, `description`, `disabled`, `elements`, `height`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `motion`, `order`, `performance`, `preserveAspectRatio`, `props`, `responsive`, `role`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `viewBox`, `visibility`, `width`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** ariaLabel is recommended. Interactive marks are keyboard focusable and respond to Enter and Space. Motion respects the configured reduced-motion policy.

**Related:** `svgMarkup`, `gauge`, `progressBar`

```json
{
  "type": "svg",
  "id": "svg",
  "title": "Animated progress",
  "span": 6,
  "className": "hp-example-svg",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-svg { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "viewBox": "0 0 800 240",
  "height": 240,
  "ariaLabel": "Completion progress",
  "description": "A data-bound progress track and value label.",
  "dataContext": {
    "mode": "aggregate"
  },
  "motion": {
    "enabled": true,
    "reducedMotion": "respect-system",
    "maxConcurrentAnimations": 12
  },
  "elements": [
    {
      "type": "defs",
      "children": [
        {
          "type": "linearGradient",
          "id": "progressGradient",
          "x1": 0,
          "y1": 0,
          "x2": 1,
          "y2": 0,
          "children": [
            {
              "type": "stop",
              "offset": "0%",
              "stopColor": "var(--hp-primary)"
            },
            {
              "type": "stop",
              "offset": "100%",
              "stopColor": "var(--hp-success)"
            }
          ]
        }
      ]
    },
    {
      "type": "rect",
      "id": "track",
      "x": 40,
      "y": 120,
      "width": 720,
      "height": 22,
      "rx": 11,
      "fill": "var(--hp-muted)"
    },
    {
      "type": "rect",
      "id": "progress",
      "x": 40,
      "y": 120,
      "width": {
        "bind": "__measure_field_key__",
        "scale": {
          "type": "linear",
          "domain": [
            0,
            100
          ],
          "range": [
            0,
            720
          ],
          "clamp": true
        }
      },
      "height": 22,
      "rx": 11,
      "fill": "url(#progressGradient)",
      "animation": {
        "preset": "progress-fill",
        "durationMs": 1000,
        "easing": "ease-out"
      }
    },
    {
      "type": "text",
      "x": 40,
      "y": 82,
      "text": {
        "template": "{{__measure_field_key__}}%"
      },
      "fontSize": 28,
      "fontWeight": 700
    }
  ]
}
```

## Advanced components

_2 components_

### `svgMarkup` — Sanitized SVG markup

**Status:** beta

**Level:** advanced

**Recommended use:** Strictly sanitized raw SVG when declarative SVG cannot express the design

**Required properties:** `type`, `id`, `svg`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `viewBox`, `width`, `height`, `preserveAspectRatio`, `role`, `description`, `svg`, `dataContext`, `motion`, `performance`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`

**All allowed properties:** `ariaLabel`, `aspectRatio`, `className`, `css`, `data`, `dataContext`, `dataset`, `description`, `disabled`, `height`, `heightMode`, `hidden`, `icon`, `id`, `interaction`, `interactions`, `minHeight`, `motion`, `order`, `performance`, `preserveAspectRatio`, `props`, `responsive`, `role`, `size`, `slots`, `span`, `style`, `subtitle`, `svg`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `viewBox`, `visibility`, `width`

**Capabilities:** fields Yes; calculations No; scoped CSS Yes; slots Yes; interactions Yes; identity selection No; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** The component wrapper supplies accessible image semantics; include title/desc content in the SVG where useful.

**Related:** `svg`

```json
{
  "type": "svgMarkup",
  "id": "svgMarkup",
  "title": "Sanitized raw SVG",
  "span": 6,
  "className": "hp-example-svgMarkup",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-status { opacity: 1; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "viewBox": "0 0 400 160",
  "height": 160,
  "ariaLabel": "Operating status",
  "description": "Advanced sanitized SVG markup example.",
  "svg": "<svg viewBox=\"0 0 400 160\" role=\"img\"><defs><linearGradient id=\"statusGradient\"><stop offset=\"0%\" stop-color=\"#2563eb\"/><stop offset=\"100%\" stop-color=\"#16a34a\"/></linearGradient></defs><rect id=\"statusTrack\" x=\"20\" y=\"50\" width=\"360\" height=\"40\" rx=\"20\" fill=\"url(#statusGradient)\"/><text x=\"200\" y=\"76\" text-anchor=\"middle\" fill=\"white\">{{__field_key__}}</text></svg>"
}
```

### `advancedChart` — Advanced ECharts

**Status:** experimental

**Level:** advanced

**Recommended use:** JSON-only ECharts escape hatch for uncommon configurations not represented by a first-class HyperPBI chart

**Required properties:** `type`, `id`

**Key properties:** `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`, `height`, `maxDataRows`, `initOptions`, `setOption`, `options`, `category`, `measure`, `aggregation`, `x`, `y`, `pointSize`, `order`, `responsive`, `heightMode`, `minHeight`, `aspectRatio`, `events`, `drill`

**All allowed properties:** `aggregation`, `ariaLabel`, `aspectRatio`, `category`, `className`, `css`, `data`, `dataset`, `disabled`, `drill`, `events`, `height`, `heightMode`, `hidden`, `icon`, `id`, `initOptions`, `interaction`, `interactions`, `maxDataRows`, `measure`, `minHeight`, `options`, `order`, `pointSize`, `props`, `responsive`, `setOption`, `size`, `slots`, `span`, `style`, `subtitle`, `title`, `tooltip`, `type`, `uiAction`, `variant`, `visibility`, `x`, `y`

**Capabilities:** fields Yes; calculations Yes; scoped CSS Yes; slots Yes; interactions Yes; identity selection Yes; custom HTML No.

**Data interaction:** Yes. **UI action:** Yes.

**Accessibility:** ECharts options are recursively sanitized. JavaScript functions, event handlers, executable markup, and external URLs are blocked.

```json
{
  "type": "advancedChart",
  "id": "advancedChart",
  "title": "Advanced ECharts dashboard",
  "span": 12,
  "className": "hp-example-advancedChart",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-advancedChart { min-width: 0; }",
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "category": "__category_field_key__",
  "measure": "__measure_field_key__",
  "x": "__x_measure_field_key__",
  "y": "__y_measure_field_key__",
  "pointSize": "__size_measure_field_key__",
  "height": 420,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "devicePixelRatio": 2,
    "useDirtyRect": false,
    "useCoarsePointer": true,
    "pointerSize": 44,
    "locale": "EN"
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": false,
    "silent": false,
    "replaceMerge": [
      "series"
    ]
  },
  "options": {
    "aria": {
      "enabled": true
    },
    "title": {
      "text": "Advanced analysis",
      "left": "center"
    },
    "tooltip": {
      "trigger": "axis",
      "formatter": "{b}: {c}"
    },
    "legend": {
      "type": "scroll",
      "bottom": 0
    },
    "toolbox": {
      "show": true,
      "feature": {
        "dataZoom": {},
        "restore": {},
        "saveAsImage": {}
      }
    },
    "dataZoom": [
      {
        "type": "inside",
        "start": 0,
        "end": 100
      },
      {
        "type": "slider",
        "bottom": 28
      }
    ],
    "grid": {
      "left": 52,
      "right": 24,
      "top": 56,
      "bottom": 86,
      "containLabel": true
    },
    "xAxis": {
      "type": "category",
      "axisLabel": {
        "hideOverlap": true
      }
    },
    "yAxis": {
      "type": "value",
      "splitLine": {
        "show": true
      }
    },
    "visualMap": {
      "show": false,
      "min": 0,
      "max": 100
    },
    "series": [
      {
        "type": "bar",
        "encode": {
          "x": "__category_field_key__",
          "y": "__measure_field_key__"
        },
        "emphasis": {
          "focus": "series"
        },
        "markLine": {
          "data": [
            {
              "type": "average",
              "name": "Average"
            }
          ]
        }
      },
      {
        "type": "line",
        "encode": {
          "x": "__category_field_key__",
          "y": "__measure_field_key__"
        },
        "smooth": true,
        "showSymbol": false
      }
    ]
  }
}
```

## Schema version boundary

Dashboard schema 2.0 is the only active authoring and rendering contract. Schema 1.0 and missing versions are rejected by the production runtime. Developers may explicitly convert a legacy file with `npm run schema:migrate-v1 -- input.json output.json`; the temporary converter is outside the PBIVIZ bundle and runtime migration is intentionally unsupported. PBIVIZ package and Runtime Config versions are independent version numbers.
