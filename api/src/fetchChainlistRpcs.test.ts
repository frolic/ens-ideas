import { afterEach, expect, it, vi } from "vitest";
import { fetchChainlistRpcs } from "./fetchChainlistRpcs";

afterEach(() => vi.unstubAllGlobals());

it("keeps only mainnet https URLs without api-key placeholders", async () => {
  const chains = [
    {
      chainId: 1,
      rpc: [
        { url: "https://good.example" },
        { url: "https://keyed.example/${API_KEY}" },
        { url: "http://insecure.example" },
        { url: "wss://ws.example" },
      ],
    },
    { chainId: 10, rpc: [{ url: "https://optimism.example" }] },
  ];
  vi.stubGlobal("fetch", async () => Response.json(chains));

  expect(await fetchChainlistRpcs()).toEqual(["https://good.example"]);
});

it("throws on a non-ok chainlist response", async () => {
  vi.stubGlobal("fetch", async () => new Response("nope", { status: 500 }));
  await expect(fetchChainlistRpcs()).rejects.toThrow();
});
