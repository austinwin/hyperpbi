import { HyperPbiSchema } from "./hyperpbiSchema";

export const controlsExample: HyperPbiSchema = {
    version: "1.0", title: "Interactive Operations", layout: { type: "split", leftPanel: { width: 260, collapsible: true }, main: { type: "grid", columns: 12 } },
    leftPanel: [{ type: "section", title: "Filters", children: [{ type: "searchBox", id: "search", placeholder: "Search..." }, { type: "select", id: "category", field: "category", multiple: true }] }],
    components: [{ type: "barChart", id: "chart", title: "Value by Category", category: "category", measure: "measure", aggregation: "sum", span: 7 }, { type: "table", id: "details", title: "Details", pagination: true, search: true, span: 5 }]
};
