import { fallback, http, type Transport } from "viem";

/**
 * viem transport that spreads ENS lookups across the given free public RPCs in a
 * random order, only falling back to the paid endpoint when every free RPC fails
 * (e.g. rate-limited). viem's `fallback` already retries each transport zero
 * times and advances to the next on any non-user error, so a 429 rolls over
 * transparently — keeping paid RPC usage, and cost, to a minimum.
 *
 * The random shuffle spreads load across the pool: without it `fallback` always
 * hits the first URL first and would hammer it into rate limits. A stateless
 * Worker can't do true round-robin (no shared counter), so per-request
 * randomization is the pragmatic equivalent.
 */
export function ethereumTransport(
  rpcUrls: readonly string[],
  paidRpcUrl?: string
): Transport {
  const free = shuffle(rpcUrls).map((url) => http(url));
  return fallback(paidRpcUrl ? [...free, http(paidRpcUrl)] : free);
}

function shuffle<value>(items: readonly value[]): value[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
