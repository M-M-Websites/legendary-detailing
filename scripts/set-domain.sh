#!/usr/bin/env bash
# Point every absolute URL on the site at the new custom domain.
# Usage (from the repository folder):   bash scripts/set-domain.sh legendarydetailing.com
# Works on macOS, Linux and Git Bash for Windows. Safe to run more than once.
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: bash scripts/set-domain.sh yourdomain.com" >&2
  exit 1
fi

DOMAIN="$(printf '%s' "$1" | sed -E 's#^https?://##; s#/.*$##' | tr 'A-Z' 'a-z')"
if ! printf '%s' "$DOMAIN" | grep -Eq '^[a-z0-9-]+(\.[a-z0-9-]+)+$'; then
  echo "That doesn't look like a domain name: $1" >&2
  exit 1
fi

cd "$(dirname "$0")/.."
NEW="https://$DOMAIN"

# Whatever site URL is currently in use (the GitHub Pages preview, or an earlier domain)
OLD="$(grep -o '<link rel="canonical" href="[^"]*"' index.html | sed -E 's/.*href="([^"]*)\/?"/\1/' | sed -E 's#/$##')"
if [ -z "$OLD" ]; then echo "Could not find the current site URL in index.html" >&2; exit 1; fi

for f in index.html sitemap.xml robots.txt; do
  OLD="$OLD" NEW="$NEW" perl -pi -e 's/\Q$ENV{OLD}\E/$ENV{NEW}/g' "$f"
done
# The 404 page uses root-relative paths; the custom domain serves the site from "/"
perl -pi -e 's#"/legendary-detailing/#"/#g' 404.html
# Refresh the sitemap date
TODAY="$(date +%Y-%m-%d)"
perl -pi -e "s#<lastmod>[^<]*</lastmod>#<lastmod>$TODAY</lastmod>#" sitemap.xml
# GitHub Pages reads this file to serve the custom domain (other hosts ignore it)
printf '%s\n' "$DOMAIN" > CNAME

echo "Done. The site now points to $NEW"
echo "Changed: index.html, sitemap.xml, robots.txt, 404.html, CNAME"
