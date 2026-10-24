// Vote to skip and likes: who counts, how many are needed, and when it fires.
'use strict';

const assert = require('node:assert/strict');
const { scenario, sleep, song, ids, matches } = require('./helpers/harness');

const FAST = { MIN_SKIP_SECONDS: 0 };
const playing = (djId) => (s) => Boolean(s.current && s.current.djId === djId);
const skip = (s) => s.current && s.current.skip;

// A DJ with one song plus `n` listeners, each on their own IP.
async function room(member, n) {
  const dj = await member({ name: 'DJ', list: [song(ids.ok(1))] });
  const listeners = [];
  for (let i = 0; i < n; i++) listeners.push(await member({ name: `L${i + 1}` }));
  dj.send({ t: 'setDJ', on: true });
  const state = await dj.state(playing(dj.id));
  return { dj, listeners, playId: state.current.playId };
}

scenario('a vote to skip passes at half the room', FAST, async ({ member }) => {
  const { dj, listeners: [l1, l2], playId } = await room(member, 3); // 4 IPs: 2 votes
  l1.send({ t: 'voteSkip', on: true });
  const one = await l1.state((s) => skip(s) && skip(s).votes === 1);
  matches(one.current.skip, { votes: 1, needed: 2, voters: [l1.id] });
  await dj.none('outcome', 300);

  l2.send({ t: 'voteSkip', on: true });
  matches(await dj.waitFor('outcome'), { outcome: 'skipped' });
  const next = await l1.state((s) => s.current && s.current.playId !== playId);
  matches(next.current.skip, { votes: 0, needed: 2, voters: [] });
});

scenario('likes make a skip harder, and taking a like back can let a vote pass', FAST, async ({ member }) => {
  const { dj, listeners: [l1, l2, l3] } = await room(member, 3); // base: 2 votes
  l1.send({ t: 'react', kind: 'like', on: true });
  l2.send({ t: 'react', kind: 'like', on: true });
  const liked = await l3.state((s) => skip(s) && skip(s).needed === 3);
  assert.deepEqual(liked.current.likes, [l1.id, l2.id]);

  l3.send({ t: 'voteSkip', on: true });
  l1.send({ t: 'voteSkip', on: true });
  await l3.state((s) => skip(s) && skip(s).votes === 2);
  await dj.none('outcome', 300);

  l2.send({ t: 'react', kind: 'like', on: false });
  matches(await dj.waitFor('outcome'), { outcome: 'skipped' });
});

scenario('the DJ cannot vote on or like their own song', FAST, async ({ member }) => {
  const { dj, listeners: [l1] } = await room(member, 1);
  dj.send({ t: 'voteSkip', on: true });
  dj.send({ t: 'react', kind: 'like', on: true });
  await l1.none('reactions', 300);
  await dj.none('outcome', 300);
  matches(l1.latestState().current, { skip: { votes: 0 }, likes: [] });
});

scenario('several tabs from one IP get one vote', FAST, async ({ member }) => {
  const dj = await member({ list: [song(ids.ok(1))] });
  const a1 = await member({ ip: '198.51.100.1' });
  const a2 = await member({ ip: '198.51.100.1' });
  const b = await member({ ip: '198.51.100.2' });
  dj.send({ t: 'setDJ', on: true });
  await b.state(playing(dj.id)); // 3 IPs: 2 votes

  a1.send({ t: 'voteSkip', on: true });
  a2.send({ t: 'voteSkip', on: true });
  const state = await b.state((s) => skip(s) && skip(s).voters.length === 2);
  assert.equal(state.current.skip.votes, 1, 'two tabs, one vote');
  await dj.none('outcome', 300);
  b.send({ t: 'voteSkip', on: true });
  matches(await dj.waitFor('outcome'), { outcome: 'skipped' });
});

scenario('taking a vote back lowers the count', FAST, async ({ member }) => {
  const { listeners: [l1] } = await room(member, 3);
  l1.send({ t: 'voteSkip', on: true });
  await l1.state((s) => skip(s) && skip(s).votes === 1);
  l1.send({ t: 'voteSkip', on: false });
  const state = await l1.state((s) => skip(s) && skip(s).votes === 0);
  assert.deepEqual(state.current.skip.voters, []);
});

scenario('a vote that passes early skips when the lock opens', { MIN_SKIP_SECONDS: 1 }, async ({ member }) => {
  const { dj, listeners: [l1], playId } = await room(member, 1); // 2 IPs: 1 vote
  l1.send({ t: 'voteSkip', on: true });
  await l1.state((s) => skip(s) && skip(s).votes === 1 && skip(s).needed === 1);
  await sleep(400);
  assert.equal(l1.latestState().current.playId, playId, 'not yet: the song is under 1 s old');
  const outcome = await dj.waitFor('outcome', { timeout: 2000 });
  matches(outcome, { outcome: 'skipped' });
});

scenario('people idle for AFK_SECONDS stop counting toward the room', { ...FAST, AFK_SECONDS: 1 }, async ({ member }) => {
  const { dj, listeners: [l1] } = await room(member, 3); // 4 IPs while everyone is active
  await sleep(1200); // ...and now nobody is
  l1.send({ t: 'voteSkip', on: true }); // voting makes l1 active: the room is just them
  matches(await dj.waitFor('outcome'), { outcome: 'skipped' });
});

scenario('someone leaving can let a standing vote pass', FAST, async ({ member }) => {
  const { dj, listeners: [l1, l2] } = await room(member, 2); // 3 IPs: 2 votes
  l1.send({ t: 'voteSkip', on: true });
  await l1.state((s) => skip(s) && skip(s).votes === 1 && skip(s).needed === 2);
  await dj.none('outcome', 300);
  await l2.terminate(); // 2 IPs left: 1 vote is enough
  matches(await dj.waitFor('outcome'), { outcome: 'skipped' });
});
