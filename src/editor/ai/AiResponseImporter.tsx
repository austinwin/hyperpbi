import { useState } from "preact/hooks";
import { applyChangePackage } from "../../ai/applyChangePackage";
import { buildRepairPrompt } from "../../ai/buildRepairPrompt";
import { isAiChangePackage } from "../../ai/changePackage";
import { validateAiChangePackage } from "../../ai/changePackageValidation";
import { extractJsonFromAiResponse } from "../../ai/extractJsonFromAiResponse";
import { validateAiGeneratedSpec } from "../../ai/validateAiGeneratedSpec";
import { parseConfig } from "../../config/hyperpbiConfig";
import type { NormalizedData } from "../../data/normalizeData";
import type { HyperPbiSchema } from "../../schema/hyperpbiSchema";
import { copyText } from "../textActions";
export function buildAiImportErrorLog(
  response: string,
  json: string,
  errors: string[],
  warnings: string[],
  message: string,
): string {
  return [
    `Timestamp: ${new Date().toISOString()}`,
    `Message: ${message || "No message"}`,
    "Errors:",
    ...(errors.length ? errors.map((error) => `- ${error}`) : ["- None"]),
    "Warnings:",
    ...(warnings.length
      ? warnings.map((warning) => `- ${warning}`)
      : ["- None"]),
    "Extracted JSON:",
    json || "(none)",
    "Original response:",
    response || "(empty)",
  ].join("\n");
}
export function AiResponseImporter({
  data,
  currentSpecification,
  aliasOverrides = {},
  onPreview,
}: {
  data: NormalizedData;
  currentSpecification: string;
  aliasOverrides?: Record<string, string>;
  /** Validates, renders, and promotes the resulting dashboard to the working draft. */
  onPreview: (json: string, configJson?: string) => boolean;
}) {
  const [response, setResponse] = useState("");
  const [json, setJson] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [diagnostics, setDiagnostics] = useState<
    import("../../schema/diagnostics").Diagnostic[]
  >([]);
  const inspect = () => {
    setJson("");
    setErrors([]);
    setWarnings([]);
    setMessage("");
    setSummary("");
    setDiagnostics([]);
    const extracted = extractJsonFromAiResponse(response);
    if (extracted.error) {
      setErrors([extracted.error]);
      return;
    }
    const configErrors = extracted.configJson
      ? parseConfig(extracted.configJson).errors.map(
          (error) => `Configuration: ${error}`,
        )
      : [];
    let applyJson = extracted.json ?? JSON.stringify(extracted.value),
      previewJson = applyJson,
      mutation = "Complete dashboard replacement.";
    let validation;
    if (isAiChangePackage(extracted.value)) {
      const checked = validateAiChangePackage(extracted.value);
      if (!checked.package) {
        setErrors([...checked.errors, ...configErrors]);
        return;
      }
      let current: HyperPbiSchema;
      try {
        current = JSON.parse(currentSpecification) as HyperPbiSchema;
      } catch {
        setErrors([
          "The current dashboard is invalid; a targeted change cannot be applied.",
        ]);
        return;
      }
      const applied = applyChangePackage(current, checked.package, {
        validateResult: (candidate) => validateAiGeneratedSpec(candidate, data, aliasOverrides),
      });
      if (!applied.schema) {
        setErrors(applied.errors);
        setSummary(
          `Operation ${extracted.value.operation} targeting ${extracted.value.operation === "appendRoot" ? `root:${extracted.value.containerPath}` : extracted.value.operation === "replaceDashboard" ? "the complete dashboard" : extracted.value.targetId} was not applied.`,
        );
        return;
      }
      previewJson = JSON.stringify(applied.schema, null, 2);
      mutation = applied.summary;
      validation = validateAiGeneratedSpec(
        applied.schema,
        data,
        aliasOverrides,
      );
    } else
      validation = validateAiGeneratedSpec(
        extracted.value,
        data,
        aliasOverrides,
      );
    // The preview and the authoring draft must use the same prepared result.
    // For a change package, previewJson already contains the complete applied
    // dashboard; for a replacement, authoring contains any safe normalization.
    const next = validation.authoring
      ? JSON.stringify(validation.authoring, null, 2)
      : previewJson;
    const allErrors = [...validation.errors, ...configErrors];
    setJson(next);
    setErrors(allErrors);
    setWarnings(validation.warnings);
    setDiagnostics(validation.diagnostics);
    setSummary(mutation);
    return {
      previewJson: next,
      configJson: extracted.configJson,
      errors: allErrors,
    };
  };
  const preview = () => {
    const result = inspect();
    if (!result || result.errors.length) {
      setMessage(
        "No changes were applied. Repair the response and validate again.",
      );
      return;
    }
    if (onPreview(result.previewJson, result.configJson)) {
      setMessage(
        "Preview is valid and synchronized with the working JSON. Save & return will persist this dashboard.",
      );
    } else
      setMessage(
        "No changes were applied because the resulting preview was invalid.",
      );
  };
  const repair = buildRepairPrompt(
    json || response || currentSpecification,
    diagnostics.length ? diagnostics : errors,
    data,
    warnings,
  );
  return (
    <section class="hp-ai-import hp-builder-step">
      <header>
        <span>2</span>
        <div>
          <strong>Paste AI response</strong>
          <small>
            Complete dashboards and strict hyperpbi-change packages are
            accepted.
          </small>
        </div>
      </header>
      <textarea
        aria-label="AI dashboard response"
        aria-invalid={errors.length > 0}
        value={response}
        onInput={(event) => {
          setResponse(event.currentTarget.value);
          setJson("");
          setErrors([]);
          setWarnings([]);
          setMessage("");
          setSummary("");
          setDiagnostics([]);
        }}
        placeholder="Paste a complete dashboard or hyperpbi-change package…"
      />
      <div class="hp-button-row">
        <button
          class="hp-primary-action"
          type="button"
          disabled={!response.trim()}
          onClick={preview}
        >
          Validate response &amp; preview
        </button>
      </div>
      {summary && (
        <div class="hp-mutation-summary">
          <strong>Mutation summary:</strong> {summary}
        </div>
      )}
      {message && (
        <div
          class={`hp-import-message ${errors.length ? "is-error" : "is-ok"}`}
          role="status"
        >
          {message}
        </div>
      )}
      {errors.length > 0 && (
        <section class="hp-repair-panel" role="alert">
          <button
            type="button"
            onClick={() =>
              void copyText(
                buildAiImportErrorLog(
                  response,
                  json,
                  errors,
                  warnings,
                  message,
                ),
              )
            }
          >
            Copy error log
          </button>
          <strong>Response issues</strong>
          <ul>
            {errors.map((error) => (
              <li>{error}</li>
            ))}
          </ul>
          <button type="button" onClick={() => void copyText(repair)}>
            Copy targeted repair prompt
          </button>
        </section>
      )}
      {warnings.length > 0 && (
        <div class="hp-validation-list">
          <strong>{warnings.length} warning(s)</strong>
          <ul>
            {warnings.map((warning) => (
              <li>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      <details>
        <summary>Response details</summary>
        <button type="button" onClick={() => inspect()}>
          Validate only
        </button>
        {json && <pre>{json}</pre>}
      </details>
    </section>
  );
}
