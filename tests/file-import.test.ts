import { describe, expect, it } from "vitest";
import * as XLSX from "@e965/xlsx";
import {
    deterministicFieldAliases,
    parseCsvText,
    parseExcelBuffer,
    parseCsvRows
} from "../src/data/fileImport";

describe("Playground file import", () => {
    it("parses quoted CSV safely and represents blank cells as null", () => {
        const rows = parseCsvRows('Name,Note,Amount\r\n"North, A","line 1\nline 2",12\r\nSouth,,3');
        expect(rows).toEqual([
            ["Name", "Note", "Amount"],
            ["North, A", "line 1\nline 2", "12"],
            ["South", "", "3"]
        ]);
        const source = parseCsvText('Name,Note,Amount\n"North, A",,12', "sample.csv");
        expect(source.data.rows[0]).toMatchObject({ name: "North, A", note: null, amount: 12 });
    });

    it("handles duplicate and blank headers with deterministic aliases", () => {
        expect(deterministicFieldAliases(["Order ID", "Order ID", "", "Order-ID"])).toEqual([
            "order_id", "order_id_2", "column_3", "order_id_3"
        ]);
        expect(deterministicFieldAliases(["Order ID", "Order ID", "", "Order-ID"])).toEqual(
            deterministicFieldAliases(["Order ID", "Order ID", "", "Order-ID"])
        );
    });

    it("preserves leading-zero identifiers as text and creates deterministic row keys", () => {
        const first = parseCsvText("Account,Active,Value\n00123,true,10\n00007,false,20", "ids.csv");
        const second = parseCsvText("Account,Active,Value\n00123,true,10\n00007,false,20", "ids.csv");
        expect(first.data.fields.account.dataType).toBe("text");
        expect(first.data.rows[0].account).toBe("00123");
        expect(first.data.rows[0].active).toBe(true);
        expect(first.data.rowKeys).toEqual(second.data.rowKeys);
        expect(new Set(first.data.rowKeys).size).toBe(2);
    });

    it("infers temporal and spatial fields conservatively", () => {
        const source = parseCsvText('Date,Timestamp,Latitude,Longitude,Geometry\n2026-07-22,2026-07-22T12:30:00Z,29.76,-95.37,"{\"\"type\"\":\"\"Point\"\",\"\"coordinates\"\":[-95.37,29.76]}"', "types.csv");
        expect(source.data.fields.date).toMatchObject({ type: "date", dataType: "date" });
        expect(source.data.fields.timestamp).toMatchObject({ type: "date", dataType: "datetime" });
        expect(source.data.fields.latitude.type).toBe("latitude");
        expect(source.data.fields.longitude.type).toBe("longitude");
        expect(source.data.fields.geometry.type).toBe("geometry");
    });

    it("parses every Excel sheet as an independent source without evaluating formulas", () => {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Code", "Amount"], ["001", 10], ["002", 20]]), "Orders");
        const formulaSheet = XLSX.utils.aoa_to_sheet([["Name", "Formula"], ["Safe", 1]]);
        formulaSheet.B2 = { t: "n", v: 99, f: "1+98" };
        XLSX.utils.book_append_sheet(workbook, formulaSheet, "Summary");
        const binary = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
        const sources = parseExcelBuffer(binary, "book.xlsx");
        expect(sources.map(source => source.sheetName)).toEqual(["Orders", "Summary"]);
        expect(sources[0].data.rows).toHaveLength(2);
        expect(sources[1].data.rows[0].formula).toBeNull();
    });
});
