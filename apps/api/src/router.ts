import { AutoRouter, IRequestStrict, status, json, cors } from "itty-router";
import { createClient, http, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { resolveAddress } from "./resolveAddress";
import { resolveName } from "./resolveName";
import { resolveUrl } from "./resolveUrl";
import type { Env } from "./common";

const { preflight, corsify } = cors();

export const router = AutoRouter<
  IRequestStrict,
  [Env, ExecutionContext],
  Response
>({
  before: [preflight],
  finally: [corsify],
});

router.get("/ens/resolve/:address", async ({ url, params }, env) => {
  const client = createClient({
    chain: mainnet,
    transport: http(env.ETHEREUM_RPC_URL),
  });

  const lowercaseAddress = params.address.toLowerCase();
  if (lowercaseAddress !== params.address) {
    return status(307, {
      headers: {
        Location: resolveUrl(url, lowercaseAddress),
      },
    });
  }

  const data = isAddress(lowercaseAddress)
    ? await resolveAddress(client, lowercaseAddress)
    : await resolveName(client, lowercaseAddress);

  if (data.error) {
    return json(data, { status: 500 });
  }

  return json(data, {
    headers: {
      "Cache-Control": `s-maxage=${60 * 60 * 24}, stale-while-revalidate`,
    },
  });
});
