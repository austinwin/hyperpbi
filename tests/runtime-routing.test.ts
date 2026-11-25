// @vitest-environment node
import { expect, it, vi } from "vitest";
import { compileFilter } from "../src/data/filtering";
import { createComponentRowRouter, executeComponentInteraction } from "../src/interactions/componentInteraction";
import { evaluateDatasets } from "../src/data/datasets";
import { finalizeDashboardData } from "../src/data/parseDataView";
import { reuseSpecification } from "../src/editor/reuseSpecification";
import { resolveInteractionPolicy } from "../src/interactions/interactionPolicy";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { initialDashboardState } from "../src/render/stateStore";
import type { RenderContextValue } from "../src/render/RenderContext";
import { IncrementalData } from "../src/powerbi/IncrementalData";
import type powerbi from "powerbi-visuals-api";
import { PowerBiHostBridge } from "../src/powerbi/PowerBiHostBridge";
import type { InternalInteractionFilter } from "../src/interactions/interactionTypes";
import type { NormalizedField } from "../src/data/normalizeData";

it("reuses a single matching pass for equivalent targeted row contexts", () => {
    const rows = [{ status: "Open" }, { status: "Closed" }, { status: "Open" }];
    const route = createComponentRowRouter(rows, ["a", "b", "c"], rows);
    const filter: InternalInteractionFilter = { originComponentId: "f", field: "status", operator: "=", value: "Open", targets: ["a", "b"], scope: "others" };
    expect(route("a", [filter])).toEqual([rows[0], rows[2]]);
    expect(route("a", [filter])).toBe(route("b", [filter]));
    expect(route("c", [filter])).toBe(rows);
    expect(route("a", [{ ...filter, value: "Closed" }])).toEqual([rows[1]]);
    expect(route("a", [])).toBe(rows);
});

it("compares full inclusive UTC reporting dates and rejects missing values", () => {
    for (const mode of ["dashboard", "component"] as const) {
        const filter = compileFilter("between", ["2026-02-01", "2026-02-14"], mode);
        expect(filter(new Date("2026-02-14T20:59:00Z"))).toBe(true);
        expect(filter("2026-02-14T23:59:59.999Z")).toBe(true);
        expect(filter("2026-02-15T00:00:00Z")).toBe(false);
        expect(filter(null)).toBe(false);
        expect(filter("not a date")).toBe(false);
        expect(compileFilter("between", [2, 5], mode)(11)).toBe(false);
    }
});

it("gives historically scoped datasets the host rows with original lineage", () => {
    const status: NormalizedField = { key: "status", type: "dimension", displayName: "Status", roles: [] };
    const rows = [{ status: "Closed" }, { status: "Open" }, { status: "Closed" }];
    const host = finalizeDashboardData({ rows, rowKeys: ["a", "b", "c"], fields: { status } });
    const selected = finalizeDashboardData({ rows: [rows[1]], rowKeys: ["b"], fields: host.fields });
    const { datasets } = evaluateDatasets(selected, {
        history: { source: "powerbi", filterContext: "host" },
        all: { source: "history" },
        active: { source: "powerbi" },
    }, undefined, { sourceIndices: [1], sourceRowKeys: host.rowKeys }, undefined, true, host);
    const history = datasets.get("all")!;
    const active = datasets.get("active")!;
    expect(history.data.rows).toEqual(rows);
    expect(history.lineageAt?.(2) ?? history.lineage[2]).toEqual([2]);
    expect(active.data.rows).toEqual([rows[1]]);
    expect(active.lineageAt?.(0) ?? active.lineage[0]).toEqual([1]);
});

it("coalesces duplicate external filters until a new host Data update", () => {
    const applyJsonFilter = vi.fn();
    const bridge = new PowerBiHostBridge({
        host: { hostCapabilities: { allowInteractions: true }, applyJsonFilter } as never,
        selectionManager: {} as never,
        selectionRowCount: () => 0, selectionIdForRow: () => undefined,
        fields: () => ({ status: { type: "dimension", dataType: "text", key: "status", displayName: "Status", sourceTable: "Orders", sourceColumn: "Status", kind: "column", roles: [] } }),
        interactionsEnabled: () => true,
    });
    const request = { field: "status", operator: "=" as const, value: "Open" };
    expect(bridge.requestExternalFilterSync(request).sent).toBe(true);
    bridge.requestExternalFilterSync(request);
    expect(applyJsonFilter).toHaveBeenCalledTimes(1);
    bridge.dataUpdated();
    bridge.requestExternalFilterSync(request);
    expect(applyJsonFilter).toHaveBeenCalledTimes(2);
});

it("reuses unaffected component definitions across authoring edits and reordering", () => {
    const previous = { components: [{ id: "a", title: "Before" }, { id: "b", title: "Same" }] };
    const current = reuseSpecification(previous, { components: [{ id: "b", title: "Same" }, { id: "a", title: "After" }] });
    expect(current.components[0]).toBe(previous.components[1]);
    expect(current.components[1]).toEqual({ id: "a", title: "After" });
    expect(current.components[1]).not.toBe(previous.components[0]);
});

it("applies both date bounds to a targeted shared variable and keeps incomplete ranges inactive", () => {
    const component = { type: "dateRange", id: "period", interaction: {
        enabled: true, trigger: "change", stateKey: "reporting_period", internalMode: "filter", externalMode: "none", targets: ["reporting-chart"],
    } } as const;
    const policy = resolveInteractionPolicy({ ...component, interaction: { ...component.interaction, targets: [...component.interaction.targets] } }, defaultConfig, "control");
    const dispatch = vi.fn();
    const context = {
        state: initialDashboardState(), sourceRowKeys: [], sourceRows: [], dispatch, config: defaultConfig, reportInteraction: () => undefined,
    } as unknown as RenderContextValue;
    function change(value: string[]) {
        return executeComponentInteraction(policy, {
            componentType: "dateRange", componentId: "period", rowIndices: [], rowKeys: [], field: "created_at", operator: "between", value,
        }, context, { trigger: "change" });
    }
    expect(change(["2026-02-01", ""]).internalApplied).toBe(false);
    expect(dispatch).toHaveBeenCalledWith({ type: "clearInteractionFilter", id: "@state:reporting_period" });
    dispatch.mockClear();
    expect(change(["2026-02-01", "2026-02-14"]).internalApplied).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: "value", id: "reporting_period", value: ["2026-02-01", "2026-02-14"] });
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "interactionFilter", filter: expect.objectContaining({
        targets: ["reporting-chart"], value: ["2026-02-01", "2026-02-14"],
    }) }));
});

it("keeps equal Power BI field schemas across refreshes and invalidates actual type changes", () => {
    const ingestion = new IncrementalData();
    const view = (numeric: boolean): powerbi.DataView => {
        const columns = [{ displayName: "Reading", queryName: "Sensors.Reading", roles: { values: true },
            type: numeric ? { numeric: true } : { text: true } }];
        return { metadata: { columns }, table: { columns, rows: [[numeric ? 42 : "forty-two"]] } };
    };
    ingestion.accept(view(false), "replace");
    const first = ingestion.data;
    ingestion.accept(view(false), "replace");
    expect(ingestion.data.fields).toBe(first.fields);
    expect(ingestion.data.rows).not.toBe(first.rows);
    ingestion.accept(view(true), "replace");
    expect(ingestion.data.fields).not.toBe(first.fields);
});
