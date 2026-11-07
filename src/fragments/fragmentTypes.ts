import type { DashboardComponent } from "../schema/hyperpbiSchema";
import type { DataRow } from "../data/normalizeData";

/** Components are canonical schema 2.0 components; only the transport is versioned here. */
export interface RemoteFragment {
    kind: "hyperpbi.fragment";
    version: "1.0";
    title?: string;
    datasets: Record<string, DataRow[]>;
    components: DashboardComponent[];
}

export interface RemoteFragmentRequest {
    endpoint: string;
    timeoutMs?: number;
    cacheTtlSeconds?: number;
    fallback?: "attributes" | "message";
    fallbackMessage?: string;
    width?: number;
    maxHeight?: number;
}

export const FRAGMENT_LIMITS = Object.freeze({ bytes: 1024 * 1024, components: 100, depth: 8, datasets: 16, rows: 5000, columns: 100 });
