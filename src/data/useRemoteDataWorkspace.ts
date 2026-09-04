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
  remoteDataSourceDefinitions,
  remoteDataSourceRequestSignature,
  type RemoteDataSourceStatus,
} from "./remoteDataSources";

export interface RemoteDataWorkspaceResult {
  workspace: DataWorkspace;
  statuses: Record<string, RemoteDataSourceStatus>;
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
  const sequence = useRef(0);
  const [resolved, setResolved] = useState<Record<string, DataSource>>({});
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
    setStatuses(previous => Object.fromEntries(entries.map(([id]) => [
      id,
      { status: "loading", rowCount: previous[id]?.rowCount ?? resolved[id]?.data.rows.length ?? 0 },
    ])));

    for (const [id, definition] of entries) {
      void fetchRemoteDataSource(id, definition, stateValues, controller.signal)
        .then(source => {
          if (current !== sequence.current) return;
          setResolved(previous => ({ ...previous, [id]: source }));
          setStatuses(previous => ({
            ...previous,
            [id]: {
              status: source.data.rows.length ? "ready" : "empty",
              rowCount: source.data.rows.length,
            },
          }));
        })
        .catch(error => {
          if (controller.signal.aborted || current !== sequence.current) return;
          setStatuses(previous => ({
            ...previous,
            [id]: {
              status: "error",
              rowCount: resolved[id]?.data.rows.length ?? 0,
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
      sources[id] = resolved[id] ?? createRemoteSourcePlaceholder(id, definition);
    }
    return { ...base, sources };
  }, [baseWorkspace, baseData, definitions, resolved]);

  return { workspace, statuses };
}
