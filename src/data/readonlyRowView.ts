import type { DataRow, Primitive } from "./normalizeData";

const backing = Symbol("row backing");

/** Share a row shape across the whole view while preserving normal key lookup,
 * enumeration, spread and JSON behavior. Runtime rows are immutable inputs. */
export function readonlyRowFactory<T>(keys: string[], valueFor: (source: T, key: string, index: number) => Primitive) {
    const indices = new Map(keys.map((key, index) => [key, index]));
    type RowTarget = { [backing]: T };
    const handler: ProxyHandler<RowTarget> = {
        get(target, key, receiver) {
            const index = typeof key === "string" ? indices.get(key) : undefined;
            return index === undefined ? Reflect.get(target, key, receiver) : valueFor(target[backing], key as string, index);
        },
        has(target, key) {
            return typeof key === "string" && indices.has(key) || Reflect.has(target, key);
        },
        ownKeys() { return keys; },
        getOwnPropertyDescriptor(target, key) {
            const index = typeof key === "string" ? indices.get(key) : undefined;
            return index === undefined ? undefined : {
                configurable: true, enumerable: true, writable: false, value: valueFor(target[backing], key as string, index),
            };
        },
        set() { return false; },
        defineProperty() { return false; },
        deleteProperty() { return false; },
        preventExtensions() { return false; },
    };
    return (source: T): DataRow => new Proxy({ [backing]: source }, handler) as unknown as DataRow;
}
