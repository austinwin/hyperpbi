import type { DataRow } from "../../data/normalizeData";
import type { TableColumn } from "../../schema/hyperpbiSchema";

export interface TableExportColumn {
    field: string;
    title: string;
}

const textEncoder = new TextEncoder();
const safeSpreadsheetText = (value: string): string => /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
const scalar = (value: unknown): string => value instanceof Date ? value.toISOString() : value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
const csvCell = (value: unknown): string => {
    const text = safeSpreadsheetText(scalar(value));
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function tableExportColumns(columns: readonly TableColumn[], displayNames: Readonly<Record<string, string>> = {}): TableExportColumn[] {
    return columns.filter(column => column.visible !== false).map(column => ({ field: column.field, title: column.title ?? displayNames[column.field] ?? column.field }));
}

export function buildTableCsv(rows: readonly DataRow[], columns: readonly TableExportColumn[]): string {
    const lines = [columns.map(column => csvCell(column.title)).join(",")];
    for (const row of rows) lines.push(columns.map(column => csvCell(row[column.field])).join(","));
    return `\uFEFF${lines.join("\r\n")}`;
}

const xml = (value: unknown): string => safeSpreadsheetText(scalar(value))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "�")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function columnName(index: number): string {
    let value = index + 1;
    let result = "";
    while (value > 0) {
        value--;
        result = String.fromCharCode(65 + value % 26) + result;
        value = Math.floor(value / 26);
    }
    return result;
}

function worksheetCell(value: unknown, reference: string): string {
    if (typeof value === "number" && Number.isFinite(value)) return `<c r="${reference}" t="n"><v>${value}</v></c>`;
    if (typeof value === "boolean") return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`;
    return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
}

function worksheetXml(rows: readonly DataRow[], columns: readonly TableExportColumn[]): string {
    const allRows: unknown[][] = [columns.map(column => column.title), ...rows.map(row => columns.map(column => row[column.field]))];
    const sheetRows = allRows.map((values, rowIndex) => `<row r="${rowIndex + 1}">${values.map((value, columnIndex) => worksheetCell(value, `${columnName(columnIndex)}${rowIndex + 1}`)).join("")}</row>`).join("");
    const end = `${columnName(Math.max(0, columns.length - 1))}${Math.max(1, allRows.length)}`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${end}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:${end}"/></worksheet>`;
}

let crcTable: Uint32Array | undefined;
function crc32(bytes: Uint8Array): number {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let index = 0; index < 256; index++) {
            let value = index;
            for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
            crcTable[index] = value >>> 0;
        }
    }
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ crc >>> 8;
    return (crc ^ 0xffffffff) >>> 0;
}

const write16 = (view: DataView, offset: number, value: number) => view.setUint16(offset, value, true);
const write32 = (view: DataView, offset: number, value: number) => view.setUint32(offset, value >>> 0, true);
const ZIP_EPOCH_DATE = 0x0021; // 1980-01-01, the earliest valid DOS ZIP date.

interface ZipEntry { name: Uint8Array; data: Uint8Array; crc: number; offset: number; }

function storedZip(files: Readonly<Record<string, string>>): Uint8Array {
    const entries: ZipEntry[] = [];
    const localParts: Uint8Array[] = [];
    let offset = 0;
    for (const [nameText, content] of Object.entries(files)) {
        const name = textEncoder.encode(nameText);
        const data = textEncoder.encode(content);
        const crc = crc32(data);
        const header = new Uint8Array(30 + name.length);
        const view = new DataView(header.buffer);
        write32(view, 0, 0x04034b50); write16(view, 4, 20); write16(view, 6, 0x0800); write16(view, 8, 0);
        write16(view, 10, 0); write16(view, 12, ZIP_EPOCH_DATE); write32(view, 14, crc); write32(view, 18, data.length); write32(view, 22, data.length);
        write16(view, 26, name.length); write16(view, 28, 0); header.set(name, 30);
        entries.push({ name, data, crc, offset });
        localParts.push(header, data);
        offset += header.length + data.length;
    }
    const centralParts: Uint8Array[] = [];
    let centralLength = 0;
    for (const entry of entries) {
        const header = new Uint8Array(46 + entry.name.length);
        const view = new DataView(header.buffer);
        write32(view, 0, 0x02014b50); write16(view, 4, 20); write16(view, 6, 20); write16(view, 8, 0x0800); write16(view, 10, 0);
        write16(view, 12, 0); write16(view, 14, ZIP_EPOCH_DATE); write32(view, 16, entry.crc); write32(view, 20, entry.data.length); write32(view, 24, entry.data.length);
        write16(view, 28, entry.name.length); write16(view, 30, 0); write16(view, 32, 0); write16(view, 34, 0); write16(view, 36, 0);
        write32(view, 38, 0); write32(view, 42, entry.offset); header.set(entry.name, 46);
        centralParts.push(header); centralLength += header.length;
    }
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    write32(endView, 0, 0x06054b50); write16(endView, 4, 0); write16(endView, 6, 0); write16(endView, 8, entries.length); write16(endView, 10, entries.length);
    write32(endView, 12, centralLength); write32(endView, 16, offset); write16(endView, 20, 0);
    const result = new Uint8Array(offset + centralLength + end.length);
    let cursor = 0;
    for (const part of [...localParts, ...centralParts, end]) { result.set(part, cursor); cursor += part.length; }
    return result;
}

export function buildTableXlsx(rows: readonly DataRow[], columns: readonly TableExportColumn[], sheetName = "Data"): Uint8Array {
    const safeSheetName = sheetName.replace(/[\\/*?:[\]]/g, " ").slice(0, 31) || "Data";
    return storedZip({
        "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
        "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
        "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(safeSheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
        "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
        "xl/worksheets/sheet1.xml": worksheetXml(rows, columns),
    });
}

export function rowsForTableExport(
    filteredRows: readonly DataRow[],
    sourceRows: readonly DataRow[],
    selectedIndices: ReadonlySet<number>,
    scope: "filtered" | "selected" | "selectedOrFiltered",
): DataRow[] {
    if (scope === "filtered" || scope === "selectedOrFiltered" && selectedIndices.size === 0) return [...filteredRows];
    const indexByRow = new Map(sourceRows.map((row, index) => [row, index] as const));
    return filteredRows.filter(row => {
        const index = indexByRow.get(row);
        return index !== undefined && selectedIndices.has(index);
    });
}

export function downloadTableExport(
    format: "csv" | "xlsx",
    fileName: string,
    rows: readonly DataRow[],
    columns: readonly TableExportColumn[],
): void {
    const safeName = (fileName.trim() || "hyperpbi-data").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/\.(csv|xlsx)$/i, "");
    const content = format === "csv" ? buildTableCsv(rows, columns) : buildTableXlsx(rows, columns, safeName);
    const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeName}.${format}`;
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
