import type { Metadata } from "next";
import { IslandRuntime } from "@/components/IslandRuntime";

export const metadata: Metadata = { title: "Project workspace" };

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <IslandRuntime
      className="runtime-island--workspace"
      label="Opening the local project…"
      view={{ kind: "playground-project", projectId }}
    />
  );
}
