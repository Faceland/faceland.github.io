// Preloaded into the server under test (node --require) so it never talks to
// YouTube. Replaces global fetch with canned oEmbed / Data API answers keyed
// off the video ID, and logs every call to stderr so tests can count them.
//
//   ok000000001   normal video ("Title for <id>"; 600 s in API mode)
//   d090xxxxxxx   normal video whose API duration is 090 seconds
//   gone0000001   doesn't exist / private (oEmbed 404, API empty items)
//   noembed0001   owner disallows embedding (oEmbed 401, API embeddable=false)
//   live0000001   live stream (API only; oEmbed treats it as normal)
//   slow0000001   normal, but the lookup takes 400 ms
//   err00000001   network failure (fetch throws)
//   http5000001   YouTube returns 500
//   ctrl0000001   title full of control / invisible characters and too long
'use strict';

const LOG_PREFIX = '[stubFetch] ';
const SLOW_MS = 400;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  async text() {
    return typeof body === 'string' ? body : JSON.stringify(body);
  },
  async json() {
    return body;
  },
});

// Zero-width space, BEL, right-to-left override, then far too many x's.
const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);
const BEL = String.fromCodePoint(0x07);
const RTL_OVERRIDE = String.fromCodePoint(0x202e);
const MESSY_TITLE =
  'Clean' + ZERO_WIDTH_SPACE + ' me' + BEL + RTL_OVERRIDE + ' ' + 'x'.repeat(300);

const titleFor = (id) => (id.startsWith('ctrl') ? MESSY_TITLE : `Title for ${id}`);

const durationFor = (id) => {
  const match = /^d(\d{3})/.exec(id);
  return match ? Number(match[1]) : 600;
};

const iso = (seconds) => `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;

async function behave(id) {
  if (id.startsWith('slow')) await delay(SLOW_MS);
  if (id.startsWith('err')) throw new TypeError('fetch failed');
}

globalThis.fetch = async (input) => {
  const url = String(input);
  process.stderr.write(LOG_PREFIX + url + '\n');
  const parsed = new URL(url);

  if (parsed.hostname === 'www.youtube.com' && parsed.pathname === '/oembed') {
    const id = new URL(parsed.searchParams.get('url')).searchParams.get('v');
    await behave(id);
    if (id.startsWith('gone')) return response(404, 'Not Found');
    if (id.startsWith('noembed')) return response(401, 'Unauthorized');
    if (id.startsWith('http5')) return response(500, 'oops');
    return response(200, { title: titleFor(id) });
  }

  if (parsed.hostname === 'www.googleapis.com') {
    const id = parsed.searchParams.get('id');
    await behave(id);
    if (id.startsWith('http5')) return response(500, { error: 'oops' });
    if (id.startsWith('gone')) return response(200, { items: [] });
    return response(200, {
      items: [
        {
          snippet: {
            title: titleFor(id),
            liveBroadcastContent: id.startsWith('live') ? 'live' : 'none',
          },
          contentDetails: { duration: iso(durationFor(id)) },
          status: { embeddable: !id.startsWith('noembed') },
        },
      ],
    });
  }

  throw new Error('stubFetch: unexpected URL ' + url);
};
