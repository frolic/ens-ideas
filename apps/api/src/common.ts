export type ResolveResult = {
  address: string | null;
  name: string | null;
  displayName: string;
  avatar: string | null;
  error?: string;
};

/** KV key holding the health-checked RPC list the cron writes. */
export const RPCS_KEY = "healthy";

/**
 * Runtime bindings the worker receives. `RATE_LIMITER` is the native
 * Cloudflare Rate Limiting binding, `RPCS` holds the cron-refreshed RPC list,
 * and `ETHEREUM_RPC_URL` is a plain env string. Declared explicitly so runtime
 * code stays decoupled from the Alchemy stack config (the deploy graph in the
 * root `alchemy.run.ts`).
 */
export interface Env {
  ETHEREUM_RPC_URL: string;
  RATE_LIMITER: RateLimit;
  RPCS: KVNamespace;
}
