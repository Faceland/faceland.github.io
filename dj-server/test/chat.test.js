// Chat: relayed once to the people in the room, filtered, rate-limited, never stored.
'use strict';

const assert = require('node:assert/strict');
const { scenario, song, ids, LIMITS, refused } = require('./helpers/harness');
const { FACES } = require('../avatarParts');

const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);

const said = (id, text) => (m) => m.t === 'chat' && m.messages.some((x) => x.userId === id && x.text === text);

scenario('chat reaches everyone in the room with name and face, but not spectators', async ({ member, connect }) => {
  const a = await member({ name: 'Ann', emoji: FACES[2] });
  const b = await member({ name: 'Bob' });
  const s = await connect();
  a.send({ t: 'chat', text: 'hello room' });
  const batch = await b.waitFor('chat');
  assert.equal(batch.messages.length, 1);
  const line = batch.messages[0];
  assert.match(line.id, /^[0-9a-f]{8}$/);
  assert.equal(line.userId, a.id);
  assert.equal(line.name, 'Ann');
  assert.equal(line.emoji, FACES[2]);
  assert.equal(line.text, 'hello room');
  await a.waitFor(said(a.id, 'hello room'), { label: 'own line echoed' });
  await s.none('chat', 300);
});

scenario('late joiners do not see earlier messages', async ({ member }) => {
  const a = await member();
  a.send({ t: 'chat', text: 'before you arrived' });
  await a.waitFor('chat');
  const b = await member();
  await b.none('chat', 400);
});

scenario('a burst of messages goes through, then a wait notice under the chat box', async ({ member }) => {
  const a = await member();
  const b = await member();
  for (let i = 1; i <= LIMITS.CHAT_BURST; i++) a.send({ t: 'chat', text: `line ${i}` });
  await b.waitFor(said(a.id, `line ${LIMITS.CHAT_BURST}`));
  a.send({ t: 'chat', text: 'one more' });
  await a.waitFor(refused('chatRate', 'chat'));
  await b.none(said(a.id, 'one more'), 300);
});

scenario("links are blocked; the site's own are fine", async ({ member }) => {
  const a = await member();
  const b = await member();
  a.send({ t: 'chat', text: 'check bit.ly/abc' });
  await a.waitFor(refused('chatLink', 'chat'));
  a.send({ t: 'chat', text: 'see https://example.com/x' });
  await a.waitFor(refused('chatLink', 'chat'));
  a.send({ t: 'chat', text: 'meet me at face.land/dj' });
  await b.waitFor(said(a.id, 'meet me at face.land/dj'));
});

scenario('profanity is blocked, even spaced out', async ({ member }) => {
  const a = await member();
  a.send({ t: 'chat', text: 'well fuck' });
  await a.waitFor(refused('chatProfane', 'chat'));
  a.send({ t: 'chat', text: 'well f u c k' });
  await a.waitFor(refused('chatProfane', 'chat'));
});

scenario('repeating yourself within 30 seconds is refused', async ({ member }) => {
  const a = await member();
  a.send({ t: 'chat', text: 'same thing' });
  await a.waitFor(said(a.id, 'same thing'));
  a.send({ t: 'chat', text: 'same thing' });
  await a.waitFor(refused('chatRepeat', 'chat'));
});

scenario('runs of one character are spam', async ({ member }) => {
  const a = await member();
  a.send({ t: 'chat', text: 'aaaaaaaaaaaaaaaaaaaa' });
  await a.waitFor(refused('chatSpam', 'chat'));
});

scenario('messages are cleaned and cut to the max length', async ({ member }) => {
  const a = await member();
  const filler = 'abcdefghij'.repeat(LIMITS.MAX_CHAT_LENGTH / 10 + 10);
  a.send({ t: 'chat', text: `x${ZERO_WIDTH_SPACE}${filler}` });
  const { messages } = await a.waitFor('chat');
  assert.equal(messages[0].text.length, LIMITS.MAX_CHAT_LENGTH);
  assert.ok(messages[0].text.startsWith('xabcdefghij'));
  assert.ok(!messages[0].text.includes(ZERO_WIDTH_SPACE));
});

scenario('blank messages vanish silently but still count toward the limit', async ({ member }) => {
  const a = await member();
  const b = await member();
  a.send({ t: 'chat', text: '   ' });
  await a.none((m) => m.t === 'chat' || m.t === 'notice', 300);
  for (let i = 1; i < LIMITS.CHAT_BURST; i++) a.send({ t: 'chat', text: `real ${i}` });
  await b.waitFor(said(a.id, `real ${LIMITS.CHAT_BURST - 1}`));
  a.send({ t: 'chat', text: 'over the line' });
  await a.waitFor(refused('chatRate', 'chat'));
});

scenario('background tabs still get chat', async ({ member }) => {
  const a = await member();
  const b = await member();
  b.send({ t: 'visibility', hidden: true });
  a.send({ t: 'chat', text: 'psst' });
  await b.waitFor(said(a.id, 'psst'));
});

scenario('the DJ chats like anyone else', { MIN_SKIP_SECONDS: 0 }, async ({ member }) => {
  const dj = await member({ name: 'DJ', list: [song(ids.ok(1))] });
  const l = await member();
  dj.send({ t: 'setDJ', on: true });
  await l.state((s) => s.current && s.current.djId === dj.id);
  dj.send({ t: 'chat', text: 'this one goes out to you' });
  await l.waitFor(said(dj.id, 'this one goes out to you'));
});
