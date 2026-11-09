import type { Metadata } from "next";
import { IslandRuntime } from "@/components/IslandRuntime";
import { listDashboardExamples, readDashboardBundle } from "@/lib/examples";

export const metadata: Metadata = {
  title: "Playground",
  description: "Build and run portable HyperPBI dashboards locally in your browser.",
};

export const dynamic = "force-static";

export default function PlaygroundPage() {
  const examples = listDashboardExamples().map((example) => ({
    slug: example.slug,
    title: example.title,
    summary: example.summary,
    useCase: example.useCase,
    theme: example.theme,
    accent: example.accent,
    bundle: readDashboardBundle(example),
  }));

  return (
    <IslandRuntime
      className="runtime-island--playground-home"
      view={{ kind: "playground-home", examples }}
    />
  );
}
