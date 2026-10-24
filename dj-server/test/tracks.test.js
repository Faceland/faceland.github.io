// Song lists: adding by link, the YouTube lookup, and keeping the list in order.
'use strict';

const assert = require('node:assert/strict');
const { scenario, sleep, song, ids, titleOf, LIMITS, refused } = require('./helpers/harness');

const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);
const BEL = String.fromCodePoint(0x07);
const RTL_OVERRIDE = String.fromCodePoint(0x202e);

// The whole room shares a lookup budget per second (tested below), so tests
// that add many songs in a row space them out.
const LOOKUP_PACE_MS = Math.ceil(1000 / LIMITS.LOOKUPS_PER_SECOND) + 10;

const videoIds = (list) => list.map((t) => t.videoId);
const listOf = (n) => (m) => m.t === 'list' && m.list.length === n;

scenario('addTrack understands the usual YouTube link shapes', async ({ member, server }) => {
  const c = await member();
  await c.waitFor('list');
  const forms = [
    `https://www.youtube.com/watch?v=${ids.ok(1)}`,
    `https://youtu.be/${ids.ok(2)}`,
    `https://www.youtube.com/shorts/${ids.ok(3)}`,
    `https://www.youtube.com/embed/${ids.ok(4)}?autoplay=1`,
    `https://music.youtube.com/watch?v=${ids.ok(5)}&list=RDAMVM`,
    `https://m.youtube.com/watch?v=${ids.ok(6)}&t=42s`,
    `https://www.youtube-nocookie.com/embed/${ids.ok(7)}`,
    `youtube.com/watch?v=${ids.ok(8)}`,
    `  ${ids.ok(9)}  `,
    `https://www.youtube.com/live/${ids.ok(10)}`,
  ].slice(0, LIMITS.ADDS_PER_MINUTE);
  for (const [i, url] of forms.entries()) {
    await sleep(LOOKUP_PACE_MS);
    c.send({ t: 'addTrack', url });
    const { list } = await c.waitFor(listOf(i + 1), { label: `list after ${url}` });
    assert.equal(list[i].videoId, ids.ok(i + 1), url);
    assert.equal(list[i].title, titleOf(ids.ok(i + 1)));
    assert.equal(list[i].duration, null);
    assert.match(list[i].key, /^[0-9a-f]{8}$/);
  }
  assert.equal(server.fetchCalls().length, forms.length);
});

scenario('things that are not YouTube videos are refused', async ({ member, server }) => {
  const c = await member();
  const refuse = async (url, reason) => {
    c.send({ t: 'addTrack', url });
    await c.waitFor(refused(reason), { label: `${reason} for ${JSON.stringify(url)}` });
  };
  await refuse('https://vimeo.com/123456', 'notYoutube');
  await refuse('just some words', 'notYoutube');
  await refuse('', 'notYoutube');
  await refuse('https://www.youtube.com/playlist?list=PLabcdef', 'playlist');
  assert.equal(server.fetchCalls().length, 0, 'none of those reached YouTube');
});

scenario('a song cannot be added twice', async ({ member }) => {
  const c = await member();
  c.send({ t: 'addTrack', url: ids.ok(1) });
  await c.waitFor(listOf(1));
  c.send({ t: 'addTrack', url: `https://youtu.be/${ids.ok(1)}` });
  await c.waitFor(refused('duplicate'));
});

scenario('gone and unembeddable videos are refused, and the failure is remembered', async ({ member, server }) => {
  const c = await member();
  c.send({ t: 'addTrack', url: ids.gone });
  await c.waitFor(refused('gone'));
  c.send({ t: 'addTrack', url: ids.gone });
  await c.waitFor(refused('gone'));
  assert.equal(server.fetchCalls().length, 1, 'a permanent failure is cached');
  c.send({ t: 'addTrack', url: ids.noembed });
  await c.waitFor(refused('noEmbed'));
});

scenario('YouTube being unreachable is a soft failure that is retried', async ({ member, server }) => {
  const c = await member();
  c.send({ t: 'addTrack', url: ids.err });
  await c.waitFor(refused('unreachable'));
  c.send({ t: 'addTrack', url: ids.http5 });
  await c.waitFor(refused('unreachable'));
  c.send({ t: 'addTrack', url: ids.err });
  await c.waitFor(refused('unreachable'));
  assert.equal(server.fetchCalls().filter((u) => u.includes(ids.err)).length, 2, 'transient failures are not cached');
});

scenario('looked-up titles are cleaned and cut to the max length', async ({ member }) => {
  const c = await member();
  c.send({ t: 'addTrack', url: ids.ctrl });
  const { list } = await c.waitFor(listOf(1));
  const { title } = list[0];
  assert.equal(Array.from(title).length, LIMITS.MAX_TITLE);
  assert.ok(title.startsWith('Clean me x'), title.slice(0, 20));
  for (const bad of [ZERO_WIDTH_SPACE, BEL, RTL_OVERRIDE]) assert.ok(!title.includes(bad));
});

scenario('metadata is cached across people', async ({ member, server }) => {
  const a = await member();
  const b = await member();
  a.send({ t: 'addTrack', url: ids.ok(1) });
  await a.waitFor(listOf(1));
  b.send({ t: 'addTrack', url: ids.ok(1) });
  const { list } = await b.waitFor(listOf(1));
  assert.equal(list[0].title, titleOf(ids.ok(1)));
  assert.equal(server.fetchCalls().length, 1);
});

scenario('a list has a maximum size', async ({ member }) => {
  const c = await member({ list: Array.from({ length: LIMITS.MAX_LIST }, (_, i) => song(ids.ok(i + 1))) });
  await c.waitFor(listOf(LIMITS.MAX_LIST));
  c.send({ t: 'addTrack', url: ids.ok(LIMITS.MAX_LIST + 1) });
  await c.waitFor(refused('listFull'));
});

scenario('adds per minute are limited per person', async ({ member }) => {
  const c = await member();
  for (let i = 1; i <= LIMITS.ADDS_PER_MINUTE; i++) {
    await sleep(LOOKUP_PACE_MS);
    c.send({ t: 'addTrack', url: ids.ok(i) });
    await c.waitFor(listOf(i));
  }
  c.send({ t: 'addTrack', url: ids.ok(LIMITS.ADDS_PER_MINUTE + 1) });
  await c.waitFor(refused('addsRate'));
});

scenario('lookups per second are limited for the whole room', async ({ member, server }) => {
  const a = await member();
  const b = await member();
  const budget = LIMITS.LOOKUPS_PER_SECOND;
  const fromA = Math.ceil(budget / 2);
  const fromB = budget - fromA;
  for (let i = 1; i <= fromA; i++) {
    a.send({ t: 'addTrack', url: ids.ok(i) });
    await a.waitFor(listOf(i));
  }
  for (let i = 1; i <= fromB; i++) {
    b.send({ t: 'addTrack', url: ids.ok(50 + i) });
    await b.waitFor(listOf(i));
  }
  a.send({ t: 'addTrack', url: ids.ok(fromA + 1) });
  await a.waitFor(refused('busy'));
  assert.equal(server.fetchCalls().length, budget, 'the one over budget never reached YouTube');
  await sleep(1000);
  a.send({ t: 'addTrack', url: ids.ok(fromA + 1) });
  await a.waitFor(listOf(fromA + 1));
});

scenario('one lookup at a time per person', async ({ member }) => {
  const c = await member();
  c.send({ t: 'addTrack', url: ids.slow });
  c.send({ t: 'addTrack', url: ids.ok(1) });
  await c.waitFor(refused('stillAdding'));
  const { list } = await c.waitFor(listOf(1));
  assert.deepEqual(videoIds(list), [ids.slow]);
});

scenario('removeTrack and bumpTrack reorder your list', async ({ member }) => {
  const c = await member({ list: [song(ids.ok(1)), song(ids.ok(2)), song(ids.ok(3))] });
  const { list } = await c.waitFor('list');
  const keyOf = (videoId) => list.find((t) => t.videoId === videoId).key;

  c.send({ t: 'bumpTrack', key: keyOf(ids.ok(3)) });
  assert.deepEqual(videoIds((await c.waitFor('list')).list), [ids.ok(3), ids.ok(1), ids.ok(2)]);
  c.send({ t: 'removeTrack', key: keyOf(ids.ok(1)) });
  assert.deepEqual(videoIds((await c.waitFor('list')).list), [ids.ok(3), ids.ok(2)]);
  c.send({ t: 'bumpTrack', key: 'nope' });
  assert.deepEqual(videoIds((await c.waitFor('list')).list), [ids.ok(3), ids.ok(2)]);
  c.send({ t: 'removeTrack', key: 'nope' });
  assert.deepEqual(videoIds((await c.waitFor('list')).list), [ids.ok(3), ids.ok(2)]);
});

scenario('with an API key, live streams and unembeddable videos are refused and lengths are known', { YOUTUBE_API_KEY: 'k' }, async ({ member, server }) => {
  const c = await member();
  c.send({ t: 'addTrack', url: ids.live });
  await c.waitFor(refused('live'));
  c.send({ t: 'addTrack', url: ids.noembed });
  await c.waitFor(refused('noEmbed'));
  c.send({ t: 'addTrack', url: ids.gone });
  await c.waitFor(refused('gone'));
  c.send({ t: 'addTrack', url: ids.withDuration(90) });
  const { list } = await c.waitFor(listOf(1));
  assert.equal(list[0].duration, 90);
  assert.equal(list[0].title, titleOf(ids.withDuration(90)));
  assert.ok(server.fetchCalls().every((u) => u.startsWith('https://www.googleapis.com/youtube/v3/videos')));
  assert.ok(server.fetchCalls().every((u) => u.includes('key=k')));
});
