// Health-checks each RPC in src/rpcUrls.ts with the same check the worker uses
// at runtime (ENS forward-resolve of vitalik.eth) and prints latency.
// Run: `pnpm run verify:rpcs`.
import { checkRpc } from "../src/checkRpc.ts";
import { rpcUrls } from "../src/rpcUrls.ts";

const results = await Promise.all(
  rpcUrls.map(async (url) => {
    const start = Date.now();
    const ok = await checkRpc(url, 8000);
    return `${ok ? "OK  " : "BAD "}${Date.now() - start}ms  ${url}`;
  })
);

console.log(results.join("\n"));
if (results.some((line) => !line.startsWith("OK"))) process.exitCode = 1;
