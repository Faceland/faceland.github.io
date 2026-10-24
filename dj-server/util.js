// Small helpers shared by the room and the YouTube lookups.

const crypto = require('crypto');

const VIDEO_ID = /^[\w-]{11}$/;

// Error whose message is safe to show the user who caused it. `permanent`
// means the video itself is unusable (not just YouTube being unreachable).
class UserError extends Error {
  constructor(message, { permanent = false } = {}) {
    super(message);
    this.permanent = permanent;
  }
}

// Text from users: compatibility-normalized so lookalike letters collapse,
// with control and invisible formatting characters (bidi overrides,
// zero-width spaces) removed, and cut by code point, not UTF-16 unit.
const clean = (value, max) =>
  Array.from(
    (typeof value === 'string' ? value : '')
      .normalize('NFKC')
      .replace(/[\p{Cc}\p{Cf}\p{Co}\p{Cs}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
    .slice(0, max)
    .join('')
    .trim();

const isVideoId = (value) => typeof value === 'string' && VIDEO_ID.test(value);

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

// Floor positions are 0..1; three decimals is finer than any screen needs and
// keeps every message that carries positions short.
const position = (value) => Math.round(clamp01(value) * 1000) / 1000;

const pick = (items) => items[Math.floor(Math.random() * items.length)];
// An accessory from the list, or none.
const part = (value, options) => (options.includes(value) ? value : null);

const newKey = () => crypto.randomUUID().slice(0, 8);

// Logs at most 10 warnings a minute, so a flood can't flood the journal too.
let warnWindowStart = 0;
let warnCount = 0;
function warn(message) {
  const now = Date.now();
  if (now - warnWindowStart > 60000) {
    warnWindowStart = now;
    warnCount = 0;
  }
  if (++warnCount <= 10) console.warn(message);
}

module.exports = {
  UserError,
  clean,
  isVideoId,
  position,
  pick,
  part,
  newKey,
  warn,
};
