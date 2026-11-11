import type { HyperPbiConfig } from "../../src/config/hyperpbiConfig";
import type { Scene3dComponent, Scene3dObject, Scene3dVector } from "../../src/schema/scene3dSchema";

type Row = Record<string, string | number | boolean | null>;
const round = (value: number, digits = 0) => Number(value.toFixed(digits));
const scenarios = [
    { name: "Normal supply", demand: 16100, pressure: 64, remote: 1, local: 1, surface: 1, level: 76, pumps: [1, 2, 3, 4], alerts: 0 },
    { name: "Peak demand", demand: 23400, pressure: 67, remote: 1.18, local: 1.15, surface: 1.2, level: 68, pumps: [1, 2, 3, 4, 5, 6], alerts: 0 },
    { name: "Remote wells offline", demand: 12900, pressure: 57, remote: 0, local: 1, surface: 1.25, level: 56, pumps: [1, 2, 4, 5], alerts: 1 },
    { name: "Surface inlet unavailable", demand: 11700, pressure: 55, remote: 1.05, local: 1, surface: 0, level: 59, pumps: [1, 2, 3, 5], alerts: 1 },
    { name: "Booster maintenance", demand: 15600, pressure: 62, remote: 1, local: 1, surface: 1, level: 70, pumps: [1, 2, 4, 5], alerts: 0 },
    { name: "Low storage", demand: 9700, pressure: 50, remote: 0.85, local: 1, surface: 0.85, level: 26, pumps: [1, 3, 5], alerts: 2 },
    { name: "Limited power", demand: 8600, pressure: 51, remote: 0.45, local: 0, surface: 0.9, level: 61, pumps: [1, 3], alerts: 1 },
    { name: "Low distribution pressure", demand: 8200, pressure: 43, remote: 1, local: 1, surface: 1, level: 64, pumps: [1, 2], alerts: 2 },
] as const;

function exampleRows(): Row[] {
    const rows: Row[] = [];
    scenarios.forEach((mode, caseIndex) => {
        const source: Array<{ assetid: string; equipment: string; category: string; flow: number }> = [];
        for (let well = 1; well <= 8; well++) source.push({
            assetid: "RW" + String(well).padStart(2, "0"),
            equipment: "Remote well " + well, category: "Remote well",
            flow: Math.round((390 + well * 37) * mode.remote),
        });
        source.push({ assetid: "LW01", equipment: "On-site source well", category: "Local well", flow: Math.round(680 * mode.local) });
        for (let surface = 1; surface <= 2; surface++) source.push({
            assetid: "SW" + surface, equipment: "Surface inlet " + surface, category: "Surface inlet",
            flow: Math.round((4300 + surface * 350) * mode.surface),
        });
        const intake = source.reduce((sum, item) => sum + item.flow, 0);
        const online = mode.pumps.length;
        const itemRows: Row[] = source.map(item => ({
            assetid: item.assetid, equipment: item.equipment, category: item.category,
            status: item.flow ? "Running" : "Offline", flowgpm: item.flow, pressurepsi: 0,
            levelpct: 0, rpm: 0, motorloadpct: 0, equipmentcolor: item.flow ? "#35d4be" : "#72849b",
        }));
        for (let i = 1; i <= 5; i++) {
            const level = Math.max(8, Math.min(95, mode.level + (i - 3) * 3));
            itemRows.push({
                assetid: "GST" + i, equipment: "Storage tank " + i, category: "Storage",
                status: level < 35 ? "Warning" : "Running", flowgpm: Math.round(mode.demand / 5),
                pressurepsi: 0, levelpct: level, rpm: 0, motorloadpct: 0,
                equipmentcolor: level < 35 ? "#f7ac51" : "#76b6d2",
            });
        }
        const pumpWeights = [1, 0.95, 1.06, 1.03, 0.98, 1.08];
        const totalWeight = mode.pumps.reduce((sum, pump) => sum + pumpWeights[pump - 1], 0);
        for (let pump = 1; pump <= 6; pump++) {
            const running = mode.pumps.includes(pump as never);
            const flow = running ? Math.round(mode.demand * pumpWeights[pump - 1] / totalWeight) : 0;
            const warning = running && (mode.pressure < 48 || mode.level < 30);
            itemRows.push({
                assetid: "BP" + String(pump).padStart(2, "0"), equipment: "Booster pump " + pump,
                category: "Booster", status: warning ? "Warning" : running ? "Running" : "Standby",
                flowgpm: flow, pressurepsi: running ? mode.pressure : 0,
                levelpct: 0, rpm: running ? Math.round(1080 + 280 * flow / 6000) : 0,
                motorloadpct: running ? Math.min(98, Math.round(58 + flow / 170)) : 0,
                equipmentcolor: warning ? "#ffa94d" : running ? "#31c8a4" : "#7789a0",
            });
        }
        for (const item of [
            { assetid: "SOURCE", equipment: "Source collection", category: "Header", flowgpm: intake, pressurepsi: 0 },
            { assetid: "SUCTION", equipment: "Storage suction header", category: "Header", flowgpm: mode.demand, pressurepsi: 18 },
            { assetid: "DISCHARGE", equipment: "Booster discharge header", category: "Header", flowgpm: mode.demand, pressurepsi: mode.pressure },
            { assetid: "DIST", equipment: "Distribution interface", category: "Distribution", flowgpm: mode.demand, pressurepsi: mode.pressure },
            { assetid: "CHEM1", equipment: "Source chemical dosing", category: "Treatment", flowgpm: 0, pressurepsi: 0 },
            { assetid: "CHEM2", equipment: "Surface chemical dosing", category: "Treatment", flowgpm: 0, pressurepsi: 0 },
            { assetid: "QUALITY", equipment: "Residual analyzer", category: "Monitoring", flowgpm: 0, pressurepsi: 0 },
            { assetid: "ALARM", equipment: "Station alarm indicator", category: "Monitoring", flowgpm: 0, pressurepsi: 0 },
        ]) itemRows.push({
            ...item, status: item.assetid === "ALARM" ? (mode.alerts ? "Warning" : "Standby") :
                item.assetid === "CHEM1" ? (intake ? "Running" : "Standby") :
                item.assetid === "CHEM2" ? (mode.surface ? "Running" : "Standby") :
                item.assetid === "QUALITY" ? "Running" : item.flowgpm ? "Running" : "Standby",
            levelpct: 0, rpm: 0, motorloadpct: 0,
            equipmentcolor: item.assetid === "ALARM" && mode.alerts ? "#ffa94d" : "#76b6d2",
        });
        const tanks = itemRows.filter(item => item.category === "Storage");
        const averageLevel = Math.round(tanks.reduce((sum, item) => sum + Number(item.levelpct), 0) / tanks.length);
        for (const item of itemRows) {
            const common: Row = {
                ...item, scenario: mode.name,
                stationflow: mode.demand, stationpressure: mode.pressure,
                stationonline: online, stationalerts: mode.alerts,
                sourceflow: intake, averagelevel: averageLevel,
            };
            rows.push({ ...common, readingid: String(caseIndex) + "-" + String(item.assetid) + "-snapshot",
                recordtype: "Snapshot", sampleorder: 1000 - caseIndex, hour: "Snapshot" });
            if (item.assetid === "DIST") {
                for (let hour = 0; hour < 9; hour++) rows.push({
                    ...common, recordtype: "Trend", readingid: String(caseIndex) + "-DIST-" + hour,
                    sampleorder: hour, hour: String(hour + 7).padStart(2, "0") + ":00",
                    pressurepsi: round(mode.pressure + Math.sin(hour * 0.7 + caseIndex) * 1.4, 1),
                    flowgpm: Math.round(mode.demand * (0.94 + 0.08 * Math.sin(hour * 0.42))),
                });
            }
        }
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
        runtime: { ...runtime, motion: { ...runtime.motion, maxConcurrentAnimations: 30 } },
    };
}
