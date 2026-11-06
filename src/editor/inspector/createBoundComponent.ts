import { getComponentDescriptor } from "../../catalog/componentDescriptorRegistry";
import { dispatchComponentField } from "../../fields/componentFieldHandlers";
import type { NormalizedField } from "../../data/normalizeData";
import { createComponent } from "./specificationEditor";

/** Seed existing metadata examples, then resolve their declared field references. */
export function createBoundComponent(type:string, specification:unknown, fields:Record<string,NormalizedField>):Record<string,unknown> {
    const descriptor=getComponentDescriptor(type), identity=createComponent(type,specification);
    if(!descriptor)return identity;
    const component={...JSON.parse(JSON.stringify(descriptor.example)),...identity};
    if(type==="map") { component.layers=[]; return component; }
    const available=Object.values(fields);
    for(const descriptorField of descriptor.fields)dispatchComponentField({component,descriptorField,componentPath:"",componentId:String(identity.id),effectiveDataset:"powerbi",emit:occurrence=>{
        if(occurrence.source==="service"||occurrence.source==="joined")return;
        if(fields[occurrence.reference])return;
        const candidates=available.filter(field=>occurrence.requirement!=="numeric"||field.dataType==="number"||field.type==="measure");
        const needle=occurrence.reference.toLowerCase().replace(/[^a-z\d]/g,"");
        const match=candidates.find(field=>`${field.key} ${field.displayName}`.toLowerCase().replace(/[^a-z\d]/g,"").includes(needle))
            ?? (occurrence.requirement!=="numeric" ? candidates.find(field=>field.type==="date"||field.dataType==="datetime")??candidates.find(field=>field.type!=="measure") : undefined) ?? candidates[0];
        if(match)occurrence.set(match.key);
    }});
    return component;
}
