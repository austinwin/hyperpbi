import { describe, expect, it } from "vitest";
import powerbi from "powerbi-visuals-api";
import { buildFieldDictionary, parseQueryName } from "../src/data/fieldDictionary";
import { migrateFieldReferences } from "../src/schema/migrateFieldReferences";

const column = (displayName: string, queryName?: string): powerbi.DataViewMetadataColumn => ({ displayName, queryName, roles: { values: true } } as powerbi.DataViewMetadataColumn);

describe("stable field dictionary keys", () => {
    it("qualifies duplicate display names with their source tables", () => {
        const result = buildFieldDictionary([column("Status", "WorkOrders.Status"), column("Status", "Projects.Status")]);
        expect(result.keys).toEqual(["workorders_status", "projects_status"]);
        expect(result.fields.workorders_status).toMatchObject({ displayName: "Status", queryName: "WorkOrders.Status", sourceTable: "WorkOrders", sourceColumn: "Status", qualifiedName: "WorkOrders.Status" });
    });
    it("uses a numeric suffix only for a final duplicate collision", () => {
        expect(buildFieldDictionary([column("Status", "WorkOrders.Status"), column("Status", "WorkOrders.Status")]).keys).toEqual(["workorders_status", "workorders_status_2"]);
    });
    it("parses quoted, bracketed, spaced, and aggregation query names safely", () => {
        expect(parseQueryName("'Work Orders'.[Object ID]")).toEqual({ sourceTable: "Work Orders", sourceColumn: "Object ID", qualifiedName: "Work Orders.Object ID" });
        expect(parseQueryName("Projects[Status]")).toEqual({ sourceTable: "Projects", sourceColumn: "Status", qualifiedName: "Projects.Status" });
        expect(buildFieldDictionary([column("Count of OBJECTID", "'Work Orders'.Count of OBJECTID")]).keys).toEqual(["work_orders_count_of_objectid"]);
        expect(buildFieldDictionary([column("Amount", "Sales.Amount.Sum")]).keys).toEqual(["sales_amount_sum"]);
    });
    it("keeps unqualified fields reasonable and safely slugs special characters", () => {
        expect(buildFieldDictionary([column("Asset ID"), column("Priority / Type")]).keys).toEqual(["asset_id", "priority_type"]);
    });
    it("migrates legacy display-name keys in saved field references and templates", () => {
        const dictionary = buildFieldDictionary([column("Status", "WorkOrders.Status"), column("Status", "Projects.Status")]);
        const saved = { version: "1.0", components: [{ type: "table", columns: ["status", "status_2"] }, { type: "custom", repeat: { source: "rows", distinctBy: "status", template: "{{row.status}}" }, interactions: { onClick: { where: { op: "=", left: { field: "status" }, right: { valueFromRow: "status" } } } } }] };
        expect(migrateFieldReferences(saved, dictionary.fields).components).toEqual([
            { type: "table", columns: ["workorders_status", "projects_status"] },
            { type: "custom", repeat: { source: "rows", distinctBy: "workorders_status", template: "{{row.workorders_status}}" }, interactions: { onClick: { where: { op: "=", left: { field: "workorders_status" }, right: { valueFromRow: "workorders_status" } } } } }
        ]);
    });
});
