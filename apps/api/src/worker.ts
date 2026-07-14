import { router } from "./router.ts";
import type { Env } from "./common.ts";

// TODO: detect deprecated /ens path prefix and strip/use cache without it

export default {
  async fetch(
    req: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const cacheKey = new Request(req.url.toLowerCase(), req);
    const cache = caches.default;

    let res = await cache.match(cacheKey);

    if (!res) {
      if (req.method !== "OPTIONS") {
        const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
        const { success } = await env.RATE_LIMITER.limit({ key: ip });
        if (!success) {
          return Response.json(
            { status: 429, error: "Too Many Requests" },
            {
              status: 429,
              headers: {
                "Retry-After": "60",
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
      }

      res = await router.fetch(req, env, ctx);
      ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }

    return res;
  },
};
