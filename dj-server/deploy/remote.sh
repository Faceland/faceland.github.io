#!/usr/bin/env bash
# Runs ON the VPS, invoked by deploy.sh after it has synced dj-server/ to
# /srv/faceland-dj/app. Idempotent: safe to run again at any time.
#
#   remote.sh <public hostname> [image tag] [certbot email]
#
# What it does, in order: packages it needs, directories, the settings file
# (first time only), build + start the container, nginx config, a Let's Encrypt
# certificate (first time only), then a health check through the whole stack.
set -euo pipefail

HOST="${1:?usage: remote.sh <hostname> [tag] [email]}"
TAG="${2:-latest}"
EMAIL="${3:-}"

ROOT=/srv/faceland-dj
APP=$ROOT/app
SITE=$ROOT/site
RUN_DIR=$ROOT/run
ENV_FILE=$ROOT/dj.env
SOCKET=$RUN_DIR/dj.sock
DJ_UID=10001                       # the container's user, see deploy/Dockerfile
WEBROOT=/var/www/certbot
NGINX_CONF=/etc/nginx/conf.d/faceland-dj.conf
CERT=/etc/letsencrypt/live/$HOST/fullchain.pem

step() { printf '\n==> %s\n' "$*"; }
render() { sed "s/__HOST__/$HOST/g" "$1"; }

step "Packages"
missing=()
command -v certbot >/dev/null || missing+=(certbot)
command -v curl >/dev/null || missing+=(curl)
command -v nginx >/dev/null || command -v /usr/sbin/nginx >/dev/null || missing+=(nginx)
if [ ${#missing[@]} -gt 0 ]; then
  echo "installing: ${missing[*]}"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${missing[@]}"
else
  echo "all present"
fi

step "Directories"
sudo install -d -m 755 -o root -g root "$WEBROOT"
sudo install -d -m 755 -o "$DJ_UID" -g "$DJ_UID" "$RUN_DIR"
if [ ! -f "$ENV_FILE" ]; then
  install -m 600 "$APP/deploy/dj.env.example" "$ENV_FILE"
  echo "created $ENV_FILE from the example (edit it to set YOUTUBE_API_KEY etc.)"
else
  echo "keeping existing $ENV_FILE"
fi
# The page served from this host must be allowed to open the room. Added once;
# the rest of the file stays yours.
origin="https://$HOST"
if ! grep -q '^ALLOWED_ORIGINS=' "$ENV_FILE"; then
  echo "ALLOWED_ORIGINS=https://face.land,http://localhost:3000,$origin" >> "$ENV_FILE"
  echo "set ALLOWED_ORIGINS (including $origin)"
elif grep '^ALLOWED_ORIGINS=' "$ENV_FILE" | grep -q '\*'; then
  echo "ALLOWED_ORIGINS is '*'; nothing to add"
elif ! grep '^ALLOWED_ORIGINS=' "$ENV_FILE" | grep -qF "$origin"; then
  sed -i "s#^ALLOWED_ORIGINS=.*#&,$origin#" "$ENV_FILE"
  echo "added $origin to ALLOWED_ORIGINS"
fi
if [ -f "$SITE/index.html" ]; then
  echo "site: $(find "$SITE" -type f | wc -l) files in $SITE"
else
  echo "site: nothing in $SITE yet (deploy.sh builds and syncs it unless SKIP_SITE=1)"
fi

step "Container (faceland-dj:$TAG)"
cd "$APP/deploy"
export DJ_TAG="$TAG"
# Plain `docker build` rather than `compose build`: this box's compose wants
# buildx for its builder and the CLI doesn't have it. compose then starts the
# image it finds under that tag.
docker build --pull -q -f "$APP/deploy/Dockerfile" -t "faceland-dj:$TAG" "$APP" >/dev/null
docker tag "faceland-dj:$TAG" faceland-dj:latest
docker compose up -d --remove-orphans
# A recreated container leaves the previous socket file behind until the new
# server unlinks it, so probe over HTTP rather than for the file.
room=""
for _ in $(seq 1 40); do
  room="$(curl -fsS --unix-socket "$SOCKET" http://dj/ 2>/dev/null)" && break
  sleep 0.5
done
if [ -z "$room" ]; then
  echo "the server never answered on $SOCKET; container logs:"
  docker logs --tail 50 faceland-dj || true
  exit 1
fi
echo "socket: $room"

step "nginx"
sudo systemctl enable --now nginx >/dev/null 2>&1
# /etc/letsencrypt/live is root-only, so the check has to be too.
if ! sudo test -f "$CERT"; then
  echo "no certificate yet: installing the HTTP-only config first"
  render "$APP/deploy/nginx/bootstrap.conf.tmpl" | sudo tee "$NGINX_CONF" >/dev/null
  sudo nginx -t
  sudo systemctl reload nginx

  step "Certificate for $HOST (Let's Encrypt)"
  if [ -n "$EMAIL" ]; then
    email_args=(-m "$EMAIL")
  else
    email_args=(--register-unsafely-without-email)
  fi
  sudo certbot certonly --webroot -w "$WEBROOT" -d "$HOST" \
    --non-interactive --agree-tos "${email_args[@]}" \
    --deploy-hook 'systemctl reload nginx'
fi
render "$APP/deploy/nginx/dj.conf.tmpl" | sudo tee "$NGINX_CONF" >/dev/null
sudo nginx -t
sudo systemctl reload nginx

step "Survive a reboot"
# docker.service was disabled on this box (only the socket was enabled), so
# containers with a restart policy would not come back until something
# touched the Docker CLI. Enable it so the room returns on its own.
sudo systemctl enable docker >/dev/null 2>&1 && echo "docker.service enabled" || true

step "Health"
echo "room:  $(curl -fsS "https://$HOST/ws")"
echo "page:  $(curl -sS -o /dev/null -w '%{http_code} %{content_type}' "https://$HOST/dj")"
docker ps --filter name=faceland-dj --format '{{.Names}}: {{.Status}}, image {{.Image}}'
echo
echo "open:    https://$HOST/dj"
echo "logs:    docker logs -f faceland-dj"
echo "restart: cd $APP/deploy && docker compose up -d"
