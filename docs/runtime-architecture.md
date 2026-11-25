# Dashboard runtime architecture and benchmarking

## Rendering and data

HyperPBI keeps a shared dashboard state and sends components immutable row views. Each linked filter retains its origin, scope, targets and source lineage. Components with the same ordered set of applicable filters share the matching pass and row-array reference. The cache follows the lifetime of the source view and filter objects. It also supports datasets with grouped or renamed rows through the original source lineage.

The renderer has keyed component boundaries. Chart leaves, metric displays, tables, search and segmented controls, and eligible text and SVG compare the inputs they read. Authored and interactive views with wider dependencies retain the full context. Retained action handlers read current interaction state when invoked. Plain Cartesian charts can patch compatible axis and series data in place. A shared resize observer resizes each chart when its surface actually changes. Stateful routes and arbitrary templates still need broader traversal.

Current performance work preserves behavior as follows:

| Component family | Existing behavior and coverage |
| --- | --- |
| Charts and hierarchies | Shared adapter inputs, stable instances, opt-in linked zoom/range/brush, Treemap node identity, chart selection and drill tests |
| Tables and detail views | Bounded DOM through virtualization and pagination, mapped row selection, sorting and export tests |
| Cards, metrics and controls | Scoped scalar summaries, current control values, shared group rows and calendar-date tests |
| Layouts, tabs and overlays | Inactive dashboard tabs remain lazy. Layout and overlay workspaces maintain their local state and responsive behavior. |
| Maps | Source lineage, selected feature identity, clustering and native map progress remain in the map runtime. Map lifecycle and compact Studio tests cover map workspaces. |
| SVG and HTML | Existing authored-content isolation and SVG compilation remain in use. Pan, zoom and WebView-safe content are covered by browser tests. |
| Diagrams and 3D scenes | Existing instance lifecycles remain in use. SVG and 3D visibility observers suspend hidden work. Packaged stress tests exercise scene cleanup and switching. |

Power BI sends three distinct kinds of observable work here. A replacement query resets source lineage and retained filters are reapplied to the received rows. Continuations feed the same ingestion session and progress renders coalesce on an animation frame. Resize-only updates leave the dashboard mounted and the components' resize observers handle geometry. Host filter requests with the same payload are coalesced while awaiting replacement data. Subsequent Power BI data is always interpreted using the host result because it may reflect other visuals, bookmarks, slicers or model changes.

## Reporting periods and historical views

A dashboard date range includes the full final UTC day when bounds are date-only. Exact timestamp bounds remain precise. A missing bound leaves the range incomplete. A date range with an explicit `interaction.stateKey` can share its two values and route its filter to named targets. Clearing filters also resets the date inputs.

Define a history source directly from Power BI using a distinct dashboard dataset:

```json
{
  "data": {
    "datasets": {
      "historicalOrders": {
        "source": "powerbi",
        "filterContext": "host",
        "groupBy": ["report_month"],
        "metrics": { "orders": { "op": "count" } }
      }
    }
  }
}
```

A component using `historicalOrders` bypasses HyperPBI's global search and dashboard filters when building the dataset. It can still receive explicitly targeted linked filters. Descendant datasets inherit the source's context. Power BI report/page filters, slicers and data reduction still define what is available to the visual. Design monthly trend measures or send a broader model snapshot when a historical view needs rows eliminated by a native slicer.

## Treemap node interactions

Configure event behavior in the selected chart's **Interactions** inspector or in the canonical specification:

```json
{
  "type": "treemapChart",
  "id": "asset_tree",
  "pathFields": ["system", "asset"],
  "valueField": "work_orders",
  "events": {
    "nodeClick": {
      "enabled": true,
      "targets": ["work_order_detail"],
      "interaction": {
        "internalMode": "filter",
        "externalMode": "selection",
        "stateKey": "active_asset"
      }
    }
  }
}
```

A Dynamic Content trigger can subscribe with `{"source":"asset_tree","event":"nodeClick"}`. It receives `$nodeId`, `$parentId`, `$path`, `$level`, `$category`, `$label`, `$value`, `$multiSelect`, `$rowCount` and source fields shared by the contributing rows. Existing `select` subscriptions keep the category as their `$value`. Native selections resolve exact contributing row identities. For a single-column native filter, use a field containing the intended unique value. Internal links use source identity for nested nodes so labels repeated in different branches stay distinct.

## Studio lifecycle

Studio opens as soon as Power BI signals Advanced Edit mode. A later update may omit its edit mode, so the visual retains the last explicit mode. A no-data editor can accept changes and will refresh its field manifest when data arrives. Drafts stay separate from saved visual state. An invalid draft remains available when reopening Studio in the running visual. Publishing a preview reuses unchanged definitions across edits and reordering. Schema validation remains separate from runtime evaluation.

## Developer diagnostics

Enable **Profile dashboard performance** under **Advanced → Runtime settings → Renderer** and preview or save. Expand **Performance** and refresh diagnostics after the interaction of interest. It reports authored, mounted and visible counts, component commit timings and causes, interaction dispatch timing, long tasks where exposed, data completeness, host update counts by lane, editor entry, phase durations and logical dataset cache diagnostics. Long tasks and heap figures come from the browser environment and can include work outside the visual. Component timings are inclusive samples, so siblings' and parents' values cannot be added together.

## Dense benchmark

```sh
HYPERPBI_DENSE_BENCHMARK=modern npx playwright test tests/browser/dense-runtime.spec.ts --workers=1
```

To compare the pre-change runtime, copy the three `tests/browser/dense-runtime*` harness files to a separate worktree at source revision `a3d8c0e` and run the same command with `HYPERPBI_DENSE_BENCHMARK=baseline`. The harness renders 25, 50, 100, 200 and 500 components with 12,000 rows and 25 or 50 fields. It runs 15 scoped changes with four charts mounted alongside controls and metrics. It records initial render, JavaScript event-to-commit, two-frame elapsed time and Studio startup. Five scoped targets and the control are expected to update. Component counts come from the Preact render hook in the test harness only.

Separate packaged tests exercise native edit entry, data refresh, complete datasets up to 500,000 × 50, exported/selected row lineage, chart and map tab disposal, SVG actions and repeated 3D switching. The Chromium harness and a Power BI API mock do not recreate the Windows Desktop query engine, viewport compositor or memory limits. Measure the supplied Windows PBIX using Power BI Performance Analyzer for native comparison.

### Scoped interaction results

| Mounted components | Leaf updates per interaction | Median JavaScript commit | P95 JavaScript commit | P95 across two animation frames |
| ---: | ---: | ---: | ---: | ---: |
| 25 | 25 → 6 | 5.7 → 2.8 ms | 8.9 → 5.0 ms | 31.2 → 31.0 ms |
| 50 | 50 → 6 | 6.3 → 2.9 ms | 10.1 → 4.9 ms | 32.2 → 31.1 ms |
| 100 | 100 → 6 | 7.5 → 2.8 ms | 12.0 → 5.7 ms | 31.9 → 30.6 ms |
| 200 | 200 → 6 | 10.6 → 3.6 ms | 16.7 → 6.2 ms | 30.1 → 30.6 ms |
| 500 | 500 → 6 | 19.1 → 3.9 ms | 34.7 → 6.9 ms | 65.6 → 28.0 ms |

P95 in this 15-event run is the slowest observation. Initial mount for 500 components was 110.7 → 114.4 ms and Studio entry was 52.6 → 57.5 ms in these single-run samples.

## Current limits

Whole-dashboard filtering and a new received row set can still invalidate many data-bearing views. The editor still parses and validates the full specification and dense mixed-component canvases still carry the cost of each visible chart, map or scene. A single native table or measure may receive a different query grain and amount of data. Power BI's opaque selection identities stay on the main thread. Dedicated worker processing for a general mixed-type dataset was not introduced because structured cloning the same data cost more than the measured operation. See the [large-data benchmark](powerbi-large-data.md).

The newer [mixed-workload performance report](mixed-runtime-performance.md) covers complete enterprise-shaped dashboards, consecutive data refreshes, and the remaining latency and memory costs.
