import "../catalog/componentDescriptorRegistry";
import type { HyperPbiSchema } from "./hyperpbiSchema";
import type { Diagnostic } from "./diagnostics";
import { diagnosticsToStrings } from "./diagnostics";
import { validateV2Schema } from "./validateV2Schema";
import { validateNetworkGraphComponents } from "./networkGraphValidation";

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
  const diagnostics = [...result.diagnostics, ...validateNetworkGraphComponents(value)];
  const errors = diagnostics.filter((item) => item.severity === "error");
  const warnings = diagnostics.filter((item) => item.severity === "warning");
  return {
    valid: errors.length === 0,
    schema: errors.length === 0 ? result.schema : undefined,
    diagnostics,
    errors: diagnosticsToStrings(errors),
    warnings: diagnosticsToStrings(warnings),
  };
}
