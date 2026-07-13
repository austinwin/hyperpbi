import { componentDefinitions } from "./componentDefinitions";
import { componentDocs } from "./componentDocumentation";
import { componentJsonExamples } from "./componentJsonExamples";
import { v2CommonComponentProperties, v2ComponentPropertiesByType, v2RequiredPropertiesByType } from "../schema/validateV2Schema";
import type { ComponentCapability, ComponentCategory, ComponentComplexity, ComponentMaturity, InspectorPropertyDescriptor } from "./componentTypes";

export interface FieldReferenceDescriptor { property: string; requirement?: "any" | "numeric"; source?: "powerbi" | "service" | "runtime-default"; }
export interface ComponentDescriptor {
    type: string; label: string; category: ComponentCategory; maturity: ComponentMaturity; complexity: ComponentComplexity; useWhen: string;
    capabilities: ComponentCapability;
    interaction: { defaultEnabled: boolean; naturalTrigger: "click" | "change"; autoExternalMode: "filter" | "selection" };
    schema: { required: string[]; allowed: string[]; deprecated?: Record<string,{replacement?:string;behavior:"warn"|"reject"|"migrate"}> };
    fields: FieldReferenceDescriptor[];
    inspector: InspectorPropertyDescriptor[];
    documentation: { summary: string; accessibility?: string[]; compatibility?: string[]; relatedTypes?: string[] };
    example: Record<string,unknown>;
}

const fieldNames=new Set(["field","bind","sortBy","keyField","category","measure","x","y","pointSize","splitField","dateField","titleField","categoryField","statusField","descriptionField","sourceField","targetField","valueField","labelField","groupField","primaryField","secondaryField","badgeField","stageField","columns","rows","values","series","indicators","pathFields","metrics","groups","items","repeat","interaction","interactions","layers"]);
const numericFields=new Set(["measure","x","y","pointSize","valueField","series","values"]);
const controlFor=(property:string):InspectorPropertyDescriptor=>({property,label:property.replace(/([A-Z])/g," $1").replace(/^./,value=>value.toUpperCase()),control:fieldNames.has(property)?"field":["hidden","disabled","collapsible","multiple","search","pagination"].includes(property)?"checkbox":["span","height","width","gap","columns","maxRows","pageSize","limit"].includes(property)?"number":["subtitle","description","text","html","css","svg"].includes(property)?"multiline":["dataset"].includes(property)?"dataset":["style","props","slots","data","interaction","interactions","items","tabs","children","footer","layers","view","search","legend","toolbar","settings","metrics","groups","repeat","series","values","rows"].includes(property)?"json":"text"});

export const componentDescriptors: ComponentDescriptor[]=componentDefinitions.map(definition=>{
    const doc=componentDocs[definition.type];
    const allowed=Array.from(new Set([...v2CommonComponentProperties,...(v2ComponentPropertiesByType[definition.type]??[])]));
    return {type:definition.type,label:definition.label,category:definition.category,maturity:definition.maturity,complexity:definition.complexity,useWhen:definition.useWhen,capabilities:definition.capabilities,interaction:definition.interaction,
        schema:{required:["type","id",...(v2RequiredPropertiesByType[definition.type]??[])],allowed,deprecated:{internal:{replacement:"interaction.internalMode",behavior:"warn"},external:{replacement:"interaction.externalMode",behavior:"warn"},selectable:{replacement:"interaction.showSelector",behavior:"warn"}}},
        fields:allowed.filter(property=>fieldNames.has(property)).map(property=>({property,requirement:numericFields.has(property)?"numeric":"any",source:property==="layers"?"runtime-default":"powerbi"})),
        inspector:allowed.filter(property=>property!=="type"&&property!=="id").map(controlFor),documentation:{summary:definition.useWhen,accessibility:doc?.accessibility?[doc.accessibility]:undefined,compatibility:doc?.compatibility?[doc.compatibility]:undefined,relatedTypes:doc?.related},example:componentJsonExamples[definition.type]??{type:definition.type,id:`${definition.type}-example`}};
});
export const componentDescriptorsByType=new Map(componentDescriptors.map(descriptor=>[descriptor.type,descriptor] as const));
export const getComponentDescriptor=(type:string)=>componentDescriptorsByType.get(type);
