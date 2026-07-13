import alchemy from "alchemy";
import { CloudflareStateStore } from "alchemy/state";
import { RateLimit, Worker } from "alchemy/cloudflare";

const app = await alchemy("instant-ens-api", {
  stateStore: (scope) => new CloudflareStateStore(scope),
});

export const worker = await Worker("worker", {
  name: "instant-ens-api",
  entrypoint: "src/worker.ts",
  adopt: true,
  domains: ["api.instantens.com", "api.ensideas.com"],
  bindings: {
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL!,
    RATE_LIMITER: RateLimit({
      namespace_id: 1001,
      simple: { limit: 1000, period: 60 },
    }),
  },
});

await app.finalize();
