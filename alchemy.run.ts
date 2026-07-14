import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Command from "alchemy/Command";
import * as Output from "alchemy/Output";
import * as Effect from "effect/Effect";

// Alchemy v2 (Effect) — deploys the Waku SSR site as a Cloudflare Worker.
// The API worker is added later. Non-prod stages get a workers.dev URL; prod
// takes the live hostnames.
//
// The Waku build runs in-graph via Command.Build, so `alchemy deploy` is the
// single command — no separate build step. Run it under bun (`bun run deploy`)
// so the CLI loads this .ts config natively.
export default Alchemy.Stack(
  "ens-ideas",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const build = yield* Command.Build("site-build", {
      command: "pnpm --filter ./apps/site build",
      env: { CLOUDFLARE: "1" },
      outdir: "apps/site/dist",
    });

    const site = yield* Cloudflare.Worker("site", {
      main: Output.interpolate`${build.outdir}/server/index.js`,
      assets: Output.interpolate`${build.outdir}/public`,
      compatibility: { flags: ["nodejs_als"], date: "2025-11-17" },
      url: true,
    });

    return { url: site.url };
  })
);
