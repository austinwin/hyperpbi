// ── Documentation Generator ───────────────────────────────────────────
// Generates Markdown and HTML component catalogs from canonical sources.
// Run: node scripts/generate-documentation.mjs [--check]

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const checkMode = process.argv.includes("--check");

// Read component definitions (must be a JSON-like structure we can parse)
// Since this is TypeScript, we use a simple extraction approach
// In practice, generate from the compiled catalog data

async function main() {
    // Read the component catalog and examples via dynamic import of compiled JS
    // For now, we'll use the source of truth from componentCatalog.ts
    // by reading the generated output

    const catalogContent = await readFile(join(root, "src/catalog/componentCatalog.ts"), "utf8");
    const examplesContent = await readFile(join(root, "src/catalog/componentJsonExamples.ts"), "utf8");
    const defsContent = await readFile(join(root, "src/catalog/componentDefinitions.ts"), "utf8");
    const docsContent = await readFile(join(root, "src/catalog/componentDocumentation.ts"), "utf8");

    // Extract component types from definitions
    const types = extractComponentTypes(defsContent);
    const categories = extractCategories(defsContent);

    // Build the catalog
    const mdCatalog = generateMarkdownCatalog(types, categories);
    const htmlCatalog = generateHtmlCatalog(types, categories);

    // Write outputs
    const mdPath = join(root, "docs/hyperpbi-component-catalog-reference.md");
    const htmlPath = join(root, "hyperpbi-component-catalog-reference.html");

    if (checkMode) {
        const existingMd = await readFile(mdPath, "utf8").catch(() => "");
        const existingHtml = await readFile(htmlPath, "utf8").catch(() => "");

        if (existingMd !== mdCatalog || existingHtml !== htmlCatalog) {
            console.error("ERROR: Generated documentation differs from committed files.");
            console.error("Run: npm run docs:generate");
            if (existingMd !== mdCatalog) console.error(`  ${mdPath} is out of date`);
            if (existingHtml !== htmlCatalog) console.error(`  ${htmlPath} is out of date`);
            process.exit(1);
        }
        console.log("Documentation is up to date.");
    } else {
        await writeFile(mdPath, mdCatalog);
        await writeFile(htmlPath, htmlCatalog);
        console.log(`Generated: ${mdPath}`);
        console.log(`Generated: ${htmlPath}`);
    }
}

function extractComponentTypes(defsContent) {
    // Extract type names from componentDefinitions array
    const matches = [...defsContent.matchAll(/def\("(\w+)"/g)];
    return [...new Set(matches.map(m => m[1]))];
}

function extractCategories(defsContent) {
    // Extract categories
    const catMatches = [...defsContent.matchAll(/"(\w+)"/g)].map(m => m[1]);
    const knownCategories = ["Layout", "Controls", "Navigation", "Display", "Primitives", "Feedback", "Forms", "Charts", "Tables", "Maps", "Custom components", "Advanced components"];
    return knownCategories.filter(c => catMatches.some(m => m === c));
}

function generateMarkdownCatalog(types, categories) {
    const lines = [];
    lines.push("# HyperPBI component catalog reference");
    lines.push("");
    lines.push("> Generated from canonical component definitions. Do not edit manually.");
    lines.push(`> Component count: ${types.length}`);
    lines.push("");

    lines.push("## Universal interaction");
    lines.push("");
    lines.push("Every component supports the universal interaction object:");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify({
        enabled: true,
        trigger: "auto",
        internalMode: "highlight",
        internalScope: "self",
        externalMode: "auto",
        field: "__field_key__",
        operator: "=",
        value: "__value__",
        selectionMode: "replace",
        multiSelect: true,
        showSelector: false,
        clearOnSecondClick: true
    }, null, 2));
    lines.push("```");
    lines.push("");

    lines.push("## UI action reference");
    lines.push("");
    lines.push("UI actions control interface behavior (navigation, overlays, toasts). They are separate from data interactions.");
    lines.push("");
    lines.push("| Action | Required Fields | Description |");
    lines.push("|--------|----------------|-------------|");
    lines.push("| `clearFilters` | — | Clears all HyperPBI filters |");
    lines.push("| `setTab` | target, value | Sets the active tab in a tab container |");
    lines.push("| `setState` | target, value | Sets a named state value |");
    lines.push("| `toggleState` | target | Toggles a Boolean state |");
    lines.push("| `toggleSidebar` | — | Toggles the root sidebar collapsed state |");
    lines.push("| `openOverlay` | target | Opens a modal, offcanvas, dropdown, popover, or legacy drawer |");
    lines.push("| `closeOverlay` | target | Closes an overlay |");
    lines.push("| `toggleOverlay` | target | Toggles an overlay |");
    lines.push("| `setStep` | target, value | Sets the active step |");
    lines.push("| `nextStep` | target | Advances to the next step |");
    lines.push("| `previousStep` | target | Goes to the previous step |");
    lines.push("| `showToast` | message, title?, intent?, durationMs? | Shows a toast notification |");
    lines.push("| `dismissToast` | target | Dismisses a specific toast |");
    lines.push("| `scrollTo` | target | Scrolls to a component by ID |");
    lines.push("| `refresh` | — | Safe no-op (Power BI owns data refresh) |");
    lines.push("");

    lines.push("## Application shell");
    lines.push("");
    lines.push("The application shell is configured at the root level through `schema.app`, not as a component.");
    lines.push("See the [specification reference](hyperpbi-spec-reference.md) for complete property documentation.");
    lines.push("");

    lines.push("## Shared component properties");
    lines.push("");
    lines.push("All components share these base properties:");
    lines.push("");
    lines.push("| Property | Type | Description |");
    lines.push("|----------|------|-------------|");
    lines.push("| `type` | string | Component type identifier (required) |");
    lines.push("| `id` | string | Unique stable identifier |");
    lines.push("| `title` | string | Display title |");
    lines.push("| `subtitle` | string | Secondary display text |");
    lines.push("| `span` | 1–12 | 12-column grid span |");
    lines.push("| `className` | string | Additional CSS class |");
    lines.push("| `hidden` | boolean | Hide the component |");
    lines.push("| `style` | object | Inline CSS properties (sanitized) |");
    lines.push("| `css` | string | Scoped CSS (allowlisted, scoped) |");
    lines.push("| `slots` | object | Named HTML slot overrides |");
    lines.push("| `interaction` | object | Universal data interaction policy |");
    lines.push("| `interactions` | object | Safe custom event-to-data payloads |");
    lines.push("| `ariaLabel` | string | Accessible label |");
    lines.push("| `icon` | string | Icon name from bundled registry |");
    lines.push("| `variant` | string | UI variant (primary, secondary, success, warning, danger, ghost, outline) |");
    lines.push("| `size` | string | UI size (xs, sm, md, lg) |");
    lines.push("| `disabled` | boolean | Disabled state |");
    lines.push("| `tooltip` | object | Tooltip definition (content, placement, delayMs) |");
    lines.push("| `uiAction` | object/array | Declarative UI action(s) |");
    lines.push("");

    lines.push("Three independent behavior systems:");
    lines.push("");
    lines.push("- **`interactions`** — Safe custom event-to-data payload resolver");
    lines.push("- **`interaction`** — Universal local/Power BI data policy");
    lines.push("- **`uiAction`** — Interface/navigation/overlay/state behavior");
    lines.push("");

    // Component categories
    for (const category of categories) {
        const categoryTypes = types.filter(t => {
            // Map type to category based on the definitions
            const layoutTypes = ["grid", "flex", "split", "section", "toolbar", "leftPanel", "rightPanel", "spacer", "divider"];
            const controlTypes = ["searchBox", "textInput", "numberInput", "slider", "select", "multiSelect", "segmentedControl", "toggle", "button", "buttonGroup", "filterChips", "dateRange"];
            const navTypes = ["tabs", "collapsible", "accordion", "drawer", "filterDrawer", "steps", "stepper"];
            const displayTypes = ["kpi", "metricGrid", "infoCard", "statusBadge", "progressBar", "alert", "statList", "detailPanel", "timeline"];
            const primitiveTypes = ["card", "icon", "iconButton", "avatar", "avatarGroup", "listGroup", "dataGrid", "countUp", "tracking", "dropdown", "modal", "offcanvas", "popover"];
            const feedbackTypes = ["emptyState", "placeholder", "spinner"];
            const formTypes = ["textarea", "checkbox", "checkboxGroup", "radioGroup", "inputGroup"];
            const chartTypes = ["barChart", "horizontalBarChart", "lineChart", "areaChart", "pieChart", "donutChart", "scatterChart", "gauge", "heatmap", "comboChart", "waterfallChart", "sankeyChart", "treemapChart", "funnelChart", "radarChart", "smallMultiples"];
            const tableTypes = ["table", "matrix"];
            const mapTypes = ["map"];
            const contentTypes = ["text", "markdown", "html", "custom"];
            const advancedTypes = ["advancedChart"];

            const map = { Layout: layoutTypes, Controls: controlTypes, Navigation: navTypes, Display: displayTypes, Primitives: primitiveTypes, Feedback: feedbackTypes, Forms: formTypes, Charts: chartTypes, Tables: tableTypes, Maps: mapTypes, "Custom components": contentTypes, "Advanced components": advancedTypes };
            return (map[category] || []).includes(t);
        });

        if (categoryTypes.length === 0) continue;

        lines.push(`## ${category}`);
        lines.push("");

        for (const type of categoryTypes) {
            lines.push(`### ${type}`);
            lines.push("");
            lines.push(`<!-- component:${type} -->`);
            lines.push("");
            if (type === "map") {
                lines.push("Practical runtime support includes Power BI geometry, public ArcGIS feature layers and joins, viewport queries, tile and basic dynamic overlays, labels, tooltips/popups, selection, layer controls, legend, Home, and Zoom to Selection. External ArcGIS requests require a Maps package whose WebAccess hosts match the service.");
                lines.push("");
            }
        }
    }

    lines.push("## Compatibility");
    lines.push("");
    lines.push("Legacy properties and types remain supported for existing dashboards:");
    lines.push("");
    lines.push("- `accordion` with only `children` (no `items`) — wrapped into one item automatically");
    lines.push("- `stepper` — rendered as a collapsible section. Use `steps` for new workflows.");
    lines.push("- `drawer` / `filterDrawer` — supported. Use `offcanvas` for new components.");
    lines.push("- `button.action` / `button.actionValue` — normalized to `uiAction` internally.");
    lines.push("- `table.engine: \"tabulator\"` — normalized to native with a nonblocking warning.");
    lines.push("- `map.settings` / `map.style` / `map.popup` — legacy map properties normalized to `layers[]`.");
    lines.push("- Deprecated properties: `internal`, `external`, `selectable`, `selectionMode`.");
    lines.push("");

    return lines.join("\n");
}

function generateHtmlCatalog(types, categories) {
    // Generate a standalone HTML catalog page
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HyperPBI Component Catalog Reference</title>
<style>
:root{--bg:#fff;--text:#182433;--border:#dce1e7;--primary:#206bc4;--surface:#f6f8fa;font-family:Inter,"Segoe UI",system-ui,sans-serif;font-size:14px;color:var(--text);background:var(--bg);line-height:1.5}
body{margin:0;padding:0}
.catalog-header{position:sticky;top:0;z-index:100;background:var(--bg);border-bottom:1px solid var(--border);padding:12px 20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.catalog-header h1{margin:0;font-size:18px;font-weight:700}
.catalog-header input,.catalog-header select{padding:6px 10px;border:1px solid var(--border);border-radius:5px;font:inherit;font-size:12px}
.catalog-count{font-size:11px;color:#667382;margin-left:auto}
.catalog-body{padding:20px;max-width:960px;margin:0 auto}
.catalog-body h2{font-size:16px;margin:32px 0 12px;padding-bottom:4px;border-bottom:1px solid var(--border)}
.component-card{border:1px solid var(--border);border-radius:8px;margin:12px 0;overflow:hidden}
.component-card-header{padding:10px 14px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;cursor:pointer}
.component-card-header:hover{background:#edf1f5}
.component-card-header strong{font-size:13px}
.component-card-badge{font-size:9px;padding:2px 6px;border-radius:10px;font-weight:700;text-transform:uppercase}
.badge-stable{background:#e6f7ee;color:#18794e}
.badge-compatibility{background:#fff3db;color:#8a5a00}
.badge-experimental{background:#e8f0fe;color:#174ea6}
.badge-deprecated{background:#fce8e6;color:#b42318}
.component-card-body{padding:12px 14px;display:none}
.component-card.open .component-card-body{display:block}
.component-card pre{background:var(--surface);border:1px solid var(--border);border-radius:5px;padding:10px;overflow:auto;font-size:11px;max-height:300px}
.copy-btn{font-size:10px;padding:3px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg);cursor:pointer}
.copy-btn:hover{background:var(--surface)}
@media(max-width:640px){.catalog-body{padding:12px}.catalog-header{flex-direction:column;align-items:stretch}}
</style>
</head>
<body>
<div class="catalog-header">
<h1>HyperPBI Component Catalog</h1>
<input type="search" id="search" placeholder="Search components..." aria-label="Search components">
<select id="category-filter" aria-label="Filter by category"><option value="">All categories</option>${categories.map(c => `<option value="${c}">${c}</option>`).join("")}</select>
<span class="catalog-count" id="component-count">${types.length} components</span>
</div>
<div class="catalog-body">
<p>Generated from canonical component definitions. See the <a href="docs/hyperpbi-component-catalog-reference.md">Markdown version</a> for offline reference.</p>

<h2>Universal Interaction</h2>
<p>Every component supports the universal interaction object for Power BI data behavior.</p>
<pre>${escapeHtml(JSON.stringify({enabled:true,trigger:"auto",internalMode:"highlight",internalScope:"self",externalMode:"auto",field:"__field_key__",operator:"=",value:"__value__",selectionMode:"replace",multiSelect:true,showSelector:false,clearOnSecondClick:true},null,2))}</pre>

<h2>UI Action Reference</h2>
<table><tr><th>Action</th><th>Required</th><th>Description</th></tr>
<tr><td>clearFilters</td><td>—</td><td>Clears all HyperPBI filters</td></tr>
<tr><td>setTab</td><td>target, value</td><td>Sets active tab</td></tr>
<tr><td>setState</td><td>target, value</td><td>Sets state value</td></tr>
<tr><td>toggleState</td><td>target</td><td>Toggles Boolean state</td></tr>
<tr><td>toggleSidebar</td><td>—</td><td>Toggles sidebar collapse</td></tr>
<tr><td>openOverlay</td><td>target</td><td>Opens an overlay</td></tr>
<tr><td>closeOverlay</td><td>target</td><td>Closes an overlay</td></tr>
<tr><td>toggleOverlay</td><td>target</td><td>Toggles an overlay</td></tr>
<tr><td>setStep</td><td>target, value</td><td>Sets active step</td></tr>
<tr><td>nextStep</td><td>target</td><td>Advances step</td></tr>
<tr><td>previousStep</td><td>target</td><td>Reverses step</td></tr>
<tr><td>showToast</td><td>message</td><td>Shows toast (1-30s duration)</td></tr>
<tr><td>dismissToast</td><td>target</td><td>Dismisses toast</td></tr>
<tr><td>scrollTo</td><td>target</td><td>Scrolls to component</td></tr>
<tr><td>refresh</td><td>—</td><td>Safe no-op</td></tr>
</table>

<h2>Application Shell</h2>
<p>Configured at root level via <code>schema.app</code>. Not a component type.</p>
<p>Supports: brand, navbar, sidebar, pageHeader, footer, vertical/horizontal layout, fluid/boxed container, density, content padding, sticky header, collapsible sidebar with mobile offcanvas.</p>

${categories.map(cat => {
    const catTypes = types.filter(t => {
        const map = {"Layout":["grid","flex","split","section","toolbar","leftPanel","rightPanel","spacer","divider"],"Controls":["searchBox","textInput","numberInput","slider","select","multiSelect","segmentedControl","toggle","button","buttonGroup","filterChips","dateRange"],"Navigation":["tabs","collapsible","accordion","drawer","filterDrawer","steps","stepper"],"Display":["kpi","metricGrid","infoCard","statusBadge","progressBar","alert","statList","detailPanel","timeline"],"Primitives":["card","icon","iconButton","avatar","avatarGroup","listGroup","dataGrid","countUp","tracking","dropdown","modal","offcanvas","popover"],"Feedback":["emptyState","placeholder","spinner"],"Forms":["textarea","checkbox","checkboxGroup","radioGroup","inputGroup"],"Charts":["barChart","horizontalBarChart","lineChart","areaChart","pieChart","donutChart","scatterChart","gauge","heatmap","comboChart","waterfallChart","sankeyChart","treemapChart","funnelChart","radarChart","smallMultiples"],"Tables":["table","matrix"],"Maps":["map"],"Custom components":["text","markdown","html","custom"],"Advanced components":["advancedChart"]};
        return (map[cat]||[]).includes(t);
    });
    if(catTypes.length===0)return"";
    return `<h2>${cat}</h2>` + catTypes.map(t => {
        const practicalMapNote = t === "map" ? "<p>Supports Power BI geometry plus public ArcGIS feature layers and joins, viewport queries, tile/basic dynamic overlays, labels, tooltips/popups, selection, layer controls, legend, Home, and Zoom to Selection.</p>" : "";
        return `<div class="component-card" data-type="${t}" data-category="${cat}">
<div class="component-card-header" onclick="this.parentElement.classList.toggle('open')" aria-expanded="false">
<strong>${t}</strong>
<span class="component-card-badge badge-stable">Stable</span>
</div>
<div class="component-card-body">
<p>Component type: <code>${t}</code></p>
${practicalMapNote}
<button class="copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent)">Copy JSON</button>
<pre>See componentJsonExamples for ${t}</pre>
</div></div>`;
    }).join("\n");
}).join("\n")}

<h2>Compatibility</h2>
<p>Legacy properties remain supported: accordion without items, stepper, drawer/filterDrawer, button action/actionValue, table tabulator engine, map legacy settings/style/popup, deprecated internal/external/selectable/selectionMode.</p>
</div>
<script>
document.getElementById("search").addEventListener("input",function(){const q=this.value.toLowerCase();document.querySelectorAll(".component-card").forEach(c=>{c.style.display=c.dataset.type.toLowerCase().includes(q)?"":"none"})});
document.getElementById("category-filter").addEventListener("change",function(){const cat=this.value;document.querySelectorAll(".component-card").forEach(c=>{c.style.display=!cat||c.dataset.category===cat?"":"none"})});
</script>
</body>
</html>`;
}

function escapeHtml(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

main().catch(err => { console.error(err); process.exit(1); });
