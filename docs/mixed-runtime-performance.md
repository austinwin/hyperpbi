# Mixed dashboard performance in Power BI build 1.0.6.1

## Workload and measurement

The benchmark renders 100, 200, and 500 interconnected components in Chromium with 30,000, 55,000, and 100,000 generated work orders. The cases bind 25, 32, and 50 fields respectively. They share logical datasets across charts and metrics and exercise a hierarchical Treemap, Leaflet, raw SVG, data-bound text, a paged table, a virtualized table, and tabs. A scoped status control routes to five targets. Global search affects the dashboard context and preserves the explicitly host-scoped dataset. The test exercises rapid input, selection from a detail row and a Treemap group, an outbound filter request, three inbound data replacements, resizing, tab disposal and remount, and a CodeMirror specification edit. It asserts the exact analytical counts and selection group size, including 50,000 selected source indices in the largest case.

Baseline `77facc6` and the optimized build ran the same fixture, on the same Apple M1 Max Mac with macOS 26.6.2, Node 24.22.1, and Playwright 1.61.1 headless Chromium. The mixed test uses Power BI's incremental ingestion class with synthetic 30,000-row windows. Its ingest timing starts after generating the input. It has no Power BI model execution, host query latency, or native selection identity construction. The browser forwards outbound requests to test hooks and supplies refreshed data directly. The separate packaged-visual stress test uses a Power BI API mock and covers host-driven segmentation, edit mode, selection identities, refresh, and datasets up to 500,000 rows by 50 fields. [Packaged stress methodology](powerbi-large-data.md)

```sh
CI=1 HYPERPBI_MIXED_BENCHMARK=after HYPERPBI_MIXED_TRACE=1 \
  npx playwright test tests/browser/mixed-runtime.spec.ts --workers=1
```

For a baseline, copy `tests/browser/mixed-runtime*` to a separate checkout of `77facc6`, then run the same command with `HYPERPBI_MIXED_BENCHMARK=before`. Run each checkout sequentially. Raw results go to `.verification/mixed-runtime/`. Enable `HYPERPBI_MIXED_PROFILE=1` to also capture Chrome's sampled CPU profile. Use the normal browser invocation for the smaller CI regression, which checks target routing, no-op resize, and refresh heap growth without a time-based assertion.

## Results

Durations are in milliseconds. The first table shows separate ingestion time and first render through two animation frames. Scoped JavaScript time ends after the first application commit. Scoped and global frame time allows two animation frames after the result commits. Frame time includes browser scheduling and is an approximation of visible feedback. P95 is the maximum observation in each 15-event scoped or six-event global sequence, and in the 12-event repeat sequence.

| Components / rows / fields | Ingestion | First render | Scoped commit median / P95 | Scoped frame median / P95 | Repeat scoped frame median / P95 | Global frame median / P95 | Component renders per scoped event |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 / 30K / 25 | 119 → 86 | 382 → 212 | 38 / 49 → 7 / 29 | 59 / 81 → 34 / 57 | 59 / 66 → 33 / 37 | 94 / 135 → 60 / 100 | 30 → 7 |
| 200 / 55K / 32 | 252 → 189 | 744 → 355 | 93 / 112 → 16 / 72 | 123 / 145 → 40 / 105 | 117 / 132 → 39 / 47 | 213 / 456 → 116 / 207 | 56 → 7 |
| 500 / 100K / 50 | 644 → 473 | 1,916 → 741 | 244 / 301 → 33 / 156 | 285 / 350 → 60 / 191 | 284 / 328 → 58 / 74 | 622 / 1,003 → 310 / 475 | 131 → 7 |

The seven updates are five filter targets, the control and the tabs container. At 500 components the 15 scoped interactions used 4,564 → 1,479 ms of Chrome renderer task time and 33.2 → 15.0 ms of layout. Six global operations used 5,111 → 1,975 ms of renderer task time and 125.8 → 24.7 ms of layout. The scoped Chrome trace recorded 144 → 70 main-thread `Paint` events and 12.7 → 12.9 ms of aggregate `Paint` duration. Paint time was effectively flat. The trace excludes compositor raster and display presentation.

| Other operations with 500 mounted components | Baseline | Optimized |
| --- | ---: | ---: |
| Row selection / 50K-row Treemap group | 135 / 165 ms | 26 / 57 ms |
| Five synchronous input events to settled dashboard | 252 ms | 69 ms |
| Outbound filter dispatch with a host hook | 166 ms | 34 ms |
| Switch to details / remount overview | 22 / 807 ms | 22 / 474 ms |
| Studio to editable CodeMirror / apply a title edit | 82 / 24 ms | 94 / 23 ms |
| Replacement render median / P95, excluding ingestion | 2,054 / 2,121 ms | 694 / 748 ms |
| ECharts resize calls after real width change / unchanged layout signal | 168 / 84 | 84 / 0 |
| JavaScript heap at mount, after each of three replacements, and after teardown | 309 / 579 / 809 / 1,039 / 24 MiB | 276 / 521 / 752 / 752 / 24 MiB |

Studio stayed within 100 ms to an editable surface in these samples. This pass showed no Studio speedup. Heap numbers come from Chrome after explicit garbage collection. The baseline kept one more raw generation per refresh. The optimized run reached a stable plateau after the second replacement in all three cases. Mounted state still retained older snapshot references. The browser test measures JavaScript heap without GPU, native or Power BI process memory.

## Root causes and architecture decisions

1. **Row expansion and selection work dominated CPU preparation.** The baseline profile spent about 1,007 ms reading packed row properties and 788 ms resolving chart lineage during the sampled scope and global sequence at 500 components. The normalizer now fingerprints Power BI table cells directly using precomputed column offsets. The fingerprint, duplicate ordinals, field normalization and selection identities are preserved. Chart group lineage resolves when the group is selected or highlighted. Bounded row-view caches share repeated scalar predicates and search results within an immutable source revision.
2. **Unrelated component commits multiplied rendering work.** The same sample spent about 696 ms in dashboard traversal, 642 ms aggregating SVG rows and 598 ms rendering tables. Leaf boundaries compare actual row views and local state. Static SVG bypasses row aggregation and sanitized SVG templates read only referenced columns. Chart preparation can reuse a still-live row view. Maps compute only the structural revision where style and content are irrelevant and allocate feature objects within their existing display budget. The complete input still contributes to diagnostics and calculations.
3. **Charts did extra layout and option work.** Unchanged-size broadcasts had resized every chart. Size changes now flow through one observer per document. Eligible Cartesian updates patch only compatible changed series or axis data. Authored options, structural updates and complex chart modes retain their original replacement path. Selection highlights keep their independent update path.
4. **Stable callbacks linked stale data across refreshes.** A Chrome heap snapshot traced old rows through a chain of memoized render closures. The dashboard now creates state, row-lookup and event callbacks in scopes with smaller captures. This removes the accumulating chain in the mixed test. A retained mount or effect snapshot is still measurable on this long-lived view.

## Power BI and remaining limits

The packaged visual receives a table data view and uses table identities for native outbound selections. Power BI supplies incoming cross-filter results through host data updates. Microsoft's explicit `highlights` payload is available for categorical and matrix data views. The current table mapping cannot receive it. Changing the declared data mapping would require proving preservation of grouped and repeated row identities, windowed ingestion, and old report bindings. The 50K-row selection in this benchmark measures browser gesture handling and lineage. The real Power BI bridge applies its existing budget of 10,000 outbound identities per selection. [Power BI highlight API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/highlight) · [Power BI data view mappings](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dataview-mappings)

Power BI can evaluate authored DAX measures before returning a data view. Reports can bind a measure at the coarsest grain that supports the dashboard, then use **Do not summarize** for numeric fields that must retain row detail. The visual's declared mapping controls query shape. Local datasets still handle independently filtered views over received rows. A Power BI comparison needs equal grain and scope, with native query time measured separately from visual display in Performance Analyzer. [Power BI data view mappings](https://learn.microsoft.com/en-us/power-bi/developer/visuals/dataview-mappings)

The 100 ms scoped P95 target was met after repeat values warmed their views. Cold filters at 200 and 500 components and whole-dashboard search at 500 remain above target in this run. First use still groups and resolves multiple large chart and map inputs, global search must examine new text across many fields, and broad refreshes revalidate data-bearing components. The current tests do not establish 60 FPS or Windows WebView2 memory behavior. Preact, ECharts and Leaflet remain in use. This pass did not establish evidence for a new framework, bitmap engine, worker or WASM backend. Windows Power BI Desktop, native visuals, and longer sessions with additional WebView2 visuals require separate measurement.
