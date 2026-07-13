import { normalize } from "viem/ens";

export function getAvatar(name: string): string {
  return `https://metadata.ens.domains/mainnet/avatar/${encodeURIComponent(
    normalize(name)
  )}`;
}
