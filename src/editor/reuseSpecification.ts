/** Share unchanged JSON from the preceding published preview. */
export function reuseSpecification<T>(previous: T | undefined, next: T): T {
    if (Object.is(previous, next)) return next;
    if (!previous || !next || typeof previous !== "object" || typeof next !== "object") return next;
    if (Array.isArray(previous) || Array.isArray(next)) {
        if (!Array.isArray(previous) || !Array.isArray(next)) return next;
        const keyFor = (value: unknown): string | undefined => {
            if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
            return undefined;
        };
        const byId = new Map(previous.map(value => [keyFor(value), value] as const).filter(([key]) => key !== undefined));
        const values = next.map((value, index) => {
            const id = keyFor(value);
            return reuseSpecification(id === undefined ? previous[index] : byId.get(id), value);
        });
        return values.length === previous.length && values.every((value, index) => value === previous[index]) ? previous : values as T;
    }

    const old = previous as Record<string, unknown>;
    const entries = Object.entries(next).map(([key, value]) => [key, reuseSpecification(Object.hasOwn(old, key) ? old[key] : undefined, value)] as const);
    if (entries.length === Object.keys(old).length && entries.every(([key, value]) => Object.hasOwn(old, key) && value === old[key])) return previous;
    return Object.fromEntries(entries) as T;
}
