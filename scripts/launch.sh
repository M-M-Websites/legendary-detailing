#!/usr/bin/env bash
# Launch this site on its domain with Cloudflare, then check everything and print a report.
#
# Usage (from the repository folder, on your own computer):
#   bash scripts/launch.sh yourdomain.com
#
# What it does:
#   1. Pulls the latest code and points every URL at the domain (scripts/set-domain.sh).
#   2. Adds the domain and its www. to wrangler.toml as Worker custom domains.
#   3. Runs the test suite. Stops if anything fails.
#   4. Commits and pushes the changes.
#   5. Signs in to Cloudflare in your browser (wrangler login) if needed, then deploys.
#   6. Optional: if CLOUDFLARE_API_TOKEN is set, turns on SSL Full (strict), Always Use HTTPS,
#      Crawler Hints, and allows AI search crawlers. Otherwise it prints the dashboard steps.
#   7. Waits for the site to go live and checks headers, redirects, the 404 page, robots.txt,
#      sitemap.xml, llms.txt, the IndexNow key and that private files are not published.
#   8. Tells IndexNow (Bing and others) about the site.
#   9. Prints a pass/fail report and the few clicks left for you (Google and Bing).
#
# Needs: git, node 18+ (npx), curl, perl. Works in Git Bash on Windows, macOS and Linux.
# The domain must already be in your Cloudflare account (buy it in Cloudflare Registrar,
# or add it as a site and point its nameservers to Cloudflare).
# Safe to run again: each step skips what is already done.
set -uo pipefail

# ---------- helpers ----------
PASS=0; FAIL=0; WARN=0; REPORT=""
say()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
ok()   { PASS=$((PASS+1)); REPORT+="  PASS  $*"$'\n'; printf '  \033[32mPASS\033[0m  %s\n' "$*"; }
bad()  { FAIL=$((FAIL+1)); REPORT+="  FAIL  $*"$'\n'; printf '  \033[31mFAIL\033[0m  %s\n' "$*"; }
note() { WARN=$((WARN+1)); REPORT+="  TODO  $*"$'\n'; printf '  \033[33mTODO\033[0m  %s\n' "$*"; }
die()  { printf '\n\033[31mStopped: %s\033[0m\n' "$*" >&2; exit 1; }

# ---------- 0. inputs and tools ----------
[ $# -eq 1 ] || die "usage: bash scripts/launch.sh yourdomain.com"
DOMAIN="$(printf '%s' "$1" | sed -E 's#^https?://##; s#/.*$##; s#^www\.##' | tr 'A-Z' 'a-z')"
printf '%s' "$DOMAIN" | grep -Eq '^[a-z0-9-]+(\.[a-z0-9-]+)+$' || die "that doesn't look like a domain: $1"
cd "$(dirname "$0")/.." || die "can't find the repository folder"
for t in git node npx curl perl; do command -v "$t" >/dev/null 2>&1 || die "$t is not installed"; done
SITE="https://$DOMAIN"
UA="Mozilla/5.0 (compatible; MM-launch-check/1.0)"
KEY_FILE="$(ls 2>/dev/null | grep -E '^[0-9a-f]{32}\.txt$' | head -1)"
KEY="${KEY_FILE%.txt}"
echo "Launching $SITE from $(pwd)"

# ---------- 1. latest code, pointed at the domain ----------
say "1. Update the code and point it at $DOMAIN"
[ -z "$(git status --porcelain)" ] || die "you have uncommitted changes; commit or stash them first"
git pull --ff-only origin main || die "git pull failed"
bash scripts/set-domain.sh "$DOMAIN" || die "set-domain.sh failed"
if grep -rqs "github.io" index.html 404.html sitemap.xml robots.txt llms.txt; then
  bad "a github.io address is still in the site files"; die "fix the leftover github.io address first"
else ok "every URL points at $SITE"; fi

# ---------- 2. custom domains in wrangler.toml ----------
say "2. Attach $DOMAIN and www.$DOMAIN to the Worker"
WORKER="$(grep -E '^name *=' wrangler.toml | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
DOMAIN="$DOMAIN" perl -0pi -e '
  s/\n# Custom domains \(written by scripts\/launch\.sh\)\nroutes = \[[^\]]*\]\n//s;
  s/(\n\[assets\])/\n# Custom domains (written by scripts\/launch.sh)\nroutes = [\n  { pattern = "$ENV{DOMAIN}", custom_domain = true },\n  { pattern = "www.$ENV{DOMAIN}", custom_domain = true },\n]\n$1/;
' wrangler.toml
grep -q "pattern = \"www.$DOMAIN\"" wrangler.toml && ok "wrangler.toml routes: $DOMAIN, www.$DOMAIN (Worker \"$WORKER\")" || die "couldn't write routes to wrangler.toml"

# ---------- 3. tests ----------
say "3. Run the test suite"
if [ -f tests/package.json ]; then
  ( cd tests && npm install --silent && { npx --yes playwright install chromium >/dev/null 2>&1 || true; } && npm test ) \
    && ok "test suite passed" || die "tests failed; nothing was deployed. Fix the failures and run this again."
else note "no tests/ folder; skipped tests"; fi

# ---------- 4. commit and push ----------
say "4. Commit and push"
if [ -n "$(git status --porcelain)" ]; then
  git add -A && git commit -q -m "Launch on $DOMAIN: point URLs at the domain and attach custom domains" \
    && git push -q origin main && ok "pushed $(git rev-parse --short HEAD) to main" || die "commit or push failed"
else ok "nothing to commit; main is up to date ($(git rev-parse --short HEAD))"; fi

# ---------- 5. Cloudflare sign-in and deploy ----------
say "5. Deploy to Cloudflare"
if ! npx --yes wrangler whoami 2>/dev/null | grep -qi "associated with the email\|account id\|logged in"; then
  echo "  Opening Cloudflare in your browser. Sign in if asked, then click Allow."
  npx --yes wrangler login || die "Cloudflare sign-in didn't finish"
fi
if npx --yes wrangler deploy; then ok "deployed Worker \"$WORKER\" with $DOMAIN and www.$DOMAIN"
else die "wrangler deploy failed. If it says the zone wasn't found, $DOMAIN isn't in your Cloudflare account yet (or its nameservers aren't active)."; fi

# ---------- 6. zone settings ----------
say "6. Cloudflare settings"
cf() { curl -sS -X "$1" "https://api.cloudflare.com/client/v4$2" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" ${3:+--data "$3"}; }
cf_ok() { printf '%s' "$1" | grep -q '"success":true'; }
DASH_STEPS="SSL/TLS -> Overview: Full (strict); SSL/TLS -> Edge Certificates: Always Use HTTPS on; Security -> Settings -> Bot traffic: AI crawler access Allow for Search, Agents and Training, and 'Instructions for AI bot traffic with robots.txt' off; Caching -> Configuration: Crawler Hints on; Analytics -> Web Analytics: add $DOMAIN"
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  ZONE="$(cf GET "/zones?name=$DOMAIN" | perl -ne 'print $1 if /"result":\[\{"id":"([0-9a-f]{32})"/')"
  if [ -z "$ZONE" ]; then note "zone $DOMAIN not visible to the API token; do these in the dashboard: $DASH_STEPS"
  else
    cf_ok "$(cf PATCH "/zones/$ZONE/settings/ssl" '{"value":"strict"}')" && ok "SSL mode Full (strict)" || note "set SSL/TLS to Full (strict) in the dashboard"
    cf_ok "$(cf PATCH "/zones/$ZONE/settings/always_use_https" '{"value":"on"}')" && ok "Always Use HTTPS on" || note "turn on Always Use HTTPS in the dashboard"
    cf_ok "$(cf PUT "/zones/$ZONE/bot_management" '{"ai_bots_protection":"disabled","is_robots_txt_managed":false}')" \
      && ok "AI crawlers allowed; Cloudflare-managed robots.txt off" || note "in Security -> Settings -> Bot traffic: allow AI crawlers and turn off the managed robots.txt"
    cf_ok "$(cf PUT "/zones/$ZONE/flags/products/cache/changes" '{"feature":"crawlhints_enabled","value":true}')" \
      && ok "Crawler Hints on" || note "turn on Crawler Hints in Caching -> Configuration"
    note "turn on Web Analytics for $DOMAIN in Analytics -> Web Analytics (one click; cookie-free)"
  fi
else
  note "no CLOUDFLARE_API_TOKEN set, so set these in the dashboard (2 minutes): $DASH_STEPS"
fi

# ---------- 7. live checks ----------
say "7. Wait for $SITE to go live, then check it"
for i in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$SITE/")"; [ "$code" = "200" ] && break
  printf '  waiting for the site (%s)...\n' "$code"; sleep 10
done
[ "$code" = "200" ] && ok "$SITE/ returns 200" || bad "$SITE/ returned $code after 5 minutes"

H="$(curl -sI -A "$UA" "$SITE/" | tr -d '\r')"
for h in Content-Security-Policy Strict-Transport-Security X-Content-Type-Options X-Frame-Options Referrer-Policy Permissions-Policy; do
  printf '%s' "$H" | grep -qi "^$h:" && ok "header $h" || bad "header $h missing"
done
LIVE_CSP="$(printf '%s' "$H" | grep -i '^content-security-policy:' | sed -E 's/^[^:]+: *//')"
FILE_CSP="$(grep -m1 'Content-Security-Policy:' _headers | sed -E 's/^ *Content-Security-Policy: *//' | tr -d '\r')"
[ -n "$LIVE_CSP" ] && [ "$LIVE_CSP" = "$FILE_CSP" ] && ok "CSP matches _headers" || bad "live CSP doesn't match _headers"

loc() { curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -A "$UA" "$1"; }
r="$(loc "http://$DOMAIN/")";        [[ "$r" == 30[18]\ https://$DOMAIN/* ]] && ok "http -> https" || bad "http://$DOMAIN/ gave: $r"
r="$(loc "https://www.$DOMAIN/a?b=1")"; [[ "$r" == "301 https://$DOMAIN/a?b=1" ]] && ok "www -> $DOMAIN (path and query kept)" || bad "www redirect gave: $r"
code="$(curl -s -o /tmp/launch404.html -w '%{http_code}' -A "$UA" "$SITE/no-such-page-$RANDOM")"
[ "$code" = "404" ] && grep -qi "<h1" /tmp/launch404.html && ok "unknown pages return the branded 404" || bad "unknown page returned $code"

diff <(curl -s -A "$UA" "$SITE/robots.txt" | tr -d '\r') <(tr -d '\r' < robots.txt) >/dev/null \
  && ok "robots.txt matches the repo (nothing added by Cloudflare)" || bad "live robots.txt differs from the repo (turn off Cloudflare's managed robots.txt)"
for p in sitemap.xml llms.txt ${KEY_FILE:+$KEY_FILE}; do
  code="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$SITE/$p")"; [ "$code" = "200" ] && ok "/$p is published" || bad "/$p returned $code"
done
for p in tests/ scripts/launch.sh docs/SEO.md README.md wrangler.toml worker.js .git/config; do
  code="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$SITE/$p")"; [ "$code" = "404" ] && ok "/$p is private (404)" || bad "/$p returned $code; it should not be public"
done

# ---------- 8. IndexNow ----------
say "8. Tell IndexNow (Bing and others) about the site"
if [ -n "$KEY" ] && [ "$(curl -s -A "$UA" "$SITE/$KEY_FILE")" = "$KEY" ]; then
  URLS="$(curl -s -A "$UA" "$SITE/sitemap.xml" | perl -ne 'print "\"$1\"," while /<loc>\s*([^<\s]+)\s*<\/loc>/g' | sed 's/,$//')"
  code="$(curl -s -o /dev/null -w '%{http_code}' -X POST https://api.indexnow.org/indexnow -H 'Content-Type: application/json; charset=utf-8' -A "$UA" \
    --data "{\"host\":\"$DOMAIN\",\"key\":\"$KEY\",\"urlList\":[${URLS:-\"$SITE/\"}]}")"
  [[ "$code" == 20[02] ]] && ok "IndexNow accepted the URLs (HTTP $code; confirm later in Bing Webmaster Tools -> IndexNow)" || bad "IndexNow returned HTTP $code"
else note "IndexNow skipped: no key file at the site root, or it isn't served exactly"; fi

# ---------- 9. report ----------
say "Launch report: $DOMAIN"
printf '%s' "$REPORT"
printf '\n%s passed, %s failed, %s to do by hand\n' "$PASS" "$FAIL" "$WARN"
cat <<EOF

Left for you (about 5 minutes, needs your Google login):
  1. Google Search Console: search.google.com/search-console -> Add property -> Domain -> $DOMAIN
     -> choose "Verify with Cloudflare" (or add the TXT record it shows in Cloudflare DNS).
     Then Sitemaps -> submit sitemap.xml, and URL Inspection -> $SITE/ -> Request indexing.
  2. Bing: bing.com/webmasters -> Import from Google Search Console.
  3. Once you're happy, turn off the GitHub Pages preview (repo Settings -> Pages) so Google
     doesn't index the github.io copy.
  4. The booking form: the owner submits one test request and clicks "Activate Form" in the
     FormSubmit email.
EOF
[ "$FAIL" -eq 0 ] || exit 1
