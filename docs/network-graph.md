# Network graph

`networkGraph` is HyperPBI's first-class entity-relationship visual. Use it for operational trees, lineage, dependency networks, case/incident explorers, asset relationships, and similar node-link views.

The component is designed for normal Power BI models. Authors bind the fields they need from their existing tables, declare the entities and the visual relationships in JSON, and let HyperPBI derive and deduplicate the graph. A separate edge/relationship table is **not** required.

The graph uses the existing ECharts runtime, so node and edge clicks participate in HyperPBI selection/highlighting and preserve contributing Power BI row lineage. No remote data source, JavaScript callback, or separate graph service is involved.

## Recommended Power BI model

Keep business data in its natural normalized tables and create the normal Power BI model relationships.

Example:

```text
Service Request
      |
      | 1 : many
      v
   Incident
      |
      +-------------------+
      |                   |
      | 1 : many          | 1 : many
      v                   v
 Inspection           Work Order
```

A typical model may therefore have:

- `SR[SrId]` -> `Incident[SrId]`
- `Incident[IncidentId]` -> `Inspection[IncidentId]`
- `Incident[IncidentId]` -> `WorkOrder[IncidentId]`

The Power BI relationships determine which values from those tables arrive together in the visual's data view. The `networkGraph.relationships` array does **not** define database joins. It declares which already-bound entity values should be connected and in what visual direction.

When multiple one-to-many branches are bound at once, Power BI can materialize repeated combinations. For example, two inspections and two work orders for one incident may arrive as four rows. `networkGraph` deduplicates those rows back into two inspection nodes, two work-order nodes, and the real unique graph relationships.

That makes the common model easy to author without asking users to maintain a fifth "edge table".

For very high-cardinality models, the repeated combinations can still increase the Power BI data view before HyperPBI receives it. Keep large relationship explorers filtered to a useful root, case, asset, incident, or other working context instead of attempting to render an entire enterprise graph at once.

## Component data contract

The public data contract is **entities + relationships**.

### Entities

Each entity defines one node type:

| Property | Required | Meaning |
|---|---|---|
| `id` | yes | Stable JSON identifier used by relationship definitions |
| `label` | no | Human-readable entity type, also used for graph category/color |
| `field` | yes | Field Manifest alias containing the entity's stable key |
| `labelField` | no | Field Manifest alias used as the displayed node label |

Entity IDs must start with a letter and contain only letters, numbers, underscores, or hyphens.

### Relationships

Each relationship connects two declared entity IDs:

| Property | Required | Meaning |
|---|---|---|
| `source` | yes | Source entity id |
| `target` | yes | Target entity id |
| `branchLabel` | no | Presentation-only group node inserted between source and target |

`branchLabel` is useful when one entity fans out into different child collections. HyperPBI creates the grouping node internally. The user does not need a fake `Inspections` row or a fake `Work Orders` row in Power BI.

## SR -> Incident -> Inspection / Work Order example

Given four normal Power BI tables:

```text
SR
Incident
Inspection
WorkOrder
```

and the normal model relationships between them, the graph can be declared as:

```json
{
  "type": "networkGraph",
  "id": "sr_relationship_graph",
  "title": "Service Request Response",
  "entities": [
    {
      "id": "sr",
      "label": "Service Request",
      "field": "srId",
      "labelField": "srNumber"
    },
    {
      "id": "incident",
      "label": "Incident",
      "field": "incidentId",
      "labelField": "incidentNumber"
    },
    {
      "id": "inspection",
      "label": "Inspection",
      "field": "inspectionId",
      "labelField": "inspectionNumber"
    },
    {
      "id": "workOrder",
      "label": "Work Order",
      "field": "workOrderId",
      "labelField": "workOrderNumber"
    }
  ],
  "relationships": [
    {
      "source": "sr",
      "target": "incident"
    },
    {
      "source": "incident",
      "target": "inspection",
      "branchLabel": "Inspections"
    },
    {
      "source": "incident",
      "target": "workOrder",
      "branchLabel": "Work Orders"
    }
  ],
  "layout": "hybrid",
  "orientation": "horizontal",
  "roam": true,
  "draggable": false,
  "directed": true,
  "showLabels": true,
  "nodeSize": 22,
  "levelGap": 185,
  "nodeGap": 64,
  "edgeWidth": 1.25,
  "edgeOpacity": 0.62,
  "edgeCurvature": 0,
  "arrowSize": 5,
  "maxNodes": 1500,
  "interaction": {
    "enabled": true,
    "internalMode": "highlight",
    "externalMode": "selection"
  }
}
```

The result is conceptually:

```text
SR-1001
   |
   v
SSO-2001
   |
   +---- Inspections ---- INSP-3001
   |                  \-- INSP-3002
   |
   +---- Work Orders ---- WO-4001
                      \-- WO-4002
```

The `Inspections` and `Work Orders` nodes are generated by `branchLabel`. They are presentation nodes only.

## Any number of tables and any depth

The component has no four-table or four-level business rule. Entity and relationship definitions are generic.

For example:

```text
Customer
   |
 Request
   |
 Incident
   +-- Inspection -- Defect -- Repair
   +-- Work Order -- Crew -- Employee
   +-- Sensor -- Alert
   +-- Project -- Contract -- Contractor
```

is represented by adding more entity definitions and relationship definitions. Hierarchy depth is derived from the graph relationships at runtime.

The practical bound is the number of nodes rendered in one visual, not the number of source tables. `maxNodes` defaults to 1,500 and is hard-bounded at 5,000.

## Deduplication behavior

HyperPBI derives graph nodes by `(entity id, entity key)` and graph edges by the resolved node pair.

If Power BI supplies repeated flattened rows such as:

```text
Incident  Inspection  WorkOrder
SSO-1     INSP-1      WO-1
SSO-1     INSP-1      WO-2
SSO-1     INSP-2      WO-1
SSO-1     INSP-2      WO-2
```

the graph contains:

```text
1 incident
2 inspections
2 work orders
```

rather than four copies of every child.

The contributing row identities are retained as sets, so HyperPBI can still perform selection/highlighting against the Power BI rows that produced a node or edge.

## Layout and behavior properties

| Property | Values / range | Default | Notes |
|---|---|---:|---|
| `layout` | `hybrid`, `hierarchical`, `force`, `circular` | `hybrid` | Hybrid is hierarchy-aware and settles to fixed positions; no continuous physics. |
| `orientation` | `horizontal`, `vertical` | `horizontal` | Applies to hybrid and hierarchical layouts. |
| `roam` | Boolean | `true` | Enables pan and zoom. |
| `draggable` | Boolean | layout-dependent | Defaults off for settled layouts and on for force layout. |
| `directed` | Boolean | `true` | Shows target arrowheads when enabled. |
| `showLabels` | Boolean | `true` | Shows node labels. |
| `nodeSize` | 8-80 | `22` | Values are clamped at runtime. |
| `levelGap` | 80-400 | `185` | Distance between hierarchy levels in hybrid/hierarchical layouts. |
| `nodeGap` | 24-180 | `64` | Minimum spacing between nodes within a hierarchy level. |
| `edgeWidth` | 0.5-6 | `1.25` | Base edge width. |
| `edgeOpacity` | 0.1-1 | `0.62` | Normal edge opacity. |
| `edgeCurvature` | 0-0.5 | `0` settled / `0.025` force | Keep operational trees nearly straight unless curvature helps a free-form network. |
| `arrowSize` | 2-16 | `5` | Target arrowhead size. |
| `repulsion` | 20-5000 | `260` | Force layout only. |
| `edgeLength` | 20-600 | `120` | Force layout only. |
| `gravity` | 0-1 | `0.04` | Force layout only. |
| `maxNodes` | 2-5000 | `1500` | Hard safety bound for one component. |

Normal shared chart properties such as `dataset`, `height`, `heightMode`, `options`, `interaction`, `responsive`, styling, and accessibility metadata remain available.

## Layout guidance

### Hybrid

Use `hybrid` for most operational relationship explorers. It derives hierarchy levels, orders nodes using connected neighbors to reduce crossings, relaxes spacing on the secondary axis, enforces a minimum node gap, and then renders fixed positions.

It gives the tree layout intelligence without leaving a live force simulation running.

### Hierarchical

Use `hierarchical` when strict deterministic level placement matters more than crossing reduction.

### Force

Use `force` only when the graph is genuinely exploratory and free-form. Force defaults are intentionally calm. Nodes repel, links constrain distance, and dragging is enabled by default.

### Circular

Use `circular` for compact peer networks where hierarchy is not the main story.

## Interaction semantics

Each real entity node carries its own entity `field` and the unique set of Power BI rows that contributed that node.

That means a node has a clear business identity field even if it appears at any depth in the graph. Branch-label group nodes do not invent a business field; their selection lineage is the union of the relationship rows contributing to that branch.

Edges preserve the unique set of rows that contributed that relationship.

Use `externalMode: "selection"` as the safe default. Use `interaction.targets` when the graph should update only named HyperPBI tables, detail panels, or other components.

## AI authoring rules

AI authors should choose `networkGraph` instead of `advancedChart` when the requested visual is an entity relationship graph, dependency graph, lineage view, operational tree, or relationship explorer and the supplied fields can identify the entities.

AI must:

- use the `entities` + `relationships` contract;
- never emit legacy `sourceField` / `targetField` edge-table properties;
- never create or require a separate graph edge table;
- bind every entity `field` and `labelField` only to supplied Field Manifest aliases;
- use stable, readable entity IDs and reference those IDs from `relationships`;
- use `branchLabel` for presentation groups such as Inspections or Work Orders instead of asking the user to create fake business rows;
- rely on existing Power BI model relationships for cross-table row combinations rather than inventing JSON joins;
- support any supplied number of entities and relationship depth rather than assuming a four-table pattern;
- prefer `hybrid` for operational/process trees;
- use `hierarchical` when strict deterministic level placement is requested;
- use `force` only when free-form physics/exploration is explicitly useful;
- keep `maxNodes` bounded and large models filtered to a useful context;
- never emit JavaScript callbacks, external URLs, credentials, SQL, or network data sources.

## Accessibility

The graph exposes visual node labels and interaction lineage. Drag positioning remains pointer-first when enabled. For workflows that require keyboard access to every relationship, pair the graph with a table or detail component containing the same business records.
