# ens-ideas-api

ENS resolver API worker. Resolves an Ethereum address to its primary ENS name
(and avatar), or an ENS name to its address, over a single route:

```
GET /ens/resolve/:addressOrName
```

The worker is defined in the root `alchemy.run.ts` (Alchemy v2) as the `api`
Cloudflare Worker — there is no per-app deploy config. It binds
`ETHEREUM_RPC_URL` (env string) and `RATE_LIMITER` (Cloudflare Rate Limiting).

Deploy / destroy from the repo root under bun:

```bash
bun run deploy --stage <stage> --yes
bun run destroy --stage <stage> --yes
```

Run the tests (miniflare + mocked RPC):

```bash
pnpm --filter ./apps/api test
```
