// Deploy this file as the public hyperpbi-dynamic-demo MiniUp Function.
const stations = {
  1024: { name: "North pressure station", baseline: 63, zone: "North Loop", operator: "Distribution A", note: "Regulator inspection due Friday." },
  1025: { name: "River pressure station", baseline: 54, zone: "East River", operator: "Distribution B", note: "Monitor the evening demand dip." },
  1026: { name: "West pressure station", baseline: 69, zone: "West Loop", operator: "Distribution C", note: "Telemetry battery replaced this week." },
};

const assets = {
  "P-204": { name: "Intake pump 204", zone: "North Loop", priority: "High", hours: 14, crew: "Mechanical A", work: "Inspect seal vibration" },
  "V-118": { name: "Isolation valve 118", zone: "East River", priority: "Normal", hours: 6, crew: "Distribution B", work: "Exercise actuator" },
  "M-307": { name: "Flow meter 307", zone: "West Loop", priority: "Normal", hours: 4, crew: "Instrumentation", work: "Check calibration drift" },
  "P-209": { name: "Booster pump 209", zone: "North Loop", priority: "High", hours: 9, crew: "Mechanical C", work: "Replace inlet strainer" },
};

const fragment = (title, datasets, components) => ({ kind: "hyperpbi.fragment", version: "1.0", title, datasets, components });
const kpi = (id, title, dataset, field) => ({ type: "kpi", id, title, dataset, field, aggregation: "first", format: "0.0" });
const table = (id, title, dataset, columns, pageSize = 4) => ({ type: "table", id, title, dataset, columns: columns.map(([field, title]) => ({ field, title })), pageSize });

function sensor(id, station) {
  const pressure = Array.from({ length: 24 }, (_, hour) => ({
    time: `${String(hour).padStart(2, "0")}:00`,
    psi: Number((station.baseline + 3 * Math.sin(hour / 3 + Number(id)) + 2 * Math.cos(hour / 2)).toFixed(1)),
  }));
  const current = [{ psi: pressure.at(-1).psi, zone: station.zone, operator: station.operator, note: station.note }];
  return fragment(`Sensor ${id} · ${station.name}`, { current, pressure }, [
    kpi("current_pressure", "Current pressure (psi)", "current", "psi"),
    { type: "lineChart", id: "pressure_history", title: "Pressure history · 24 hours", dataset: "pressure", category: "time", measure: "psi", height: 240,
      chartStyle: { zoom: true, tooltip: true, yAxis: [{ domain: "auto", suffix: " psi" }] }, events: { zoom: { enabled: true } },
      options: { toolbox: { feature: { restore: {} } } } },
    table("measurements", "Measurements", "pressure", [["time", "Hour"], ["psi", "Pressure (psi)"]]),
    table("operations", "Station operations", "current", [["zone", "Zone"], ["operator", "Crew"], ["note", "Next action"]]),
  ]);
}

function asset(id, record) {
  const tasks = [{ task: record.work, status: "Scheduled" }, { task: "Verify return to service", status: "Pending" }];
  return fragment(`${id} · ${record.name}`, { asset: [record], tasks }, [
    kpi("labor", "Planned labor (hours)", "asset", "hours"),
    table("assignment", "Assignment", "asset", [["zone", "Zone"], ["priority", "Priority"], ["crew", "Crew"]]),
    table("tasks", "Work plan", "tasks", [["task", "Task"], ["status", "Status"]]),
  ]);
}

function backlog(priority) {
  const work = Object.entries(assets).filter(([, record]) => !priority || record.priority === priority)
    .map(([asset_id, record]) => ({ asset_id, ...record }));
  const totals = [{ hours: work.reduce((sum, item) => sum + item.hours, 0) }];
  return fragment(`${priority || "All priorities"} · Workload`, { totals, work }, [
    kpi("backlog_hours", "Total planned labor (hours)", "totals", "hours"),
    { type: "barChart", id: "hours_by_asset", title: "Labor by asset", dataset: "work", category: "asset_id", measure: "hours", height: 220, chartStyle: { tooltip: true } },
  ]);
}

export default {
  async fetch(request) {
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Cache-Control": "no-store" };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const json = (data, status = 200) => Response.json(data, { status, headers });
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const { pathname, searchParams } = new URL(request.url);
    const route = pathname.split("/").filter(Boolean).at(-1);
    const id = searchParams.get("id");
    const priority = searchParams.get("priority") ?? "";
    if (route === "sensor" && Object.hasOwn(stations, id)) return json(sensor(id, stations[id]));
    if (route === "asset" && Object.hasOwn(assets, id)) return json(asset(id, assets[id]));
    if (route === "backlog" && ["", "High", "Normal"].includes(priority)) return json(backlog(priority));
    return json({ error: "Unknown demo route or record" }, 404);
  },
};
