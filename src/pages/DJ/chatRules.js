// Chat and name rules. The browser applies them for instant feedback and the
// server applies them again as the authority, so the two copies must agree:
// keep this file and src/pages/DJ/chatRules.js identical apart from their
// import/export lines.

import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';

export const MAX_CHAT_LENGTH = 200;
// Each pair is [messages, within milliseconds].
export const CHAT_RATE_LIMITS = [
  [3, 5000],
  [12, 60000],
];

const dataset = englishDataset.build();
const profanity = new RegExpMatcher({
  ...dataset,
  // Innocent words the stock list trips over.
  whitelistedTerms: [
    ...dataset.whitelistedTerms,
    'cockpit',
    'cockatoo',
    'cockroach',
    'peacock',
    'hancock',
    'pushit',
  ],
  ...englishRecommendedTransformers,
});

// TLDs that show up in real links and spam. Only a dot directly between a
// word and one of these counts ("bit.ly", "t.me"), so ordinary sentences
// like "so tired. me too" don't.
// prettier-ignore
const TLDS = [
  'com', 'net', 'org', 'gg', 'io', 'co', 'me', 'tv', 'ly', 'xyz', 'ru',
  'cn', 'info', 'biz', 'app', 'dev', 'site', 'online', 'shop', 'store',
  'top', 'club', 'link', 'click', 'pro', 'uk', 'de', 'fr', 'nl', 'eu',
  'ca', 'au', 'br', 'cc', 'ws', 'tk', 'ml', 'ga', 'cf', 'gq', 'land', 'gl',
  'es', 'pl', 'ch', 'jp', 'kr', 'sh', 'ai', 'ee', 'lol', 'wtf', 'bet',
  'vip', 'icu', 'cyou', 'buzz', 'tech', 'xxx', 'porn', 'sex', 'cam', 'to',
  'be', 'gd', 'su', 'im',
].join('|');

const LINK = new RegExp(
  [
    String.raw`\b(?:https?|ftp)\s*:\s*\/\/`,
    String.raw`\bwww\s*\.`,
    String.raw`\b[a-z0-9-]+\.(?:${TLDS})\b`,
    // Spelled-out dots: "example (dot) com", "example[dot]com".
    String.raw`\b[a-z0-9-]+\s*[([{]\s*dot\s*[)\]}]\s*(?:${TLDS})\b`,
    String.raw`\b\d{1,3}(?:\.\d{1,3}){3}\b`,
  ].join('|'),
  'i',
);

// The site's own links are fine to share.
const OWN_LINKS = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)*face\.land(?:\/\S*)?/gi;

// "f u c k", "f.u.c.k", "f-u-c-k" -> "fuck", so spacing can't dodge the list.
const SPACED_LETTERS = /\b(?:[a-z0-9][\s._*-]+){2,}[a-z0-9]\b/gi;

const normalize = (text) =>
  String(text)
    .normalize('NFKC')
    .replace(/[\p{Cc}\p{Cf}]/gu, '');

const isProfane = (text) =>
  profanity.hasMatch(text) ||
  profanity.hasMatch(
    text.replace(SPACED_LETTERS, (run) => run.replace(/[\s._*-]+/g, '')),
  );

const hasLink = (text) => LINK.test(text.replace(OWN_LINKS, ' '));

// Returns why a chat message can't be sent, or null if it's fine.
export function chatProblem(text) {
  const clean = normalize(text);
  if (hasLink(clean)) return "Links aren't allowed in chat.";
  if (isProfane(clean)) return 'Keep it clean: that has a word we block.';
  if (/(.)\1{12,}/u.test(clean)) return 'That looks like spam.';
  return null;
}

// Returns why a display name can't be used, or null if it's fine.
export function nameProblem(name) {
  const clean = normalize(name);
  if (hasLink(clean)) return "Names can't contain links.";
  if (isProfane(clean)) return "That name isn't allowed.";
  return null;
}

// How long until one more message fits every limit (0 = send now). `times`
// are earlier send times, oldest first. `slackMs` loosens the windows a
// little, so the server never rejects what the browser's own (identical)
// check allowed just because of network jitter.
export function rateLimitWait(times, now, slackMs = 0) {
  let wait = 0;
  for (const [count, windowMs] of CHAT_RATE_LIMITS) {
    const window = windowMs - slackMs;
    const recent = times.filter((at) => now - at < window);
    if (recent.length >= count) {
      wait = Math.max(wait, recent[recent.length - count] + window - now);
    }
  }
  return wait;
}
