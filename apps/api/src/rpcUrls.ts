/**
 * Free public Ethereum mainnet RPC endpoints, tried (in random order) ahead of
 * the paid endpoint so it's only used when every free RPC is failing or
 * rate-limited. Edit freely to tune the pool.
 *
 * Every URL here was verified to resolve ENS forward + reverse (`vitalik.eth`)
 * in under 400ms. Re-check with `pnpm --filter ./api run verify:rpcs` if you add
 * more — many well-known public RPCs are down, rate-limited, or revert on the
 * universal-resolver call (llamarpc, cloudflare-eth, 1rpc, ankr all failed).
 */
export const rpcUrls = [
  "https://ethereum-rpc.publicnode.com",
  "https://eth.drpc.org",
  "https://eth-mainnet.public.blastapi.io",
  "https://eth.rpc.blxrbdn.com",
  "https://rpc.mevblocker.io",
  "https://eth-pokt.nodies.app",
  "https://gateway.tenderly.co/public/mainnet",
] as const;
