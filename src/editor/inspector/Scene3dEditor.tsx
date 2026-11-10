import { useEffect, useRef, useState } from "preact/hooks";
import { importModelFile } from "../../components/scene3d/modelAsset";
import { isScene3dKey, scene3dAnimationKinds, scene3dKinds, scene3dLimits, type Scene3dAnimation, type Scene3dComponent, type Scene3dKey, type Scene3dKind, type Scene3dObject, type Scene3dVector } from "../../schema/scene3dSchema";
import { StudioSection } from "../ui/StudioSection";

const kinds: Record<Scene3dKind, string> = {
    box: "Box", cylinder: "Cylinder", sphere: "Sphere", cone: "Cone",
    pipe: "Pipe", pump: "Pump assembly", tank: "Tank assembly", fan: "Fan rotor", model: "GLB / glTF model",
};
const materialDefaults = { metalness: 0.22, roughness: 0.44, opacity: 1 } as const;
type FieldOption = { key: string; label: string };

function TextInput({ label, value, placeholder, onChange }: {
    label: string; value: string; placeholder?: string; onChange: (value: string) => void;
}) {
    const [draft, setDraft] = useState(value);
    useEffect(() => setDraft(value), [value]);
    return <input aria-label={label} class="form-control form-control-sm" value={draft} maxLength={160} placeholder={placeholder}
        onInput={event => setDraft(event.currentTarget.value)} onBlur={event => {
            const next = event.currentTarget.value.trim();
            if (next !== value) onChange(next);
            setDraft(value);
        }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />;
}

function NumericInput({ label, value, min, max, step, onChange }: {
    label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void;
}) {
    const [draft, setDraft] = useState(String(value));
    useEffect(() => setDraft(String(value)), [value]);
    return <label>{label}<input aria-label={label} class="form-control form-control-sm" type="number" min={min} max={max} step={step}
        value={draft} onInput={event => setDraft(event.currentTarget.value)} onBlur={event => {
            const number = event.currentTarget.valueAsNumber;
            if (Number.isFinite(number)) {
                const next = Math.max(min, Math.min(max, number));
                if (next !== value) onChange(next);
            }
            setDraft(String(value));
        }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label>;
}

function TypedKeyInput({ label, value, onChange }: { label: string; value?: Scene3dKey; onChange: (value?: Scene3dKey) => void }) {
    const [kind, setKind] = useState<string>(typeof (value ?? ""));
    useEffect(() => setKind(typeof (value ?? "")), [typeof value]);
    const text = value === undefined ? "" : String(value);
    return <div class="hp-scene3d-editor-row">
        <label>{label}<TextInput label={label} value={text}
            onChange={input => {
                if (!input) { onChange(undefined); return; }
                const next = kind === "number" ? Number(input)
                    : kind === "boolean" ? input === "true" ? true : input === "false" ? false : undefined
                    : input;
                if (isScene3dKey(next)) onChange(next);
            }} /></label>
        <label>Value type<select class="form-select form-select-sm" aria-label={`${label} type`} value={kind} onChange={event => {
            const next = event.currentTarget.value;
            setKind(next);
            if (value !== undefined) {
                if (next === "string") onChange(String(value));
                if (next === "number" && Number.isFinite(Number(value))) onChange(Number(value));
                if (next === "boolean" && ["true", "false"].includes(String(value))) onChange(String(value) === "true");
            }
        }}><option value="string">Text</option><option value="number">Number</option><option value="boolean">Boolean</option></select></label>
    </div>;
}

function uniqueObjectId(kind: Scene3dKind, objects: Scene3dObject[]) {
    let index = 1;
    while (objects.some(object => object.id === `${kind}_${index}`)) index++;
    return `${kind}_${index}`;
}

export function Scene3dEditor({ component, fields, onChange }: {
    component: Scene3dComponent; fields: FieldOption[]; onChange: (property: string, value: unknown) => boolean;
}) {
    const objects = component.objects ?? [];
    const [objectId, setObjectId] = useState(objects[0]?.id);
    const [addKind, setAddKind] = useState<Scene3dKind>("pump");
    const [error, setError] = useState("");
    const [importing, setImporting] = useState(false);
    const [tooltipField, setTooltipField] = useState("");
    const [open, setOpen] = useState(true);
    const selected = objects.find(object => object.id === objectId) ?? objects[0];
    const latest = useRef({ objects, onChange });
    latest.current = { objects, onChange };
    const active = useRef(true);
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    const modelCount = objects.filter(object => object.kind === "model").length;

    function update(id: string, patch: Partial<Scene3dObject>) {
        const current = latest.current;
        return current.onChange("objects", current.objects.map(object => object.id === id ? { ...object, ...patch } : object));
    }
    function add(kind: Scene3dKind, model?: Scene3dObject["model"], copy?: Scene3dObject) {
        const current = latest.current;
        const id = uniqueObjectId(kind, current.objects);
        const position: Scene3dVector = copy
            ? [Math.min(100, (copy.position?.[0] ?? 0) + 1), copy.position?.[1] ?? 0, copy.position?.[2] ?? 0]
            : [(current.objects.length % 10) * 2, kind === "pump" || kind === "tank" ? 0 : 0.5, Math.floor(current.objects.length / 10) * 2];
        const next: Scene3dObject = { ...copy, id, kind, position, model, dataKey: undefined, selectable: true, label: copy?.label ? `${copy.label.slice(0, 155)} copy` : `${kinds[kind]} ${id.split("_")[1]}` };
        if (current.onChange("objects", [...current.objects, next])) setObjectId(id);
    }
    async function load(file: File, replaceId?: string) {
        setError("");
        setImporting(true);
        try {
            const model = await importModelFile(file);
            if (!active.current) return;
            if (replaceId) {
                if (latest.current.objects.some(object => object.id === replaceId && object.kind === "model")) update(replaceId, { model });
            } else add("model", model);
        } catch (reason) {
            if (active.current) setError(reason instanceof Error ? reason.message : "The model could not be read.");
        } finally {
            if (active.current) setImporting(false);
        }
    }

    const palette = component.statusColors ?? [];
    const tooltips = (component.tooltipFields ?? []).map(item => typeof item === "string" ? { field: item, label: undefined } : item);
    const availableFields = fields.filter(field => !tooltips.some(item => item.field === field.key));
    const disabled = objects.length >= scene3dLimits.objects;
    const animations = selected?.animations ?? [];
    const changeAnimation = (index: number, patch: Partial<Scene3dAnimation>) => {
        if (selected) update(selected.id, { animations: animations.map((animation, at) => at === index ? { ...animation, ...patch } : animation) });
    };
    const filePicker = (label: string, replaceId?: string) => <label>{label}<input type="file" class="form-control form-control-sm"
        accept=".glb,.gltf" disabled={importing || !replaceId && (disabled || modelCount >= scene3dLimits.models)} onChange={event => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            input.value = "";
            if (file) void load(file, replaceId);
        }} /></label>;

    return <StudioSection title="Scene editor" open={open} onToggle={setOpen}>
        <div class="hp-scene3d-editor">
            <p class="text-secondary m-0">Build the scene with equipment, shapes, or a self-contained model. Changes appear in the dashboard preview.</p>
            <fieldset>
                <legend>Add an object</legend>
                <div class="hp-scene3d-editor-row">
                    <label>Shape or equipment<select class="form-select form-select-sm" value={addKind} onChange={event => setAddKind(event.currentTarget.value as Scene3dKind)}>
                        {scene3dKinds.filter(kind => kind !== "model").map(kind => <option key={kind} value={kind}>{kinds[kind]}</option>)}
                    </select></label>
                    <button type="button" class="btn btn-sm align-self-end" disabled={disabled} onClick={() => add(addKind)}>Add object</button>
                </div>
                {filePicker("Import model")}
                {importing && <span role="status">Checking model…</span>}
                {error && <span class="text-danger" role="alert">{error}</span>}
            </fieldset>
            {selected && <>
                <fieldset>
                    <legend>Objects ({objects.length})</legend>
                    <label>Edit object<select class="form-select form-select-sm" value={selected.id} onChange={event => setObjectId(event.currentTarget.value)}>
                        {objects.map(object => <option key={object.id} value={object.id}>{object.label ?? object.id} · {kinds[object.kind]}</option>)}
                    </select></label>
                    <div class="hp-scene3d-editor-row">
                        <button type="button" class="btn btn-sm" disabled={disabled || selected.kind === "model" && modelCount >= scene3dLimits.models}
                            onClick={() => add(selected.kind, selected.model, selected)}>Duplicate object</button>
                        <button type="button" class="btn btn-sm" onClick={() => onChange("objects", objects.filter(object => object.id !== selected.id))}>Remove object</button>
                    </div>
                </fieldset>
                <div class="hp-scene3d-editor" key={selected.id}>
                    <label>Object label<TextInput label="Object label" value={selected.label ?? ""}
                        onChange={label => update(selected.id, { label: label || undefined })} /></label>
                    {selected.kind === "model" ? filePicker("Replace model", selected.id) : <label>Object kind<select class="form-select form-select-sm" value={selected.kind}
                        onChange={event => {
                            const kind = event.currentTarget.value as Scene3dKind;
                            update(selected.id, { kind, flowKey: kind === "pipe" ? selected.flowKey : undefined });
                        }}>
                        {scene3dKinds.filter(kind => kind !== "model").map(kind => <option key={kind} value={kind}>{kinds[kind]}</option>)}
                    </select></label>}
                    {(["position", "size", "rotation"] as const).map(property => {
                        const title = property === "position" ? "Position" : property === "size" ? "Size / assembly scale" : "Rotation (degrees)";
                        const values = selected[property] ?? (property === "size" ? [1, 1, 1] : [0, 0, 0]);
                        const [min, max] = property === "size" ? [0.02, 100] : property === "position" ? [-100, 100] : [-360, 360];
                        return <fieldset key={property}><legend>{title}</legend><div class="hp-scene3d-editor-grid">
                            {["X", "Y", "Z"].map((axis, index) => <NumericInput key={axis} label={`${property[0].toUpperCase()}${property.slice(1)} ${axis}`}
                                value={values[index]} min={min} max={max} step={property === "rotation" ? 1 : 0.05}
                                onChange={value => {
                                    const next: Scene3dVector = [...values];
                                    next[index] = value;
                                    update(selected.id, { [property]: next });
                                }} />)}
                        </div></fieldset>;
                    })}
                    <fieldset><legend>Material</legend>
                        <div class="hp-scene3d-editor-row">
                            <label>Base color<input type="color" class="form-control form-control-sm" value={selected.color ?? (selected.kind === "tank" ? "#a8bfce" : "#327eab")}
                                onChange={event => update(selected.id, { color: event.currentTarget.value })} /></label>
                            {selected.color && <button type="button" class="btn btn-sm align-self-end" onClick={() => update(selected.id, { color: undefined })}>Reset color</button>}
                        </div>
                        <div class="hp-scene3d-editor-grid">{(Object.keys(materialDefaults) as Array<keyof typeof materialDefaults>).map(property => <NumericInput key={property}
                            label={property[0].toUpperCase() + property.slice(1)} value={selected[property] ?? materialDefaults[property]}
                            min={property === "opacity" ? 0.1 : 0} max={1} step={0.05} onChange={value => update(selected.id, { [property]: value })} />)}</div>
                    </fieldset>
                    <fieldset><legend>Animations ({animations.length})</legend>
                        <p class="text-secondary m-0">Create local motion without JavaScript. Animation is paused when motion is disabled or reduced-motion is requested.</p>
                        {animations.map((animation, index) => <fieldset key={index}>
                            <legend>Behavior {index + 1}</legend>
                            <div class="hp-scene3d-editor-row">
                                <label>Animation type<select aria-label={`Animation type ${index + 1}`} class="form-select form-select-sm" value={animation.kind}
                                    onChange={event => changeAnimation(index, { kind: event.currentTarget.value as Scene3dAnimation["kind"], rpm: undefined, rpmField: undefined, clipName: undefined, rate: undefined })}>
                                    {scene3dAnimationKinds.filter(kind => kind !== "clip" || selected.kind === "model").map(kind =>
                                        <option key={kind} value={kind}>{kind === "blink" ? "Visibility / blink" : kind === "clip" ? "Imported glTF clip" : kind[0].toUpperCase() + kind.slice(1)}</option>)}
                                </select></label>
                                <button type="button" class="btn btn-sm align-self-end" aria-label={`Remove animation ${index + 1}`}
                                    onClick={() => update(selected.id, { animations: animations.filter((_item, at) => at !== index) })}>Remove</button>
                            </div>
                            {["rotate", "translate", "scale"].includes(animation.kind) && <label>Axis<select class="form-select form-select-sm"
                                aria-label={`Animation axis ${index + 1}`} value={animation.axis ?? "y"}
                                onChange={event => changeAnimation(index, { axis: event.currentTarget.value as "x" | "y" | "z" })}>
                                <option value="x">X</option><option value="y">Y</option><option value="z">Z</option>
                            </select></label>}
                            {animation.kind === "rotate" && <>
                                <NumericInput label={`Rotation RPM ${index + 1}`} value={animation.rpm ?? 60} min={-1800} max={1800} step={10}
                                    onChange={rpm => changeAnimation(index, { rpm })} />
                                {selected.dataKey !== undefined && <label>RPM data field<select class="form-select form-select-sm"
                                    aria-label={`RPM field ${index + 1}`} value={animation.rpmField ?? ""}
                                    onChange={event => changeAnimation(index, { rpmField: event.currentTarget.value || undefined })}>
                                    <option value="">Use fixed RPM</option>{fields.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
                                </select></label>}
                            </>}
                            {["translate", "scale", "pulse"].includes(animation.kind) &&
                                <NumericInput label={`Amplitude ${index + 1}`} value={animation.amplitude ?? 0.2}
                                    min={0} max={5} step={0.05} onChange={amplitude => changeAnimation(index, { amplitude })} />}
                            {["translate", "scale", "pulse", "blink"].includes(animation.kind) &&
                                <NumericInput label={`Cycle seconds ${index + 1}`} value={animation.period ?? 2}
                                    min={0.15} max={60} step={0.1} onChange={period => changeAnimation(index, { period })} />}
                            {animation.kind === "clip" && <>
                                <label>Clip name (optional)<TextInput label={`Clip name ${index + 1}`} value={animation.clipName ?? ""}
                                    placeholder="First clip if blank" onChange={clipName => changeAnimation(index, { clipName: clipName || undefined })} /></label>
                                <NumericInput label={`Clip playback rate ${index + 1}`} value={animation.rate ?? 1}
                                    min={0} max={4} step={0.1} onChange={rate => changeAnimation(index, { rate })} />
                            </>}
                            {selected.dataKey !== undefined ? <>
                                <label>Run when data field<select class="form-select form-select-sm"
                                    aria-label={`Animation enabled field ${index + 1}`} value={animation.enabledField ?? ""}
                                    onChange={event => changeAnimation(index, { enabledField: event.currentTarget.value || undefined, enabledValue: undefined })}>
                                    <option value="">Always (when motion enabled)</option>{fields.map(field =>
                                        <option key={field.key} value={field.key}>{field.label}</option>)}
                                </select></label>
                                {animation.enabledField && <TypedKeyInput label={`Run when equals (optional) ${index + 1}`} value={animation.enabledValue}
                                    onChange={enabledValue => changeAnimation(index, { enabledValue })} />}
                            </> : <small>Assign a matching object key under Object behavior to drive animation from a data row.</small>}
                        </fieldset>)}
                        <button type="button" class="btn btn-sm" disabled={animations.length >= scene3dLimits.animationsPerObject}
                            onClick={() => update(selected.id, { animations: [...animations, selected.kind === "model" ?
                                { kind: "clip", rate: 1 } : { kind: "rotate", axis: "y", rpm: 60 }] })}>Add animation</button>
                    </fieldset>
                    <fieldset><legend>Object behavior</legend>
                        <label class="hp-scene3d-check"><input type="checkbox" checked={selected.visible !== false} onChange={event => update(selected.id, { visible: event.currentTarget.checked })} />Visible</label>
                        <label class="hp-scene3d-check"><input type="checkbox" checked={selected.selectable ?? selected.dataKey !== undefined} onChange={event => update(selected.id, { selectable: event.currentTarget.checked })} />Selectable</label>
                        {component.objectIdField ? <TypedKeyInput label="Match object key" value={selected.dataKey} onChange={dataKey => update(selected.id, { dataKey })} />
                            : <small>Choose an Object key field under Data to link this object to rows.</small>}
                        {selected.kind === "pipe" && component.objectIdField && component.flowField &&
                            <TypedKeyInput label="Match pipe flow key" value={selected.flowKey} onChange={flowKey => update(selected.id, { flowKey })} />}
                    </fieldset>
                </div>
            </>}
            <fieldset><legend>Tooltip fields</legend>
                {tooltips.map((item, index) => <div key={index} class="hp-scene3d-editor-row">
                    <label>{fields.find(option => option.key === item.field)?.label ?? item.field}
                        <TextInput label={`Label for ${item.field}`} placeholder="Use field name" value={item.label ?? ""}
                            onChange={label => onChange("tooltipFields", tooltips.map((entry, i) => i === index ? { ...entry, label: label || undefined } : entry))} />
                    </label>
                    <button type="button" class="btn btn-sm align-self-end" aria-label={`Remove tooltip field ${item.field}`} onClick={() => onChange("tooltipFields", tooltips.filter((_entry, i) => i !== index))}>×</button></div>)}
                <div class="hp-scene3d-editor-row"><label>Field<select class="form-select form-select-sm" aria-label="Tooltip field" value={tooltipField}
                    onChange={event => setTooltipField(event.currentTarget.value)}>
                    <option value="">Choose a field</option>{availableFields.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
                </select></label><button type="button" class="btn btn-sm align-self-end" disabled={!availableFields.some(field => field.key === tooltipField) || tooltips.length >= scene3dLimits.tooltipFields}
                    onClick={() => { if (onChange("tooltipFields", [...tooltips, { field: tooltipField }])) setTooltipField(""); }}>Add tooltip field</button></div>
            </fieldset>
            {component.statusField && <fieldset><legend>Status colors</legend>
                {palette.map((rule, index) => <div class="hp-scene3d-editor-palette" key={index}>
                    <TypedKeyInput label={`Status ${index + 1}`} value={rule.value} onChange={value => {
                        if (value !== undefined) onChange("statusColors", palette.map((item, i) => i === index ? { ...item, value } : item));
                    }} />
                    <label>Color<input aria-label={`Status color ${index + 1}`} type="color" class="form-control form-control-sm" value={rule.color}
                        onChange={event => onChange("statusColors", palette.map((item, i) => i === index ? { ...item, color: event.currentTarget.value } : item))} /></label>
                    <button type="button" class="btn btn-sm" aria-label={`Remove status color ${index + 1}`} onClick={() => onChange("statusColors", palette.filter((_item, i) => i !== index))}>×</button>
                </div>)}
                <button type="button" class="btn btn-sm justify-self-start" disabled={palette.length >= scene3dLimits.statusColors} onClick={() => {
                    let index = 1;
                    while (palette.some(rule => rule.value === `Status ${index}`)) index++;
                    onChange("statusColors", [...palette, { value: `Status ${index}`, color: "#168b79" }]);
                }}>Add status color</button>
            </fieldset>}
        </div>
    </StudioSection>;
}
