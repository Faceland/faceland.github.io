// Faceland DJ room server: one shared room, and the server is the authority.
//
// The server never touches media. It only decides who is DJing and which
// YouTube video started when; every browser streams the video straight from
// YouTube and seeks itself to (now - startedAt). That "radio" model is what
// keeps YouTube ads from desyncing the room: an ad only delays the person
// watching it, who then jumps forward to the room's position when the song
// starts. Nobody ever waits on anybody else.
//
// Anyone can connect without an account, so every input is treated as
// hostile: connections are capped per IP, broadcasts are batched, slow readers
// are dropped, outbound YouTube lookups are rate limited, and nothing a single
// listener says can end or skip a song for the whole room.

const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const {
  MAX_CHAT_LENGTH,
  chatProblem,
  nameProblem,
  rateLimitWait,
} = require('./chatRules');

// In production nginx connects over a Unix socket (SOCKET_PATH), so the
// service needs no loopback networking at all. Otherwise it listens on
// HOST:PORT, loopback-only unless told otherwise.
const SOCKET_PATH = process.env.SOCKET_PATH || '';
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '127.0.0.1';
// Optional. With a key, video durations come from the YouTube Data API (one
// quota unit per lookup) and songs end exactly on time. Without one, titles
// come from oEmbed and the duration is learned from the listeners' players.
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
// Browsers always send Origin on a WebSocket upgrade, so this stops other
// sites from embedding the room. It is not a security boundary: non-browser
// clients can send any Origin. '*' disables the check.
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || 'https://face.land,http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
// Songs end at this length no matter what, so nobody can hold the booth with
// a 10-hour video or a live stream.
const MAX_TRACK_SECONDS = (Number(process.env.MAX_TRACK_MINUTES) || 15) * 60;
// People idle this long stop counting toward the room size for skip votes.
// (AFK_SECONDS mainly exists so tests don't have to wait a minute.)
const AFK_MS = (Number(process.env.AFK_SECONDS) || 60) * 1000;
// A vote to skip only takes effect once the song has played this long. Every
// skip makes every listener load a new video from YouTube, so this caps how
// fast a room can be skip-spammed. Votes still count (and the button fills)
// in the meantime; a vote that passes early skips at the mark.
const MIN_SKIP_SECONDS = Number(process.env.MIN_SKIP_SECONDS ?? 10);
const MIN_SKIP_MS =
  (Number.isFinite(MIN_SKIP_SECONDS) ? MIN_SKIP_SECONDS : 10) * 1000;

const MAX_NAME = 20;
const MAX_TITLE = 200;
const MAX_LIST = 100;
// API durations are exact, so the room moves on right after the song.
const API_END_GRACE_MS = 1500;
// Player-reported durations are only a fallback: songs normally end when most
// of the room reports "ended", and the slack covers listeners who paused.
const CLIENT_END_GRACE_MS = 8000;
// If no listener's player manages to report a duration, the video is broken
// for everyone (removed, region-locked, ...) and the booth moves on.
const UNKNOWN_DURATION_TIMEOUT_MS = 60000;

// Abuse limits. Every state change goes to everyone, so the costs that matter
// are connections, how often anything is broadcast, and how much a slow or
// hostile reader can leave queued in memory.
const MAX_CONNECTIONS = 200;
const MAX_CONNECTIONS_PER_IP = 6;
const MAX_DJS_PER_IP = 2;
const MESSAGES_PER_SECOND = 20;
const MOVE_INTERVAL_MS = 100;
const NAME_INTERVAL_MS = 2000;
const BROADCAST_INTERVAL_MS = 150;
const MAX_BUFFERED_BYTES = 256 * 1024;
// Outbound YouTube lookups: one at a time per person, a few a minute each,
// and a global ceiling so the room can't be used to hammer YouTube (or burn
// the API quota). Failures are remembered so repeats cost nothing.
const ADDS_PER_MINUTE = 10;
const LOOKUPS_PER_SECOND = 5;
const MAX_LOOKUPS_IN_FLIGHT = 10;
const FAILED_LOOKUP_TTL_MS = 10 * 60 * 1000;
// Reactions (an emoji hop + confetti everyone sees). The Cheer button has a
// 3 s cooldown; the server allows a little jitter. Likes animate at most once
// a second, however fast the toggle is clicked.
const REACTIONS = ['like', 'cheer'];
const CHEER_INTERVAL_MS = 2800;
const LIKE_INTERVAL_MS = 1000;
// Deliberate actions count as being around (for skip votes); the automatic
// reports from players (duration, ended, errors) don't.
const ACTIVE_ACTIONS = new Set([
  'setName',
  'chat',
  'move',
  'react',
  'addTrack',
  'removeTrack',
  'bumpTrack',
  'setDJ',
  'skip',
  'voteSkip',
]);
const MAX_CACHED_VIDEOS = 5000;

// prettier-ignore
const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
  '🐷', '🐸', '🐵', '🐔', '🐧', '🐤', '🦆', '🦉', '🐺', '🐗', '🐴', '🦄',
  '🐝', '🐛', '🦋', '🐌', '🐞', '🐢', '🐍', '🦖', '🐙', '🦑', '🦀', '🐡',
  '🐠', '🐬', '🐳', '🦈', '🐊', '🦒', '🦘', '🦔', '🐲', '👽', '🤖', '👻',
  '🎃', '💀', '🤡', '🧙', '🧛', '🧟', '🍄', '🌵', '🍕', '🍩', '🌝', '🦩',
];

const VIDEO_ID = /^[\w-]{11}$/;

// Error whose message is safe to show the user who caused it. `permanent`
// means the video itself is unusable (not just YouTube being unreachable).
class UserError extends Error {
  constructor(message, { permanent = false } = {}) {
    super(message);
    this.permanent = permanent;
  }
}

const users = new Map(); // id -> user, for everyone who has joined
const connectionsByIp = new Map(); // ip -> open sockets
let djQueue = []; // user ids; while a track plays, djQueue[0] is its DJ
let current = null;
let endTimer = null;
const videoCache = new Map(); // videoId -> { title, duration }
const failedLookups = new Map(); // videoId -> { error, until }

// Text from users: compatibility-normalized so lookalike letters collapse,
// with control and invisible formatting characters (bidi overrides,
// zero-width spaces) removed, and cut by code point, not UTF-16 unit.
const clean = (value, max) =>
  Array.from(
    (typeof value === 'string' ? value : '')
      .normalize('NFKC')
      .replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cs}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
    .slice(0, max)
    .join('')
    .trim();

const isVideoId = (value) => typeof value === 'string' && VIDEO_ID.test(value);

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

// Floor positions are 0..1; three decimals is finer than any screen needs and
// keeps every message that carries positions short.
const position = (value) => Math.round(clamp01(value) * 1000) / 1000;

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const remember = (map, key, value) => {
  map.set(key, value);
  if (map.size > MAX_CACHED_VIDEOS) map.delete(map.keys().next().value);
};

// Logs at most 10 warnings a minute, so a flood can't flood the journal too.
let warnWindowStart = 0;
let warnCount = 0;
function warn(message) {
  const now = Date.now();
  if (now - warnWindowStart > 60000) {
    warnWindowStart = now;
    warnCount = 0;
  }
  if (++warnCount <= 10) console.warn(message);
}

// nginx sets X-Real-IP (overwriting anything the client sent), so trust it
// only for connections that came through the local proxy.
function clientIp(req) {
  const remote = req.socket.remoteAddress;
  const viaProxy =
    !remote ||
    remote === '127.0.0.1' ||
    remote === '::1' ||
    remote === '::ffff:127.0.0.1';
  const forwarded = req.headers['x-real-ip'];
  return (viaProxy && typeof forwarded === 'string' && forwarded) || remote;
}

const roomIps = () => new Set([...users.values()].map((user) => user.ip));

// --- Outgoing messages ------------------------------------------------------

function sendRaw(ws, data) {
  if (ws.readyState !== ws.OPEN) return;
  // A client that stops reading would make us queue its messages in memory
  // without limit; drop it instead (a real browser just reconnects).
  if (ws.bufferedAmount > MAX_BUFFERED_BYTES) {
    ws.terminate();
    return;
  }
  ws.send(data);
}

const send = (ws, message) => sendRaw(ws, JSON.stringify(message));

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const ws of wss.clients) sendRaw(ws, data);
}

function snapshot() {
  const tally = current && skipTally();
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
      skip: {
        votes: tally.votes,
        needed: tally.needed,
        voters: [...current.skipVotes].filter((id) => users.has(id)),
      },
      likes: [...current.likes].filter((id) => users.has(id)),
      // How long until the DJ may skip or leave (relative, like elapsed).
      skipLock: Math.max(0, current.startedAt + MIN_SKIP_MS - Date.now()),
    },
  };
}

// For things only people in the room need. Spectators on the join screen
// don't get chat, moves or reactions; `onlyVisible` also skips tabs in the
// background, which still get chat and state (the music) but not the floor's
// animation traffic nobody is watching.
//
// `legacy` builds the same message for pages from before protocol v2 (still
// open in someone's tab after a deploy); it's only built if one is here.
// Remove it once those pages have aged out.
function broadcastToMembers(message, { onlyVisible = false, legacy } = {}) {
  const data = JSON.stringify(message);
  let legacyData = null;
  for (const user of users.values()) {
    if (onlyVisible && user.ws.hidden) continue;
    if (legacy && user.protocol < 2) {
      legacyData = legacyData || JSON.stringify(legacy());
      sendRaw(user.ws, legacyData);
    } else {
      sendRaw(user.ws, data);
    }
  }
}

// Everything the room hears goes out from here, at most once per
// BROADCAST_INTERVAL_MS however fast people act: the full state if anything
// changed (it includes positions), otherwise just the latest moves, plus any
// chat and reactions since the last flush. Chat is relayed once and never
// stored. Moves are compact [id, x, y] triples with x/y in thousandths.
let stateDirty = false;
const pendingMoves = new Map(); // user id -> [id, x, y]
let pendingChat = [];
let pendingReactions = [];
let flushTimer = null;
let lastFlushAt = 0;

function flush() {
  flushTimer = null;
  lastFlushAt = Date.now();
  if (stateDirty) {
    const state = snapshot();
    if (current) current.shownNeeded = state.current.skip.needed;
    broadcast(state);
  } else if (pendingMoves.size) {
    const moves = [...pendingMoves.values()];
    broadcastToMembers(
      { t: 'moves', moves },
      {
        onlyVisible: true,
        legacy: () => ({
          t: 'moves',
          moves: moves.map(([id, x, y]) => ({ id, x: x / 1000, y: y / 1000 })),
        }),
      },
    );
  }
  if (pendingChat.length) {
    broadcastToMembers({ t: 'chat', messages: pendingChat });
  }
  if (pendingReactions.length) {
    broadcastToMembers(
      { t: 'reactions', reactions: pendingReactions },
      { onlyVisible: true },
    );
  }
  stateDirty = false;
  pendingMoves.clear();
  pendingChat = [];
  pendingReactions = [];
}

function scheduleFlush() {
  if (flushTimer) return;
  const wait = Math.max(0, lastFlushAt + BROADCAST_INTERVAL_MS - Date.now());
  flushTimer = setTimeout(flush, wait);
}

function broadcastState() {
  stateDirty = true;
  scheduleFlush();
}

const sendList = (user) => send(user.ws, { t: 'list', list: user.list });

// `scope: 'chat'` notices show under the chat box instead of as a toast.
const notify = (user, message, scope) =>
  send(user.ws, { t: 'notice', message, scope });

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
  wait = Math.min(wait, MAX_TRACK_SECONDS * 1000 - elapsed);
  endTimer = setTimeout(advance, Math.max(0, wait));
}

function setDuration(seconds, source) {
  const duration = Math.min(MAX_TRACK_SECONDS, Math.round(seconds));
  if (!(duration > 0)) return;
  if (source === 'client') {
    if (current.durationSource === 'api') return;
    // Keep the longest report: a player mid-ad might briefly report less.
    // Nobody can shorten a song this way, only delay the fallback timer.
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
  const cached = videoCache.get(track.videoId);
  current = {
    playId,
    djId: dj.id,
    videoId: track.videoId,
    // Titles in a list restored from someone's browser are whatever that
    // browser sent, so the room only ever shows titles this server looked up.
    title: cached ? cached.title : track.videoId,
    duration: null,
    durationSource: null,
    startedAt: Date.now(),
    endedBy: new Set(), // IPs whose player reported the song ended
    erroredBy: new Set(), // IPs whose player couldn't play it
    skipVotes: new Set(), // user ids that voted to skip
    likes: new Set(), // user ids that like it (every 2 make skipping harder)
    skipTimer: null, // set when a vote passed before MIN_SKIP_MS
    shownNeeded: null, // the "votes needed" the room last saw
  };
  scheduleEnd();

  if (cached && cached.duration) {
    setDuration(cached.duration, 'api');
  } else if (!cached || YOUTUBE_API_KEY) {
    lookupVideo(track.videoId)
      .then((meta) => {
        if (!current || current.playId !== playId) return;
        current.title = meta.title;
        if (meta.duration) setDuration(meta.duration, 'api');
        broadcastState();
      })
      .catch((err) => {
        // Gone private, unembeddable or live since it was added: skip it.
        if (err.permanent && current && current.playId === playId) advance();
      });
  }
}

// Ends whatever is playing (if anything) and hands the booth to the next DJ.
function advance() {
  clearTimeout(endTimer);
  if (current) clearTimeout(current.skipTimer);
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

// Listener reports (ended / couldn't play) only take effect when they come
// from more than half of the distinct IPs in the room, so one person (or one
// person with many tabs) can't skip songs for everybody else.
const roomAgrees = (ips) => ips.size * 2 > roomIps().size;

// Vote to skip: the song skips once votes reach half the room, plus one more
// for every 2 likes. The room is everyone active in the last AFK_MS plus
// anyone who already voted. Votes, likes and the room all count distinct IPs,
// so one person with several tabs gets one vote and one like.
function skipTally() {
  const now = Date.now();
  const ipsOf = (ids) => {
    const ips = new Set();
    for (const id of ids) {
      const user = users.get(id);
      if (user) ips.add(user.ip);
    }
    return ips;
  };
  const voterIps = ipsOf(current.skipVotes);
  const room = new Set(voterIps);
  for (const user of users.values()) {
    if (now - user.activeAt < AFK_MS) room.add(user.ip);
  }
  return {
    votes: voterIps.size,
    needed:
      Math.max(1, Math.ceil(room.size / 2)) +
      Math.floor(ipsOf(current.likes).size / 2),
  };
}

// The DJ's own Skip and Leave booth wait for MIN_SKIP_MS too: both start a
// new video for everyone, just like a vote skip. (A DJ who disconnects still
// ends their song; that can't be refused.) Returns whether it's too soon,
// telling the DJ when it opens up.
function djLocked(user) {
  const wait = current.startedAt + MIN_SKIP_MS - Date.now();
  if (wait <= 0) return false;
  notify(user, `You can skip or leave in ${Math.ceil(wait / 1000)}s.`);
  return true;
}

// Skips if the vote passes and the song is past MIN_SKIP_MS. A vote that
// passes earlier arms a timer for the mark, which re-checks then (the room
// may have changed its mind). Returns whether it skipped.
function trySkip(tally = skipTally()) {
  if (tally.votes < tally.needed) return false;
  const wait = current.startedAt + MIN_SKIP_MS - Date.now();
  if (wait > 0) {
    if (!current.skipTimer) {
      const { playId } = current;
      current.skipTimer = setTimeout(() => {
        if (!current || current.playId !== playId) return;
        current.skipTimer = null;
        checkSkip();
      }, wait);
    }
    return false;
  }
  advance();
  return true;
}

// Re-checks the vote after the room changes (someone left or went idle):
// skips if it now passes, or refreshes the "x/y votes" everyone sees.
function checkSkip() {
  if (!current) return;
  const tally = skipTally();
  if (trySkip(tally)) return;
  if (tally.needed !== current.shownNeeded) broadcastState();
}

// --- YouTube lookups ----------------------------------------------------------

function parseVideoId(input) {
  const text = clean(input, 500);
  if (isVideoId(text)) return text;
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
  return isVideoId(id) ? id : null;
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

const unreachable = () =>
  new UserError("Couldn't reach YouTube. Try again in a bit.");
const missing = () =>
  new UserError("That video doesn't exist or is private.", { permanent: true });
const notEmbeddable = () =>
  new UserError("That video's owner doesn't allow it on other sites.", {
    permanent: true,
  });

async function lookupWithApi(videoId) {
  const url =
    'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status' +
    `&id=${videoId}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    warn(`Data API lookup failed (${res.status}): ${body}`);
    throw unreachable();
  }
  const item = ((await res.json()).items || [])[0];
  if (!item) throw missing();
  if (!item.status.embeddable) throw notEmbeddable();
  if (item.snippet.liveBroadcastContent !== 'none') {
    throw new UserError("Live streams can't be added.", { permanent: true });
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
  if (res.status === 401 || res.status === 403) throw notEmbeddable();
  if (res.status === 400 || res.status === 404) throw missing();
  if (!res.ok) {
    warn(`oEmbed lookup failed (${res.status})`);
    throw unreachable();
  }
  return { title: (await res.json()).title, duration: null };
}

const lookupBucket = { tokens: LOOKUPS_PER_SECOND, at: Date.now() };
let lookupsInFlight = 0;

function takeLookupSlot() {
  const now = Date.now();
  lookupBucket.tokens = Math.min(
    LOOKUPS_PER_SECOND,
    lookupBucket.tokens + ((now - lookupBucket.at) / 1000) * LOOKUPS_PER_SECOND,
  );
  lookupBucket.at = now;
  if (lookupBucket.tokens < 1 || lookupsInFlight >= MAX_LOOKUPS_IN_FLIGHT) {
    return false;
  }
  lookupBucket.tokens -= 1;
  return true;
}

async function lookupVideo(videoId) {
  const cached = videoCache.get(videoId);
  if (cached) return cached;
  const failed = failedLookups.get(videoId);
  if (failed && failed.until > Date.now()) throw failed.error;
  if (!takeLookupSlot()) {
    throw new UserError('The room is busy. Try again in a moment.');
  }
  lookupsInFlight++;
  let meta;
  try {
    meta = await (YOUTUBE_API_KEY ? lookupWithApi : lookupWithOembed)(videoId);
  } catch (err) {
    if (!(err instanceof UserError)) {
      warn(`Lookup for ${videoId} failed: ${err.message}`);
      throw unreachable();
    }
    if (err.permanent) {
      remember(failedLookups, videoId, {
        error: err,
        until: Date.now() + FAILED_LOOKUP_TTL_MS,
      });
    }
    throw err;
  } finally {
    lookupsInFlight--;
  }
  meta.title = clean(meta.title, MAX_TITLE) || videoId;
  remember(videoCache, videoId, meta);
  return meta;
}

// --- Incoming messages ----------------------------------------------------------

const newKey = () => crypto.randomUUID().slice(0, 8);

function join(ws, msg) {
  const list = (Array.isArray(msg.list) ? msg.list : [])
    .filter((track) => track && isVideoId(track.videoId))
    .slice(0, MAX_LIST)
    .map((track) => ({
      key: newKey(),
      videoId: track.videoId,
      // Only ever shown back to this user; the room uses looked-up titles.
      title: clean(track.title, MAX_TITLE) || track.videoId,
      duration:
        Number(track.duration) > 0
          ? Math.min(MAX_TRACK_SECONDS, Math.round(track.duration))
          : null,
    }));
  // A saved name that breaks the rules (e.g. from before they existed) just
  // falls back to Guest.
  const name = clean(msg.name, MAX_NAME);
  const user = {
    id: crypto.randomUUID().slice(0, 8),
    ws,
    ip: ws.ip,
    // 2 = compact moves. Pages from before that send no version.
    protocol: Number(msg.v) || 1,
    name: (name && !nameProblem(name) && name) || 'Guest',
    emoji: EMOJIS.includes(msg.emoji) ? msg.emoji : pick(EMOJIS),
    // Somewhere in the middle of the floor until they choose a spot.
    x: position(0.15 + Math.random() * 0.7),
    y: position(0.3 + Math.random() * 0.5),
    list,
    lastMoveAt: 0,
    lastNameAt: 0,
    addTimes: [],
    adding: false,
    chatTimes: [],
    lastChat: { text: '', at: 0 },
    activeAt: Date.now(),
    lastLikeAt: 0,
    lastCheerAt: 0,
  };
  ws.user = user;
  users.set(user.id, user);
  send(ws, { t: 'welcome', id: user.id, name: user.name, emoji: user.emoji });
  sendList(user);
  broadcastState();
}

async function addTrack(user, msg) {
  try {
    if (user.adding) throw new UserError('Still adding your last song.');
    const now = Date.now();
    user.addTimes = user.addTimes.filter((at) => now - at < 60000);
    if (user.addTimes.length >= ADDS_PER_MINUTE) {
      throw new UserError(
        "You're adding songs too fast. Try again in a minute.",
      );
    }
    if (user.list.length >= MAX_LIST) {
      throw new UserError(`Your list is full (${MAX_LIST} songs).`);
    }
    const videoId = parseVideoId(msg.url);
    if (!videoId) throw new UserError("That doesn't look like a YouTube link.");
    if (user.list.some((track) => track.videoId === videoId)) {
      throw new UserError("That song's already in your list.");
    }
    user.addTimes.push(now);
    user.adding = true;
    let meta;
    try {
      meta = await lookupVideo(videoId);
    } finally {
      user.adding = false;
    }
    if (!users.has(user.id)) return;
    if (user.list.length >= MAX_LIST) {
      throw new UserError(`Your list is full (${MAX_LIST} songs).`);
    }
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

function sendChat(user, msg, now) {
  // Every attempt counts toward the limits, refused ones included, so a
  // modified client can't probe the filter at full speed.
  user.chatTimes = user.chatTimes.filter((at) => now - at < 60000);
  const wait = rateLimitWait(user.chatTimes, now, 250);
  if (wait > 0) {
    notify(user, `Slow down: wait ${Math.ceil(wait / 1000)}s.`, 'chat');
    return;
  }
  user.chatTimes.push(now);
  const text = clean(msg.text, MAX_CHAT_LENGTH);
  if (!text) return;
  const problem = chatProblem(text);
  if (problem) {
    notify(user, problem, 'chat');
    return;
  }
  if (text === user.lastChat.text && now - user.lastChat.at < 30000) {
    notify(user, 'You just said that.', 'chat');
    return;
  }
  user.lastChat = { text, at: now };
  pendingChat.push({
    id: newKey(),
    userId: user.id,
    emoji: user.emoji,
    name: user.name,
    text,
  });
  scheduleFlush();
}

function handle(ws, msg) {
  const user = ws.user;
  if (msg.t === 'hello') {
    if (!user) join(ws, msg);
    return;
  }
  if (!user) return;
  const now = Date.now();
  if (ACTIVE_ACTIONS.has(msg.t)) user.activeAt = now;

  switch (msg.t) {
    case 'setName': {
      if (now - user.lastNameAt < NAME_INTERVAL_MS) {
        notify(user, 'Wait a moment before changing your name again.');
        break;
      }
      user.lastNameAt = now;
      const name = clean(msg.name, MAX_NAME) || 'Guest';
      const problem = nameProblem(name);
      if (problem) {
        notify(user, problem);
        // Only they need the state again, to snap their name box back.
        send(ws, snapshot());
      } else if (name !== user.name) {
        user.name = name;
        broadcastState();
      }
      break;
    }

    case 'chat':
      sendChat(user, msg, now);
      break;

    case 'move':
      // The DJ stands in the booth; the floor is for everyone else.
      if (now - user.lastMoveAt < MOVE_INTERVAL_MS) break;
      if (current && current.djId === user.id) break;
      user.lastMoveAt = now;
      user.x = position(msg.x);
      user.y = position(msg.y);
      pendingMoves.set(user.id, [
        user.id,
        Math.round(user.x * 1000),
        Math.round(user.y * 1000),
      ]);
      scheduleFlush();
      break;

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
        // Leaving the booth mid-song ends it, so it waits like a skip.
        if (current && current.djId === user.id && djLocked(user)) break;
        leaveQueue(user);
        break;
      }
      if (djQueue.includes(user.id)) break;
      if (!user.list.length) {
        notify(user, 'Add a song to your list first.');
        break;
      }
      if (
        djQueue.filter((id) => users.get(id).ip === user.ip).length >=
        MAX_DJS_PER_IP
      ) {
        notify(user, `Only ${MAX_DJS_PER_IP} DJs per connection, sorry.`);
        break;
      }
      djQueue.push(user.id);
      if (current) broadcastState();
      else advance();
      break;

    case 'skip':
      if (current && current.djId === user.id && !djLocked(user)) advance();
      break;

    case 'react':
      if (!REACTIONS.includes(msg.kind)) break;
      // No liking or cheering your own song.
      if (current && current.djId === user.id) break;
      if (msg.kind === 'like') {
        if (!current) break;
        const liked = Boolean(msg.on);
        if (liked === current.likes.has(user.id)) break;
        if (liked) current.likes.add(user.id);
        else current.likes.delete(user.id);
        // Likes change how many skip votes are needed; an un-like can be
        // what lets a standing vote pass.
        if (!trySkip()) broadcastState();
        // Only liking animates, at most once a second.
        if (!liked || now - user.lastLikeAt < LIKE_INTERVAL_MS) break;
        user.lastLikeAt = now;
      } else {
        if (now - user.lastCheerAt < CHEER_INTERVAL_MS) break;
        user.lastCheerAt = now;
      }
      pendingReactions.push({ id: user.id, kind: msg.kind });
      scheduleFlush();
      break;

    case 'voteSkip': {
      // The DJ has a real Skip button instead.
      if (!current || current.djId === user.id) break;
      if (Boolean(msg.on) === current.skipVotes.has(user.id)) break;
      if (msg.on) current.skipVotes.add(user.id);
      else current.skipVotes.delete(user.id);
      if (!trySkip()) broadcastState();
      break;
    }

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
        current.durationSource !== 'api'
      ) {
        current.endedBy.add(user.ip);
        if (roomAgrees(current.endedBy)) advance();
      }
      break;

    case 'visibility':
      // Not activity: a tab going to the background isn't the person doing
      // something. Coming back gets a fresh snapshot (positions included),
      // at most every 2 s so toggling can't be used to pull snapshots.
      if (Boolean(msg.hidden) === Boolean(ws.hidden)) break;
      ws.hidden = Boolean(msg.hidden);
      if (!ws.hidden && now - (ws.resyncedAt || 0) > 2000) {
        ws.resyncedAt = now;
        send(ws, snapshot());
      }
      break;

    case 'trackError':
      // One listener failing (say, region-locked) shouldn't skip the song
      // for the room, but most of the room failing should.
      if (current && current.playId === msg.playId) {
        current.erroredBy.add(user.ip);
        if (roomAgrees(current.erroredBy)) advance();
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
  // Standard WebSocket compression (browsers negotiate it automatically),
  // for the messages where it pays off: room snapshots, song lists and big
  // batches are repetitive JSON that shrinks several-fold. Tiny messages skip
  // it, and no context takeover keeps the per-connection memory small.
  perMessageDeflate: {
    threshold: 1024,
    zlibDeflateOptions: { level: 6, memLevel: 7 },
    serverNoContextTakeover: true,
    clientNoContextTakeover: true,
    concurrencyLimit: 10,
  },
  verifyClient: ({ origin, req }, done) => {
    if (!ALLOWED_ORIGINS.includes('*') && !ALLOWED_ORIGINS.includes(origin)) {
      done(false, 403);
    } else if (wss.clients.size >= MAX_CONNECTIONS) {
      done(false, 503);
    } else if (
      (connectionsByIp.get(clientIp(req)) || 0) >= MAX_CONNECTIONS_PER_IP
    ) {
      done(false, 429);
    } else {
      done(true);
    }
  },
});

wss.on('connection', (ws, req) => {
  ws.ip = clientIp(req);
  connectionsByIp.set(ws.ip, (connectionsByIp.get(ws.ip) || 0) + 1);
  ws.isAlive = true;
  ws.budget = { windowStart: Date.now(), count: 0 };

  // ws reports protocol violations (oversized or malformed frames) as an
  // 'error' event; unhandled, that would throw and take the whole room down.
  ws.on('error', () => ws.terminate());
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
    const left = connectionsByIp.get(ws.ip) - 1;
    if (left > 0) connectionsByIp.set(ws.ip, left);
    else connectionsByIp.delete(ws.ip);
    const user = ws.user;
    if (!user) return;
    users.delete(user.id);
    if (djQueue.includes(user.id)) leaveQueue(user);
    else broadcastState();
    // A smaller room may mean the votes already cast now pass.
    checkSkip();
  });
});

wss.on('error', (err) => console.error('WebSocket server error:', err.message));

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

// People going idle shrink the room without sending anything, so re-check
// the skip vote every few seconds too.
const afkSweep = setInterval(checkSkip, 5000);

wss.on('close', () => {
  clearInterval(heartbeat);
  clearInterval(afkSweep);
});

const describe = (where) =>
  `DJ server listening on ${where} (durations from ${
    YOUTUBE_API_KEY ? 'the YouTube Data API' : 'listener players'
  }; origins: ${ALLOWED_ORIGINS.join(', ')})`;

if (SOCKET_PATH) {
  // A crashed run can leave the socket file behind, which blocks listen().
  fs.rmSync(SOCKET_PATH, { force: true });
  server.listen(SOCKET_PATH, () => {
    // nginx runs as its own user and needs write access to connect. The
    // socket only ever reaches this app, so world-writable is fine.
    fs.chmodSync(SOCKET_PATH, 0o666);
    console.log(describe(SOCKET_PATH));
  });
} else {
  server.listen(PORT, HOST, () => console.log(describe(`${HOST}:${PORT}`)));
}
