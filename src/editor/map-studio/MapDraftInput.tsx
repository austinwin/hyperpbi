import { useEffect, useState } from "preact/hooks";

/** Transactional text input: drafts locally and commits only on blur, change, or Enter. */
export function DraftInput({
  label,
  ariaLabel,
  value,
  onCommit,
  multiline = false,
}: {
  label?: string;
  ariaLabel?: string;
  value: string;
  onCommit: (value: string) => boolean | void;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = (next = draft) => {
    if (next !== value) onCommit(next);
  };
  const common = {
    value: draft,
    "aria-label": ariaLabel ?? label,
    onInput: (event: Event) =>
      setDraft(
        (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value,
      ),
    onChange: (event: Event) => {
      const next = (
        event.currentTarget as HTMLInputElement | HTMLTextAreaElement
      ).value;
      setDraft(next);
      commit(next);
    },
    onBlur: (event: FocusEvent) =>
      commit(
        (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value,
      ),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value =
          value;
        setDraft(value);
      }
      if (!multiline && event.key === "Enter") {
        event.preventDefault();
        commit((event.currentTarget as HTMLInputElement).value);
      }
    },
  };
  const control = multiline ? <textarea {...common} /> : <input {...common} />;
  return label ? (
    <label>
      <span>{label}</span>
      {control}
    </label>
  ) : (
    control
  );
}
