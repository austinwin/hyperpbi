import { describe, expect, it } from "vitest";
import powerbi from "powerbi-visuals-api";
import { buildFieldDictionary, parseQueryName } from "../src/data/fieldDictionary";

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
});
