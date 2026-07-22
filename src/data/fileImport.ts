import * as XLSX from "@e965/xlsx";
import { calculateAggregates } from "./aggregations";
import type { DataSource } from "./dataWorkspace";
import { slugFieldIdentifier } from "./fieldDictionary";
import { normalizeMapBindings } from "./normalizeMapBindings";
import type { DataRow, NormalizedData, NormalizedField, Primitive } from "./normalizeData";

export const PLAYGROUND_FILE_LIMIT_BYTES = 50 * 1024 * 1024;
export const PLAYGROUND_ROW_LIMIT = 250_000;
export const PLAYGROUND_CELL_LIMIT = 5_000_000;

export class DataImportError extends Error {
    constructor(
        message: string,
        readonly code:
            | "UNSUPPORTED_FILE"
            | "FILE_TOO_LARGE"
            | "TOO_MANY_ROWS"
            | "TOO_MANY_CELLS"
            | "EMPTY_FILE"
            | "INVALID_FILE"
    ) {
        super(message);
        this.name = "DataImportError";
    }
}

function hashString(value: string): string {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function serializedValue(value: Primitive): unknown {
    return value instanceof Date ? value.toISOString() : value;
}

export function deterministicFieldAliases(headers: string[]): string[] {
    const aliases: string[] = [];
    const used = new Set<string>();
    headers.forEach((header, index) => {
        const seed = header.trim() ? slugFieldIdentifier(header) : `column_${index + 1}`;
        let alias = seed;
        let suffix = 2;
        while (used.has(alias)) {
            alias = `${seed}_${suffix}`;
            suffix += 1;
        }
        used.add(alias);
        aliases.push(alias);
    });
    return aliases;
}

const blank = (value: unknown): boolean =>
    value === null || value === undefined || (typeof value === "string" && value.trim() === "");
const leadingZeroIdentifier = (value: string): boolean => /^[+-]?0\d+$/.test(value.trim());
const numberText = (value: string): boolean => /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim());
const dateText = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) && !Number.isNaN(Date.parse(`${value.trim()}T00:00:00Z`));
const dateTimeText = (value: string): boolean => /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(value.trim()) && !Number.isNaN(Date.parse(value.trim()));
const booleanText = (value: string): boolean => /^(true|false)$/i.test(value.trim());

function headerRole(header: string): "latitude" | "longitude" | "geometry" | undefined {
    const normalized = header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (["latitude", "lat", "ycoordinate"].includes(normalized)) return "latitude";
    if (["longitude", "lon", "lng", "long", "xcoordinate"].includes(normalized)) return "longitude";
    if (["geometry", "geom", "geojson", "wkt", "shape"].includes(normalized)) return "geometry";
    return undefined;
}

function looksLikeGeometry(value: unknown): boolean {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (/^(POINT|LINESTRING|POLYGON|MULTI(?:POINT|LINESTRING|POLYGON))\s*\(/i.test(trimmed)) return true;
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
    try {
        const parsed = JSON.parse(trimmed) as { type?: unknown };
        return typeof parsed === "object" && parsed !== null && typeof parsed.type === "string";
    } catch {
        return false;
    }
}

function inferField(header: string, values: unknown[], key: string): NormalizedField {
    const present = values.filter(value => !blank(value));
    const strings = present.map(value => value instanceof Date ? value.toISOString() : String(value).trim());
    const role = headerRole(header);
    const allNumbers = present.length > 0 && present.every(value =>
        typeof value === "number" && Number.isFinite(value) ||
        typeof value === "string" && numberText(value) && !leadingZeroIdentifier(value)
    );
    const allBooleans = present.length > 0 && present.every(value => typeof value === "boolean" || typeof value === "string" && booleanText(value));
    const allDates = present.length > 0 && strings.every(dateText);
    const allDateTimes = present.length > 0 && present.every(value => value instanceof Date || dateTimeText(String(value)));
    const geometry = role === "geometry" && present.length > 0 && present.every(looksLikeGeometry);
    const numericValues = allNumbers ? present.map(Number) : [];
    const spatial = role === "latitude" && numericValues.every(value => value >= -90 && value <= 90)
        ? "latitude"
        : role === "longitude" && numericValues.every(value => value >= -180 && value <= 180)
            ? "longitude"
            : undefined;
    const dataType: NonNullable<NormalizedField["dataType"]> = allBooleans
        ? "boolean"
        : allNumbers
            ? "number"
            : allDates
                ? "date"
                : allDateTimes
                    ? "datetime"
                    : "text";
    return {
        key,
        displayName: header,
        type: geometry ? "geometry" : spatial ?? (dataType === "number" ? "measure" : dataType === "date" || dataType === "datetime" ? "date" : "dimension"),
        roles: spatial ? [spatial] : geometry ? ["geometry"] : [],
        kind: "column",
        dataType,
        origin: "uploaded-column"
    };
}

function convertValue(value: unknown, field: NormalizedField): Primitive {
    if (blank(value)) return null;
    if (field.dataType === "number") {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }
    if (field.dataType === "boolean") {
        return typeof value === "boolean" ? value : String(value).trim().toLowerCase() === "true";
    }
    if (value instanceof Date) return value.toISOString();
    return typeof value === "string" ? value : String(value);
}

export function normalizeTabularData(
    headers: string[],
    rawRows: unknown[][],
    sourceSeed: string
): NormalizedData {
    if (!headers.length) throw new DataImportError("The file does not contain a header row.", "EMPTY_FILE");
    if (rawRows.length > PLAYGROUND_ROW_LIMIT) {
        throw new DataImportError(`The source has ${rawRows.length.toLocaleString()} rows; the limit is ${PLAYGROUND_ROW_LIMIT.toLocaleString()}. No rows were imported.`, "TOO_MANY_ROWS");
    }
    if (headers.length * rawRows.length > PLAYGROUND_CELL_LIMIT) {
        throw new DataImportError(`The source has more than ${PLAYGROUND_CELL_LIMIT.toLocaleString()} cells. No rows were imported.`, "TOO_MANY_CELLS");
    }
    const keys = deterministicFieldAliases(headers);
    const fields = Object.fromEntries(
        keys.map((key, columnIndex) => [
            key,
            inferField(headers[columnIndex], rawRows.map(row => row[columnIndex]), key)
        ])
    );
    const rows = rawRows.map(rawRow => Object.fromEntries(
        keys.map((key, columnIndex) => [key, convertValue(rawRow[columnIndex], fields[key])])
    ) as DataRow);
    const occurrences = new Map<string, number>();
    const rowKeys = rows.map(row => {
        const canonical = JSON.stringify(keys.map(key => [key, serializedValue(row[key])]));
        const occurrence = occurrences.get(canonical) ?? 0;
        occurrences.set(canonical, occurrence + 1);
        return `row_${hashString(`${sourceSeed}\u0000${canonical}\u0000${occurrence}`)}`;
    });
    return {
        fields,
        rows,
        rowKeys,
        aggregates: calculateAggregates(rows),
        map: normalizeMapBindings(rows, fields, undefined, undefined, rowKeys),
        loadStatus: { loadedRowCount: rows.length, moreRowsAvailable: false, fetchInProgress: false }
    };
}

/** RFC 4180-style CSV parser. Cell content remains inert text until conservative inference. */
export function parseCsvRows(text: string): string[][] {
    const input = text.replace(/^\uFEFF/, "");
    const rows: string[][] = [];
    let row: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < input.length; index += 1) {
        const character = input[index];
        if (quoted) {
            if (character === '"' && input[index + 1] === '"') {
                value += '"';
                index += 1;
            } else if (character === '"') quoted = false;
            else value += character;
            continue;
        }
        if (character === '"' && value === "") quoted = true;
        else if (character === ",") {
            row.push(value);
            value = "";
        } else if (character === "\n" || character === "\r") {
            if (character === "\r" && input[index + 1] === "\n") index += 1;
            row.push(value);
            rows.push(row);
            row = [];
            value = "";
        } else value += character;
    }
    if (quoted) throw new DataImportError("The CSV contains an unterminated quoted field.", "INVALID_FILE");
    if (value !== "" || row.length) {
        row.push(value);
        rows.push(row);
    }
    while (rows.length && rows[rows.length - 1].every(cell => cell === "")) rows.pop();
    return rows;
}

export function parseCsvText(text: string, fileName = "data.csv"): DataSource {
    const matrix = parseCsvRows(text);
    if (!matrix.length) throw new DataImportError("The CSV is empty.", "EMPTY_FILE");
    const headers = matrix[0].map(value => value);
    const rawRows = matrix.slice(1).map(row => headers.map((_header, index) => row[index] ?? null));
    const data = normalizeTabularData(headers, rawRows, fileName);
    const id = `src_${slugFieldIdentifier(fileName.replace(/\.csv$/i, ""))}_${hashString(JSON.stringify([headers, data.rowKeys]))}`;
    return { id, name: fileName.replace(/\.csv$/i, "") || "CSV data", kind: "csv", fileName, data };
}

function excelCellValue(cell: XLSX.CellObject | undefined): unknown {
    if (!cell || cell.f) return null;
    if (cell.t === "d" && cell.v instanceof Date) return cell.v;
    if (cell.t === "n" && cell.z && XLSX.SSF?.is_date?.(cell.z)) {
        const parsed = XLSX.SSF.parse_date_code(Number(cell.v));
        if (parsed) {
            const iso = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, Math.floor(parsed.S))).toISOString();
            return parsed.H || parsed.M || parsed.S ? iso : iso.slice(0, 10);
        }
    }
    if (cell.t === "n" && typeof cell.w === "string" && /^0\d+$/.test(cell.w.trim())) return cell.w.trim();
    if (cell.v === undefined || cell.v === null) return null;
    return cell.v;
}

function sheetMatrix(sheet: XLSX.WorkSheet): unknown[][] {
    if (!sheet["!ref"]) return [];
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const rows: unknown[][] = [];
    const columns = range.e.c - range.s.c + 1;
    const rowCount = range.e.r - range.s.r + 1;
    if (rowCount > PLAYGROUND_ROW_LIMIT + 1) throw new DataImportError(`The sheet has more than ${PLAYGROUND_ROW_LIMIT.toLocaleString()} data rows. No rows were imported.`, "TOO_MANY_ROWS");
    if (rowCount * columns > PLAYGROUND_CELL_LIMIT) throw new DataImportError(`The sheet has more than ${PLAYGROUND_CELL_LIMIT.toLocaleString()} cells. No rows were imported.`, "TOO_MANY_CELLS");
    for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
        const row: unknown[] = [];
        for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
            row.push(excelCellValue(sheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })]));
        }
        rows.push(row);
    }
    while (rows.length && rows[rows.length - 1].every(blank)) rows.pop();
    return rows;
}

export function parseExcelBuffer(buffer: ArrayBuffer, fileName = "workbook.xlsx"): DataSource[] {
    let workbook: XLSX.WorkBook;
    try {
        workbook = XLSX.read(buffer, {
            type: "array",
            raw: true,
            cellDates: true,
            cellFormula: true,
            cellHTML: false,
            cellText: true,
            dense: false
        });
    } catch (error) {
        throw new DataImportError(`The workbook could not be read: ${error instanceof Error ? error.message : String(error)}`, "INVALID_FILE");
    }
    if (!workbook.SheetNames.length) throw new DataImportError("The workbook has no sheets.", "EMPTY_FILE");
    return workbook.SheetNames.map((sheetName, sheetIndex) => {
        const matrix = sheetMatrix(workbook.Sheets[sheetName]);
        const headers = (matrix[0] ?? []).map(value => blank(value) ? "" : String(value));
        if (!headers.length) throw new DataImportError(`Sheet “${sheetName}” is empty.`, "EMPTY_FILE");
        const rows = matrix.slice(1).map(row => headers.map((_header, index) => row[index] ?? null));
        const seed = `${fileName}\u0000${sheetName}`;
        const data = normalizeTabularData(headers, rows, seed);
        const id = `src_${slugFieldIdentifier(fileName.replace(/\.xlsx$/i, ""))}_${slugFieldIdentifier(sheetName)}_${hashString(JSON.stringify([sheetIndex, headers, data.rowKeys]))}`;
        return { id, name: sheetName, kind: "xlsx-sheet", fileName, sheetName, data } satisfies DataSource;
    });
}

export async function parseUploadedFile(file: File): Promise<DataSource[]> {
    if (file.size > PLAYGROUND_FILE_LIMIT_BYTES) {
        throw new DataImportError(`“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is ${PLAYGROUND_FILE_LIMIT_BYTES / 1024 / 1024} MB.`, "FILE_TOO_LARGE");
    }
    if (/\.csv$/i.test(file.name)) return [parseCsvText(await file.text(), file.name)];
    if (/\.xlsx$/i.test(file.name)) return parseExcelBuffer(await file.arrayBuffer(), file.name);
    throw new DataImportError(`“${file.name}” is not supported. Upload .csv or .xlsx files.`, "UNSUPPORTED_FILE");
}
