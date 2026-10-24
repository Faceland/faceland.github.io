// Test harness for dj-server: starts the real server as a child process on a
// free port (with YouTube stubbed, see stubFetch.js) and talks to it with
// real WebSocket clients. Nothing in server.js is imported or patched.
//
// Every client claims its own IP via X-Real-IP, which the server trusts from
// loopback exactly as it trusts nginx in production. Pass `ip` to share one.
'use strict';

const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const { test } = require('node:test');
const WebSocket = require('ws');

const SERVER = path.join(__dirname, '..', '..', 'server.js');
const STUB = path.join(__dirname, 'stubFetch.js');
const ORIGIN = 'http://test';
const TEST_TIMEOUT_MS = 20000;
const START_TIMEOUT_MS = 5000;
const WAIT_MS = 3000;

// --- Server ------------------------------------------------------------------

const children = new Set();
process.on('exit', () => {
  for (const child of children) child.kill('SIGKILL');
});

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function startServer(env = {}) {
  const port = await freePort();
  const stringEnv = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [key, String(value)]),
  );
  const child = spawn(process.execPath, ['--require', STUB, SERVER], {
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      ALLOWED_ORIGINS: ORIGIN,
      ...stringEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const exited = new Promise((resolve) => {
    child.on('exit', (code, signal) => {
      children.delete(child);
      resolve({ code, signal });
    });
  });

  await new Promise((resolve, reject) => {
    const onData = () => {
      if (stdout.includes('DJ server listening on')) {
        child.stdout.off('data', onData);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    exited.then(({ code, signal }) =>
      reject(
        new Error(
          `server exited before listening (${code ?? signal})\n${stderr}`,
        ),
      ),
    );
    setTimeout(
      () => reject(new Error(`server did not start in time\n${stderr}`)),
      START_TIMEOUT_MS,
    ).unref();
  });

  return {
    port,
    url: `ws://127.0.0.1:${port}`,
    httpUrl: `http://127.0.0.1:${port}`,
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
    // Every URL the server asked YouTube for, in order.
    fetchCalls() {
      return stderr
        .split('\n')
        .filter((line) => line.startsWith('[stubFetch] '))
        .map((line) => line.slice('[stubFetch] '.length));
    },
    alive() {
      return child.exitCode === null && child.signalCode === null;
    },
    async stop() {
      if (this.alive()) child.kill('SIGTERM');
      await exited;
    },
  };
}

// --- Client ------------------------------------------------------------------

let ipCounter = 0;
const nextIp = () => {
  const n = ++ipCounter;
  return `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
};

const short = (value) => {
  const text = JSON.stringify(value);
  return text.length > 400 ? text.slice(0, 400) + '…' : text;
};

class Client {
  constructor(ws, ip) {
    this.ws = ws;
    this.ip = ip;
    this.id = null;
    this.name = null;
    this.inbox = []; // every parsed message, in order
    this.consumed = new Set(); // inbox indexes already returned by waitFor
    this.waiters = [];
    this.closed = new Promise((resolve) => {
      ws.on('close', (code, reason) =>
        resolve({ code, reason: reason.toString() }),
      );
    });
    ws.on('message', (data) => {
      this.inbox.push(JSON.parse(data));
      for (const waiter of [...this.waiters]) waiter();
    });
  }

  static connect(url, { ip = nextIp(), origin = ORIGIN } = {}) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, { origin, headers: { 'X-Real-IP': ip } });
      const client = new Client(ws, ip);
      ws.once('open', () => resolve(client));
      ws.once('error', reject);
      ws.once('unexpected-response', (req, res) => {
        req.destroy();
        reject(
          Object.assign(new Error(`upgrade rejected: ${res.statusCode}`), {
            status: res.statusCode,
          }),
        );
      });
    });
  }

  send(message) {
    this.ws.send(JSON.stringify(message));
  }

  sendRaw(data) {
    this.ws.send(data);
  }

  async join({ name, list, emoji, eyes, hat, v = 2 } = {}) {
    this.send({ t: 'hello', v, name, emoji, eyes, hat, list });
    const welcome = await this.waitFor('welcome');
    this.id = welcome.id;
    this.name = welcome.name;
    this.welcome = welcome;
    return welcome;
  }

  close(code, reason) {
    this.ws.close(code, reason);
    return this.closed;
  }

  terminate() {
    this.ws.terminate();
    return this.closed;
  }

  _wait(pred, { from, timeout, label }) {
    return new Promise((resolve, reject) => {
      const check = () => {
        for (let i = from; i < this.inbox.length; i++) {
          if (this.consumed.has(i)) continue;
          if (pred(this.inbox[i])) {
            this.consumed.add(i);
            return this.inbox[i];
          }
        }
        return null;
      };
      const found = check();
      if (found) return resolve(found);
      const remove = () => {
        const i = this.waiters.indexOf(waiter);
        if (i >= 0) this.waiters.splice(i, 1);
      };
      const timer = setTimeout(() => {
        remove();
        reject(
          new Error(
            `timed out waiting for ${label}; last messages: ${short(
              this.inbox.slice(-4),
            )}`,
          ),
        );
      }, timeout);
      const waiter = () => {
        const message = check();
        if (!message) return;
        clearTimeout(timer);
        remove();
        resolve(message);
      };
      this.waiters.push(waiter);
    });
  }

  static _pred(match) {
    return typeof match === 'string' ? (m) => m.t === match : match;
  }

  // The first message not yet returned that matches (a type name or a
  // predicate), whether it already arrived or arrives within the timeout.
  waitFor(match, { timeout = WAIT_MS, label = match.label || String(match), since = 0 } = {}) {
    return this._wait(Client._pred(match), { from: since, timeout, label });
  }

  // Like waitFor, but only messages that arrive from now on.
  next(match, { timeout = WAIT_MS, label = `next ${match}` } = {}) {
    return this._wait(Client._pred(match), {
      from: this.inbox.length,
      timeout,
      label,
    });
  }

  // A position in the inbox, for `waitFor(..., { since: mark })`.
  mark() {
    return this.inbox.length;
  }

  latestState() {
    for (let i = this.inbox.length - 1; i >= 0; i--) {
      if (this.inbox[i].t === 'state') return this.inbox[i];
    }
    return null;
  }

  // The room state once `pred` holds: the latest snapshot if it already
  // does, otherwise the next one that does.
  state(pred = () => true, { timeout = WAIT_MS, label = 'state' } = {}) {
    const latest = this.latestState();
    if (latest && pred(latest)) return Promise.resolve(latest);
    return this._wait((m) => m.t === 'state' && pred(m), {
      from: this.inbox.length,
      timeout,
      label,
    });
  }

  // Resolves after `ms` if nothing matching arrives in the meantime.
  none(match, ms = 400) {
    const pred = Client._pred(match);
    const from = this.inbox.length;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const leaked = this.inbox.slice(from).find(pred);
        if (leaked) {
          reject(
            new Error(`expected no ${match} but got ${short(leaked)}`),
          );
        } else {
          resolve();
        }
      }, ms);
    });
  }

  // Everyone in the latest state, keyed by id.
  user(id = this.id) {
    const state = this.latestState();
    return state && state.users.find((user) => user.id === id);
  }
}

function expectRejected(url, { ip = nextIp(), origin = ORIGIN } = {}) {
  return Client.connect(url, { ip, origin }).then(
    (client) => {
      client.terminate();
      throw new Error('expected the upgrade to be refused, but it opened');
    },
    (err) => {
      if (err.status) return err.status;
      throw err;
    },
  );
}

// --- Limits and refusals -----------------------------------------------------

const assert = require('node:assert/strict');
const { MAX_CHAT_LENGTH, CHAT_RATE_LIMITS } = require('../../chatRules');

// The server's limits as the tests know them. When one changes in server.js,
// change it here and nowhere else; no test should carry its own copy.
const LIMITS = {
  MAX_CONNECTIONS: 200,
  MAX_CONNECTIONS_PER_IP: 6,
  MAX_DJS_PER_IP: 2,
  MESSAGES_PER_SECOND: 20,
  MAX_PAYLOAD_BYTES: 64 * 1024,
  MAX_NAME: 20,
  MAX_TITLE: 200,
  MAX_LIST: 100,
  MAX_TRACK_SECONDS: 15 * 60,
  ADDS_PER_MINUTE: 10,
  LOOKUPS_PER_SECOND: 5,
  NAME_INTERVAL_MS: 2000,
  LOOK_INTERVAL_MS: 1000,
  MOVE_INTERVAL_MS: 100,
  BROADCAST_INTERVAL_MS: 150,
  LIKE_INTERVAL_MS: 1000,
  CHEER_INTERVAL_MS: 2800,
  // Chat rules are shared with the page, so these come straight from the source.
  MAX_CHAT_LENGTH,
  CHAT_BURST: CHAT_RATE_LIMITS[0][0],
  CHAT_BURST_WINDOW_MS: CHAT_RATE_LIMITS[0][1],
};

// Why the server said no, keyed by intent and matched by the one word in each
// message least likely to be reworded. Tests match these, never a full
// sentence: the wording is product and changes freely. If a refusal gets a
// machine-readable code one day, this table is what becomes those codes.
const REFUSALS = {
  nameRate: /wait/i, //           'Wait a moment before changing your name again.'
  lookRate: /wait/i, //           'Wait a moment before changing your look again.'
  nameLink: /link/i, //           "Names can't contain links."
  nameBanned: /allowed/i, //      "That name isn't allowed."
  chatRate: /slow|wait/i, //      'Slow down: wait 3s.'
  chatLink: /link/i, //           "Links aren't allowed in chat."
  chatProfane: /clean|block/i, // 'Keep it clean: that has a word we block.'
  chatRepeat: /said/i, //         'You just said that.'
  chatSpam: /spam/i, //           'That looks like spam.'
  needSong: /song/i, //           'Add a song to your list first.'
  skipLock: /skip|leave/i, //     'You can skip or leave in 3s.'
  listEmpty: /empty/i, //         'Your list is empty, so you left the DJ queue.'
  djsPerIp: /\bDJs?\b/, //        'Only 2 DJs per connection, sorry.'
  notYoutube: /youtube/i, //      "That doesn't look like a YouTube link."
  playlist: /playlist/i, //       "Playlists aren't supported yet. ..."
  duplicate: /already/i, //       "That song's already in your list."
  gone: /exist|private/i, //      "That video doesn't exist or is private."
  noEmbed: /owner/i, //           "That video's owner doesn't allow it on other sites."
  unreachable: /reach/i, //       "Couldn't reach YouTube. Try again in a bit."
  listFull: /full/i, //           'Your list is full (100 songs).'
  addsRate: /fast/i, //           "You're adding songs too fast. Try again in a minute."
  stillAdding: /still/i, //       'Still adding your last song.'
  live: /live/i, //               "Live streams can't be added."
  busy: /busy/i, //               'The room is busy. Try again in a moment.'
};

// A predicate for waitFor / none: a notice refusing for `reason` (a REFUSALS
// key), optionally with a given scope ('chat' notices show under the chat box).
function refused(reason, scope) {
  const pattern = REFUSALS[reason];
  if (!pattern) throw new Error(`unknown refusal: ${reason}`);
  const pred = (m) =>
    m.t === 'notice' &&
    pattern.test(m.message) &&
    (scope === undefined || m.scope === scope);
  pred.label = `notice (${reason})`;
  return pred;
}

// Asserts `actual` has everything `expected` has, ignoring extra keys. Arrays
// must match in length, element by element. A field the server grows later
// never breaks a test that didn't ask about it.
function matches(actual, expected, path = 'value') {
  if (expected !== null && typeof expected === 'object') {
    assert.ok(
      actual !== null && typeof actual === 'object',
      `${path}: expected an object, got ${short(actual)}`,
    );
    if (Array.isArray(expected)) {
      assert.ok(Array.isArray(actual), `${path}: expected an array, got ${short(actual)}`);
      assert.equal(
        actual.length,
        expected.length,
        `${path}: expected ${expected.length} item(s), got ${short(actual)}`,
      );
      expected.forEach((item, i) => matches(actual[i], item, `${path}[${i}]`));
    } else {
      for (const [key, value] of Object.entries(expected)) {
        matches(actual[key], value, `${path}.${key}`);
      }
    }
  } else {
    assert.strictEqual(actual, expected, path);
  }
}

// --- Scenarios ---------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// scenario(name, [env], fn): a fresh server (with `env`) and a client factory
// for one test. Every client is torn down and the server stopped afterwards;
// a server that died mid-test fails the test with its stderr.
function defineScenario(runner) {
  return (name, env, fn) => {
    if (typeof env === 'function') {
      fn = env;
      env = {};
    }
    return runner(name, { timeout: TEST_TIMEOUT_MS }, async () => {
      const server = await startServer(env);
      const clients = [];
      const connect = async (options) => {
        const client = await Client.connect(server.url, options);
        clients.push(client);
        return client;
      };
      // A connected client that has joined the room.
      const member = async (options = {}) => {
        const client = await connect(options);
        await client.join(options);
        return client;
      };
      let failure = null;
      try {
        await fn({ server, connect, member });
      } catch (err) {
        failure = err;
      }
      const died = !server.alive();
      for (const client of clients) client.ws.terminate();
      await server.stop();
      if (failure) throw failure;
      if (died) throw new Error(`server died during test:\n${server.stderr}`);
    });
  };
}

const scenario = defineScenario(test);
scenario.skip = defineScenario(test.skip);
scenario.only = defineScenario(test.only);

// --- Fixtures ----------------------------------------------------------------

const pad = (prefix, n) => prefix + String(n).padStart(11 - prefix.length, '0');

// Video IDs the stub understands (all exactly 11 chars, see stubFetch.js).
const ids = {
  ok: (n = 1) => pad('ok', n),
  withDuration: (seconds) => `d${String(seconds).padStart(3, '0')}abcdefg`,
  gone: 'gone0000001',
  noembed: 'noembed0001',
  live: 'live0000001',
  slow: 'slow0000001',
  err: 'err00000001',
  http5: 'http5000001',
  ctrl: 'ctrl0000001',
};

const titleOf = (videoId) => `Title for ${videoId}`;

// A track as a browser would restore it from localStorage.
const song = (videoId, extra = {}) => ({
  videoId,
  title: `Saved ${videoId}`,
  duration: null,
  ...extra,
});

module.exports = {
  Client,
  LIMITS,
  ORIGIN,
  REFUSALS,
  expectRejected,
  ids,
  matches,
  refused,
  scenario,
  sleep,
  song,
  startServer,
  titleOf,
};
