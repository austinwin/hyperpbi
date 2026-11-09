import type { ComponentChildren } from "preact";
import { useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { RenderContext, type RenderContextValue } from "../render/RenderContext";
import { defaultRuntimeSettings } from "../runtime/runtimeSettings";
import { ComponentErrorBoundary } from "../render/ComponentErrorBoundary";
import { defaultConfig } from "../config/hyperpbiConfig";
import type { DynamicContext, RemoteFragmentRequest } from "./fragmentTypes";
import { fragmentEndpoint } from "./fragmentBindings";
import { prepareRemoteFragment } from "./prepareRemoteFragment";
import { assertFragmentAccess, fetchRemoteFragment } from "./remoteFragmentRequest";

export type FragmentEnvironment = Pick<RenderContextValue, "settings" | "remoteSourceHost" | "providerAccess">;
type Prepared = ReturnType<typeof prepareRemoteFragment>;
type FragmentRoot = typeof import("../render/HyperPbiRoot").HyperPbiRoot;
const fragmentConfig = {
    ...defaultConfig,
    interactions: { ...defaultConfig.interactions, crossFilter: false },
    security: { ...defaultConfig.security, cssMode: "scoped" as const },
};
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Dynamic content could not be loaded.";
let sequence = 0;

export function RemoteFragmentHost({ request, values, eventRevision = 0, refreshOnEvent = false, fallback, environment, title }: {
    request: RemoteFragmentRequest;
    values?: DynamicContext;
    eventRevision?: number;
    refreshOnEvent?: boolean;
    fallback?: ComponentChildren;
    environment?: FragmentEnvironment;
    title?: string;
}) {
    const context = useContext(RenderContext);
    const parent = environment ?? context;
    const parentSettings = parent?.settings ?? defaultRuntimeSettings;
    const settings = useMemo(() => ({ ...parentSettings, customCss: "", debug: { ...parentSettings.debug, showFieldDictionary: false, showDataSample: false, showPerformance: false } }), [parentSettings]);
    const [namespace] = useState(() => `fragment${++sequence}`);
    const [manualRefresh, setManualRefresh] = useState(0);
    const [content, setContent] = useState<{ href: string; prepared: Prepared; Root: FragmentRoot }>();
    const [outcome, setOutcome] = useState<{ key: string; error?: string }>();
    const previousRefresh = useRef("0:0");

    let href: string | undefined;
    let accessError: string | undefined;
    try {
        const url = fragmentEndpoint(request.endpoint, values, context?.dynamicState ?? context?.state.values);
        assertFragmentAccess(url, parent?.remoteSourceHost ?? "web", parent?.providerAccess);
        href = url.href;
    } catch (error) {
        accessError = errorMessage(error);
    }
    const revision = `${manualRefresh}:${refreshOnEvent ? eventRevision : 0}`;
    const requestKey = JSON.stringify([href, request.timeoutMs, request.cacheTtlSeconds, eventRevision, revision]);
    const { timeoutMs, cacheTtlSeconds } = request;
    useEffect(() => {
        if (!href) return;
        const controller = new AbortController();
        const refresh = previousRefresh.current !== revision;
        previousRefresh.current = revision;
        const load = async () => {
            try {
                const payload = await fetchRemoteFragment(new URL(href), { endpoint: href, timeoutMs, cacheTtlSeconds }, controller.signal, refresh);
                const prepared = prepareRemoteFragment(payload, namespace);
                // Defer initialization in authoring-only surfaces. Power BI bundles this module eagerly.
                const { HyperPbiRoot: Root } = await import(/* webpackMode: "eager" */ "../render/HyperPbiRoot");
                if (controller.signal.aborted) return;
                setContent({ href, prepared, Root });
                setOutcome({ key: requestKey });
            } catch (error) {
                if (!controller.signal.aborted) setOutcome({ key: requestKey, error: errorMessage(error) });
            }
        };
        void load();
        return () => controller.abort();
    }, [href, timeoutMs, cacheTtlSeconds, revision, requestKey, namespace]);

    const current = href && content?.href === href ? content : undefined;
    const error = accessError ?? (outcome?.key === requestKey ? outcome?.error : undefined);
    const loading = Boolean(href && outcome?.key !== requestKey);
    const Root = current?.Root;
    return <section class="hp-remote-fragment" aria-label={title ?? "Dynamic content"} aria-busy={loading}
        onClick={event => event.stopPropagation()} onWheel={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}
        onMouseDown={event => event.stopPropagation()} onTouchStart={event => event.stopPropagation()} onDblClick={event => event.stopPropagation()}>
        <div class="hp-remote-fragment-toolbar"><small>{current?.prepared.title ?? title ?? "Dynamic content"}</small>
            <button type="button" onClick={() => setManualRefresh(value => value + 1)} disabled={!href}>Refresh data</button>
        </div>
        {loading && <p role="status">{current ? "Refreshing dynamic content…" : "Loading dynamic content…"}</p>}
        {error && <div role="alert"><p>{error}</p><p>{request.fallbackMessage ?? "Dynamic content is temporarily unavailable."}</p>{!current && fallback}</div>}
        {current && Root && <ComponentErrorBoundary key={href} id={namespace} type="dynamicContent" developer={settings.debug.showSchemaErrors}>
            <Root instanceId={namespace} schema={current.prepared.schema} data={current.prepared.data} dataWorkspace={current.prepared.workspace} settings={settings} renderMs={0} config={fragmentConfig} executionMode="fragment" />
        </ComponentErrorBoundary>}
    </section>;
}
