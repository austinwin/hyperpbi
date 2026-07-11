import { NormalizedData } from "../data/normalizeData";
import { legacyFieldKeyMap } from "../schema/migrateFieldReferences";
import { createFieldAliasRegistry, FieldAliasRegistry } from "./fieldAliasRegistry";

export interface FieldResolution { reference: string; key?: string; alias?: string; status: "resolved" | "unknown" | "ambiguous"; candidates?: string[]; }

export class FieldResolver {
    readonly registry: FieldAliasRegistry;
    private legacy: Map<string,string>;
    constructor(readonly data: NormalizedData, overrides: Record<string,string> = {}) { this.registry=createFieldAliasRegistry(data,overrides);this.legacy=legacyFieldKeyMap(data.fields); }
    resolve(reference: string): FieldResolution {
        const alias=this.registry.byAlias.get(reference); if(alias)return{reference,key:alias.key,alias:alias.alias,status:"resolved"};
        const direct=this.registry.byKey.get(reference); if(direct)return{reference,key:direct.key,alias:direct.alias,status:"resolved"};
        const legacy=this.legacy.get(reference); if(legacy){const item=this.registry.byKey.get(legacy);return{reference,key:legacy,alias:item?.alias,status:"resolved"};}
        const matches=this.registry.entries.filter(item=>[item.queryName,item.qualifiedName,item.displayName].includes(reference));
        if(matches.length===1)return{reference,key:matches[0].key,alias:matches[0].alias,status:"resolved"};
        if(matches.length>1)return{reference,status:"ambiguous",candidates:matches.map(item=>item.alias).sort()};
        return{reference,status:"unknown"};
    }
}

export function resolveFieldReference(reference:string,data:NormalizedData,overrides:Record<string,string>={}):FieldResolution{return new FieldResolver(data,overrides).resolve(reference);}
