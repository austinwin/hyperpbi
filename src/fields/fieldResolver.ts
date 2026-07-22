import { NormalizedData } from "../data/normalizeData";
import { createFieldAliasRegistry, FieldAliasRegistry } from "./fieldAliasRegistry";

export interface FieldResolution { reference: string; key?: string; alias?: string; status: "resolved" | "unknown" | "ambiguous"; candidates?: string[]; }

export class FieldResolver {
    readonly registry: FieldAliasRegistry;
    constructor(readonly data: NormalizedData, overrides: Record<string,string> = {}) { this.registry=createFieldAliasRegistry(data,overrides); }
    resolve(reference: string): FieldResolution {
        const alias=this.registry.byAlias.get(reference); if(alias)return{reference,key:alias.key,alias:alias.alias,status:"resolved"};
        const direct=this.registry.byKey.get(reference); if(direct)return{reference,key:direct.key,alias:direct.alias,status:"resolved"};
        return{reference,status:"unknown"};
    }
}

export function resolveFieldReference(reference:string,data:NormalizedData,overrides:Record<string,string>={}):FieldResolution{return new FieldResolver(data,overrides).resolve(reference);}
