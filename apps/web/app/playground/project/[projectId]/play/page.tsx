import type { Metadata } from "next";
import { IslandRuntime } from "@/components/IslandRuntime";

export const metadata: Metadata = { title: "Play Mode" };

export default async function PlayPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <IslandRuntime
      className="runtime-island--play"
      label="Loading Play Mode…"
      view={{ kind: "playground-play", projectId }}
    />
  );
}
