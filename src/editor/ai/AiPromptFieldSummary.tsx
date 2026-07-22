import { NormalizedData } from "../../data/normalizeData";
import { createFieldAliasRegistry } from "../../fields/fieldAliasRegistry";

export function AiPromptFieldSummary({
  data,
  onCopy,
}: {
  data: NormalizedData;
  onCopy: () => void;
}) {
  const registry = createFieldAliasRegistry(data);
  if (!registry.entries.length) {
    return (
      <div class="hp-ai-empty-fields" role="status">
        <strong>No fields are available</strong>
        <p>Add data fields to the Power BI visual before generating a prompt.</p>
      </div>
    );
  }
  return (
    <details class="hp-ai-details">
      <summary>{registry.entries.length} available field aliases</summary>
      <div class="hp-field-chip-list">
        {registry.entries.map((field) => (
          <code title={`${field.displayName} · ${field.semanticRole} · ${field.kind}`}>
            {field.alias}
          </code>
        ))}
      </div>
      <button onClick={onCopy}>Copy field manifest</button>
    </details>
  );
}
