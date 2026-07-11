import { validateCalculations } from "../calculations/calculationValidator";
import { NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { applyCalculations } from "../calculations/calculationEngine";
import { validateReferences } from "../schema/validateReferences";
import { Diagnostic } from "../schema/diagnostics";
import { prepareSpecification } from "../schema/prepareSpecification";
export function validateAiGeneratedSpec(value: unknown, data: NormalizedData,aliasOverrides:Record<string,string>={}): { schema?: HyperPbiSchema; authoring?:unknown; errors: string[]; warnings: string[]; diagnostics:Diagnostic[]; repairs:Diagnostic[] } { const prepared=prepareSpecification(value,data,{aliasOverrides});if(!prepared.schema)return{authoring:prepared.authoring,errors:prepared.errors,warnings:prepared.warnings,diagnostics:prepared.diagnostics,repairs:prepared.repairs};const calculations=validateCalculations(prepared.schema.calculations,Object.keys(data.fields));const calculated=applyCalculations(data,prepared.schema.calculations);const errors=calculations.filter(item=>item.level==="error").map(item=>`${item.path}: ${item.message}`);const warnings=[...prepared.warnings,...validateReferences(prepared.schema,calculated.data),...calculations.filter(item=>item.level==="warning").map(item=>item.message)];return{schema:prepared.schema,authoring:prepared.authoring,errors,warnings,diagnostics:prepared.diagnostics,repairs:prepared.repairs}; }
