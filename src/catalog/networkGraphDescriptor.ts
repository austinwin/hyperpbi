import { getComponentDescriptor, type ComponentDescriptor } from "./componentDescriptors";

const sankey = getComponentDescriptor("sankeyChart");
if (!sankey) throw new Error("The networkGraph descriptor requires the sankeyChart base descriptor.");

const removedProperties = new Set(["valueField", "aggregation", "nodeAlign", "events", "drill"]);
const graphProperties = [
    "sourceLabelField",
    "targetLabelField",
    "sourceCategoryField",
    "targetCategoryField",
    "edgeLabelField",
    "edgeWeightField",
    "layout",
    "roam",
    "draggable",
    "directed",
    "showLabels",
    "showEdgeLabels",
    "nodeSize",
    "repulsion",
    "edgeLength",
    "gravity",
    "maxNodes",
];

const additionalFields: ComponentDescriptor["fields"] = [
    { property: "sourceLabelField", requirement: "any", handler: "scalar" },
    { property: "targetLabelField", requirement: "any", handler: "scalar" },
    { property: "sourceCategoryField", requirement: "any", handler: "scalar" },
    { property: "targetCategoryField", requirement: "any", handler: "scalar" },
    { property: "edgeLabelField", requirement: "any", handler: "scalar" },
    { property: "edgeWeightField", requirement: "numeric", handler: "scalar" },
];

const additionalInspector: ComponentDescriptor["inspector"] = [
    { property: "sourceLabelField", label: "Source label field", control: "field", group: "Data" },
    { property: "targetLabelField", label: "Target label field", control: "field", group: "Data" },
    { property: "sourceCategoryField", label: "Source category field", control: "field", group: "Data" },
    { property: "targetCategoryField", label: "Target category field", control: "field", group: "Data" },
    { property: "edgeLabelField", label: "Edge label field", control: "field", group: "Data" },
    { property: "edgeWeightField", label: "Edge weight field", control: "field", group: "Data", help: "Optional numeric edge weight. Duplicate source-target rows are summed." },
    { property: "layout", label: "Graph layout", control: "enum", options: ["force", "circular", "hierarchical"], group: "Layout" },
    { property: "orientation", label: "Hierarchy orientation", control: "enum", options: ["horizontal", "vertical"], group: "Layout", visibleWhen: { property: "layout", equals: "hierarchical" } },
    { property: "roam", label: "Pan and zoom", control: "checkbox", group: "Interaction" },
    { property: "draggable", label: "Draggable nodes", control: "checkbox", group: "Interaction" },
    { property: "directed", label: "Directed arrows", control: "checkbox", group: "Appearance" },
    { property: "showLabels", label: "Show node labels", control: "checkbox", group: "Appearance" },
    { property: "showEdgeLabels", label: "Show edge labels", control: "checkbox", group: "Appearance" },
    { property: "nodeSize", label: "Node size", control: "number", group: "Appearance" },
    { property: "repulsion", label: "Force repulsion", control: "number", group: "Layout" },
    { property: "edgeLength", label: "Force edge length", control: "number", group: "Layout" },
    { property: "gravity", label: "Force gravity", control: "number", group: "Layout" },
    { property: "maxNodes", label: "Maximum nodes", control: "number", group: "Advanced", help: "Bounded from 2 through 5,000; defaults to 1,500." },
];

export const networkGraphDescriptor: ComponentDescriptor = {
    ...sankey,
    type: "networkGraph",
    label: "Network graph",
    category: "Charts",
    maturity: "beta",
    complexity: "standard",
    useWhen: "Interactive source-to-target relationships, dependency networks, lineage, and effort trees",
    capabilities: { ...sankey.capabilities, interactions: true, externalSelection: true },
    interaction: {
        defaultEnabled: true,
        naturalTrigger: "click",
        autoExternalMode: "selection",
    },
    schema: {
        required: ["type", "id", "sourceField", "targetField"],
        allowed: [
            ...sankey.schema.allowed.filter(property => !removedProperties.has(property)),
            ...graphProperties,
        ],
    },
    fields: [
        ...sankey.fields.filter(field => !removedProperties.has(field.property)),
        ...additionalFields,
    ],
    inspector: [
        ...sankey.inspector.filter(item => !removedProperties.has(item.property) && !graphProperties.includes(item.property) && item.property !== "orientation"),
        ...additionalInspector,
    ],
    documentation: {
        summary: "Interactive node-link graph from source-target edge rows with force, circular, or deterministic hierarchical layout.",
        accessibility: [
            "Nodes and edges preserve Power BI row lineage for selection. Provide an adjacent table or detail view when keyboard access to every relationship is required; drag positioning is pointer-first.",
        ],
        relatedTypes: ["sankeyChart", "table", "advancedChart"],
    },
    example: {
        type: "networkGraph",
        id: "network_graph",
        title: "Relationship graph",
        sourceField: "__field_key__",
        targetField: "__field_key_2__",
        layout: "force",
        roam: true,
        draggable: true,
        directed: true,
        showLabels: true,
        nodeSize: 22,
        repulsion: 650,
        edgeLength: 140,
        gravity: 0.08,
        maxNodes: 1500,
        interaction: {
            enabled: true,
            trigger: "click",
            internalMode: "highlight",
            internalScope: "self",
            externalMode: "selection",
            selectionMode: "replace",
            multiSelect: true,
            clearOnSecondClick: true,
        },
    },
    rendering: "direct",
    containers: [],
};
