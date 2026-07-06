import { aggregateValue } from "../../data/aggregations";
import { DataRow } from "../../data/normalizeData";
import { MatrixComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { formatValue } from "../../utils/formatValue";
import { Card } from "../layout/LayoutBlocks";

const tuple=(row:DataRow,fields:string[])=>fields.map(field=>String(row[field]??"(Blank)"));
export function MatrixBlock({ component }: { component: MatrixComponent }) {
    const { rows, data }=useRenderContext();const rowFields=component.rows;const columnField=component.columns?.[0];const columnValues=columnField?Array.from(new Set(rows.map(row=>String(row[columnField]??"(Blank)")))).slice(0,50):["Value"];const rowKeys=Array.from(new Map(rows.map(row=>[JSON.stringify(tuple(row,rowFields)),tuple(row,rowFields)])).values()).slice(0,component.maxRows??200);const metric=component.values[0]??{aggregation:"count" as const};
    const cell=(keys:string[],column:string)=>{const subset=rows.filter(row=>keys.every((value,index)=>String(row[rowFields[index]]??"(Blank)")===value)&&(!columnField||String(row[columnField]??"(Blank)")===column));return aggregateValue(subset,metric.field,metric.aggregation??"sum");};
    const allValues=rowKeys.flatMap(keys=>columnValues.map(column=>Number(cell(keys,column))||0));const maximum=Math.max(1,...allValues.map(Math.abs));
    return <Card title={component.title}><div class="hp-table-wrap"><table class="hp-matrix"><thead><tr>{rowFields.map(field=><th>{data.fields[field]?.displayName??field}</th>)}{columnValues.map(column=><th>{column}</th>)}{component.showTotals&&<th>Total</th>}</tr></thead><tbody>{rowKeys.map(keys=><tr>{keys.map(value=><th>{value}</th>)}{columnValues.map(column=>{const value=cell(keys,column);const intensity=Math.abs(Number(value)||0)/maximum;return <td style={component.heatmap?{background:`color-mix(in srgb, var(--hp-primary) ${Math.round(intensity*28)}%, var(--hp-surface))`}:undefined}>{formatValue(value,metric.format)}</td>;})}{component.showTotals&&<td><strong>{formatValue(aggregateValue(rows.filter(row=>keys.every((value,index)=>String(row[rowFields[index]]??"(Blank)")===value)),metric.field,metric.aggregation??"sum"),metric.format)}</strong></td>}</tr>)}</tbody></table></div></Card>;
}

