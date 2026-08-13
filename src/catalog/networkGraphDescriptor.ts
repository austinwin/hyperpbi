import { getComponentDescriptor, type ComponentDescriptor } from "./componentDescriptors";

const sankey = getComponentDescriptor("sankeyChart");
if (!sankey) throw new Error("The networkGraph descriptor requires the sankeyChart base descriptor.");

const removedProperties = new Set([
    "sourceField",
    "targetField",
    "valueField",
    "aggregation",
    "nodeAlign",
    "events",
    "drill",
]);

const graphProperties = [
    "entities",
    "relationships",
    "layout",
    "orientation",
    "roam",
    "draggable",
    "directed",
    "showLabels",
    "nodeSize",
    "repulsion",
    "edgeLength",
    "gravity",
    "levelGap",
    "nodeGap",
    "edgeWidth",
    "edgeOpacity",
    "edgeCurvature",
    "arrowSize",
    "maxNodes",
];

const additionalFields: ComponentDescriptor["fields"] = [
    { property: "entities", requirement: "any", handler: "item-bindings" },
];

const additionalInspector: ComponentDescriptor["inspector"] = [
    {
        property: "entities",
        label: "Entities",
        control: "json",
        group: "Data",
        help: "Declare any number of entity types. Each entity uses a stable id plus a Field Manifest alias in field; labelField is optional.",
    },
    {
        property: "relationships",
        label: "Relationships",
        control: "json",
        group: "Data",
        help: "Connect entity ids with source and target. Optional branchLabel inserts a presentation-only grouping node such as Inspections or Work Orders.",
    },
    {
        property: "layout",
        label: "Graph layout",
        control: "enum",
        options: ["hybrid", "hierarchical", "force", "circular"],
        group: "Layout",
        help: "Hybrid is the calm default: hierarchy-aware spacing with fixed settled positions.",
    },
    {
        property: "orientation",
        label: "Hierarchy orientation",
        control: "enum",
        options: ["horizontal", "vertical"],
        group: "Layout",
        help: "Applies to hybrid and hierarchical layouts.",
    },
    {
        property: "levelGap",
        label: "Level gap",
        control: "number",
        group: "Layout",
        help: "Distance between hierarchy levels for hybrid and hierarchical layouts.",
    },
    {
        property: "nodeGap",
        label: "Node gap",
        control: "number",
        group: "Layout",
        help: "Minimum spacing between nodes within a hierarchy level.",
    },
    { property: "repulsion", label: "Force repulsion", control: "number", group: "Layout", help: "Applies only to force layout." },
    { property: "edgeLength", label: "Force edge length", control: "number", group: "Layout", help: "Applies only to force layout." },
    { property: "gravity", label: "Force gravity", control: "number", group: "Layout", help: "Applies only to force layout." },
    { property: "roam", label: "Pan and zoom", control: "checkbox", group: "Interaction" },
    {
        property: "draggable",
        label: "Draggable nodes",
        control: "checkbox",
        group: "Interaction",
        help: "Defaults off for settled layouts and on for force layout.",
    },
    { property: "directed", label: "Directed arrows", control: "checkbox", group: "Appearance" },
    { property: "showLabels", label: "Show node labels", control: "checkbox", group: "Appearance" },
    { property: "nodeSize", label: "Node size", control: "number", group: "Appearance" },
    { property: "edgeWidth", label: "Edge width", control: "number", group: "Appearance" },
    { property: "edgeOpacity", label: "Edge opacity", control: "number", group: "Appearance" },
    { property: "edgeCurvature", label: "Edge curvature", control: "number", group: "Appearance" },
    { property: "arrowSize", label: "Arrow size", control: "number", group: "Appearance" },
    {
        property: "maxNodes",
        label: "Maximum nodes",
        control: "number",
        group: "Advanced",
        help: "Bounded from 2 through 5,000; defaults to 1,500.",
    },
];

export const networkGraphDescriptor: ComponentDescriptor = {
    ...sankey,
    type: "networkGraph",
    label: "Network graph",
    category: "Charts",
    maturity: "beta",
    complexity: "standard",
    useWhen: "Interactive relationships across Power BI entities, dependency networks, lineage, and operational trees",
    capabilities: { ...sankey.capabilities, interactions: true, externalSelection: true },
    interaction: {
        defaultEnabled: true,
        naturalTrigger: "click",
        autoExternalMode: "selection",
    },
    schema: {
        required: ["type", "id", "entities", "relationships"],
        allowed: [
            ...sankey.schema.allowed.filter(property => !removedProperties.has(property) && !graphProperties.includes(property)),
            ...graphProperties,
        ],
    },
    fields: [
        ...sankey.fields.filter(field => !removedProperties.has(field.property)),
        ...additionalFields,
    ],
    inspector: [
        ...sankey.inspector.filter(item => !removedProperties.has(item.property) && !graphProperties.includes(item.property)),
        ...additionalInspector,
    ],
    documentation: {
        summary: "Interactive entity-relationship graph from fields already present in the Power BI data view; no separate edge table is required.",
        accessibility: [
            "Entity nodes and derived edges preserve contributing Power BI row lineage for selection. Provide an adjacent table or detail view when keyboard access to every relationship is required; drag positioning is pointer-first when enabled.",
        ],
        relatedTypes: ["sankeyChart", "table", "advancedChart"],
    },
    example: {
        type: "networkGraph",
        id: "network_graph",
        title: "Relationship graph",
        entities: [
            { id: "parent", label: "Parent", field: "__field_key__" },
            { id: "child", label: "Child", field: "__field_key_2__" },
        ],
        relationships: [
            { source: "parent", target: "child" },
        ],
        layout: "hybrid",
        orientation: "horizontal",
        roam: true,
        draggable: false,
        directed: true,
        showLabels: true,
        nodeSize: 22,
        levelGap: 185,
        nodeGap: 64,
        edgeWidth: 1.25,
        edgeOpacity: 0.62,
        edgeCurvature: 0,
        arrowSize: 5,
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
