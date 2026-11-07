import type { NormalizedField } from "../../data/normalizeData";
import { useState } from "preact/hooks";

export function FieldSelect({
  label,
  ariaLabel,
  value,
  fields,
  numeric = false,
  onChange,
  searchable = false,
}: {
  label: string;
  ariaLabel?: string;
  value: string;
  fields: NormalizedField[];
  numeric?: boolean;
  onChange: (value: string) => void;
  searchable?: boolean;
}) {
  const [search, setSearch] = useState("");
  const options = fields.filter(
    (field) =>
      !numeric || field.dataType === "number" || field.dataType === "unknown",
  );
  return (
    <label>
      <span>{label}</span>
      {searchable && <input type="search" aria-label={`Search ${ariaLabel ?? label} fields`} placeholder="Search fields…" value={search} onInput={event => setSearch(event.currentTarget.value)} />}
      <select
        aria-label={ariaLabel ?? label}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        <option value="">Not set</option>
        {value && !options.some(field => field.key === value) && <option value={value}>{value} · unavailable</option>}
        {options.filter(field => field.key === value || `${field.key} ${field.displayName}`.toLowerCase().includes(search.toLowerCase())).map((field) => (
          <option value={field.key}>
            {field.displayName} · {field.key}
            {field.sourceTable ? ` · ${field.sourceTable}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
