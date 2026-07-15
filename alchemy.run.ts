import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Command from "alchemy/Command";
import * as Output from "alchemy/Output";
import * as Effect from "effect/Effect";

// Alchemy v2 (Effect) — deploys the Waku SSR site as a Cloudflare Worker.
// The API worker is added later. Non-prod stages get a workers.dev URL; prod
// takes the live hostnames.
//
// `alchemy deploy` builds Waku in-graph (Command.Build) and deploys the worker;
// `alchemy dev` runs Waku's own dev server (Command.Dev) and serves from it.
// Run under bun (`bun run deploy` / `bun run dev`) so the CLI loads this .ts
// config natively.
export default Alchemy.Stack(
  "ens-ideas",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const ctx = yield* Alchemy.AlchemyContext;
    const stage = yield* Alchemy.Stage;

    // Local dev: run Waku's Vite dev server and hand the worker off to it —
    // skip the build, don't start a local workerd instance.
    const dev = ctx.dev
      ? yield* Command.Dev("site-dev", {
          command: "pnpm --filter ./apps/site dev",
        })
      : undefined;

    // Deploy: build the Waku Cloudflare output in-graph. The worker's assets
    // depend on this build's outdir, so the build runs first.
    const build = dev
      ? undefined
      : yield* Command.Build("site-build", {
          command: "pnpm --filter ./apps/site build",
          env: { CLOUDFLARE: "1" },
          outdir: "apps/site/dist",
        });

    const site = yield* Cloudflare.Worker("site", {
      // Deterministic name → predictable workers.dev URL per stage
      // (ens-ideas-site-pr-16.<subdomain>.workers.dev), no random hash.
      name: `ens-ideas-site-${stage}`,
      main: "apps/site/dist/server/index.js",
      assets: build ? Output.interpolate`${build.outdir}/public` : undefined,
      compatibility: { flags: ["nodejs_als"], date: "2025-11-17" },
      // Production serves the live domain; other stages stay on workers.dev.
      domain:
        stage === "production"
          ? ["ensideas.com", "www.ensideas.com"]
          : undefined,
      dev: dev ? { mode: "external", url: dev.url } : undefined,
      url: true,
    });

    // ENS resolver API. v2 bundles the TS entry with rolldown, so no build
    // step (unlike the Waku site). Stays on workers.dev for now — the
    // api.ensideas.com / api.instantens.com cutover is a deliberate follow-up
    // (those hostnames currently serve the live `instant-ens-api` worker,
    // managed from a separate repo).
    // Holds the health-checked RPC list. KV rather than the Cache API because
    // the cron that refreshes it runs in one colo, and the Cache API is
    // per-colo — every other colo would never see it.
    const rpcs = yield* Cloudflare.KV.Namespace("rpcs");

    const api = yield* Cloudflare.Worker("api", {
      name: `ens-ideas-api-${stage}`,
      main: "apps/api/src/worker.ts",
      compatibility: { flags: ["nodejs_compat"], date: "2025-11-17" },
      // Hourly health-check pass, once for the whole fleet.
      crons: ["0 * * * *"],
      env: {
        ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL!,
        RATE_LIMITER: Cloudflare.RateLimit("RATE_LIMITER", {
          namespaceId: 1001,
          simple: { limit: 1000, period: 60 },
        }),
        RPCS: rpcs,
      },
      url: true,
    });

    return { site: site.url, api: api.url };
  })
);
