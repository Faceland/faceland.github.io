// Settings and limits for the DJ room server, in one place. Everything the
// environment can change is read here; everything else is a constant the
// rest of the code imports by name.

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

// Rooms are picked by URL: `/` is the main room (every page from before rooms
// existed lands there) and `/r/<id>` is another. Ids are short, lower-case
// and URL-safe; they're lower-cased on the way in so /r/Chill and /r/chill
// are one room.
const DEFAULT_ROOM = 'main';
const ROOM_ID = /^[a-z0-9][a-z0-9_-]{0,31}$/;

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
const MAX_PAYLOAD_BYTES = 64 * 1024;
const MOVE_INTERVAL_MS = 100;
const NAME_INTERVAL_MS = 2000;
const LOOK_INTERVAL_MS = 1000;
const BROADCAST_INTERVAL_MS = 150;
const MAX_BUFFERED_BYTES = 256 * 1024;
// Drop connections that vanished without a close frame (sleeping laptops,
// dead mobile radios) so ghosts don't hold a spot in the DJ queue.
const HEARTBEAT_MS = 30000;
// People going idle shrink the room without sending anything, so re-check
// the skip vote every few seconds too.
const AFK_SWEEP_MS = 5000;
// Outbound YouTube lookups: one at a time per person, a few a minute each,
// and a global ceiling so the room can't be used to hammer YouTube (or burn
// the API quota). Failures are remembered so repeats cost nothing.
const ADDS_PER_MINUTE = 10;
const LOOKUPS_PER_SECOND = 5;
const MAX_LOOKUPS_IN_FLIGHT = 10;
const FAILED_LOOKUP_TTL_MS = 10 * 60 * 1000;
const MAX_CACHED_VIDEOS = 5000;
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
  'setLook',
  'setList',
  'lookup',
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

module.exports = {
  SOCKET_PATH,
  PORT,
  HOST,
  YOUTUBE_API_KEY,
  ALLOWED_ORIGINS,
  MAX_TRACK_SECONDS,
  AFK_MS,
  MIN_SKIP_MS,
  DEFAULT_ROOM,
  ROOM_ID,
  MAX_NAME,
  MAX_TITLE,
  MAX_LIST,
  API_END_GRACE_MS,
  CLIENT_END_GRACE_MS,
  UNKNOWN_DURATION_TIMEOUT_MS,
  MAX_CONNECTIONS,
  MAX_CONNECTIONS_PER_IP,
  MAX_DJS_PER_IP,
  MESSAGES_PER_SECOND,
  MAX_PAYLOAD_BYTES,
  MOVE_INTERVAL_MS,
  NAME_INTERVAL_MS,
  LOOK_INTERVAL_MS,
  BROADCAST_INTERVAL_MS,
  MAX_BUFFERED_BYTES,
  HEARTBEAT_MS,
  AFK_SWEEP_MS,
  ADDS_PER_MINUTE,
  LOOKUPS_PER_SECOND,
  MAX_LOOKUPS_IN_FLIGHT,
  FAILED_LOOKUP_TTL_MS,
  MAX_CACHED_VIDEOS,
  REACTIONS,
  CHEER_INTERVAL_MS,
  LIKE_INTERVAL_MS,
  ACTIVE_ACTIONS,
};
