// Checks each RPC in src/rpcUrls.ts against a real ENS resolution (forward +
// reverse for vitalik.eth) and prints latency. Run: `pnpm run verify:rpcs`.
import { createClient, http } from "viem";
import { mainnet } from "viem/chains";
import { getEnsAddress, getEnsName, normalize } from "viem/ens";
import { rpcUrls } from "../src/rpcUrls.ts";

const VITALIK = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

const results = await Promise.all(
  rpcUrls.map(async (url) => {
    const client = createClient({
      chain: mainnet,
      transport: http(url, { retryCount: 0, timeout: 8000 }),
    });
    const start = Date.now();
    try {
      const [forward, reverse] = await Promise.all([
        getEnsAddress(client, { name: normalize("vitalik.eth") }),
        getEnsName(client, { address: VITALIK }),
      ]);
      const ok = forward?.toLowerCase() === VITALIK && reverse === "vitalik.eth";
      return `${ok ? "OK  " : "BAD "}${Date.now() - start}ms  ${url}`;
    } catch (error) {
      const message = String(
        (error as { shortMessage?: string }).shortMessage ??
          (error as Error).message ??
          error
      ).split("\n")[0];
      return `FAIL ${Date.now() - start}ms  ${url}  ${message.slice(0, 60)}`;
    }
  })
);

console.log(results.join("\n"));
if (results.some((line) => !line.startsWith("OK"))) process.exitCode = 1;
