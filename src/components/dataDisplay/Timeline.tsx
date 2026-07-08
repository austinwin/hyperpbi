import { TimelineComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";
import { useMemo } from "preact/hooks";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";

export function Timeline({ component }: { component: TimelineComponent }) {
    const context=useRenderContext(); const { sourceRows }=context;const id=component.id??"timeline";const rows=context.getRowsForComponent(id);const policy=resolveInteractionPolicy(component,context.config,"dataPoint");const selectedRows=context.componentRows(id);const sourceIndices=useMemo(()=>new Map(sourceRows.map((row,index)=>[row,index] as const)),[sourceRows]);
    const prepared=useMemo(()=>[...rows].sort((left,right)=>{const a=new Date(String(left[component.dateField]??"")).getTime();const b=new Date(String(right[component.dateField]??"")).getTime();return(a-b)*(component.sortDirection==="asc"?1:-1);}).slice(0,Math.min(500,Math.max(1,component.limit??50))),[rows,component.dateField,component.sortDirection,component.limit]);
    return <Card title={component.title}><ol class="hp-timeline">{prepared.map(row=>{const index=sourceIndices.get(row)??-1;const selected=selectedRows.includes(index);const field=policy.field??component.titleField;return <li class={selected?"is-selected hp-row-selected":""} onClick={event=>executeComponentInteraction(policy,createInteractionPayload(component,{rowIndices:index>=0?[index]:[],field,value:row[field]}),context,{trigger:"click",multiSelect:event.ctrlKey||event.metaKey,event})}><time>{formatValue(row[component.dateField],"date")}</time><div><strong>{formatValue(row[component.titleField])}</strong>{(component.categoryField||component.statusField)&&<span class="hp-timeline-meta">{component.categoryField&&<b>{formatValue(row[component.categoryField])}</b>}{component.statusField&&<em>{formatValue(row[component.statusField])}</em>}</span>}{component.descriptionField&&<p>{formatValue(row[component.descriptionField])}</p>}</div></li>;})}</ol></Card>;
}
