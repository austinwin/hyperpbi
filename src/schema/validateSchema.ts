import type { HyperPbiSchema } from "./hyperpbiSchema";
import type { Diagnostic } from "./diagnostics";
import { diagnosticsToStrings } from "./diagnostics";
import { validateV2Schema } from "./validateV2Schema";

export interface SchemaValidationResult {
  valid: boolean;
  schema?: HyperPbiSchema;
  errors: string[];
  diagnostics?: Diagnostic[];
  warnings?: string[];
}

/** Validates the only active HyperPBI dashboard schema contract: version 2.0. */
export function validateSchema(value: unknown): SchemaValidationResult {
  const result = validateV2Schema(value);
  const errors = result.diagnostics.filter((item) => item.severity === "error");
  const warnings = result.diagnostics.filter((item) => item.severity === "warning");
  return {
    valid: result.valid,
    schema: result.schema,
    diagnostics: result.diagnostics,
    errors: diagnosticsToStrings(errors),
    warnings: diagnosticsToStrings(warnings),
  };
}
