import fetch from "cross-fetch";

const API_BASE = process.env.UNIT09_API_BASE || "http://localhost:8080/api";

async function seed() {
  console.log("[seed] Using API base:", API_BASE);

  const repos = [
    {
      key: "demo-anchor-note",
      name: "Simple Anchor Note",
      url: "https://github.com/unit09-labs/simple-anchor-note",
      provider: "github",
    },
    {
      key: "demo-anchor-vesting",
      name: "Token Vesting Program",
      url: "https://github.com/unit09-labs/token-vesting",
      provider: "github",
    },
  ];

  for (const repo of repos) {
    const res = await fetch(`${API_BASE}/repos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(repo),
    });

    if (!res.ok) {
      console.error("[seed] Failed to register repo:", repo.key, res.status);
      const text = await res.text();
      console.error(text);
      continue;
    }

    console.log("[seed] Registered repo:", repo.key);
  }

  console.log("[seed] Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
