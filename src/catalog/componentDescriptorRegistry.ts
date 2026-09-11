import {
    componentDescriptors,
    componentDescriptorsByType,
    getComponentDescriptor,
} from "./componentDescriptors";
import { networkGraphDescriptor } from "./networkGraphDescriptor";
import { geolibreDescriptor } from "./geolibreDescriptor";
import { mermaidDiagramDescriptor } from "./mermaidDiagramDescriptor";

const chartDescriptorTypes = new Set([
    "barChart", "horizontalBarChart", "lineChart", "areaChart", "pieChart", "donutChart",
    "scatterChart", "gauge", "heatmap", "comboChart", "waterfallChart", "sankeyChart",
    "treemapChart", "funnelChart", "radarChart", "advancedChart",
]);
for (const descriptor of componentDescriptors) {
    if (!chartDescriptorTypes.has(descriptor.type) || descriptor.schema.allowed.includes("frameless")) continue;
    descriptor.schema.allowed.push("frameless");
    descriptor.inspector.push({
        property: "frameless", label: "Frameless", control: "checkbox", group: "Appearance",
        order: Math.max(0, ...descriptor.inspector.map(item => item.order ?? 0)) + 10,
        help: "Remove card border, background, title header, and padding so the chart fills its container.",
    });
}

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
if (!generatingLegacyCatalog && !componentDescriptorsByType.has(mermaidDiagramDescriptor.type)) {
    componentDescriptors.push(mermaidDiagramDescriptor);
    componentDescriptorsByType.set(mermaidDiagramDescriptor.type, mermaidDiagramDescriptor);
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
