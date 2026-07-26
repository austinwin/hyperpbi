"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download } from "lucide-react";
import { loadIslandRuntime } from "./IslandRuntime";

export function LoadExampleButton({ bundle }: { bundle: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const load = async () => {
    setStatus("loading");
    try {
      const runtime = await loadIslandRuntime();
      const imported = await runtime.importProject(bundle);
      router.push(imported.path);
    } catch {
      setStatus("error");
    }
  };

  return (
    <button className="button button--primary" type="button" onClick={() => void load()} disabled={status === "loading"}>
      <Download size={16} aria-hidden="true" />
      {status === "loading" ? "Adding to Playground…" : status === "error" ? "Try loading again" : "Load in Playground"}
    </button>
  );
}
