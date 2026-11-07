import { remoteDataSourceUrl } from "./remoteDataSources";
import { checkHostPolicy } from "../maps/arcgis/arcGisHostPolicy";
import { externalServiceAccess } from "../providers/providerPolicy";
import type { ProviderAccessState } from "../providers/providerTypes";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { HyperPbiSchema } from "../schema/hyperpbiSchema";
import type { NormalizedData } from "./normalizeData";
import {
  createPowerBiDataWorkspace,
  type DataSource,
  type DataWorkspace,
} from "./dataWorkspace";
import {
  createRemoteSourcePlaceholder,
  fetchRemoteDataSource,
  remoteDataSourceRequestKey,
  remoteDataSourceRequestSignature,
  type RemoteDataSourceStatus,
} from "./remoteDataSources";

export interface RemoteDataWorkspaceResult {
  workspace: DataWorkspace;
  statuses: Record<string, RemoteDataSourceStatus>;
}

interface ResolvedRemoteSource {
  requestKey: string;
  source: DataSource;
}

export function useRemoteDataWorkspace(
  schema: HyperPbiSchema,
  baseWorkspace: DataWorkspace | undefined,
  baseData: NormalizedData,
  stateValues: Record<string, unknown>,
  hostMode: "web" | "powerbi" = "web",
  providerAccess?: ProviderAccessState,
  webAccessAvailable = false,
): RemoteDataWorkspaceResult {
  const definitions = schema.data?.sources ?? {};
  const signature = useMemo(
    () => remoteDataSourceRequestSignature(definitions, stateValues),
    [definitions, stateValues],
  );
  const requestKeys = useMemo(
    () => Object.fromEntries(Object.entries(definitions).map(([id, definition]) => [
      id,
      remoteDataSourceRequestKey(id, definition, stateValues),
    ])),
    [signature],
  );
  const sequence = useRef(0);
  const [resolved, setResolved] = useState<Record<string, ResolvedRemoteSource>>({});
  const [statuses, setStatuses] = useState<Record<string, RemoteDataSourceStatus>>({});

  useEffect(() => {
    const entries = Object.entries(definitions);
    if (!entries.length) {
      setResolved({});
      setStatuses({});
      return;
    }
    const current = ++sequence.current;
    const controller = new AbortController();

    // A changed request signature invalidates old rows immediately. HyperPBI
    // must never present a previous parameter result as if it were current.
    setResolved({});
    setStatuses(Object.fromEntries(entries.map(([id]) => [id, { status: "loading", rowCount: 0 }])));

    for (const [id, definition] of entries) {
      const requestKey = requestKeys[id];
      if (hostMode === "powerbi") {
        try {
          const endpoint = remoteDataSourceUrl(definition, stateValues, hostMode);
          const policy = checkHostPolicy(endpoint.href);
          if (!policy.allowed) throw new Error(policy.reason);
          const permission = externalServiceAccess(providerAccess, endpoint.href, webAccessAvailable);
          if (!permission.allowed) throw new Error(permission.reason ?? "Power BI WebAccess denied.");
        } catch (error) {
          setStatuses(previous => ({ ...previous, [id]: { status: "error", rowCount: 0, error: error instanceof Error ? error.message : "Power BI WebAccess denied." } }));
          continue;
        }
      }
      void fetchRemoteDataSource(id, definition, stateValues, controller.signal, hostMode)
        .then(source => {
          if (current !== sequence.current) return;
          setResolved(previous => ({ ...previous, [id]: { requestKey, source } }));
          setStatuses(previous => ({
            ...previous,
            [id]: { status: source.data.rows.length ? "ready" : "empty", rowCount: source.data.rows.length },
          }));
        })
        .catch(error => {
          if (controller.signal.aborted || current !== sequence.current) return;
          setResolved(previous => {
            const next = { ...previous };
            delete next[id];
            return next;
          });
          setStatuses(previous => ({
            ...previous,
            [id]: {
              status: "error",
              rowCount: 0,
              error: error instanceof Error ? error.message : "The remote data request failed.",
            },
          }));
        });
    }
    return () => controller.abort();
  }, [signature, hostMode, providerAccess, webAccessAvailable]);

  const workspace = useMemo(() => {
    const base = baseWorkspace ?? createPowerBiDataWorkspace(baseData);
    const sources = { ...base.sources };
    for (const [id, definition] of Object.entries(definitions)) {
      const candidate = resolved[id];
      sources[id] = candidate?.requestKey === requestKeys[id]
        ? candidate.source
        : createRemoteSourcePlaceholder(id, definition);
    }
    return { ...base, sources };
  }, [baseWorkspace, baseData, definitions, requestKeys, resolved]);

  return { workspace, statuses };
}
