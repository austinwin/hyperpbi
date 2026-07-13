import { componentDescriptors } from "./componentDescriptors";
import type { ComponentCapability, ComponentCategory, ComponentComplexity, ComponentMaturity } from "./componentTypes";
export interface ComponentDefinition {type:string;label:string;category:ComponentCategory;useWhen:string;complexity:ComponentComplexity;level:ComponentComplexity;maturity:ComponentMaturity;capabilities:ComponentCapability;interaction:{defaultEnabled:boolean;naturalTrigger:"click"|"change";autoExternalMode:"filter"|"selection"};}
export const componentDefinitions:ComponentDefinition[]=componentDescriptors.map(descriptor=>({type:descriptor.type,label:descriptor.label,category:descriptor.category,useWhen:descriptor.useWhen,complexity:descriptor.complexity,level:descriptor.complexity,maturity:descriptor.maturity,capabilities:descriptor.capabilities,interaction:descriptor.interaction}));
export const componentDefinitionsByType=new Map(componentDefinitions.map(definition=>[definition.type,definition] as const));
export const getComponentDefinition=(type:string)=>componentDefinitionsByType.get(type);
