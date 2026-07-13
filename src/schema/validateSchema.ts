import Ajv, { ErrorObject } from "ajv";
import { HyperPbiSchema } from "./hyperpbiSchema";
import { componentTypeNames } from "../catalog/componentCatalog";
import { Diagnostic, diagnosticsToStrings } from "./diagnostics";
import { validateV2Schema, v2CommonComponentProperties, v2ComponentPropertiesByType } from "./validateV2Schema";

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
    diagnostics?: Diagnostic[];
    warnings?: string[];
}

function legacyUnknownPropertyDiagnostics(value:unknown):Diagnostic[]{const diagnostics:Diagnostic[]=[];if(!value||typeof value!=="object"||Array.isArray(value))return diagnostics;const root=value as Record<string,unknown>;const allowedRoot=new Set(["version","title","theme","layout","state","app","leftPanel","rightPanel","toolbar","components","css","styles","calculations"]);for(const key of Object.keys(root))if(!allowedRoot.has(key))diagnostics.push({code:"UNKNOWN_PROPERTY",severity:"warning",path:`/${key}`,message:`Version 1.0 ignores or leniently accepts unknown root property “${key}”.`,received:key});const visit=(node:unknown,path:string)=>{if(Array.isArray(node)){node.forEach((item,index)=>visit(item,`${path}/${index}`));return;}if(!node||typeof node!=="object")return;const component=node as Record<string,unknown>;const type=String(component.type??"");const allowed=new Set([...v2CommonComponentProperties,...(v2ComponentPropertiesByType[type]??[]),"internal","external","selectable","selectionMode"]);for(const key of Object.keys(component))if(!allowed.has(key))diagnostics.push(key==="selectionTarget"?{code:"DEPRECATED_PROPERTY",severity:"warning",path:`${path}/${key}`,componentId:typeof component.id==="string"?component.id:undefined,message:"Property selectionTarget is obsolete and ignored only for HyperPBI 1.0 compatibility.",received:key}:{code:"UNKNOWN_PROPERTY",severity:"warning",path:`${path}/${key}`,componentId:typeof component.id==="string"?component.id:undefined,message:`Version 1.0 leniently accepts unknown property “${key}” on ${type}.`,received:key});for(const key of ["children","footer","chart"])if(component[key]!==undefined)visit(component[key],`${path}/${key}`);if(Array.isArray(component.tabs))component.tabs.forEach((tab,index)=>{if(tab&&typeof tab==="object")for(const key of ["children","components","content"])visit((tab as Record<string,unknown>)[key],`${path}/tabs/${index}/${key}`);});};for(const key of ["components","toolbar","leftPanel","rightPanel"])if(Array.isArray(root[key]))visit(root[key],`/${key}`);return diagnostics;}

function formatError(error: ErrorObject): string {
    return `${error.instancePath || "/"} ${error.message ?? "is invalid"}`;
}

function componentContractErrors(value: unknown): string[] {
    const errors:string[]=[];
    const ids = new Map<string, string>();
    const nonblank = (input: unknown): input is string => typeof input === "string" && input.trim().length > 0;
    const placements = new Set(["top-start","top","top-end","right-start","right","right-end","bottom-start","bottom","bottom-end","left-start","left","left-end"]);
    const aggregations = new Set(["sum","avg","min","max","count","distinctCount","countWhere","first"]);
    const requireField = (component: Record<string, unknown>, name: string, path: string) => { if (!nonblank(component[name])) errors.push(`${path}/${name} must be a nonblank string`); };
    const validateMapTooltip=(tooltip:unknown,path:string)=>{
        if(!tooltip||typeof tooltip!=="object"||Array.isArray(tooltip)){errors.push(`${path} must be an object`);return;}
        const definition=tooltip as Record<string,unknown>;
        if(definition.enabled!==undefined&&typeof definition.enabled!=="boolean")errors.push(`${path}/enabled must be a boolean`);
        if(definition.template!==undefined&&typeof definition.template!=="string")errors.push(`${path}/template must be a string`);
        if(definition.fields!==undefined&&!Array.isArray(definition.fields))errors.push(`${path}/fields must be an array`);
        if(Array.isArray(definition.fields))definition.fields.forEach((field,index)=>{
            const fieldPath=`${path}/fields/${index}`;
            if(!field||typeof field!=="object"||Array.isArray(field)){errors.push(`${fieldPath} must be an object`);return;}
            const item=field as Record<string,unknown>;
            if(typeof item.field!=="string"||item.field.trim().length===0)errors.push(`${fieldPath}/field must be a nonblank string`);
            if(item.fieldSource!==undefined&&!(["powerbi","service","joined"] as unknown[]).includes(item.fieldSource))errors.push(`${fieldPath}/fieldSource must be powerbi, service, or joined`);
            if(item.label!==undefined&&typeof item.label!=="string")errors.push(`${fieldPath}/label must be a string`);
            if(item.format!==undefined&&typeof item.format!=="string")errors.push(`${fieldPath}/format must be a string`);
        });
    };
    const visit=(component:Record<string,unknown>,path:string)=>{
        const type=component.type;
        if (nonblank(component.id)) {
            const previous = ids.get(component.id);
            if (previous) errors.push(`${path}/id duplicates component ID “${component.id}” first declared at ${previous}/id`);
            else ids.set(component.id, path);
        }
        if (["modal","offcanvas","dropdown","popover","drawer","filterDrawer"].includes(String(type)) && !nonblank(component.id)) errors.push(`${path}/id is required and must be nonblank for ${type}`);
        if (type === "dropdown") {
            if (!Array.isArray(component.items) || component.items.length === 0) errors.push(`${path}/items must contain at least one menu item`);
            if (component.placement !== undefined && !["bottom-start","bottom-end","top-start","top-end"].includes(String(component.placement))) errors.push(`${path}/placement must be bottom-start, bottom-end, top-start, or top-end`);
        }
        if (type === "popover") {
            if (!Array.isArray(component.children) || component.children.length === 0) errors.push(`${path}/children must contain at least one component`);
            if (!component.trigger || typeof component.trigger !== "object" || Array.isArray(component.trigger)) errors.push(`${path}/trigger must be an object`);
            if (component.placement !== undefined && !placements.has(String(component.placement))) errors.push(`${path}/placement is invalid`);
            if (component.width !== undefined && (typeof component.width !== "number" || component.width < 160 || component.width > 800)) errors.push(`${path}/width must be between 160 and 800`);
        }
        if (["offcanvas","drawer","filterDrawer"].includes(String(type))) {
            if (component.position !== undefined && !["left","right"].includes(String(component.position))) errors.push(`${path}/position must be left or right`);
            if (component.width !== undefined && (typeof component.width !== "number" || component.width < 240 || component.width > 1600)) errors.push(`${path}/width must be between 240 and 1600`);
            if (component.openWhen === "state" && !nonblank(component.stateKey)) errors.push(`${path}/stateKey is required when openWhen is state`);
        }
        if (type === "modal" && !nonblank(component.title) && !nonblank(component.ariaLabel)) errors.push(`${path} modal requires title or ariaLabel`);
        if(type==="advancedChart"&&(!component.options||typeof component.options!=="object"||Array.isArray(component.options)))errors.push(`${path}/options must be a JSON object for advancedChart`);
        if (type === "comboChart") {
            requireField(component, "category", path);
            if (!Array.isArray(component.series) || component.series.length < 2) errors.push(`${path}/series must contain at least two entries`);
            else component.series.forEach((entry, index) => {
                const seriesPath = `${path}/series/${index}`; const item = entry as Record<string, unknown>;
                requireField(item, "field", seriesPath);
                if (!["bar","line"].includes(String(item.chartType))) errors.push(`${seriesPath}/chartType must be bar or line`);
                if (item.axis !== undefined && !["left","right"].includes(String(item.axis))) errors.push(`${seriesPath}/axis must be left or right`);
                if (item.aggregation !== undefined && !aggregations.has(String(item.aggregation))) errors.push(`${seriesPath}/aggregation is invalid`);
            });
        }
        if (type === "waterfallChart") { requireField(component, "category", path); requireField(component, "measure", path);if(component.aggregation!==undefined&&!aggregations.has(String(component.aggregation)))errors.push(`${path}/aggregation is invalid`); }
        if (type === "sankeyChart") {
            requireField(component, "sourceField", path); requireField(component, "targetField", path);
            if (component.selectionTarget !== undefined && !["node","edge","both"].includes(String(component.selectionTarget))) errors.push(`${path}/selectionTarget must be node, edge, or both`);
            if (component.orientation !== undefined && !["horizontal","vertical"].includes(String(component.orientation))) errors.push(`${path}/orientation must be horizontal or vertical`);
            if (component.nodeAlign !== undefined && !["left","right","justify"].includes(String(component.nodeAlign))) errors.push(`${path}/nodeAlign must be left, right, or justify`);
            if(component.aggregation!==undefined&&!aggregations.has(String(component.aggregation)))errors.push(`${path}/aggregation is invalid`);
        }
        if (type === "treemapChart") {
            if (!Array.isArray(component.pathFields) || component.pathFields.length === 0 || component.pathFields.some(field => !nonblank(field))) errors.push(`${path}/pathFields must contain at least one nonblank field`);
            else if (new Set(component.pathFields).size !== component.pathFields.length) errors.push(`${path}/pathFields must not contain duplicates`);
            requireField(component, "valueField", path);
            if(component.aggregation!==undefined&&!aggregations.has(String(component.aggregation)))errors.push(`${path}/aggregation is invalid`);
            if(component.maxDepth!==undefined&&(!Number.isInteger(component.maxDepth)||Number(component.maxDepth)<1))errors.push(`${path}/maxDepth must be a positive integer`);
            if (typeof component.maxDepth === "number" && Array.isArray(component.pathFields) && component.maxDepth > component.pathFields.length) errors.push(`${path}/maxDepth cannot exceed pathFields length`);
        }
        if (type === "funnelChart") {
            requireField(component, "category", path); requireField(component, "measure", path);
            if (component.sort !== undefined && !["ascending","descending","none"].includes(String(component.sort))) errors.push(`${path}/sort must be ascending, descending, or none`);
            if(component.aggregation!==undefined&&!aggregations.has(String(component.aggregation)))errors.push(`${path}/aggregation is invalid`);
        }
        if (type === "radarChart") {
            if (!Array.isArray(component.indicators) || component.indicators.length < 3) errors.push(`${path}/indicators must contain at least three entries`);
            else {
                const fields = new Set<string>();
                component.indicators.forEach((entry, index) => {
                    const indicatorPath = `${path}/indicators/${index}`; const item = entry as Record<string, unknown>;
                    requireField(item, "field", indicatorPath);
                    if (nonblank(item.field)) { if (fields.has(item.field)) errors.push(`${indicatorPath}/field duplicates another indicator field`); fields.add(item.field); }
                    const min = typeof item.min === "number" ? item.min : 0;
                    if (typeof item.max !== "number" || !Number.isFinite(item.max) || item.max <= min) errors.push(`${indicatorPath}/max must be greater than min`);
                    if(item.aggregation!==undefined&&!aggregations.has(String(item.aggregation)))errors.push(`${indicatorPath}/aggregation is invalid`);
                });
            }
        }
        if(type==="timeline"&&(typeof component.dateField!=="string"||typeof component.titleField!=="string"))errors.push(`${path} timeline requires dateField and titleField`);
        if(type==="matrix"&&(!Array.isArray(component.rows)||!component.rows.length||!Array.isArray(component.values)||!component.values.length))errors.push(`${path} matrix requires non-empty rows and values arrays`);
        if(type==="smallMultiples"&&(typeof component.splitField!=="string"||!component.chart||typeof component.chart!=="object"))errors.push(`${path} smallMultiples requires splitField and chart`);
        if(type==="segmentedControl"&&typeof component.field!=="string"&&!Array.isArray(component.options))errors.push(`${path} segmentedControl requires field or options`);
        if(type==="map"&&Array.isArray(component.layers))component.layers.forEach((layer,index)=>{
            if(!layer||typeof layer!=="object")return;
            const tooltip=(layer as Record<string,unknown>).tooltip;
            if(tooltip!==undefined)validateMapTooltip(tooltip,`${path}/layers/${index}/tooltip`);
        });
        if(Array.isArray(component.children))component.children.forEach((child,index)=>{if(child&&typeof child==="object")visit(child as Record<string,unknown>,`${path}/children/${index}`);});
        if(Array.isArray(component.footer))component.footer.forEach((child,index)=>{if(child&&typeof child==="object")visit(child as Record<string,unknown>,`${path}/footer/${index}`);});
        if(Array.isArray(component.tabs))component.tabs.forEach((tab,index)=>{if(!tab||typeof tab!=="object")return;const record=tab as Record<string,unknown>;for(const key of ["children","components","content"]){const children=record[key];if(Array.isArray(children))children.forEach((child,childIndex)=>{if(child&&typeof child==="object")visit(child as Record<string,unknown>,`${path}/tabs/${index}/${key}/${childIndex}`);});}});
        if(type==="accordion"&&Array.isArray(component.items))component.items.forEach((item,index)=>{if(!item||typeof item!=="object")return;const children=(item as Record<string,unknown>).children;if(Array.isArray(children))children.forEach((child,childIndex)=>{if(child&&typeof child==="object")visit(child as Record<string,unknown>,`${path}/items/${index}/children/${childIndex}`);});});
        if(type==="avatarGroup"&&Array.isArray(component.avatars))component.avatars.forEach((child,index)=>{if(child&&typeof child==="object")visit(child as Record<string,unknown>,`${path}/avatars/${index}`);});
        if(component.chart&&typeof component.chart==="object")visit(component.chart as Record<string,unknown>,`${path}/chart`);
    };
    if(value&&typeof value==="object"){const root=value as Record<string,unknown>;for(const key of ["leftPanel","rightPanel","toolbar","components"]){const components=root[key];if(Array.isArray(components))components.forEach((component,index)=>{if(component&&typeof component==="object")visit(component as Record<string,unknown>,`/${key}/${index}`);});}}
    return errors;
}

export function validateSchema(value: unknown): SchemaValidationResult {
    if (value && typeof value === "object" && (value as {version?:unknown}).version === "2.0") {
        const result=validateV2Schema(value);
        return { valid:result.valid, schema:result.schema, diagnostics:result.diagnostics, errors:diagnosticsToStrings(result.diagnostics.filter(item=>item.severity==="error")), warnings:diagnosticsToStrings(result.diagnostics.filter(item=>item.severity==="warning")) };
    }
    if (validate(value)) { const errors=componentContractErrors(value);if(errors.length)return{valid:false,errors};const diagnostics=legacyUnknownPropertyDiagnostics(value);return{ valid: true, schema: value as HyperPbiSchema, errors: [],diagnostics,warnings:diagnosticsToStrings(diagnostics) }; }
    return { valid: false, errors: (validate.errors ?? []).map(formatError) };
}
