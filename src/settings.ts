import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

const f = formattingSettings;
type Slice = formattingSettings.Slice;
const enumValue = (displayName: string, value: string) => ({ displayName, value });
const dropdown = (name: string, displayName: string, values: Array<[string, string]>, selected: string) => new f.ItemDropdown({ name, displayName, items: values.map(([label, value]) => enumValue(label, value)), value: enumValue(values.find(item => item[1] === selected)?.[0] ?? selected, selected) });
const toggle = (name: string, displayName: string, value: boolean) => new f.ToggleSwitch({ name, displayName, value });
const number = (name: string, displayName: string, value: number) => new f.NumUpDown({ name, displayName, value });

class InterfaceCard extends f.SimpleCard {
    name = "interface"; displayName = "Interface";
    theme = dropdown("theme", "Theme", [["Light", "light"], ["Dark", "dark"], ["System", "auto"]], "light");
    slices: Slice[] = [this.theme];
}

class EditorCard extends f.SimpleCard {
    name = "editor"; displayName = "Advanced editor";
    previewPosition = dropdown("previewPosition", "Preview area", [["Right", "right"], ["Bottom", "bottom"], ["Hidden", "hidden"]], "right");
    fontSize = number("fontSize", "JSON editor font size", 13);
    wordWrap = toggle("wordWrap", "Word wrap", false);
    showDataPane = toggle("showDataPane", "Show data preview", true);
    showLogPane = toggle("showLogPane", "Show log pane", true);
    slices: Slice[] = [this.previewPosition, this.fontSize, this.wordWrap, this.showDataPane, this.showLogPane];
}

class RenderedVisualCard extends f.SimpleCard {
    name = "renderedVisual"; displayName = "Rendered visual";
    enableInteractions = toggle("enableInteractions", "Interact with other visuals", true);
    slices: Slice[] = [this.enableInteractions];
}

class DataLimitCard extends f.SimpleCard {
    name = "dataLimit"; displayName = "Data limit options";
    maxRows = number("maxRows", "Maximum rows", 5000);
    slices: Slice[] = [this.maxRows];
}

export class VisualFormattingSettingsModel extends f.Model {
    interface = new InterfaceCard(); editor = new EditorCard(); renderedVisual = new RenderedVisualCard(); dataLimit = new DataLimitCard();
    cards = [this.interface, this.editor, this.renderedVisual, this.dataLimit];
}

export interface RuntimeSettings {
    schemaJson: string; useSchemaField: boolean; validationMode: string; showExample: boolean;
    enableHtml: boolean; customCss: string; showWarnings: boolean; allowInlineSvg: boolean; allowSafeImages: boolean;
    theme: { mode: string; primary: string; accent: string; surface: string; text: string; border: string; danger: string; warning: string; success: string; fontFamily: string; baseFontSize: number; radius: number; shadow: number };
    layout: { density: string; gap: number; cardPadding: number; leftPanelWidth: number; headerHeight: number; internalScrolling: boolean; stickyToolbar: boolean };
    table: { maxRows: number; rowHeight: number; stickyHeader: boolean; pagination: boolean; columnResize: boolean; search: boolean };
    map: { enabled: boolean; center: [number, number]; zoom: number; tileUrl: string; allowExternalTiles: boolean; clusterPoints: boolean };
    debug: { showFieldDictionary: boolean; showSchemaErrors: boolean; showDataSample: boolean; showPerformance: boolean };
    editor: { previewPosition: string; fontSize: number; wordWrap: boolean; showDataPane: boolean; showLogPane: boolean };
    enableInteractions: boolean;
}

export function toRuntimeSettings(model: VisualFormattingSettingsModel): RuntimeSettings {
    const mode = String(model.interface.theme.value.value); const dark = mode === "dark";
    return {
        schemaJson: "", useSchemaField: false, validationMode: "strict", showExample: true,
        enableHtml: true, customCss: "", showWarnings: true, allowInlineSvg: false, allowSafeImages: false,
        theme: { mode, primary: "#206bc4", accent: "#4299e1", surface: dark ? "#182433" : "#ffffff", text: dark ? "#f1f5f9" : "#182433", border: dark ? "#334155" : "#dce1e7", danger: "#d63939", warning: "#f59f00", success: "#2fb344", fontFamily: "Inter, Segoe UI, sans-serif", baseFontSize: 12, radius: 8, shadow: 1 },
        layout: { density: "compact", gap: 8, cardPadding: 12, leftPanelWidth: 280, headerHeight: 44, internalScrolling: true, stickyToolbar: true },
        table: { maxRows: Math.max(100, Math.min(10000, model.dataLimit.maxRows.value)), rowHeight: 32, stickyHeader: true, pagination: true, columnResize: true, search: true },
        map: { enabled: true, center: [0, 0], zoom: 2, tileUrl: "", allowExternalTiles: false, clusterPoints: false },
        debug: { showFieldDictionary: false, showSchemaErrors: true, showDataSample: false, showPerformance: false },
        editor: { previewPosition: String(model.editor.previewPosition.value.value), fontSize: Math.max(10, Math.min(22, model.editor.fontSize.value)), wordWrap: model.editor.wordWrap.value, showDataPane: model.editor.showDataPane.value, showLogPane: model.editor.showLogPane.value },
        enableInteractions: model.renderedVisual.enableInteractions.value
    };
}
