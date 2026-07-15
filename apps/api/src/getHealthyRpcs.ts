import { checkRpc } from "./checkRpc";
import { fetchChainlistRpcs } from "./fetchChainlistRpcs";
import { rpcUrls } from "./rpcUrls";

const CACHE_KEY = "https://ens-ideas.internal/healthy-rpcs";

/**
 * How long a health-checked list stays good. This is the only freshness
 * signal: once the entry expires, `cache.match` misses and we refresh. Health
 * doesn't need tracking any tighter — the transport already falls through a
 * dead RPC to the next one.
 */
const MAX_AGE_SECONDS = 60 * 60;

let refreshing = false;

/**
 * The known-good ENS RPCs, health-checked and cached. A cold or expired cache
 * serves the committed seed list immediately and refreshes in the background,
 * so callers never block on a health-check pass.
 */
export async function getHealthyRpcs(
  ctx: ExecutionContext
): Promise<readonly string[]> {
  const cache = caches.default;
  const cached = await cache.match(CACHE_KEY);
  if (cached) return await cached.json<string[]>();

  ctx.waitUntil(refresh(cache));
  return rpcUrls;
}

/** Health-check chainlist candidates + the seed list and cache the survivors. */
async function refresh(cache: Cache): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  try {
    const candidates = await fetchChainlistRpcs().catch(() => []);
    const unique = [...new Set([...candidates, ...rpcUrls])];
    const healthy = (
      await Promise.all(
        unique.map(async (url) => ((await checkRpc(url)) ? url : null))
      )
    ).filter((url): url is string => url !== null);

    await cache.put(
      CACHE_KEY,
      Response.json(healthy.length ? healthy : [...rpcUrls], {
        headers: { "Cache-Control": `public, max-age=${MAX_AGE_SECONDS}` },
      })
    );
  } finally {
    refreshing = false;
  }
}
