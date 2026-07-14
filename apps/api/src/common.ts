export type ResolveResult = {
  address: string | null;
  name: string | null;
  displayName: string;
  avatar: string | null;
  error?: string;
};

/**
 * Runtime bindings the worker receives. `RATE_LIMITER` is the native
 * Cloudflare Rate Limiting binding; `ETHEREUM_RPC_URL` is a plain env string.
 * Declared explicitly so runtime code stays decoupled from the Alchemy stack
 * config (the deploy graph in the root `alchemy.run.ts`).
 */
export interface Env {
  ETHEREUM_RPC_URL: string;
  RATE_LIMITER: RateLimit;
}
