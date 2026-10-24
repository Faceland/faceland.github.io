#!/usr/bin/env bash
# Deploy dj-server to the VPS from this machine, in one command:
#
#   dj-server/deploy/deploy.sh
#
# Runs the test suite, syncs dj-server/ to the box, runs deploy/remote.sh
# there (build, start, nginx, certificate), then does an end-to-end smoke
# check from here over the public internet.
#
# Settings come from the environment, or from deploy/.env.deploy (gitignored;
# see README). Which box this deploys to is deliberately not in the repo.
#   DJ_HOST        public hostname of the box, also the TLS name   (required)
#   DJ_SSH_ALIAS   ~/.ssh/config entry that holds the user and key (required)
#   CERTBOT_EMAIL  for the Let's Encrypt account (first deploy only; optional)
#   SKIP_TESTS=1   don't run the suite first
#   SKIP_SITE=1    don't rebuild and sync the page (server only; much faster)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$HERE/.env.deploy" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$HERE/.env.deploy"
  set +a
fi

HOST="${DJ_HOST:?set DJ_HOST, the public hostname of the box (or put it in deploy/.env.deploy)}"
SSH_ALIAS="${DJ_SSH_ALIAS:?set DJ_SSH_ALIAS, the ~/.ssh/config entry for the box (or put it in deploy/.env.deploy)}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
SKIP_TESTS="${SKIP_TESTS:-0}"
SKIP_SITE="${SKIP_SITE:-0}"

SRC="$(dirname "$HERE")"                     # dj-server/
SITE_SRC="$(dirname "$SRC")"                 # the site (repo root)
REMOTE_APP=/srv/faceland-dj/app
REMOTE_SITE=/srv/faceland-dj/site
# The alias points at the box's Tailscale address; HostName overrides it with
# the public name so this works whether or not the tailnet is up.
SSH_OPTS=(-o "HostName=$HOST" -o StrictHostKeyChecking=accept-new)

step() { printf '\n==> %s\n' "$*"; }

TAG="$(git -C "$SRC" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M)"
if [ -n "$(git -C "$SRC" status --porcelain -- . 2>/dev/null)" ]; then
  TAG="$TAG-dirty"
fi

if [ "$SKIP_TESTS" != 1 ]; then
  step "Tests"
  out="$(mktemp)"
  if (cd "$SRC" && npm test >"$out" 2>&1); then
    grep -E '^ℹ (tests|pass|fail)' "$out"
  else
    grep -E '^(✖|ℹ (tests|pass|fail))' "$out" || tail -40 "$out"
    echo "tests failed; not deploying (SKIP_TESTS=1 to override)"
    rm -f "$out"
    exit 1
  fi
  rm -f "$out"
fi

if [ "$SKIP_SITE" != 1 ]; then
  step "Build the page against wss://$HOST/ws"
  # react-scripts directly: skips the repo's prebuild (gem scrape, sitemap)
  # and postbuild (react-snap prerender), neither of which staging needs.
  # The explicit env var beats every .env file.
  (cd "$SITE_SRC" \
    && REACT_APP_DJ_SERVER_URL="wss://$HOST/ws" PUBLIC_URL=/ \
       node_modules/.bin/react-scripts build 2>&1 | tail -12)
  [ -f "$SITE_SRC/build/index.html" ] || { echo "no build/index.html; build failed"; exit 1; }
fi

# Catch a bad nginx config here rather than on the box, where remote.sh would
# stop halfway. Needs Docker locally; skipped (with a note) if it isn't there.
if docker version >/dev/null 2>&1; then
  step "nginx -t on the rendered config (locally, nginx:1.22)"
  tmp="$(mktemp -d)"
  sed "s/__HOST__/$HOST/g" "$HERE/nginx/dj.conf.tmpl" > "$tmp/dj.conf"
  docker run --rm -v "$tmp/dj.conf:/etc/nginx/conf.d/faceland-dj.conf:ro" nginx:1.22 \
    sh -c "mkdir -p /etc/letsencrypt/live/$HOST \
      && openssl req -x509 -newkey rsa:2048 -nodes -subj /CN=$HOST \
           -keyout /etc/letsencrypt/live/$HOST/privkey.pem \
           -out /etc/letsencrypt/live/$HOST/fullchain.pem -days 1 >/dev/null 2>&1 \
      && nginx -t" 2>&1 | tail -1
  status=${PIPESTATUS[0]}
  rm -rf "$tmp"
  [ "$status" = 0 ] || { echo "nginx config is invalid; not deploying"; exit 1; }
else
  echo "(no local Docker: skipping the nginx -t preflight)"
fi

step "Prepare $HOST"
ssh "${SSH_OPTS[@]}" "$SSH_ALIAS" '
  set -e
  command -v rsync >/dev/null || sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq rsync
  sudo install -d -m 755 -o "$USER" -g "$USER" /srv/faceland-dj /srv/faceland-dj/app /srv/faceland-dj/site
  echo "ok: $(hostname), $(docker --version)"
'

step "Sync dj-server/ -> $REMOTE_APP (tag $TAG)"
rsync -az --delete \
  --exclude node_modules --exclude test --exclude .git \
  -e "ssh ${SSH_OPTS[*]}" \
  "$SRC/" "$SSH_ALIAS:$REMOTE_APP/"

if [ "$SKIP_SITE" != 1 ]; then
  step "Sync build/ -> $REMOTE_SITE"
  # Resource packs are large inert downloads for the Minecraft client;
  # nothing on the DJ page links to them.
  rsync -az --delete --exclude resource-packs \
    -e "ssh ${SSH_OPTS[*]}" \
    "$SITE_SRC/build/" "$SSH_ALIAS:$REMOTE_SITE/"
fi

step "Remote"
ssh "${SSH_OPTS[@]}" "$SSH_ALIAS" \
  "bash '$REMOTE_APP/deploy/remote.sh' '$HOST' '$TAG' '$CERTBOT_EMAIL'"

step "Smoke check from here"
node "$HERE/smoke.js" "wss://$HOST/ws" "https://$HOST"
