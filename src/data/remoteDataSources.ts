import type { Primitive } from "./normalizeData";
import type { DataSource } from "./dataWorkspace";
import { createEmptyNormalizedData } from "./dataWorkspace";
import { normalizeTabularData } from "./fileImport";

export type RemoteDataSourceParam =
  | string
  | number
  | boolean
  | null
  | { state: string; default?: string | number | boolean | null };

interface RemoteDataSourceBase {
  params?: Record<string, RemoteDataSourceParam>;
  maxRows?: number;
  timeoutMs?: number;
  cacheTtlSeconds?: number;
}

export interface MiniUpTableSourceDefinition extends RemoteDataSourceBase {
  type: "miniup.table";
  site: string;
  table: string;
}

export interface MiniUpFunctionSourceDefinition extends RemoteDataSourceBase {
  type: "miniup.function";
  function: string;
  path?: string;
  dataPath?: string;
}

export type RemoteDataSourceDefinition =
  | MiniUpTableSourceDefinition
  | MiniUpFunctionSourceDefinition;

export type RemoteDataSourceDefinitions = Record<string, RemoteDataSourceDefinition>;

export interface RemoteDataSourceStatus {
  status: "loading" | "ready" | "empty" | "error";
  rowCount: number;
  error?: string;
}

const DEFAULT_MAX_ROWS = 1000;
const MAX_REMOTE_ROWS = 10_000;
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MINIUP_FUNCTION_ORIGIN = "https://functions.miniup.app";
const sourceCache = new Map<string, { expiresAt: number; source: DataSource }>();
const inFlight = new Map<string, Promise<DataSource>>();

const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const safeSlug = (value: string): boolean => /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.floor(number))) : fallback;
}

function resolvedParam(value: RemoteDataSourceParam, stateValues: Record<string, unknown>): Primitive {
  if (!object(value) || typeof value.state !== "string") return value as Primitive;
  const state = stateValues[value.state];
  return state === undefined ? (value.default as Primitive) : state as Primitive;
}

function resolvedParams(
  definition: RemoteDataSourceDefinition,
  stateValues: Record<string, unknown>,
): Record<string, Primitive> {
  return Object.fromEntries(
    Object.entries(definition.params ?? {}).map(([key, value]) => [key, resolvedParam(value, stateValues)]),
  );
}

function appendParams(url: URL, params: Record<string, Primitive>): URL {
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    url.searchParams.set(key, value instanceof Date ? value.toISOString() : String(value));
  }
  return url;
}

function miniUpTableUrl(definition: MiniUpTableSourceDefinition, params: Record<string, Primitive>): URL {
  if (!safeSlug(definition.site) || !safeSlug(definition.table)) {
    throw new Error("MiniUp table sources require simple site and table slugs.");
  }
  return appendParams(
    new URL(`/api/data/${encodeURIComponent(definition.site)}/${encodeURIComponent(definition.table)}`, `https://${definition.site}.miniup.app`),
    params,
  );
}

function miniUpFunctionUrl(definition: MiniUpFunctionSourceDefinition, params: Record<string, Primitive>): URL {
  if (!safeSlug(definition.function)) throw new Error("MiniUp Function sources require a simple function slug.");
  const path = (definition.path ?? "")
    .split("/")
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join("/");
  return appendParams(
    new URL(`/${encodeURIComponent(definition.function)}${path ? `/${path}` : ""}`, MINIUP_FUNCTION_ORIGIN),
    params,
  );
}

async function fetchJson(url: URL, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const forwardAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) forwardAbort();
  else signal?.addEventListener("abort", forwardAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, clampInteger(timeoutMs, DEFAULT_TIMEOUT_MS, 1000, 15_000));
  try {
    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) throw new Error("The remote data request timed out.");
      if (signal?.aborted) throw signal.reason ?? error;
      throw new Error("The remote data request failed because of a network, CORS, or Power BI WebAccess restriction.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`The remote data source rejected access (HTTP ${response.status}). Keep protected MiniUp credentials inside a MiniUp Function, not HyperPBI JSON.`);
    }
    if (response.status === 429) throw new Error("The remote data source rate limit was reached (HTTP 429).");
    if (!response.ok) throw new Error(`The remote data source returned HTTP ${response.status}.`);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      throw new Error("The remote data response exceeds the 5 MB per-request limit.");
    }
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new Error("The remote data response exceeds the 5 MB per-request limit.");
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("The remote data source returned invalid JSON.");
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

function inertCell(value: unknown): unknown {
  if (value === null || value === undefined || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  try { return JSON.stringify(value); } catch { return String(value); }
}

function normalizeObjects(rows: Array<Record<string, unknown>>, sourceId: string): DataSource["data"] {
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) { seen.add(key); headers.push(key); }
    }
  }
  if (!headers.length) return { ...createEmptyNormalizedData(), loadStatus: { loadedRowCount: 0, moreRowsAvailable: false, fetchInProgress: false } };
  return normalizeTabularData(
    headers,
    rows.map(row => headers.map(header => inertCell(row[header]))),
    sourceId,
  );
}

function tableRows(payload: unknown): Array<Record<string, unknown>> {
  if (!object(payload) || !Array.isArray(payload.records)) {
    throw new Error("The MiniUp table response did not contain a records array.");
  }
  return payload.records.flatMap(record => {
    if (!object(record) || !object(record.fields)) return [];
    return [{
      __record_id: record.id ?? null,
      ...record.fields,
      __created_at: record.createdAt ?? null,
      __updated_at: record.updatedAt ?? null,
    }];
  });
}

function valueAtPath(payload: unknown, path?: string): unknown {
  if (!path?.trim()) return payload;
  return path.split(".").filter(Boolean).reduce<unknown>((value, segment) => object(value) ? value[segment] : undefined, payload);
}

function functionRows(payload: unknown, dataPath?: string): Array<Record<string, unknown>> {
  let value = valueAtPath(payload, dataPath);
  if (!dataPath && object(value)) {
    for (const key of ["records", "rows", "items", "data"]) {
      if (Array.isArray(value[key])) { value = value[key]; break; }
    }
  }
  if (Array.isArray(value)) {
    return value.map(item => object(item)
      ? object(item.fields) ? { ...item.fields, __record_id: item.id ?? null } : item
      : { value: item });
  }
  if (object(value)) return [value];
  throw new Error("The MiniUp Function response does not resolve to an object or array of rows.");
}

async function loadMiniUpTable(
  id: string,
  definition: MiniUpTableSourceDefinition,
  stateValues: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<DataSource> {
  const params = resolvedParams(definition, stateValues);
  const maxRows = clampInteger(definition.maxRows, DEFAULT_MAX_ROWS, 1, MAX_REMOTE_ROWS);
  const requestedLimit = params.limit === undefined ? maxRows : clampInteger(params.limit, maxRows, 1, maxRows);
  const startingOffset = clampInteger(params.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  const rows: Array<Record<string, unknown>> = [];
  while (rows.length < requestedLimit) {
    const pageLimit = Math.min(200, requestedLimit - rows.length);
    const pageParams = { ...params, limit: pageLimit, offset: startingOffset + rows.length };
    const payload = await fetchJson(miniUpTableUrl(definition, pageParams), definition.timeoutMs ?? DEFAULT_TIMEOUT_MS, signal);
    const page = tableRows(payload);
    rows.push(...page.slice(0, requestedLimit - rows.length));
    if (page.length < pageLimit) break;
  }
  return { id, name: id, kind: "miniup.table", data: normalizeObjects(rows, `miniup.table:${id}`) };
}

async function loadMiniUpFunction(
  id: string,
  definition: MiniUpFunctionSourceDefinition,
  stateValues: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<DataSource> {
  const params = resolvedParams(definition, stateValues);
  const payload = await fetchJson(miniUpFunctionUrl(definition, params), definition.timeoutMs ?? DEFAULT_TIMEOUT_MS, signal);
  const rows = functionRows(payload, definition.dataPath).slice(
    0,
    clampInteger(definition.maxRows, DEFAULT_MAX_ROWS, 1, MAX_REMOTE_ROWS),
  );
  return { id, name: id, kind: "miniup.function", data: normalizeObjects(rows, `miniup.function:${id}`) };
}

export function remoteDataSourceDefinitions(specification: unknown): RemoteDataSourceDefinitions {
  if (!object(specification) || !object(specification.data) || !object(specification.data.sources)) return {};
  return specification.data.sources as unknown as RemoteDataSourceDefinitions;
}

export function createRemoteSourcePlaceholder(id: string, definition: RemoteDataSourceDefinition): DataSource {
  return {
    id,
    name: id,
    kind: definition.type,
    data: { ...createEmptyNormalizedData(), dynamicSchema: true },
  };
}

export function remoteSourcePlaceholderData(specification: unknown): Record<string, DataSource["data"]> {
  return Object.fromEntries(
    Object.entries(remoteDataSourceDefinitions(specification)).map(([id, definition]) => [
      id,
      createRemoteSourcePlaceholder(id, definition).data,
    ]),
  );
}

export function configuredRemoteDataEndpoints(specification: unknown): string[] {
  const origins = new Set<string>();
  for (const definition of Object.values(remoteDataSourceDefinitions(specification))) {
    if (definition.type === "miniup.table" && safeSlug(definition.site)) origins.add(`https://${definition.site}.miniup.app`);
    if (definition.type === "miniup.function") origins.add(MINIUP_FUNCTION_ORIGIN);
  }
  return [...origins];
}

export function remoteDataSourceRequestSignature(
  definitions: RemoteDataSourceDefinitions,
  stateValues: Record<string, unknown>,
): string {
  return JSON.stringify(Object.entries(definitions).sort(([a], [b]) => a.localeCompare(b)).map(([id, definition]) => [
    id,
    definition,
    resolvedParams(definition, stateValues),
  ]));
}

export async function fetchRemoteDataSource(
  id: string,
  definition: RemoteDataSourceDefinition,
  stateValues: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<DataSource> {
  const key = JSON.stringify([id, definition, resolvedParams(definition, stateValues)]);
  const now = Date.now();
  const cached = sourceCache.get(key);
  if (cached && cached.expiresAt > now) return cached.source;
  const existing = inFlight.get(key);
  if (existing) return existing;
  const load = (definition.type === "miniup.table"
    ? loadMiniUpTable(id, definition, stateValues, signal)
    : loadMiniUpFunction(id, definition, stateValues, signal))
    .then(source => {
      const ttlMs = clampInteger(definition.cacheTtlSeconds, 30, 0, 3600) * 1000;
      if (ttlMs > 0) sourceCache.set(key, { expiresAt: Date.now() + ttlMs, source });
      return source;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, load);
  return load;
}

export function clearRemoteDataSourceCache(): void {
  sourceCache.clear();
  inFlight.clear();
}
