import type { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { validateSchema } from "../schema/validateSchema";
import {
  appendToContainer,
  componentTree,
  deleteComponent,
  insertComponent,
  locateComponent,
  resolveComponentContainerPath,
  rootComponentContainerPaths,
} from "../editor/inspector/specificationEditor";
import type { AiChangePackage } from "./changePackage";
import { validateAiChangePackage } from "./changePackageValidation";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
function ids(value: unknown): string[] {
  return componentTree(value).map((item) => item.id);
}
export interface AppliedChangePackage {
  schema?: HyperPbiSchema;
  errors: string[];
  summary: string;
}
export interface ChangePackageValidationContext {
  validateResult?: (candidate: unknown) => { errors: string[]; warnings?: string[] };
}

function validateCandidate(candidate: unknown, context: ChangePackageValidationContext): AppliedChangePackage {
  const schema = validateSchema(candidate);
  if (!schema.schema) return { errors: schema.errors, summary: "No changes applied." };
  const full = context.validateResult?.(candidate);
  if (full?.errors.length) return { errors: full.errors, summary: "No changes applied." };
  return { schema: schema.schema, errors: [], summary: "" };
}

export function applyChangePackage(
  current: HyperPbiSchema,
  change: AiChangePackage,
  context: ChangePackageValidationContext = {},
): AppliedChangePackage {
  const shape = validateAiChangePackage(change);
  if (!shape.package) return { errors: shape.errors, summary: "No changes applied." };
  if (change.operation === "replaceDashboard") {
    const result = validateCandidate(change.specification, context);
    return result.schema ? { ...result, summary: "Replace the complete dashboard." } : result;
  }
  const target = change.operation === "appendRoot" ? undefined : locateComponent(current, change.targetId);
  if (!target && change.operation !== "appendRoot")
    return {
      errors: [`Target component “${change.targetId}” does not exist.`],
      summary: "No changes applied.",
    };
  let candidate: unknown = clone(current);
  if (change.operation === "remove")
    candidate = deleteComponent(candidate, change.targetId);
  else {
    const incoming = ids({ components: [change.component] });
    const duplicates = incoming.filter(
      (id, index) => incoming.indexOf(id) !== index,
    );
    if (duplicates.length)
      return {
        errors: [
          `Incoming component contains duplicate IDs: ${Array.from(new Set(duplicates)).join(", ")}.`,
        ],
        summary: "No changes applied.",
      };
    const existing = new Set(ids(current));
    if (change.operation === "replace")
      ids({ components: [target!.component] }).forEach((id) =>
        existing.delete(id),
      );
    const collisions = incoming.filter((id) => existing.has(id));
    if (collisions.length)
      return {
        errors: [
          `Incoming component IDs collide with the dashboard: ${collisions.join(", ")}.`,
        ],
        summary: "No changes applied.",
      };
    if (change.operation === "replace") {
      if (change.component.id !== change.targetId)
        return {
          errors: [`Replacement ID must remain “${change.targetId}”.`],
          summary: "No changes applied.",
        };
      const next = clone(current);
      const found = locateComponent(next, change.targetId)!;
      if (Array.isArray(found.parent))
        found.parent[found.index as number] = clone(change.component);
      else found.parent[found.index as string] = clone(change.component);
      candidate = next;
    } else if (
      change.operation === "insertBefore" ||
      change.operation === "insertAfter"
    )
      candidate = insertComponent(
        candidate,
        change.targetId,
        change.operation === "insertBefore" ? "before" : "after",
        change.component as unknown as Record<string, unknown>,
      );
    else if (change.operation === "appendRoot") {
      const key = change.containerPath;
      const next = clone(current) as unknown as Record<string, unknown>;
      if (!(rootComponentContainerPaths as readonly string[]).includes(key))
        return {
          errors: [`Root container “${key}” is not supported.`],
          summary: "No changes applied.",
        };
      if (!Array.isArray(next[key])) next[key] = [];
      (next[key] as unknown[]).push(clone(change.component));
      candidate = next;
    } else if (change.operation === "appendChild") {
      const resolved = resolveComponentContainerPath(current, change.targetId, change.containerPath, String(change.component.type));
      if (!resolved.container)
        return {
          errors: [resolved.error ?? `Container “${change.containerPath}” is not compatible with appendChild.`],
          summary: "No changes applied.",
        };
      candidate = appendToContainer(candidate, resolved.container.path, change.component as unknown as Record<string, unknown>);
    }
  }
  if (!object(candidate))
    return {
      errors: ["Change package did not produce a specification."],
      summary: "No changes applied.",
    };
  const validation = validateCandidate(candidate, context);
  if (!validation.schema) return validation;
  const labels: Record<AiChangePackage["operation"], string> = {
    replaceDashboard: "Replace dashboard",
    replace: "Replace selected component",
    insertBefore: "Insert component before target",
    insertAfter: "Insert component after target",
    appendChild: "Append child component",
    appendRoot: "Append component to root",
    remove: "Remove selected component",
  };
  return {
    schema: validation.schema,
    errors: [],
    summary: change.operation === "appendRoot" ? `${labels[change.operation]} (${change.containerPath}).` : `${labels[change.operation]} (${change.targetId}).`,
  };
}
