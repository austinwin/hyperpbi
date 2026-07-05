import { smallWorkingSchema } from "../../schema/defaultSchema";
export function ErrorPanel({ title, errors, fields, showExample = true }: { title: string; errors: string[]; fields?: string[]; showExample?: boolean }) {
    return <div class="hp-error" role="alert"><h3>{title}</h3><ul>{errors.map(error => <li>{error}</li>)}</ul>{fields?.length ? <p><strong>Available fields:</strong> {fields.join(", ")}</p> : null}{showExample && <details><summary>Working schema example</summary><pre>{smallWorkingSchema}</pre></details>}</div>;
}
