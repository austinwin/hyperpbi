import { DataRow } from "../../data/normalizeData";
import { ContentComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { renderTemplate } from "../../render/renderTemplate";
import { sanitizeHtml } from "../../security/sanitizeHtml";
import { runSafeInteraction } from "./customInteractionResolver";
import { validateCustomComponent } from "./customComponentSchema";

export interface CustomRepeatRow { row: DataRow; sourceIndex: number; }

function compareValues(left: unknown, right: unknown): number {
    if (typeof left === "number" && typeof right === "number") return left - right;
    return String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true, sensitivity: "base" });
}
export function prepareCustomRepeatRows(rows: DataRow[], sourceRows: DataRow[], repeat: NonNullable<ContentComponent["repeat"]>): CustomRepeatRow[] {
    let prepared = rows.map(row => ({ row, sourceIndex: sourceRows.indexOf(row) })).filter(item => item.sourceIndex >= 0);
    if (repeat.distinctBy) {
        const seen = new Set<unknown>();
        prepared = prepared.filter(item => { const value = item.row[repeat.distinctBy as string]; if (seen.has(value)) return false; seen.add(value); return true; });
    }
    if (repeat.sortBy) {
        const direction = repeat.sortDirection === "desc" ? -1 : 1; const field = repeat.sortBy;
        prepared = [...prepared].sort((left, right) => compareValues(left.row[field], right.row[field]) * direction || left.sourceIndex - right.sourceIndex);
    }
    return prepared.slice(0, Math.min(1000, Math.max(0, repeat.limit ?? 10)));
}

export function CustomComponent({ component }: { component: ContentComponent }) {
    const context = useRenderContext(); const { data, sourceRows, state, schema, settings } = context; const errors = validateCustomComponent(component);
    if (errors.length) return <div class="hp-custom-error">{errors.join(" ")}</div>;
    const render = (template: string, row?: DataRow) => sanitizeHtml(renderTemplate(template, data, state.values, component.title ?? schema.title ?? "", { row, props: component.props, state: state.values, title: component.title }), { allowInlineSvg: settings.allowInlineSvg, allowSafeImages: settings.allowSafeImages }).html;
    const click = component.interactions?.onClick; const componentId = component.id ?? "custom";
    const repeated = component.repeat ? prepareCustomRepeatRows(data.rows, sourceRows, component.repeat) : [];
    const selectedRows = state.componentSelectedRows[componentId] ?? (click?.internal === false ? [] : state.selectedRows);
    const selected = (item: CustomRepeatRow): boolean => component.repeat?.distinctBy
        ? selectedRows.some(index => sourceRows[index]?.[component.repeat?.distinctBy as string] === item.row[component.repeat?.distinctBy as string])
        : selectedRows.includes(item.sourceIndex);
    const invoke = (row: DataRow | undefined, sourceIndex: number | undefined, event?: { ctrlKey?: boolean; metaKey?: boolean }) => runSafeInteraction(click, context, row, sourceIndex, { componentId, componentType: component.type, multiSelect: Boolean(event?.ctrlKey || event?.metaKey) });
    return <div class="hp-custom" role={!component.repeat && click ? "button" : undefined} tabIndex={!component.repeat && click ? 0 : undefined} onClick={!component.repeat && click ? event => invoke(undefined, undefined, event) : undefined} onKeyDown={!component.repeat && click ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); invoke(undefined, undefined, event); } } : undefined}>
        <div class="hp-custom-body">
            {component.html && <div class="hp-custom-static" dangerouslySetInnerHTML={{ __html: render(component.html) }} />}
            {repeated.map(item => <div key={item.sourceIndex} class={`hp-custom-repeat-row ${selected(item) ? "is-selected hp-row-selected" : ""}`} role={click ? "button" : undefined} tabIndex={click ? 0 : undefined} data-row-index={item.sourceIndex} onClick={click ? event => { event.stopPropagation(); invoke(item.row, item.sourceIndex, event); } : undefined} onKeyDown={click ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); invoke(item.row, item.sourceIndex, event); } } : undefined}><div dangerouslySetInnerHTML={{ __html: render(component.repeat?.template ?? "", item.row) }} /></div>)}
        </div>
    </div>;
}
