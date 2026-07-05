export function parseJson<T = unknown>(value: string): { value?: T; error?: string } {
    try { return { value: JSON.parse(value) as T }; }
    catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
}
