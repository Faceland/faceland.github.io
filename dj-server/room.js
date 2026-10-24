// One room: who is on the floor, the DJ queue, what is playing, and every
// rule about them. The server hands a room its connections and their parsed
// messages, and runs its periodic sweep; the room never touches a socket.
// Everything it sends goes out through the `transport` it was given, so what
// carries the messages can change without the room noticing.
//
// A `conn` is the server's record of one connection: `ip`, `hidden` (the tab
// is in the background), `resyncedAt`, and `user` once they have joined
// (null for spectators on the join screen), plus whatever the transport
// needs to reach it. The room reads and writes those four fields only.

const crypto = require('crypto');
const {
  MAX_CHAT_LENGTH,
  chatProblem,
  nameProblem,
  rateLimitWait,
} = require('./chatRules');
const { FACES, EYES, HATS } = require('./avatarParts');
const {
  YOUTUBE_API_KEY,
  MAX_TRACK_SECONDS,
  AFK_MS,
  MIN_SKIP_MS,
  MAX_NAME,
  MAX_TITLE,
  MAX_LIST,
  API_END_GRACE_MS,
  CLIENT_END_GRACE_MS,
  UNKNOWN_DURATION_TIMEOUT_MS,
  MAX_DJS_PER_IP,
  MOVE_INTERVAL_MS,
  NAME_INTERVAL_MS,
  LOOK_INTERVAL_MS,
  BROADCAST_INTERVAL_MS,
  ADDS_PER_MINUTE,
  REACTIONS,
  CHEER_INTERVAL_MS,
  LIKE_INTERVAL_MS,
  ACTIVE_ACTIONS,
} = require('./config');
const { UserError, clean, isVideoId, position, pick, part, newKey } =
  require('./util');
const { parseVideoId, lookupVideo, cachedVideo } = require('./youtube');

// A list as a page sends it: video ids (protocol 3), or track objects
// (older pages, whose titles are only ever shown back to them; the room
// always uses looked-up titles). Invalid entries and repeats are dropped.
function listFrom(input) {
  const seen = new Set();
  const list = [];
  for (const item of Array.isArray(input) ? input : []) {
    const track = typeof item === 'string' ? { videoId: item } : item;
    if (!track || !isVideoId(track.videoId) || seen.has(track.videoId)) {
      continue;
    }
    seen.add(track.videoId);
    const cached = cachedVideo(track.videoId);
    list.push({
      key: newKey(),
      videoId: track.videoId,
      title:
        (cached && cached.title) ||
        clean(track.title, MAX_TITLE) ||
        track.videoId,
      duration:
        Number(track.duration) > 0
          ? Math.min(MAX_TRACK_SECONDS, Math.round(track.duration))
          : null,
    });
    if (list.length >= MAX_LIST) break;
  }
  return list;
}

class Room {
  constructor({ id, transport }) {
    this.id = id;
    this.transport = transport;
    this.conns = new Set(); // every connection here, joined or not
    this.users = new Map(); // id -> user, for everyone who has joined
    this.djQueue = []; // user ids; while a track plays, djQueue[0] is its DJ
    this.current = null;
    this.endTimer = null;

    // Everything the room hears goes out from flush(), at most once per
    // BROADCAST_INTERVAL_MS however fast people act: the full state if
    // anything changed (it includes positions), otherwise just the latest
    // moves, plus any chat and reactions since the last flush. Chat is
    // relayed once and never stored. Moves are compact [id, x, y] triples
    // with x/y in thousandths.
    this.stateDirty = false;
    this.pendingMoves = new Map(); // user id -> [id, x, y]
    this.pendingChat = [];
    this.pendingReactions = [];
    this.flushTimer = null;
    this.lastFlushAt = 0;
  }

  // How many people have joined (spectators don't count).
  get size() {
    return this.users.size;
  }

  // --- Connections -----------------------------------------------------------

  // A new connection. Spectators get the room state too, so the join screen
  // can show who's here and what's playing before they commit to a name.
  attach(conn) {
    this.conns.add(conn);
    this.send(conn, this.snapshot());
  }

  // The connection closed.
  detach(conn) {
    this.conns.delete(conn);
    const { user } = conn;
    if (!user) return;
    this.users.delete(user.id);
    if (this.djQueue.includes(user.id)) this.leaveQueue(user);
    else this.broadcastState();
    // A smaller room may mean the votes already cast now pass.
    this.checkSkip();
  }

  // Stops the room's timers. Nothing is sent; connections are the server's.
  close() {
    clearTimeout(this.endTimer);
    clearTimeout(this.flushTimer);
    if (this.current) clearTimeout(this.current.skipTimer);
  }

  // --- Outgoing messages -----------------------------------------------------

  send(conn, message) {
    this.transport.send(conn, JSON.stringify(message));
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    for (const conn of this.conns) this.transport.send(conn, data);
  }

  snapshot() {
    const { current } = this;
    const tally = current && this.skipTally();
    return {
      t: 'state',
      users: [...this.users.values()].map(
        ({ id, name, emoji, eyes, hat, x, y }) => ({
          id,
          name,
          emoji,
          // Only sent when worn.
          ...(eyes && { eyes }),
          ...(hat && { hat }),
          x,
          y,
        }),
      ),
      djQueue: this.djQueue,
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
          voters: [...current.skipVotes].filter((id) => this.users.has(id)),
        },
        likes: [...current.likes].filter((id) => this.users.has(id)),
        // How long until the DJ may skip or leave (relative, like elapsed).
        skipLock: Math.max(0, current.startedAt + MIN_SKIP_MS - Date.now()),
      },
    };
  }

  // For things only people in the room need. Spectators on the join screen
  // don't get chat, moves or reactions; `onlyVisible` also skips tabs in the
  // background, which still get chat and state (the music) but not the
  // floor's animation traffic nobody is watching.
  //
  // `legacy` builds the same message for pages from before protocol v2
  // (still open in someone's tab after a deploy); it's only built if one is
  // here. Remove it once those pages have aged out.
  broadcastToMembers(message, { onlyVisible = false, legacy } = {}) {
    const data = JSON.stringify(message);
    let legacyData = null;
    for (const user of this.users.values()) {
      if (onlyVisible && user.conn.hidden) continue;
      if (legacy && user.protocol < 2) {
        legacyData = legacyData || JSON.stringify(legacy());
        this.transport.send(user.conn, legacyData);
      } else {
        this.transport.send(user.conn, data);
      }
    }
  }

  flush() {
    this.flushTimer = null;
    this.lastFlushAt = Date.now();
    if (this.stateDirty) {
      const state = this.snapshot();
      if (this.current) this.current.shownNeeded = state.current.skip.needed;
      this.broadcast(state);
    } else if (this.pendingMoves.size) {
      const moves = [...this.pendingMoves.values()];
      this.broadcastToMembers(
        { t: 'moves', moves },
        {
          onlyVisible: true,
          legacy: () => ({
            t: 'moves',
            moves: moves.map(([id, x, y]) => ({
              id,
              x: x / 1000,
              y: y / 1000,
            })),
          }),
        },
      );
    }
    if (this.pendingChat.length) {
      this.broadcastToMembers({ t: 'chat', messages: this.pendingChat });
    }
    if (this.pendingReactions.length) {
      this.broadcastToMembers(
        { t: 'reactions', reactions: this.pendingReactions },
        { onlyVisible: true },
      );
    }
    this.stateDirty = false;
    this.pendingMoves.clear();
    this.pendingChat = [];
    this.pendingReactions = [];
  }

  scheduleFlush() {
    if (this.flushTimer) return;
    const wait = Math.max(
      0,
      this.lastFlushAt + BROADCAST_INTERVAL_MS - Date.now(),
    );
    this.flushTimer = setTimeout(() => this.flush(), wait);
  }

  broadcastState() {
    this.stateDirty = true;
    this.scheduleFlush();
  }

  // Pages from before protocol 3 keep their list on the server and get it
  // back after every change. Newer pages own their playlists and only send
  // the selected one (setList); they're told which song played instead.
  sendList(user) {
    if (user.protocol < 3) this.send(user.conn, { t: 'list', list: user.list });
  }

  // `scope: 'chat'` notices show under the chat box instead of as a toast.
  notify(user, message, scope) {
    this.send(user.conn, { t: 'notice', message, scope });
  }

  // --- The booth -------------------------------------------------------------

  scheduleEnd() {
    clearTimeout(this.endTimer);
    const { current } = this;
    const elapsed = Date.now() - current.startedAt;
    let wait = UNKNOWN_DURATION_TIMEOUT_MS - elapsed;
    if (current.duration) {
      const grace =
        current.durationSource === 'api'
          ? API_END_GRACE_MS
          : CLIENT_END_GRACE_MS;
      wait = current.duration * 1000 + grace - elapsed;
    }
    wait = Math.min(wait, MAX_TRACK_SECONDS * 1000 - elapsed);
    this.endTimer = setTimeout(() => this.advance('played'), Math.max(0, wait));
  }

  setDuration(seconds, source) {
    const { current } = this;
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
    this.scheduleEnd();
    this.broadcastState();
  }

  play(dj) {
    // The song goes to the bottom of the DJ's list, like a playlist on repeat.
    // The page does the same to its copy (and sends the list back, which
    // also undoes any edit of its that crossed this in flight).
    const track = dj.list.shift();
    dj.list.push(track);
    this.sendList(dj);
    if (dj.protocol >= 3) {
      this.send(dj.conn, { t: 'played', videoId: track.videoId });
    }

    const playId = crypto.randomUUID();
    const cached = cachedVideo(track.videoId);
    this.current = {
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
    this.scheduleEnd();

    if (cached && cached.duration) {
      this.setDuration(cached.duration, 'api');
    } else if (!cached || YOUTUBE_API_KEY) {
      lookupVideo(track.videoId)
        .then((meta) => {
          if (!this.current || this.current.playId !== playId) return;
          this.current.title = meta.title;
          if (meta.duration) this.setDuration(meta.duration, 'api');
          this.broadcastState();
        })
        .catch((err) => {
          // Gone private, unembeddable or live since it was added: skip it.
          if (err.permanent && this.current && this.current.playId === playId) {
            this.advance('failed');
          }
        });
    }
  }

  // Ends whatever is playing (if anything) and hands the booth to the next
  // DJ. How the song went ('skipped' by a vote, 'failed', or 'played', which
  // includes the DJ cutting it short themselves) goes to its DJ, whose page
  // marks skipped and failed songs in their list until they reload; nothing
  // else keeps it.
  advance(outcome) {
    clearTimeout(this.endTimer);
    const { current } = this;
    if (current) {
      clearTimeout(current.skipTimer);
      const dj = this.users.get(current.djId);
      if (dj && outcome) {
        this.send(dj.conn, { t: 'outcome', videoId: current.videoId, outcome });
      }
    }
    if (current && this.djQueue[0] === current.djId) {
      this.djQueue.push(this.djQueue.shift());
    }
    this.current = null;
    while (this.djQueue.length) {
      const dj = this.users.get(this.djQueue[0]);
      if (dj && dj.list.length) {
        this.play(dj);
        break;
      }
      this.djQueue.shift();
      if (dj) this.notify(dj, 'Your list is empty, so you left the DJ queue.');
    }
    this.broadcastState();
  }

  leaveQueue(user) {
    if (!this.djQueue.includes(user.id)) return;
    this.djQueue = this.djQueue.filter((id) => id !== user.id);
    if (this.current && this.current.djId === user.id) this.advance('played');
    else this.broadcastState();
  }

  roomIps() {
    return new Set([...this.users.values()].map((user) => user.ip));
  }

  // Listener reports (ended / couldn't play) only take effect when they come
  // from more than half of the distinct IPs in the room, so one person (or
  // one person with many tabs) can't skip songs for everybody else.
  roomAgrees(ips) {
    return ips.size * 2 > this.roomIps().size;
  }

  // Vote to skip: the song skips once votes reach half the room, plus one
  // more for every 2 likes. The room is everyone active in the last AFK_MS
  // plus anyone who already voted. Votes, likes and the room all count
  // distinct IPs, so one person with several tabs gets one vote and one like.
  skipTally() {
    const now = Date.now();
    const ipsOf = (ids) => {
      const ips = new Set();
      for (const id of ids) {
        const user = this.users.get(id);
        if (user) ips.add(user.ip);
      }
      return ips;
    };
    const voterIps = ipsOf(this.current.skipVotes);
    const room = new Set(voterIps);
    for (const user of this.users.values()) {
      if (now - user.activeAt < AFK_MS) room.add(user.ip);
    }
    return {
      votes: voterIps.size,
      needed:
        Math.max(1, Math.ceil(room.size / 2)) +
        Math.floor(ipsOf(this.current.likes).size / 2),
    };
  }

  // The DJ's own Skip and Leave booth wait for MIN_SKIP_MS too: both start a
  // new video for everyone, just like a vote skip. (A DJ who disconnects
  // still ends their song; that can't be refused.) Returns whether it's too
  // soon, telling the DJ when it opens up.
  djLocked(user) {
    const wait = this.current.startedAt + MIN_SKIP_MS - Date.now();
    if (wait <= 0) return false;
    this.notify(user, `You can skip or leave in ${Math.ceil(wait / 1000)}s.`);
    return true;
  }

  // Skips if the vote passes and the song is past MIN_SKIP_MS. A vote that
  // passes earlier arms a timer for the mark, which re-checks then (the room
  // may have changed its mind). Returns whether it skipped.
  trySkip(tally = this.skipTally()) {
    if (tally.votes < tally.needed) return false;
    const { current } = this;
    const wait = current.startedAt + MIN_SKIP_MS - Date.now();
    if (wait > 0) {
      if (!current.skipTimer) {
        const { playId } = current;
        current.skipTimer = setTimeout(() => {
          if (!this.current || this.current.playId !== playId) return;
          this.current.skipTimer = null;
          this.checkSkip();
        }, wait);
      }
      return false;
    }
    this.advance('skipped');
    return true;
  }

  // Re-checks the vote after the room changes (someone left or went idle):
  // skips if it now passes, or refreshes the "x/y votes" everyone sees.
  checkSkip() {
    if (!this.current) return;
    const tally = this.skipTally();
    if (this.trySkip(tally)) return;
    if (tally.needed !== this.current.shownNeeded) this.broadcastState();
  }

  // --- Incoming messages -----------------------------------------------------

  join(conn, msg) {
    const list = listFrom(msg.list);
    // A saved name that breaks the rules (e.g. from before they existed) just
    // falls back to Guest.
    const name = clean(msg.name, MAX_NAME);
    const user = {
      id: crypto.randomUUID().slice(0, 8),
      conn,
      ip: conn.ip,
      // 2 = compact moves, 3 = the page owns its playlists. Pages from
      // before either send no version.
      protocol: Number(msg.v) || 1,
      name: (name && !nameProblem(name) && name) || 'Guest',
      emoji: FACES.includes(msg.emoji) ? msg.emoji : pick(FACES),
      eyes: part(msg.eyes, EYES),
      hat: part(msg.hat, HATS),
      // Somewhere in the middle of the floor until they choose a spot.
      x: position(0.15 + Math.random() * 0.7),
      y: position(0.3 + Math.random() * 0.5),
      list,
      lastMoveAt: 0,
      lastNameAt: 0,
      lastLookAt: 0,
      addTimes: [],
      adding: false,
      chatTimes: [],
      lastChat: { text: '', at: 0 },
      activeAt: Date.now(),
      lastLikeAt: 0,
      lastCheerAt: 0,
    };
    conn.user = user;
    this.users.set(user.id, user);
    this.send(conn, {
      t: 'welcome',
      id: user.id,
      name: user.name,
      emoji: user.emoji,
      eyes: user.eyes,
      hat: user.hat,
    });
    this.sendList(user);
    this.broadcastState();
  }

  // Looks up a pasted link for a page adding it to one of its playlists, and
  // answers with the track or why not. Links already looked up cost nothing;
  // new ones count toward the per-person and room-wide lookup limits.
  async lookupTrack(user, msg) {
    const reply = (body) =>
      this.send(user.conn, { t: 'lookup', id: msg.id, ...body });
    try {
      const videoId = parseVideoId(msg.url);
      if (!videoId) {
        throw new UserError("That doesn't look like a YouTube link.");
      }
      if (!cachedVideo(videoId)) {
        if (user.adding) throw new UserError('Still adding your last song.');
        const now = Date.now();
        user.addTimes = user.addTimes.filter((at) => now - at < 60000);
        if (user.addTimes.length >= ADDS_PER_MINUTE) {
          throw new UserError(
            "You're adding songs too fast. Try again in a minute.",
          );
        }
        user.addTimes.push(now);
      }
      user.adding = true;
      let meta;
      try {
        meta = await lookupVideo(videoId);
      } finally {
        user.adding = false;
      }
      reply({
        track: { videoId, title: meta.title, duration: meta.duration },
      });
    } catch (err) {
      if (!(err instanceof UserError)) throw err;
      reply({ error: err.message });
    }
  }

  // For pages from before protocol 3 (see sendList).
  async addTrack(user, msg) {
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
      if (!videoId) {
        throw new UserError("That doesn't look like a YouTube link.");
      }
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
      if (!this.users.has(user.id)) return;
      if (user.list.length >= MAX_LIST) {
        throw new UserError(`Your list is full (${MAX_LIST} songs).`);
      }
      if (user.list.some((track) => track.videoId === videoId)) {
        throw new UserError("That song's already in your list.");
      }
      user.list.push({ key: newKey(), videoId, ...meta });
      this.sendList(user);
    } catch (err) {
      if (!(err instanceof UserError)) throw err;
      this.notify(user, err.message);
    }
  }

  sendChat(user, msg, now) {
    // Every attempt counts toward the limits, refused ones included, so a
    // modified client can't probe the filter at full speed.
    user.chatTimes = user.chatTimes.filter((at) => now - at < 60000);
    const wait = rateLimitWait(user.chatTimes, now, 250);
    if (wait > 0) {
      this.notify(user, `Slow down: wait ${Math.ceil(wait / 1000)}s.`, 'chat');
      return;
    }
    user.chatTimes.push(now);
    const text = clean(msg.text, MAX_CHAT_LENGTH);
    if (!text) return;
    const problem = chatProblem(text);
    if (problem) {
      this.notify(user, problem, 'chat');
      return;
    }
    if (text === user.lastChat.text && now - user.lastChat.at < 30000) {
      this.notify(user, 'You just said that.', 'chat');
      return;
    }
    user.lastChat = { text, at: now };
    this.pendingChat.push({
      id: newKey(),
      userId: user.id,
      emoji: user.emoji,
      name: user.name,
      text,
    });
    this.scheduleFlush();
  }

  handle(conn, msg) {
    const { user } = conn;
    if (msg.t === 'hello') {
      if (!user) this.join(conn, msg);
      return;
    }
    if (!user) return;
    const now = Date.now();
    if (ACTIVE_ACTIONS.has(msg.t)) user.activeAt = now;
    const { current } = this;

    switch (msg.t) {
      case 'setName': {
        if (now - user.lastNameAt < NAME_INTERVAL_MS) {
          this.notify(user, 'Wait a moment before changing your name again.');
          break;
        }
        user.lastNameAt = now;
        const name = clean(msg.name, MAX_NAME) || 'Guest';
        const problem = nameProblem(name);
        if (problem) {
          this.notify(user, problem);
          // Only they need the state again, to snap their name box back.
          this.send(conn, this.snapshot());
        } else if (name !== user.name) {
          user.name = name;
          this.broadcastState();
        }
        break;
      }

      case 'setLook': {
        // The editor only sends this on Done, so this rarely bites.
        if (now - user.lastLookAt < LOOK_INTERVAL_MS) {
          this.notify(user, 'Wait a moment before changing your look again.');
          this.send(conn, this.snapshot());
          break;
        }
        user.lastLookAt = now;
        if (!FACES.includes(msg.emoji)) break;
        const eyes = part(msg.eyes, EYES);
        const hat = part(msg.hat, HATS);
        if (
          msg.emoji !== user.emoji ||
          eyes !== user.eyes ||
          hat !== user.hat
        ) {
          user.emoji = msg.emoji;
          user.eyes = eyes;
          user.hat = hat;
          this.broadcastState();
        }
        break;
      }

      case 'chat':
        this.sendChat(user, msg, now);
        break;

      case 'move':
        // The DJ stands in the booth; the floor is for everyone else.
        if (now - user.lastMoveAt < MOVE_INTERVAL_MS) break;
        if (current && current.djId === user.id) break;
        user.lastMoveAt = now;
        user.x = position(msg.x);
        user.y = position(msg.y);
        this.pendingMoves.set(user.id, [
          user.id,
          Math.round(user.x * 1000),
          Math.round(user.y * 1000),
        ]);
        this.scheduleFlush();
        break;

      case 'setList':
        user.list = listFrom(msg.list);
        break;

      case 'lookup':
        // The id only pairs the answer with the request; it's echoed back.
        if (!(Number.isSafeInteger(msg.id) && msg.id >= 0)) break;
        this.lookupTrack(user, msg).catch((err) =>
          console.error('lookup:', err),
        );
        break;

      case 'addTrack':
        this.addTrack(user, msg).catch((err) =>
          console.error('addTrack:', err),
        );
        break;

      case 'removeTrack':
        user.list = user.list.filter((track) => track.key !== msg.key);
        this.sendList(user);
        break;

      case 'bumpTrack': {
        const index = user.list.findIndex((track) => track.key === msg.key);
        if (index > 0) user.list.unshift(...user.list.splice(index, 1));
        this.sendList(user);
        break;
      }

      case 'setDJ':
        if (!msg.on) {
          // Leaving the booth mid-song ends it, so it waits like a skip.
          if (current && current.djId === user.id && this.djLocked(user)) {
            break;
          }
          this.leaveQueue(user);
          break;
        }
        if (this.djQueue.includes(user.id)) break;
        if (!user.list.length) {
          this.notify(user, 'Add a song to your list first.');
          break;
        }
        if (
          this.djQueue.filter((id) => this.users.get(id).ip === user.ip)
            .length >= MAX_DJS_PER_IP
        ) {
          this.notify(user, `Only ${MAX_DJS_PER_IP} DJs per connection, sorry.`);
          break;
        }
        this.djQueue.push(user.id);
        if (current) this.broadcastState();
        else this.advance();
        break;

      case 'skip':
        if (current && current.djId === user.id && !this.djLocked(user)) {
          this.advance('played');
        }
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
          if (!this.trySkip()) this.broadcastState();
          // Only liking animates, at most once a second.
          if (!liked || now - user.lastLikeAt < LIKE_INTERVAL_MS) break;
          user.lastLikeAt = now;
        } else {
          if (now - user.lastCheerAt < CHEER_INTERVAL_MS) break;
          user.lastCheerAt = now;
        }
        this.pendingReactions.push({ id: user.id, kind: msg.kind });
        this.scheduleFlush();
        break;

      case 'voteSkip': {
        // The DJ has a real Skip button instead.
        if (!current || current.djId === user.id) break;
        if (Boolean(msg.on) === current.skipVotes.has(user.id)) break;
        if (msg.on) current.skipVotes.add(user.id);
        else current.skipVotes.delete(user.id);
        if (!this.trySkip()) this.broadcastState();
        break;
      }

      case 'duration':
        if (current && current.playId === msg.playId) {
          this.setDuration(Number(msg.seconds), 'client');
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
          if (this.roomAgrees(current.endedBy)) this.advance('played');
        }
        break;

      case 'visibility':
        // Not activity: a tab going to the background isn't the person doing
        // something. Coming back gets a fresh snapshot (positions included),
        // at most every 2 s so toggling can't be used to pull snapshots.
        if (Boolean(msg.hidden) === Boolean(conn.hidden)) break;
        conn.hidden = Boolean(msg.hidden);
        if (!conn.hidden && now - (conn.resyncedAt || 0) > 2000) {
          conn.resyncedAt = now;
          this.send(conn, this.snapshot());
        }
        break;

      case 'trackError':
        // One listener failing (say, region-locked) shouldn't skip the song
        // for the room, but most of the room failing should.
        if (current && current.playId === msg.playId) {
          current.erroredBy.add(user.ip);
          if (this.roomAgrees(current.erroredBy)) this.advance('failed');
        }
        break;

      default:
        break;
    }
  }
}

module.exports = { Room, listFrom };
