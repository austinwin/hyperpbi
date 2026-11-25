import type powerbi from "powerbi-visuals-api";
import { buildFieldDictionary } from "../data/fieldDictionary";
import { appendDashboardRows, DashboardRowKeys, dataViewRows, type NormalizedDashboardData } from "../data/normalizeDashboardData";
import { finalizeDashboardData } from "../data/parseDataView";
import type { DataLoadStatus, NormalizedData } from "../data/normalizeData";
import { RuntimePerformance } from "../data/runtimePerformance";

type Host = powerbi.extensibility.visual.IVisualHost;
type SelectionId = powerbi.visuals.ISelectionId;
export type DataOperation = "replace" | "segment" | "append";

interface SelectionSegment {
    start: number;
    end: number;
    offset: number;
    table?: powerbi.DataViewTable;
    categories?: powerbi.DataViewCategoryColumn[];
}

type MergeMetadata = { lastMergeIndex?: number };
const STUDIO_SAMPLE_LIMIT = 5_000;

export class IncrementalData {
    readonly performance = new RuntimePerformance();
    private dictionary = buildFieldDictionary([]);
    private keys?: DashboardRowKeys;
    private buffer: NormalizedDashboardData = { fields: this.dictionary.fields, rows: [], rowKeys: [] };
    private visible = finalizeDashboardData(this.buffer);
    private selectionSegments: SelectionSegment[] = [];
    private identities = new Map<number, SelectionId>();
    private seen = new WeakSet<powerbi.DataView>();
    private kind?: ReturnType<typeof dataViewRows>["kind"];
    private status: DataLoadStatus = { loadedRowCount: 0, moreRowsAvailable: false, completeness: "complete", segments: 0 };
    private awaitingSegment = false;
    private identitySources = 0;

    get data(): NormalizedData {
        return { ...this.visible, loadStatus: this.status, performance: this.performance };
    }

    get selectionCount(): number { return this.identitySources; }

    get canFetch(): boolean {
        return this.status.completeness === "loading" && !this.awaitingSegment;
    }

    accept(view: powerbi.DataView | undefined, operation: DataOperation): boolean {
        const started = performance.now();
        const isNewQuery = operation === "replace";
        if (!isNewQuery && (!view || !this.awaitingSegment || this.seen.has(view))) return false;
        const input = dataViewRows(view);
        const dictionary = buildFieldDictionary(input.columns);
        if (isNewQuery) {
            this.reset();
            this.dictionary = dictionary;
            this.keys = new DashboardRowKeys(dictionary);
            this.buffer = { fields: dictionary.fields, rows: [], rowKeys: [] };
            this.kind = input.kind;
        } else if (input.kind !== this.kind || input.columns.length !== this.dictionary.keys.length ||
            dictionary.keys.some((key, index) => key !== this.dictionary.keys[index] ||
                dictionary.fields[key].queryName !== this.dictionary.fields[key].queryName)) {
            this.markIncomplete("Power BI returned a segment with different fields. Refresh the visual to reload its data.");
            return true;
        }
        if (view) this.seen.add(view);
        this.awaitingSegment = false;

        const previousCount = this.buffer.rows.length;
        const mergeIndex = input.kind === "table"
            ? (view?.table as MergeMetadata | undefined)?.lastMergeIndex
            : (view?.categorical as MergeMetadata | undefined)?.lastMergeIndex;
        const offset = operation === "append" ? previousCount : operation === "segment" && Number.isInteger(mergeIndex) ? Math.max(0, mergeIndex! + 1) : 0;
        const moreRowsAvailable = Boolean(view?.metadata.segment);
        if (offset > input.count || (!isNewQuery && moreRowsAvailable && offset === input.count)) {
            this.markIncomplete("Power BI returned no new rows for the next segment. Refresh the visual to retry.");
            return true;
        }

        appendDashboardRows(input, this.dictionary, this.keys!, this.buffer, offset, true);
        const end = this.buffer.rows.length;
        const table = input.kind === "table" ? view?.table : undefined;
        const categories = input.kind === "categorical" ? view?.categorical?.categories : undefined;
        if (operation === "append" && table) {
            this.selectionSegments = [{ start: 0, end, offset: 0, table }];
            this.identitySources = end;
        } else if (end > previousCount && (table || categories?.some(category => category.identity?.length))) {
            this.selectionSegments.push({ start: previousCount, end, offset, table, categories });
            if (table) this.identitySources += end - previousCount;
            else {
                for (let i = offset; i < input.count; i++) if (categories?.some(category => category.identity?.[i])) this.identitySources++;
            }
        }
        this.status = { loadedRowCount: end, moreRowsAvailable, completeness: moreRowsAvailable ? "loading" : "complete", segments: (this.status.segments ?? 0) + 1 };
        if (!moreRowsAvailable) this.publish();
        else if (isNewQuery) {
            // Keep an immutable, bounded sample for Studio's data tab. Report
            // analytics start when Power BI finishes sending rows.
            this.visible = finalizeDashboardData({
                ...this.buffer,
                rows: this.buffer.rows.slice(0, STUDIO_SAMPLE_LIMIT),
                rowKeys: this.buffer.rowKeys.slice(0, STUDIO_SAMPLE_LIMIT),
            });
        }
        this.performance.record("ingestion", started);
        return true;
    }

    requestNext(host: Pick<Host, "fetchMoreData">): boolean {
        if (!this.canFetch) return false;
        this.awaitingSegment = true;
        this.status = { ...this.status, fetchInProgress: true };
        try {
            if (host.fetchMoreData(false)) return true;
        } catch {
            // Report a rejected request through the same completeness state.
        }
        this.markIncomplete("Power BI stopped supplying data. Totals and selections reflect the rows received. Refresh to retry or reduce the fields and rows in this visual.");
        return false;
    }

    markIncomplete(message: string): void {
        this.awaitingSegment = false;
        this.status = { ...this.status, moreRowsAvailable: false, fetchInProgress: false, completeness: "incomplete", message };
        this.publish();
    }

    getSelectionId(host: Host, index: number): SelectionId | undefined {
        const cached = this.identities.get(index);
        if (cached) return cached;
        let low = 0, high = this.selectionSegments.length - 1;
        while (low <= high) {
            const middle = (low + high) >>> 1;
            const segment = this.selectionSegments[middle];
            if (index < segment.start) high = middle - 1;
            else if (index >= segment.end) low = middle + 1;
            else {
                const rowIndex = index - segment.start + segment.offset;
                try {
                    let builder = host.createSelectionIdBuilder();
                    if (segment.table) builder = builder.withTable(segment.table, rowIndex);
                    else {
                        const categories = segment.categories?.filter(category => category.identity?.[rowIndex]) ?? [];
                        if (!categories.length) return undefined;
                        for (const category of categories) builder = builder.withCategory(category, rowIndex);
                    }
                    const identity = builder.createSelectionId();
                    if (this.identities.size === 256) this.identities.delete(this.identities.keys().next().value!);
                    this.identities.set(index, identity);
                    return identity;
                } catch {
                    return undefined;
                }
            }
        }
        return undefined;
    }

    reset(): void {
        this.awaitingSegment = false;
        this.dictionary = buildFieldDictionary([]);
        this.keys = undefined;
        this.kind = undefined;
        this.status = { loadedRowCount: 0, moreRowsAvailable: false, completeness: "complete", segments: 0 };
        this.seen = new WeakSet();
        this.identities.clear();
        this.selectionSegments = [];
        this.identitySources = 0;
        this.buffer = { fields: this.dictionary.fields, rows: [], rowKeys: [] };
        this.visible = finalizeDashboardData(this.buffer);
    }

    private publish(): void {
        this.visible = finalizeDashboardData(this.buffer);
        this.keys = undefined;
    }
}
