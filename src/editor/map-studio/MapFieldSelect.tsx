import type { NormalizedField } from "../../data/normalizeData";

export function FieldSelect({
  label,
  value,
  fields,
  numeric = false,
  onChange,
}: {
  label: string;
  value: string;
  fields: NormalizedField[];
  numeric?: boolean;
  onChange: (value: string) => void;
}) {
  const options = fields.filter(
    (field) =>
      !numeric || field.dataType === "number" || field.dataType === "unknown",
  );
  return (
    <label>
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        <option value="">Not set</option>
        {options.map((field) => (
          <option value={field.key}>
            {field.displayName} · {field.key}
            {field.sourceTable ? ` · ${field.sourceTable}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
