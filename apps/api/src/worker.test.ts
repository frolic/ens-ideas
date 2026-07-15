import { afterAll, beforeAll, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { build } from "esbuild";
import { Miniflare } from "miniflare";
import { encodeAbiParameters } from "viem";

// Runs the bundled worker in miniflare with the rate limit lowered to 3/60s
// and the ETH RPC mocked, so behavior is verifiable without a deploy.
const RATE_LIMIT = 3;

const testDir = dirname(fileURLToPath(import.meta.url));

let mf: Miniflare;

beforeAll(async () => {
  const bundle = await build({
    entryPoints: [join(testDir, "worker.ts")],
    bundle: true,
    format: "esm",
    write: false,
    conditions: ["workerd", "worker", "browser"],
  });

  // Every eth_call reverse-resolves to vitalik.eth.
  const encodedReverseResult = encodeAbiParameters(
    [{ type: "string" }, { type: "address" }, { type: "address" }],
    [
      "vitalik.eth",
      "0x231b0ee14048e9dccd1d247744d114a4eb5e8e63",
      "0xa2c122be93b0074270ebee7f6b7292c7deb45047",
    ]
  );

  mf = new Miniflare({
    compatibilityDate: "2025-10-01",
    modules: [
      {
        type: "ESModule",
        path: join(testDir, "worker.bundle.mjs"),
        contents: bundle.outputFiles[0].text,
      },
    ],
    bindings: { ETHEREUM_RPC_URL: "https://rpc.mock/" },
    // Left empty: a cold RPC list is exactly the case where the resolver should
    // go straight to the paid endpoint (the mocked RPC below).
    kvNamespaces: ["RPCS"],
    ratelimits: {
      RATE_LIMITER: { namespace_id: "1001", simple: { limit: RATE_LIMIT, period: 60 } },
    },
    outboundService: async (request: Request) => {
      const url = new URL(request.url);
      if (url.hostname !== "rpc.mock") {
        return new Response(`unexpected outbound: ${request.url}`, {
          status: 500,
        });
      }
      const body = await request.json();
      const calls = Array.isArray(body) ? body : [body];
      const results = calls.map((call) => ({
        jsonrpc: "2.0",
        id: call.id,
        result: call.method === "eth_call" ? encodedReverseResult : "0x1",
      }));
      return Response.json(Array.isArray(body) ? results : results[0]);
    },
  });
});

afterAll(async () => {
  await mf.dispose();
});

const addresses = [
  "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444",
  "0x5555555555555555555555555555555555555555",
  "0x6666666666666666666666666666666666666666",
  "0x7777777777777777777777777777777777777777",
] as const;

function resolve(address: string, ip: string, method = "GET") {
  return mf.dispatchFetch(`http://api.test/ens/resolve/${address}`, {
    method,
    headers: { "cf-connecting-ip": ip },
  });
}

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Tests share rate-limiter state and run in order; each group uses its own IP.

it("serves uncached lookups and resolves via RPC", async () => {
  const res = await resolve(addresses[0], "1.1.1.1");
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ name: "vitalik.eth" });
  await sleep(200); // let waitUntil(cache.put) settle
});

it("does not charge cache hits against the limit", async () => {
  for (let i = 0; i < 5; i++) {
    expect((await resolve(addresses[0], "1.1.1.1")).status).toBe(200);
  }
  // budget still has 2 left despite 6 total requests
  expect((await resolve(addresses[1], "1.1.1.1")).status).toBe(200);
  expect((await resolve(addresses[2], "1.1.1.1")).status).toBe(200);
});

it("returns 429 with the right headers once uncached lookups exceed the limit", async () => {
  const res = await resolve(addresses[3], "1.1.1.1");
  expect(res.status).toBe(429);
  expect(res.headers.get("retry-after")).toBe("60");
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect(res.headers.get("access-control-allow-origin")).toBe("*");
});

it("still serves cached URLs to an over-limit IP", async () => {
  expect((await resolve(addresses[0], "1.1.1.1")).status).toBe(200);
});

it("does not cache 429s and keys the limit per IP", async () => {
  // same URL that 429'd above, different IP
  expect((await resolve(addresses[3], "2.2.2.2")).status).toBe(200);
});

it("does not charge OPTIONS preflights against the limit", async () => {
  for (let i = 0; i < 5; i++) {
    await resolve(addresses[4], "3.3.3.3", "OPTIONS");
  }
  expect((await resolve(addresses[4], "3.3.3.3")).status).toBe(200);
  expect((await resolve(addresses[5], "3.3.3.3")).status).toBe(200);
  expect((await resolve(addresses[6], "3.3.3.3")).status).toBe(200);
  expect((await resolve(addresses[7], "3.3.3.3")).status).toBe(429);
});
