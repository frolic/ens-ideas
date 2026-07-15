const CHAINLIST_URL = "https://chainlist.org/rpcs.json";
const MAINNET_CHAIN_ID = 1;

// Cap how many candidates we test so the health-check pass stays well under the
// Workers per-invocation subrequest limit.
const MAX_CANDIDATES = 40;

type ChainlistChain = { chainId: number; rpc: { url: string }[] };

/**
 * Fetches chainlist's Ethereum mainnet RPCs, keeping usable public HTTPS URLs
 * (dropping API-key-templated ones). These are candidates to be health-checked
 * before use — chainlist lists many that are down or don't support ENS.
 */
export async function fetchChainlistRpcs(): Promise<string[]> {
  const response = await fetch(CHAINLIST_URL, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`chainlist ${response.status}`);

  const chains: ChainlistChain[] = await response.json();
  const mainnet = chains.find((chain) => chain.chainId === MAINNET_CHAIN_ID);

  return (mainnet?.rpc ?? [])
    .map((entry) => entry.url)
    .filter((url) => url.startsWith("https://") && !url.includes("${"))
    .slice(0, MAX_CANDIDATES);
}
