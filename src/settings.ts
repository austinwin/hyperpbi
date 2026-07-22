import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { createRuntimeSettings, RuntimeSettings } from "./runtime/runtimeSettings";

export type { RuntimeSettings } from "./runtime/runtimeSettings";

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
    maxRows = number("maxRows", "Maximum displayed table rows", 5000);
    slices: Slice[] = [this.maxRows];
}

export class VisualFormattingSettingsModel extends f.Model {
    interface = new InterfaceCard(); editor = new EditorCard(); renderedVisual = new RenderedVisualCard(); dataLimit = new DataLimitCard();
    cards = [this.interface, this.editor, this.renderedVisual, this.dataLimit];
}

export function toRuntimeSettings(model: VisualFormattingSettingsModel): RuntimeSettings {
    const mode = String(model.interface.theme.value.value); const dark = mode === "dark";
    return createRuntimeSettings({
        theme: { mode, surface: dark ? "#182433" : "#ffffff", text: dark ? "#f1f5f9" : "#182433", border: dark ? "#334155" : "#dce1e7" },
        table: { maxRows: Math.max(100, model.dataLimit.maxRows.value) },
        editor: { previewPosition: String(model.editor.previewPosition.value.value), fontSize: Math.max(10, Math.min(22, model.editor.fontSize.value)), wordWrap: model.editor.wordWrap.value, showDataPane: model.editor.showDataPane.value, showLogPane: model.editor.showLogPane.value },
        enableInteractions: model.renderedVisual.enableInteractions.value
    });
}
