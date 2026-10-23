# DJ room server

Realtime backend for [face.land/dj](https://face.land/dj). GitHub Pages only
serves static files, so this small Node process holds the room: who's on the
floor, the DJ queue, each person's song list, and which video started when.
It never streams media. Every browser plays the video from YouTube itself and
seeks to `now - startedAt`, so a YouTube ad only delays the person watching it.

## Run locally

```sh
cd dj-server
npm install
npm start            # listens on :8787
```

Then `yarn start` in the site root and open http://localhost:3000/dj. Open it
in a second (private) window to see two people in the room.

## Configuration

| Env var           | Default                                    | Purpose |
|-------------------|--------------------------------------------|---------|
| `PORT`            | `8787`                                     | Listen port. |
| `HOST`            | `127.0.0.1`                                | Listen address (`0.0.0.0` to test from phones on your LAN). |
| `SOCKET_PATH`     | none                                       | Listen on this Unix socket instead of `HOST:PORT` (production). |
| `MAX_TRACK_MINUTES` | `15`                                     | Songs end at this length no matter what. |
| `ALLOWED_ORIGINS` | `https://face.land,http://localhost:3000`  | Pages allowed to connect (`*` for any). |
| `YOUTUBE_API_KEY` | none                                       | Optional [Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) key. |

Without a key, titles come from YouTube's oEmbed endpoint and the song length
is learned from listeners' players, so the room moves on when a listener's
video ends. With a key, the server knows each song's exact length (one quota
unit per new video; the free quota is 10,000 a day), so it doesn't depend on
those reports, and it can reject live streams.

## Production

It runs on the Faceland box (AlmaLinux, 199.127.61.235) next to AMP, and the
site's `.env.production` points at `wss://dj.face.land`.

| What           | Where |
|----------------|-------|
| App            | `/opt/faceland-dj` (owned by root, read-only to the app) |
| Service        | `faceland-dj.service`, runs as the `djroom` system user on `/run/faceland-dj/dj.sock` |
| Settings       | `/etc/faceland-dj.env` (e.g. `YOUTUBE_API_KEY=`), then restart |
| HTTPS / proxy  | nginx, `/etc/nginx/conf.d/dj.face.land.conf`, Let's Encrypt via certbot |
| Logs           | `journalctl -u faceland-dj -f` |

Ship a change from the repo root (`npm ci` installs exactly what
`package-lock.json` pins, without running any package scripts):

```sh
scp dj-server/server.js dj-server/package.json dj-server/package-lock.json root@199.127.61.235:/opt/faceland-dj/
ssh root@199.127.61.235 "cd /opt/faceland-dj && npm ci --omit=dev --ignore-scripts && systemctl restart faceland-dj"
```

### Isolation from the game servers

The box also runs the Minecraft servers (AMP), so the room is fenced in:

- **Process:** an unprivileged user with no capabilities, a read-only OS,
  no access to home directories (AMP's data), `/opt` reduced to this app,
  and no access to TLS keys, Docker or its own settings file.
- **Network:** nginx reaches it over a Unix socket, which lets the service
  drop loopback and private networks entirely (`IPAddressDeny`). It can reach
  the public internet (YouTube) and nothing on the box.
- **Resources:** 512 MB memory and one CPU core at most, and it's the first
  thing the kernel kills if the box ever runs out of memory, never a JVM.
- **Abuse:** nginx caps sockets and new connections per IP. The app caps
  connections (200 total, 6 per IP), batches broadcasts (at most about 7 a
  second, however fast people act), drops clients that stop reading,
  rate-limits YouTube lookups, and ignores "song ended/broken" reports unless
  most of the room's IPs agree. A YouTube API key makes song lengths
  server-side facts, which removes even that.

Everything is in memory. Restarting the server empties the room; people's
names and song lists survive because their browsers keep them and send them
back when they reconnect.
