# Network graph

`networkGraph` is HyperPBI's first-class node-link relationship component. Use it for dependency networks, lineage, incident/effort trees, service-request-to-work relationships, and other cases where each Power BI row represents a **source → target** edge.

It uses the existing ECharts graph runtime, so node and edge clicks participate in HyperPBI selection/highlighting and preserve the contributing Power BI row lineage. No remote data source, JavaScript callback, or separate graph service is involved.

## Data contract

The component consumes the selected HyperPBI dataset as an edge list:

| Field | Meaning |
|---|---|
| `sourceField` | Required source node ID |
| `targetField` | Required target node ID |
| `sourceLabelField` | Optional display label for source nodes |
| `targetLabelField` | Optional display label for target nodes |
| `sourceCategoryField` | Optional category for source nodes |
| `targetCategoryField` | Optional category for target nodes |
| `edgeLabelField` | Optional edge label |
| `edgeWeightField` | Optional numeric weight. Duplicate source-target rows are summed. |

Blank source or target values are ignored with a visible runtime warning. Duplicate edges are collapsed into one edge while retaining all contributing source-row identities.

## Component API

```json
{
  "type": "networkGraph",
  "id": "relationship_graph",
  "title": "Relationship graph",
  "sourceField": "sourceId",
  "targetField": "targetId",
  "sourceLabelField": "sourceLabel",
  "targetLabelField": "targetLabel",
  "sourceCategoryField": "sourceType",
  "targetCategoryField": "targetType",
  "edgeWeightField": "weight",
  "layout": "force",
  "roam": true,
  "draggable": true,
  "directed": true,
  "showLabels": true,
  "showEdgeLabels": false,
  "nodeSize": 22,
  "repulsion": 650,
  "edgeLength": 140,
  "gravity": 0.08,
  "maxNodes": 1500,
  "interaction": {
    "enabled": true,
    "internalMode": "highlight",
    "externalMode": "selection"
  }
}
```

### Layout and behavior properties

| Property | Values / range | Default | Notes |
|---|---|---:|---|
| `layout` | `force`, `circular`, `hierarchical` | `force` | Force is free-form; hierarchical is deterministic. |
| `orientation` | `horizontal`, `vertical` | `horizontal` | Applies to hierarchical layout. |
| `roam` | Boolean | `true` | Enables pan and zoom. |
| `draggable` | Boolean | `true` | Enables pointer dragging of nodes. |
| `directed` | Boolean | `true` | Shows target arrowheads when enabled. |
| `showLabels` | Boolean | `true` | Shows node labels. |
| `showEdgeLabels` | Boolean | `false` | Shows `edgeLabelField`, or weight when no label exists. |
| `nodeSize` | 8–80 | `22` | Values are clamped at runtime. |
| `repulsion` | 20–5000 | `650` | Force layout only. |
| `edgeLength` | 20–600 | `140` | Force layout only. |
| `gravity` | 0–1 | `0.08` | Force layout only. |
| `maxNodes` | 2–5000 | `1500` | Hard safety bound for one component. |

Normal shared chart properties such as `dataset`, `height`, `heightMode`, `options`, `interaction`, `responsive`, styling, and accessibility metadata remain available. ECharts `options` can adjust safe presentation properties but cannot replace generated node/link data or execute functions.

## Interaction semantics

A graph node can represent many Power BI rows. Clicking it selects/highlights the union of rows that contain that node as either a source or a target. Clicking an edge selects/highlights only the rows that contributed that exact source-target relationship.

By default, use `externalMode: "selection"` so Power BI identity lineage remains exact. Do **not** guess an external filter field for a node that can appear in both `sourceField` and `targetField`. If the model has one canonical node-ID column, authors may explicitly bind that column through `interaction.field`.

Use `interaction.targets` when the graph should update only named HyperPBI tables, detail panels, or other components.

## Force versus hierarchical

Use `force` when the user should explore an organic network and drag nodes. Use `hierarchical` for operational trees where the direction matters more than physics, such as:

```text
Service Request → SSO → Inspections → Inspection
                      → Work Orders  → Work Order
```

Hierarchical mode derives levels from graph indegree and source-target reachability. Cycles and disconnected components are handled without executing user code. Use `orientation: "vertical"` to rotate the hierarchy.

## Lateral SSO effort pattern

For an SSO explorer, prepare edge rows inside Power BI or a HyperPBI logical dataset:

```text
source            target              sourceType  targetType
SR 20636287       SSO 12345           SR          SSO
SSO 12345         Inspections         SSO         Group
Inspections       INSP 87392          Group       Inspection
Inspections       INSP 88215          Group       Inspection
SSO 12345         Work Orders         SSO         Group
Work Orders       WO 238902           Group       Work Order
```

Then bind those columns to `networkGraph`. The synthetic `Inspections` and `Work Orders` rows are ordinary nodes, which keeps the graph generic instead of teaching the runtime what an SSO is.

A left-side SSO table can internally filter the graph by `Service_Request_No`, while clicking graph nodes can highlight the corresponding inspection/work-order detail rows through source-row lineage.

## AI authoring rules

AI authors should choose `networkGraph` instead of `advancedChart` when the requested visual is a node-link network, dependency graph, relationship explorer, lineage view, force graph, or effort tree and supplied fields can express source-target edges.

AI must:

- bind only Field Manifest aliases or fields produced by the selected logical dataset;
- require real `sourceField` and `targetField` aliases rather than inventing relationships;
- prefer `force` for exploratory networks and `hierarchical` for directional process/effort trees;
- use Power BI identity selection by default;
- keep `maxNodes` bounded;
- never emit ECharts callback functions, JavaScript, external URLs, or network data sources.

## Accessibility

The graph exposes visual node/edge labels and interaction lineage, but drag positioning is pointer-first. For workflows that require keyboard access to every relationship, pair the graph with a table or detail component containing the same edge records.
