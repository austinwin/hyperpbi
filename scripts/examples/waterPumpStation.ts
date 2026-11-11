import type { HyperPbiConfig } from "../../src/config/hyperpbiConfig";
import { scene3dLimits, type Scene3dComponent, type Scene3dObject, type Scene3dVector } from "../../src/schema/scene3dSchema";

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
    const raw = "#2bbfb9", surface = "#47add8", treated = "#458ccb";
    const chlorine = "#efb451", ammonia = "#aa8fe8", instrument = "#8ed9e6";
    const pipe = (id: string, path: Scene3dVector[], color: string, flowKey?: string, diameter = 0.19) => {
        objects.push({ id, kind: "pipe", path, diameter, color, metalness: 0.44,
            ...(flowKey ? { flowKey } : {}), selectable: false });
    };
    const remoteWells = ["W01A", "W03A", "W03SB", "W04A", "W05A", "W08", "W11", "W10"];
    remoteWells.forEach((id, index) => {
        const z = -5.6 + index * 0.95;
        objects.push({ id: "well_" + id, kind: "well", label: "Remote " + id,
            dataKey: id, position: [-11.2, 0, z], size: [0.64, 0.7, 0.64],
            color: raw, valueField: "flowgpm", valueUnit: "GPM" });
        objects.push({ id: "meter_" + id, kind: "flowmeter", label: "FM · " + id,
            dataKey: "FM-" + id, position: [-9.45, 0, z], size: [0.66, 0.68, 0.66],
            color: instrument, valueField: "flowgpm", valueUnit: "GPM" });
        pipe("remote_branch_" + id, [[-10.9, 0.52, z], [-7.2, 0.52, z]], raw, id, 0.16);
    });
    pipe("remote_collector", [[-7.2, 0.52, -5.6], [-7.2, 0.52, 1.05]], raw, "REMOTE", 0.29);
    pipe("remote_transfer", [[-7.2, 0.52, 1.05], [-2.4, 0.52, 1.05]], raw, "REMOTE", 0.27);
    for (const [id, x] of [["CL2-R1", -6.2], ["CL2-R2", -5.0]] as const) {
        objects.push({ id: "skid_" + id, kind: "injector", label: id + " · chlorine",
            dataKey: id, position: [x, 0.04, 1.76], size: [0.60, 0.67, 0.60],
            color: chlorine, valueField: "dosemgL", valueUnit: "mg/L" });
    }
    objects.push({ id: "well_W09", kind: "well", label: "On-site W09",
        dataKey: "W09", position: [-11.2, 0, 3.0], size: [0.64, 0.7, 0.64],
        color: raw, valueField: "flowgpm", valueUnit: "GPM" });
    objects.push({ id: "meter_W09", kind: "flowmeter", label: "FM · W09",
        dataKey: "FM-W09", position: [-9.45, 0, 3.0], size: [0.66, 0.68, 0.66],
        color: instrument, valueField: "flowgpm", valueUnit: "GPM" });
    pipe("onsite_inlet", [[-10.9, 0.52, 3], [-2.4, 0.52, 3]], raw, "W09", 0.2);
    objects.push({ id: "skid_CL2W09", kind: "injector", label: "W09 chlorine injection",
        dataKey: "CL2-W09", position: [-6.15, 0.04, 3.72], size: [0.6, 0.67, 0.6],
        color: chlorine, valueField: "dosemgL", valueUnit: "mg/L" });
    objects.push({ id: "skid_NH3W09", kind: "injector", label: "W09 ammonia injection",
        dataKey: "NH3-W09", position: [-4.9, 0.04, 3.72], size: [0.6, 0.67, 0.6],
        color: ammonia, valueField: "dosemgL", valueUnit: "mg/L" });
    for (let source = 1; source <= 2; source++) {
        const z = source === 1 ? 5.4 : 7.35, id = "SW" + source;
        objects.push({ id: "valve_" + id, kind: "valve", label: id + " inlet valve",
            dataKey: id, position: [-10.55, 0, z], size: [0.7, 0.7, 0.7],
            color: surface, openingField: "valveopenpct",
            valueField: "flowgpm", valueUnit: "GPM" });
        objects.push({ id: "meter_" + id, kind: "flowmeter", label: "FM · " + id,
            dataKey: "FM-" + id, position: [-9.18, 0, z], size: [0.69, 0.69, 0.69],
            color: instrument, valueField: "flowgpm", valueUnit: "GPM" });
        objects.push({ id: "analyzer_" + id, kind: "analyzer", label: id + " chlorine analyzer",
            dataKey: "AN-" + id, position: [-7.75, 0.03, z + 0.8],
            size: [0.55, 0.6, 0.55], color: instrument,
            valueField: "cl2mgL", valueUnit: "mg/L" });
        objects.push({ id: "skid_CL2_" + id, kind: "injector", label: id + " chlorine injection",
            dataKey: "CL2-" + id, position: [-6.1, 0.04, z + 0.72],
            size: [0.55, 0.64, 0.55], color: chlorine,
            valueField: "dosemgL", valueUnit: "mg/L" });
        objects.push({ id: "skid_NH3_" + id, kind: "injector", label: id + " ammonia injection",
            dataKey: "NH3-" + id, position: [-4.9, 0.04, z + 0.72],
            size: [0.55, 0.64, 0.55], color: ammonia,
            valueField: "dosemgL", valueUnit: "mg/L" });
        pipe("surface_inlet_" + id, [[-11.05, 0.52, z], [-2.4, 0.52, z]], surface, id, 0.25);
    }
    // Shared tank inlet is physically separate from the storage suction header.
    pipe("tank_fill_header", [[-2.4, 0.52, -5.3], [-2.4, 0.52, 7.35]], raw, undefined, 0.35);
    for (let tank = 1; tank <= 5; tank++) {
        const z = [-5.3, -2.65, 0, 2.65, 5.3][tank - 1];
        pipe("gst_fill_" + tank, [[-2.4, 0.52, z], [-0.94, 0.52, z]], raw, "IN-GST" + tank, 0.23);
        objects.push({ id: "tank_" + tank, kind: "tank", label: "GST-" + tank,
            dataKey: "GST" + tank, position: [0, 0, z], size: [0.96, 0.98, 0.96],
            color: "#7fb9cb", valueField: "levelpct", valueUnit: "%" });
        pipe("gst_draw_" + tank, [[0.94, 0.52, z], [2.4, 0.52, z]], treated, "OUT-GST" + tank, 0.23);
    }
    pipe("suction_header", [[2.4, 0.52, -5.6], [2.4, 0.52, 5.6]], treated, undefined, 0.36);
    for (let pump = 1; pump <= 6; pump++) {
        const z = [-5.6, -3.36, -1.12, 1.12, 3.36, 5.6][pump - 1];
        const id = "BP" + String(pump).padStart(2, "0");
        pipe("booster_suction_" + id, [[2.4, 0.52, z], [4.60, 0.52, z]], treated, id, 0.26);
        objects.push({ id: "pump_" + id, kind: "pump", label: "Booster " + id,
            dataKey: id, position: [5.30, 0, z], size: [0.9, 0.82, 0.9],
            color: "#6b9fb8", valueField: "flowgpm", valueUnit: "GPM",
            motorRpmField: "rpm" });
        pipe("booster_discharge_" + id, [[5.99, 0.62, z], [8.35, 0.62, z]], treated, id, 0.26);
    }
    pipe("discharge_header", [[8.35, 0.62, -5.6], [8.35, 0.62, 5.6]], treated, undefined, 0.42);
    pipe("distribution_delivery", [[8.35, 0.62, 0], [11.2, 0.62, 0]], treated, "DIST", 0.39);
    pipe("distribution_sample", [[10.15, 0.62, 0], [10.15, 0.78, 1.1]], "#8aaeb9", undefined, 0.09);
    objects.push({ id: "analyzer_distribution", kind: "analyzer",
        label: "Distribution Cl2 / NH3 analyzer", dataKey: "AN-DIST",
        position: [10.15, 0.04, 1.42], size: [0.65, 0.68, 0.65],
        color: instrument, valueField: "cl2mgL", valueUnit: "mg/L" });
    // Prefer flow animation on outlet/booster lines before secondary well branches,
    // without changing their real upstream-to-downstream geometry.
    const priority = (object: Scene3dObject) =>
        object.id === "distribution_delivery" ? 0 :
        object.id.startsWith("booster_discharge_") ? 1 :
        object.id.startsWith("booster_suction_") ? 2 :
        object.id.startsWith("gst_draw_") ? 3 :
        object.id.startsWith("gst_fill_") ? 4 :
        object.id.startsWith("surface_inlet_") ? 5 :
        object.id === "onsite_inlet" ? 6 :
        object.id.startsWith("remote_") ? 7 : 8;
    if (objects.length > scene3dLimits.objects) throw new Error("Too many equipment objects: " + objects.length);
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
