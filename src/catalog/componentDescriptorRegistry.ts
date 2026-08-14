import {
    componentDescriptors,
    componentDescriptorsByType,
    getComponentDescriptor,
} from "./componentDescriptors";
import { networkGraphDescriptor } from "./networkGraphDescriptor";
import { geolibreDescriptor } from "./geolibreDescriptor";

/**
 * componentDescriptors.ts is a generated legacy registry and is also the source
 * for docs:check. Runtime extension descriptors are registered everywhere else,
 * while the documentation generator keeps its generated snapshot stable. New
 * extension components must ship dedicated API documentation.
 */
const generatingLegacyCatalog =
    typeof process !== "undefined" &&
    process.argv.some(argument => /generate-documentation\.mjs$/.test(argument));

if (!generatingLegacyCatalog && !componentDescriptorsByType.has(networkGraphDescriptor.type)) {
    componentDescriptors.push(networkGraphDescriptor);
    componentDescriptorsByType.set(networkGraphDescriptor.type, networkGraphDescriptor);
}
if (!generatingLegacyCatalog && !componentDescriptorsByType.has(geolibreDescriptor.type)) {
    componentDescriptors.push(geolibreDescriptor);
    componentDescriptorsByType.set(geolibreDescriptor.type, geolibreDescriptor);
}

export {
    componentDescriptors,
    componentDescriptorsByType,
    getComponentDescriptor,
};
export type {
    ComponentDescriptor,
    ComponentContainerDescriptor,
    ComponentMaturityEvidence,
    ComponentRenderMode,
    FieldReferenceDescriptor,
    FieldTraversalHandler,
} from "./componentDescriptors";
