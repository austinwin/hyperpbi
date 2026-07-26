// ── HyperPBI documentation generator ─────────────────────────────────
// Executes canonical TypeScript metadata without building the visual.
// Generated files must never be edited by hand.

import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();
const checkMode = process.argv.includes("--check");
const projectWebsite = "https://hyperpbi.com";
const projectSource = "https://github.com/austinwin/hyperpbi";

function resolveTypeScriptModule(parent, request) {
    const base = resolve(dirname(parent), request);
    const candidates = extname(base) ? [base] : [`${base}.ts`, join(base, "index.ts")];
    for (const candidate of candidates) {
        try { readFileSync(candidate); return candidate; } catch { /* try next */ }
    }
    throw new Error(`Cannot resolve ${request} from ${parent}`);
}

function loadTypeScriptModule(file) {
    const absolute = resolve(root, file);
    if (moduleCache.has(absolute)) return moduleCache.get(absolute).exports;
    const module = { exports: {} };
    moduleCache.set(absolute, module);
    const output = ts.transpileModule(readFileSync(absolute, "utf8"), {
        fileName: absolute,
        compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            moduleResolution: ts.ModuleResolutionKind.Node10,
            esModuleInterop: true,
        },
    }).outputText;
    const localRequire = request => request.startsWith(".")
        ? loadTypeScriptModule(resolveTypeScriptModule(absolute, request))
        : nodeRequire(request);
    new Function("require", "module", "exports", "__filename", "__dirname", output)(
        localRequire, module, module.exports, absolute, dirname(absolute),
    );
    return module.exports;
}

const descriptorsModule = loadTypeScriptModule("src/catalog/componentDescriptors.ts");
const examplesModule = loadTypeScriptModule("src/catalog/componentJsonExamples.ts");
const patternsModule = loadTypeScriptModule("src/schema/patternRegistry.ts");
const validationModule = loadTypeScriptModule("src/schema/validateV2Schema.ts");
const helpModule = loadTypeScriptModule("src/docs/hyperpbiHelp.ts");

const descriptors = descriptorsModule.componentDescriptors;
const definitions = descriptors.map(item => ({...item,level:item.complexity}));
const docs = Object.fromEntries(descriptors.map(item => [item.type,{status:item.maturity,keyProperties:item.schema.allowed.filter(property=>!["type","id"].includes(property)),accessibility:item.documentation.accessibility?.join(" "),related:item.documentation.relatedTypes,supportsUiAction:item.schema.allowed.includes("uiAction"),supportsDataInteraction:item.capabilities.interactions}]));
const examples = Object.fromEntries(descriptors.map(item => [item.type,item.example]));
const patterns = patternsModule.patternRegistry;
const commonProperties = validationModule.v2CommonComponentProperties;
const propertiesByType = validationModule.v2ComponentPropertiesByType;
const requiredByType = validationModule.v2RequiredPropertiesByType;
const categories = [...new Set(definitions.map(item => item.category))];

function assertCanonicalCoverage() {
    const types = new Set(definitions.map(item => item.type));
    const duplicates = definitions.filter((item, index) => definitions.findIndex(candidate => candidate.type === item.type) !== index).map(item => item.type);
    const missingDocs = [...types].filter(type => !docs[type]);
    const missingExamples = [...types].filter(type => !examples[type]);
    const unknownDocs = Object.keys(docs).filter(type => !types.has(type));
    const unknownExamples = Object.keys(examples).filter(type => !types.has(type));
    const unknownValidators = Object.keys(propertiesByType).filter(type => !types.has(type));
    const missingValidators = [...types].filter(type => !Object.hasOwn(propertiesByType, type));
    const issues = { duplicates, missingDocs, missingExamples, unknownDocs, unknownExamples, unknownValidators, missingValidators };
    const failures = Object.entries(issues).filter(([, values]) => values.length);
    if (failures.length) throw new Error(`Canonical documentation metadata is inconsistent:\n${failures.map(([name, values]) => `- ${name}: ${values.join(", ")}`).join("\n")}`);
}

const mdEscape = value => String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
const codeList = values => values?.length ? values.map(value => `\`${value}\``).join(", ") : "—";
const yesNo = value => value ? "Yes" : "No";
const json = value => JSON.stringify(value, null, 2);
const allowedFor = type => [...new Set([...commonProperties, ...(propertiesByType[type] ?? [])])].sort();
const requiredFor = type => [...new Set(["type", "id", ...(requiredByType[type] ?? [])])];

function markdownCatalog() {
    const lines = [
        "<!-- GENERATED FILE. Edit canonical metadata and run npm run docs:generate. -->",
        "# HyperPBI component catalog reference",
        "",
        `**Project:** [hyperpbi.com](${projectWebsite}) · **Source:** [austinwin/hyperpbi](${projectSource})`,
        "",
        `HyperPBI currently defines **${definitions.length} component types across ${categories.length} categories**. This file is generated from the canonical explicit \`componentDescriptors.ts\` registry and \`patternRegistry.ts\`; strict schema 2.0 validator maps are derived from those descriptors.`,
        "",
        "For the complete authoring model, see the [specification reference](hyperpbi-spec-reference.md), [data model](data-model.md), [interactions](interactions.md), and [SVG reference](svg-visuals.md).",
        "",
        "## HyperPBI 2.0 shared contract",
        "",
        "Every 2.0 component requires `type` and a globally unique stable `id` matching `^[A-Za-z][A-Za-z0-9_-]{0,99}$`. `dataset` selects a named logical dataset; omission selects `powerbi`. Field references use Field Manifest aliases during authoring and are resolved to canonical runtime keys during preparation.",
        "",
        "Allowed shared properties:",
        "",
        codeList(commonProperties),
        "",
        "The three behavior systems are independent: `uiAction` changes interface state; `interaction` controls universal internal/Power BI data behavior; `interactions` maps safe component-specific events to allowlisted payloads. None is mandatory on every component.",
        "",
        "External filtering requires a field whose metadata identifies a real model column (`sourceTable` and `sourceColumn`). True measures, dataset-derived fields, and dataset metrics cannot directly filter the Power BI model. Exact identity selection can still use source-row lineage when available.",
        "",
        "## Maturity governance",
        "",
        "Maturity is explicit per canonical descriptor and independent of authoring complexity. Stable means the descriptor records renderer, strict schema, applicable field traversal, Inspector controls, valid example, responsive and empty-state behavior, accessibility guidance, focused tests, and documentation evidence. Beta is implemented but misses one or more stable requirements. Experimental is intentionally unstable and advanced. AI includes beta only for explicit/advanced authoring and experimental only when explicitly requested.",
        "",
        "## Application patterns",
        "",
        "Patterns are 2.0 authoring constructs expanded before strict component validation. Generated child IDs are deterministic derivatives of the pattern ID.",
        "",
    ];
    for (const pattern of Object.values(patterns)) {
        lines.push(`### ${pattern.id}`, "", `Required: ${codeList(pattern.required)}`, "", `Optional: ${codeList(pattern.optional)}`, "", `Field properties: ${codeList(pattern.fieldProperties)}`, "", "```json", json(pattern.example), "```", "");
    }
    lines.push(
        "## Universal interaction reference", "", "```json", json(examplesModule.universalInteractionReference), "```", "",
        "`externalMode: \"auto\"` resolves to `filter` for controls and `selection` for data-point/custom components. See [interactions](interactions.md) for lineage and field-origin restrictions.", "",
        "## UI actions", "",
        "`clearFilters`, `setTab`, `setState`, `toggleState`, `toggleSidebar`, `openOverlay`, `closeOverlay`, `toggleOverlay`, `setStep`, `nextStep`, `previousStep`, `showToast`, `dismissToast`, `scrollTo`, and `refresh` (a safe no-op because Power BI owns refresh).", "",
    );
    for (const category of categories) {
        const items = definitions.filter(item => item.category === category);
        lines.push(`## ${category}`, "", `_${items.length} components_`, "");
        for (const item of items) {
            const meta = docs[item.type];
            lines.push(
                `### \`${item.type}\` — ${item.label}`, "",
                `**Status:** ${meta.status}${meta.statusNote ? ` — ${meta.statusNote}` : ""}`,
                "",
                `**Level:** ${item.level}`,
                "",
                `**Recommended use:** ${item.useWhen}`,
                "",
                `**Required properties:** ${codeList(requiredFor(item.type))}`,
                "",
                `**Key properties:** ${codeList(meta.keyProperties)}`,
                "",
                `**All allowed properties:** ${codeList(allowedFor(item.type))}`,
                "",
                `**Capabilities:** fields ${yesNo(item.capabilities.fields)}; calculations ${yesNo(item.capabilities.calculations)}; scoped CSS ${yesNo(item.capabilities.css)}; slots ${yesNo(item.capabilities.slots)}; interactions ${yesNo(item.capabilities.interactions)}; identity selection ${yesNo(item.capabilities.externalSelection)}; custom HTML ${yesNo(item.capabilities.customHtml)}.`,
                "",
                `**Data interaction:** ${yesNo(meta.supportsDataInteraction)}. **UI action:** ${yesNo(meta.supportsUiAction)}.`, "",
            );
            if (meta.doNotUseWhen) lines.push(`**Do not use when:** ${meta.doNotUseWhen}`, "");
            if (meta.accessibility) lines.push(`**Accessibility:** ${meta.accessibility}`, "");
            if (meta.related?.length) lines.push(`**Related:** ${codeList(meta.related)}`, "");
            lines.push("```json", json(examples[item.type]), "```", "");
        }
    }
    lines.push(
        "## Schema version boundary", "",
        "Dashboard schema 2.0 is the only active authoring and rendering contract. Schema 1.0 and missing versions are rejected by the production runtime. Developers may explicitly convert a legacy file with `npm run schema:migrate-v1 -- input.json output.json`; the temporary converter is outside the PBIVIZ bundle and runtime migration is intentionally unsupported. PBIVIZ package and Runtime Config versions are independent version numbers.", "",
    );
    return `${lines.join("\n").trimEnd()}\n`;
}

async function writeOrCheck(path, content) {
    if (!checkMode) {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content);
        console.log(`Generated: ${path}`);
        return true;
    }
    const existing = await readFile(path, "utf8").catch(() => "");
    if (existing === content) return true;
    console.error(`Out of date: ${path}`);
    return false;
}

function replaceMarker(source, marker, content) {
    const start = `<!-- ${marker}:start -->`;
    const end = `<!-- ${marker}:end -->`;
    const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
    if (!pattern.test(source)) throw new Error(`Missing generated inventory marker: ${marker}`);
    return source.replace(pattern, `${start}${content}${end}`);
}

async function synchronizedInventoryFiles() {
    const readmePath = join(root, "README.md");
    let readme = await readFile(readmePath, "utf8");
    readme = replaceMarker(readme, "component-summary", `\n- The canonical implementation defines **${definitions.length} component types in ${categories.length} categories**. The count and catalog are generated from source metadata; see the [component catalog](docs/hyperpbi-component-catalog-reference.md).\n`);
    return [{ path: readmePath, content: readme }];
}

async function main() {
    assertCanonicalCoverage();
    const generatedSkill = `<!-- GENERATED FILE. Edit HYPERPBI_SKILL_MARKDOWN in src/docs/hyperpbiHelp.ts and run npm run docs:generate. -->\n${helpModule.HYPERPBI_SKILL_MARKDOWN.trim()}\n`;
    const inventories = await synchronizedInventoryFiles();
    const webCatalog = {
        generated: true,
        version: 1,
        componentCount: descriptors.length,
        categories,
        patterns: Object.values(patterns).map(pattern => ({
            id: pattern.id,
            required: pattern.required,
            optional: pattern.optional,
            example: pattern.example,
        })),
        components: descriptors.map(item => ({
            type: item.type,
            label: item.label,
            category: item.category,
            maturity: item.maturity,
            complexity: item.complexity,
            useWhen: item.useWhen,
            summary: item.documentation.summary,
            accessibility: item.documentation.accessibility ?? [],
            relatedTypes: item.documentation.relatedTypes ?? [],
            capabilities: item.capabilities,
            interaction: item.interaction,
            required: requiredFor(item.type),
            allowed: allowedFor(item.type),
            example: item.example,
        })),
    };
    const results = await Promise.all([
        writeOrCheck(join(root, "docs/hyperpbi-component-catalog-reference.md"), markdownCatalog()),
        writeOrCheck(join(root, "apps/web/generated/component-catalog.json"), `${JSON.stringify(webCatalog, null, 2)}\n`),
        writeOrCheck(join(root, "docs/hyperpbi-ai-skill.md"), generatedSkill),
        ...inventories.map(item => writeOrCheck(item.path, item.content)),
    ]);
    if (checkMode && results.some(result => !result)) process.exitCode = 1;
    else if (checkMode) console.log("Generated documentation is up to date.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
