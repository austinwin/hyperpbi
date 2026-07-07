import { TimelineComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";
import { useMemo } from "preact/hooks";

export function Timeline({ component }: { component: TimelineComponent }) {
    const { rows, sourceRows, state, dispatch, selectExternal, reportInteraction }=useRenderContext(); const id=component.id??"timeline";const sourceIndices=useMemo(()=>new Map(sourceRows.map((row,index)=>[row,index] as const)),[sourceRows]);
    const prepared=useMemo(()=>[...rows].sort((left,right)=>{const a=new Date(String(left[component.dateField]??"")).getTime();const b=new Date(String(right[component.dateField]??"")).getTime();return(a-b)*(component.sortDirection==="asc"?1:-1);}).slice(0,Math.min(500,Math.max(1,component.limit??50))),[rows,component.dateField,component.sortDirection,component.limit]);
    const select=(row:typeof rows[number])=>{const index=sourceIndices.get(row);const indices=index!==undefined?[index]:[];dispatch({type:"selectComponentRows",id,rows:indices});if(component.internal!==false)dispatch({type:"selectRows",rows:indices});const field=component.titleField;const details={componentId:id,componentType:component.type,field,value:row[field],matchedRowCount:indices.length};if(component.external===false)reportInteraction(details,"component did not call selectExternal",indices);else selectExternal(indices,false,details);};
    return <Card title={component.title}><ol class="hp-timeline">{prepared.map(row=>{const index=sourceIndices.get(row)??-1;const selected=state.componentSelectedRows[id]?.includes(index)||state.selectedRows.includes(index);return <li class={selected?"is-selected hp-row-selected":""} onClick={()=>select(row)}><time>{formatValue(row[component.dateField],"date")}</time><div><strong>{formatValue(row[component.titleField])}</strong>{(component.categoryField||component.statusField)&&<span class="hp-timeline-meta">{component.categoryField&&<b>{formatValue(row[component.categoryField])}</b>}{component.statusField&&<em>{formatValue(row[component.statusField])}</em>}</span>}{component.descriptionField&&<p>{formatValue(row[component.descriptionField])}</p>}</div></li>;})}</ol></Card>;
}
