// Faceland DJ room server: the server is the authority for its rooms.
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
//
// This file is the edge: sockets, the limits on them, which room a connection
// belongs to, and the wiring. A room itself (who is here, the booth, votes,
// chat) is room.js; YouTube is youtube.js; settings and limits are config.js.

const http = require('http');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const {
  SOCKET_PATH,
  PORT,
  HOST,
  YOUTUBE_API_KEY,
  ALLOWED_ORIGINS,
  DEFAULT_ROOM,
  ROOM_ID,
  MAX_CONNECTIONS,
  MAX_CONNECTIONS_PER_IP,
  MESSAGES_PER_SECOND,
  MAX_PAYLOAD_BYTES,
  MAX_BUFFERED_BYTES,
  HEARTBEAT_MS,
  AFK_SWEEP_MS,
} = require('./config');
const { Room } = require('./room');

const connectionsByIp = new Map(); // ip -> open sockets

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

// --- Transport ----------------------------------------------------------------

// How a room reaches a connection. The room hands over the encoded message;
// this is the only place that knows a connection is a WebSocket.
const transport = {
  send(conn, data) {
    const { ws } = conn;
    if (ws.readyState !== ws.OPEN) return;
    // A client that stops reading would make us queue its messages in memory
    // without limit; drop it instead (a real browser just reconnects).
    if (ws.bufferedAmount > MAX_BUFFERED_BYTES) {
      ws.terminate();
      return;
    }
    ws.send(data);
  },
};

// --- Rooms --------------------------------------------------------------------

const rooms = new Map(); // id -> Room, for every room with a connection

// Which room a request's URL names: `/` is the main room, `/r/<id>` another,
// and anything else is nothing (the upgrade is refused). Ids are lower-cased
// so /r/Chill and /r/chill are the same place.
function roomIdFrom(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, 'http://dj').pathname);
  } catch {
    return null;
  }
  if (pathname === '/' || pathname === '') return DEFAULT_ROOM;
  const match = /^\/r\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const id = match[1].toLowerCase();
  return ROOM_ID.test(id) ? id : null;
}

// Rooms exist while someone is connected to them and are made on demand, so
// a URL nobody has visited costs nothing and an empty room keeps no timers.
function roomFor(id) {
  let room = rooms.get(id);
  if (!room) {
    room = new Room({ id, transport });
    rooms.set(id, room);
  }
  return room;
}

function dropIfEmpty(room) {
  if (room.conns.size) return;
  room.close();
  rooms.delete(room.id);
}

const headcount = () => {
  let people = 0;
  for (const room of rooms.values()) people += room.size;
  return rooms.size > 1
    ? `${people} in ${rooms.size} rooms`
    : `${people} in the room`;
};

// --- Connections --------------------------------------------------------------

// `/` says how many people are here in all; `/r/<id>` how many are in that
// room (without creating it). Handy for a glance at the box and as a health
// check.
const server = http.createServer((req, res) => {
  const id = roomIdFrom(req.url);
  if (!id) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('No such room\n');
    return;
  }
  const own = /^\/r\//.test(req.url);
  const room = rooms.get(id);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(
    `Faceland DJ server: ${own ? `${room ? room.size : 0} in the room` : headcount()}\n`,
  );
});

const wss = new WebSocketServer({
  server,
  maxPayload: MAX_PAYLOAD_BYTES,
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
    } else if (!roomIdFrom(req.url)) {
      done(false, 404);
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
  const room = roomFor(roomIdFrom(req.url));
  // What the room knows about this connection (see room.js).
  const conn = {
    ws,
    ip: clientIp(req),
    hidden: false,
    resyncedAt: 0,
    user: null,
  };
  connectionsByIp.set(conn.ip, (connectionsByIp.get(conn.ip) || 0) + 1);
  ws.isAlive = true;
  ws.budget = { windowStart: Date.now(), count: 0 };

  // ws reports protocol violations (oversized or malformed frames) as an
  // 'error' event; unhandled, that would throw and take the whole room down.
  ws.on('error', () => ws.terminate());
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  room.attach(conn);

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
    if (msg && typeof msg === 'object') room.handle(conn, msg);
  });

  ws.on('close', () => {
    const left = connectionsByIp.get(conn.ip) - 1;
    if (left > 0) connectionsByIp.set(conn.ip, left);
    else connectionsByIp.delete(conn.ip);
    room.detach(conn);
    dropIfEmpty(room);
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
}, HEARTBEAT_MS);

// People going idle shrink the room without sending anything, so re-check
// the skip vote every few seconds too.
const afkSweep = setInterval(() => {
  for (const room of rooms.values()) room.checkSkip();
}, AFK_SWEEP_MS);

wss.on('close', () => {
  clearInterval(heartbeat);
  clearInterval(afkSweep);
  for (const room of rooms.values()) room.close();
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
