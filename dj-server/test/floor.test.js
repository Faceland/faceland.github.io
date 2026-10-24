// The floor: moves, background tabs, protocol versions, and reactions.
'use strict';

const assert = require('node:assert/strict');
const { scenario, sleep, song, ids, LIMITS, matches } = require('./helpers/harness');

const FAST = { MIN_SKIP_SECONDS: 0 };
// Joining dirties the room, and a dirty room flushes as a full snapshot (which
// carries positions) rather than a `moves` message. Wait for that flush first.
const settled = (n) => (s) => s.users.length === n;
const moved = (id, x, y) => (m) => m.t === 'moves' && m.moves.some((mv) => Array.isArray(mv) && mv[0] === id && mv[1] === x && mv[2] === y);
const reacted = (id, kind) => (m) => m.t === 'reactions' && m.reactions.some((r) => r.id === id && r.kind === kind);
const nextTick = () => sleep(LIMITS.BROADCAST_INTERVAL_MS + 20);

scenario('moves are batched into compact triples for members who are looking', async ({ member, connect }) => {
  const a = await member();
  const b = await member();
  const s = await connect();
  await b.state(settled(2));
  a.send({ t: 'move', x: 0.25, y: 0.75 });
  const batch = await b.waitFor('moves');
  assert.deepEqual(batch.moves, [[a.id, 250, 750]]);
  await a.waitFor(moved(a.id, 250, 750), { label: 'own move echoed' });
  await s.none('moves', 300);

  // The position is in the next snapshot too, whatever triggers it.
  b.send({ t: 'setName', name: 'Trigger' });
  const state = await b.state((st) => st.users.some((u) => u.name === 'Trigger'));
  matches(state.users.find((u) => u.id === a.id), { x: 0.25, y: 0.75 });
});

scenario('positions are clamped to the floor and rounded to thousandths', async ({ member }) => {
  const a = await member();
  const b = await member();
  await b.state(settled(2));
  a.send({ t: 'move', x: 1.5, y: -0.2 });
  await b.waitFor(moved(a.id, 1000, 0));
  await nextTick();
  a.send({ t: 'move', x: 0.12345, y: 0.98765 });
  await b.waitFor(moved(a.id, 123, 988));
  await nextTick();
  a.send({ t: 'move', x: 'junk', y: null });
  await b.waitFor(moved(a.id, 0, 0));
});

scenario('only one move per interval counts', async ({ member }) => {
  const a = await member();
  const b = await member();
  await b.state(settled(2));
  a.send({ t: 'move', x: 0.1, y: 0.1 });
  a.send({ t: 'move', x: 0.2, y: 0.2 });
  const batch = await b.waitFor('moves');
  assert.deepEqual(batch.moves, [[a.id, 100, 100]]);
  await b.none(moved(a.id, 200, 200), 300);
});

scenario('a background tab gets no moves or reactions, and a fresh snapshot when it returns', async ({ member }) => {
  const a = await member();
  const b = await member();
  await b.state(settled(2));
  b.send({ t: 'visibility', hidden: true });
  await sleep(50);
  a.send({ t: 'move', x: 0.3, y: 0.3 });
  a.send({ t: 'react', kind: 'cheer' });
  await b.none((m) => m.t === 'moves' || m.t === 'reactions', 400);
  await a.waitFor(moved(a.id, 300, 300), { label: 'a still sees the floor' });

  let mark = b.mark();
  b.send({ t: 'visibility', hidden: false });
  const snapshot = await b.waitFor('state', { since: mark });
  assert.equal(snapshot.users.find((u) => u.id === a.id).x, 0.3);

  // Toggling again right away doesn't pull another snapshot.
  b.send({ t: 'visibility', hidden: true });
  mark = b.mark();
  b.send({ t: 'visibility', hidden: false });
  await b.none('state', 300);
});

scenario('pages on protocol 1 get moves as objects', async ({ member }) => {
  const a = await member();
  const old = await member({ v: null });
  await old.state(settled(2));
  a.send({ t: 'move', x: 0.25, y: 0.75 });
  const legacy = await old.waitFor('moves');
  matches(legacy.moves, [{ id: a.id, x: 0.25, y: 0.75 }]);
  await a.waitFor(moved(a.id, 250, 750));
});

scenario('a like hops once per interval, a cheer less often, and the DJ cannot react to their own song', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  const l1 = await member();
  const l2 = await member();
  dj.send({ t: 'setDJ', on: true });
  await l2.state((s) => s.current && s.current.djId === dj.id);
  const likes = (s) => s.current && s.current.likes;

  l1.send({ t: 'react', kind: 'like', on: true });
  const batch = await l2.waitFor('reactions');
  matches(batch.reactions, [{ id: l1.id, kind: 'like' }]);
  await l2.state((s) => likes(s).length === 1 && likes(s)[0] === l1.id);

  l1.send({ t: 'react', kind: 'like', on: false });
  await l2.state((s) => likes(s).length === 0);
  l1.send({ t: 'react', kind: 'like', on: true }); // counts again, but no second hop inside the interval
  await l2.state((s) => likes(s).length === 1);
  await l2.none('reactions', 300);

  l1.send({ t: 'react', kind: 'cheer' });
  await l2.waitFor(reacted(l1.id, 'cheer'));
  l1.send({ t: 'react', kind: 'cheer' });
  await l2.none('reactions', 300);

  dj.send({ t: 'react', kind: 'cheer' });
  dj.send({ t: 'react', kind: 'like', on: true });
  await l2.none('reactions', 300);
  assert.deepEqual(likes(l2.latestState()), [l1.id]);
});

scenario('cheering works without a song; liking does not', async ({ member }) => {
  const l1 = await member();
  const l2 = await member();
  l1.send({ t: 'react', kind: 'cheer' });
  await l2.waitFor(reacted(l1.id, 'cheer'));
  l1.send({ t: 'react', kind: 'like', on: true });
  await l2.none('reactions', 300);
  l1.send({ t: 'react', kind: 'wave' });
  await l2.none('reactions', 300);
});
