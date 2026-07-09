import { checkRpc } from "./checkRpc";
import { fetchChainlistRpcs } from "./fetchChainlistRpcs";
import { rpcUrls } from "./rpcUrls";

const CACHE_KEY = "https://ens-ideas.internal/rpc-pool";
const FRESH_MS = 5 * 60 * 1000;

export type Pool = { generatedAt: number; checked: number; rpcs: string[] };

const seedPool = (): Pool => ({ generatedAt: 0, checked: 0, rpcs: [...rpcUrls] });

let refreshing = false;

/**
 * The current pool of known-good ENS RPCs plus freshness metadata. Reads a
 * cached, periodically-refreshed health-checked list from the Cache API; on a
 * cold or stale cache it returns the committed seed list immediately (with
 * `generatedAt: 0`) and refreshes in the background (via `waitUntil`), so callers
 * never block on the health-check pass.
 */
export async function getRpcPool(ctx: ExecutionContext): Promise<Pool> {
  const cache = caches.default;
  const cached = await cache.match(CACHE_KEY);

  if (!cached) {
    ctx.waitUntil(refresh(cache));
    return seedPool();
  }

  const pool: Pool = await cached.json();
  if (Date.now() - pool.generatedAt >= FRESH_MS) {
    ctx.waitUntil(refresh(cache));
  }
  return pool.rpcs.length ? pool : seedPool();
}

/** Just the RPC URLs from {@link getRpcPool}. */
export async function getHealthyRpcs(
  ctx: ExecutionContext
): Promise<readonly string[]> {
  return (await getRpcPool(ctx)).rpcs;
}

/** Health-check chainlist candidates + the seed list and cache the survivors. */
async function refresh(cache: Cache): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  try {
    const candidates = await fetchChainlistRpcs().catch(() => []);
    const unique = [...new Set([...candidates, ...rpcUrls])];
    const healthy = (
      await Promise.all(unique.map(async (url) => ((await checkRpc(url)) ? url : null)))
    ).filter((url): url is string => url !== null);

    const pool: Pool = {
      generatedAt: Date.now(),
      checked: unique.length,
      rpcs: healthy.length ? healthy : [...rpcUrls],
    };
    await cache.put(
      CACHE_KEY,
      Response.json(pool, {
        headers: { "Cache-Control": "public, max-age=86400" },
      })
    );
  } finally {
    refreshing = false;
  }
}
