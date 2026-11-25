# Large Power BI data views

HyperPBI 1.0.4.0 loads the Power BI Values table in 5,000-row windows with `fetchMoreData(false)`. The visual appends each segment once and uses Power BI's `lastMergeIndex` to skip the prefix echoed from the prior window. Identical values from distinct records are preserved. The visual assigns compact content-based row keys with duplicate ordinals and builds Power BI selection identities against the exact original table and row offset when a user interacts. Wide records share the host row's values and calculated fields share the unchanged base values.

An initial preview can render while the remaining windows arrive. The loading notice shows both the received count and the count currently used for results. HyperPBI evaluates the complete set when Power BI removes its segment marker. If the request is refused, stalls for 60 seconds, or returns an invalid continuation, the visual shows **Incomplete data** and publishes all rows received so far. In this state, totals, maps and selections reflect those received rows. Power BI controls the visual query grain, summarization, and fetch policy. Microsoft documents a 100 MB fetch cap and requests can be refused by the host. [Microsoft fetch API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/fetch-more-data)

## Results versus display limits

Filters, calculations and logical datasets process all received rows except where a specification explicitly defines a filter or limit. The default overview chooses a low-cardinality category from a bounded sample and renders its chart against the full available dataset. Virtual table display settings (up to 500,000 rows), Matrix cell budgets, map feature limits, and chart point or category budgets constrain what can be drawn. The visual surfaces these limits at the affected component. An advanced chart uses its configured data-row limit and reports when it applies. Tables can export the full filtered result where export is enabled.

A single Power BI identity selection is limited to 10,000 source rows. The visual reports a larger request and keeps the internal interaction active. External filtering by a real model column can propagate a broad selection without materializing one identity per row. [Microsoft selection API](https://learn.microsoft.com/en-us/power-bi/developer/visuals/selection-api)

## Studio and diagnostics

- **Validate** checks the JSON, calculations, field references, and dataset dependency graph using field metadata. **Preview** evaluates data. Dataset results are created on demand for visible components, with one cached result per definition and current dependency revision.
- Studio previews mount a small row window and allow jumping to any page. **Copy sample** copies up to 10 rows. AI prompts use field metadata by default. Opt-in profiles publish counts, ranges, and bounded examples. No full dataset is serialized for a preview or prompt.
- Open Advanced Studio, show **Diagnostics**, and select **Performance**. The panel shows received and displayed rows, segment count, completeness, phase timing, and dataset cache hits where available. JavaScript heap figures are approximate and WebView-wide. They exclude native, GPU, and host memory.
- Switching dashboard tabs unmounts inactive charts and maps. Their component lifecycles dispose chart instances, map layers, observers, listeners and in-flight requests. Logical dataset results can remain cached until a dependency changes.

## What profiling found

The old ingestion loop requested accumulated host segments and rebuilt normalized rows, aggregate arrays, and Power BI selection identities for each response. The logical dataset path serialized the full row set into a cache signature and copied all input rows before applying even a simple group. The default result and Studio both reached that cost without a complex specification. Numeric min and max spread arrays into argument lists, which failed with a `RangeError` in the 250K and 500K Node.js runs.

An isolated Node.js 24 synthetic comparison at 35,813 rows × 21 fields retained 74 MiB after normalization and grouping on the old path and 23 MiB on the incremental path. Group evaluation took 325 ms and 20 ms, respectively. At 100K × 25 it retained 219 MiB and 60 MiB, respectively. These measurements used the same values and group definition, explicit garbage collection, and synthetic input. The old comparison excluded native selection-identity allocation.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm run package:core
HYPERPBI_BENCHMARK=1 npm run benchmark:powerbi
```

The benchmark loads the compiled `.pbiviz` with a Power BI host mock. It generates a 35,813 × 21 reproduction-shaped case and 10K, 50K, 100K, 250K, and 500K datasets at both 25 and 50 fields. Each test covers the default dashboard, first and last rows, grouped logical data, derived fields and metrics, search, table selection, chart/map/tab mount and unmount, Studio validation and preview, refresh, and a refused fetch. The test measures retained JavaScript heap after explicit garbage collection and writes raw results to `.verification/powerbi-benchmark/`.

## Packaged Chromium results

Chrome 149 Headless Shell on an Apple M1 Max with 64 GB RAM. The host mock supplied all rows in every complete case. Values are JavaScript MiB, rounded after collection unless labeled peak. The five workflow cycles each included search, chart/map/table tab switching, a Studio edit and preview, and a full data refresh.

| Rows × fields | After ingestion | Default Studio preview | Warm workflow | Sampled peak | Growth, cycle 2 → 5 | Median cycle |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 10,000 × 25 | 11.8 | 16.6 | 23.5 | 67.8 | 0.2 | 0.60 s |
| 10,000 × 50 | 12.8 | 17.9 | 26.0 | 68.2 | 0.2 | 0.70 s |
| 35,813 × 21 | 19.9 | 25.3 | 43.4 | 106.2 | 0.2 | 0.76 s |
| 50,000 × 25 | 24.9 | 30.4 | 55.9 | 122.3 | 0.2 | 1.04 s |
| 50,000 × 50 | 29.7 | 35.5 | 66.0 | 132.0 | 0.2 | 1.23 s |
| 100,000 × 25 | 41.0 | 47.6 | 96.2 | 197.3 | 0.3 | 1.84 s |
| 100,000 × 50 | 50.6 | 57.5 | 115.8 | 237.1 | 0.2 | 2.30 s |
| 250,000 × 25 | 88.9 | 97.8 | 216.1 | 408.9 | 1.3 | 3.17 s |
| 250,000 × 50 | 112.8 | 121.9 | 264.4 | 513.8 | 1.4 | 3.71 s |
| 500,000 × 25 | 169.3 | 182.6 | 416.6 | 830.8 | 1.4 | 4.98 s |
| 500,000 × 50 | 217.1 | 230.7 | 512.6 | 940.1 | 1.5 | 6.09 s |

After visual destruction and a settled garbage collection, JavaScript heap was 13.9–14.6 MiB across the eleven cases.


Peak is the highest JavaScript heap sample observed at the end of a simulated host window across the test. It does not cover every allocation or total process memory. The 500K × 50 scenario is a stress test and can consume close to 1 GiB of JavaScript heap during this workflow. Actual report values, column cardinality, other visuals and native host limits affect capacity.

## Windows Desktop verification

Import the new Core or Maps package into a copy of the affected PBIX on Windows. Keep the same HyperPBI GUID and rebind the original 21 fields. Verify the final count is 35,813, compare totals and the last record against the model, and exercise Studio, default preview, report slicers, tab switching, Power BI selections, and full refresh several times. Record Power BI Desktop and WebView2 versions, any incomplete-data notice, and WebView2 process private memory after each refresh. Chromium with a host mock validates the packaged visual runtime. Native Power BI host behavior and WebView2 process limits require this Desktop run.

## Worker evaluation

A warm Chromium worker received a synthetic 50K × 50 mixed-value table by structured clone and summed one column. The round trip took 41.5 ms, including about 1.2 ms of worker calculation, compared with 1.5 ms on the main thread. Packing the numeric column into a transferable `Float64Array` took 3.9 ms and the worker round trip took 1.0 ms. Transferring one numeric column avoids cloning the table, while mixed records and opaque host selection identities still need live main-thread storage. HyperPBI keeps the measured workload on the main thread with fewer passes and bounded host windows. The existing Playground file-import worker remains in use. Worker support in the Power BI sandbox was outside the Chromium probe.
