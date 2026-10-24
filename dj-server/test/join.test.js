// Joining: hello, names, looks, and the list a browser restores.
'use strict';

const assert = require('node:assert/strict');
const { scenario, sleep, song, ids, LIMITS, refused } = require('./helpers/harness');
const { FACES, EYES, HATS } = require('../avatarParts');

const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);
const RTL_OVERRIDE = String.fromCodePoint(0x202e);
const FULLWIDTH_ADA = String.fromCodePoint(0xff21, 0xff44, 0xff41);

scenario('hello answers with a welcome, your list, then the room state', async ({ connect }) => {
  const c = await connect();
  await c.waitFor('state'); // the spectator snapshot
  const welcome = await c.join({ name: 'Pat', list: [song(ids.ok(1))] });
  assert.match(welcome.id, /^[0-9a-f]{8}$/);
  assert.equal(welcome.name, 'Pat');
  assert.ok(FACES.includes(welcome.emoji));
  assert.equal(welcome.eyes, null);
  assert.equal(welcome.hat, null);

  const { list } = await c.waitFor('list');
  assert.equal(list.length, 1);
  assert.equal(list[0].videoId, ids.ok(1));
  assert.equal(list[0].title, `Saved ${ids.ok(1)}`);
  assert.equal(list[0].duration, null);
  assert.match(list[0].key, /^[0-9a-f]{8}$/);

  const state = await c.state((s) => s.users.length === 1);
  const me = state.users[0];
  assert.equal(me.id, welcome.id);
  assert.equal(me.name, 'Pat');
  assert.equal(me.emoji, welcome.emoji);
  assert.ok(me.x >= 0 && me.x <= 1 && me.y >= 0 && me.y <= 1);
  assert.ok(!('eyes' in me) && !('hat' in me), 'accessories only appear when worn');
});

scenario('a missing or rule-breaking saved name becomes Guest', async ({ member }) => {
  assert.equal((await member()).name, 'Guest');
  assert.equal((await member({ name: '' })).name, 'Guest');
  assert.equal((await member({ name: 42 })).name, 'Guest');
  assert.equal((await member({ name: 'fuck' })).name, 'Guest');
  assert.equal((await member({ name: 'visit bit.ly' })).name, 'Guest');
});

scenario('names are normalized, stripped of invisible characters and cut to the max code points', async ({ member }) => {
  const messy = `${FULLWIDTH_ADA}${ZERO_WIDTH_SPACE}   Lovelace${RTL_OVERRIDE}${'x'.repeat(30)}`;
  const expected = Array.from(`Ada Lovelace${'x'.repeat(30)}`).slice(0, LIMITS.MAX_NAME).join('');
  assert.equal((await member({ name: messy })).name, expected);
  const emoji = await member({ name: '😀'.repeat(LIMITS.MAX_NAME + 5) });
  assert.equal(Array.from(emoji.name).length, LIMITS.MAX_NAME, 'cut by code point, not UTF-16 unit');
});

scenario('the face must be from the list; eyes and hat are optional and checked', async ({ member }) => {
  const dressed = await member({ emoji: FACES[3], eyes: EYES[0], hat: HATS[0] });
  assert.equal(dressed.welcome.emoji, FACES[3]);
  assert.equal(dressed.welcome.eyes, EYES[0]);
  assert.equal(dressed.welcome.hat, HATS[0]);
  const state = await dressed.state((s) => s.users.some((u) => u.id === dressed.id));
  const seen = state.users.find((u) => u.id === dressed.id);
  assert.equal(seen.eyes, EYES[0]);
  assert.equal(seen.hat, HATS[0]);

  const plain = await member({ emoji: 'nope', eyes: 'zzz', hat: 'yyy' });
  assert.ok(FACES.includes(plain.welcome.emoji), 'an unknown face gets a random real one');
  assert.equal(plain.welcome.eyes, null);
  assert.equal(plain.welcome.hat, null);
});

scenario('a restored list is type-checked, capped, with titles and lengths clamped', async ({ member }) => {
  const junk = [null, 'string', 7, { videoId: 'short' }, { videoId: 'has space!!' }, { videoId: 12345678901 }, { title: 'no id' }];
  const valid = Array.from({ length: LIMITS.MAX_LIST + 10 }, (_, i) =>
    song(ids.ok(i + 1), { title: 'T'.repeat(LIMITS.MAX_TITLE + 100), duration: 42.6 }),
  );
  valid[0].duration = 99999;
  valid[1].duration = -5;
  valid[2].duration = 'nope';
  const c = await member({ list: [...junk, ...valid] });
  const { list } = await c.waitFor('list');
  assert.equal(list.length, LIMITS.MAX_LIST);
  assert.ok(list.every((t) => /^ok\d{9}$/.test(t.videoId)), 'only well-formed video ids survive');
  assert.equal(list[0].duration, LIMITS.MAX_TRACK_SECONDS, 'capped at the longest allowed song');
  assert.equal(list[1].duration, null);
  assert.equal(list[2].duration, null);
  assert.equal(list[3].duration, 43);
  assert.equal(list[3].title.length, LIMITS.MAX_TITLE);
});

scenario('a second hello on the same connection is ignored', async ({ member }) => {
  const c = await member({ name: 'Once' });
  c.send({ t: 'hello', v: 2, name: 'Twice' });
  await c.none('welcome', 300);
  const state = await c.state((s) => s.users.length === 1);
  assert.equal(state.users[0].name, 'Once');
});

scenario('setName reaches everyone, and a second change too soon is refused', async ({ member }) => {
  const a = await member({ name: 'A' });
  const b = await member({ name: 'B' });
  a.send({ t: 'setName', name: 'Alpha' });
  await b.state((s) => s.users.some((u) => u.id === a.id && u.name === 'Alpha'));
  a.send({ t: 'setName', name: 'Again' });
  await a.waitFor(refused('nameRate'));
  await b.none((m) => m.t === 'state' && m.users.some((u) => u.name === 'Again'), 300);
});

scenario('setName refuses a rule-breaking name and resends the snapshot so the box snaps back', async ({ member }) => {
  const a = await member({ name: 'A' });
  let mark = a.mark();
  a.send({ t: 'setName', name: 'bit.ly scammer' });
  await a.waitFor(refused('nameLink'), { since: mark });
  const state = await a.waitFor('state', { since: mark });
  assert.equal(state.users.find((u) => u.id === a.id).name, 'A');

  const b = await member({ name: 'B' });
  mark = b.mark();
  b.send({ t: 'setName', name: 'fuck' });
  await b.waitFor(refused('nameBanned'), { since: mark });
  await b.waitFor('state', { since: mark });
  assert.equal(b.user().name, 'B');
});

scenario('setLook changes your avatar for everyone and ignores parts not in the lists', async ({ member }) => {
  const a = await member();
  const b = await member();
  const seenBy = (client) => client.latestState().users.find((u) => u.id === a.id);

  a.send({ t: 'setLook', emoji: FACES[5], eyes: EYES[1], hat: HATS[2] });
  await b.state((s) => s.users.some((u) => u.id === a.id && u.emoji === FACES[5]));
  assert.equal(seenBy(b).eyes, EYES[1]);
  assert.equal(seenBy(b).hat, HATS[2]);

  await sleep(LIMITS.LOOK_INTERVAL_MS + 100);
  a.send({ t: 'setLook', emoji: FACES[5], eyes: 'zzz', hat: 'yyy' });
  await b.state((s) => {
    const u = s.users.find((x) => x.id === a.id);
    return u && !('eyes' in u) && !('hat' in u);
  });

  await sleep(LIMITS.LOOK_INTERVAL_MS + 100);
  a.send({ t: 'setLook', emoji: 'nope', eyes: EYES[0] }); // unknown face: whole change dropped
  await b.none((m) => m.t === 'state' && m.users.some((u) => u.id === a.id && u.eyes === EYES[0]), 300);
  assert.equal(seenBy(b).emoji, FACES[5]);

  a.send({ t: 'setLook', emoji: FACES[6] }); // the dropped attempt still used the interval
  await a.waitFor(refused('lookRate'));
});
