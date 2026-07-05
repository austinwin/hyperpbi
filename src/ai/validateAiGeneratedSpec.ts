import { validateCalculations } from "../calculations/calculationValidator";
import { NormalizedData } from "../data/normalizeData";
import { HyperPbiSchema } from "../schema/hyperpbiSchema";
import { migrateSchema } from "../schema/schemaMigrations";
import { validateReferences } from "../schema/validateReferences";
import { validateSchema } from "../schema/validateSchema";
import { applyCalculations } from "../calculations/calculationEngine";
export function validateAiGeneratedSpec(value: unknown, data: NormalizedData): { schema?: HyperPbiSchema; errors: string[]; warnings: string[] } { const schema = validateSchema(migrateSchema(value)); if (!schema.valid || !schema.schema) return { errors:schema.errors, warnings:[] }; const calculations = validateCalculations(schema.schema.calculations, Object.keys(data.fields)); const calculated=applyCalculations(data,schema.schema.calculations); return { schema:schema.schema, errors:calculations.filter(item=>item.level==="error").map(item=>`${item.path}: ${item.message}`), warnings:[...validateReferences(schema.schema,calculated.data),...calculations.filter(item=>item.level==="warning").map(item=>item.message)] }; }
