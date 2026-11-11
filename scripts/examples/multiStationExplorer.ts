import type { HyperPbiConfig } from "../../src/config/hyperpbiConfig";
import type { Scene3dDefinition, Scene3dKind, Scene3dObject, Scene3dVector } from "../../src/schema/scene3dSchema";

type Row = Record<string, string | number | boolean | null>;
const stations = [
    { id: "GW-001", name: "Groundwater Station 01", type: "Single well · disinfection", location: "Alder Basin North", lat: 44.172, lon: -134.086 },
    { id: "GW-002", name: "Groundwater Station 02", type: "Twin wells · filtration", location: "Juniper Bench", lat: 44.145, lon: -134.022 },
    { id: "RP-001", name: "Repump Station 01", type: "Storage · pressure boosting", location: "Cedar Intertie", lat: 44.108, lon: -134.056 },
] as const;

const colors = { raw: "#4da996", treated: "#469cdc", storage: "#7996a7", steel: "#a7b4be", chlorine: "#d5b363", ammonia: "#b998d6" };
const point = (x: number, y: number, z: number): Scene3dVector => [x, y, z];
const round = (value: number) => Number(value.toFixed(3));

function stationScene(index: number): Scene3dDefinition {
    const objects: Scene3dObject[] = [];
    const add = (id: string, kind: Scene3dKind, position: Scene3dVector, size: Scene3dVector, color: string, extra?: Partial<Scene3dObject>) =>
        objects.push({ id, kind, position, size, color, ...extra });
    const pipe = (id: string, from: Scene3dVector, to: Scene3dVector, color: string, flowKey?: string, width = 0.21) => {
        const [x, y, z] = to.map((value, axis) => value - from[axis]);
        const length = Math.hypot(x, y, z);
        const rotation: Scene3dVector = [round(Math.atan2(z, y) * 180 / Math.PI), 0, round(-Math.asin(x / length) * 180 / Math.PI)];
        add(id, "pipe", from.map((value, axis) => round((value + to[axis]) / 2)) as Scene3dVector,
            [width, round(length), width], color, { rotation, flowKey });
    };
    const valve = (id: string, x: number, y: number, z: number) => {
        add(id, "sphere", point(x, y, z), point(.42, .32, .33), colors.steel);
        add(id + "stem", "cylinder", point(x, y + .19, z), point(.1, .34, .1), colors.steel);
        add(id + "wheel", "cylinder", point(x, y + .38, z), point(.36, .06, .36), "#dfa55a");
    };
    const chemical = (id: string, label: string, x: number, z: number, tapZ: number, color: string) => {
        add(id, "cylinder", point(x, .62, z), point(.66, 1.2, .66), color, { label, selectable: true });
        add(id + "skid", "box", point(x + .6, .22, z), point(.42, .42, .46), "#506678");
        pipe(id + "dose", point(x + .6, .43, z), point(x + .6, .43, tapZ), color, undefined, .09);
        if (tapZ !== z) pipe(id + "riser", point(x + .6, .43, tapZ), point(x + .6, .75, tapZ), color, undefined, .09);
    };
    const tank = (id: string, label: string, x: number, z: number, size: number) =>
        add(id, "tank", point(x, 0, z), point(size, .98, size), colors.storage, { label, dataKey: id });

    const repump = index === 2;
    const twin = index === 1;
    const headerX = repump ? -2.7 : 0;
    const dischargeX = repump ? 5.4 : 5;
    const branches = repump ? [-3, 0, 3] : twin ? [-1.9, 1.9] : [0];
    const headerStart = repump ? -4.3 : twin ? -2.8 : 0;
    const headerEnd = repump ? 4.4 : twin ? 2.8 : 0;
    if (repump) {
        tank("storageA", "Ground storage A", -7.7, -3, 1.63);
        tank("storageB", "Ground storage B", -7.7, 3, 1.63);
        for (const [i, z] of [-3, 3].entries()) {
            const feed = `intake${i + 1}`;
            pipe(`tankFeed${i}`, point(-11, .75, z), point(-9.2, .75, z), colors.treated, feed);
            pipe(`tankDraw${i}`, point(-6.2, .75, z), point(headerX, .75, z), colors.treated, feed);
            valve(`tankValve${i}`, -4.65, .75, z);
        }
    } else {
        const wellPositions = twin ? [-3.5, 3.5] : [0];
        for (const [i, z] of wellPositions.entries()) {
            const feed = `intake${i + 1}`;
            add(`well${i}`, "cylinder", point(-9.3, .67, z), point(.78, 1.34, .78), colors.raw, { label: `Well ${i + 1}`, selectable: true });
            pipe(`wellFeed${i}`, point(-8.9, .75, z), point(twin ? -6.8 : -3.4, .75, z), colors.raw, feed);
            if (twin) {
                add(`filter${i}`, "cylinder", point(-6.5, .83, z), point(.95, 1.66, .95), "#57778d", { label: `Pressure filter ${i + 1}`, selectable: true });
                pipe(`filterOutlet${i}`, point(-6.1, .75, z), point(-4.5, .75, z), colors.treated, feed);
                pipe(`clearwellFeed${i}`, point(-4.5, .75, z), point(-4.5, .75, 0), colors.treated, feed);
            }
        }
        if (twin) pipe("treatedInlet", point(-4.5, .75, 0), point(-3.45, .75, 0), colors.treated, "inlet");
        chemical("chlorine", "Chlorine dosing", twin ? -4.7 : -6.8, 1.65, 0, colors.chlorine);
        tank("storageA", twin ? "Treated-water clearwell" : "Contact tank", -2.4, 0, 1.1);
        pipe("storageOutlet", point(-1.45, .75, 0), point(headerX, .75, 0), colors.treated, "inlet");
    }

    if (headerEnd !== headerStart) pipe("suctionHeader", point(headerX, .75, headerStart), point(headerX, .75, headerEnd), colors.treated);
    const pumpX = repump ? .25 : 2;
    for (const [i, z] of branches.entries()) {
        const id = `booster${i + 1}`;
        pipe(id + "suction", point(headerX, .75, z), point(pumpX - .86, .75, z), colors.treated, id);
        valve(id + "isolation", (headerX + pumpX - .86) / 2, .75, z);
        add(id, "pump", point(pumpX, 0, z), point(1, 1, 1), colors.treated, { label: `Booster ${i + 1}`, dataKey: id });
        const outletX = pumpX - .59;
        pipe(id + "riser", point(outletX, 1.33, z), point(outletX, 1.8, z), colors.treated, id);
        pipe(id + "discharge", point(outletX, 1.8, z), point(dischargeX, 1.8, z), colors.treated, id);
        add(id + "fan", "fan", point(pumpX + .74, .75, z), point(.58, .58, .58), colors.steel, {
            rotation: [0, 90, 0], dataKey: id, selectable: false,
            animations: [{ kind: "rotate", axis: "z", enabledField: "equipmentstatus", enabledValue: "Running", rpmField: "rpm" }],
        });
    }
    const outletZ = branches[0];
    if (branches.length > 1) pipe("dischargeHeader", point(dischargeX, 1.8, branches.at(-1)!), point(dischargeX, 1.8, outletZ), colors.treated, "distribution");
    pipe("outletDrop", point(dischargeX, 1.8, outletZ), point(dischargeX, .75, outletZ), colors.treated, "distribution");
    pipe("distribution", point(dischargeX, .75, outletZ), point(11.4, .75, outletZ), colors.treated, "distribution");
    valve("outletValve", 9.5, .75, outletZ);
    add("flowmeter", "cylinder", point(8.65, .75, outletZ), point(.43, .5, .43), colors.steel, { rotation: [0, 0, 90], label: "Distribution flowmeter", selectable: true });
    if (repump) {
        chemical("chlorine", "Chlorine injection", 5.65, -5.3, outletZ, colors.chlorine);
        chemical("ammonia", "Ammonia injection", 7.1, -5.3, outletZ, colors.ammonia);
    }
    // Prioritize the distribution run when the motion budget is full.
    const distribution = objects.findIndex(object => object.id === "distribution");
    objects.unshift(...objects.splice(distribution, 1));

    return {
        objects, objectIdField: "assetid", levelField: "levelpct", flowField: "flowgpm", statusField: "equipmentstatus",
        statusColors: [{ value: "Running", color: "#4dbe9e" }, { value: "Standby", color: "#70849a" }, { value: "Unknown", color: "#96a4b3" }],
        tooltipFields: [{ field: "flowgpm", label: "Flow (gpm)" }, { field: "rpm", label: "Motor (rpm)" }],
        view: twin ? "top" : "isometric",
    };
}

export function multiStationExplorer(runtime: HyperPbiConfig) {
    const days = 8;
    const title = "Multi-Station 3D Explorer";
    const rows: Row[] = [];
    for (const [index, station] of stations.entries()) {
        const base = { stationid: station.id };
        rows.push({ ...base, recordtype: "Scene", stationname: station.name, stationtype: station.type, location: station.location,
            latitude: station.lat, longitude: station.lon, scenejson: JSON.stringify(stationScene(index)) });
        for (let day = 1; day <= days; day++) {
            const missing = index === 1 && day === days - 1;
            rows.push({ ...base, recordtype: "Daily", day, reportdate: `2026-10-0${day}`, pumpagemgd: missing ? null : round(1.15 + index * 1.92 + ((day * 13 + index * 7) % 11) / 18),
                availability: missing ? "No data" : "Synthetic daily reading" });
            // Simulated equipment readings are independently generated for this reporting day.
            const equipment = (assetid: string, readings: Row) => rows.push({ ...base, recordtype: "Equipment", day, assetid, ...readings });
            equipment("storageA", { levelpct: 61 + (day * 3 + index * 7) % 22 });
            if (index === 2) equipment("storageB", { levelpct: 54 + day * 2 });
            let distribution = 0;
            for (let pump = 1; pump <= index + 1; pump++) {
                if (missing) continue;
                const running = pump === 1 || (day + pump) % 3 !== 0;
                const flowgpm = running ? 430 + pump * 120 + day * 11 : 0;
                distribution += flowgpm;
                equipment(`booster${pump}`, { equipmentstatus: running ? "Running" : "Standby", rpm: running ? 1120 + 8 * day : 0, flowgpm });
            }
            if (!missing) {
                const northIntake = index === 0 ? distribution : Math.round(distribution * .54);
                equipment("intake1", { flowgpm: northIntake });
                if (index !== 0) equipment("intake2", { flowgpm: distribution - northIntake });
                equipment("inlet", { flowgpm: distribution });
                equipment("distribution", { flowgpm: distribution });
            }
        }
    }
    const disabled = { enabled: false, externalMode: "none" };
    const stationInteraction = {
        field: "stationid", stateKey: "selectedStationId", internalMode: "filter", externalMode: "none", multiSelect: false,
        targets: ["station_profile", "station_scene", "daily_pumpage", "daily_availability", "station_history"],
    };
    const specification = {
        version: "2.0", title,
        theme: { mode: "dark", accentColor: "#72c9e8", gap: 14, radius: 12, cardPadding: 16 },
        data: { datasets: {
            scenes: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Scene" }, select: ["stationid", "scenejson"] },
            stations: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Scene" },
                select: ["stationid", "stationname", "stationtype", "location", "latitude", "longitude"] },
            daily: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Daily" }, sort: [{ field: "day", direction: "asc" }] },
            history: { source: "daily", filter: { field: "availability", operator: "=", value: "Synthetic daily reading" } },
            equipment: { source: "powerbi", filter: { field: "recordtype", operator: "=", value: "Equipment" },
                select: ["stationid", "day", "assetid", "equipmentstatus", "rpm", "levelpct", "flowgpm"] },
        } },
        components: [
            { type: "markdown", id: "station_intro", text: "# Multi-Station 3D Explorer\nAlder Basin Water · Synthetic facility layouts and operating data" },
            { type: "select", id: "station_picker", dataset: "stations", label: "Station", field: "stationid", defaultValue: stations[0].id, span: 6,
                options: stations.map(station => ({ label: station.name, value: station.id })), interaction: stationInteraction },
            { type: "slider", id: "reporting_day", label: "October 2026 · reporting day", field: "day", min: 1, max: days, step: 1, defaultValue: days, span: 6,
                interaction: { field: "day", stateKey: "reportingDay", internalMode: "filter", externalMode: "none",
                    targets: ["daily_pumpage", "daily_availability", "station_scene"] } },
            { type: "statList", id: "station_profile", dataset: "stations", title: "Facility profile", span: 6,
                items: [{ label: "Station", field: "stationname" }, { label: "Process", field: "stationtype" }, { label: "District", field: "location" }] },
            { type: "kpi", id: "daily_pumpage", dataset: "daily", title: "Daily pumpage · MGD", field: "pumpagemgd", span: 3 },
            { type: "statList", id: "daily_availability", dataset: "daily", title: "Daily reading", span: 3,
                items: [{ label: "Availability", field: "availability" }, { label: "Date", field: "reportdate" }] },
            { type: "scene3d", id: "station_scene", title: "Process layout", dataset: "equipment", height: 510, span: 8, showLabels: true, showObjectList: true,
                sceneBinding: { mode: "data", dataset: "scenes", keyField: "stationid", sceneField: "scenejson", selectedKeyState: "selectedStationId" },
                interaction: { internalMode: "none", externalMode: "none" } },
            { type: "map", id: "station_map", title: "Alder Basin · station locations", height: 510, span: 4, basemap: { type: "none" },
                css: ".hp-leaflet-container,.hp-map-viewport-clip { background-color: #152b3d }",
                view: { center: [44.14, -134.054], zoom: 12, fitMode: "none" },
                toolbar: { visible: true, home: true, zoomIn: true, zoomOut: true }, interaction: stationInteraction,
                layers: [
                    { id: "district", name: "Fictional service area", source: { type: "geoJson", data: { type: "FeatureCollection", features: [
                        { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[
                            [-134.112, 44.154], [-134.084, 44.187], [-134.004, 44.168], [-133.995, 44.126],
                            [-134.038, 44.092], [-134.096, 44.109], [-134.112, 44.154],
                        ]] } },
                    ] } }, renderer: { type: "simple", symbol: { fillColor: "#52758c", fillOpacity: .22, outlineColor: "#62859a", outlineWidth: 1 } },
                    popup: { mode: "none" }, interaction: disabled },
                    { id: "facilities", name: "Stations", dataset: "stations",
                        source: { type: "powerbi", bindings: { latitude: "latitude", longitude: "longitude" } },
                        renderer: { type: "simple", symbol: { shape: "circle", fillColor: "#62aee9", fillOpacity: .85, outlineColor: "#e5f3fa", outlineWidth: 2, size: 16 } },
                        labels: { enabled: true, field: "stationid", placement: "right", size: 12, color: "#d7eaf4" },
                        tooltip: { enabled: true, template: "{{powerbi.stationname}} · {{powerbi.location}}" }, popup: { mode: "none" } },
                ] },
            { type: "table", id: "station_register", dataset: "stations", title: "Find a station", ariaLabel: "Searchable station register", span: 5,
                search: true, pagination: false, maxRows: 10, interaction: stationInteraction,
                columns: [{ field: "stationname", title: "Station" }, { field: "location", title: "District" }] },
            { type: "lineChart", id: "station_history", dataset: "history", title: "Daily pumpage history · available days · MGD", span: 7, height: 260,
                category: "reportdate", measure: "pumpagemgd", aggregation: "first",
                options: { color: ["#72c9e8"], series: [{ connectNulls: false, symbolSize: 7, lineStyle: { width: 3 }, areaStyle: { opacity: .13 } }] }, interaction: disabled },
            { type: "text", id: "station_legend", text: "Teal pipes carry raw water. Blue pipes carry treated water. Amber and violet lines mark chlorine and ammonia injection. Moving bands show flow from the simulated equipment readings." },
        ],
    };
    return {
        id: "multi-station-3d-explorer", title, useCase: "Water utility facility exploration",
        summary: "Switch among three facilities in one 3D viewer and explore station-specific pumpage and equipment readings.",
        description: "A fictional water utility operates two groundwater stations and a storage and repump facility. The station map and searchable register share one selection, and the reporting day updates measurements in place.",
        theme: "dark" as const, accent: "#72c9e8", tags: ["3D", "utilities", "SceneJSON"], referenceImages: [],
        previewImage: "/images/multi-station-3d-explorer.webp",
        powerBiPackage: "core" as const,
        expected: "Choose a station with the dropdown, searchable register, or map. The selected station appears in the profile and one 3D viewer. All map markers remain visible. Move the reporting-day slider to change pumpage, flow, equipment status, and tank levels while the layout and camera stay in place. Groundwater Station 02 has no pumpage or booster readings on October 7.",
        limitations: "The CSV combines three record types in the one Power BI Values table. Scene rows contain geometry, while Daily and Equipment rows contain separate synthetic readings. The history chart includes only days with a reading. Set identifiers, SceneJSON, and the reporting date to Text, and numeric columns to Don't summarize. No network is required. The district and station coordinates are fictional.",
        headers: ["recordtype", "stationid", "stationname", "stationtype", "location", "latitude", "longitude", "scenejson",
            "day", "reportdate", "pumpagemgd", "availability", "assetid", "equipmentstatus", "rpm", "levelpct", "flowgpm"],
        rows, specification, runtime,
    };
}
