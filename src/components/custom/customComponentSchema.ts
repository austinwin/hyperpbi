import { ContentComponent } from "../../schema/hyperpbiSchema";
export function validateCustomComponent(component: ContentComponent): string[] { const errors: string[] = []; if (!component.id) errors.push("Custom components require a stable id."); if (!component.html && !component.repeat?.template) errors.push("Custom components require html or repeat.template."); return errors; }
