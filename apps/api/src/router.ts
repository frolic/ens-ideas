import { AutoRouter, IRequestStrict, status, json, cors } from "itty-router";
import { createClient, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { ethereumTransport } from "./ethereumTransport";
import { getHealthyRpcs, getRpcPool } from "./getHealthyRpcs";
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

// Current pool of known-good ENS RPCs (health-checked, cached). Handy for
// debugging and reused by the resolver below.
router.get("/rpcs", async (_request, _env, ctx) => {
  return json(await getRpcPool(ctx), {
    headers: { "Cache-Control": "public, max-age=60" },
  });
});

router.get("/ens/resolve/:address", async ({ url, params }, env, ctx) => {
  const client = createClient({
    chain: mainnet,
    transport: ethereumTransport(
      await getHealthyRpcs(ctx),
      env.ETHEREUM_RPC_URL
    ),
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
