import { checkRpc } from "./checkRpc";
import { fetchChainlistRpcs } from "./fetchChainlistRpcs";
import { RPCS_KEY, type Env } from "./common";

/**
 * Health-check every chainlist candidate and store the survivors for the
 * resolver to rotate through. Runs on a cron so the pass happens once for the
 * whole fleet — the Cache API is per-colo, so doing this on the request path
 * would re-run it in every data center.
 */
export async function refreshRpcs(env: Env): Promise<void> {
  const candidates = [...new Set(await fetchChainlistRpcs())];
  const healthy = (
    await Promise.all(
      candidates.map(async (url) => ((await checkRpc(url)) ? url : null))
    )
  ).filter((url): url is string => url !== null);

  await env.RPCS.put(RPCS_KEY, JSON.stringify(healthy));
}
