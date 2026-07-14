import { createClient, http } from "viem";
import { mainnet } from "viem/chains";
import { getEnsAddress, normalize } from "viem/ens";

const VITALIK = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

/**
 * True if the RPC is reachable and correctly serves the ENS universal-resolver
 * `eth_call` (forward-resolving `vitalik.eth`). This is the bar for a usable
 * endpoint — plenty of public RPCs are up but revert or lack ENS support.
 */
export async function checkRpc(url: string, timeout = 5000): Promise<boolean> {
  try {
    const client = createClient({
      chain: mainnet,
      transport: http(url, { retryCount: 0, timeout }),
    });
    const address = await getEnsAddress(client, { name: normalize("vitalik.eth") });
    return address?.toLowerCase() === VITALIK;
  } catch {
    return false;
  }
}
