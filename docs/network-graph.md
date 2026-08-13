# Network graph

`networkGraph` is HyperPBI's first-class node-link relationship component. Use it for dependency networks, lineage, incident/effort trees, service-request-to-work relationships, and other cases where each Power BI row represents a **source → target** edge.

It uses the existing ECharts graph runtime, so node and edge clicks participate in HyperPBI selection/highlighting and preserve the contributing Power BI row lineage. No remote data source, JavaScript callback, or separate graph service is involved.

## Recommended data model

Keep business data normalized in its natural tables. For an operational SSO workflow that may mean separate source tables such as:

```text
Service Request
Incident / SSO
Inspection
Work Order
```

Do **not** drag columns from several one-to-many child tables directly into one HyperPBI visual just to build the graph. Power BI can flatten combinations such as three inspections × four work orders into twelve rows, which creates relationship combinations that did not exist in the business process.

Instead, keep the normalized source tables and prepare one lightweight relationship dataset for the graph:

```text
sourceId             targetId                 sourceType   targetType
SR:1001              SSO:2001                 SR           Incident
SSO:2001             GROUP:INSP:2001          Incident     Group
GROUP:INSP:2001      INSP:3001                Group        Inspection
GROUP:INSP:2001      INSP:3002                Group        Inspection
SSO:2001             GROUP:WO:2001            Incident     Group
GROUP:WO:2001        WO:4001                  Group        WorkOrder
```

The relationship dataset can be prepared upstream in the model or as a HyperPBI logical dataset when the required rows already exist in the visual data. HyperPBI does not independently query and join arbitrary Power BI model tables.

This pattern scales to other domains without changing the component: Customer → Case → Inspection/Work Order, Asset → Failure → Inspection/Repair, Project → Issue → Task, and similar relationship explorers.

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
  "layout": "hybrid",
  "orientation": "horizontal",
  "roam": true,
  "draggable": false,
  "directed": true,
  "showLabels": true,
  "showEdgeLabels": false,
  "nodeSize": 22,
  "levelGap": 185,
  "nodeGap": 64,
  "edgeWidth": 1.25,
  "edgeOpacity": 0.62,
  "edgeCurveness": 0,
  "arrowSize": 5,
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
| `layout` | `hybrid`, `hierarchical`, `force`, `circular` | `hybrid` | Hybrid is hierarchy-aware and settles to fixed positions; no continuous physics. |
| `orientation` | `horizontal`, `vertical` | `horizontal` | Applies to hybrid and hierarchical layouts. |
| `roam` | Boolean | `true` | Enables pan and zoom. |
| `draggable` | Boolean | layout-dependent | Defaults off for settled layouts and on for force layout. |
| `directed` | Boolean | `true` | Shows target arrowheads when enabled. |
| `showLabels` | Boolean | `true` | Shows node labels. |
| `showEdgeLabels` | Boolean | `false` | Shows `edgeLabelField`, or weight when no label exists. |
| `nodeSize` | 8–80 | `22` | Values are clamped at runtime. |
| `levelGap` | 80–400 | `185` | Distance between hierarchy levels in hybrid/hierarchical layouts. |
| `nodeGap` | 24–180 | `64` | Minimum spacing between nodes within a hierarchy level. |
| `edgeWidth` | 0.5–6 | `1.25` | Base line width. Without `edgeWeightField`, normal edges stay at this width. |
| `edgeOpacity` | 0.1–1 | `0.62` | Normal edge opacity. |
| `edgeCurveness` | 0–0.5 | `0` settled / `0.025` force | Keep operational trees straight unless curvature helps a free-form network. |
| `arrowSize` | 2–16 | `5` | Target arrowhead size. |
| `repulsion` | 20–5000 | `260` | Force layout only. |
| `edgeLength` | 20–600 | `120` | Force layout only. |
| `gravity` | 0–1 | `0.04` | Force layout only. |
| `maxNodes` | 2–5000 | `1500` | Hard safety bound for one component. |

Normal shared chart properties such as `dataset`, `height`, `heightMode`, `options`, `interaction`, `responsive`, styling, and accessibility metadata remain available. ECharts `options` can adjust safe presentation properties but cannot replace generated node/link data or execute functions.

## Layout guidance

### Hybrid

Use `hybrid` for most operational relationship explorers. It derives left-to-right or top-to-bottom hierarchy levels, orders nodes using connected neighbors to reduce crossings, relaxes spacing on the secondary axis, enforces a minimum node gap, and then renders fixed positions.

It gives a tree some layout intelligence without a live force simulation continuously moving nodes.

```text
Service Request → Incident → Inspections → Inspection records
                           → Work Orders  → Work-order records
```

### Hierarchical

Use `hierarchical` when deterministic level placement matters more than crossing reduction. It keeps hierarchy columns/rows and stable spacing with no relaxation pass.

### Force

Use `force` only when the graph is genuinely exploratory and free-form. Force defaults are intentionally calmer than the original implementation. Nodes still repel, links constrain distance, and dragging remains enabled by default.

### Circular

Use `circular` for compact peer networks where directional hierarchy is not the primary story.

## Edge presentation

Normal unweighted edges now use a thin neutral line instead of being automatically scaled to the old four-pixel maximum. Weight-based width scaling only activates when `edgeWeightField` is supplied, and the variation is intentionally modest.

Arrowheads are smaller by default and use the same edge geometry. Adjacency emphasis uses the theme primary color so the selected relationship becomes clearer without making every edge visually dominant.

## Interaction semantics

A graph node can represent many Power BI rows. Clicking it selects/highlights the union of rows that contain that node as either a source or a target. Clicking an edge selects/highlights only the rows that contributed that exact source-target relationship.

By default, use `externalMode: "selection"` so Power BI identity lineage remains exact. Do **not** guess an external filter field for a node that can appear in both `sourceField` and `targetField`. If the model has one canonical node-ID column, authors may explicitly bind that column through `interaction.field`.

Use `interaction.targets` when the graph should update only named HyperPBI tables, detail panels, or other components.

## Lateral SSO effort pattern

Keep Service Request, Incident/SSO, Inspection, and Work Order as separate business tables. Build a lightweight edge dataset for visualization rather than flattening all four one-to-many tables into the visual.

Example relationship rows:

```text
source              target                    sourceType  targetType
SR 20636287         SSO 12345                 SR          Incident
SSO 12345           INSP GROUP 12345          Incident    Group
INSP GROUP 12345    INSP 87392                Group       Inspection
INSP GROUP 12345    INSP 88215                Group       Inspection
SSO 12345           WO GROUP 12345            Incident    Group
WO GROUP 12345      WO 238902                 Group       Work Order
```

Then bind those relationship columns to `networkGraph`. Synthetic grouping rows are ordinary nodes, which keeps the runtime generic instead of teaching it what an SSO is.

A left-side incident table can internally filter the relationship dataset, while graph selections can highlight corresponding detail rows through preserved source-row lineage when those rows share the relevant lineage/data preparation path.

## AI authoring rules

AI authors should choose `networkGraph` instead of `advancedChart` when the requested visual is a node-link network, dependency graph, relationship explorer, lineage view, force graph, or effort tree and supplied fields can express source-target edges.

AI must:

- bind only Field Manifest aliases or fields produced by the selected logical dataset;
- require real `sourceField` and `targetField` aliases rather than inventing relationships;
- prefer `hybrid` for operational/process trees;
- use `hierarchical` when strict deterministic level placement is requested;
- use `force` only when free-form physics/exploration is explicitly useful;
- keep normalized one-to-many business tables separate and recommend a derived edge dataset instead of binding all child tables directly into one visual;
- never imply that HyperPBI independently joins arbitrary Power BI model tables;
- use Power BI identity selection by default;
- keep `maxNodes` bounded;
- never emit ECharts callback functions, JavaScript, external URLs, or network data sources.

## Accessibility

The graph exposes visual node/edge labels and interaction lineage. Drag positioning remains pointer-first when enabled. For workflows that require keyboard access to every relationship, pair the graph with a table or detail component containing the same edge records.
