import type { Primitive } from "./normalizeData";
import type { DataSource } from "./dataWorkspace";
import { createEmptyNormalizedData } from "./dataWorkspace";
import { normalizeTabularData } from "./fileImport";

declare const __HYPERPBI_WEB_REST_HOSTS__: string[] | undefined;

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

export interface RestGetSourceDefinition extends RemoteDataSourceBase {
  type: "rest.get";
  baseUrl: string;
  path: string;
  dataPath?: string;
}

export type RemoteDataSourceDefinition =
  | MiniUpTableSourceDefinition
  | MiniUpFunctionSourceDefinition
  | RestGetSourceDefinition;

export type RemoteDataSourceDefinitions = Record<string, RemoteDataSourceDefinition>;

export interface RemoteDataSourceStatus {
  status: "loading" | "ready" | "empty" | "error";
  rowCount: number;
  error?: string;
}

export const DEFAULT_WEB_REST_HOSTS = ["https://*.miniup.app"] as const;
const DEFAULT_MAX_ROWS = 1000;
const MAX_REMOTE_ROWS = 10_000;
const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MINIUP_FUNCTION_ORIGIN = "https://functions.miniup.app";
const MINIUP_FUNCTION_RESERVED = new Set(["api", "assets", "docs", "functions", "health", "status"]);
const sourceCache = new Map<string, { expiresAt: number; source: DataSource }>();

const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const safeSiteSlug = (value: string): boolean => /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.floor(number))) : fallback;
}

function scalarStateValue(value: unknown): Primitive | undefined {
  if (value === null || value === undefined) return value as null | undefined;
  if (value instanceof Date) return value;
  return ["string", "number", "boolean"].includes(typeof value) ? value as Primitive : undefined;
}

function resolvedParam(value: RemoteDataSourceParam, stateValues: Record<string, unknown>): Primitive {
  if (!object(value) || typeof value.state !== "string") return value as Primitive;
  const state = scalarStateValue(stateValues[value.state]);
  return state === undefined ? value.default : state;
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

function validateMiniUpFunctionSlug(value: string): string {
  if (value.length < 3 || value.length > 48 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || MINIUP_FUNCTION_RESERVED.has(value)) {
    throw new Error("MiniUp Function slugs must be 3-48 lowercase letters/numbers with single hyphens and cannot use a reserved name.");
  }
  return value;
}

function safeRelativePath(rawValue: string | undefined, label: string, maxLength = 1024): string {
  const raw = (rawValue ?? "/").trim() || "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://") || raw.includes("?") || raw.includes("#") || raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) {
    throw new Error(`${label} must be a safe relative path beginning with /.`);
  }
  if (raw.length > maxLength) throw new Error(`${label} is too long.`);
  const segments = raw.split("/").filter(Boolean).map(segment => {
    let decoded: string;
    try { decoded = decodeURIComponent(segment); } catch { throw new Error(`${label} contains invalid URL encoding.`); }
    if (decoded === "." || decoded === ".." || decoded.includes("/") || decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) {
      throw new Error(`${label} contains an unsafe path segment.`);
    }
    return encodeURIComponent(decoded);
  });
  return `/${segments.join("/")}`;
}

function miniUpTableUrl(definition: MiniUpTableSourceDefinition, params: Record<string, Primitive>): URL {
  if (!safeSiteSlug(definition.site) || !safeSiteSlug(definition.table)) {
    throw new Error("MiniUp table sources require simple site and table slugs.");
  }
  return appendParams(
    new URL(`/api/data/${encodeURIComponent(definition.site)}/${encodeURIComponent(definition.table)}`, `https://${definition.site}.miniup.app`),
    params,
  );
}

function miniUpFunctionUrl(definition: MiniUpFunctionSourceDefinition, params: Record<string, Primitive>): URL {
  const slug = validateMiniUpFunctionSlug(definition.function);
  const path = safeRelativePath(definition.path, "MiniUp Function path", 512);
  return appendParams(
    new URL(`/${encodeURIComponent(slug)}${path === "/" ? "" : path}`, MINIUP_FUNCTION_ORIGIN),
    params,
  );
}

function normalizeTrustedHostPattern(value: string): string {
  const pattern = value.trim().toLowerCase().replace(/\/$/, "");
  if (!pattern.startsWith("https://")) throw new Error(`REST host patterns must use HTTPS: ${value}`);
  if (pattern === "https://*") throw new Error("REST host patterns must name a real parent domain.");
  const wildcard = pattern.startsWith("https://*.");
  const candidate = wildcard ? `https://${pattern.slice("https://*.".length)}` : pattern;
  let url: URL;
  try { url = new URL(candidate); } catch { throw new Error(`Invalid REST host pattern: ${value}`); }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || !url.hostname) {
    throw new Error(`REST host patterns must be HTTPS origins without credentials, paths, queries, or hashes: ${value}`);
  }
  return wildcard ? `https://*.${url.hostname}${url.port ? `:${url.port}` : ""}` : url.origin.toLowerCase();
}

export function configuredWebRestHostPatterns(): string[] {
  let configured: unknown;
  try {
    if (typeof __HYPERPBI_WEB_REST_HOSTS__ !== "undefined") configured = __HYPERPBI_WEB_REST_HOSTS__;
  } catch {
    configured = undefined;
  }
  const values = Array.isArray(configured) && configured.length ? configured : [...DEFAULT_WEB_REST_HOSTS];
  return Array.from(new Set(values.map(value => normalizeTrustedHostPattern(String(value)))));
}

function originAllowed(origin: string, patterns = configuredWebRestHostPatterns()): boolean {
  const url = new URL(origin);
  const normalized = url.origin.toLowerCase();
  return patterns.some(pattern => {
    if (!pattern.startsWith("https://*.")) return normalized === pattern;
    const withoutScheme = pattern.slice("https://*.".length);
    const [hostname, port = ""] = withoutScheme.split(":");
    if (url.protocol !== "https:" || (port && url.port !== port) || (!port && url.port)) return false;
    return url.hostname !== hostname && url.hostname.endsWith(`.${hostname}`);
  });
}

function restGetUrl(definition: RestGetSourceDefinition, params: Record<string, Primitive>): URL {
  let base: URL;
  try { base = new URL(definition.baseUrl); } catch { throw new Error("REST GET baseUrl must be a valid HTTPS origin."); }
  if (base.protocol !== "https:" || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
    throw new Error("REST GET baseUrl must be an HTTPS origin without credentials, path, query, or hash.");
  }
  if (!originAllowed(base.origin)) {
    throw new Error(`REST GET origin ${base.origin} is not trusted by this web build. Rebuild with HYPERPBI_WEB_REST_HOSTS including that origin.`);
  }
  return appendParams(new URL(safeRelativePath(definition.path, "REST GET path"), base.origin), params);
}

async function readBoundedResponseText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error("The remote data response exceeds the 5 MB per-request limit.");
  }
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_RESPONSE_BYTES) throw new Error("The remote data response exceeds the 5 MB per-request limit.");
    return new TextDecoder().decode(bytes);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Error("The remote data response exceeds the 5 MB per-request limit.");
      }
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parts.join("");
  } finally {
    reader.releaseLock();
  }
}

async function fetchJson(url: URL, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const forwardAbort = () => controller.abort(signal?.reason ?? new DOMException("The remote data request was aborted.", "AbortError"));
  if (signal?.aborted) forwardAbort();
  else signal?.addEventListener("abort", forwardAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException("The remote data request timed out.", "TimeoutError"));
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
      throw new Error(`The remote data source rejected access (HTTP ${response.status}). Keep credentials and protected upstream calls inside a public MiniUp Function instead of HyperPBI JSON.`);
    }
    if (response.status === 429) throw new Error("The remote data source rate limit was reached (HTTP 429).");
    if (!response.ok) throw new Error(`The remote data source returned HTTP ${response.status}.`);
    const text = await readBoundedResponseText(response);
    try { return JSON.parse(text); } catch { throw new Error("The remote data source returned invalid JSON."); }
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
  for (const row of rows) for (const key of Object.keys(row)) if (!seen.has(key)) { seen.add(key); headers.push(key); }
  if (!headers.length) return { ...createEmptyNormalizedData(), loadStatus: { loadedRowCount: 0, moreRowsAvailable: false, fetchInProgress: false } };
  return normalizeTabularData(headers, rows.map(row => headers.map(header => inertCell(row[header]))), sourceId);
}

function tableRows(payload: unknown): Array<Record<string, unknown>> {
  if (!object(payload) || !Array.isArray(payload.records)) throw new Error("The MiniUp table response did not contain a records array.");
  return payload.records.flatMap(record => {
    if (!object(record) || !object(record.fields)) return [];
    return [{ __record_id: record.id ?? null, ...record.fields, __created_at: record.createdAt ?? null, __updated_at: record.updatedAt ?? null }];
  });
}

function valueAtPath(payload: unknown, path?: string): unknown {
  if (!path?.trim()) return payload;
  return path.split(".").filter(Boolean).reduce<unknown>((value, segment) => {
    if (["__proto__", "prototype", "constructor"].includes(segment)) return undefined;
    return object(value) ? value[segment] : undefined;
  }, payload);
}

function responseRows(payload: unknown, dataPath?: string): Array<Record<string, unknown>> {
  let value = valueAtPath(payload, dataPath);
  if (!dataPath && object(value)) {
    for (const key of ["records", "rows", "items", "data"]) if (Array.isArray(value[key])) { value = value[key]; break; }
  }
  if (Array.isArray(value)) {
    return value.map(item => object(item)
      ? object(item.fields) ? { ...item.fields, __record_id: item.id ?? null } : item
      : { value: item });
  }
  if (object(value)) return [value];
  throw new Error("The remote response does not resolve to an object or array of rows.");
}

async function loadMiniUpTable(id: string, definition: MiniUpTableSourceDefinition, stateValues: Record<string, unknown>, signal?: AbortSignal): Promise<DataSource> {
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

async function loadMiniUpFunction(id: string, definition: MiniUpFunctionSourceDefinition, stateValues: Record<string, unknown>, signal?: AbortSignal): Promise<DataSource> {
  const payload = await fetchJson(miniUpFunctionUrl(definition, resolvedParams(definition, stateValues)), definition.timeoutMs ?? DEFAULT_TIMEOUT_MS, signal);
  const rows = responseRows(payload, definition.dataPath).slice(0, clampInteger(definition.maxRows, DEFAULT_MAX_ROWS, 1, MAX_REMOTE_ROWS));
  return { id, name: id, kind: "miniup.function", data: normalizeObjects(rows, `miniup.function:${id}`) };
}

async function loadRestGet(id: string, definition: RestGetSourceDefinition, stateValues: Record<string, unknown>, signal?: AbortSignal): Promise<DataSource> {
  const payload = await fetchJson(restGetUrl(definition, resolvedParams(definition, stateValues)), definition.timeoutMs ?? DEFAULT_TIMEOUT_MS, signal);
  const rows = responseRows(payload, definition.dataPath).slice(0, clampInteger(definition.maxRows, DEFAULT_MAX_ROWS, 1, MAX_REMOTE_ROWS));
  return { id, name: id, kind: "rest.get", data: normalizeObjects(rows, `rest.get:${id}`) };
}

export function remoteDataSourceDefinitions(specification: unknown): RemoteDataSourceDefinitions {
  if (!object(specification) || !object(specification.data) || !object(specification.data.sources)) return {};
  return specification.data.sources as unknown as RemoteDataSourceDefinitions;
}

export function createRemoteSourcePlaceholder(id: string, definition: RemoteDataSourceDefinition): DataSource {
  return { id, name: id, kind: definition.type, data: { ...createEmptyNormalizedData(), dynamicSchema: true } };
}

export function remoteSourcePlaceholderData(specification: unknown): Record<string, DataSource["data"]> {
  return Object.fromEntries(Object.entries(remoteDataSourceDefinitions(specification)).map(([id, definition]) => [id, createRemoteSourcePlaceholder(id, definition).data]));
}

/** Only origins actually supported by the Power BI package belong here. */
export function configuredRemoteDataEndpoints(specification: unknown): string[] {
  const origins = new Set<string>();
  for (const definition of Object.values(remoteDataSourceDefinitions(specification))) {
    if (definition.type === "miniup.function") origins.add(MINIUP_FUNCTION_ORIGIN);
  }
  return [...origins];
}

export function remoteDataSourceRequestKey(id: string, definition: RemoteDataSourceDefinition, stateValues: Record<string, unknown>): string {
  return JSON.stringify([id, definition, resolvedParams(definition, stateValues)]);
}

export function remoteDataSourceRequestSignature(definitions: RemoteDataSourceDefinitions, stateValues: Record<string, unknown>): string {
  return JSON.stringify(Object.entries(definitions).sort(([a], [b]) => a.localeCompare(b)).map(([id, definition]) => remoteDataSourceRequestKey(id, definition, stateValues)));
}

export async function fetchRemoteDataSource(id: string, definition: RemoteDataSourceDefinition, stateValues: Record<string, unknown> = {}, signal?: AbortSignal): Promise<DataSource> {
  const key = remoteDataSourceRequestKey(id, definition, stateValues);
  const now = Date.now();
  const cached = sourceCache.get(key);
  if (cached && cached.expiresAt > now) return cached.source;
  const source = definition.type === "miniup.table"
    ? await loadMiniUpTable(id, definition, stateValues, signal)
    : definition.type === "miniup.function"
      ? await loadMiniUpFunction(id, definition, stateValues, signal)
      : await loadRestGet(id, definition, stateValues, signal);
  const ttlMs = clampInteger(definition.cacheTtlSeconds, 30, 0, 3600) * 1000;
  if (ttlMs > 0) sourceCache.set(key, { expiresAt: Date.now() + ttlMs, source });
  return source;
}

export function clearRemoteDataSourceCache(): void {
  sourceCache.clear();
}
