/**
 * Free public Ethereum mainnet RPC endpoints — full nodes that serve the ENS
 * universal-resolver `eth_call`s we need. These are tried (in random order)
 * ahead of the paid endpoint so it's only used when every free RPC is failing
 * or rate-limited. Edit freely to tune the pool.
 */
export const rpcUrls = [
  "https://eth.llamarpc.com",
  "https://ethereum-rpc.publicnode.com",
  "https://eth.drpc.org",
  "https://cloudflare-eth.com",
  "https://1rpc.io/eth",
  "https://eth.meowrpc.com",
] as const;
