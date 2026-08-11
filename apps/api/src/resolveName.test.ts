import { createClient } from "viem";
import { mainnet } from "viem/chains";
import { expect, it } from "vitest";
import { ethereumTransport } from "./ethereumTransport";
import { resolveName } from "./resolveName";

// ENSv2 moved resolution behind the new universal resolver, and names under
// `integration-tests.eth` only resolve through it. This hits mainnet on purpose:
// the thing worth guarding is that the *installed* viem still speaks ENSv2, and
// a mocked RPC would happily pass against a stale one. The fallback transport
// rolls past any public RPC that is down or rate-limiting.
const publicRpcUrls = [
  "https://ethereum-rpc.publicnode.com",
  "https://eth.drpc.org",
  "https://rpc.ankr.com/eth",
  "https://cloudflare-eth.com",
];

const client = createClient({
  chain: mainnet,
  transport: ethereumTransport(publicRpcUrls),
});

it("resolves an ENSv2 name", { timeout: 30_000 }, async () => {
  expect(await resolveName(client, "ur.integration-tests.eth")).toMatchObject({
    address: "0x2222222222222222222222222222222222222222",
    name: "ur.integration-tests.eth",
  });
});

it("resolves an ENSv1 name", { timeout: 30_000 }, async () => {
  expect(await resolveName(client, "vitalik.eth")).toMatchObject({
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    name: "vitalik.eth",
  });
});
