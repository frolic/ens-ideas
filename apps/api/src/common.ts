import type { ApiEnv } from "../../../alchemy.run.ts";

export type ResolveResult = {
  address: string | null;
  name: string | null;
  displayName: string;
  avatar: string | null;
  error?: string;
};

/** KV key holding the health-checked RPC list the cron writes. */
export const RPCS_KEY = "healthy";

/** Runtime bindings the worker receives, inferred from the stack config. */
export type Env = ApiEnv;
