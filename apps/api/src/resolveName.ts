import { getEnsAddress, normalize } from "viem/ens";
import { ResolveResult } from "./common";
import { getAvatar } from "./getAvatar";
import { Client, Transport, Chain } from "viem";

export async function resolveName(
  client: Client<Transport, Chain>,
  name: string
): Promise<ResolveResult> {
  const displayName = name;
  const avatar = getAvatar(name);
  try {
    const address = await getEnsAddress(client, { name: normalize(name) });
    return {
      address,
      name,
      displayName,
      avatar,
    };
  } catch (error) {
    return {
      address: null,
      name,
      displayName,
      avatar,
      error: String(error),
    };
  }
}
