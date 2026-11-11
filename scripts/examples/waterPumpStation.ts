import type { HyperPbiConfig } from "../../src/config/hyperpbiConfig";
import type { Scene3dComponent, Scene3dObject, Scene3dVector } from "../../src/schema/scene3dSchema";

type Row = Record<string, string | number | boolean | null>;
const round = (value: number, digits = 0) => Number(value.toFixed(digits));
const scenarios = [
    { name: "Normal supply", demand: 15100, pressure: 64, remote: 1, local: 1, surface: 1, level: 76, pumps: [1, 2, 3, 4], alerts: 0 },
    { name: "Peak demand", demand: 21700, pressure: 67, remote: 1.08, local: 1.12, surface: 1.18, level: 68, pumps: [1, 2, 3, 4, 5, 6], alerts: 0 },
    { name: "Remote wells offline", demand: 12300, pressure: 57, remote: 0, local: 1, surface: 1.14, level: 54, pumps: [1, 2, 4, 5], alerts: 1 },
    { name: "Surface inlet unavailable", demand: 9300, pressure: 55, remote: 1.05, local: 1, surface: 0, level: 57, pumps: [1, 2, 3, 5], alerts: 1 },
    { name: "Booster maintenance", demand: 14900, pressure: 62, remote: 1, local: 1, surface: 1, level: 70, pumps: [1, 2, 4, 5], alerts: 0 },
    { name: "Low storage", demand: 9700, pressure: 51, remote: 0.85, local: 1, surface: 0.85, level: 25, pumps: [1, 3, 5], alerts: 2 },
    { name: "Limited power", demand: 8100, pressure: 51, remote: 0.45, local: 0, surface: 0.75, level: 61, pumps: [1, 3], alerts: 1 },
    { name: "Low distribution pressure", demand: 8200, pressure: 43, remote: 1, local: 1, surface: 1, level: 64, pumps: [1, 2], alerts: 2 },
    { name: "Chlorine dosing fault", demand: 14300, pressure: 63, remote: 1, local: 1, surface: 1, level: 72, pumps: [1, 2, 3, 4], alerts: 1, chlorineFault: true },
    { name: "Ammonia dosing fault", demand: 14600, pressure: 63, remote: 1, local: 1, surface: 1, level: 72, pumps: [1, 2, 3, 4], alerts: 1, ammoniaFault: true },
] as const;

function exampleRows(): Row[] {
    const rows: Row[] = [];
    const remoteWells = [
        ["W01A", 530], ["W03A", 480], ["W03SB", 420], ["W04A", 510],
        ["W05A", 610], ["W08", 490], ["W11", 575], ["W10", 525],
    ] as const;
    const pumpWeights = [1.02, 0.94, 1.08, 1.0, 0.98, 1.04];
    scenarios.forEach((scenario, caseIndex) => {
        const chlorineFault = "chlorineFault" in scenario && Boolean(scenario.chlorineFault);
        const ammoniaFault = "ammoniaFault" in scenario && Boolean(scenario.ammoniaFault);
        const intakeRecords: Row[] = [];
        const entries: Row[] = [];
        const base = (assetid: string, equipment: string, category: string, extra: Partial<Row> = {}): Row => ({
            assetid, equipment, category, medium: "Water", status: "Running",
            flowgpm: 0, pressurepsi: null, levelpct: null, rpm: null,
            motorloadpct: null, valveopenpct: null, dosemgL: null,
            cl2mgL: null, nh3mgL: null, ...extra,
        });
        const add = (row: Row) => { entries.push(row); return row; };
        for (const [id, baseFlow] of remoteWells) {
            const flow = Math.round(baseFlow * scenario.remote);
            intakeRecords.push(add(base(id, "Remote well " + id.slice(1), "Well",
                { flowgpm: flow, status: flow ? "Running" : "Offline" })));
            add(base("FM-" + id, "Well " + id.slice(1) + " electromagnetic flowmeter", "Flowmeter",
                { flowgpm: flow, status: flow ? "Running" : "No flow" }));
        }
        const remoteFlow = intakeRecords.reduce((sum, item) => sum + Number(item.flowgpm), 0);
        const localFlow = Math.round(690 * scenario.local);
        intakeRecords.push(add(base("W09", "On-site well 09", "Well",
            { flowgpm: localFlow, status: localFlow ? "Running" : "Offline" })));
        add(base("FM-W09", "On-site well flowmeter", "Flowmeter",
            { flowgpm: localFlow, status: localFlow ? "Running" : "No flow" }));
        const sourceDose = remoteFlow > 0 && !chlorineFault;
        for (const [id, dose] of [["CL2-R1", 0.85], ["CL2-R2", 0.55]] as const) {
            add(base(id, "Remote collection chlorine dosing", "Chemical injection",
                { medium: "Cl2", dosemgL: sourceDose ? dose : 0,
                    status: sourceDose ? "Dosing" : chlorineFault && remoteFlow > 0 ? "Fault" : "Standby" }));
        }
        add(base("CL2-W09", "On-site well chlorine dosing", "Chemical injection",
            { medium: "Cl2", dosemgL: localFlow && !chlorineFault ? 1.2 : 0,
                status: localFlow ? chlorineFault ? "Fault" : "Dosing" : "Standby" }));
        add(base("NH3-W09", "On-site well ammonia dosing", "Chemical injection",
            { medium: "NH3", dosemgL: localFlow && !ammoniaFault ? 0.35 : 0,
                status: localFlow ? ammoniaFault ? "Fault" : "Dosing" : "Standby" }));
        const surfaceFlows: number[] = [];
        const valveOpenings = scenario.name === "Surface inlet unavailable" ? [0, 0] :
            scenario.name === "Limited power" ? [70, 40] : [100, 100];
        for (let source = 1; source <= 2; source++) {
            const id = "SW" + source;
            const open = valveOpenings[source - 1];
            const flow = Math.round((source === 1 ? 5400 : 5000) * scenario.surface * open / 100);
            surfaceFlows.push(flow);
            intakeRecords.push(add(base(id, "Surface inlet " + source + " actuated valve", "Surface valve",
                { flowgpm: flow, valveopenpct: open, status: open ? "Running" : "Closed" })));
            add(base("FM-" + id, "Surface inlet " + source + " electromagnetic flowmeter", "Flowmeter",
                { flowgpm: flow, status: flow ? "Running" : "No flow" }));
            add(base("AN-" + id, "Surface inlet " + source + " chlorine analyzer", "Analyzer",
                { cl2mgL: flow ? chlorineFault ? 0.24 : 1.45 + source * 0.13 : null,
                    status: !flow ? "No sample" : chlorineFault ? "Warning" : "Running" }));
            add(base("CL2-" + id, "Surface inlet " + source + " chlorine dosing", "Chemical injection",
                { medium: "Cl2", dosemgL: flow && !chlorineFault ? 1.05 : 0,
                    status: flow ? chlorineFault ? "Fault" : "Dosing" : "Standby" }));
            add(base("NH3-" + id, "Surface inlet " + source + " ammonia dosing", "Chemical injection",
                { medium: "NH3", dosemgL: flow && !ammoniaFault ? 0.32 : 0,
                    status: flow ? ammoniaFault ? "Fault" : "Dosing" : "Standby" }));
        }
        const sourceflow = remoteFlow + localFlow + surfaceFlows.reduce((a, b) => a + b, 0);
        const target = scenario.demand;
        const runningWeights = scenario.pumps.reduce((sum, index) => sum + pumpWeights[index - 1], 0);
        let allocated = 0;
        let runningIndex = 0;
        for (let pump = 1; pump <= 6; pump++) {
            const enabled = (scenario.pumps as readonly number[]).includes(pump);
            let flow = 0;
            if (enabled) {
                runningIndex++;
                flow = runningIndex === scenario.pumps.length ?
                    target - allocated : Math.round(target * pumpWeights[pump - 1] / runningWeights);
                allocated += flow;
            }
            const warning = enabled && scenario.pressure < 48;
            add(base("BP" + String(pump).padStart(2, "0"), "Booster pump " + pump, "Booster",
                { flowgpm: flow, pressurepsi: enabled ? scenario.pressure : null,
                    rpm: enabled ? Math.round(970 + flow * 0.072) : 0,
                    motorloadpct: enabled ? Math.round(Math.min(98, 48 + flow / 125)) : 0,
                    status: warning ? "Warning" : enabled ? "Running" : "Standby" }));
        }
        const stationflow = allocated;
        for (let tank = 1; tank <= 5; tank++) {
            const level = Math.min(94, Math.max(8, Math.round(scenario.level + (tank - 3) * 2.2)));
            add(base("GST" + tank, "Ground storage tank " + tank, "Storage",
                { levelpct: level, status: level < 32 ? "Warning" : "Running" }));
        }
        for (const [id, flow, psi] of [
            ["REMOTE", remoteFlow, null], ["SOURCE", sourceflow, null],
            ["SUCTION", stationflow, 17], ["DISCHARGE", stationflow, scenario.pressure],
            ["DIST", stationflow, scenario.pressure],
        ] as const) add(base(id, id === "DIST" ? "Distribution interface" : id + " header", "Header",
            { flowgpm: flow, pressurepsi: psi, status: flow ? "Running" : "No flow" }));
        const cl2mgL = chlorineFault ? 0.23 : scenario.name === "Low storage" ? 1.6 : 2.03;
        const nh3mgL = ammoniaFault ? 0.04 : scenario.name === "Limited power" ? 0.29 : 0.43;
        add(base("AN-DIST", "Distribution Cl2 and NH3 analyzer", "Analyzer",
            { cl2mgL, nh3mgL, status: chlorineFault || ammoniaFault ? "Warning" : "Running" }));
        const levels = entries.filter(item => item.category === "Storage");
        const averagelevel = Math.round(levels.reduce((sum, item) => sum + Number(item.levelpct), 0) / levels.length);
        const stationonline = scenario.pumps.length;
        const stationalerts = scenario.alerts + (chlorineFault || ammoniaFault ? 1 : 0);
        const common = { scenario: scenario.name, stationflow, stationpressure: scenario.pressure,
            stationonline, stationalerts, sourceflow, averagelevel, netstoragegpm: sourceflow - stationflow };
        for (const item of entries) rows.push({
            ...item, ...common, recordtype: "Snapshot", sampleorder: 1000 - caseIndex,
            readingid: String(caseIndex) + "-" + String(item.assetid) + "-snapshot", hour: "Snapshot",
        });
        for (let hour = 0; hour < 12; hour++) rows.push({
            ...base("DIST", "Distribution interface", "Trend", {
                flowgpm: Math.round(target * (0.97 + 0.045 * Math.sin(hour * 0.7 + caseIndex))),
                pressurepsi: round(scenario.pressure + Math.sin(hour * 0.63 + caseIndex) * 1.3, 1),
            }), ...common, recordtype: "Trend", sampleorder: hour,
            readingid: String(caseIndex) + "-DIST-" + hour,
            hour: String(hour + 7).padStart(2, "0") + ":00",
        });
    });
    return rows;
}

function sceneObjects(): Scene3dObject[] {
    const objects: Scene3dObject[] = [];
    const sea = "#279bb9", clean = "#4b94cd", gold = "#dfa36a";
    const pipe = (id: string, x: number, y: number, z: number, length: number,
        direction: "x" | "z", color: string, flowKey?: string, diameter = 0.18) => {
        const rotation: Scene3dVector = direction === "x" ? [0, 0, -90] : [90, 0, 0];
        objects.push({ id, kind: "pipe", position: [x, y, z], size: [diameter, length, diameter],
            rotation, color, metalness: 0.48, ...(flowKey ? { flowKey } : {}) });
    };
    for (let well = 1; well <= 8; well++) {
        const z = -4.25 + (well - 1) * 0.8;
        const id = "RW" + String(well).padStart(2, "0");
        objects.push({ id: "well_head_" + id, kind: "cylinder", label: "Remote source " + well,
            dataKey: id, position: [-8.2, 0.25, z], size: [0.38, 0.42, 0.38],
            color: sea, selectable: true });
        pipe("well_flow_" + id, -6.8, 0.52, z, 2.8, "x", sea, id, 0.14);
    }
    objects.push({ id: "local_source", kind: "pump", label: "On-site well", dataKey: "LW01",
        position: [-8.2, 0.04, 2.63], size: [0.54, 0.58, 0.54], selectable: true });
    pipe("local_source_flow", -6.8, 0.52, 2.63, 2.8, "x", sea, "LW01", 0.16);
    for (let source = 1; source <= 2; source++) {
        const z = source === 1 ? 3.82 : 4.75;
        const id = "SW" + source;
        objects.push({ id: "surface_valve_" + source, kind: "box", label: "Surface source valve " + source,
            dataKey: id, position: [-8.3, 0.47, z], size: [0.5, 0.52, 0.45],
            color: "#d5a15d", selectable: true });
        pipe("surface_supply_" + source, -6.8, 0.52, z, 2.8, "x", sea, id, 0.2);
        objects.push({ id: "surface_meter_" + source, kind: "sphere", position: [-6.65, 0.52, z],
            size: [0.25, 0.25, 0.25], color: "#b8d8e9", selectable: false });
    }
    pipe("source_collector", -5.4, 0.52, 0.25, 9.1, "z", sea, undefined, 0.28);
    pipe("source_transfer", -3.55, 0.52, 0.25, 3.7, "x", sea, "SOURCE", 0.28);
    pipe("storage_inlet_header", -1.7, 0.52, 0, 8.8, "z", sea, undefined, 0.29);
    const tankZ = [-4.1, -2.05, 0, 2.05, 4.1];
    for (let i = 1; i <= 5; i++) {
        const z = tankZ[i - 1], id = "GST" + i;
        pipe("tank_inlet_" + i, -0.68, 0.52, z, 2.05, "x", sea, "SOURCE", 0.19);
        objects.push({ id: "tank_" + i, kind: "tank", label: "Ground storage " + i,
            dataKey: id, position: [0.45, 0, z], size: [1.02, 1.14, 1.02],
            color: "#81b5cb", selectable: true });
        pipe("tank_outlet_" + i, 1.88, 0.53, z, 2.85, "x", clean, id, 0.21);
    }
    pipe("suction_header", 3.3, 0.53, 0, 9.0, "z", clean, undefined, 0.32);
    const boosterZ = [-4, -2.4, -0.8, 0.8, 2.4, 4];
    for (let i = 1; i <= 6; i++) {
        const z = boosterZ[i - 1];
        const id = "BP" + String(i).padStart(2, "0");
        pipe("booster_suction_" + i, 4.26, 0.54, z, 1.92, "x", clean, id, 0.2);
        objects.push({ id: "booster_" + i, kind: "pump", label: "Booster " + i, dataKey: id,
            position: [5.22, 0.06, z], size: [0.75, 0.8, 0.8], selectable: true });
        objects.push({ id: "motor_fan_" + i, kind: "fan", label: "Pump motor cooling fan " + i,
            dataKey: id, position: [5.22, 1.16, z], size: [0.45, 0.45, 0.45],
            color: "#65b8f4", selectable: true,
            animations: [{ kind: "rotate", axis: "z", rpm: 900, rpmField: "rpm", enabledField: "flowgpm" }] });
        pipe("booster_discharge_" + i, 6.21, 0.58, z, 2.02, "x", clean, id, 0.21);
    }
    pipe("discharge_header", 7.23, 0.58, 0, 9.0, "z", clean, undefined, 0.32);
    pipe("distribution_delivery", 8.62, 0.58, 0, 2.78, "x", clean, "DIST", 0.34);
    objects.push({ id: "distribution_meter", kind: "sphere", label: "Distribution meter",
        dataKey: "DIST", position: [9.35, 0.59, 0], size: [0.34, 0.34, 0.34],
        color: "#b9def5", selectable: true });
    for (const item of [
        { id: "CHEM1", x: -5.15, z: -0.9, label: "Source treatment injection" },
        { id: "CHEM2", x: -5.15, z: 3.9, label: "Surface treatment injection" },
    ]) objects.push({ id: item.id, kind: "sphere", label: item.label, dataKey: item.id,
        position: [item.x, 1.15, item.z], size: [0.27, 0.27, 0.27], color: gold, selectable: true,
        animations: [{ kind: "pulse", amplitude: 0.22, period: 1.35, enabledField: "status", enabledValue: "Running" }] });
    objects.push({ id: "quality_monitor", kind: "box", label: "Distribution residual monitor",
        dataKey: "QUALITY", position: [9.35, 1.43, 0.9], size: [0.42, 0.45, 0.28],
        color: "#b4d5dc", selectable: true });
    objects.push({ id: "alarm_beacon", kind: "sphere", label: "Station alarm indicator",
        dataKey: "ALARM", position: [8.6, 1.58, 0.9], size: [0.22, 0.22, 0.22],
        color: "#f5b556", selectable: true,
        animations: [{ kind: "pulse", amplitude: 0.3, period: 1.4, enabledField: "status", enabledValue: "Warning" }] });
    // All pipes remain connected geometrically; omit redundant flow effects
    // on parallel secondary branches to keep primary flow paths responsive.
    for (const object of objects) {
        if (object.kind === "pipe" && /^(well_flow_|tank_inlet_|booster_suction_|local_source_flow)/.test(object.id)) {
            delete object.flowKey;
        }
    }
    if (objects.length > 80) throw new Error("Scene exceeds 80 objects: " + objects.length);
    // The runtime allocates motion slots in scene-object order. Animate the
    // hydraulically meaningful discharge, booster branches, and storage outlet
    // before decorative source branches when the Power BI motion budget fills.
    const priority = (object: Scene3dObject) => {
        const id = object.id;
        if (id === "distribution_delivery") return 0;
        if (id.startsWith("booster_discharge_")) return 1;
        if (id.startsWith("booster_suction_")) return 2;
        if (id.startsWith("tank_outlet_")) return 3;
        if (id === "source_transfer") return 4;
        if (id.startsWith("surface_supply_")) return 5;
        if (id === "local_source_flow") return 6;
        if (id.startsWith("tank_inlet_")) return 7;
        if (id.startsWith("well_flow_")) return 8;
        return 9;
    };
    return objects.sort((a, b) => priority(a) - priority(b));
}

export function waterPumpStationExample(runtime: HyperPbiConfig) {
    const title = "Water Pump Station | Process Digital Twin";
    const rows = exampleRows();
    const objects = sceneObjects();
    const dark = {
        color: ["#31d5bf", "#77b7e5", "#f7ab50"],
        textStyle: { color: "#dce9fa" },
        xAxis: { axisLabel: { color: "#91a7bc" }, axisLine: { lineStyle: { color: "#34445b" } } },
        yAxis: { axisLabel: { color: "#91a7bc" }, splitLine: { lineStyle: { color: "#273a50" } } },
    };
    const targets = ["water_scene", "flow_kpi", "pressure_kpi", "pumps_kpi", "storage_kpi",
        "alerts_kpi", "source_kpi", "flow_history", "pressure_history",
        "booster_load", "storage_levels", "asset_register"];
    const palette = [
        { value: "Running", color: "#31c8a4" }, { value: "Warning", color: "#f7ab50" },
        { value: "Standby", color: "#7789a0" }, { value: "Offline", color: "#d77378" },
    ];
    const scene: Scene3dComponent = {
        type: "scene3d", id: "water_scene", dataset: "snapshots",
        title: "Process route | sources → storage → boosters → distribution",
        objectIdField: "assetid", flowField: "flowgpm", levelField: "levelpct",
        statusField: "status", colorField: "equipmentcolor", statusColors: palette,
        tooltipFields: [{ field: "equipment", label: "Equipment" },
            { field: "status", label: "State" }, { field: "flowgpm", label: "Flow (GPM)" },
            { field: "levelpct", label: "Level (%)" }, { field: "pressurepsi", label: "Pressure (PSI)" },
            { field: "rpm", label: "RPM" }],
        objects, height: 570, theme: "dark", grid: true, shadows: true, showLabels: false,
        showObjectList: true, view: "isometric",
        interaction: {
            enabled: true, trigger: "click", internalMode: "filter", internalScope: "others",
            externalMode: "selection", field: "assetid", selectionMode: "replace",
            multiSelect: true, showSelector: false, clearOnSecondClick: true,
            targets: ["asset_register", "booster_load", "storage_levels"],
        },
    };
    const specification = {
        version: "2.0", title,
        theme: {
            mode: "dark", density: "compact", primaryColor: "#63b6e5", accentColor: "#2dd7bd",
            surfaceColor: "#0d1b2b", textColor: "#e9f4fb", borderColor: "#29415b",
            successColor: "#25bd9e", warningColor: "#efa84e", dangerColor: "#dc6873",
            radius: 12, gap: 10,
        },
        app: {
            enabled: true, layout: "horizontal", container: "fluid", density: "compact",
            brand: { title: "AquaGrid", shortTitle: "AG", subtitle: "Station engineering", icon: "dashboard" },
            navbar: { visible: true },
            pageHeader: {
                visible: true, title: "Water Pump Station | Process Digital Twin",
                subtitle: "Sources • treatment • five storage tanks • six booster pumps • distribution",
                meta: [{ label: "Training model", value: "Synthetic scenarios", intent: "info" }],
            },
        },
        data: { datasets: {
            readings: { source: "powerbi", sort: [{ field: "sampleorder", direction: "descending" }] },
            snapshots: { source: "readings", filter: { field: "recordtype", operator: "=", value: "Snapshot" } },
            boosters: { source: "snapshots", filter: { field: "category", operator: "=", value: "Booster" } },
            storage: { source: "snapshots", filter: { field: "category", operator: "=", value: "Storage" } },
            trends: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Trend" },
                sort: [{ field: "sampleorder", direction: "ascending" }] },
        } },
        styles: {
            globalCss: "\n.hp-app-main,.hp-grid { background:#07121e; }\n.hp-navbar,.hp-page-header { background:#0a1828; border-color:#22384f; }\n.hp-card,.hp-metric,.hp-table-wrap { background:#102237; border-color:#2b4159; box-shadow:0 8px 28px rgb(0 0 0 / 20%); }\n.hp-metric { border:1px solid #29415b; border-left:0; }\n.hp-metric-label { color:#8da9c0; text-transform:none; }\n.hp-metric-value { color:#f0faff; font-size:23px; }\n.hp-table th { background:#122a42; color:#a8c1d3; }\n.hp-card-header { border-color:#2b4159; }\n",
        },
        components: [
            { type: "segmentedControl", id: "operating_scenario", label: "Operating scenario",
                field: "scenario", options: scenarios.map(item => item.name),
                interaction: { internalMode: "filter", targets, externalMode: "none" } },
            { type: "text", id: "process_legend",
                text: "SOURCE NETWORK  →  GROUND STORAGE  →  BOOSTER ARRAY  →  DISTRIBUTION | Teal: raw/source flows • Blue: transfer/discharge • Green: running • Amber: warning. All values are simulated and are not operational guidance." },
            { type: "grid", id: "station_kpis", columns: 12, children: [
                { type: "kpi", id: "flow_kpi", title: "Discharge flow (GPM)", dataset: "snapshots", field: "stationflow", aggregation: "first", span: 2 },
                { type: "kpi", id: "pressure_kpi", title: "Discharge (PSI)", dataset: "snapshots", field: "stationpressure", aggregation: "first", span: 2 },
                { type: "kpi", id: "pumps_kpi", title: "Boosters online", dataset: "snapshots", field: "stationonline", aggregation: "first", span: 2, intent: "success" },
                { type: "kpi", id: "storage_kpi", title: "Mean GST level (%)", dataset: "snapshots", field: "averagelevel", aggregation: "first", span: 2 },
                { type: "kpi", id: "source_kpi", title: "Source intake (GPM)", dataset: "snapshots", field: "sourceflow", aggregation: "first", span: 2 },
                { type: "kpi", id: "alerts_kpi", title: "Active alerts", dataset: "snapshots", field: "stationalerts", aggregation: "first", span: 2, intent: "warning" },
            ] },
            scene,
            { type: "grid", id: "station_trends", columns: 12, children: [
                { type: "lineChart", id: "pressure_history", title: "Distribution pressure · PSI", dataset: "trends",
                    category: "hour", measure: "pressurepsi", aggregation: "avg", span: 6, height: 250,
                    options: dark, interaction: { enabled: false, internalMode: "none", externalMode: "none" } },
                { type: "lineChart", id: "flow_history", title: "Distribution flow · GPM", dataset: "trends",
                    category: "hour", measure: "flowgpm", aggregation: "avg", span: 6, height: 250,
                    options: dark, interaction: { enabled: false, internalMode: "none", externalMode: "none" } },
            ] },
            { type: "grid", id: "equipment_charts", columns: 12, children: [
                { type: "barChart", id: "booster_load", title: "Motor utilization · %", dataset: "boosters",
                    category: "assetid", measure: "motorloadpct", aggregation: "first", span: 7, height: 260,
                    options: dark, interaction: { enabled: true, trigger: "click",
                        internalMode: "highlight", externalMode: "selection", field: "assetid",
                        targets: ["water_scene", "asset_register"] } },
                { type: "barChart", id: "storage_levels", title: "Ground storage levels · %", dataset: "storage",
                    category: "assetid", measure: "levelpct", aggregation: "first", span: 5, height: 260,
                    options: dark, interaction: { enabled: true, trigger: "click",
                        internalMode: "highlight", externalMode: "selection", field: "assetid",
                        targets: ["water_scene", "asset_register"] } },
            ] },
            { type: "table", id: "asset_register", title: "Equipment | scenario snapshot",
                dataset: "snapshots", maxRows: 40,
                columns: [
                    { field: "assetid", title: "Asset" }, { field: "equipment", title: "Equipment" },
                    { field: "category", title: "Class" }, { field: "status", title: "State" },
                    { field: "flowgpm", title: "Flow (GPM)" }, { field: "levelpct", title: "Level (%)" },
                    { field: "pressurepsi", title: "PSI" }, { field: "rpm", title: "RPM" },
                ],
                interaction: { enabled: true, trigger: "click", internalMode: "highlight",
                    externalMode: "selection", field: "assetid", targets: ["water_scene"] } },
            { type: "text", id: "engineering_note",
                text: "Engineering demonstration only. Fictional equipment IDs, modeled flow paths, scenario values, and alarm rules. Not a validated hydraulic model or operating procedure." },
        ],
    };
    const headers = ["readingid", "assetid", "equipment", "category", "scenario", "status", "equipmentcolor",
        "recordtype", "sampleorder", "hour", "flowgpm", "pressurepsi", "levelpct", "rpm", "motorloadpct",
        "stationflow", "stationpressure", "stationonline", "stationalerts", "sourceflow", "averagelevel"];
    return {
        id: "water-pump-station-digital-twin", title,
        useCase: "Water utility process visualization and engineering training",
        summary: "Trace source-water intake, chemical monitoring, five ground storage tanks, and six booster pumps in interactive 3D.",
        description: "A fictionalized 3D water pump station with remote and local source wells, dual surface-water inlets, treatment indicators, five storage tanks, and six booster pumps. Eight simulated operating scenarios drive tank levels, pipe flow, cooling fans, alarms, linked trends, and equipment selection.",
        theme: "dark" as const, accent: "#63b6e5",
        tags: ["3D", "water", "engineering", "SCADA"], referenceImages: [] as number[],
        previewImage: "/images/water-pump-station-digital-twin.svg",
        powerBiPackage: "core" as const,
        expected: "Switch between all eight scenarios: Normal supply, Peak demand, Remote wells offline, Surface inlet unavailable, Booster maintenance, Low storage, Limited power, and Low distribution pressure. Tank fill, pump availability, fan rotation, animated flow, pressure and intake KPIs, linked charts, and the asset register change with the scenario. Selecting an asset cross-highlights associated records.",
        limitations: "Synthetic demonstration based on generalized process relationships, not a literal copy of a real infrastructure diagram. Operating values are invented and must never be used for live controls. The 3D engine supports up to 80 objects, respects reduced-motion preferences, and requires WebGL 2. In Power BI bind readingid as categorical and set numeric columns to Don't summarize.",
        headers, rows, specification,
        runtime: { ...runtime, motion: { ...runtime.motion, maxConcurrentAnimations: 24 } },
    };
}
