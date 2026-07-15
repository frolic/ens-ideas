import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { rpcUrls } from "./rpcUrls";

vi.mock("./checkRpc", () => ({ checkRpc: vi.fn() }));
vi.mock("./fetchChainlistRpcs", () => ({ fetchChainlistRpcs: vi.fn() }));

import { checkRpc } from "./checkRpc";
import { fetchChainlistRpcs } from "./fetchChainlistRpcs";
import { getHealthyRpcs } from "./getHealthyRpcs";

const mockCheck = vi.mocked(checkRpc);
const mockChainlist = vi.mocked(fetchChainlistRpcs);

let store: Response | undefined;
const cache = {
  match: vi.fn(async () => store),
  put: vi.fn(async (_key: unknown, res: Response) => {
    store = res;
  }),
};

function makeCtx() {
  const tasks: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => tasks.push(p),
  } as unknown as ExecutionContext;
  return { ctx, tasks };
}

beforeEach(() => {
  store = undefined;
  vi.clearAllMocks();
  vi.stubGlobal("caches", { default: cache });
});
afterEach(() => vi.unstubAllGlobals());

it("returns the seed list on a cold cache, then caches the health-checked survivors", async () => {
  mockChainlist.mockResolvedValue(["https://good.example", "https://bad.example"]);
  mockCheck.mockImplementation(
    async (url) =>
      url === "https://good.example" ||
      (rpcUrls as readonly string[]).includes(url)
  );
  const { ctx, tasks } = makeCtx();

  expect(await getHealthyRpcs(ctx)).toEqual(rpcUrls); // seed served immediately

  await Promise.all(tasks); // let the background refresh finish
  expect(cache.put).toHaveBeenCalledOnce();
  const healthy: string[] = await store!.json();
  expect(healthy).toContain("https://good.example");
  expect(healthy).not.toContain("https://bad.example");
});

it("lets the cache own freshness via max-age", async () => {
  mockChainlist.mockResolvedValue([]);
  mockCheck.mockResolvedValue(true);
  const { ctx, tasks } = makeCtx();

  await getHealthyRpcs(ctx);
  await Promise.all(tasks);

  expect(store!.headers.get("Cache-Control")).toMatch(/max-age=\d+/);
});

it("serves the cached list without refreshing", async () => {
  store = Response.json(["https://cached.example"]);
  const { ctx, tasks } = makeCtx();

  expect(await getHealthyRpcs(ctx)).toEqual(["https://cached.example"]);
  expect(tasks).toHaveLength(0);
  expect(mockChainlist).not.toHaveBeenCalled();
});
