# HyperPBI Component Catalog — Complete JSON and Property Reference

> Copy-ready documentation for the Component Catalog shown in HyperPBI Studio. Replace every `__...field_key__` placeholder with a normalized field key from the Fields panel. Use friendly labels only for visible titles; never use a display label as a field reference.

## Contents

- [Universal interaction reference](#universal-interaction-reference)
- [Minimal dashboard JSON](#minimal-dashboard-json)
- [Shared component properties](#shared-component-properties)
- [Layout](#layout)
- [Controls](#controls)
- [Navigation](#navigation)
- [Display](#display)
- [Charts](#charts)
- [Tables](#tables)
- [Maps](#maps)
- [Custom components](#custom-components)
- [Advanced components](#advanced-components)
- [Custom component templates](#custom-component-templates)
- [Safe actions and template tokens](#safe-actions-and-template-tokens)

## Universal interaction reference

Every component uses the same `interaction` object. Internal behavior affects HyperPBI; external behavior affects Power BI. Component-level policy overrides the Runtime Config fallback.

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

| Key | Type | Allowed values / example | Meaning |
| --- | --- | --- | --- |
| enabled | boolean | true / false | Master gate for this component interaction. |
| trigger | enum | auto \| click \| change | Natural event; auto resolves by component family. |
| internalMode | enum | none \| highlight \| filter | Effect inside HyperPBI. |
| internalScope | enum | self \| others \| all | Which HyperPBI components receive internal filtering. |
| externalMode | enum | none \| auto \| selection \| filter | Effect on external Power BI visuals. |
| field | normalized field key | e.g. workorders_status | Required for explicit external filtering. |
| operator | enum | = \| != \| > \| >= \| < \| <= \| contains \| in \| between | Comparison/filter operator. |
| value | any JSON value | scalar or array | Explicit payload value when not derived from clicked data. |
| selectionMode | enum | replace \| toggle \| add | How selection is combined. |
| multiSelect | boolean | true / false | Allow multiple values/identities. |
| showSelector | boolean | true / false | Visible checkbox/radio UI only; does not enable clicks. |
| clearOnSecondClick | boolean | true / false | Click the same item again to clear. |


### Interaction guidance

- Controls and slicers normally use `externalMode: "auto"` or `"filter"`.
- Rows, chart points, map features, matrix cells, and timeline items normally use `"auto"` or `"selection"`.
- `internalMode: "highlight"` keeps all source data and marks the selected item.
- `internalMode: "filter"` changes the rows available to HyperPBI components according to `internalScope`.
- `showSelector` controls checkbox/radio visibility only. It does not enable or disable clicking.
- Explicit external filtering requires a field with valid Power BI source table/column lineage.
- Use `selectionMode: "toggle"` for chip-like multi-select behavior.

## Minimal dashboard JSON

```json
{
  "version": "1.0",
  "title": "Dashboard",
  "theme": {
    "mode": "light",
    "density": "compact"
  },
  "components": [
    {
      "type": "text",
      "id": "intro",
      "span": 12,
      "text": "Start here",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      }
    },
    {
      "type": "metricGrid",
      "id": "metrics",
      "span": 12,
      "metrics": [
        {
          "title": "Records",
          "aggregation": "count"
        }
      ],
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      }
    }
  ]
}
```

## Shared component properties

These keys are available across component families unless a component renderer ignores a key that is not meaningful for that type.

| Key | Type / values | Requirement | Purpose |
| --- | --- | --- | --- |
| type | string | Required | Component type from the catalog. |
| id | string | Recommended | Unique stable ASCII identifier. |
| title | string | Optional | Visible title or metadata depending on renderer. |
| span | integer 1–12 | Optional | Grid width in the 12-column layout. |
| className | string | Optional | Additional class for styling. |
| hidden | boolean | Optional | Hide the component without deleting it. |
| props | object | Optional | Safe template-accessible properties. |
| style | object of string/number | Optional | Sanitized inline style object. |
| css | string | Optional | Component-scoped CSS. |
| slots | object | Optional | header, subheader, body, footer, actions, empty, item, row, cell, popup, tooltip, legend, badge. |
| data | object | Optional | Safe component metadata/template values. |
| visibility | object | Optional | Conditional visibility metadata. |
| interactions | object | Optional | Safe named actions such as onClick. |
| interaction | object | Recommended | Universal internal/external interaction policy. |

### Root dashboard keys

| Key | Type / values | Purpose |
| --- | --- | --- |
| version | "1.0" | Required schema version. |
| title | string | Dashboard metadata; visible only when the renderer header is enabled. |
| theme.mode | light \| dark \| auto | Theme mode. |
| theme.density | compact \| normal \| spacious | Spacing density. |
| theme colors | CSS colors | primaryColor, accentColor, surfaceColor, textColor, borderColor, dangerColor, warningColor, successColor. |
| theme.radius | number | Global corner radius. |
| theme.cardPadding | number | Default card padding. |
| theme.gap | number | Default layout gap. |
| layout.type | grid \| flex \| split | Root layout. |
| layout.columns | number | Root grid columns, normally 12. |
| layout.gap | number | Root component gap. |
| state.search | string | Initial search state. |
| state.activeTab | string | Initial tab. |
| state.filters | object | Initial filters. |
| toolbar / leftPanel / rightPanel / components | component[] | Component placement arrays. |
| styles.globalCss | string | Visual-wide scoped CSS. |
| styles.components | object | Defaults by `*`, component type, or `#id`. |
| calculations | object | Validated calculated fields and metrics. |

## Layout

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| children | component[] | Nested dashboard components. |
| direction | row \| column | Container flow direction. |
| columns | number | Grid column count, commonly 12. |
| gap | number | Gap in pixels. |
| width | number | Panel width in pixels. |
| collapsible | boolean | Whether the container can collapse. |
| defaultCollapsed | boolean | Initial collapsed state for panel-style containers. |
| defaultOpen | boolean | Initial open state for collapsible/navigation containers. |

### `grid` — Grid

**Use when:** Responsive 12-column dashboard sections  

**Level:** `recommended`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use as the main responsive 12-column container.

#### Complete component JSON

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

**Use when:** Compact toolbars and flowing groups  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use for toolbars or small flowing groups; avoid fixed child widths.

#### Complete component JSON

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
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
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
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
    }
  ]
}
```

### `split` — Split layout

**Use when:** Two coordinated content regions  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use for two coordinated regions; children typically define spans or widths.

#### Complete component JSON

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
      "id": "section",
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
  ]
}
```

### `section` — Section

**Use when:** Named content grouping  

**Level:** `recommended`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use to group related content under a clear title.

#### Complete component JSON

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

**Use when:** Compact controls above content  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use above content for compact controls and actions.

#### Complete component JSON

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
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
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
      "action": "clearFilters"
    }
  ]
}
```

### `leftPanel` — Left panel

**Use when:** Persistent filter rail  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use for persistent filters; width is in pixels.

#### Complete component JSON

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
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
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
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
    }
  ],
  "width": 280,
  "collapsible": true,
  "defaultCollapsed": false
}
```

### `rightPanel` — Right panel

**Use when:** Persistent details rail  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use for selected-record details or supporting context.

#### Complete component JSON

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

**Use when:** Small intentional separation  

**Level:** `advanced`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use sparingly; prefer layout gap for routine spacing.

#### Complete component JSON

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

**Use when:** Subtle visual separation  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Use for subtle section separation.

#### Complete component JSON

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

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| field | normalized field key | Field bound to the control. |
| label | string | Visible label. |
| placeholder | string | Empty-state text. |
| min / max / step | number | Numeric bounds and increment. |
| multiple | boolean | Allow multiple values. |
| defaultValue | any JSON value | Initial value. |
| options | string[] or {label,value}[] | Static options; otherwise derive from field values where supported. |
| targets | string[] | Component IDs affected internally. |
| filter | {operator,value} | Internal filter definition. |
| action | clearFilters \| setTab | Built-in button action. |
| actionValue | string | Action payload. |
| buttons | {id,label,value?,action?}[] | Button-group definitions. |

### `searchBox` — Search box

**Use when:** Search all visible row values  

**Level:** `recommended`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Searches matching visible row values; `contains` is the normal operator.

#### Complete component JSON

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
  "targets": [
    "detail_table"
  ],
  "filter": {
    "operator": "contains",
    "value": ""
  }
}
```

### `textInput` — Text input

**Use when:** Text field filtering  

**Level:** `standard`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Best for field-specific contains filtering.

#### Complete component JSON

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
  "targets": [
    "detail_table"
  ],
  "filter": {
    "operator": "contains",
    "value": ""
  }
}
```

### `numberInput` — Number input

**Use when:** Numeric thresholds  

**Level:** `standard`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for explicit numeric thresholds.

#### Complete component JSON

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
  "targets": [
    "detail_table"
  ],
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

**Use when:** Bounded numeric filtering  

**Level:** `standard`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use only when min/max are meaningful and bounded.

#### Complete component JSON

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
  "targets": [
    "detail_table"
  ],
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

**Use when:** Compact categorical filtering  

**Level:** `recommended`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Best default categorical slicer.

#### Complete component JSON

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
  "targets": [
    "detail_table"
  ],
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

**Use when:** Filtering by several categories  

**Level:** `standard`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Uses an `in` filter for multiple values.

#### Complete component JSON

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
  "targets": [
    "detail_table"
  ],
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

**Use when:** Two to seven high-frequency choices  

**Level:** `recommended`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Best for 2–7 common choices; selected options remain compact and visible.

#### Complete component JSON

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
  "targets": [
    "detail_table"
  ],
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

**Use when:** Boolean state or view switch  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for boolean state/filter or view switch.

#### Complete component JSON

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
  "targets": [
    "detail_table"
  ],
  "filter": {
    "operator": "=",
    "value": true
  }
}
```

### `button` — Button

**Use when:** Clear filters or open a view  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for explicit built-in actions such as clearFilters.

#### Complete component JSON

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
  "action": "clearFilters",
  "actionValue": ""
}
```

### `buttonGroup` — Button group

**Use when:** Small action groups  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for mutually exclusive app-style actions or tabs.

#### Complete component JSON

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

**Use when:** Visible applied-filter summary  

**Level:** `recommended`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Displays applied filters; not a substitute for the source slicers.

#### Complete component JSON

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
  },
  "targets": [
    "detail_table"
  ]
}
```

### `dateRange` — Date range

**Use when:** Start/end date filtering  

**Level:** `standard`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Uses a `between` filter and a two-value date array.

#### Complete component JSON

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
  "targets": [
    "detail_table"
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

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| tabs | {id,title,children?}[] | Tabs and nested components. |
| children | component[] | Nested content. |
| position | left \| right | Drawer placement. |
| width | number | Drawer width in pixels. |
| openWhen | always \| selectedRow \| state | Drawer opening rule. |
| stateKey | string | State entry controlling open/closed behavior. |
| defaultOpen | boolean | Initial open state. |
| collapsible | boolean | Allow user collapse. |

### `tabs` — Tabs

**Use when:** Separate overview, map, and details  

**Level:** `recommended`  

**Capabilities:** `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use `tabs[].children`; legacy `components` or `content` may be migrated.

#### Complete component JSON

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

**Use when:** Hide secondary content  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for secondary content that should not dominate the page.

#### Complete component JSON

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

**Use when:** Compact grouped filters  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for compact grouped options/filters.

#### Complete component JSON

```json
{
  "type": "accordion",
  "id": "accordion",
  "title": "Filter group",
  "span": 12,
  "className": "hp-example-accordion",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-accordion { min-width: 0; }",
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
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
    },
    {
      "type": "slider",
      "id": "slider",
      "title": "Score",
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
      "label": "Score",
      "placeholder": "Choose score",
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
    }
  ],
  "collapsible": true,
  "defaultOpen": false
}
```

### `drawer` — Drawer / slide-over

**Use when:** Selected-record details without leaving context  

**Level:** `recommended`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Best for selected-record detail without navigating away.

#### Complete component JSON

```json
{
  "type": "drawer",
  "id": "drawer",
  "title": "Selected record",
  "span": 12,
  "className": "hp-example-drawer",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-drawer { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "position": "right",
  "width": 360,
  "openWhen": "selectedRow",
  "stateKey": "detail_drawer_open",
  "defaultOpen": true,
  "collapsible": true,
  "children": [
    {
      "type": "detailPanel",
      "id": "detailPanel",
      "title": "Record details",
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
      "emptyText": "Select a row",
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
            }
          ]
        }
      ]
    }
  ]
}
```

### `filterDrawer` — Filter drawer

**Use when:** On-demand compact filter controls  

**Level:** `recommended`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Best for on-demand filters in constrained layouts.

#### Complete component JSON

```json
{
  "type": "filterDrawer",
  "id": "filterDrawer",
  "title": "Filters",
  "span": 12,
  "className": "hp-example-filterDrawer",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-filterDrawer { min-width: 0; }",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "position": "left",
  "width": 300,
  "openWhen": "always",
  "stateKey": "filter_drawer_open",
  "defaultOpen": false,
  "collapsible": true,
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
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
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
      "defaultValue": "",
      "targets": [
        "detail_table"
      ]
    }
  ]
}
```

### `stepper` — Stepper

**Use when:** Sequential app-style flows  

**Level:** `advanced`  

**Capabilities:** `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for sequential application-style workflows.

#### Complete component JSON

```json
{
  "type": "stepper",
  "id": "stepper",
  "title": "Workflow step",
  "span": 12,
  "className": "hp-example-stepper",
  "hidden": false,
  "style": {
    "minWidth": 0
  },
  "css": ".hp-example-stepper { min-width: 0; }",
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
      "type": "infoCard",
      "id": "infoCard",
      "title": "Step instructions",
      "span": 12,
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
      "text": "Complete this step before continuing.",
      "intent": "primary"
    },
    {
      "type": "text",
      "id": "step_content",
      "span": 12,
      "text": "Supporting content",
      "interaction": {
        "enabled": false,
        "internalMode": "none",
        "externalMode": "none"
      }
    }
  ],
  "defaultOpen": true
}
```

## Display

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| field | normalized field key | Source field. |
| aggregation | sum \| avg \| min \| max \| count \| distinctCount \| countWhere \| first | Aggregation strategy. |
| format | string | currency, integer, number, percent, or model/custom format. |
| intent | neutral \| primary \| success \| warning \| danger | Semantic visual state. |
| metrics | metric[] | Metric definitions for metricGrid. |
| value | any | Static or fallback value. |
| text | string | Visible explanatory text. |
| items | item[] | Label/value or label/field entries. |
| max | number | Maximum for progress/gauge-style display. |
| selectedRow | boolean | Use current selected logical record. |
| groups | group[] | Grouped detail fields. |
| emptyText | string | Message when no selected record exists. |
| dateField / titleField | field keys | Required timeline fields. |
| categoryField / statusField / descriptionField | field keys | Optional timeline fields. |
| sortDirection | asc \| desc | Timeline order. |
| limit | number | Maximum timeline items. |

### `kpi` — KPI card

**Use when:** One decision-critical number  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`  

**Implementation note:** Keep to one decision-critical metric and a concise title.

#### Complete component JSON

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

**Use when:** Three to six summary metrics  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`  

**Implementation note:** Use 3–6 metrics with consistent formatting and intents.

#### Complete component JSON

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

**Use when:** Short explanatory or record content  

**Level:** `standard`  

**Capabilities:** `Fields`, `CSS`, `Slots`  

**Implementation note:** Use for concise context, notes, or one record value.

#### Complete component JSON

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

**Use when:** Compact status labeling  

**Level:** `standard`  

**Capabilities:** `Fields`, `CSS`, `Slots`  

**Implementation note:** Use for compact categorical state.

#### Complete component JSON

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

**Use when:** Progress toward a target  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`  

**Implementation note:** Use only when a meaningful maximum/target exists.

#### Complete component JSON

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

**Use when:** Actionable exception banner  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`  

**Implementation note:** Use for actionable exceptions, not routine information.

#### Complete component JSON

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

**Use when:** Compact label/value summary  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`  

**Implementation note:** Use for dense label/value summaries.

#### Complete component JSON

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

**Use when:** Selected-row fields, groups, badges, and copyable values  

**Level:** `recommended`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Can bind to the current selected logical record and show grouped/copyable fields.

#### Complete component JSON

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

**Use when:** Operational history and status events  

**Level:** `recommended`  

**Capabilities:** `Fields`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Sorts events by a date field and can participate in universal interaction.

#### Complete component JSON

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

## Charts

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| category | normalized field key | Category/date axis. |
| measure | normalized field key | Measure/value field. |
| aggregation | sum \| avg \| min \| max \| count \| distinctCount \| countWhere \| first | Aggregation. |
| x / y / size | normalized field keys | Scatter or advanced encodings. |
| height | number | Chart height in pixels. |
| maxDataRows | number | Data rows passed to the chart, up to the renderer policy. |
| initOptions | ECharts init object | renderer, devicePixelRatio, useDirtyRect, locale, etc. |
| setOption | ECharts setOption object | notMerge, lazyUpdate, silent, replaceMerge. |
| options | JSON-only ECharts options | Declarative chart configuration; no functions. |
| splitField | normalized field key | smallMultiples panel field. |
| chart | chart component | Child chart template for smallMultiples. |
| maxPanels | number | Maximum panels. |
| sharedScale | boolean | Intent for common scale. |

### `barChart` — Bar chart

**Use when:** Ranked category comparison  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Best for ranked or categorical comparison.

#### Complete component JSON

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
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true,
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

**Use when:** Long category labels  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Prefer when labels are long.

#### Complete component JSON

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
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true,
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

**Use when:** Time or ordered trends  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Best for ordered/time trends.

#### Complete component JSON

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
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true,
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

**Use when:** Trend plus magnitude  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Use when magnitude under the trend matters.

#### Complete component JSON

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
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true,
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

**Use when:** Few-part composition only  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Use only for a few parts of a whole.

#### Complete component JSON

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
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true,
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

**Use when:** Few-part composition with central space  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Same constraints as pie; central whitespace can hold context.

#### Complete component JSON

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
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true,
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

**Use when:** Relationship between two measures  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Use for relationships between numeric measures.

#### Complete component JSON

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
  "size": "__size_measure_field_key__",
  "height": 340,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true
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
        "symbolSize": 10,
        "emphasis": {
          "focus": "series"
        }
      }
    ]
  }
}
```

### `gauge` — Gauge

**Use when:** Single target attainment  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use sparingly for one target-attainment metric.

#### Complete component JSON

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
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true
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

**Use when:** Dense intensity comparison  

**Level:** `standard`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for dense intensity comparison across categories.

#### Complete component JSON

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
    "useDirtyRect": true
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true,
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

### `smallMultiples` — Small multiples

**Use when:** Repeat one comparison across a split field  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Use to repeat one simple chart across a split field; keep panel count low.

#### Complete component JSON

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
      "useDirtyRect": true
    },
    "setOption": {
      "notMerge": false,
      "lazyUpdate": true,
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

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| engine | native \| tabulator | Table rendering engine. |
| columns | string[] or TableColumn[] | Visible table fields and optional column config. |
| pagination | boolean | Enable paging. |
| pageSize | number | Rows per page. |
| search | boolean | Show local table search. |
| resizableColumns | boolean | Allow column resizing. |
| maxRows | number | Maximum loaded rows displayed by this table component. |
| stickyHeader | boolean | Keep header visible during scroll. |
| rows | field key[] | Matrix row dimensions. |
| values | matrix value[] | Matrix measures/aggregations. |
| showTotals | boolean | Show totals. |
| heatmap | boolean | Apply intensity styling. |

### `table` — Detail table

**Use when:** Row-level investigation and export-ready detail  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Use for row-level investigation; pagination limits DOM expansion.

#### Complete component JSON

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
  "engine": "native",
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

**Use when:** Summarized row-by-column comparison  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`  

**Implementation note:** Use for summarized row-by-column comparison.

#### Complete component JSON

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

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| height | number | Map height in pixels. |
| settings.fitBounds | boolean | Fit map to current features. |
| settings.showLayerControl | boolean | Show layer control. |
| settings.showLegend | boolean | Show legend. |
| settings.clusterPoints | boolean | Cluster point features. |
| settings.basemap | none \| tiles | Basemap mode. |
| settings.enableExternalTiles | boolean | Allow configured external tiles. |
| settings.tileUrl | string | Tile URL; provider/runtime config may override. |
| settings.coordinateSystem | EPSG:4326 \| string | Coordinate reference system. |
| settings.enableExternalGeocoder | boolean | Allow configured geocoder use. |
| settings.geocoderProvider | string | Provider ID such as arcgis. |
| style.colorMode | categorical \| gradient | Feature color behavior. |
| popup.html | sanitized template string | Popup content. |

### `map` — Map

**Use when:** Spatial patterns and selectable features  

**Level:** `recommended`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Use only when geometry/coordinates/address bindings exist; provider behavior belongs in Runtime Config.

#### Complete component JSON

```json
{
  "type": "map",
  "id": "map",
  "title": "Locations",
  "span": 12,
  "className": "hp-example-map",
  "hidden": false,
  "style": {
    "defaultPointColor": "#2563eb",
    "colorMode": "categorical",
    "gradientStart": "#dbeafe",
    "gradientEnd": "#1d4ed8",
    "radius": 7,
    "minRadius": 4,
    "maxRadius": 18,
    "lineWeight": 2,
    "minLineWeight": 1,
    "maxLineWeight": 8,
    "fillOpacity": 0.65,
    "opacity": 0.9
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
  "settings": {
    "fitBounds": true,
    "showLayerControl": true,
    "showLegend": true,
    "clusterPoints": true,
    "basemap": "tiles",
    "enableExternalTiles": true,
    "tileUrl": "",
    "coordinateSystem": "EPSG:4326",
    "enableExternalGeocoder": false,
    "geocoderProvider": "arcgis"
  },
  "popup": {
    "html": "<strong>{{__field_key__}}</strong><br/>{{__category_field_key__}}"
  }
}
```

## Custom components

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| text | string | Plain text or Markdown source depending on type. |
| html | string | Sanitized HTML. |
| repeat.source | rows | Repeat over normalized rows. |
| repeat.as | row | Template row alias. |
| repeat.limit | number | Maximum repeated wrappers. |
| repeat.template | sanitized HTML template | Repeated item markup. |
| repeat.distinctBy | field key | Render one item per distinct field value. |
| repeat.sortBy | field key | Sort repeated items. |
| repeat.sortDirection | asc \| desc | Sort order. |
| interactions.onClick.action | safe action | selectRow, selectWhere, clearSelection, setFilter, clearFilter, setState, toggleState, openTab, toggleCollapse, drillToDetail, highlight, clearHighlight. |

### `text` — Text

**Use when:** Safe plain text  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Plain safe text.

#### Complete component JSON

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

**Use when:** Structured explanatory content  

**Level:** `standard`  

**Capabilities:** `CSS`, `Slots`  

**Implementation note:** Structured explanatory content with safe Markdown.

#### Complete component JSON

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

**Use when:** Branded static content  

**Level:** `advanced`  

**Capabilities:** `CSS`, `Slots`, `HTML`  

**Implementation note:** Sanitized static HTML; no scripts or inline event handlers.

#### Complete component JSON

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

**Use when:** Safe app-like cards, lists, and slicers  

**Level:** `advanced`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`, `HTML`  

**Implementation note:** Safe HTML/CSS plus repeated rows and typed actions; engine-owned wrappers handle interaction.

#### Complete component JSON

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
    "template": "<span>{{row.__field_key__}}</span><small>{{row.__category_field_key__}}</small>",
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

## Advanced components

| Family key | Type / allowed values | Meaning |
| --- | --- | --- |
| category / measure / x / y / size | field keys | Declarative data encodings. |
| height | number | Chart height. |
| maxDataRows | number | Maximum dataset rows passed to ECharts. |
| initOptions | ECharts init object | Renderer and initialization options. |
| setOption | ECharts setOption object | Update behavior. |
| options | JSON-only ECharts options | Declarative ECharts configuration; no JavaScript functions or remote executable content. |

### `advancedChart` — Advanced ECharts

**Use when:** JSON-only radar, treemap, sankey, funnel, calendar, network, combo, or waterfall visuals  

**Level:** `advanced`  

**Capabilities:** `Fields`, `Calculations`, `CSS`, `Slots`, `Interaction`, `Power BI`  

**Implementation note:** Use only when a simple chart cannot express the decision; options must remain JSON-only.

#### Complete component JSON

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
  "size": "__size_measure_field_key__",
  "height": 420,
  "maxDataRows": 30000,
  "initOptions": {
    "renderer": "canvas",
    "devicePixelRatio": 2,
    "useDirtyRect": true,
    "useCoarsePointer": true,
    "pointerSize": 44,
    "locale": "EN"
  },
  "setOption": {
    "notMerge": false,
    "lazyUpdate": true,
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

## Custom component templates

These are the six templates shown below the Component Catalog. They are complete custom-component JSON objects, not full dashboard specifications.

### Custom KPI tile

Compact branded record count.

```json
{
  "type": "custom",
  "id": "custom_kpi",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "html": "<div class='custom-kpi'><span>Records</span><strong>{{count}}</strong></div>",
  "css": ".custom-kpi{display:grid;gap:4px;padding:12px;border:1px solid var(--hp-border);border-radius:8px;background:var(--hp-surface)}.custom-kpi span{font-size:10px;text-transform:uppercase}.custom-kpi strong{font-size:24px}"
}
```

### Custom slicer/list

Distinct externally filterable values that remain visible.

```json
{
  "type": "custom",
  "id": "custom_slicer",
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
  "repeat": {
    "source": "rows",
    "distinctBy": "__field_key__",
    "sortBy": "__field_key__",
    "sortDirection": "asc",
    "limit": 200,
    "template": "<div class='slicer-item'>{{row.__field_key__}}</div>"
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
  },
  "css": ".hp-custom-body{display:flex;flex-wrap:wrap;gap:5px}.hp-custom-repeat-row{cursor:pointer}.slicer-item{padding:5px 9px;border:1px solid var(--hp-border);border-radius:999px;background:var(--hp-surface)}.hp-custom-repeat-row.is-selected .slicer-item{border-color:var(--hp-primary);background:color-mix(in srgb,var(--hp-primary) 12%,var(--hp-surface))}"
}
```

### Custom status card

Selected/first-row status with safe tokens.

```json
{
  "type": "custom",
  "id": "custom_status",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "html": "<div class='status-card'><span>Status</span><strong>{{row.__field_key__}}</strong></div>",
  "repeat": {
    "source": "rows",
    "limit": 1,
    "template": "<div class='status-value'>{{row.__field_key__}}</div>"
  },
  "css": ".status-card,.status-value{padding:9px;border-left:3px solid var(--hp-primary);background:color-mix(in srgb,var(--hp-primary) 6%,var(--hp-surface))}.status-card span{display:block;font-size:9px;text-transform:uppercase}"
}
```

### Custom record card

Compact two-field record summary.

```json
{
  "type": "custom",
  "id": "custom_record",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "repeat": {
    "source": "rows",
    "limit": 12,
    "template": "<article class='record-card'><strong>{{row.__field_key__}}</strong><span>{{row.__second_field_key__}}</span></article>"
  },
  "css": ".hp-custom-body{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px}.record-card{display:grid;gap:2px;padding:8px;border:1px solid var(--hp-border);border-radius:6px}.record-card span{color:color-mix(in srgb,var(--hp-text) 60%,transparent);font-size:10px}"
}
```

### Custom alert banner

Safe high-visibility banner without scripts.

```json
{
  "type": "custom",
  "id": "custom_alert",
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  },
  "html": "<div class='custom-alert'><strong>Attention required</strong><span>{{count}} records are currently in scope.</span></div>",
  "css": ".custom-alert{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border:1px solid var(--hp-warning);border-radius:6px;background:color-mix(in srgb,var(--hp-warning) 10%,var(--hp-surface))}"
}
```

### Compact filter chips

Distinct compact filter chips.

```json
{
  "type": "custom",
  "id": "custom_filter_chips",
  "interaction": {
    "enabled": true,
    "trigger": "click",
    "internalMode": "none",
    "internalScope": "self",
    "externalMode": "filter",
    "field": "__field_key__",
    "operator": "=",
    "selectionMode": "toggle",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  },
  "repeat": {
    "source": "rows",
    "distinctBy": "__field_key__",
    "sortBy": "__field_key__",
    "sortDirection": "asc",
    "limit": 100,
    "template": "<span class='filter-chip'>{{row.__field_key__}}</span>"
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
  },
  "css": ".hp-custom-body{display:flex;flex-wrap:wrap;gap:4px}.filter-chip{display:block;padding:3px 7px;border:1px solid var(--hp-border);border-radius:12px;font-size:10px}.hp-custom-repeat-row.is-selected .filter-chip{background:var(--hp-primary);border-color:var(--hp-primary);color:#fff}"
}
```

## Safe actions and template tokens

| Action | Purpose |
| --- | --- |
| selectRow | Select the clicked repeated row. |
| selectWhere | Select/filter rows matching a validated expression. |
| clearSelection | Clear the current selection. |
| setFilter | Create a typed filter. |
| clearFilter | Remove a typed filter. |
| setState | Set a safe state value. |
| toggleState | Toggle a safe boolean state value. |
| openTab | Activate a tab. |
| toggleCollapse | Open/close a collapsible container. |
| drillToDetail | Open or focus detail behavior where supported. |
| highlight | Apply engine-owned highlight state. |
| clearHighlight | Clear engine-owned highlight state. |


### Common template tokens

- `{{count}}` — current row count.
- `{{row.field_key}}` — field value from the repeated/current row.
- `{{metric.metric_key}}` — calculated metric.
- `{{selected.field_key}}` — value from the current selected record.
- `{{field.field_key.displayName}}` — field metadata.
- `{{prop.name}}` — component `props`.
- `{{state.name}}` — safe component/dashboard state.

Tokens are lookups, not expressions. Use the calculation DSL for logic.

## Validation and security notes


- User JavaScript is not executed.
- Do not use scripts, `onclick`, inline event handlers, iframes, `eval`, `new Function`, or remote executable content.
- HTML is sanitized; CSS is parsed and scoped.
- `advancedChart.options` must remain JSON-only.
- Map providers and geocoders belong primarily in Runtime Config.
- Loaded Power BI rows and displayed table rows are separate concepts; use pagination and component row limits to avoid DOM expansion.
- New specifications should use `interaction`; legacy `internal`, `external`, `selectable`, and table `selectionMode` are deprecated.
