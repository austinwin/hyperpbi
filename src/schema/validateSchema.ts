import Ajv, { ErrorObject } from "ajv";
import { HyperPbiSchema } from "./hyperpbiSchema";

const componentTypes = [
    "grid", "flex", "split", "leftPanel", "rightPanel", "toolbar", "section", "spacer", "divider",
    "searchBox", "textInput", "numberInput", "slider", "select", "multiSelect", "toggle", "button", "buttonGroup", "filterChips", "dateRange",
    "tabs", "collapsible", "accordion", "stepper", "kpi", "metricGrid", "infoCard", "statusBadge", "progressBar", "alert", "statList", "detailPanel",
    "barChart", "horizontalBarChart", "lineChart", "areaChart", "pieChart", "donutChart", "scatterChart", "gauge", "heatmap",
    "table", "map", "html", "text", "markdown", "custom"
] as const;

const schemaDefinition = {
    type: "object",
    required: ["version", "components"],
    additionalProperties: true,
    properties: {
        version: { type: "string", const: "1.0" },
        title: { type: "string", nullable: true, maxLength: 200 },
        theme: { type: "object", nullable: true, required: [], additionalProperties: true },
        layout: { type: "object", nullable: true, required: [], additionalProperties: true },
        state: { type: "object", nullable: true, required: [], additionalProperties: true },
        leftPanel: { type: "array", nullable: true, maxItems: 200, items: { $ref: "#/definitions/component" } },
        rightPanel: { type: "array", nullable: true, maxItems: 200, items: { $ref: "#/definitions/component" } },
        toolbar: { type: "array", nullable: true, maxItems: 100, items: { $ref: "#/definitions/component" } },
        components: { type: "array", maxItems: 500, items: { $ref: "#/definitions/component" } },
        css: { type: "string", nullable: true, maxLength: 100000 },
        styles: { type: "object", nullable: true, additionalProperties: true }
    },
    definitions: {
        component: {
            type: "object",
            required: ["type"],
            additionalProperties: true,
            properties: {
                type: { type: "string", enum: [...componentTypes] },
                id: { type: "string", nullable: true, pattern: "^[A-Za-z][A-Za-z0-9_-]{0,99}$" },
                title: { type: "string", nullable: true, maxLength: 200 },
                span: { type: "number", nullable: true, minimum: 1, maximum: 12 },
                children: { type: "array", nullable: true, maxItems: 200, items: { $ref: "#/definitions/component" } },
                tabs: {
                    type: "array", nullable: true, maxItems: 30,
                    items: {
                        type: "object", required: ["id", "title"], additionalProperties: true,
                        properties: { children: { type: "array", nullable: true, maxItems: 200, items: { $ref: "#/definitions/component" } } }
                    }
                }
            }
        }
    }
} as const;

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schemaDefinition);

export interface SchemaValidationResult {
    valid: boolean;
    schema?: HyperPbiSchema;
    errors: string[];
}

function formatError(error: ErrorObject): string {
    return `${error.instancePath || "/"} ${error.message ?? "is invalid"}`;
}

export function validateSchema(value: unknown): SchemaValidationResult {
    if (validate(value)) return { valid: true, schema: value as HyperPbiSchema, errors: [] };
    return { valid: false, errors: (validate.errors ?? []).map(formatError) };
}
