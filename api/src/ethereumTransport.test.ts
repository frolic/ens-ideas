import { afterEach, expect, it, vi } from "vitest";
import { createClient, numberToHex } from "viem";
import { mainnet } from "viem/chains";
import { ethereumTransport } from "./ethereumTransport";
import { rpcUrls } from "./rpcUrls";

const PAID_RPC_URL = "https://paid.mock/";
const paidHost = new URL(PAID_RPC_URL).host;
const freeHosts = rpcUrls.map((url) => new URL(url).host);

afterEach(() => vi.unstubAllGlobals());

// Stub global fetch, recording the host of every RPC request and delegating the
// response to `respond(host)`. The JSON-RPC id is echoed so viem accepts it.
function stubFetch(respond: (host: string) => { status: number; result?: unknown }) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", async (input: string | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    calls.push(url.host);
    const id = JSON.parse(String(init?.body ?? "{}")).id ?? 1;
    const { status, result } = respond(url.host);
    if (status !== 200) return new Response("rate limited", { status });
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
      headers: { "content-type": "application/json" },
    });
  });
  return calls;
}

const blockNumber = numberToHex(123n);

function requestBlockNumber() {
  const client = createClient({
    chain: mainnet,
    transport: ethereumTransport(PAID_RPC_URL),
  });
  return client.request({ method: "eth_blockNumber" });
}

it("serves from a free RPC and never touches the paid endpoint when free RPCs work", async () => {
  const calls = stubFetch((host) =>
    host === paidHost ? { status: 429 } : { status: 200, result: blockNumber }
  );

  expect(await requestBlockNumber()).toBe(blockNumber);
  expect(calls).not.toContain(paidHost);
  expect(freeHosts).toContain(calls[0]);
  expect(calls).toHaveLength(1); // first (random) free RPC answered — no rotation needed
});

it("falls back to the paid endpoint only after every free RPC is rate-limited", async () => {
  const calls = stubFetch((host) =>
    host === paidHost ? { status: 200, result: blockNumber } : { status: 429 }
  );

  expect(await requestBlockNumber()).toBe(blockNumber);
  // every free RPC was attempted, then the paid endpoint last
  expect(new Set(calls.slice(0, -1))).toEqual(new Set(freeHosts));
  expect(calls.at(-1)).toBe(paidHost);
});
