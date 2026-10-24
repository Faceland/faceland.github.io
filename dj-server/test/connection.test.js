// Connections: what the server does before (and regardless of) anyone joining.
'use strict';

const assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
const { scenario, expectRejected, sleep, song, ids, LIMITS } = require('./helpers/harness');

scenario('a spectator gets the room state on connect, before any hello', async ({ connect }) => {
  const c = await connect();
  const state = await c.waitFor('state');
  assert.deepEqual(state.users, []);
  assert.deepEqual(state.djQueue, []);
  assert.equal(state.current, null);
});

scenario('an upgrade from an origin not on the allowlist is refused with 403', async ({ server }) => {
  assert.equal(await expectRejected(server.url, { origin: 'http://evil.example' }), 403);
});

scenario('ALLOWED_ORIGINS=* accepts any origin', { ALLOWED_ORIGINS: '*' }, async ({ connect }) => {
  const c = await connect({ origin: 'http://anywhere.example' });
  await c.waitFor('state');
});

scenario('one connection over the per-IP cap is refused with 429; other IPs are not', async ({ connect, server }) => {
  const ip = '198.51.100.7';
  for (let i = 0; i < LIMITS.MAX_CONNECTIONS_PER_IP; i++) await connect({ ip });
  assert.equal(await expectRejected(server.url, { ip }), 429);
  await connect({ ip: '198.51.100.8' });
});

scenario("closing a connection frees that IP's slot", async ({ connect, server }) => {
  const ip = '198.51.100.9';
  const clients = [];
  for (let i = 0; i < LIMITS.MAX_CONNECTIONS_PER_IP; i++) clients.push(await connect({ ip }));
  assert.equal(await expectRejected(server.url, { ip }), 429);
  await clients[0].close();
  await sleep(100);
  await connect({ ip });
});

// Needs a socket per connection on each side; skip where the fd limit would get in the way.
const fdLimit = Number(execSync('ulimit -n', { shell: '/bin/sh' }).toString().trim());
const bigScenario = fdLimit >= LIMITS.MAX_CONNECTIONS * 2 + 64 ? scenario : scenario.skip;
bigScenario('one connection over the room-wide cap is refused with 503', async ({ connect, server }) => {
  for (let i = 0; i < LIMITS.MAX_CONNECTIONS; i++) await connect();
  assert.equal(await expectRejected(server.url), 503);
});

scenario('the HTTP root reports how many people are in the room', async ({ server, connect, member }) => {
  const read = async () => (await fetch(server.httpUrl)).text();
  assert.match(await read(), /\b0 in the room\b/);
  await connect(); // a spectator doesn't count
  await member();
  await member();
  assert.match(await read(), /\b2 in the room\b/);
});

scenario('malformed and non-object messages are ignored', async ({ connect }) => {
  const c = await connect();
  c.sendRaw('not json');
  c.sendRaw('42');
  c.sendRaw('"string"');
  c.sendRaw('null');
  c.sendRaw('[1,2,3]');
  c.send({ t: 'setName', name: 'nobody' }); // not joined: ignored too
  await c.none('notice', 300);
  await c.join({ name: 'Pat' });
  assert.equal(c.name, 'Pat');
});

scenario('a frame over the payload limit closes that connection and nothing else', async ({ member }) => {
  const a = await member({ name: 'A' });
  const b = await member({ name: 'B' });
  b.sendRaw('x'.repeat(LIMITS.MAX_PAYLOAD_BYTES + 1024));
  const { code } = await b.closed;
  assert.ok([1006, 1009].includes(code), `unexpected close code ${code}`);
  a.send({ t: 'setName', name: 'Still here' });
  const state = await a.state((s) => s.users.some((u) => u.name === 'Still here'));
  assert.equal(state.users.length, 1);
});

scenario('messages past the per-second budget are dropped until the window resets', async ({ member }) => {
  const c = await member({ name: 'Sam' });
  for (let i = 0; i <= LIMITS.MESSAGES_PER_SECOND; i++) c.send({ t: 'nothing' });
  c.send({ t: 'setName', name: 'Dropped' });
  await c.none((m) => m.t === 'state' && m.users.some((u) => u.name === 'Dropped'), 500);
  await sleep(1100);
  c.send({ t: 'setName', name: 'Counted' });
  await c.state((s) => s.users.some((u) => u.name === 'Counted'));
});

scenario('a client that stops reading is dropped instead of buffered forever', async ({ member }) => {
  // A full list with long, hard-to-compress titles makes every `list` reply
  // tens of KB, and bumpTrack sends one back each time it's called.
  const alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
  const noise = (n) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  const list = Array.from({ length: LIMITS.MAX_LIST }, (_, i) => song(ids.ok(i + 1), { title: noise(LIMITS.MAX_TITLE) }));
  const c = await member({ name: 'Sleeper', list });
  const { list: mine } = await c.waitFor('list');
  assert.equal(mine.length, LIMITS.MAX_LIST);

  c.ws._socket.pause(); // stop reading; the server keeps writing
  const started = Date.now();
  const pump = setInterval(() => {
    if (c.ws.readyState === c.ws.OPEN) c.send({ t: 'bumpTrack', key: mine[mine.length - 1].key });
  }, 50);
  const outcome = await Promise.race([c.closed, sleep(12000).then(() => null)]);
  clearInterval(pump);
  assert.ok(outcome, 'server never dropped the stalled client');
  assert.equal(outcome.code, 1006);
  console.log(`      (dropped after ${Date.now() - started} ms)`);
});
