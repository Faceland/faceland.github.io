// Faceland DJ room server: one shared room, and the server is the authority.
//
// The server never touches media. It only decides who is DJing and which
// YouTube video started when; every browser streams the video straight from
// YouTube and seeks itself to (now - startedAt). That "radio" model is what
// keeps YouTube ads from desyncing the room: an ad only delays the person
// watching it, who then jumps forward to the room's position when the song
// starts. Nobody ever waits on anybody else.

const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 8787;
// Set to 127.0.0.1 behind a reverse proxy; unset listens on every interface.
const HOST = process.env.HOST || undefined;
// Optional. With a key, video durations come from the YouTube Data API (one
// quota unit per lookup) and songs end exactly on time. Without one, titles
// come from oEmbed and the duration is learned from the listeners' players.
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
// Browsers always send Origin on a WebSocket upgrade, so this stops other
// sites from embedding the room. '*' disables the check.
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || 'https://face.land,http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const MAX_NAME = 20;
const MAX_TITLE = 200;
const MAX_LIST = 100;
const MAX_TRACK_SECONDS = 4 * 60 * 60;
// API durations are exact, so the room moves on right after the song.
const API_END_GRACE_MS = 1500;
// Player-reported durations get a longer grace: the end is normally triggered
// earlier by a listener's "ended" report, and the slack covers a player that
// briefly reported something shorter (e.g. while an ad was loading).
const CLIENT_END_GRACE_MS = 8000;
// If no listener's player manages to report a duration, the video is broken
// for everyone (removed, region-locked, ...) and the booth moves on.
const UNKNOWN_DURATION_TIMEOUT_MS = 60000;
const MOVE_INTERVAL_MS = 60;
const MESSAGES_PER_SECOND = 30;

// prettier-ignore
const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
  '🐷', '🐸', '🐵', '🐔', '🐧', '🐤', '🦆', '🦉', '🐺', '🐗', '🐴', '🦄',
  '🐝', '🐛', '🦋', '🐌', '🐞', '🐢', '🐍', '🦖', '🐙', '🦑', '🦀', '🐡',
  '🐠', '🐬', '🐳', '🦈', '🐊', '🦒', '🦘', '🦔', '🐲', '👽', '🤖', '👻',
  '🎃', '💀', '🤡', '🧙', '🧛', '🧟', '🍄', '🌵', '🍕', '🍩', '🌝', '🦩',
];

const VIDEO_ID = /^[\w-]{11}$/;

// Error whose message is safe to show the user who caused it.
class UserError extends Error {}

const users = new Map(); // id -> user, for everyone who has joined
let djQueue = []; // user ids; while a track plays, djQueue[0] is its DJ
let current = null;
let endTimer = null;
const videoCache = new Map(); // videoId -> { title, duration }

const clean = (value, max) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

const pick = (items) => items[Math.floor(Math.random() * items.length)];

// --- Outgoing messages ------------------------------------------------------

function send(ws, message) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message));
}

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}

function snapshot() {
  return {
    t: 'state',
    users: [...users.values()].map(({ id, name, emoji, x, y }) => ({
      id,
      name,
      emoji,
      x,
      y,
    })),
    djQueue,
    current: current && {
      playId: current.playId,
      djId: current.djId,
      videoId: current.videoId,
      title: current.title,
      duration: current.duration,
      // Relative, so clients never need to agree with the server's clock:
      // the only error is one-way latency, far below the resync threshold.
      elapsed: Date.now() - current.startedAt,
    },
  };
}

const broadcastState = () => broadcast(snapshot());

const sendList = (user) => send(user.ws, { t: 'list', list: user.list });

const notify = (user, message) => send(user.ws, { t: 'notice', message });

// --- The booth ---------------------------------------------------------------

function scheduleEnd() {
  clearTimeout(endTimer);
  const elapsed = Date.now() - current.startedAt;
  let wait = UNKNOWN_DURATION_TIMEOUT_MS - elapsed;
  if (current.duration) {
    const grace =
      current.durationSource === 'api' ? API_END_GRACE_MS : CLIENT_END_GRACE_MS;
    wait = current.duration * 1000 + grace - elapsed;
  }
  endTimer = setTimeout(advance, Math.max(0, wait));
}

function setDuration(seconds, source) {
  const duration = Math.min(MAX_TRACK_SECONDS, Math.round(seconds));
  if (!(duration > 0)) return;
  if (source === 'client') {
    if (current.durationSource === 'api') return;
    // Keep the longest report: a player mid-ad might briefly report less.
    if (current.duration && duration <= current.duration + 1) return;
  }
  current.duration = duration;
  current.durationSource = source;
  scheduleEnd();
  broadcastState();
}

function play(dj) {
  // The song goes to the bottom of the DJ's list, like a playlist on repeat.
  const track = dj.list.shift();
  dj.list.push(track);
  sendList(dj);

  const playId = crypto.randomUUID();
  current = {
    playId,
    djId: dj.id,
    videoId: track.videoId,
    title: track.title,
    duration: null,
    durationSource: null,
    startedAt: Date.now(),
    errors: new Set(),
  };
  scheduleEnd();

  const cached = videoCache.get(track.videoId);
  if (cached && cached.duration) {
    setDuration(cached.duration, 'api');
  } else if (YOUTUBE_API_KEY) {
    lookupVideo(track.videoId)
      .then((meta) => {
        if (current && current.playId === playId && meta.duration) {
          setDuration(meta.duration, 'api');
        }
      })
      .catch(() => {});
  }
}

// Ends whatever is playing (if anything) and hands the booth to the next DJ.
function advance() {
  clearTimeout(endTimer);
  if (current && djQueue[0] === current.djId) djQueue.push(djQueue.shift());
  current = null;
  while (djQueue.length) {
    const dj = users.get(djQueue[0]);
    if (dj && dj.list.length) {
      play(dj);
      break;
    }
    djQueue.shift();
    if (dj) notify(dj, 'Your list is empty, so you left the DJ queue.');
  }
  broadcastState();
}

function leaveQueue(user) {
  if (!djQueue.includes(user.id)) return;
  djQueue = djQueue.filter((id) => id !== user.id);
  if (current && current.djId === user.id) advance();
  else broadcastState();
}

// --- YouTube lookups ----------------------------------------------------------

function parseVideoId(input) {
  const text = clean(input, 500);
  if (VIDEO_ID.test(text)) return text;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v');
    if (!id) {
      const match = url.pathname.match(
        /^\/(?:embed|shorts|live|v)\/([\w-]{11})/,
      );
      id = match && match[1];
    }
    if (!id && url.searchParams.get('list')) {
      throw new UserError(
        "Playlists aren't supported yet. Paste a link to a single video.",
      );
    }
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

// ISO 8601 durations as the Data API returns them, e.g. PT1H2M3S.
function parseIsoDuration(iso) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    iso || '',
  );
  if (!match) return null;
  const [d, h, m, s] = match.slice(1).map((part) => Number(part) || 0);
  return ((d * 24 + h) * 60 + m) * 60 + s || null;
}

async function lookupWithApi(videoId) {
  const url =
    'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status' +
    `&id=${videoId}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    console.warn(`Data API lookup failed (${res.status}): ${await res.text()}`);
    throw new UserError("Couldn't reach YouTube. Try again in a bit.");
  }
  const item = ((await res.json()).items || [])[0];
  if (!item) throw new UserError("That video doesn't exist or is private.");
  if (!item.status.embeddable) {
    throw new UserError("That video's owner doesn't allow it on other sites.");
  }
  if (item.snippet.liveBroadcastContent !== 'none') {
    throw new UserError("Live streams can't be added.");
  }
  return {
    title: item.snippet.title,
    duration: parseIsoDuration(item.contentDetails.duration),
  };
}

async function lookupWithOembed(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`,
    { signal: AbortSignal.timeout(8000) },
  );
  // oEmbed refuses videos whose owner turned off embedding.
  if (res.status === 401 || res.status === 403) {
    throw new UserError("That video's owner doesn't allow it on other sites.");
  }
  if (!res.ok) throw new UserError("That video doesn't exist or is private.");
  return { title: (await res.json()).title, duration: null };
}

async function lookupVideo(videoId) {
  const cached = videoCache.get(videoId);
  if (cached) return cached;
  let meta;
  try {
    meta = await (YOUTUBE_API_KEY ? lookupWithApi : lookupWithOembed)(videoId);
  } catch (err) {
    if (err instanceof UserError) throw err;
    console.warn(`Lookup for ${videoId} failed:`, err.message);
    throw new UserError("Couldn't reach YouTube. Try again in a bit.");
  }
  meta.title = clean(meta.title, MAX_TITLE) || videoId;
  videoCache.set(videoId, meta);
  if (videoCache.size > 5000) videoCache.delete(videoCache.keys().next().value);
  return meta;
}

// --- Incoming messages ----------------------------------------------------------

const newKey = () => crypto.randomUUID().slice(0, 8);

function join(ws, msg) {
  const list = (Array.isArray(msg.list) ? msg.list : [])
    .filter((track) => track && VIDEO_ID.test(track.videoId))
    .slice(0, MAX_LIST)
    .map((track) => ({
      key: newKey(),
      videoId: track.videoId,
      title: clean(track.title, MAX_TITLE) || track.videoId,
      duration: Number(track.duration) > 0 ? Math.round(track.duration) : null,
    }));
  const user = {
    id: crypto.randomUUID().slice(0, 8),
    ws,
    name: clean(msg.name, MAX_NAME) || 'Guest',
    emoji: EMOJIS.includes(msg.emoji) ? msg.emoji : pick(EMOJIS),
    // Somewhere in the middle of the floor until they choose a spot.
    x: 0.15 + Math.random() * 0.7,
    y: 0.3 + Math.random() * 0.5,
    list,
    lastMoveAt: 0,
  };
  ws.user = user;
  users.set(user.id, user);
  send(ws, { t: 'welcome', id: user.id, name: user.name, emoji: user.emoji });
  sendList(user);
  broadcastState();
}

async function addTrack(user, msg) {
  try {
    if (user.list.length >= MAX_LIST) {
      throw new UserError(`Your list is full (${MAX_LIST} songs).`);
    }
    const videoId = parseVideoId(msg.url);
    if (!videoId) throw new UserError("That doesn't look like a YouTube link.");
    const meta = await lookupVideo(videoId);
    if (!users.has(user.id)) return;
    if (user.list.some((track) => track.videoId === videoId)) {
      throw new UserError("That song's already in your list.");
    }
    user.list.push({ key: newKey(), videoId, ...meta });
    sendList(user);
  } catch (err) {
    if (!(err instanceof UserError)) throw err;
    notify(user, err.message);
  }
}

function handle(ws, msg) {
  const user = ws.user;
  if (msg.t === 'hello') {
    if (!user) join(ws, msg);
    return;
  }
  if (!user) return;

  switch (msg.t) {
    case 'setName':
      user.name = clean(msg.name, MAX_NAME) || 'Guest';
      broadcastState();
      break;

    case 'move': {
      const now = Date.now();
      // The DJ stands in the booth; the floor is for everyone else.
      if (now - user.lastMoveAt < MOVE_INTERVAL_MS) break;
      if (current && current.djId === user.id) break;
      user.lastMoveAt = now;
      user.x = clamp01(msg.x);
      user.y = clamp01(msg.y);
      broadcast({ t: 'moved', id: user.id, x: user.x, y: user.y });
      break;
    }

    case 'addTrack':
      addTrack(user, msg).catch((err) => console.error('addTrack:', err));
      break;

    case 'removeTrack':
      user.list = user.list.filter((track) => track.key !== msg.key);
      sendList(user);
      break;

    case 'bumpTrack': {
      const index = user.list.findIndex((track) => track.key === msg.key);
      if (index > 0) user.list.unshift(...user.list.splice(index, 1));
      sendList(user);
      break;
    }

    case 'setDJ':
      if (!msg.on) {
        leaveQueue(user);
      } else if (!djQueue.includes(user.id)) {
        if (!user.list.length) {
          notify(user, 'Add a song to your list first.');
          break;
        }
        djQueue.push(user.id);
        if (current) broadcastState();
        else advance();
      }
      break;

    case 'skip':
      if (current && current.djId === user.id) advance();
      break;

    case 'duration':
      if (current && current.playId === msg.playId) {
        setDuration(Number(msg.seconds), 'client');
      }
      break;

    case 'ended':
      // With an API duration the server's own timer is authoritative.
      if (
        current &&
        current.playId === msg.playId &&
        current.durationSource !== 'api' &&
        Date.now() - current.startedAt > 5000
      ) {
        advance();
      }
      break;

    case 'trackError':
      // One listener failing (say, region-locked) shouldn't skip the song
      // for the room, but most of the room failing should.
      if (current && current.playId === msg.playId) {
        current.errors.add(user.id);
        if (current.errors.size * 2 >= users.size) advance();
      }
      break;

    default:
      break;
  }
}

// --- Connections --------------------------------------------------------------

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Faceland DJ server: ${users.size} in the room\n`);
});

const wss = new WebSocketServer({
  server,
  maxPayload: 64 * 1024,
  verifyClient: ({ origin }) =>
    ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin),
});

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.budget = { windowStart: Date.now(), count: 0 };
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Spectators get the room state too, so the join screen can show who's
  // here and what's playing before they commit to a name.
  send(ws, snapshot());

  ws.on('message', (data) => {
    const now = Date.now();
    if (now - ws.budget.windowStart > 1000) {
      ws.budget = { windowStart: now, count: 0 };
    }
    if (++ws.budget.count > MESSAGES_PER_SECOND) return;
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    if (msg && typeof msg === 'object') handle(ws, msg);
  });

  ws.on('close', () => {
    const user = ws.user;
    if (!user) return;
    users.delete(user.id);
    if (djQueue.includes(user.id)) leaveQueue(user);
    else broadcastState();
  });
});

// Drop connections that vanished without a close frame (sleeping laptops,
// dead mobile radios) so ghosts don't hold a spot in the DJ queue.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, HOST, () => {
  console.log(
    `DJ server listening on ${HOST || '*'}:${PORT} (durations from ${
      YOUTUBE_API_KEY ? 'the YouTube Data API' : 'listener players'
    }; origins: ${ALLOWED_ORIGINS.join(', ')})`,
  );
});
