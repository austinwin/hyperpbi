export const minimalDashboard = {
    version: "1.0",
    title: "Dashboard",
    theme: { mode: "light", density: "compact" },
    components: [
        { type: "text", id: "intro", span: 12, text: "Start here", interaction:{enabled:false,internalMode:"none",externalMode:"none"} },
        { type: "metricGrid", id: "metrics", span: 12, metrics: [{ title: "Records", aggregation: "count" }], interaction:{enabled:false,internalMode:"none",externalMode:"none"} }
    ]
} as const;

export const minimalDashboardJson = JSON.stringify(minimalDashboard);
