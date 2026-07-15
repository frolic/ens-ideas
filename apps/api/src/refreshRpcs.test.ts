import { expect, it, vi } from "vitest";

vi.mock("./checkRpc", () => ({ checkRpc: vi.fn() }));
vi.mock("./fetchChainlistRpcs", () => ({ fetchChainlistRpcs: vi.fn() }));

import { checkRpc } from "./checkRpc";
import { fetchChainlistRpcs } from "./fetchChainlistRpcs";
import { refreshRpcs } from "./refreshRpcs";
import { RPCS_KEY, type Env } from "./common";

function makeEnv() {
  const put = vi.fn();
  return { env: { RPCS: { put } } as unknown as Env, put };
}

it("stores only the candidates that pass the health check", async () => {
  vi.mocked(fetchChainlistRpcs).mockResolvedValue([
    "https://good.example",
    "https://bad.example",
    "https://good.example", // chainlist can repeat an endpoint
  ]);
  vi.mocked(checkRpc).mockImplementation(
    async (url) => url === "https://good.example"
  );
  const { env, put } = makeEnv();

  await refreshRpcs(env);

  expect(put).toHaveBeenCalledWith(
    RPCS_KEY,
    JSON.stringify(["https://good.example"])
  );
});

it("stores an empty list when nothing is healthy, so the resolver uses the paid RPC", async () => {
  vi.mocked(fetchChainlistRpcs).mockResolvedValue(["https://bad.example"]);
  vi.mocked(checkRpc).mockResolvedValue(false);
  const { env, put } = makeEnv();

  await refreshRpcs(env);

  expect(put).toHaveBeenCalledWith(RPCS_KEY, JSON.stringify([]));
});
