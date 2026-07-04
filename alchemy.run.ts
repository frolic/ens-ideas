import alchemy from "alchemy";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";
import { Assets, RateLimit, Worker } from "alchemy/cloudflare";

const app = await alchemy("instant-ens-api", {
  stateStore: (scope) => new CloudflareStateStore(scope),
});

const stage = app.stage;
const isProd = stage === "prod";

// Both workers are fully stage-aware in BOTH name and hostname. Only the `prod`
// stage uses the production worker names + live hostnames; every other stage
// deploys a completely separate parallel stack (distinct worker names on
// `<stage>.ensideas.com` hostnames) so a non-prod deploy can never touch the
// live `instant-ens-api` worker or its domains.
//
// NOTE: the live API worker is currently managed under the `kevin` stage — do
// NOT deploy that stage with this config (it would rename the live worker).
// Use `deploy:beta` for the parallel test and `deploy:prod` for the takeover.

// API worker.
export const worker = await Worker("worker", {
  name: isProd ? "instant-ens-api" : `instant-ens-api-${stage}`,
  entrypoint: "api/src/worker.ts",
  adopt: true,
  domains: isProd
    ? ["api.instantens.com", "api.ensideas.com"]
    : [`api-${stage}.ensideas.com`],
  bindings: {
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL!,
    RATE_LIMITER: RateLimit({
      // Distinct namespace off-prod so a test never shares the live counter.
      namespace_id: isProd ? 1001 : 1002,
      simple: { limit: 1000, period: 60 },
    }),
  },
});

// Site worker — Waku SSR frontend, prebuilt by `waku build` (Cloudflare adapter).
const siteAssets = await Assets({ path: "site/dist/public" });

export const site = await Worker("site", {
  name: isProd ? "ens-ideas-site" : `ens-ideas-site-${stage}`,
  entrypoint: "site/dist/server/index.js",
  adopt: true,
  noBundle: true,
  rules: [{ globs: ["**/*.js", "**/*.mjs"] }],
  assets: { html_handling: "drop-trailing-slash" },
  bindings: { ASSETS: siteAssets },
  compatibilityFlags: ["nodejs_als"],
  compatibilityDate: "2025-11-17",
  domains: isProd ? ["ensideas.com", "www.ensideas.com"] : [`${stage}.ensideas.com`],
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
