import { useState } from "preact/hooks";
import { NormalizedData } from "../data/normalizeData";
import { copyText } from "./textActions";

export function FieldsPanel({ data }: { data: NormalizedData }) {
  const [copyMessage, setCopyMessage] = useState("");
  const fields = Object.values(data.fields);

  if (!fields.length)
    return (
      <div class="hp-bottom-empty" role="status">
        <strong>No fields are available</strong>
        <p>Add data fields to the Power BI visual to use them in HyperPBI.</p>
      </div>
    );

  const copy = async (key: string) => {
    const copied = await copyText(key);
    setCopyMessage(
      copied
        ? `Copied field key ${key}.`
        : `Copy was blocked. Select the field key ${key} manually.`,
    );
  };

  return (
    <div class="hp-fields-panel">
      <div class="hp-fields-panel-status" role="status">
        {copyMessage || `${fields.length} fields available`}
      </div>
      <div class="hp-field-browser hp-field-browser-rich">
        {fields.map((field) => (
          <article class="hp-field-card">
            <header>
              <div>
                <strong>{field.displayName}</strong>
                <code>{field.key}</code>
              </div>
              <button
                type="button"
                aria-label={`Copy field key ${field.key}`}
                onClick={() => void copy(field.key)}
              >
                Copy key
              </button>
            </header>
            <dl>
              <div>
                <dt>Source</dt>
                <dd>{field.qualifiedName ?? field.queryName ?? "Unqualified"}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{field.type}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{field.format ?? "Default"}</dd>
              </div>
              <div>
                <dt>Roles</dt>
                <dd>{field.roles.join(", ") || "Values"}</dd>
              </div>
            </dl>
            <small>
              Sample: {data.rows.slice(0, 3).map((row) => String(row[field.key] ?? "—")).join(" · ") || "No values"}
            </small>
          </article>
        ))}
      </div>
    </div>
  );
}
