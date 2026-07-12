import { NormalizedData } from "../data/normalizeData";
import { Diagnostic } from "../schema/diagnostics";
import { fieldManifestForPrompt } from "./fieldManifestForPrompt";
import { patternRegistry } from "../schema/patternRegistry";

export function buildRepairPrompt(json:string,diagnostics:Array<Diagnostic|string>,data:NormalizedData,warnings:string[]=[]):string{
    const structured:Diagnostic[]=diagnostics.map(item=>typeof item==="string"?{code:"INVALID_JSON",severity:"error",path:"/",message:item}:item);
    const componentIds=Array.from(new Set(structured.map(item=>item.componentId).filter(Boolean)));
    return `Repair this HyperPBI specification. Correct only the diagnosed issues and preserve all valid unrelated content, stable IDs, datasets, interactions, application behavior, styling, and any declared schema version. Do not migrate versions. If the version is missing, infer it only when the supplied diagnostics and complete shape make it unambiguous. Return one complete corrected JSON object only. Never return JSON Patch. Do not return Markdown fences, explanations, comments, or alternate versions.

Structured diagnostics:
${JSON.stringify(structured,null,2)}

Warnings:
${JSON.stringify(warnings,null,2)}

Valid field aliases for version 2.0 authoring (legacy normalized runtime keys may remain in an existing 1.0 specification):
${JSON.stringify(fieldManifestForPrompt(data,[],"types"),null,2)}

Relevant contract:
- A version 2.0 root requires version "2.0" and components; every component requires a unique stable id and a listed type; unknown properties are errors.
- Version 1.0 remains a compatibility format; do not rewrite it to 2.0 unless migration is explicitly requested.
- Referenced 2.0 fields use a valid supplied alias. Never invent or guess a business field.
- Relevant component IDs: ${componentIds.join(", ")||"See affected fragment"}.
- Patterns: ${Object.keys(patternRegistry).join(", ")}.
- No JavaScript, functions, credentials, unsafe HTML, comments, unsupported properties, SQL, network datasets, or speculative feature changes.

Invalid specification or affected fragment:
${json}`;
}
