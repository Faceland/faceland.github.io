// Rooms: picked by URL, independent of each other, made on demand and dropped
// when empty. `/` is the main room, so every page from before rooms existed
// still lands somewhere.
'use strict';

const assert = require('node:assert/strict');
const { scenario, expectRejected, sleep, song, ids, LIMITS } = require('./helpers/harness');

const FAST = { MIN_SKIP_SECONDS: 0 };
const playing = (djId) => (s) => Boolean(s.current && s.current.djId === djId);
const said = (id, text) => (m) => m.t === 'chat' && m.messages.some((x) => x.userId === id && x.text === text);
const status = async (server, path = '/') => (await fetch(server.httpUrl + path)).text();

scenario("'/' and '/r/main' are the same room", async ({ member }) => {
  const a = await member({ name: 'A', path: '/' });
  const b = await member({ name: 'B', path: '/r/main' });
  const state = await b.state((s) => s.users.length === 2);
  assert.deepEqual(state.users.map((u) => u.name).sort(), ['A', 'B']);
  await a.state((s) => s.users.length === 2);
});

scenario('two rooms do not see each other', FAST, async ({ member }) => {
  const a = await member({ name: 'A', path: '/r/alpha', list: [song(ids.ok(1))] });
  const b = await member({ name: 'B', path: '/r/beta' });
  await a.state((s) => s.users.length === 1);
  await b.state((s) => s.users.length === 1);
  assert.equal(a.latestState().users[0].name, 'A');
  assert.equal(b.latestState().users[0].name, 'B');

  a.send({ t: 'setDJ', on: true });
  await a.state(playing(a.id));
  a.send({ t: 'chat', text: 'only alpha hears this' });
  await a.waitFor(said(a.id, 'only alpha hears this'));
  await b.none((m) => m.t === 'chat' || (m.t === 'state' && m.current), 400);
  assert.equal(b.latestState().current, null);
});

scenario('room ids are lower-cased, so /r/Chill and /r/chill are one room', async ({ member }) => {
  const a = await member({ path: '/r/Chill' });
  const b = await member({ path: '/r/chill/' });
  await a.state((s) => s.users.length === 2);
  await b.state((s) => s.users.length === 2);
});

scenario('an unknown or malformed path is refused with 404', async ({ server }) => {
  for (const path of ['/nope', '/r/', '/r/has%20space', '/r/a/b', `/r/${'x'.repeat(40)}`, '/r/-dash', '/r/%2F']) {
    assert.equal(await expectRejected(server.url, { path }), 404, path);
  }
  await expectRejected(server.url, { path: '/r/ok_id-1' }).then(
    () => assert.fail('a valid id should connect'),
    (err) => assert.match(err.message, /expected the upgrade to be refused/),
  );
});

scenario('the per-IP connection cap counts across rooms', async ({ connect, server }) => {
  const ip = '198.51.100.21';
  for (let i = 0; i < LIMITS.MAX_CONNECTIONS_PER_IP; i++) await connect({ ip, path: `/r/room${i}` });
  assert.equal(await expectRejected(server.url, { ip, path: '/r/another' }), 429);
});

scenario('the DJ cap per IP is per room', FAST, async ({ member }) => {
  const ip = '198.51.100.22';
  const djs = [];
  for (let i = 0; i < LIMITS.MAX_DJS_PER_IP; i++) {
    djs.push(await member({ ip, path: '/r/one', list: [song(ids.ok(i + 1))] }));
  }
  for (const dj of djs) dj.send({ t: 'setDJ', on: true });
  await djs[0].state((s) => s.djQueue.length === LIMITS.MAX_DJS_PER_IP);
  const elsewhere = await member({ ip, path: '/r/two', list: [song(ids.ok(9))] });
  elsewhere.send({ t: 'setDJ', on: true });
  await elsewhere.state(playing(elsewhere.id));
});

scenario('the status line counts everyone, and a room on its own', async ({ member, connect, server }) => {
  assert.match(await status(server), /\b0 in the room\b/);
  await member({ path: '/r/alpha' });
  await member({ path: '/r/alpha' });
  assert.match(await status(server), /\b2 in the room\b/);
  await member({ path: '/r/beta' });
  assert.match(await status(server), /\b3 in 2 rooms\b/);
  assert.match(await status(server, '/r/alpha'), /\b2 in the room\b/);
  assert.match(await status(server, '/r/beta'), /\b1 in the room\b/);
  assert.match(await status(server, '/r/nobody-yet'), /\b0 in the room\b/, 'asking does not create it');
  await connect({ path: '/r/gamma' }); // a spectator counts as a room, not a person
  assert.match(await status(server), /\b3 in 3 rooms\b/);
  assert.equal((await fetch(server.httpUrl + '/nope')).status, 404);
});

scenario('an empty room is dropped and comes back fresh', FAST, async ({ member, server }) => {
  const dj = await member({ path: '/r/temp', list: [song(ids.ok(1))] });
  dj.send({ t: 'setDJ', on: true });
  await dj.state(playing(dj.id));
  await member({ path: '/r/main' });
  assert.match(await status(server), /\b2 in 2 rooms\b/);

  await dj.terminate();
  await sleep(100);
  assert.match(await status(server), /\b1 in the room\b/, 'temp is gone');

  const again = await member({ path: '/r/temp' });
  const state = await again.state((s) => s.users.length === 1);
  assert.equal(state.current, null, 'nothing carried over');
  assert.deepEqual(state.djQueue, []);
});

scenario('a room-wide limit still applies across rooms', async ({ connect, server }) => {
  // Lookups share one budget per process, whichever room asks.
  const a = await member_(connect, '/r/a');
  const b = await member_(connect, '/r/b');
  for (let i = 1; i <= LIMITS.LOOKUPS_PER_SECOND; i++) {
    const c = i % 2 ? a : b;
    c.send({ t: 'lookup', id: i, url: ids.ok(i) });
    await c.waitFor((m) => m.t === 'lookup' && m.id === i);
  }
  a.send({ t: 'lookup', id: 99, url: ids.ok(60) });
  const reply = await a.waitFor((m) => m.t === 'lookup' && m.id === 99);
  assert.match(reply.error, /busy/i);
  assert.equal(server.fetchCalls().length, LIMITS.LOOKUPS_PER_SECOND);
});

async function member_(connect, path) {
  const c = await connect({ path });
  await c.join({ v: 3 });
  return c;
}
