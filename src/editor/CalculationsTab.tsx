import { useEffect, useMemo, useState } from "preact/hooks";
import { applyDerivedFields } from "../calculations/derivedFields";
import { samplePreviewRows } from "../data/samplePreviewRows";
import { CalculationSpecification } from "../calculations/calculationTypes";
import { validateCalculations } from "../calculations/calculationValidator";
import { NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { CodeEditor } from "./CodeEditor";

export function CalculationsTab({
  data,
  schema,
  onChange,
  theme,
  fontSize,
  wordWrap,
}: {
  data: NormalizedData;
  schema?: HyperPbiSchema;
  onChange: (calculations: CalculationSpecification) => void;
  theme: string;
  fontSize: number;
  wordWrap: boolean;
}) {
  const canonicalValue = JSON.stringify(
    schema?.calculations ?? { fields: [], metrics: [] },
    null,
    2,
  );
  const [draft, setDraft] = useState(canonicalValue);
  const [draftError, setDraftError] = useState("");
  useEffect(() => {
    setDraft(canonicalValue);
    setDraftError("");
  }, [canonicalValue]);

  const messages = useMemo(
    () =>
      validateCalculations(schema?.calculations, Object.keys(data.fields)),
    [schema?.calculations, data.fields],
  );
  const sample = useMemo(() => {
    const rows = data.rows.slice(0, 3);
    const derived = messages.some(message => message.level === "error")
      ? rows : applyDerivedFields(rows, data.fields, schema?.calculations?.fields).rows;
    return samplePreviewRows({ ...data, rows: derived }, 3);
  }, [data.rows, data.fields, schema?.calculations?.fields, messages]);
  const update = (text: string) => {
    setDraft(text);
    try {
      const value = JSON.parse(text) as CalculationSpecification;
      setDraftError("");
      onChange(value);
    } catch (error) {
      setDraftError(
        `Calculation JSON is not applied yet: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };
  const insertExample = () => {
    const hasCalculations = Boolean(
      schema?.calculations?.fields?.length || schema?.calculations?.metrics?.length,
    );
    if (
      hasCalculations &&
      !globalThis.confirm(
        "Replace the current calculations with the example calculation?",
      )
    )
      return;
    onChange({
      fields: [
        {
          key: "risk_band",
          label: "Risk Band",
          type: "text",
          expression: {
            op: "case",
            cases: [
              {
                when: {
                  op: ">=",
                  left: { field: Object.keys(data.fields)[0] ?? "field" },
                  right: { value: 80 },
                },
                then: { value: "High" },
              },
            ],
            else: { value: "Normal" },
          },
        },
      ],
      metrics: [],
    });
  };

  return (
    <div class="hp-calculations-tab">
      <section>
        <header>
          <div>
            <strong>Safe calculation DSL</strong>
            <span>
              Derived fields and metrics execute as validated JSON—never
              JavaScript.
            </span>
          </div>
          <button type="button" onClick={insertExample}>
            Insert example
          </button>
        </header>
        {draftError && (
          <div class="hp-studio-inline-error" role="alert">
            {draftError}
          </div>
        )}
        <CodeEditor
          value={draft}
          onChange={update}
          theme={theme}
          fontSize={fontSize}
          wordWrap={wordWrap}
          ariaLabel="HyperPBI calculations JSON"
        />
      </section>
      <aside>
        <h3>Validation</h3>
        {draftError ? (
          <div class="hp-validation-list hp-validation-error" role="alert">
            Fix the JSON draft before calculation changes can be applied.
          </div>
        ) : messages.length ? (
          <ul class="hp-validation-list">
            {messages.map((item) => (
              <li class={item.level}>
                {item.path}: {item.message}
              </li>
            ))}
          </ul>
        ) : (
          <div class="hp-ready-state" role="status">
            ✓ Calculations valid
          </div>
        )}
        <h3>Calculated fields</h3>
        <div class="hp-field-chip-list">
          {schema?.calculations?.fields?.length ? (
            schema.calculations.fields.map((field) => <code>{field.key}</code>)
          ) : (
            <span>None</span>
          )}
        </div>
        <h3>Calculated metrics</h3>
        <p>Run the dashboard preview to evaluate metrics across all loaded rows.</p>
        <h3>Row preview</h3>
        <pre>{JSON.stringify(sample, null, 2)}</pre>
      </aside>
    </div>
  );
}
