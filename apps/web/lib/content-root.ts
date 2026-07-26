import { existsSync } from "node:fs";
import path from "node:path";

let resolvedRoot: string | undefined;

export function repositoryRoot(): string {
  if (resolvedRoot) return resolvedRoot;
  const candidates = [
    path.resolve(/* turbopackIgnore: true */ process.cwd(), "../.."),
    path.resolve(/* turbopackIgnore: true */ process.cwd()),
    path.resolve(/* turbopackIgnore: true */ process.cwd(), ".."),
  ];
  resolvedRoot =
    candidates.find(
      (candidate) =>
        existsSync(
          path.join(/* turbopackIgnore: true */ candidate, "pbiviz.json"),
        ) &&
        existsSync(path.join(/* turbopackIgnore: true */ candidate, "docs")),
    ) ?? candidates[0];
  return resolvedRoot;
}
