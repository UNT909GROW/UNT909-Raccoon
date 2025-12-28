import fetch from "cross-fetch";

const API_BASE = process.env.UNIT09_API_BASE || "http://localhost:8080/api";

async function ensureHealth() {
  const url = `${API_BASE}/health`;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log("[demo] API is healthy.");
        return;
      }
    } catch {
      // ignore
    }
    console.log("[demo] Waiting for API to become healthy...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("API did not become healthy in time");
}

async function triggerPipeline(repoKey: string) {
  console.log("[demo] Triggering pipeline for repo:", repoKey);
  const res = await fetch(`${API_BASE}/pipeline/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repo: { key: repoKey },
      mode: "full",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to trigger pipeline: ${res.status} ${text}`);
  }

  const json = await res.json();
  console.log("[demo] Pipeline job created:", json);
  return json.jobId as string | undefined;
}

async function waitForModules(repoKey: string) {
  console.log("[demo] Waiting for generated modules...");
  for (let i = 0; i < 30; i++) {
    const res = await fetch(
      `${API_BASE}/repos/${encodeURIComponent(repoKey)}/modules`
    );
    if (!res.ok) {
      console.log("[demo] modules endpoint not ready yet:", res.status);
    } else {
      const json = await res.json();
      const items = json.items ?? [];
      if (items.length > 0) {
        console.log("[demo] Modules generated:");
        for (const m of items) {
          console.log(
            `  - ${m.id} | ${m.name} | ${m.language} | v${m.version} | status=${m.status}`
          );
        }
        return;
      }
      print("[demo] No modules yet, retrying...");
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log("[demo] Timed out waiting for modules, check the worker logs.");
}

async function showStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) {
    console.log("[demo] Failed to fetch stats:", res.status);
    return;
  }
  const json = await res.json();
  console.log("[demo] Global stats:", JSON.stringify(json, null, 2));
}

async function main() {
  console.log("[demo] Using API base:", API_BASE);
  await ensureHealth();

  const repoKey = "demo-anchor-note";

  await triggerPipeline(repoKey);
  await waitForModules(repoKey);
  await showStats();

  console.log("[demo] Workflow complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
