import { DataRow, Primitive } from "../data/normalizeData";
import { EvaluationContext, ExpressionNode } from "./calculationTypes";

const values = (node: Record<string, unknown>, row: DataRow, context: EvaluationContext): Primitive[] => {
    const raw = Array.isArray(node.args) ? node.args : [node.left, node.right].filter(value => value !== undefined);
    return raw.map(value => evaluateExpression(value as ExpressionNode, row, context));
};
const number = (value: Primitive): number | null => typeof value === "number" && Number.isFinite(value) ? value : value !== null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
const date = (value: Primitive): Date | null => { const parsed = value instanceof Date ? value : new Date(String(value ?? "")); return Number.isNaN(parsed.getTime()) ? null : parsed; };
const compare = (left: Primitive, right: Primitive): number => { const a = number(left); const b = number(right); if (a !== null && b !== null) return a - b; return String(left ?? "").localeCompare(String(right ?? "")); };

export function evaluateExpression(expression: ExpressionNode, row: DataRow, context: EvaluationContext = {}): Primitive {
    if (!expression || typeof expression !== "object") return null;
    if ("field" in expression) return row[String(expression.field)];
    if ("value" in expression) return expression.value as Primitive;
    const node = expression as Record<string, unknown> & { op: string }; const args = values(node, row, context); const one = args[0]; const two = args[1];
    switch (node.op) {
        case "+": return args.reduce<number>((sum, value) => sum + (number(value) ?? 0), 0);
        case "-": return (number(one) ?? 0) - (number(two) ?? 0);
        case "*": return args.reduce<number>((product, value) => product * (number(value) ?? 0), 1);
        case "/": { const divisor = number(two); if (!divisor) { context.warnings?.push("Division by zero returned null."); return null; } return (number(one) ?? 0) / divisor; }
        case "%": { const divisor = number(two); return divisor ? (number(one) ?? 0) % divisor : null; }
        case "round": { const precision = number(two) ?? Number(node.precision ?? 0); const factor = 10 ** precision; return Math.round((number(one) ?? 0) * factor) / factor; }
        case "floor": return Math.floor(number(one) ?? 0);
        case "ceil": return Math.ceil(number(one) ?? 0);
        case "abs": return Math.abs(number(one) ?? 0);
        case "min": return Math.min(...args.map(value => number(value) ?? 0));
        case "max": return Math.max(...args.map(value => number(value) ?? 0));
        case "=": return one === two || compare(one, two) === 0;
        case "!=": return !(one === two || compare(one, two) === 0);
        case ">": return compare(one, two) > 0;
        case ">=": return compare(one, two) >= 0;
        case "<": return compare(one, two) < 0;
        case "<=": return compare(one, two) <= 0;
        case "and": return args.every(Boolean);
        case "or": return args.some(Boolean);
        case "not": return !one;
        case "concat": return args.map(value => String(value ?? "")).join(String(node.separator ?? ""));
        case "contains": return String(one ?? "").toLowerCase().includes(String(two ?? "").toLowerCase());
        case "startsWith": return String(one ?? "").toLowerCase().startsWith(String(two ?? "").toLowerCase());
        case "endsWith": return String(one ?? "").toLowerCase().endsWith(String(two ?? "").toLowerCase());
        case "lower": return String(one ?? "").toLowerCase();
        case "upper": return String(one ?? "").toUpperCase();
        case "trim": return String(one ?? "").trim();
        case "replace": return String(one ?? "").split(String(two ?? "")).join(String(node.replacement ?? ""));
        case "coalesce": return args.find(value => value !== null && value !== undefined) ?? null;
        case "isNull": return one === null || one === undefined;
        case "isNotNull": return one !== null && one !== undefined;
        case "if": return evaluateExpression((Boolean(evaluateExpression(node.condition as ExpressionNode, row, context)) ? node.then : node.else) as ExpressionNode, row, context);
        case "case": { const match = (Array.isArray(node.cases) ? node.cases : []).find(item => Boolean(evaluateExpression((item as { when: ExpressionNode }).when, row, context))) as { then: ExpressionNode } | undefined; return evaluateExpression((match?.then ?? node.else) as ExpressionNode, row, context); }
        case "today": { const now = context.now ?? new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
        case "now": return context.now ?? new Date();
        case "year": return date(one)?.getFullYear() ?? null;
        case "quarter": { const value = date(one); return value ? Math.floor(value.getMonth() / 3) + 1 : null; }
        case "month": return date(one) ? (date(one) as Date).getMonth() + 1 : null;
        case "week": { const value = date(one); return value ? Math.ceil((((value.getTime() - new Date(value.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(value.getFullYear(), 0, 1).getDay() + 1) / 7) : null; }
        case "day": return date(one)?.getDate() ?? null;
        case "dateAdd": { const source = date((node.date ? evaluateExpression(node.date as ExpressionNode, row, context) : one)); const amount = number(node.amount ? evaluateExpression(node.amount as ExpressionNode, row, context) : two) ?? 0; if (!source) return null; const result = new Date(source); const unit = String(node.unit ?? "day"); if (unit === "year") result.setFullYear(result.getFullYear() + amount); else if (unit === "month") result.setMonth(result.getMonth() + amount); else result.setDate(result.getDate() + amount); return result; }
        case "dateDiff": { const start = date(evaluateExpression((node.start ?? node.left) as ExpressionNode, row, context)); const end = date(evaluateExpression((node.end ?? node.right) as ExpressionNode, row, context)); if (!start || !end) { context.warnings?.push("Invalid date returned null."); return null; } const days = (end.getTime() - start.getTime()) / 86400000; return node.unit === "hour" ? days * 24 : node.unit === "month" ? days / 30.4375 : node.unit === "year" ? days / 365.25 : days; }
        default: return null;
    }
}
