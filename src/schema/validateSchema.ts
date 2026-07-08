import Ajv, { ErrorObject } from "ajv";
import { HyperPbiSchema } from "./hyperpbiSchema";
import { componentTypeNames } from "../catalog/componentCatalog";

const componentTypes = componentTypeNames;

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
                type: { type: "string", enum: componentTypes },
                id: { type: "string", nullable: true, pattern: "^[A-Za-z][A-Za-z0-9_-]{0,99}$" },
                title: { type: "string", nullable: true, maxLength: 200 },
                span: { type: "number", nullable: true, minimum: 1, maximum: 12 },
                interaction: { type:"object", nullable:true, additionalProperties:false, properties:{ enabled:{type:"boolean",nullable:true}, trigger:{type:"string",enum:["auto","click","change"],nullable:true}, internalMode:{type:"string",enum:["none","highlight","filter"],nullable:true}, internalScope:{type:"string",enum:["self","others","all"],nullable:true}, externalMode:{type:"string",enum:["none","auto","selection","filter"],nullable:true}, field:{type:"string",nullable:true}, operator:{type:"string",enum:["=","!=",">",">=","<","<=","contains","in","between"],nullable:true}, value:{}, selectionMode:{type:"string",enum:["replace","toggle","add"],nullable:true}, multiSelect:{type:"boolean",nullable:true}, showSelector:{type:"boolean",nullable:true}, clearOnSecondClick:{type:"boolean",nullable:true} } },
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

function componentContractErrors(value: unknown): string[] {
    const errors:string[]=[];
    const visit=(component:Record<string,unknown>,path:string)=>{
        const type=component.type;
        if(type==="advancedChart"&&(!component.options||typeof component.options!=="object"||Array.isArray(component.options)))errors.push(`${path}/options must be a JSON object for advancedChart`);
        if(type==="timeline"&&(typeof component.dateField!=="string"||typeof component.titleField!=="string"))errors.push(`${path} timeline requires dateField and titleField`);
        if(type==="matrix"&&(!Array.isArray(component.rows)||!component.rows.length||!Array.isArray(component.values)||!component.values.length))errors.push(`${path} matrix requires non-empty rows and values arrays`);
        if(type==="smallMultiples"&&(typeof component.splitField!=="string"||!component.chart||typeof component.chart!=="object"))errors.push(`${path} smallMultiples requires splitField and chart`);
        if(type==="segmentedControl"&&typeof component.field!=="string"&&!Array.isArray(component.options))errors.push(`${path} segmentedControl requires field or options`);
        if(Array.isArray(component.children))component.children.forEach((child,index)=>{if(child&&typeof child==="object")visit(child as Record<string,unknown>,`${path}/children/${index}`);});
        if(Array.isArray(component.tabs))component.tabs.forEach((tab,index)=>{if(!tab||typeof tab!=="object")return;const children=(tab as Record<string,unknown>).children;if(Array.isArray(children))children.forEach((child,childIndex)=>{if(child&&typeof child==="object")visit(child as Record<string,unknown>,`${path}/tabs/${index}/children/${childIndex}`);});});
        if(component.chart&&typeof component.chart==="object")visit(component.chart as Record<string,unknown>,`${path}/chart`);
    };
    if(value&&typeof value==="object"){const root=value as Record<string,unknown>;for(const key of ["leftPanel","rightPanel","toolbar","components"]){const components=root[key];if(Array.isArray(components))components.forEach((component,index)=>{if(component&&typeof component==="object")visit(component as Record<string,unknown>,`/${key}/${index}`);});}}
    return errors;
}

export function validateSchema(value: unknown): SchemaValidationResult {
    if (validate(value)) { const errors=componentContractErrors(value); return errors.length?{valid:false,errors}:{ valid: true, schema: value as HyperPbiSchema, errors: [] }; }
    return { valid: false, errors: (validate.errors ?? []).map(formatError) };
}
