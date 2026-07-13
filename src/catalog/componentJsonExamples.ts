import { componentDescriptors } from "./componentDescriptors";
type JsonObject=Record<string,unknown>;
export const universalInteractionReference={enabled:true,trigger:"auto",internalMode:"highlight",internalScope:"self",externalMode:"auto",field:"__field_key__",operator:"=",value:"__value__",selectionMode:"replace",multiSelect:true,showSelector:false,clearOnSecondClick:true};
export const componentJsonExamples:Record<string,JsonObject>=Object.fromEntries(componentDescriptors.map(descriptor=>[descriptor.type,descriptor.example]));
export function componentJsonExample(type:string):string{const example=componentJsonExamples[type];if(!example)throw new Error(`Missing component JSON example for ${type}.`);return JSON.stringify(example,null,2);}
