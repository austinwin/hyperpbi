import { useEffect, useMemo, useState } from "preact/hooks";
import { applyCalculations } from "../calculations/calculationEngine";
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
  const calculated = useMemo(
    () => applyCalculations(data, schema?.calculations),
    [data, schema?.calculations],
  );
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
        <h3>Metric preview</h3>
        <pre>{JSON.stringify(calculated.data.calculatedMetrics ?? {}, null, 2)}</pre>
        <h3>Row preview</h3>
        <pre>{JSON.stringify(calculated.data.rows.slice(0, 3), null, 2)}</pre>
      </aside>
    </div>
  );
}
