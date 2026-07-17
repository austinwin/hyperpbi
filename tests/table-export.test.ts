import { describe, expect, it } from "vitest";
import {
    buildTableCsv,
    buildTableXlsx,
    rowsForTableExport,
    tableExportColumns,
} from "../src/components/tables/tableExport";

describe("filtered and selected table export", () => {
    const columns = tableExportColumns([
        { field: "name", title: "Name" },
        { field: "amount", title: "Amount" },
        { field: "hidden", visible: false },
    ]);
    const rows = [
        { name: "North, \"Primary\"", amount: 12, hidden: "x" },
        { name: "=HYPERLINK(\"https://example.test\")\u0001", amount: -4, hidden: "y" },
    ];

    it("emits RFC-style CSV with BOM, quoting, visible columns, and formula-injection protection", () => {
        const csv = buildTableCsv(rows, columns);
        expect(csv.startsWith("\uFEFFName,Amount\r\n")).toBe(true);
        expect(csv).toContain('"North, ""Primary"""');
        expect(csv).toContain("'=HYPERLINK");
        expect(csv).not.toContain("hidden");
    });

    it("builds a deterministic OOXML workbook with typed numeric cells", () => {
        const bytes = buildTableXlsx(rows, columns, "Ops/Data");
        expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
        const content = new TextDecoder().decode(bytes);
        expect(content).toContain("[Content_Types].xml");
        expect(content).toContain("xl/worksheets/sheet1.xml");
        expect(content).toContain('sheet name="Ops Data"');
        expect(content).toContain('<c r="B2" t="n"><v>12</v></c>');
        expect(content).toContain("&apos;=HYPERLINK");
        expect(content).toContain("&quot;)�");
        expect(content).not.toContain("&quot;)\u0001");
    });

    it("exports selected rows only from the filtered result and otherwise falls back to filtered", () => {
        const source = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const filtered = [source[0], source[2]];
        expect(rowsForTableExport(filtered, source, new Set([1, 2]), "selected")).toEqual([source[2]]);
        expect(rowsForTableExport(filtered, source, new Set(), "selectedOrFiltered")).toEqual(filtered);
        expect(rowsForTableExport(filtered, source, new Set([2]), "filtered")).toEqual(filtered);
    });
});
