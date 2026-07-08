import { evaluateCondition } from "../../calculations/conditionEvaluator";
import { DataRow, Primitive } from "../../data/normalizeData";
import { clearComponentInteraction, executeComponentInteraction, resolveInteractionSelection } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { InteractionDetails } from "../../powerbi/interactionDiagnostics";
import { RenderContextValue } from "../../render/RenderContext";
import { ComponentBase, SafeInteraction, SelectionMode } from "../../schema/hyperpbiSchema";

export interface InteractionEventOptions extends InteractionDetails {
    multiSelect?: boolean;
    event?: Event;
    component?: ComponentBase;
}

export interface InteractionExecutionResult {
    matchedRows: number[];
    selectedRows: number[];
    externalSelectionSent: boolean;
    externalFilterSent: boolean;
}

/** @deprecated Use resolveInteractionSelection from the universal engine. */
export const resolveSelection = (current:number[],matching:number[],mode:SelectionMode="replace",modifier=false):number[] => resolveInteractionSelection(current,matching,mode,modifier);

function interactionField(interaction: SafeInteraction, options: InteractionEventOptions): string | undefined {
    if (options.field) return options.field;
    const where=interaction.where;
    return where&&"left" in where&&where.left&&typeof where.left==="object"&&"field" in where.left?String(where.left.field):interaction.field;
}

function universalComponent(interaction: SafeInteraction, options: InteractionEventOptions, clickedRow?: DataRow): ComponentBase {
    const original=options.component??{type:options.componentType??"custom",id:options.componentId??"custom"};
    const field=interactionField(interaction,options);const value=options.value??(field&&clickedRow?clickedRow[field]:interaction.value) as Primitive;
    return {...original,interaction:{...original.interaction,enabled:original.interaction?.enabled??true,trigger:"click",internalMode:interaction.internal===false?"none":original.interaction?.internalMode??(interaction.action==="setFilter"?"filter":"highlight"),externalMode:interaction.external===false?"none":interaction.externalMode??original.interaction?.externalMode??(interaction.action==="selectWhere"&&field?"filter":undefined),field:original.interaction?.field??field,value:original.interaction?.value!==undefined?original.interaction.value:value,selectionMode:interaction.selectionMode??original.interaction?.selectionMode}};
}

export function runSafeInteraction(interaction: SafeInteraction | undefined, context: RenderContextValue, clickedRow?: DataRow, clickedRowSourceIndex?: number, eventOptions: InteractionEventOptions = {}): InteractionExecutionResult {
    const empty={matchedRows:[],selectedRows:context.state.selectedRows,externalSelectionSent:false,externalFilterSent:false};
    if(!interaction){context.reportInteraction(eventOptions,"interaction payload unavailable");return empty;}
    const component=universalComponent(interaction,eventOptions,clickedRow);const componentId=component.id??component.type;const policy=resolveInteractionPolicy(component,context.config,"custom");const field=policy.field;
    if(interaction.action==="clearSelection"){const result=clearComponentInteraction(policy,componentId,context);return{matchedRows:[],selectedRows:[],externalSelectionSent:policy.externalMode==="selection"&&result.externalSent,externalFilterSent:policy.externalMode==="filter"&&result.externalSent};}
    if(interaction.action==="selectWhere"||interaction.action==="selectRow"||interaction.action==="setFilter"){
        const matchedRows=interaction.action==="selectWhere"?context.sourceRows.map((row,index)=>evaluateCondition(interaction.where,row,{clickedRow,knownFieldKeys:new Set(Object.keys(context.data.fields))})?index:-1).filter(index=>index>=0):interaction.action==="selectRow"?(Number.isInteger(clickedRowSourceIndex)?[clickedRowSourceIndex as number]:[]):field?context.sourceRows.map((row,index)=>row[field]===policy.value?index:-1).filter(index=>index>=0):[];
        const values=field?Array.from(new Set(matchedRows.map(index=>context.sourceRows[index]?.[field]))).filter(value=>value!==undefined):[];const value=policy.value!==undefined?policy.value:values.length>1?values:values[0];
        const result=executeComponentInteraction(policy,createInteractionPayload(component,{rowIndices:matchedRows,field,value,operator:interaction.action==="setFilter"?"=":undefined}),context,{trigger:"click",multiSelect:eventOptions.multiSelect,event:eventOptions.event});
        return{matchedRows,selectedRows:result.selectedRows,externalSelectionSent:policy.externalMode==="selection"&&result.externalSent,externalFilterSent:policy.externalMode==="filter"&&result.externalSent};
    }
    if(interaction.action==="clearFilter"){const result=clearComponentInteraction(policy,componentId,context);return{...empty,externalFilterSent:result.externalSent};}
    if(interaction.action==="setState"&&interaction.target)context.dispatch({type:"value",id:interaction.target,value:interaction.value});
    else if(interaction.action==="toggleState"&&interaction.target)context.dispatch({type:"value",id:interaction.target,value:!context.state.values[interaction.target]});
    else if(interaction.action==="openTab"&&interaction.target)context.dispatch({type:"tab",id:interaction.target,value:String(interaction.value??"")});
    else if(interaction.action==="toggleCollapse"&&interaction.target)context.dispatch({type:"collapse",id:interaction.target});
    else {context.reportInteraction(eventOptions,"unsupported interaction action");return empty;}
    const result=executeComponentInteraction(policy,createInteractionPayload(component,{field,value:interaction.value}),context,{trigger:"click",event:eventOptions.event});
    return{matchedRows:[],selectedRows:result.selectedRows,externalSelectionSent:policy.externalMode==="selection"&&result.externalSent,externalFilterSent:policy.externalMode==="filter"&&result.externalSent};
}

export const rowsMatching = (rows: DataRow[], interaction?: SafeInteraction, clickedRow?: DataRow, knownFieldKeys: ReadonlySet<string> = new Set()): number[] => interaction?.where ? rows.map((row, index) => evaluateCondition(interaction.where, row, { clickedRow, knownFieldKeys }) ? index : -1).filter(index => index >= 0) : [];
