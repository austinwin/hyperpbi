// ── ArcGIS WHERE Builder ─────────────────────────────────────────────
// Builds safe ArcGIS SQL WHERE clauses. Never uses string concatenation
// with user-supplied field names; only accepts validated field metadata.

export type ArcGisFieldType =
    | "string"
    | "integer"
    | "double"
    | "date"
    | "guid"
    | "oid"
    | "unknown";

const MAX_VALUES_PER_CLAUSE = 500;
const MAX_CLAUSE_LENGTH = 8000;

export function buildInWhereClause(
    fieldName: string,
    fieldType: ArcGisFieldType,
    values: unknown[]
): string {
    if (!fieldName || fieldName.length === 0) {
        throw new Error("Field name is required.");
    }

    // Validate field name - only allow alphanumeric, underscore
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(fieldName)) {
        throw new Error(`Invalid field name: ${fieldName}`);
    }

    // Filter out null/undefined/NaN values
    const cleanValues = values.filter(v => {
        if (v === null || v === undefined) return false;
        if (typeof v === "number" && isNaN(v)) return false;
        if (typeof v === "number" && !isFinite(v)) return false;
        return true;
    });

    if (cleanValues.length === 0) {
        return `${fieldName} IS NULL`;
    }

    const batches: string[] = [];
    let currentBatch: string[] = [];
    let currentLength = 0;

    const prefix = `${fieldName} IN (`;
    const suffix = `)`;

    for (const value of cleanValues.slice(0, MAX_VALUES_PER_CLAUSE)) {
        const formatted = formatArcGisValue(value, fieldType);
        const entry = formatted;

        if (currentLength + entry.length + 2 > MAX_CLAUSE_LENGTH - prefix.length - suffix.length) {
            batches.push(prefix + currentBatch.join(",") + suffix);
            currentBatch = [];
            currentLength = 0;
        }

        currentBatch.push(entry);
        currentLength += entry.length + 1;
    }

    if (currentBatch.length > 0) {
        batches.push(prefix + currentBatch.join(",") + suffix);
    }

    if (batches.length === 1) return batches[0];

    // Multiple batches: wrap in OR
    return `(${batches.join(" OR ")})`;
}

function formatArcGisValue(value: unknown, fieldType: ArcGisFieldType): string {
    switch (fieldType) {
        case "string":
        case "guid": {
            const str = String(value ?? "");
            // Escape single quotes by doubling them
            const escaped = str.replace(/'/g, "''");
            return `'${escaped}'`;
        }

        case "integer":
        case "oid": {
            const num = Number(value);
            if (!Number.isFinite(num)) return "NULL";
            return String(Math.round(num));
        }

        case "double": {
            const num = Number(value);
            if (!Number.isFinite(num)) return "NULL";
            return String(num);
        }

        case "date": {
            const str = String(value ?? "");
            const escaped = str.replace(/'/g, "''");
            return `'${escaped}'`;
        }

        default:
            return "NULL";
    }
}

export function inferArcGisFieldType(esriType: string): ArcGisFieldType {
    const lower = esriType.toLowerCase();
    if (lower.includes("int") || lower.includes("small") || lower.includes("oid")) return "integer";
    if (lower.includes("double") || lower.includes("float") || lower.includes("single") || lower.includes("decimal")) return "double";
    if (lower.includes("date")) return "date";
    if (lower.includes("guid") || lower.includes("uuid")) return "guid";
    if (lower.includes("oid")) return "oid";
    if (lower.includes("string") || lower.includes("text") || lower.includes("char")) return "string";
    return "unknown";
}
