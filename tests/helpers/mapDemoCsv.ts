import { calculateAggregates } from "../../src/data/aggregations";
import { normalizeMapBindings } from "../../src/data/normalizeMapBindings";
import type {
  DataRow,
  NormalizedData,
  NormalizedField,
  Primitive,
} from "../../src/data/normalizeData";

export interface ParsedDemoCsv {
  headers: string[];
  rows: DataRow[];
}

export interface DemoCsvSource {
  text: string;
  keyField: string;
}

function parseCell(value: string): Primitive {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^-?(?:\d+|\d*\.\d+)$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
  }
  return value;
}

export function parseDemoCsv(text: string): ParsedDemoCsv {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  const pushField = () => {
    record.push(field);
    field = "";
  };
  const pushRecord = () => {
    pushField();
    if (record.some((value) => value.length > 0)) records.push(record);
    record = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field.length === 0) quoted = true;
    else if (character === ",") pushField();
    else if (character === "\n") pushRecord();
    else if (character !== "\r") field += character;
  }
  if (field.length > 0 || record.length > 0) pushRecord();

  const [headers = [], ...values] = records;
  return {
    headers,
    rows: values.map((cells) =>
      Object.fromEntries(
        headers.map((header, index) => [header, parseCell(cells[index] ?? "")]),
      ),
    ),
  };
}

function fieldType(
  key: string,
  rows: readonly DataRow[],
): Pick<NormalizedField, "type" | "dataType"> {
  if (key === "latitude") return { type: "latitude", dataType: "number" };
  if (key === "longitude") return { type: "longitude", dataType: "number" };
  if (key === "geometry") return { type: "geometry", dataType: "text" };
  if (rows.some((row) => typeof row[key] === "number"))
    return { type: "measure", dataType: "number" };
  return { type: "dimension", dataType: "text" };
}

export function createDemoData(sources: readonly DemoCsvSource[]): NormalizedData {
  const parsed = sources.map((source) => ({
    ...source,
    parsed: parseDemoCsv(source.text),
  }));
  const rows = parsed.flatMap((source) => source.parsed.rows);
  const headers = [...new Set(parsed.flatMap((source) => source.parsed.headers))];
  const fields = Object.fromEntries(
    headers.map((key) => {
      const classification = fieldType(key, rows);
      const field: NormalizedField = {
        key,
        displayName: key,
        ...classification,
        kind: "column",
        origin: "powerbi-column",
        sourceTable: "MapDemo",
        sourceColumn: key,
        roles: ["values"],
      };
      return [key, field];
    }),
  );
  const rowKeys = parsed.flatMap((source) =>
    source.parsed.rows.map((row, index) =>
      String(row[source.keyField] ?? `${source.keyField}-${index}`),
    ),
  );
  return {
    fields,
    rows,
    rowKeys,
    aggregates: calculateAggregates(rows),
    map: normalizeMapBindings(rows, fields, undefined, {}, rowKeys),
  };
}
