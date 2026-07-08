import { DataDisplayComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { selectedSourceRowIndex } from "../../render/selection";
import { formatValue } from "../../utils/formatValue";
import { copyText } from "../../editor/textActions";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";

export function DetailPanel({ component }: { component: DataDisplayComponent }) {
    const context=useRenderContext();const { sourceRows, state, data }=context;const rows=context.getRowsForComponent(component.id??component.type);const selectedIndex=selectedSourceRowIndex(state);const row=component.selectedRow===true?(selectedIndex===undefined?undefined:sourceRows[selectedIndex]):rows[0];
    if(!component.groups&&!component.items&&component.selectedRow!==true)return <Card title={component.title}><p class="hp-info-text">{component.text??formatValue(component.value??(component.field?row?.[component.field]:null),component.format)}</p></Card>;
    if(!row)return <Card title={component.title}><EmptyState title={component.emptyText??"Select a record"}>Choose a table row, chart item, map feature, or timeline event to inspect details.</EmptyState></Card>;
    type DetailEntry=string|{field:string;label?:string;badge?:boolean;copyable?:boolean;format?:string};const groups:Array<{title?:string;fields:DetailEntry[]}>=component.groups?.length?component.groups:[{fields:component.items?.map(item=>({field:item.field??"",label:item.label,format:item.format})).filter(item=>item.field)??Object.keys(data.fields).slice(0,8)}];
    return <Card title={component.title}><div class="hp-detail-groups">{groups.map(group=><section>{group.title&&<h4>{group.title}</h4>}<dl>{group.fields.map(entry=>{const item=typeof entry==="string"?{field:entry}:entry;const value=row[item.field];return <div><dt>{item.label??data.fields[item.field]?.displayName??item.field}</dt><dd class={item.badge?"hp-detail-badge":""}>{formatValue(value,item.format??data.fields[item.field]?.format)}{item.copyable&&<button type="button" title="Copy value" onClick={event=>{event.stopPropagation();void copyText(String(value??""));}}>Copy</button>}</dd></div>;})}</dl></section>)}</div></Card>;
}
