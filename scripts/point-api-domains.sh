#!/usr/bin/env bash
#
# Point the live API hostname at a Worker.
#
#   ./scripts/point-api-domains.sh ens-ideas-api-production   # cut over
#   ./scripts/point-api-domains.sh instant-ens-api            # roll back
#
# The cutover and its rollback are the same operation with a different target,
# so there's nothing to compose under pressure. Detach + attach run back-to-back,
# because a hostname can only belong to one Worker — that gap is the only
# downtime.
#
# Only api.ensideas.com moves. api.instantens.com is left alone on the old
# worker: it's unused, from an abandoned migration.
#
# Reads CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID from .env.
set -euo pipefail

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "usage: $0 <worker-name>" >&2
  exit 1
fi

cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

AUTH="Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
API="https://api.cloudflare.com/client/v4"
ACCT="${API}/accounts/${CLOUDFLARE_ACCOUNT_ID}"
HOSTS=(api.ensideas.com)

# Refuse to detach anything until the target is known-good: a typo here would
# take the API down with nowhere to send the traffic.
if ! curl -sf "${ACCT}/workers/scripts/${TARGET}" -H "$AUTH" >/dev/null; then
  echo "target worker '${TARGET}' not found — refusing to touch live domains" >&2
  exit 1
fi
echo "target: ${TARGET}"

owner_of() {
  curl -s "${ACCT}/workers/domains" -H "$AUTH" | python3 -c "
import sys, json
for r in json.load(sys.stdin).get('result', []):
    if r['hostname'] == '$1':
        print(r['id'], r.get('service'))
        break
"
}

for host in "${HOSTS[@]}"; do
  read -r cur_id cur_svc <<<"$(owner_of "$host")"

  if [ "${cur_svc:-}" = "$TARGET" ]; then
    echo "${host}: already on ${TARGET} — skipping"
    continue
  fi

  # Zone is inferred from the hostname, so this keeps working if ids change.
  zone_name="${host#*.}"
  zone_id=$(curl -s "${API}/zones?name=${zone_name}" -H "$AUTH" | python3 -c "
import sys, json
r = json.load(sys.stdin).get('result') or []
print(r[0]['id'] if r else '')
")
  if [ -z "$zone_id" ]; then
    echo "${host}: could not resolve zone '${zone_name}' — skipping" >&2
    continue
  fi

  echo "${host}: ${cur_svc:-<none>} -> ${TARGET}"
  [ -n "${cur_id:-}" ] && curl -sf -X DELETE "${ACCT}/workers/domains/${cur_id}" -H "$AUTH" >/dev/null
  curl -sf -X PUT "${ACCT}/workers/domains" -H "$AUTH" -H "content-type: application/json" \
    -d "{\"hostname\":\"${host}\",\"service\":\"${TARGET}\",\"environment\":\"production\",\"zone_id\":\"${zone_id}\"}" >/dev/null
  echo "  attached"
done

echo
echo "ownership now:"
curl -s "${ACCT}/workers/domains" -H "$AUTH" | python3 -c "
import sys, json
for r in json.load(sys.stdin).get('result', []):
    if r['hostname'] == 'api.ensideas.com':
        print(f\"  {r['hostname']:22} -> {r.get('service')}\")
"
echo "serving:"
for host in "${HOSTS[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://${host}/ens/resolve/vitalik.eth" || true)
  echo "  https://${host}/ens/resolve/vitalik.eth -> ${code}"
done
