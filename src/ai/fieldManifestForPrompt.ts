import { NormalizedData } from "../data/normalizeData";
import { createFieldAliasRegistry } from "../fields/fieldAliasRegistry";
import { FieldPrivacyMode } from "../fields/fieldSemanticProfile";

export function fieldManifestForPrompt(data: NormalizedData, selected: string[] = [], privacyMode: FieldPrivacyMode = "fields", overrides: Record<string,string> = {}): unknown[] {
    const include = selected.length ? new Set(selected) : undefined;
    return createFieldAliasRegistry(data,overrides,privacyMode).entries.filter(entry=>!include||include.has(entry.key)||include.has(entry.alias));
}
