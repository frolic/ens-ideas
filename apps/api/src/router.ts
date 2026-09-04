import {
  AutoRouter,
  IRequestStrict,
  status,
  json,
  cors,
  error,
} from "itty-router";
import { createClient, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { ethereumTransport } from "./ethereumTransport";
import { resolveAddress } from "./resolveAddress";
import { resolveName } from "./resolveName";
import { resolveUrl } from "./resolveUrl";
import { RPCS_KEY, type Env } from "./common";

const { preflight, corsify } = cors();

export const router = AutoRouter<
  IRequestStrict,
  [Env, ExecutionContext],
  Response
>({
  before: [preflight],
  finally: [corsify],
  // Invocation logs are off (see alchemy.run.ts), so failures are the only
  // thing that reaches Workers Logs and each one has to be logged explicitly.
  catch: (thrown, request) => {
    console.error("unhandled error", request.url, thrown);
    return error(thrown);
  },
});

router.get("/ens/resolve/:address", async ({ url, params }, env) => {
  // Kept fresh by the cron. Empty (cold KV) just means straight to the paid RPC.
  const healthy = (await env.RPCS.get<string[]>(RPCS_KEY, "json")) ?? [];
  const client = createClient({
    chain: mainnet,
    transport: ethereumTransport(healthy, env.ETHEREUM_RPC_URL),
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
    console.error("resolve failed", url, data.error);
    return json(data, { status: 500 });
  }

  return json(data, {
    headers: {
      "Cache-Control": `s-maxage=${60 * 60 * 24}, stale-while-revalidate`,
    },
  });
});
