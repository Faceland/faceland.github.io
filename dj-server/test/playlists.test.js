// Protocol 3: the page owns its playlists. It sends the room only the selected
// one as video ids (setList), asks the server to look up pasted links
// (lookup), and is told which song played on its turn (played). Pages before
// protocol 3 keep the older list flow, covered in tracks.test.js.
'use strict';

const assert = require('node:assert/strict');
const { scenario, sleep, song, ids, titleOf, LIMITS, REFUSALS, refused, matches } = require('./helpers/harness');

const FAST = { MIN_SKIP_SECONDS: 0 };
const LOOKUP_PACE_MS = Math.ceil(1000 / LIMITS.LOOKUPS_PER_SECOND) + 10;

const playing = (djId) => (s) => Boolean(s.current && s.current.djId === djId);
const nowPlaying = (videoId) => (s) => Boolean(s.current && s.current.videoId === videoId);
const idle = (s) => s.current === null;
const listOf = (n) => (m) => m.t === 'list' && m.list.length === n;
const reply = (id) => (m) => m.t === 'lookup' && m.id === id;

scenario('a protocol-3 page sends video ids and is not sent a list back', async ({ member }) => {
  const c = await member({ v: 3, list: [ids.ok(1), ids.ok(2)] });
  await c.none('list', 400);
  await c.state((s) => s.users.length === 1);
});

scenario('on its turn a protocol-3 DJ is told which song played, instead of getting the list', FAST, async ({ member }) => {
  const dj = await member({ v: 3, list: [ids.ok(1), ids.ok(2)] });
  dj.send({ t: 'setDJ', on: true });
  assert.equal((await dj.waitFor('played')).videoId, ids.ok(1));
  await dj.none('list', 300);
  const state = await dj.state(playing(dj.id));
  assert.equal(state.current.videoId, ids.ok(1));
  dj.send({ t: 'skip' });
  assert.equal((await dj.waitFor('played')).videoId, ids.ok(2), 'the list rotated');
});

scenario('a protocol-2 page still gets its list back and is never told "played"', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1)), song(ids.ok(2))] });
  await dj.waitFor('list');
  dj.send({ t: 'setDJ', on: true });
  const { list } = await dj.waitFor('list');
  assert.deepEqual(list.map((t) => t.videoId), [ids.ok(2), ids.ok(1)]);
  await dj.none('played', 300);
});

scenario('setList replaces what the page will play from', FAST, async ({ member }) => {
  const dj = await member({ v: 3, list: [ids.ok(1)] });
  dj.send({ t: 'setList', list: [ids.ok(5), ids.ok(6)] });
  dj.send({ t: 'setDJ', on: true });
  assert.equal((await dj.waitFor('played')).videoId, ids.ok(5));
  await dj.state(nowPlaying(ids.ok(5)));
  dj.send({ t: 'setList', list: [ids.ok(7)] }); // mid-song: the next turn uses the new list
  dj.send({ t: 'skip' });
  assert.equal((await dj.waitFor('played')).videoId, ids.ok(7));
});

scenario('a list emptied with setList drops the DJ from the queue when the song ends', FAST, async ({ member }) => {
  const dj = await member({ v: 3, list: [ids.ok(1)] });
  dj.send({ t: 'setDJ', on: true });
  await dj.waitFor('played');
  dj.send({ t: 'setList', list: [] });
  dj.send({ t: 'skip' });
  await dj.waitFor(refused('listEmpty'));
  const state = await dj.state(idle);
  assert.deepEqual(state.djQueue, []);
});

scenario('setList is cleaned like a restored list: bad ids and repeats are dropped', FAST, async ({ member }) => {
  // Visible through what plays: a repeat would play twice in a row.
  const dj = await member({ v: 3, list: [ids.ok(1), 'nope', ids.ok(1), 42, null, ids.ok(2)] });
  dj.send({ t: 'setDJ', on: true });
  assert.equal((await dj.waitFor('played')).videoId, ids.ok(1));
  dj.send({ t: 'skip' });
  assert.equal((await dj.waitFor('played')).videoId, ids.ok(2));
  dj.send({ t: 'skip' });
  assert.equal((await dj.waitFor('played')).videoId, ids.ok(1), 'wrapped around a two-song list');
});

scenario('a restored list with repeats is deduplicated for older pages too', async ({ member }) => {
  const c = await member({ list: [song(ids.ok(1)), song(ids.ok(1)), song(ids.ok(2))] });
  const { list } = await c.waitFor('list');
  assert.deepEqual(list.map((t) => t.videoId), [ids.ok(1), ids.ok(2)]);
});

scenario('a restored title gives way to the looked-up one when the room already knows the song', async ({ member }) => {
  const a = await member();
  a.send({ t: 'addTrack', url: ids.ok(1) });
  await a.waitFor(listOf(1));
  const b = await member({ list: [song(ids.ok(1), { title: 'Totally Legit Title' })] });
  const { list } = await b.waitFor('list');
  assert.equal(list[0].title, titleOf(ids.ok(1)));
});

scenario('lookup answers with the track, paired to the request by id; known songs cost nothing', async ({ member, server }) => {
  const c = await member({ v: 3 });
  c.send({ t: 'lookup', id: 7, url: `https://youtu.be/${ids.ok(1)}` });
  matches(await c.waitFor(reply(7)), { track: { videoId: ids.ok(1), title: titleOf(ids.ok(1)), duration: null } });
  assert.equal(server.fetchCalls().length, 1);
  c.send({ t: 'lookup', id: 8, url: ids.ok(1) });
  matches(await c.waitFor(reply(8)), { track: { videoId: ids.ok(1) } });
  assert.equal(server.fetchCalls().length, 1, 'served from the cache');
});

scenario('lookup explains a refusal in the same reply', async ({ member }) => {
  const c = await member({ v: 3 });
  const errorFor = async (id, url) => {
    c.send({ t: 'lookup', id, url });
    return (await c.waitFor(reply(id))).error;
  };
  assert.match(await errorFor(1, 'https://vimeo.com/123'), REFUSALS.notYoutube);
  assert.match(await errorFor(2, 'https://www.youtube.com/playlist?list=PLabc'), REFUSALS.playlist);
  assert.match(await errorFor(3, ids.gone), REFUSALS.gone);
  assert.match(await errorFor(4, ids.noembed), REFUSALS.noEmbed);
  assert.match(await errorFor(5, ids.err), REFUSALS.unreachable);
});

scenario('lookup ignores requests without a usable id', async ({ member }) => {
  const c = await member({ v: 3 });
  for (const id of [-1, 1.5, 'seven', undefined]) c.send({ t: 'lookup', id, url: ids.ok(1) });
  await c.none('lookup', 400);
});

scenario('new lookups count toward the per-person add rate; cached ones do not', async ({ member }) => {
  const c = await member({ v: 3 });
  for (let i = 1; i <= LIMITS.ADDS_PER_MINUTE; i++) {
    await sleep(LOOKUP_PACE_MS);
    c.send({ t: 'lookup', id: i, url: ids.ok(i) });
    await c.waitFor(reply(i));
  }
  c.send({ t: 'lookup', id: 99, url: ids.ok(LIMITS.ADDS_PER_MINUTE + 1) });
  assert.match((await c.waitFor(reply(99))).error, REFUSALS.addsRate);
  c.send({ t: 'lookup', id: 100, url: ids.ok(1) });
  matches(await c.waitFor(reply(100)), { track: { videoId: ids.ok(1) } });
});

scenario('one new lookup at a time per person', async ({ member }) => {
  const c = await member({ v: 3 });
  c.send({ t: 'lookup', id: 1, url: ids.slow });
  c.send({ t: 'lookup', id: 2, url: ids.ok(1) });
  assert.match((await c.waitFor(reply(2))).error, REFUSALS.stillAdding);
  matches(await c.waitFor(reply(1)), { track: { videoId: ids.slow } });
});
