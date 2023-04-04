import type { NextApiRequest, NextApiResponse } from "next";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { getAddress, isAddress, createPublicClient, http, Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

const provider = new StaticJsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETHEREUM_RPC_URL),
});

const firstParam = (param: string | string[]) => {
  return Array.isArray(param) ? param[0] : param;
};

const resolve = (from: string, to: string) => {
  const resolvedUrl = new URL(to, new URL(from, "resolve://"));
  if (resolvedUrl.protocol === "resolve:") {
    const { pathname, search, hash } = resolvedUrl;
    return `${pathname}${search}${hash}`;
  }
  return resolvedUrl.toString();
};

type ResponseData = {
  address: string | null;
  name: string | null;
  displayName: string;
  avatar: string | null;
  error?: string;
};

const getEnsName = async ({
  address,
}: {
  address: Address;
}): Promise<string | null> => {
  const ethersPromise = provider.lookupAddress(address);
  Promise.allSettled([
    ethersPromise,
    publicClient.getEnsName({ address }),
  ]).then(([ethersResult, viemResult]) => {
    if (JSON.stringify(ethersResult) !== JSON.stringify(viemResult)) {
      console.warn("Inconsistent results for getEnsName:", {
        address,
        ethersResult,
        viemResult,
      });
    }
  });
  return ethersPromise;
};

const getEnsAddress = async ({
  name,
}: {
  name: string;
}): Promise<string | null> => {
  const ethersPromise = provider.resolveName(name);
  Promise.allSettled([
    ethersPromise,
    publicClient.getEnsAddress({ name: normalize(name) }),
  ]).then(([ethersResult, viemResult]) => {
    if (JSON.stringify(ethersResult) !== JSON.stringify(viemResult)) {
      console.warn("Inconsistent results for getEnsAddress:", {
        name,
        ethersResult,
        viemResult,
      });
    }
  });
  return ethersPromise;
};

const getEnsAvatar = async ({
  name,
}: {
  name: string;
}): Promise<string | null> => {
  const ethersPromise = provider.getAvatar(name);
  Promise.allSettled([
    ethersPromise,
    publicClient.getEnsAvatar({ name: normalize(name) }),
  ]).then(([ethersResult, viemResult]) => {
    if (JSON.stringify(ethersResult) !== JSON.stringify(viemResult)) {
      console.warn("Inconsistent results for getEnsAvatar:", {
        name,
        ethersResult,
        viemResult,
      });
    }
  });
  return ethersPromise;
};

const resolveAddress = async (
  lowercaseAddress: string
): Promise<ResponseData> => {
  const address = getAddress(lowercaseAddress);
  let displayName = address.replace(
    /^(0x[0-9A-F]{3})[0-9A-F]+([0-9A-F]{4})$/i,
    "$1…$2"
  );

  try {
    const name = await getEnsName({ address });
    if (name) {
      displayName = name;
    }
    const avatar = name ? await getEnsAvatar({ name }) : null;
    return { address, name, displayName, avatar };
  } catch (error: any) {
    return {
      address,
      name: null,
      displayName,
      avatar: null,
      error: error.message,
    };
  }
};

const resolveName = async (name: string): Promise<ResponseData> => {
  const displayName = name;
  try {
    const [address, avatar] = await Promise.all([
      getEnsAddress({ name }),
      getEnsAvatar({ name }),
    ]);
    return { address, name, displayName, avatar };
  } catch (error: any) {
    return {
      address: null,
      name,
      displayName,
      avatar: null,
      error: error.message,
    };
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const inputAddress = firstParam(req.query.address);
  const lowercaseAddress = inputAddress.toLowerCase();

  if (inputAddress !== lowercaseAddress) {
    return res.redirect(307, resolve(req.url!, lowercaseAddress));
  }

  const data = isAddress(lowercaseAddress)
    ? await resolveAddress(lowercaseAddress)
    : await resolveName(lowercaseAddress);

  if (data.error) {
    return res.status(500).json(data);
  }

  return res
    .status(200)
    .setHeader(
      "CDN-Cache-Control",
      `s-maxage=${60 * 60 * 24}, stale-while-revalidate`
    )
    .json(data);
}
