import alchemy from "alchemy";
import { CloudflareStateStore } from "alchemy/state";
import { Assets, RateLimit, Worker } from "alchemy/cloudflare";

const app = await alchemy("instant-ens-api", {
  stateStore: (scope) => new CloudflareStateStore(scope),
});

const stage = app.stage;
const isProd = stage === "prod";

// Both workers are fully stage-aware. Only the `prod` stage uses the production
// worker names + live custom domains; every other stage deploys a completely
// separate parallel stack under distinct worker names, reachable at its
// workers.dev URL (`<name>.megabytes.workers.dev`) with no custom domain — so a
// non-prod deploy can never touch the live workers or the production DNS zone.
//
// NOTE: the live API worker is currently managed under the `kevin` stage — do
// NOT deploy that stage with this config (it would rename the live worker).
// Use `deploy:prod` for the takeover; CI deploys `pr-<n>` preview stages.

// API worker.
export const worker = await Worker("worker", {
  name: isProd ? "instant-ens-api" : `instant-ens-api-${stage}`,
  entrypoint: "apps/api/src/worker.ts",
  adopt: true,
  url: !isProd,
  domains: isProd ? ["api.instantens.com", "api.ensideas.com"] : [],
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
const siteAssets = await Assets({ path: "apps/site/dist/public" });

export const site = await Worker("site", {
  name: isProd ? "ens-ideas-site" : `ens-ideas-site-${stage}`,
  entrypoint: "apps/site/dist/server/index.js",
  adopt: true,
  url: !isProd,
  noBundle: true,
  rules: [{ globs: ["**/*.js", "**/*.mjs"] }],
  assets: { html_handling: "drop-trailing-slash" },
  bindings: { ASSETS: siteAssets },
  compatibilityFlags: ["nodejs_als"],
  compatibilityDate: "2025-11-17",
  domains: isProd ? ["ensideas.com", "www.ensideas.com"] : [],
});

await app.finalize();
