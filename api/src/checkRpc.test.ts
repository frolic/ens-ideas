import { afterEach, expect, it, vi } from "vitest";
import { checkRpc } from "./checkRpc";

afterEach(() => vi.unstubAllGlobals());

it("returns false when the RPC is rate-limited", async () => {
  vi.stubGlobal("fetch", async () => new Response("rate limited", { status: 429 }));
  expect(await checkRpc("https://rate-limited.example", 1000)).toBe(false);
});

it("returns false when the RPC network call fails", async () => {
  vi.stubGlobal("fetch", async () => {
    throw new Error("boom");
  });
  expect(await checkRpc("https://down.example", 1000)).toBe(false);
});
