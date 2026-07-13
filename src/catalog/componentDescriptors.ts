import type { ComponentCapability, ComponentCategory, ComponentComplexity, ComponentMaturity, InspectorPropertyDescriptor } from "./componentTypes";

export type ComponentRenderMode = "direct" | "overlay" | "legacy";
export type FieldTraversalHandler = "scalar" | "field-array" | "table-columns" | "matrix-rows" | "matrix-values" | "combo-series" | "radar-indicators" | "display-metrics" | "detail-groups" | "item-bindings" | "repeat-bindings" | "interaction" | "event-actions" | "map-layers" | "svg-elements";
export interface FieldReferenceDescriptor { property:string; requirement:"any"|"numeric"; handler:FieldTraversalHandler; }
export interface ComponentContainerDescriptor { property:string; kind:"array"|"tabs"|"accordion"|"single"; allowedTypes?:string[]; }
export interface ComponentDescriptor {
    type:string; label:string; category:ComponentCategory; maturity:ComponentMaturity; complexity:ComponentComplexity; useWhen:string;
    capabilities:ComponentCapability;
    interaction:{defaultEnabled:boolean;naturalTrigger:"click"|"change";autoExternalMode:"filter"|"selection"};
    schema:{required:string[];allowed:string[];deprecated?:Record<string,{replacement?:string;behavior:"warn"|"reject"|"migrate"}>};
    fields:FieldReferenceDescriptor[];
    inspector:InspectorPropertyDescriptor[];
    documentation:{summary:string;accessibility?:string[];compatibility?:string[];relatedTypes?:string[]};
    example:Record<string,unknown>;
    rendering:ComponentRenderMode;
    containers:ComponentContainerDescriptor[];
}

export const componentDescriptors:ComponentDescriptor[] = [
  {
    "type": "grid",
    "label": "Grid",
    "category": "Layout",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Responsive 12-column dashboard sections",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Responsive 12-column dashboard sections",
      "relatedTypes": [
        "flex",
        "section"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "flex",
    "label": "Flex row/column",
    "category": "Layout",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Compact toolbars and flowing groups",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Compact toolbars and flowing groups",
      "relatedTypes": [
        "grid",
        "toolbar"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "split",
    "label": "Split layout",
    "category": "Layout",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Two coordinated content regions",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Two coordinated content regions",
      "relatedTypes": [
        "leftPanel",
        "rightPanel"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "section",
    "label": "Section",
    "category": "Layout",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Named content grouping",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Named content grouping",
      "relatedTypes": [
        "card",
        "collapsible"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "toolbar",
    "label": "Toolbar",
    "category": "Layout",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Compact controls above content",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Compact controls above content",
      "relatedTypes": [
        "flex"
      ]
    },
    "example": {
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
          "action": "clearFilters"
        }
      ]
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "leftPanel",
    "label": "Left panel",
    "category": "Layout",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Persistent filter rail",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Persistent filter rail",
      "compatibility": [
        "Legacy left-panel rail. Use app.sidebar or an offcanvas component for new dashboards."
      ],
      "relatedTypes": [
        "rightPanel",
        "offcanvas"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "rightPanel",
    "label": "Right panel",
    "category": "Layout",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Persistent details rail",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Persistent details rail",
      "compatibility": [
        "Legacy right-panel rail."
      ],
      "relatedTypes": [
        "leftPanel",
        "offcanvas"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "spacer",
    "label": "Spacer",
    "category": "Layout",
    "maturity": "beta",
    "complexity": "advanced",
    "useWhen": "Small intentional separation",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      }
    ],
    "documentation": {
      "summary": "Small intentional separation"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "avatars",
        "kind": "array"
      }
    ]
  },
  {
    "type": "divider",
    "label": "Divider",
    "category": "Layout",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Subtle visual separation",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Subtle visual separation"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "searchBox",
    "label": "Search box",
    "category": "Controls",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Search all visible row values",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Search all visible row values"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "textInput",
    "label": "Text input",
    "category": "Controls",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Text field filtering",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Text field filtering"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "numberInput",
    "label": "Number input",
    "category": "Controls",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Numeric thresholds",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Numeric thresholds"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "slider",
    "label": "Slider",
    "category": "Controls",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Bounded numeric filtering",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Bounded numeric filtering"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "select",
    "label": "Select",
    "category": "Controls",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Compact categorical filtering",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Compact categorical filtering",
      "accessibility": [
        "Uses native <select> element."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "multiSelect",
    "label": "Multi-select",
    "category": "Controls",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Filtering by several categories",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Filtering by several categories"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "segmentedControl",
    "label": "Segmented control",
    "category": "Controls",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Two to seven high-frequency choices",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Two to seven high-frequency choices",
      "relatedTypes": [
        "buttonGroup"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "toggle",
    "label": "Toggle",
    "category": "Controls",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Boolean state or view switch",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Boolean state or view switch"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "button",
    "label": "Button",
    "category": "Controls",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Clear filters or open a view",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Clear filters or open a view",
      "compatibility": [
        "Legacy action/actionValue normalized to uiAction internally. Prefer uiAction for new specs."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "buttonGroup",
    "label": "Button group",
    "category": "Controls",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Small action groups",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Small action groups"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "filterChips",
    "label": "Filter chips",
    "category": "Controls",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Visible applied-filter summary",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Visible applied-filter summary"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "dateRange",
    "label": "Date range",
    "category": "Controls",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Start/end date filtering",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "change",
      "autoExternalMode": "filter"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Start/end date filtering"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "tabs",
    "label": "Tabs",
    "category": "Navigation",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Separate overview, map, and details",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "tabs"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "tabs"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "tabs",
        "label": "tabs",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Separate overview, map, and details"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "tabs.children",
        "kind": "tabs"
      },
      {
        "property": "tabs.components",
        "kind": "tabs"
      },
      {
        "property": "tabs.content",
        "kind": "tabs"
      }
    ]
  },
  {
    "type": "collapsible",
    "label": "Collapsible section",
    "category": "Navigation",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Hide secondary content",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Hide secondary content",
      "relatedTypes": [
        "accordion"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "accordion",
    "label": "Accordion",
    "category": "Navigation",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Compact grouped filters",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "items"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "multiple",
        "defaultOpenItems",
        "items"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultOpenItems",
        "label": "defaultOpenItems",
        "control": "text"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Compact grouped filters",
      "accessibility": [
        "Supports arrow-key navigation between headers. Enter/Space toggles. Proper aria-expanded."
      ],
      "compatibility": [
        "Legacy accordion with only children wraps into one item automatically."
      ],
      "relatedTypes": [
        "collapsible"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "items.children",
        "kind": "accordion"
      }
    ]
  },
  {
    "type": "drawer",
    "label": "Drawer / slide-over",
    "category": "Navigation",
    "maturity": "legacy",
    "complexity": "recommended",
    "useWhen": "Selected-record details without leaving context",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen",
        "position",
        "openWhen",
        "stateKey"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      },
      {
        "property": "position",
        "label": "position",
        "control": "enum",
        "options": [
          "left",
          "right"
        ]
      },
      {
        "property": "openWhen",
        "label": "openWhen",
        "control": "text"
      },
      {
        "property": "stateKey",
        "label": "stateKey",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Selected-record details without leaving context",
      "compatibility": [
        "Legacy drawer. Normalized to offcanvas internally. Use offcanvas for new specs."
      ],
      "relatedTypes": [
        "offcanvas",
        "filterDrawer"
      ]
    },
    "example": {
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
    },
    "rendering": "overlay",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "filterDrawer",
    "label": "Filter drawer",
    "category": "Navigation",
    "maturity": "legacy",
    "complexity": "recommended",
    "useWhen": "On-demand compact filter controls",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen",
        "position",
        "openWhen",
        "stateKey"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      },
      {
        "property": "position",
        "label": "position",
        "control": "enum",
        "options": [
          "left",
          "right"
        ]
      },
      {
        "property": "openWhen",
        "label": "openWhen",
        "control": "text"
      },
      {
        "property": "stateKey",
        "label": "stateKey",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "On-demand compact filter controls",
      "compatibility": [
        "Legacy filter drawer. Use offcanvas for new specs."
      ],
      "relatedTypes": [
        "drawer",
        "offcanvas"
      ]
    },
    "example": {
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
      ]
    },
    "rendering": "overlay",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "steps",
    "label": "Steps",
    "category": "Navigation",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Sequential workflow progression",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "items"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "orientation",
        "activeStep",
        "stateKey",
        "clickable",
        "items"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "activeStep",
        "label": "activeStep",
        "control": "text"
      },
      {
        "property": "stateKey",
        "label": "stateKey",
        "control": "text"
      },
      {
        "property": "clickable",
        "label": "clickable",
        "control": "checkbox"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Sequential workflow progression",
      "relatedTypes": [
        "tracking"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "stepper",
    "label": "Stepper",
    "category": "Navigation",
    "maturity": "legacy",
    "complexity": "advanced",
    "useWhen": "Sequential app-style flows (legacy)",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Sequential app-style flows (legacy)",
      "compatibility": [
        "Legacy stepper rendered as collapsible section. Use steps for real workflow progression."
      ],
      "relatedTypes": [
        "steps"
      ]
    },
    "example": {
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
    },
    "rendering": "legacy",
    "containers": []
  },
  {
    "type": "kpi",
    "label": "KPI card",
    "category": "Display",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "One decision-critical number",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "format",
        "intent",
        "metrics",
        "value",
        "text",
        "items",
        "max",
        "selectedRow",
        "groups",
        "emptyText"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "metrics",
        "requirement": "any",
        "handler": "display-metrics"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "groups",
        "requirement": "any",
        "handler": "detail-groups"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      },
      {
        "property": "intent",
        "label": "intent",
        "control": "text"
      },
      {
        "property": "metrics",
        "label": "metrics",
        "control": "json"
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      },
      {
        "property": "groups",
        "label": "groups",
        "control": "json"
      },
      {
        "property": "emptyText",
        "label": "emptyText",
        "control": "multiline"
      }
    ],
    "documentation": {
      "summary": "One decision-critical number"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "metricGrid",
    "label": "Metric grid",
    "category": "Display",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Three to six summary metrics",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "format",
        "intent",
        "metrics",
        "value",
        "text",
        "items",
        "max",
        "selectedRow",
        "groups",
        "emptyText"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "metrics",
        "requirement": "any",
        "handler": "display-metrics"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "groups",
        "requirement": "any",
        "handler": "detail-groups"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      },
      {
        "property": "intent",
        "label": "intent",
        "control": "text"
      },
      {
        "property": "metrics",
        "label": "metrics",
        "control": "json"
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      },
      {
        "property": "groups",
        "label": "groups",
        "control": "json"
      },
      {
        "property": "emptyText",
        "label": "emptyText",
        "control": "multiline"
      }
    ],
    "documentation": {
      "summary": "Three to six summary metrics"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "infoCard",
    "label": "Info card",
    "category": "Display",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Short explanatory or record content",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "format",
        "intent",
        "metrics",
        "value",
        "text",
        "items",
        "max",
        "selectedRow",
        "groups",
        "emptyText"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "metrics",
        "requirement": "any",
        "handler": "display-metrics"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "groups",
        "requirement": "any",
        "handler": "detail-groups"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      },
      {
        "property": "intent",
        "label": "intent",
        "control": "text"
      },
      {
        "property": "metrics",
        "label": "metrics",
        "control": "json"
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      },
      {
        "property": "groups",
        "label": "groups",
        "control": "json"
      },
      {
        "property": "emptyText",
        "label": "emptyText",
        "control": "multiline"
      }
    ],
    "documentation": {
      "summary": "Short explanatory or record content"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "statusBadge",
    "label": "Status badge",
    "category": "Display",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Compact status labeling",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "format",
        "intent",
        "metrics",
        "value",
        "text",
        "items",
        "max",
        "selectedRow",
        "groups",
        "emptyText"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "metrics",
        "requirement": "any",
        "handler": "display-metrics"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "groups",
        "requirement": "any",
        "handler": "detail-groups"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      },
      {
        "property": "intent",
        "label": "intent",
        "control": "text"
      },
      {
        "property": "metrics",
        "label": "metrics",
        "control": "json"
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      },
      {
        "property": "groups",
        "label": "groups",
        "control": "json"
      },
      {
        "property": "emptyText",
        "label": "emptyText",
        "control": "multiline"
      }
    ],
    "documentation": {
      "summary": "Compact status labeling"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "progressBar",
    "label": "Progress bar",
    "category": "Display",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Progress toward a target",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "format",
        "intent",
        "metrics",
        "value",
        "text",
        "items",
        "max",
        "selectedRow",
        "groups",
        "emptyText"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "metrics",
        "requirement": "any",
        "handler": "display-metrics"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "groups",
        "requirement": "any",
        "handler": "detail-groups"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      },
      {
        "property": "intent",
        "label": "intent",
        "control": "text"
      },
      {
        "property": "metrics",
        "label": "metrics",
        "control": "json"
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      },
      {
        "property": "groups",
        "label": "groups",
        "control": "json"
      },
      {
        "property": "emptyText",
        "label": "emptyText",
        "control": "multiline"
      }
    ],
    "documentation": {
      "summary": "Progress toward a target"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "alert",
    "label": "Alert",
    "category": "Display",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Actionable exception banner",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "format",
        "intent",
        "metrics",
        "value",
        "text",
        "items",
        "max",
        "selectedRow",
        "groups",
        "emptyText"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "metrics",
        "requirement": "any",
        "handler": "display-metrics"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "groups",
        "requirement": "any",
        "handler": "detail-groups"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      },
      {
        "property": "intent",
        "label": "intent",
        "control": "text"
      },
      {
        "property": "metrics",
        "label": "metrics",
        "control": "json"
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      },
      {
        "property": "groups",
        "label": "groups",
        "control": "json"
      },
      {
        "property": "emptyText",
        "label": "emptyText",
        "control": "multiline"
      }
    ],
    "documentation": {
      "summary": "Actionable exception banner"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "statList",
    "label": "Stat list",
    "category": "Display",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Compact label/value summary",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "format",
        "intent",
        "metrics",
        "value",
        "text",
        "items",
        "max",
        "selectedRow",
        "groups",
        "emptyText"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "metrics",
        "requirement": "any",
        "handler": "display-metrics"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "groups",
        "requirement": "any",
        "handler": "detail-groups"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      },
      {
        "property": "intent",
        "label": "intent",
        "control": "text"
      },
      {
        "property": "metrics",
        "label": "metrics",
        "control": "json"
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      },
      {
        "property": "groups",
        "label": "groups",
        "control": "json"
      },
      {
        "property": "emptyText",
        "label": "emptyText",
        "control": "multiline"
      }
    ],
    "documentation": {
      "summary": "Compact label/value summary"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "detailPanel",
    "label": "Detail panel",
    "category": "Display",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Selected-row fields, groups, badges, and copyable values",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "format",
        "intent",
        "metrics",
        "value",
        "text",
        "items",
        "max",
        "selectedRow",
        "groups",
        "emptyText"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "metrics",
        "requirement": "any",
        "handler": "display-metrics"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "groups",
        "requirement": "any",
        "handler": "detail-groups"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      },
      {
        "property": "intent",
        "label": "intent",
        "control": "text"
      },
      {
        "property": "metrics",
        "label": "metrics",
        "control": "json"
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      },
      {
        "property": "groups",
        "label": "groups",
        "control": "json"
      },
      {
        "property": "emptyText",
        "label": "emptyText",
        "control": "multiline"
      }
    ],
    "documentation": {
      "summary": "Selected-row fields, groups, badges, and copyable values"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "timeline",
    "label": "Timeline / activity feed",
    "category": "Display",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Operational history and status events",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "dateField",
        "titleField"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "dateField",
        "titleField",
        "categoryField",
        "statusField",
        "descriptionField",
        "sortDirection",
        "limit"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "dateField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "titleField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "categoryField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "statusField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "descriptionField",
        "requirement": "any",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "dateField",
        "label": "dateField",
        "control": "field"
      },
      {
        "property": "titleField",
        "label": "titleField",
        "control": "field"
      },
      {
        "property": "categoryField",
        "label": "categoryField",
        "control": "field"
      },
      {
        "property": "statusField",
        "label": "statusField",
        "control": "field"
      },
      {
        "property": "descriptionField",
        "label": "descriptionField",
        "control": "field"
      },
      {
        "property": "sortDirection",
        "label": "sortDirection",
        "control": "text"
      },
      {
        "property": "limit",
        "label": "limit",
        "control": "number"
      }
    ],
    "documentation": {
      "summary": "Operational history and status events"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "card",
    "label": "Card",
    "category": "Primitives",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Professional content container with header",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen",
        "padding",
        "header",
        "actions",
        "footer",
        "status"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      },
      {
        "property": "padding",
        "label": "padding",
        "control": "text"
      },
      {
        "property": "header",
        "label": "header",
        "control": "json"
      },
      {
        "property": "actions",
        "label": "actions",
        "control": "json"
      },
      {
        "property": "footer",
        "label": "footer",
        "control": "json"
      },
      {
        "property": "status",
        "label": "status",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Professional content container with header",
      "relatedTypes": [
        "section",
        "collapsible"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      },
      {
        "property": "footer",
        "kind": "array"
      }
    ]
  },
  {
    "type": "icon",
    "label": "Icon",
    "category": "Primitives",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Safe SVG icon from bundled registry",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "icon"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Safe SVG icon from bundled registry",
      "accessibility": [
        "Use ariaLabel when the icon is the only visible content."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "iconButton",
    "label": "Icon button",
    "category": "Primitives",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Compact accessible icon action",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "icon",
        "ariaLabel"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Compact accessible icon action",
      "accessibility": [
        "ariaLabel is required. Tooltips provide additional context."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "avatar",
    "label": "Avatar",
    "category": "Primitives",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Identity indicator with initials",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "initials",
        "label",
        "shape",
        "status"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "initials",
        "label": "initials",
        "control": "text"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "shape",
        "label": "shape",
        "control": "text"
      },
      {
        "property": "status",
        "label": "status",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Identity indicator with initials"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "avatarGroup",
    "label": "Avatar group",
    "category": "Primitives",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Stacked identity indicators",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "avatars"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "avatars",
        "max"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "avatars",
        "label": "avatars",
        "control": "json"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      }
    ],
    "documentation": {
      "summary": "Stacked identity indicators"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "listGroup",
    "label": "List group",
    "category": "Primitives",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Compact row list with badges and actions",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "items",
        "source",
        "primaryField",
        "secondaryField",
        "badgeField",
        "valueField",
        "maxItems",
        "compact"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "primaryField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "secondaryField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "badgeField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "valueField",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "source",
        "label": "source",
        "control": "text"
      },
      {
        "property": "primaryField",
        "label": "primaryField",
        "control": "field"
      },
      {
        "property": "secondaryField",
        "label": "secondaryField",
        "control": "field"
      },
      {
        "property": "badgeField",
        "label": "badgeField",
        "control": "field"
      },
      {
        "property": "valueField",
        "label": "valueField",
        "control": "field"
      },
      {
        "property": "maxItems",
        "label": "maxItems",
        "control": "text"
      },
      {
        "property": "compact",
        "label": "compact",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Compact row list with badges and actions",
      "relatedTypes": [
        "dataGrid"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "dataGrid",
    "label": "Data grid",
    "category": "Primitives",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Record detail label/value layout",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "items",
        "source",
        "columns",
        "selectedRow"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "source",
        "label": "source",
        "control": "text"
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "selectedRow",
        "label": "selectedRow",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Record detail label/value layout",
      "relatedTypes": [
        "listGroup",
        "detailPanel"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "countUp",
    "label": "Count-up",
    "category": "Primitives",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Animated number with prefix/suffix",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "aggregation",
        "value",
        "prefix",
        "suffix",
        "duration",
        "format"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "value",
        "label": "value",
        "control": "text"
      },
      {
        "property": "prefix",
        "label": "prefix",
        "control": "text"
      },
      {
        "property": "suffix",
        "label": "suffix",
        "control": "text"
      },
      {
        "property": "duration",
        "label": "duration",
        "control": "number"
      },
      {
        "property": "format",
        "label": "format",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Animated number with prefix/suffix",
      "accessibility": [
        "Respects prefers-reduced-motion. Animation disabled under reduced motion."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "tracking",
    "label": "Tracking",
    "category": "Primitives",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Compact stage progress display",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "stages"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "stages",
        "activeStage",
        "stageField",
        "orientation",
        "compact"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "stageField",
        "requirement": "any",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "stages",
        "label": "stages",
        "control": "json"
      },
      {
        "property": "activeStage",
        "label": "activeStage",
        "control": "text"
      },
      {
        "property": "stageField",
        "label": "stageField",
        "control": "field"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "compact",
        "label": "compact",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Compact stage progress display",
      "relatedTypes": [
        "steps"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "dropdown",
    "label": "Dropdown",
    "category": "Primitives",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Compact action menu",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "items"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "trigger",
        "items",
        "placement",
        "closeOnSelect"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "items",
        "requirement": "any",
        "handler": "item-bindings"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "trigger",
        "label": "trigger",
        "control": "json"
      },
      {
        "property": "items",
        "label": "items",
        "control": "json"
      },
      {
        "property": "placement",
        "label": "placement",
        "control": "text"
      },
      {
        "property": "closeOnSelect",
        "label": "closeOnSelect",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Compact action menu",
      "accessibility": [
        "Menu roles, roving arrow-key focus, Home/End, nested-menu keys, Escape/Tab dismissal, and trigger focus restoration are supported."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "modal",
    "label": "Modal",
    "category": "Primitives",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Focused overlay with children",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen",
        "backdropClose",
        "footer"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      },
      {
        "property": "backdropClose",
        "label": "backdropClose",
        "control": "checkbox"
      },
      {
        "property": "footer",
        "label": "footer",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Focused overlay with children",
      "accessibility": [
        "Initial focus, focus trap, Escape close, labelled dialog semantics, and trigger focus restoration are supported."
      ]
    },
    "example": {
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
    },
    "rendering": "overlay",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      },
      {
        "property": "footer",
        "kind": "array"
      }
    ]
  },
  {
    "type": "offcanvas",
    "label": "Offcanvas",
    "category": "Primitives",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Slide-over panel for details/filters",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen",
        "position",
        "openWhen",
        "stateKey",
        "backdrop",
        "backdropClose"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      },
      {
        "property": "position",
        "label": "position",
        "control": "enum",
        "options": [
          "left",
          "right"
        ]
      },
      {
        "property": "openWhen",
        "label": "openWhen",
        "control": "text"
      },
      {
        "property": "stateKey",
        "label": "stateKey",
        "control": "text"
      },
      {
        "property": "backdrop",
        "label": "backdrop",
        "control": "text"
      },
      {
        "property": "backdropClose",
        "label": "backdropClose",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Slide-over panel for details/filters",
      "accessibility": [
        "Uses dialog semantics, managed focus, Escape/backdrop close, an accessible close button, and internal scrolling."
      ],
      "relatedTypes": [
        "drawer",
        "filterDrawer",
        "modal"
      ]
    },
    "example": {
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
    },
    "rendering": "overlay",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "popover",
    "label": "Popover",
    "category": "Primitives",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Rich tooltip with actions",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "trigger",
        "children"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "children",
        "direction",
        "columns",
        "gap",
        "width",
        "collapsible",
        "defaultCollapsed",
        "defaultOpen",
        "trigger",
        "placement",
        "closeOnOutsideClick",
        "closeOnEscape",
        "showArrow"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "children",
        "label": "children",
        "control": "json"
      },
      {
        "property": "direction",
        "label": "direction",
        "control": "enum",
        "options": [
          "row",
          "column"
        ]
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "collapsible",
        "label": "collapsible",
        "control": "checkbox"
      },
      {
        "property": "defaultCollapsed",
        "label": "defaultCollapsed",
        "control": "checkbox"
      },
      {
        "property": "defaultOpen",
        "label": "defaultOpen",
        "control": "checkbox"
      },
      {
        "property": "trigger",
        "label": "trigger",
        "control": "json"
      },
      {
        "property": "placement",
        "label": "placement",
        "control": "text"
      },
      {
        "property": "closeOnOutsideClick",
        "label": "closeOnOutsideClick",
        "control": "checkbox"
      },
      {
        "property": "closeOnEscape",
        "label": "closeOnEscape",
        "control": "checkbox"
      },
      {
        "property": "showArrow",
        "label": "showArrow",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Rich tooltip with actions",
      "accessibility": [
        "Uses role=dialog, managed focus, Escape/outside dismissal, ARIA trigger relationships, and focus restoration."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "children",
        "kind": "array"
      }
    ]
  },
  {
    "type": "emptyState",
    "label": "Empty state",
    "category": "Feedback",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Placeholder when no data is available",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "description",
        "primaryAction",
        "secondaryAction",
        "compact"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "primaryAction",
        "label": "primaryAction",
        "control": "text"
      },
      {
        "property": "secondaryAction",
        "label": "secondaryAction",
        "control": "text"
      },
      {
        "property": "compact",
        "label": "compact",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Placeholder when no data is available"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "placeholder",
    "label": "Placeholder",
    "category": "Feedback",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Skeleton loading indicator",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "lines",
        "placeholderVariant"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "lines",
        "label": "lines",
        "control": "text"
      },
      {
        "property": "placeholderVariant",
        "label": "placeholderVariant",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Skeleton loading indicator",
      "accessibility": [
        "Uses aria-hidden. Respects prefers-reduced-motion."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "spinner",
    "label": "Spinner",
    "category": "Feedback",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Inline or centered loading indicator",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "label",
        "inline"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "inline",
        "label": "inline",
        "control": "checkbox"
      }
    ],
    "documentation": {
      "summary": "Inline or centered loading indicator",
      "accessibility": [
        "Uses role=status with accessible label."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "textarea",
    "label": "Text area",
    "category": "Forms",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Multi-line text input",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Multi-line text input",
      "accessibility": [
        "Associated label via generated ID."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "checkbox",
    "label": "Checkbox",
    "category": "Forms",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Single boolean toggle",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Single boolean toggle"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "checkboxGroup",
    "label": "Checkbox group",
    "category": "Forms",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Multiple choice selection",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Multiple choice selection"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "radioGroup",
    "label": "Radio group",
    "category": "Forms",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Single choice from options",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Single choice from options"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "inputGroup",
    "label": "Input group",
    "category": "Forms",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Input with safe prefix/suffix",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "field",
        "label",
        "placeholder",
        "min",
        "max",
        "step",
        "multiple",
        "defaultValue",
        "options",
        "targets",
        "filter",
        "action",
        "actionValue",
        "buttons",
        "description",
        "helpText",
        "errorText",
        "required",
        "orientation",
        "rows",
        "maxLength",
        "prefixText",
        "prefixIcon",
        "suffixText",
        "suffixIcon"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "field",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "field",
        "label": "field",
        "control": "field"
      },
      {
        "property": "label",
        "label": "label",
        "control": "text"
      },
      {
        "property": "placeholder",
        "label": "placeholder",
        "control": "text"
      },
      {
        "property": "min",
        "label": "min",
        "control": "number"
      },
      {
        "property": "max",
        "label": "max",
        "control": "number"
      },
      {
        "property": "step",
        "label": "step",
        "control": "number"
      },
      {
        "property": "multiple",
        "label": "multiple",
        "control": "checkbox"
      },
      {
        "property": "defaultValue",
        "label": "defaultValue",
        "control": "text"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "targets",
        "label": "targets",
        "control": "json"
      },
      {
        "property": "filter",
        "label": "filter",
        "control": "json"
      },
      {
        "property": "action",
        "label": "action",
        "control": "text"
      },
      {
        "property": "actionValue",
        "label": "actionValue",
        "control": "text"
      },
      {
        "property": "buttons",
        "label": "buttons",
        "control": "json"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "helpText",
        "label": "helpText",
        "control": "multiline"
      },
      {
        "property": "errorText",
        "label": "errorText",
        "control": "multiline"
      },
      {
        "property": "required",
        "label": "required",
        "control": "text"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "maxLength",
        "label": "maxLength",
        "control": "number"
      },
      {
        "property": "prefixText",
        "label": "prefixText",
        "control": "text"
      },
      {
        "property": "prefixIcon",
        "label": "prefixIcon",
        "control": "text"
      },
      {
        "property": "suffixText",
        "label": "suffixText",
        "control": "text"
      },
      {
        "property": "suffixIcon",
        "label": "suffixIcon",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Input with safe prefix/suffix"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "barChart",
    "label": "Bar chart",
    "category": "Charts",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Ranked category comparison",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Ranked category comparison"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "horizontalBarChart",
    "label": "Horizontal bar",
    "category": "Charts",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Long category labels",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Long category labels"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "lineChart",
    "label": "Line chart",
    "category": "Charts",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Time or ordered trends",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Time or ordered trends"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "areaChart",
    "label": "Area chart",
    "category": "Charts",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Trend plus magnitude",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Trend plus magnitude"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "pieChart",
    "label": "Pie chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Few-part composition only",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Few-part composition only"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "donutChart",
    "label": "Donut chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Few-part composition with central space",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Few-part composition with central space"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "scatterChart",
    "label": "Scatter chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Relationship between two measures",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "x",
        "y"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Relationship between two measures"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "gauge",
    "label": "Gauge",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Single target attainment",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Single target attainment"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "heatmap",
    "label": "Heatmap",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Dense intensity comparison",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "Dense intensity comparison"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "comboChart",
    "label": "Combo chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Compare bar and line measures on shared categories",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "series"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize",
        "series"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "series",
        "requirement": "any",
        "handler": "combo-series"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      },
      {
        "property": "series",
        "label": "series",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Compare bar and line measures on shared categories",
      "accessibility": [
        "Each series/category point maps back to its source rows."
      ],
      "relatedTypes": [
        "barChart",
        "lineChart"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "waterfallChart",
    "label": "Waterfall chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Explain positive and negative contributions to a total",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize",
        "showStart",
        "showEnd",
        "positiveIntent",
        "negativeIntent",
        "totalIntent"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      },
      {
        "property": "showStart",
        "label": "showStart",
        "control": "checkbox"
      },
      {
        "property": "showEnd",
        "label": "showEnd",
        "control": "checkbox"
      },
      {
        "property": "positiveIntent",
        "label": "positiveIntent",
        "control": "text"
      },
      {
        "property": "negativeIntent",
        "label": "negativeIntent",
        "control": "text"
      },
      {
        "property": "totalIntent",
        "label": "totalIntent",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Explain positive and negative contributions to a total"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "sankeyChart",
    "label": "Sankey chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Show weighted flow between stages",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "sourceField",
        "targetField"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize",
        "sourceField",
        "targetField",
        "valueField",
        "orientation",
        "nodeAlign"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "sourceField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "targetField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "valueField",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      },
      {
        "property": "sourceField",
        "label": "sourceField",
        "control": "field"
      },
      {
        "property": "targetField",
        "label": "targetField",
        "control": "field"
      },
      {
        "property": "valueField",
        "label": "valueField",
        "control": "field"
      },
      {
        "property": "orientation",
        "label": "orientation",
        "control": "enum",
        "options": [
          "horizontal",
          "vertical"
        ]
      },
      {
        "property": "nodeAlign",
        "label": "nodeAlign",
        "control": "text"
      }
    ],
    "documentation": {
      "summary": "Show weighted flow between stages",
      "accessibility": [
        "Node and edge clicks retain distinct row bindings; accompany dense flows with a table when exact values matter."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "treemapChart",
    "label": "Treemap chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Explore hierarchical contribution",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "pathFields",
        "valueField"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize",
        "pathFields",
        "valueField",
        "labelField",
        "maxDepth"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pathFields",
        "requirement": "any",
        "handler": "field-array"
      },
      {
        "property": "valueField",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "labelField",
        "requirement": "any",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      },
      {
        "property": "pathFields",
        "label": "pathFields",
        "control": "json"
      },
      {
        "property": "valueField",
        "label": "valueField",
        "control": "field"
      },
      {
        "property": "labelField",
        "label": "labelField",
        "control": "field"
      },
      {
        "property": "maxDepth",
        "label": "maxDepth",
        "control": "number"
      }
    ],
    "documentation": {
      "summary": "Explore hierarchical contribution",
      "accessibility": [
        "Every hierarchy node maps to the contributing source rows."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "funnelChart",
    "label": "Funnel chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "standard",
    "useWhen": "Compare ordered process stages",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "category",
        "measure"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize",
        "sort",
        "gap"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      },
      {
        "property": "sort",
        "label": "sort",
        "control": "enum",
        "options": [
          "ascending",
          "descending",
          "none"
        ]
      },
      {
        "property": "gap",
        "label": "gap",
        "control": "number"
      }
    ],
    "documentation": {
      "summary": "Compare ordered process stages",
      "accessibility": [
        "Labels include stage values and percentages."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "radarChart",
    "label": "Radar chart",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "advanced",
    "useWhen": "Compare multivariate profiles",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "indicators"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize",
        "groupField",
        "indicators"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "groupField",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "indicators",
        "requirement": "any",
        "handler": "radar-indicators"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      },
      {
        "property": "groupField",
        "label": "groupField",
        "control": "field"
      },
      {
        "property": "indicators",
        "label": "indicators",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Compare multivariate profiles"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "smallMultiples",
    "label": "Small multiples",
    "category": "Charts",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Repeat one comparison across a split field",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "splitField",
        "chart"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "splitField",
        "chart",
        "maxPanels",
        "sharedScale",
        "height"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "splitField",
        "requirement": "any",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "splitField",
        "label": "splitField",
        "control": "field"
      },
      {
        "property": "chart",
        "label": "chart",
        "control": "text"
      },
      {
        "property": "maxPanels",
        "label": "maxPanels",
        "control": "number"
      },
      {
        "property": "sharedScale",
        "label": "sharedScale",
        "control": "checkbox"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      }
    ],
    "documentation": {
      "summary": "Repeat one comparison across a split field"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": [
      {
        "property": "chart",
        "kind": "single"
      }
    ]
  },
  {
    "type": "table",
    "label": "Detail table",
    "category": "Tables",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Row-level investigation and export-ready detail",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "engine",
        "columns",
        "pagination",
        "pageSize",
        "search",
        "resizableColumns",
        "maxRows",
        "stickyHeader",
        "density",
        "striped",
        "hover",
        "showRowCount",
        "pageSizeOptions",
        "rowActions",
        "emptyState"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "engine",
        "label": "engine",
        "control": "text"
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "pagination",
        "label": "pagination",
        "control": "checkbox"
      },
      {
        "property": "pageSize",
        "label": "pageSize",
        "control": "number"
      },
      {
        "property": "search",
        "label": "search",
        "control": "checkbox"
      },
      {
        "property": "resizableColumns",
        "label": "resizableColumns",
        "control": "checkbox"
      },
      {
        "property": "maxRows",
        "label": "maxRows",
        "control": "number"
      },
      {
        "property": "stickyHeader",
        "label": "stickyHeader",
        "control": "checkbox"
      },
      {
        "property": "density",
        "label": "density",
        "control": "enum",
        "options": [
          "compact",
          "normal"
        ]
      },
      {
        "property": "striped",
        "label": "striped",
        "control": "checkbox"
      },
      {
        "property": "hover",
        "label": "hover",
        "control": "checkbox"
      },
      {
        "property": "showRowCount",
        "label": "showRowCount",
        "control": "checkbox"
      },
      {
        "property": "pageSizeOptions",
        "label": "pageSizeOptions",
        "control": "json"
      },
      {
        "property": "rowActions",
        "label": "rowActions",
        "control": "json"
      },
      {
        "property": "emptyState",
        "label": "emptyState",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Row-level investigation and export-ready detail",
      "accessibility": [
        "Row actions use safe UiAction. Column resizing prevents row selection while active."
      ],
      "compatibility": [
        "Tabulator engine is not bundled. engine:'tabulator' is normalized to native."
      ],
      "relatedTypes": [
        "matrix"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "matrix",
    "label": "Matrix / pivot",
    "category": "Tables",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Summarized row-by-column comparison",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "rows",
        "values"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "rows",
        "columns",
        "values",
        "showTotals",
        "heatmap",
        "maxRows"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "rows",
        "requirement": "any",
        "handler": "matrix-rows"
      },
      {
        "property": "columns",
        "requirement": "any",
        "handler": "table-columns"
      },
      {
        "property": "values",
        "requirement": "any",
        "handler": "matrix-values"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "rows",
        "label": "rows",
        "control": "number"
      },
      {
        "property": "columns",
        "label": "columns",
        "control": "number"
      },
      {
        "property": "values",
        "label": "values",
        "control": "json"
      },
      {
        "property": "showTotals",
        "label": "showTotals",
        "control": "checkbox"
      },
      {
        "property": "heatmap",
        "label": "heatmap",
        "control": "checkbox"
      },
      {
        "property": "maxRows",
        "label": "maxRows",
        "control": "number"
      }
    ],
    "documentation": {
      "summary": "Summarized row-by-column comparison",
      "relatedTypes": [
        "table"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "map",
    "label": "Map",
    "category": "Maps",
    "maturity": "beta",
    "complexity": "recommended",
    "useWhen": "Power BI geometry plus practical public ArcGIS REST feature, tile, and dynamic layers",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "engine",
        "view",
        "basemap",
        "layers",
        "search",
        "legend",
        "layerPanel",
        "toolbar",
        "settings",
        "height"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "layers",
        "requirement": "any",
        "handler": "map-layers"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "engine",
        "label": "engine",
        "control": "text"
      },
      {
        "property": "view",
        "label": "view",
        "control": "json"
      },
      {
        "property": "basemap",
        "label": "basemap",
        "control": "json"
      },
      {
        "property": "layers",
        "label": "layers",
        "control": "json"
      },
      {
        "property": "search",
        "label": "search",
        "control": "checkbox"
      },
      {
        "property": "legend",
        "label": "legend",
        "control": "json"
      },
      {
        "property": "layerPanel",
        "label": "layerPanel",
        "control": "json"
      },
      {
        "property": "toolbar",
        "label": "toolbar",
        "control": "json"
      },
      {
        "property": "settings",
        "label": "settings",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      }
    ],
    "documentation": {
      "summary": "Power BI geometry plus practical public ArcGIS REST feature, tile, and dynamic layers",
      "compatibility": [
        "Legacy settings/style/popup fully supported. Normalized to layers[] internally."
      ],
      "relatedTypes": [
        "offcanvas",
        "dataGrid"
      ]
    },
    "example": {
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
      "layers": [
        {
          "id": "powerbi_locations",
          "name": "Locations",
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
        "zoomToSelection": true
      },
      "settings": {
        "showLayerControl": true,
        "showLegend": true
      }
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "text",
    "label": "Text",
    "category": "Custom components",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Safe plain text",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "text",
        "repeat"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "repeat",
        "requirement": "any",
        "handler": "repeat-bindings"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "repeat",
        "label": "repeat",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Safe plain text"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "markdown",
    "label": "Markdown",
    "category": "Custom components",
    "maturity": "stable",
    "complexity": "standard",
    "useWhen": "Structured explanatory content",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "text",
        "repeat"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "repeat",
        "requirement": "any",
        "handler": "repeat-bindings"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "repeat",
        "label": "repeat",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Structured explanatory content"
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "html",
    "label": "Sanitized HTML",
    "category": "Custom components",
    "maturity": "beta",
    "complexity": "advanced",
    "useWhen": "Branded static content",
    "capabilities": {
      "fields": false,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": false,
      "externalSelection": false,
      "customHtml": true
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "html",
        "repeat"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "repeat",
        "requirement": "any",
        "handler": "repeat-bindings"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "html",
        "label": "html",
        "control": "multiline"
      },
      {
        "property": "repeat",
        "label": "repeat",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Branded static content",
      "accessibility": [
        "HTML is sanitized with DOMPurify. No scripts, iframes, or event handlers allowed."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "custom",
    "label": "Custom HTML/CSS",
    "category": "Custom components",
    "maturity": "beta",
    "complexity": "advanced",
    "useWhen": "Safe app-like cards, lists, and slicers",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": true
    },
    "interaction": {
      "defaultEnabled": true,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "html",
        "text",
        "repeat"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "repeat",
        "requirement": "any",
        "handler": "repeat-bindings"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "html",
        "label": "html",
        "control": "multiline"
      },
      {
        "property": "text",
        "label": "text",
        "control": "multiline"
      },
      {
        "property": "repeat",
        "label": "repeat",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Safe app-like cards, lists, and slicers",
      "accessibility": [
        "Custom HTML is sanitized. Repeat rows support keyboard interaction."
      ],
      "relatedTypes": [
        "html",
        "listGroup",
        "card"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "svg",
    "label": "Declarative SVG",
    "category": "Custom components",
    "maturity": "stable",
    "complexity": "recommended",
    "useWhen": "Animated KPI cards, diagrams, gauges, pictorial marks, and schematics",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "viewBox",
        "elements"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "viewBox",
        "width",
        "height",
        "preserveAspectRatio",
        "role",
        "description",
        "elements",
        "dataContext",
        "motion",
        "performance"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "elements",
        "requirement": "any",
        "handler": "svg-elements"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "viewBox",
        "label": "viewBox",
        "control": "text"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "preserveAspectRatio",
        "label": "preserveAspectRatio",
        "control": "text"
      },
      {
        "property": "role",
        "label": "role",
        "control": "text"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "elements",
        "label": "elements",
        "control": "json"
      },
      {
        "property": "dataContext",
        "label": "dataContext",
        "control": "json"
      },
      {
        "property": "motion",
        "label": "motion",
        "control": "json"
      },
      {
        "property": "performance",
        "label": "performance",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Animated KPI cards, diagrams, gauges, pictorial marks, and schematics",
      "accessibility": [
        "ariaLabel is recommended. Interactive marks are keyboard focusable and respond to Enter and Space. Motion respects the configured reduced-motion policy."
      ],
      "relatedTypes": [
        "svgMarkup",
        "gauge",
        "progressBar"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "svgMarkup",
    "label": "Sanitized SVG markup",
    "category": "Advanced components",
    "maturity": "beta",
    "complexity": "advanced",
    "useWhen": "Strictly sanitized raw SVG when declarative SVG cannot express the design",
    "capabilities": {
      "fields": true,
      "calculations": false,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": false,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id",
        "svg"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "viewBox",
        "width",
        "height",
        "preserveAspectRatio",
        "role",
        "description",
        "svg",
        "dataContext",
        "motion",
        "performance"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "viewBox",
        "label": "viewBox",
        "control": "text"
      },
      {
        "property": "width",
        "label": "width",
        "control": "number"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "preserveAspectRatio",
        "label": "preserveAspectRatio",
        "control": "text"
      },
      {
        "property": "role",
        "label": "role",
        "control": "text"
      },
      {
        "property": "description",
        "label": "description",
        "control": "multiline"
      },
      {
        "property": "svg",
        "label": "svg",
        "control": "multiline"
      },
      {
        "property": "dataContext",
        "label": "dataContext",
        "control": "json"
      },
      {
        "property": "motion",
        "label": "motion",
        "control": "json"
      },
      {
        "property": "performance",
        "label": "performance",
        "control": "json"
      }
    ],
    "documentation": {
      "summary": "Strictly sanitized raw SVG when declarative SVG cannot express the design",
      "accessibility": [
        "The component wrapper supplies accessible image semantics; include title/desc content in the SVG where useful."
      ],
      "relatedTypes": [
        "svg"
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  },
  {
    "type": "advancedChart",
    "label": "Advanced ECharts",
    "category": "Advanced components",
    "maturity": "experimental",
    "complexity": "advanced",
    "useWhen": "JSON-only ECharts escape hatch for uncommon configurations not represented by a first-class HyperPBI chart",
    "capabilities": {
      "fields": true,
      "calculations": true,
      "css": true,
      "slots": true,
      "interactions": true,
      "externalSelection": true,
      "customHtml": false
    },
    "interaction": {
      "defaultEnabled": false,
      "naturalTrigger": "click",
      "autoExternalMode": "selection"
    },
    "schema": {
      "required": [
        "type",
        "id"
      ],
      "allowed": [
        "type",
        "id",
        "dataset",
        "title",
        "subtitle",
        "span",
        "className",
        "hidden",
        "props",
        "style",
        "css",
        "slots",
        "data",
        "visibility",
        "interactions",
        "interaction",
        "ariaLabel",
        "icon",
        "variant",
        "size",
        "disabled",
        "tooltip",
        "uiAction",
        "height",
        "maxDataRows",
        "initOptions",
        "setOption",
        "options",
        "category",
        "measure",
        "aggregation",
        "x",
        "y",
        "pointSize"
      ],
      "deprecated": {
        "internal": {
          "replacement": "interaction.internalMode",
          "behavior": "warn"
        },
        "external": {
          "replacement": "interaction.externalMode",
          "behavior": "warn"
        },
        "selectable": {
          "replacement": "interaction.showSelector",
          "behavior": "warn"
        }
      }
    },
    "fields": [
      {
        "property": "interactions",
        "requirement": "any",
        "handler": "event-actions"
      },
      {
        "property": "interaction",
        "requirement": "any",
        "handler": "interaction"
      },
      {
        "property": "category",
        "requirement": "any",
        "handler": "scalar"
      },
      {
        "property": "measure",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "x",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "y",
        "requirement": "numeric",
        "handler": "scalar"
      },
      {
        "property": "pointSize",
        "requirement": "numeric",
        "handler": "scalar"
      }
    ],
    "inspector": [
      {
        "property": "dataset",
        "label": "Dataset",
        "control": "dataset"
      },
      {
        "property": "title",
        "label": "title",
        "control": "text"
      },
      {
        "property": "subtitle",
        "label": "subtitle",
        "control": "multiline"
      },
      {
        "property": "span",
        "label": "span",
        "control": "number"
      },
      {
        "property": "className",
        "label": "className",
        "control": "text"
      },
      {
        "property": "hidden",
        "label": "hidden",
        "control": "checkbox"
      },
      {
        "property": "props",
        "label": "props",
        "control": "json"
      },
      {
        "property": "style",
        "label": "style",
        "control": "json"
      },
      {
        "property": "css",
        "label": "css",
        "control": "multiline"
      },
      {
        "property": "slots",
        "label": "slots",
        "control": "json"
      },
      {
        "property": "data",
        "label": "data",
        "control": "json"
      },
      {
        "property": "visibility",
        "label": "visibility",
        "control": "json"
      },
      {
        "property": "interactions",
        "label": "interactions",
        "control": "json"
      },
      {
        "property": "interaction",
        "label": "interaction",
        "control": "json"
      },
      {
        "property": "ariaLabel",
        "label": "ariaLabel",
        "control": "text"
      },
      {
        "property": "icon",
        "label": "icon",
        "control": "text"
      },
      {
        "property": "variant",
        "label": "variant",
        "control": "text"
      },
      {
        "property": "size",
        "label": "size",
        "control": "enum",
        "options": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl"
        ]
      },
      {
        "property": "disabled",
        "label": "disabled",
        "control": "checkbox"
      },
      {
        "property": "tooltip",
        "label": "tooltip",
        "control": "text"
      },
      {
        "property": "uiAction",
        "label": "uiAction",
        "control": "json"
      },
      {
        "property": "height",
        "label": "height",
        "control": "number"
      },
      {
        "property": "maxDataRows",
        "label": "maxDataRows",
        "control": "text"
      },
      {
        "property": "initOptions",
        "label": "initOptions",
        "control": "json"
      },
      {
        "property": "setOption",
        "label": "setOption",
        "control": "json"
      },
      {
        "property": "options",
        "label": "options",
        "control": "json"
      },
      {
        "property": "category",
        "label": "category",
        "control": "field"
      },
      {
        "property": "measure",
        "label": "measure",
        "control": "field"
      },
      {
        "property": "aggregation",
        "label": "aggregation",
        "control": "enum",
        "options": [
          "sum",
          "avg",
          "min",
          "max",
          "count",
          "distinctCount",
          "first"
        ]
      },
      {
        "property": "x",
        "label": "x",
        "control": "field"
      },
      {
        "property": "y",
        "label": "y",
        "control": "field"
      },
      {
        "property": "pointSize",
        "label": "pointSize",
        "control": "field"
      }
    ],
    "documentation": {
      "summary": "JSON-only ECharts escape hatch for uncommon configurations not represented by a first-class HyperPBI chart",
      "accessibility": [
        "ECharts options are recursively sanitized. JavaScript functions, event handlers, executable markup, and external URLs are blocked."
      ]
    },
    "example": {
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
    },
    "rendering": "direct",
    "containers": []
  }
] as ComponentDescriptor[];
export const componentDescriptorsByType=new Map(componentDescriptors.map(descriptor=>[descriptor.type,descriptor] as const));
export const getComponentDescriptor=(type:string)=>componentDescriptorsByType.get(type);
