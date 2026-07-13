// ── HyperPBI documentation generator ─────────────────────────────────
// Executes canonical TypeScript metadata without building the visual.
// Generated files must never be edited by hand.

import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();
const checkMode = process.argv.includes("--check");

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
const docs = Object.fromEntries(descriptors.map(item => [item.type,{status:item.maturity,keyProperties:item.schema.allowed.filter(property=>!["type","id"].includes(property)),accessibility:item.documentation.accessibility?.join(" "),compatibility:item.documentation.compatibility?.join(" "),related:item.documentation.relatedTypes,supportsUiAction:item.schema.allowed.includes("uiAction"),supportsDataInteraction:item.capabilities.interactions}]));
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
const htmlEscape = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
const json = value => JSON.stringify(value, null, 2);
const allowedFor = type => [...new Set([...commonProperties, ...(propertiesByType[type] ?? [])])].sort();
const requiredFor = type => [...new Set(["type", "id", ...(requiredByType[type] ?? [])])];

function markdownCatalog() {
    const lines = [
        "<!-- GENERATED FILE. Edit canonical metadata and run npm run docs:generate. -->",
        "# HyperPBI component catalog reference",
        "",
        `HyperPBI currently defines **${definitions.length} component types across ${categories.length} categories**. This file is generated from the canonical explicit \`componentDescriptors.ts\` registry and \`patternRegistry.ts\`; compatibility catalogs and strict 2.0 validator maps are derived from those descriptors.`,
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
            if (meta.compatibility) lines.push(`**Compatibility:** ${meta.compatibility}`, "");
            if (meta.related?.length) lines.push(`**Related:** ${codeList(meta.related)}`, "");
            lines.push("```json", json(examples[item.type]), "```", "");
        }
    }
    lines.push(
        "## Compatibility notes", "",
        "HyperPBI 1.0 specifications remain supported. Compatibility-only metadata above identifies types or forms retained for existing dashboards. Legacy accordion children, drawers/filter drawers, steppers, button `action`/`actionValue`, `table.engine: \"tabulator\"`, and legacy map settings are normalized without changing the 2.0 authoring default. Deprecated `internal`, `external`, `selectable`, and table `selectionMode` remain 1.0 compatibility inputs; new 2.0 specifications use `interaction`.", "",
    );
    return `${lines.join("\n").trimEnd()}\n`;
}

function componentCard(item) {
    const meta = docs[item.type];
    const search = [item.type, item.label, item.category, item.useWhen, meta.status, meta.statusNote, meta.doNotUseWhen, meta.compatibility, ...(meta.related ?? [])].filter(Boolean).join(" ").toLowerCase();
    return `<article class="component-card" data-category="${htmlEscape(item.category)}" data-search="${htmlEscape(search)}">
<details><summary><span><code>${htmlEscape(item.type)}</code> — ${htmlEscape(item.label)}</span><span class="badge badge-${htmlEscape(meta.status)}">${htmlEscape(meta.status)}</span></summary>
<div class="card-body">
<p>${htmlEscape(item.useWhen)}</p>
${meta.statusNote ? `<p><strong>Status note:</strong> ${htmlEscape(meta.statusNote)}</p>` : ""}
<dl><div><dt>Level</dt><dd>${htmlEscape(item.level)}</dd></div><div><dt>Required</dt><dd>${requiredFor(item.type).map(value => `<code>${htmlEscape(value)}</code>`).join(", ")}</dd></div><div><dt>Key properties</dt><dd>${meta.keyProperties.length ? meta.keyProperties.map(value => `<code>${htmlEscape(value)}</code>`).join(", ") : "—"}</dd></div><div><dt>Data interaction</dt><dd>${yesNo(meta.supportsDataInteraction)}</dd></div><div><dt>UI action</dt><dd>${yesNo(meta.supportsUiAction)}</dd></div></dl>
<p><strong>Allowed:</strong> ${allowedFor(item.type).map(value => `<code>${htmlEscape(value)}</code>`).join(", ")}</p>
${meta.doNotUseWhen ? `<p><strong>Do not use when:</strong> ${htmlEscape(meta.doNotUseWhen)}</p>` : ""}
${meta.accessibility ? `<p><strong>Accessibility:</strong> ${htmlEscape(meta.accessibility)}</p>` : ""}
${meta.compatibility ? `<p><strong>Compatibility:</strong> ${htmlEscape(meta.compatibility)}</p>` : ""}
${meta.related?.length ? `<p><strong>Related:</strong> ${meta.related.map(value => `<code>${htmlEscape(value)}</code>`).join(", ")}</p>` : ""}
<div class="code-head"><strong>Valid 2.0 component example</strong><button type="button" class="copy">Copy</button></div><pre><code>${htmlEscape(json(examples[item.type]))}</code></pre>
</div></details></article>`;
}

function htmlCatalog() {
    const cards = definitions.map(componentCard).join("\n");
    const patternCards = Object.values(patterns).map(pattern => `<article class="pattern-card"><h3>${htmlEscape(pattern.id)}</h3><p><strong>Required:</strong> ${pattern.required.map(value => `<code>${htmlEscape(value)}</code>`).join(", ")}</p><pre><code>${htmlEscape(json(pattern.example))}</code></pre></article>`).join("\n");
    return `<!doctype html>
<!-- GENERATED FILE. Edit canonical metadata and run npm run docs:generate. -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Generated HyperPBI 2.0 component catalog"><title>HyperPBI component catalog</title>
<style>
:root{color-scheme:light dark;--bg:#f4f7fb;--panel:#fff;--text:#182433;--muted:#5f6b7a;--line:#d8e0ea;--brand:#206bc4;--soft:#edf4fc;--radius:12px;font:15px/1.55 Inter,"Segoe UI",system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text)}a{color:var(--brand)}header{background:#142033;color:#fff;padding:2rem max(1rem,calc((100% - 1180px)/2));}header h1{margin:0 0 .4rem;font-size:clamp(1.6rem,4vw,2.5rem)}header p{max-width:760px;margin:.35rem 0;color:#d5dfec}.toolbar{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:1fr minmax(180px,280px) auto;gap:.75rem;padding:.8rem max(1rem,calc((100% - 1180px)/2));background:color-mix(in srgb,var(--panel) 94%,transparent);border-bottom:1px solid var(--line);backdrop-filter:blur(8px)}input,select{width:100%;padding:.7rem .8rem;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font:inherit}.count{align-self:center;color:var(--muted);white-space:nowrap}main{max-width:1180px;margin:auto;padding:1rem}section{scroll-margin-top:5rem}h2{margin:2rem 0 .7rem}.intro,.reference,.pattern-card,.component-card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius)}.intro,.reference{padding:1rem 1.2rem}.pattern-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.8rem}.pattern-card{padding:.9rem}.pattern-card h3{margin-top:0}.component-card{margin:.65rem 0;overflow:hidden}.component-card[hidden]{display:none}summary{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:.9rem 1rem;cursor:pointer;background:var(--soft);font-weight:650}.card-body{padding:1rem}.badge{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;padding:.18rem .5rem;border-radius:999px;background:#dfe7f0}.badge-stable{background:#dff3e8;color:#146c43}.badge-compatibility{background:#fff0cf;color:#835a00}.badge-experimental,.badge-foundation{background:#dcecff;color:#174f8a}.badge-deprecated{background:#fde1e1;color:#9d2929}dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.7rem}dl div{border-left:3px solid var(--line);padding-left:.7rem}dt{font-weight:700}dd{margin:0;color:var(--muted)}code{font-family:"Cascadia Code",Consolas,monospace;font-size:.9em}pre{max-height:28rem;overflow:auto;background:#111927;color:#e8eef7;border-radius:8px;padding:1rem}.code-head{display:flex;justify-content:space-between;align-items:center;margin-top:1rem}.copy{border:1px solid var(--line);border-radius:7px;background:var(--panel);color:var(--text);padding:.4rem .7rem;cursor:pointer}.empty{padding:2rem;text-align:center;color:var(--muted)}footer{max-width:1180px;margin:2rem auto;padding:1rem;color:var(--muted)}@media(max-width:700px){.toolbar{grid-template-columns:1fr}.count{justify-self:start}summary{align-items:flex-start}.card-body{padding:.8rem}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
@media(prefers-color-scheme:dark){:root{--bg:#0e1622;--panel:#152131;--text:#e6edf5;--muted:#aeb9c8;--line:#304156;--soft:#1b2b40;--brand:#73b7ff}.badge-stable{color:#9ae6bd}.badge-compatibility{color:#ffd77d}.badge-deprecated{color:#ffaaaa}}
</style></head><body>
<header><h1>HyperPBI component catalog</h1><p>${definitions.length} canonical component types across ${categories.length} categories. Generated directly from implementation metadata for the strict HyperPBI 2.0 authoring contract.</p><p><a href="index.html">Product overview</a> · <a href="docs/hyperpbi-spec-reference.md">Specification</a> · <a href="docs/data-model.md">Data model</a> · <a href="docs/svg-visuals.md">SVG</a></p></header>
<div class="toolbar"><input id="search" type="search" placeholder="Search type, label, use, or status" aria-label="Search component catalog"><select id="category" aria-label="Filter by category"><option value="">All categories</option>${categories.map(category => `<option>${htmlEscape(category)}</option>`).join("")}</select><span class="count" id="count" aria-live="polite">${definitions.length} components</span></div>
<main><section class="intro"><h2>HyperPBI 2.0 contract</h2><p>Every component requires a globally unique stable <code>id</code>. Field Manifest aliases are resolved during preparation. Omit <code>dataset</code> to use <code>powerbi</code>, or select a named logical dataset.</p><p><code>uiAction</code>, universal <code>interaction</code>, and safe event-specific <code>interactions</code> are separate and optional. External filters require a true model-column target; identity selection can follow source-row lineage.</p></section>
<section><h2>Application patterns</h2><div class="pattern-grid">${patternCards}</div></section>
<section class="reference"><h2>Shared references</h2><p><strong>Shared properties:</strong> ${commonProperties.map(value => `<code>${htmlEscape(value)}</code>`).join(", ")}</p><p><strong>UI actions:</strong> clearFilters, setTab, setState, toggleState, toggleSidebar, openOverlay, closeOverlay, toggleOverlay, setStep, nextStep, previousStep, showToast, dismissToast, scrollTo, refresh.</p></section>
<section><h2>Components</h2><div id="cards">${cards}</div><p id="empty" class="empty" hidden>No components match the current filters.</p></section></main>
<footer>Generated from canonical TypeScript metadata. Do not edit this file manually. HyperPBI 1.0 remains supported as compatibility input; 2.0 is the default for new authoring.</footer>
<script>
const search=document.querySelector('#search'),category=document.querySelector('#category'),cards=[...document.querySelectorAll('.component-card')],count=document.querySelector('#count'),empty=document.querySelector('#empty');function filter(){const q=search.value.trim().toLowerCase(),cat=category.value;let visible=0;for(const card of cards){const show=(!q||card.dataset.search.includes(q))&&(!cat||card.dataset.category===cat);card.hidden=!show;if(show)visible++}count.textContent=visible+' component'+(visible===1?'':'s');empty.hidden=visible!==0}search.addEventListener('input',filter);category.addEventListener('change',filter);document.addEventListener('click',event=>{const button=event.target.closest('.copy');if(!button)return;const code=button.parentElement.nextElementSibling.textContent;navigator.clipboard?.writeText(code).then(()=>{button.textContent='Copied';setTimeout(()=>button.textContent='Copy',1200)})});
</script></body></html>\n`;
}

async function writeOrCheck(path, content) {
    if (!checkMode) { await writeFile(path, content); console.log(`Generated: ${path}`); return true; }
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
    const indexPath = join(root, "index.html");
    let readme = await readFile(readmePath, "utf8");
    let index = await readFile(indexPath, "utf8");
    readme = replaceMarker(readme, "component-summary", `\n+- The canonical implementation defines **${definitions.length} component types in ${categories.length} categories**. The count and catalog are generated from source metadata; see the [component catalog](docs/hyperpbi-component-catalog-reference.md).\n+`);
    index = replaceMarker(index, "hero-component-count", `<a class="btn btn-secondary" href="hyperpbi-component-catalog-reference.html">Browse ${definitions.length} components</a>`);
    index = replaceMarker(index, "inventory-stats", `<div class="stat"><b>${definitions.length}</b><span>canonical component types</span></div>\n+    <div class="stat"><b>${categories.length}</b><span>implementation categories</span></div>`);
    index = replaceMarker(index, "catalog-heading", `<h2>${definitions.length} component types across ${categories.length} generated categories.</h2>`);
    return [{ path: readmePath, content: readme }, { path: indexPath, content: index }];
}

async function main() {
    assertCanonicalCoverage();
    const generatedSkill = `<!-- GENERATED FILE. Edit HYPERPBI_SKILL_MARKDOWN in src/docs/hyperpbiHelp.ts and run npm run docs:generate. -->\n${helpModule.HYPERPBI_SKILL_MARKDOWN.trim()}\n`;
    const inventories = await synchronizedInventoryFiles();
    const results = await Promise.all([
        writeOrCheck(join(root, "docs/hyperpbi-component-catalog-reference.md"), markdownCatalog()),
        writeOrCheck(join(root, "hyperpbi-component-catalog-reference.html"), htmlCatalog()),
        writeOrCheck(join(root, "docs/hyperpbi-ai-skill.md"), generatedSkill),
        ...inventories.map(item => writeOrCheck(item.path, item.content)),
    ]);
    if (checkMode && results.some(result => !result)) process.exitCode = 1;
    else if (checkMode) console.log("Generated documentation is up to date.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
