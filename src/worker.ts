import { worker } from "../alchemy.run.ts";
import { router } from "./router.ts";

export default {
  async fetch(
    req: Request,
    env: typeof worker.Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const cacheKey = new Request(req.url.toLowerCase(), req);
    const cache = caches.default;

    let res = await cache.match(cacheKey);

    if (!res) {
      res = await router.fetch(req, env, ctx);
      ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }

    return res;
  },
};
