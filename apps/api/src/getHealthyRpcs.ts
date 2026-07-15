import { checkRpc } from "./checkRpc";
import { fetchChainlistRpcs } from "./fetchChainlistRpcs";
import { rpcUrls } from "./rpcUrls";

const CACHE_KEY = "https://ens-ideas.internal/healthy-rpcs";

/** How long a health-checked list is treated as fresh. */
const REFRESH_AFTER_SECONDS = 60 * 60;

/**
 * How long the entry survives at all — the stale-while-revalidate window.
 * It lives in `max-age` because the Cache API drops an entry the moment
 * `max-age` passes and ignores the `stale-while-revalidate` directive, so a
 * short `max-age` would leave us serving the seed list during every refresh.
 */
const MAX_AGE_SECONDS = 24 * 60 * 60;

let refreshing = false;

/**
 * The known-good ENS RPCs, health-checked and cached. Always serves the cached
 * list immediately, kicking off a background refresh once the entry ages past
 * {@link REFRESH_AFTER_SECONDS}, so no request ever pays for a health-check
 * pass. Falls back to the committed seed list only when nothing is cached.
 */
export async function getHealthyRpcs(
  ctx: ExecutionContext
): Promise<readonly string[]> {
  const cache = caches.default;
  const cached = await cache.match(CACHE_KEY);

  if (!cached) {
    ctx.waitUntil(refresh(cache));
    return rpcUrls;
  }

  // The cache stamps `Age` on every hit, so it already tracks freshness for us.
  const age = Number(cached.headers.get("Age") ?? 0);
  if (age >= REFRESH_AFTER_SECONDS) {
    ctx.waitUntil(refresh(cache));
  }
  return await cached.json<string[]>();
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
