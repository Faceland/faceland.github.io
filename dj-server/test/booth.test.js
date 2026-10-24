// The booth: who is DJing, what is playing, and how songs end.
'use strict';

const assert = require('node:assert/strict');
const { scenario, sleep, song, ids, titleOf, LIMITS, refused, matches } = require('./helpers/harness');

// The skip lock is covered on its own below; everything else is easier without it.
const FAST = { MIN_SKIP_SECONDS: 0 };

const playing = (djId) => (s) => Boolean(s.current && s.current.djId === djId);
const nowPlaying = (videoId) => (s) => Boolean(s.current && s.current.videoId === videoId);
const titled = (videoId) => (s) => Boolean(s.current && s.current.title === titleOf(videoId));
const idle = (s) => s.current === null;

scenario('setDJ needs a song in your list', FAST, async ({ member }) => {
  const c = await member();
  c.send({ t: 'setDJ', on: true });
  await c.waitFor(refused('needSong'));
  await sleep(300);
  assert.deepEqual(c.latestState().djQueue, []);
});

scenario('the first DJ plays right away and the room learns the title from the lookup', FAST, async ({ member, server }) => {
  const dj = await member({ name: 'DJ', list: [song(ids.ok(1))] });
  const listener = await member({ name: 'L' });
  dj.send({ t: 'setDJ', on: true });

  const state = await listener.state(playing(dj.id));
  assert.equal(state.current.videoId, ids.ok(1));
  assert.match(state.current.playId, /^[0-9a-f-]{36}$/);
  assert.ok(state.current.elapsed >= 0 && state.current.elapsed < 2000);
  assert.deepEqual(state.djQueue, [dj.id]);
  matches(state.current, { skip: { votes: 0, needed: 1, voters: [] }, likes: [], skipLock: 0 });

  const known = await listener.state(titled(ids.ok(1)));
  assert.equal(known.current.duration, null, 'no API key: the length is not known up front');
  assert.equal(server.fetchCalls().length, 1);
  assert.match(server.fetchCalls()[0], /youtube\.com\/oembed/);
});

scenario("playing a song moves it to the bottom of the DJ's list", FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1)), song(ids.ok(2))] });
  await dj.waitFor('list'); // the restored list
  dj.send({ t: 'setDJ', on: true });
  const { list } = await dj.waitFor('list');
  assert.deepEqual(list.map((t) => t.videoId), [ids.ok(2), ids.ok(1)]);
});

scenario('a second DJ waits in the queue and plays once the first skips', FAST, async ({ member }) => {
  const dj1 = await member({ list: [song(ids.ok(1))] });
  const dj2 = await member({ list: [song(ids.ok(2))] });
  dj1.send({ t: 'setDJ', on: true });
  await dj1.state(playing(dj1.id));
  dj2.send({ t: 'setDJ', on: true });
  const queued = await dj1.state((s) => s.djQueue.length === 2);
  assert.deepEqual(queued.djQueue, [dj1.id, dj2.id]);
  assert.equal(queued.current.djId, dj1.id);

  dj1.send({ t: 'skip' });
  matches(await dj1.waitFor('outcome'), { videoId: ids.ok(1), outcome: 'played' });
  const next = await dj2.state(playing(dj2.id));
  assert.equal(next.current.videoId, ids.ok(2));
  assert.deepEqual(next.djQueue, [dj2.id, dj1.id]);
});

scenario('the DJ cannot skip or leave during the first seconds of a song', { MIN_SKIP_SECONDS: 1 }, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  dj.send({ t: 'setDJ', on: true });
  const state = await dj.state(playing(dj.id));
  assert.ok(state.current.skipLock > 0 && state.current.skipLock <= 1000, `skipLock ${state.current.skipLock}`);
  const { playId } = state.current;

  dj.send({ t: 'skip' });
  await dj.waitFor(refused('skipLock'));
  dj.send({ t: 'setDJ', on: false });
  await dj.waitFor(refused('skipLock'));
  assert.equal(dj.latestState().current.playId, playId, 'still the same song');

  await sleep(1100);
  dj.send({ t: 'skip' });
  await dj.waitFor((m) => m.t === 'outcome' && m.videoId === ids.ok(1));
  const after = await dj.state((s) => s.current && s.current.playId !== playId);
  assert.equal(after.current.videoId, ids.ok(1), 'a one-song list plays again');
});

scenario('leaving the booth hands the song to the next DJ', FAST, async ({ member }) => {
  const dj1 = await member({ list: [song(ids.ok(1))] });
  const dj2 = await member({ list: [song(ids.ok(2))] });
  dj1.send({ t: 'setDJ', on: true });
  await dj1.state(playing(dj1.id)); // messages from two sockets have no order guarantee
  dj2.send({ t: 'setDJ', on: true });
  await dj1.state((s) => s.djQueue.length === 2);
  dj1.send({ t: 'setDJ', on: false });
  matches(await dj1.waitFor('outcome'), { outcome: 'played' });
  const next = await dj2.state(playing(dj2.id));
  assert.deepEqual(next.djQueue, [dj2.id]);
});

scenario('a DJ who disconnects ends their song', FAST, async ({ member }) => {
  const dj1 = await member({ list: [song(ids.ok(1))] });
  const dj2 = await member({ list: [song(ids.ok(2))] });
  const listener = await member();
  dj1.send({ t: 'setDJ', on: true });
  await listener.state(playing(dj1.id));
  dj2.send({ t: 'setDJ', on: true });
  await listener.state((s) => s.djQueue.length === 2);
  await dj1.terminate();
  const next = await listener.state(playing(dj2.id));
  assert.ok(!next.users.some((u) => u.id === dj1.id));
  assert.deepEqual(next.djQueue, [dj2.id]);
});

scenario('a DJ whose list runs out leaves the queue when the song ends', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  await dj.waitFor('list');
  dj.send({ t: 'setDJ', on: true });
  const { list } = await dj.waitFor('list');
  dj.send({ t: 'removeTrack', key: list[0].key });
  assert.deepEqual((await dj.waitFor('list')).list, []);
  dj.send({ t: 'skip' });
  await dj.waitFor(refused('listEmpty'));
  const state = await dj.state(idle);
  assert.deepEqual(state.djQueue, []);
});

scenario('the DJ queue is capped per IP', FAST, async ({ member }) => {
  const ip = '198.51.100.42';
  const djs = [];
  for (let i = 0; i <= LIMITS.MAX_DJS_PER_IP; i++) {
    djs.push(await member({ ip, list: [song(ids.ok(i + 1))] }));
  }
  const extra = djs.pop();
  for (const dj of djs) dj.send({ t: 'setDJ', on: true });
  await extra.state((s) => s.djQueue.length === LIMITS.MAX_DJS_PER_IP);
  extra.send({ t: 'setDJ', on: true });
  await extra.waitFor(refused('djsPerIp'));
  await sleep(200);
  assert.equal(extra.latestState().djQueue.length, LIMITS.MAX_DJS_PER_IP);
});

scenario('the DJ stands in the booth and cannot move', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  const listener = await member();
  dj.send({ t: 'setDJ', on: true });
  await listener.state(playing(dj.id));
  dj.send({ t: 'move', x: 0.1, y: 0.1 });
  await listener.none('moves', 400);
  listener.send({ t: 'move', x: 0.2, y: 0.2 });
  const { moves } = await dj.waitFor('moves');
  assert.deepEqual(moves, [[listener.id, 200, 200]]);
});

scenario('a song the lookup says is gone is skipped as failed and the next one plays', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.gone), song(ids.ok(1))] });
  dj.send({ t: 'setDJ', on: true });
  matches(await dj.waitFor('outcome'), { videoId: ids.gone, outcome: 'failed' });
  await dj.state(nowPlaying(ids.ok(1)));
});

scenario('a transient lookup failure leaves the song playing', FAST, async ({ member, server }) => {
  const dj = await member({ list: [song(ids.err)] });
  dj.send({ t: 'setDJ', on: true });
  await dj.state(playing(dj.id));
  await sleep(600);
  const state = dj.latestState();
  assert.equal(state.current.videoId, ids.err);
  assert.equal(state.current.title, ids.err, 'no title: the id stands in');
  assert.match(server.stderr, /Lookup for err00000001 failed/);
});

scenario('with an API key the song ends on its exact length', { ...FAST, YOUTUBE_API_KEY: 'test' }, async ({ member, server }) => {
  const two = ids.withDuration(2);
  const dj = await member({ list: [song(two), song(ids.ok(1))] });
  dj.send({ t: 'setDJ', on: true });
  const state = await dj.state((s) => s.current && s.current.duration === 2);
  assert.equal(state.current.videoId, two);
  const started = Date.now();
  const outcome = await dj.waitFor('outcome', { timeout: 6000 });
  const took = Date.now() - started;
  matches(outcome, { videoId: two, outcome: 'played' });
  assert.ok(took > 2000 && took < 5000, `ended after ${took} ms (2 s + 1.5 s grace expected)`);
  const next = await dj.state(nowPlaying(ids.ok(1)));
  assert.equal(next.current.duration, 600);
  assert.ok(server.fetchCalls().every((url) => url.includes('googleapis.com')));
});

scenario('MAX_TRACK_MINUTES caps every song', { ...FAST, MAX_TRACK_MINUTES: 0.05 }, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1)), song(ids.ok(2))] });
  dj.send({ t: 'setDJ', on: true });
  await dj.state(playing(dj.id));
  const started = Date.now();
  const outcome = await dj.waitFor('outcome', { timeout: 6000 });
  matches(outcome, { videoId: ids.ok(1), outcome: 'played' });
  assert.ok(Date.now() - started < 4000);
  await dj.state(nowPlaying(ids.ok(2)));
});

scenario('listeners can report a length, which only ever grows; a wrong playId is ignored', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  const listener = await member();
  dj.send({ t: 'setDJ', on: true });
  const { current: { playId } } = await listener.state(playing(dj.id));
  const duration = (s) => s.current && s.current.duration;

  listener.send({ t: 'duration', playId, seconds: 30 });
  await listener.state((s) => duration(s) === 30);
  listener.send({ t: 'duration', playId, seconds: 20 });
  await listener.none((m) => m.t === 'state' && duration(m) === 20, 400);
  listener.send({ t: 'duration', playId, seconds: 45 });
  await listener.state((s) => duration(s) === 45);
  listener.send({ t: 'duration', playId: 'bogus', seconds: 90 });
  await listener.none((m) => m.t === 'state' && duration(m) === 90, 400);
});

scenario("with an API length, listeners' reports are ignored", { ...FAST, YOUTUBE_API_KEY: 'test' }, async ({ member }) => {
  const dj = await member({ list: [song(ids.withDuration(90))] });
  const listener = await member();
  dj.send({ t: 'setDJ', on: true });
  const { current: { playId } } = await listener.state((s) => s.current && s.current.duration === 90);
  listener.send({ t: 'duration', playId, seconds: 300 });
  await listener.none((m) => m.t === 'state' && m.current && m.current.duration === 300, 400);
});

scenario("the song ends when more than half the room's IPs say it ended", FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  const l1 = await member();
  const l2 = await member();
  const l3 = await member();
  dj.send({ t: 'setDJ', on: true });
  const { current: { playId } } = await l1.state(playing(dj.id));

  l1.send({ t: 'ended', playId });
  l2.send({ t: 'ended', playId }); // 2 of 4 IPs: not more than half
  await dj.none('outcome', 400);
  l3.send({ t: 'ended', playId });
  matches(await dj.waitFor('outcome'), { outcome: 'played' });
});

scenario('several tabs from one IP count once toward that', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  const a1 = await member({ ip: '198.51.100.5' });
  const a2 = await member({ ip: '198.51.100.5' });
  dj.send({ t: 'setDJ', on: true });
  const { current: { playId } } = await a1.state(playing(dj.id));

  a1.send({ t: 'ended', playId });
  a2.send({ t: 'ended', playId }); // still 1 of 2 IPs
  await dj.none('outcome', 400);
  dj.send({ t: 'ended', playId });
  matches(await dj.waitFor('outcome'), { outcome: 'played' });
});

scenario('a video most of the room cannot play is skipped as failed', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  const l1 = await member();
  const l2 = await member();
  dj.send({ t: 'setDJ', on: true });
  const { current: { playId } } = await l1.state(playing(dj.id));
  l1.send({ t: 'trackError', playId, code: 150 });
  await dj.none('outcome', 400);
  l2.send({ t: 'trackError', playId, code: 150 });
  matches(await dj.waitFor('outcome'), { outcome: 'failed' });
});

scenario("a lookup that finishes late can't touch the next song", FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.slow), song(ids.ok(1))] });
  dj.send({ t: 'setDJ', on: true });
  await dj.state(nowPlaying(ids.slow));
  dj.send({ t: 'skip' });
  await dj.state(titled(ids.ok(1)));
  await sleep(600); // the slow lookup resolves at ~400 ms
  assert.equal(dj.latestState().current.title, titleOf(ids.ok(1)));
});

scenario('the room only ever shows titles this server looked up', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1), { title: 'Totally Legit Title' })] });
  dj.send({ t: 'setDJ', on: true });
  await dj.state(titled(ids.ok(1)));
  const shown = dj.inbox.filter((m) => m.t === 'state' && m.current).map((m) => m.current.title);
  assert.ok(!shown.includes('Totally Legit Title'), `saw ${JSON.stringify(shown)}`);
  assert.ok(shown.includes(ids.ok(1)) || shown.includes(titleOf(ids.ok(1))));
});
