import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { RenderContext, type RenderContextValue } from "../render/RenderContext";
import { defaultRuntimeSettings } from "../runtime/runtimeSettings";
import { ComponentErrorBoundary } from "../render/ComponentErrorBoundary";
import { defaultConfig } from "../config/hyperpbiConfig";
import type { ResolvedMapFeature } from "../maps/model/resolvedMapTypes";
import type { RemoteFragmentRequest } from "./fragmentTypes";
import { prepareRemoteFragment } from "./prepareRemoteFragment";
import { assertFragmentAccess, fetchRemoteFragment, fragmentEndpoint } from "./remoteFragmentRequest";

export type FragmentEnvironment = Pick<RenderContextValue, "settings" | "remoteSourceHost" | "providerAccess" | "webAccessAvailable">;
let sequence = 0;
export function RemoteFragmentHost({ request, feature, fallback, environment }: { request: RemoteFragmentRequest; feature?: ResolvedMapFeature; fallback?: preact.ComponentChildren; environment?: FragmentEnvironment }) {
    const context = useContext(RenderContext);
    const parent = environment ?? context ?? { settings: defaultRuntimeSettings, remoteSourceHost: "web" as const, webAccessAvailable: false };
    const [namespace] = useState(() => `fragment${++sequence}`);
    const [refresh, setRefresh] = useState(0);
    const [result, setResult] = useState<{ key: string; prepared?: ReturnType<typeof prepareRemoteFragment>; Root?: typeof import("../render/HyperPbiRoot").HyperPbiRoot; error?: string }>();
    const requestKey = JSON.stringify([request, feature?.featureKey, feature?.serviceAttributes, feature?.powerBiAttributes, feature?.joinedAttributes, refresh]);
    const config = useMemo(() => ({ ...defaultConfig, security: { ...defaultConfig.security, cssMode: "scoped" as const } }), []);
    const settings = useMemo(() => ({ ...parent.settings, customCss: "", debug: { ...parent.settings.debug, showFieldDictionary: false, showDataSample: false, showPerformance: false } }), [parent.settings]);
    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            try {
                const url = fragmentEndpoint(request.endpoint, feature);
                assertFragmentAccess(url, parent.remoteSourceHost ?? "web", parent.providerAccess, parent.webAccessAvailable);
                const payload = await fetchRemoteFragment(url, request, controller.signal, refresh > 0);
                const prepared = prepareRemoteFragment(payload, namespace);
                // Defer engine initialization in authoring-only/test surfaces. Power BI
                // keeps the module in its single bundle; Vite can reuse a runtime chunk.
                const { HyperPbiRoot: Root } = await import(/* webpackMode: "eager" */ "../render/HyperPbiRoot");
                if (!controller.signal.aborted) setResult({ key: requestKey, prepared, Root });
            } catch (error) {
                if (!controller.signal.aborted) setResult({ key: requestKey, error: error instanceof Error ? error.message : "Fragment could not be loaded." });
            }
        };
        void load();
        return () => controller.abort();
    }, [requestKey, parent.remoteSourceHost, parent.providerAccess, parent.webAccessAvailable]);
    const current = result?.key === requestKey ? result : undefined;
    const Root = current?.Root;
    return <section class="hp-remote-fragment" aria-label="Remote analytics" onWheel={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()} onTouchStart={event => event.stopPropagation()} onDblClick={event => event.stopPropagation()}>
        <div class="hp-remote-fragment-toolbar"><small>{current?.prepared?.title ?? "Remote analytics"}</small><button type="button" onClick={() => setRefresh(value => value + 1)}>Refresh data</button></div>
        {!current && <p role="status">Loading remote analytics…</p>}
        {current?.error && <div role="alert"><p>{current.error}</p>{request.fallback === "attributes" ? fallback : <p>{request.fallbackMessage ?? "Analytics are temporarily unavailable. Try refreshing."}</p>}</div>}
        {current?.prepared && Root && <ComponentErrorBoundary key={requestKey} id={namespace} type="remoteFragment" developer={settings.debug.showSchemaErrors}>
            <Root instanceId={namespace} schema={current.prepared.schema} data={current.prepared.data} dataWorkspace={current.prepared.workspace} settings={settings} renderMs={0} config={config} executionMode="fragment" />
        </ComponentErrorBoundary>}
    </section>;
}
