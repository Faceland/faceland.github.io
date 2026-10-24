# Deploying the DJ staging environment to a VPS

A complete staging setup on a plain Debian box: the room server **and** a
build of the face.land page pointed at it, so anyone can open
`https://<host>/dj` and be in the staging room. The server side mirrors the
Faceland production box, nginx in front and the server on a Unix socket
behind it, but with the server in a container and everything needed to
reproduce it checked in here.

```
browser ──https──▶ nginx ──/ws──unix socket──▶ faceland-dj container  (the room)
                     │  └──/────unix socket──▶ same; its status line
                     └──/dj, /static, /assets──▶ /srv/faceland-dj/site   (the page, built
                        (anything else: 404)                               with REACT_APP_DJ_SERVER_URL
                                                                           = wss://<host>/ws)
```

Only the DJ page is reachable; the rest of the site's routes return 404 from
nginx. One caveat: the page is the whole single-page app, so the site's own
nav links still work client-side once you're on `/dj`. Hiding them for real
would be a frontend change (a staging flag).

Which box this deploys to is deliberately not in the repo. It lives in
`deploy/.env.deploy` (gitignored; copy `.env.deploy.example`), or in the
environment.

## One command

```sh
cp dj-server/deploy/.env.deploy.example dj-server/deploy/.env.deploy   # once; fill in
dj-server/deploy/deploy.sh                 # server + page
SKIP_SITE=1 dj-server/deploy/deploy.sh     # server only, much faster
```

That runs the test suite, builds the page against `wss://<host>/ws`, syncs
`dj-server/` to `/srv/faceland-dj/app` and the build to `/srv/faceland-dj/site`,
runs `remote.sh` on the box, and finishes with `smoke.js` opening a real
WebSocket from your machine over the public internet, presenting the staging
page's own origin. Safe to run again whenever; every step is idempotent.

First time only, `remote.sh` also installs certbot, creates the settings file
from `dj.env.example`, obtains a Let's Encrypt certificate, and enables
`docker.service` so the container returns after a reboot.

The page is built with `react-scripts build` directly, skipping the repo's
`prebuild` (gem-shop scrape, sitemap) and `postbuild` (react-snap prerender,
which is why CI pins Node 20). Staging needs neither; the build takes about
15 s on Node 22 or 24. Resource packs are left out of the sync.

| Setting | Purpose |
|---|---|
| `DJ_HOST` | Public hostname of the box and the TLS name. Required. |
| `DJ_SSH_ALIAS` | `~/.ssh/config` entry holding the user and key. Its `HostName` is overridden with `DJ_HOST`, so it works whether the alias points at a VPN address or the public one. Required. |
| `CERTBOT_EMAIL` | Let's Encrypt account email, used on the first deploy. Optional. |
| `SKIP_TESTS=1` | Skip the local test run. |
| `SKIP_SITE=1` | Skip building and syncing the page. |

## What the box needs

Debian 12 (or close), a user with passwordless sudo and Docker group
membership, Docker with the Compose plugin, nginx installed (it can be
disabled; `remote.sh` enables it), ports 80 and 443 reachable, and a public
hostname resolving to it. `remote.sh` installs certbot and rsync itself.

## Files

| File | What |
|---|---|
| `Dockerfile` | `node:22-alpine`, non-root user `djroom` (uid 10001), `npm ci --omit=dev --ignore-scripts`, healthcheck on the HTTP root. |
| `docker-compose.yml` | The container as it runs: read-only, no capabilities, 512 MB / 1 CPU, no published ports, socket dir bind-mounted. |
| `nginx/dj.conf.tmpl` | The nginx site: TLS, HTTP to HTTPS redirect, `/` and `/ws` proxied to the socket (upgrade headers and `X-Real-IP`; 20 connections and 5 upgrades per second per IP), `/dj` and its assets from the static build, immutable caching for hashed assets, 404 for everything else, the same security headers as vercel.json. |
| `nginx/bootstrap.conf.tmpl` | HTTP-only stand-in used while the first certificate is obtained. |
| `dj.env.example` | Server settings. Copied to `/srv/faceland-dj/dj.env` once, then yours to edit. |
| `.env.deploy.example` | Deploy settings (which box). Copied to `.env.deploy`, which is gitignored. |
| `remote.sh` | Everything that happens on the box. |
| `deploy.sh` | Everything that happens on your machine. |
| `smoke.js` | Connects, joins, leaves. Usable against any room server: `node deploy/smoke.js wss://host/ws`. |

## On the box

```
/srv/faceland-dj/
  app/        synced copy of dj-server/ (overwritten by every deploy)
  site/       the built page (overwritten by every deploy unless SKIP_SITE=1)
  dj.env      settings, kept across deploys, mode 600; remote.sh only ever
              adds this host to ALLOWED_ORIGINS
  run/dj.sock the socket, owned by uid 10001, world-connectable
```

```sh
docker logs -f faceland-dj                               # the server's output
cd /srv/faceland-dj/app/deploy && docker compose up -d   # restart (after editing dj.env)
docker compose ps                                        # status + health
curl --unix-socket /srv/faceland-dj/run/dj.sock http://dj/   # bypass nginx
sudo nginx -t && sudo systemctl reload nginx             # after touching nginx
sudo certbot renew --dry-run                             # renewals run from certbot.timer
```

Rolling back: images are tagged with the git short SHA that was deployed.
`docker images faceland-dj` lists them; `DJ_TAG=<sha> docker compose up -d`
in `app/deploy` runs an older one.

## Using it

Open `https://<host>/dj`. That's it; the page served there already talks to
the staging room. The bare host, `/`, shows the server's status line,
"Faceland DJ server: N in the room" (or "N in M rooms").

Rooms: the socket at `wss://<host>/ws` is the main room, `wss://<host>/ws/r/<id>`
is room `<id>` (short, lower-case, letters, digits, `-` and `_`), created when
the first person arrives and dropped when the last one leaves. The page
doesn't pick rooms yet, so everything is in the main room until it does.

To run the page locally against the staging room instead (for frontend work),
the dev page reads `REACT_APP_DJ_SERVER_URL`. In the site root:

```sh
echo 'REACT_APP_DJ_SERVER_URL=wss://<host>/ws' > .env.local
yarn start
```

`.env.local` is gitignored. The dev page's origin, `http://localhost:3000`,
is in the server's default `ALLOWED_ORIGINS`; the staging host is added by
`remote.sh`; anything else goes in `/srv/faceland-dj/dj.env`.

## Why a Unix socket and not a published port

The server trusts `X-Real-IP` only when the connection has no remote address
(a Unix socket) or comes from loopback. A container with a published port
would present the Docker bridge address instead, the header would be ignored,
every visitor would share one IP, and the 6-connections-per-IP cap would lock
the room after six tabs. The socket keeps the production contract intact
without changing the server. When the server grows a trusted-proxy setting,
this constraint goes away.

## Known limits of this setup

- If the hostname is one your VPS provider hands out rather than a domain
  you own, Let's Encrypt rate limits are shared with everyone else under
  that zone and issuance can be refused. The fix is a real domain pointed at
  the box, which is a one-line change to `DJ_HOST`.
- Nothing is persisted. A redeploy that changes the server restarts the
  container and empties the room; browsers rejoin with their saved name and
  playlists within a few seconds. A deploy that changes nothing about the
  server leaves the container, and the room, alone.
