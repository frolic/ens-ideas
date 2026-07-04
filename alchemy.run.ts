import alchemy from "alchemy";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";
import { Assets, RateLimit, Worker } from "alchemy/cloudflare";

const app = await alchemy("instant-ens-api", {
  stateStore: (scope) => new CloudflareStateStore(scope),
});

const isProd = app.stage === "prod";

// API worker — declared identically to the former api/alchemy.run.ts so the
// existing deployment state maps and the live worker is a no-op. `adopt` guards
// against recreation if the resource identity ever fails to map.
export const worker = await Worker("worker", {
  name: "instant-ens-api",
  entrypoint: "api/src/worker.ts",
  adopt: true,
  domains: ["api.instantens.com", "api.ensideas.com"],
  bindings: {
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL!,
    RATE_LIMITER: RateLimit({
      namespace_id: 1001,
      simple: { limit: 1000, period: 60 },
    }),
  },
});

// Site worker — Waku SSR frontend, prebuilt by `waku build` (Cloudflare
// adapter) into site/dist. Stage-aware: prod owns ensideas.com; every other
// stage previews on beta.ensideas.com so production is never touched by a
// non-prod deploy.
const siteAssets = await Assets({ path: "site/dist/public" });

export const site = await Worker("site", {
  name: isProd ? "ens-ideas-site" : `ens-ideas-site-${app.stage}`,
  entrypoint: "site/dist/server/index.js",
  adopt: true,
  noBundle: true,
  rules: [{ globs: ["**/*.js", "**/*.mjs"] }],
  assets: { html_handling: "drop-trailing-slash" },
  bindings: { ASSETS: siteAssets },
  compatibilityFlags: ["nodejs_als"],
  compatibilityDate: "2025-11-17",
  domains: isProd ? ["ensideas.com", "www.ensideas.com"] : ["beta.ensideas.com"],
});

if (process.env.PULL_REQUEST) {
  await GitHubComment("pr-preview-comment", {
    owner: process.env.GITHUB_REPOSITORY_OWNER || "holic",
    repository: process.env.GITHUB_REPOSITORY_NAME || "ens-ideas",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `
## 🚀 Preview Deployed

**Site:** ${site.url}
**API:** ${worker.url}

Built from commit ${process.env.GITHUB_SHA}

---
<sub>🤖 Updated automatically on each push to this PR.</sub>`,
  });
}

await app.finalize();
