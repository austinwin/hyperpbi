import { useMemo, useState } from "preact/hooks";
import { BrowserHostBridge } from "@hyperpbi/host/BrowserHostBridge";
import { defaultWorkspaceData } from "@hyperpbi/data/dataWorkspace";
import { prepareAuthoringData } from "@hyperpbi/editor/prepareAuthoringData";
import type { HyperPbiProject } from "@hyperpbi/playground/project";
import { canonicalJson } from "@hyperpbi/playground/canonicalJson";
import { HyperPbiRoot } from "@hyperpbi/render/HyperPbiRoot";
import { defaultRuntimeSettings } from "@hyperpbi/runtime/runtimeSettings";

export function PlaygroundRenderer({ project, className = "" }: { project: HyperPbiProject; className?: string }) {
    const [hostMessage, setHostMessage] = useState("");
    const bridge = useMemo(() => new BrowserHostBridge(diagnostic => {
        setHostMessage(diagnostic.message);
        globalThis.setTimeout(() => setHostMessage(""), 5000);
    }), []);
    const prepared = useMemo(() => prepareAuthoringData(
        canonicalJson(project.specification),
        canonicalJson(project.runtimeConfiguration),
        defaultWorkspaceData(project.dataWorkspace),
        project.dataWorkspace
    ), [project]);
    if (prepared.errors.length || !prepared.specification || !prepared.config || !prepared.configuredData) {
        return <div class={`pg-render-error ${className}`} role="alert"><strong>The saved dashboard cannot enter Play Mode.</strong><ul>{prepared.errors.map(error => <li key={error}>{error}</li>)}</ul></div>;
    }
    return <div class={`pg-play-runtime ${className}`} id="hyperpbi-playground-runtime">
        {hostMessage && <div class="pg-host-diagnostic" role="status">{hostMessage}<button aria-label="Dismiss host diagnostic" onClick={() => setHostMessage("")}>×</button></div>}
        <HyperPbiRoot
            instanceId="hyperpbi-playground-runtime"
            schema={prepared.specification}
            data={prepared.configuredData}
            dataWorkspace={project.dataWorkspace}
            settings={defaultRuntimeSettings}
            config={prepared.config}
            renderMs={0}
            referenceWarnings={prepared.warnings}
            selectExternal={bridge.selectExternal.bind(bridge)}
            clearExternal={bridge.clearExternal.bind(bridge)}
            applyExternalFilter={bridge.applyExternalFilter.bind(bridge)}
            clearExternalFilter={bridge.clearExternalFilter.bind(bridge)}
            webAccessAvailable
            ownerByRuntimeId={prepared.ownerByRuntimeId}
            componentPathById={prepared.componentPathById}
        />
    </div>;
}
