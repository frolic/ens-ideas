# Production takeover runbook

One-time cutover: move `ensideas.com` from Vercel to the Waku site worker and bring
the live API worker under the unified `prod` stage. Run this deliberately (ideally a
low-traffic window). Delete this doc once the takeover is done.

## What `deploy:prod` does

`pnpm run deploy:prod` builds the site and runs `alchemy deploy --stage prod`, which
(because `stage === "prod"`) uses production names + live hostnames:

- **API worker** `instant-ens-api` — `adopt: true` claims the **already-live** worker
  and (re)attaches `api.ensideas.com` + `api.instantens.com`. Same code, so this is
  effectively a no-op re-apply of the resolver.
- **Site worker** `ens-ideas-site` — attaches `ensideas.com` + `www.ensideas.com`,
  which moves those hostnames off the Vercel origin onto the worker.

## Pre-flight

- [ ] PR #9 reviewed; the workers.dev preview looks good.
- [ ] `ETHEREUM_RPC_URL` present in local `.env` (needed for the API worker binding).
- [ ] Cloudflare token still valid locally (`alchemy` uses the OAuth login / `.env`).
- [ ] Have the Vercel dashboard open for rollback.

## ⚠️ Gotchas

- **Never run `alchemy destroy --stage kevin`.** The live API worker is historically
  managed under the `kevin` stage. After `deploy:prod` adopts it into `prod`, the
  `kevin` state still references the *same* Cloudflare worker — destroying `kevin`
  would delete the live worker. Leave the `kevin` stage state orphaned (harmless as
  long as nobody deploys/destroys it).
- **www vs apex**: both `ensideas.com` and `www.ensideas.com` are bound to the site
  worker, so both serve the site (no www→apex redirect yet). Add a redirect later if
  you want canonical URLs.

## Takeover

1. [ ] `cd /Users/kevin/Projects/frolic/ens-ideas && pnpm run deploy:prod`
2. [ ] Watch the output: API worker should show `[adopted]`/no changes; the site worker
       + `ensideas.com`/`www.ensideas.com` should be created. Custom-domain + cert
       provisioning can take a few seconds.

## Verify

3. [ ] `curl -s -o /dev/null -w '%{http_code}' https://api.ensideas.com/ens/resolve/vitalik.eth` → `200` (resolver still serving).
4. [ ] `curl -s https://ensideas.com/ | grep -o '<title>[^<]*</title>'` → the ENS Ideas title (SSR from the worker).
5. [ ] Confirm `ensideas.com` no longer returns `x-vercel-*` headers (`curl -sD- -o/dev/null https://ensideas.com/`).
6. [ ] Open `https://ensideas.com` — search resolves a name, the recent-registrations feed polls, all routes work.

## Cutover cleanup

7. [ ] Disconnect the Vercel project (remove the GitHub integration or delete the
       project) so it stops building `main` and doesn't contend for the domain.
8. [ ] Merge PR #9 → `main`. (CI on `main` is build+test only — it will **not**
       auto-deploy prod.)

## Rollback

If the worker-served site misbehaves: re-add `ensideas.com` in Vercel and restore its
DNS to point back at Vercel; the site worker's custom domain can be removed via the
config (`domains` for prod) + redeploy, or by removing the custom domain in the
Cloudflare dashboard. The API worker is unaffected (only adopted, same code).
