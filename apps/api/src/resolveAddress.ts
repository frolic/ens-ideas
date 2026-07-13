import { Chain, Client, getAddress, Transport } from "viem";
import { ResolveResult } from "./common";
import { getEnsName } from "viem/ens";
import { getAvatar } from "./getAvatar";

export async function resolveAddress(
  client: Client<Transport, Chain>,
  lowercaseAddress: string
): Promise<ResolveResult> {
  const address = getAddress(lowercaseAddress);
  let displayName = address.replace(
    /^(0x[0-9A-F]{3})[0-9A-F]+([0-9A-F]{4})$/i,
    "$1…$2"
  );

  try {
    const name = await getEnsName(client, { address });
    if (name) {
      displayName = name;
    }
    const avatar = name ? getAvatar(name) : null;
    return {
      address,
      name,
      displayName,
      avatar,
    };
  } catch (error) {
    return {
      address,
      name: null,
      displayName,
      avatar: null,
      error: String(error),
    };
  }
}
