import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

// Alchemy v2 (Effect) — deploys the Waku SSR site as a Cloudflare Worker.
// The API worker is added later. Non-prod stages get a workers.dev URL; prod
// takes the live hostnames.
export default Alchemy.Stack(
  "ens-ideas",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const site = yield* Cloudflare.Worker("site", {
      main: "apps/site/dist/server/index.js",
      assets: "apps/site/dist/public",
      compatibility: { flags: ["nodejs_als"], date: "2025-11-17" },
      url: true,
    });
    return { url: site.url };
  })
);
