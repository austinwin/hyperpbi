import { EmptyState } from "../system/EmptyState";

export function MapEmptyState({ reason = "Map location fields are not bound." }: { reason?: string }) {
    return <EmptyState title="Bind fields to create a map"><div>{reason}</div><div class="hp-map-binding-help">Use Geometry, Latitude + Longitude, X + Y, or Address field wells.</div></EmptyState>;
}
