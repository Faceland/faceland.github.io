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
| `HOST`            | all interfaces                             | Listen address; `127.0.0.1` behind a reverse proxy. |
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
| Service        | `faceland-dj.service`, runs as the `djroom` system user on 127.0.0.1:8787 |
| Settings       | `/etc/faceland-dj.env` (e.g. `YOUTUBE_API_KEY=`), then restart |
| HTTPS / proxy  | nginx, `/etc/nginx/conf.d/dj.face.land.conf`, Let's Encrypt via certbot |
| Logs           | `journalctl -u faceland-dj -f` |

Ship a change from the repo root:

```sh
scp dj-server/server.js dj-server/package.json root@199.127.61.235:/opt/faceland-dj/
ssh root@199.127.61.235 "cd /opt/faceland-dj && npm install --omit=dev --ignore-scripts && systemctl restart faceland-dj"
```

Everything is in memory. Restarting the server empties the room; people's
names and song lists survive because their browsers keep them and send them
back when they reconnect.
