import { useMemo } from "preact/hooks";
import { applyCalculations } from "../calculations/calculationEngine";
import { CalculationSpecification } from "../calculations/calculationTypes";
import { validateCalculations } from "../calculations/calculationValidator";
import { NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { CodeEditor } from "./CodeEditor";

export function CalculationsTab({ data, schema, onChange, theme, fontSize, wordWrap }: { data: NormalizedData; schema?: HyperPbiSchema; onChange:(calculations:CalculationSpecification)=>void; theme:string;fontSize:number;wordWrap:boolean }) {
    const value=JSON.stringify(schema?.calculations??{fields:[],metrics:[]},null,2);const messages=useMemo(()=>validateCalculations(schema?.calculations,Object.keys(data.fields)),[schema?.calculations,data.fields]);const calculated=useMemo(()=>applyCalculations(data,schema?.calculations),[data,schema?.calculations]);
    const update=(text:string)=>{try{onChange(JSON.parse(text) as CalculationSpecification);}catch{/* CodeMirror keeps invalid drafts local until JSON is parseable. */}};
    return <div class="hp-calculations-tab"><section><header><div><strong>Safe calculation DSL</strong><span>Derived fields and metrics execute as validated JSON—never JavaScript.</span></div><button onClick={()=>onChange({fields:[{key:"risk_band",label:"Risk Band",type:"text",expression:{op:"case",cases:[{when:{op:">=",left:{field:Object.keys(data.fields)[0]??"field"},right:{value:80}},then:{value:"High"}}],else:{value:"Normal"}}}],metrics:[]})}>Insert example</button></header><CodeEditor value={value} onChange={update} theme={theme} fontSize={fontSize} wordWrap={wordWrap} ariaLabel="HyperPBI calculations JSON"/></section><aside><h3>Validation</h3>{messages.length?<ul class="hp-validation-list">{messages.map(item=><li class={item.level}>{item.path}: {item.message}</li>)}</ul>:<div class="hp-ready-state">✓ Calculations valid</div>}<h3>Calculated fields</h3><div class="hp-field-chip-list">{schema?.calculations?.fields?.map(field=><code>{field.key}</code>)??<span>None</span>}</div><h3>Metric preview</h3><pre>{JSON.stringify(calculated.data.calculatedMetrics??{},null,2)}</pre><h3>Row preview</h3><pre>{JSON.stringify(calculated.data.rows.slice(0,3),null,2)}</pre></aside></div>;
}
