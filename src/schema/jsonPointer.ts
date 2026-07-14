/** Escape one RFC 6901 JSON Pointer token. */
export function escapeJsonPointerToken(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** Append tokens to a canonical JSON Pointer without using authored IDs as indexes. */
export function appendJsonPointer(
  base: string,
  ...tokens: Array<string | number>
): string {
  const normalizedBase = base === "/" ? "" : base.replace(/\/$/, "");
  return `${normalizedBase}/${tokens
    .map((token) => escapeJsonPointerToken(String(token)))
    .join("/")}`;
}

/** Collect canonical pointers for every authored component in the component tree. */
export function componentPathById(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  const object = (candidate: unknown): candidate is Record<string, unknown> =>
    Boolean(candidate) && typeof candidate === "object" && !Array.isArray(candidate);

  const visit = (candidate: unknown, path: string): void => {
    if (Array.isArray(candidate)) {
      candidate.forEach((item, index) => visit(item, appendJsonPointer(path, index)));
      return;
    }
    if (!object(candidate)) return;
    if (typeof candidate.type === "string" && typeof candidate.id === "string")
      result[candidate.id] = path;
    for (const [key, child] of Object.entries(candidate)) {
      if (
        [
          "components",
          "toolbar",
          "leftPanel",
          "rightPanel",
          "children",
          "footer",
          "tabs",
          "items",
          "content",
          "chart",
          "elements",
        ].includes(key)
      )
        visit(child, appendJsonPointer(path, key));
    }
  };

  if (object(value))
    for (const key of ["components", "toolbar", "leftPanel", "rightPanel"])
      if (value[key] !== undefined) visit(value[key], appendJsonPointer("", key));
  return result;
}
