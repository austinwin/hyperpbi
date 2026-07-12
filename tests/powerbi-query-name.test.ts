import { describe, expect, it } from "vitest";
import powerbi from "powerbi-visuals-api";
import { buildFieldDictionary, parseQueryName } from "../src/data/fieldDictionary";
import { createFieldAliasRegistry } from "../src/fields/fieldAliasRegistry";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { migrateFieldReferences } from "../src/schema/migrateFieldReferences";

const metadata = (displayName: string, queryName: string, options: { numeric?: boolean; isMeasure?: boolean } = {}): powerbi.DataViewMetadataColumn => ({ displayName, queryName, isMeasure: options.isMeasure, roles: { values: true }, type: options.numeric ? { numeric: true } : { text: true } } as powerbi.DataViewMetadataColumn);

describe("Power BI query-name parsing", () => {
    it("parses qualified, quoted, and bracketed model columns", () => {
        expect(parseQueryName("Sales.Amount")).toEqual({ sourceTable: "Sales", sourceColumn: "Amount", qualifiedName: "Sales.Amount" });
        expect(parseQueryName("'Work Orders'.[Actual Cost]")).toEqual({ sourceTable: "Work Orders", sourceColumn: "Actual Cost", qualifiedName: "Work Orders.Actual Cost" });
        expect(parseQueryName("Projects[Status]")).toEqual({ sourceTable: "Projects", sourceColumn: "Status", qualifiedName: "Projects.Status" });
        expect(parseQueryName("'Bob''s Orders'.[Actual Cost]")).toMatchObject({ sourceTable: "Bob's Orders", sourceColumn: "Actual Cost" });
    });

    it.each([
        ["Sum(Demo.Amount)", "sum"], ["Average(Sales.Amount)", "avg"], ["Avg(Sales.Amount)", "avg"],
        ["Min(Sales.Amount)", "min"], ["Max(Sales.Amount)", "max"], ["Count(Assets.AssetID)", "count"],
        ["DistinctCount(Assets[Asset ID])", "distinctCount"], ["First(Assets.Status)", "first"]
    ])("unwraps %s", (queryName, aggregation) => {
        expect(parseQueryName(queryName)).toMatchObject({ queryAggregation: aggregation, isImplicitAggregation: true });
    });

    it("handles casing and structural whitespace without guessing", () => {
        expect(parseQueryName("  SUM ( 'Work Orders' . [Actual Cost] ) ")).toMatchObject({ sourceTable: "Work Orders", sourceColumn: "Actual Cost", queryAggregation: "sum" });
        for (const malformed of ["Sum(", "Sum(Table.Column", "Sum(Table.Column))", "UnknownFunction(Table.Column)", "Table.Column trailing text", "Count of OBJECTID"]) expect(parseQueryName(malformed)).toEqual({});
    });

    it("keeps implicit aggregations as model columns and true measures as measures", () => {
        const dictionary = buildFieldDictionary([
            metadata("Actual", "Sum(hyperpbi_capabilities_demo.Actual)", { numeric: true }),
            metadata("Margin", "Demo.Margin", { numeric: true, isMeasure: true })
        ]);
        expect(dictionary.fields.hyperpbi_capabilities_demo_actual).toMatchObject({ kind: "column", origin: "powerbi-column", dataType: "number", queryAggregation: "sum", isImplicitAggregation: true, sourceTable: "hyperpbi_capabilities_demo", sourceColumn: "Actual" });
        expect(dictionary.fields.demo_margin).toMatchObject({ kind: "measure", origin: "powerbi-measure", isImplicitAggregation: false });
    });

    it("uses aggregation suffixes only to disambiguate repeated model columns", () => {
        const dictionary = buildFieldDictionary([metadata("Amount", "Sales.Amount", { numeric: true }), metadata("Amount", "Sum(Sales.Amount)", { numeric: true }), metadata("Amount", "Average(Sales.Amount)", { numeric: true })]);
        expect(dictionary.keys).toEqual(["sales_amount", "sales_amount_sum", "sales_amount_avg"]);
    });

    it("exposes aggregation metadata through aliases and migrates malformed saved keys", () => {
        const dictionary = buildFieldDictionary([metadata("Actual", "Sum(Demo.Actual)", { numeric: true })]);
        const data = { fields: dictionary.fields, rows: [], rowKeys: [], aggregates: calculateAggregates([]), map: normalizeMapBindings([], dictionary.fields) };
        expect(createFieldAliasRegistry(data).entries[0]).toMatchObject({ alias: "actual", kind: "column", queryAggregation: "sum", isImplicitAggregation: true, defaultAggregation: "sum", supportsExternalFilter: true });
        const saved = { version: "1.0", components: [{ type: "table", columns: ["sum_demo_actual"] }] };
        expect(migrateFieldReferences(saved, dictionary.fields).components[0].columns).toEqual(["demo_actual"]);
    });

    it("regresses the capabilities-demo manifest without losing friendly aliases", () => {
        const wrapped = ["Actual", "Budget", "Completion", "Latitude", "Longitude", "Risk"].map(name => metadata(name, `Sum(hyperpbi_capabilities_demo.${name})`, { numeric: true }));
        const plain = ["Month", "Region", "Status", "Work ID", "Work Name"].map(name => metadata(name, `hyperpbi_capabilities_demo.${name}`));
        const dictionary = buildFieldDictionary([...wrapped, ...plain]);
        expect(dictionary.fields.hyperpbi_capabilities_demo_actual).toMatchObject({ sourceTable: "hyperpbi_capabilities_demo", sourceColumn: "Actual", kind: "column" });
        expect(dictionary.fields.hyperpbi_capabilities_demo_budget.queryAggregation).toBe("sum");
        expect(dictionary.fields.hyperpbi_capabilities_demo_latitude.sourceColumn).toBe("Latitude");
        expect(dictionary.fields.hyperpbi_capabilities_demo_longitude.sourceColumn).toBe("Longitude");
        const data = { fields: dictionary.fields, rows: [], rowKeys: [], aggregates: calculateAggregates([]), map: normalizeMapBindings([], dictionary.fields) };
        expect(createFieldAliasRegistry(data).byAlias.get("workID")?.key).toBe("hyperpbi_capabilities_demo_work_id");
    });
});
