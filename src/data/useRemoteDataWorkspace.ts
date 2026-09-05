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
      void fetchRemoteDataSource(id, definition, stateValues, controller.signal)
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
  }, [signature]);

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
