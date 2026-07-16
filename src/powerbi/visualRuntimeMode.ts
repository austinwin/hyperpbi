import type { NormalizedData } from "../data/normalizeData";

export function shouldRenderLandingPage(
  data: Pick<NormalizedData, "fields">,
  specification: string,
): boolean {
  return !Object.keys(data.fields).length && !specification.trim();
}
