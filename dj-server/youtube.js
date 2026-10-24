// Everything about YouTube: turning pasted links into video ids, looking
// videos up (Data API with a key, oEmbed without), and remembering the
// answers. Shared by every room: the caches and the lookup rate are about
// YouTube and the API quota, not about any one room.

const {
  YOUTUBE_API_KEY,
  MAX_TITLE,
  LOOKUPS_PER_SECOND,
  MAX_LOOKUPS_IN_FLIGHT,
  FAILED_LOOKUP_TTL_MS,
  MAX_CACHED_VIDEOS,
} = require('./config');
const { UserError, clean, isVideoId, warn } = require('./util');

const videoCache = new Map(); // videoId -> { title, duration }
const failedLookups = new Map(); // videoId -> { error, until }

const remember = (map, key, value) => {
  map.set(key, value);
  if (map.size > MAX_CACHED_VIDEOS) map.delete(map.keys().next().value);
};

// Metadata the server has already looked up for this video, or undefined.
const cachedVideo = (videoId) => videoCache.get(videoId);

function parseVideoId(input) {
  const text = clean(input, 500);
  if (isVideoId(text)) return text;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v');
    if (!id) {
      const match = url.pathname.match(
        /^\/(?:embed|shorts|live|v)\/([\w-]{11})/,
      );
      id = match && match[1];
    }
    if (!id && url.searchParams.get('list')) {
      throw new UserError(
        "Playlists aren't supported yet. Paste a link to a single video.",
      );
    }
  }
  return isVideoId(id) ? id : null;
}

// ISO 8601 durations as the Data API returns them, e.g. PT1H2M3S.
function parseIsoDuration(iso) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    iso || '',
  );
  if (!match) return null;
  const [d, h, m, s] = match.slice(1).map((part) => Number(part) || 0);
  return ((d * 24 + h) * 60 + m) * 60 + s || null;
}

const unreachable = () =>
  new UserError("Couldn't reach YouTube. Try again in a bit.");
const missing = () =>
  new UserError("That video doesn't exist or is private.", { permanent: true });
const notEmbeddable = () =>
  new UserError("That video's owner doesn't allow it on other sites.", {
    permanent: true,
  });

async function lookupWithApi(videoId) {
  const url =
    'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status' +
    `&id=${videoId}&key=${encodeURIComponent(YOUTUBE_API_KEY)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    warn(`Data API lookup failed (${res.status}): ${body}`);
    throw unreachable();
  }
  const item = ((await res.json()).items || [])[0];
  if (!item) throw missing();
  if (!item.status.embeddable) throw notEmbeddable();
  if (item.snippet.liveBroadcastContent !== 'none') {
    throw new UserError("Live streams can't be added.", { permanent: true });
  }
  return {
    title: item.snippet.title,
    duration: parseIsoDuration(item.contentDetails.duration),
  };
}

async function lookupWithOembed(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(
    `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`,
    { signal: AbortSignal.timeout(8000) },
  );
  // oEmbed refuses videos whose owner turned off embedding.
  if (res.status === 401 || res.status === 403) throw notEmbeddable();
  if (res.status === 400 || res.status === 404) throw missing();
  if (!res.ok) {
    warn(`oEmbed lookup failed (${res.status})`);
    throw unreachable();
  }
  return { title: (await res.json()).title, duration: null };
}

const lookupBucket = { tokens: LOOKUPS_PER_SECOND, at: Date.now() };
let lookupsInFlight = 0;

function takeLookupSlot() {
  const now = Date.now();
  lookupBucket.tokens = Math.min(
    LOOKUPS_PER_SECOND,
    lookupBucket.tokens + ((now - lookupBucket.at) / 1000) * LOOKUPS_PER_SECOND,
  );
  lookupBucket.at = now;
  if (lookupBucket.tokens < 1 || lookupsInFlight >= MAX_LOOKUPS_IN_FLIGHT) {
    return false;
  }
  lookupBucket.tokens -= 1;
  return true;
}

async function lookupVideo(videoId) {
  const cached = videoCache.get(videoId);
  if (cached) return cached;
  const failed = failedLookups.get(videoId);
  if (failed && failed.until > Date.now()) throw failed.error;
  if (!takeLookupSlot()) {
    throw new UserError('The room is busy. Try again in a moment.');
  }
  lookupsInFlight++;
  let meta;
  try {
    meta = await (YOUTUBE_API_KEY ? lookupWithApi : lookupWithOembed)(videoId);
  } catch (err) {
    if (!(err instanceof UserError)) {
      warn(`Lookup for ${videoId} failed: ${err.message}`);
      throw unreachable();
    }
    if (err.permanent) {
      remember(failedLookups, videoId, {
        error: err,
        until: Date.now() + FAILED_LOOKUP_TTL_MS,
      });
    }
    throw err;
  } finally {
    lookupsInFlight--;
  }
  meta.title = clean(meta.title, MAX_TITLE) || videoId;
  remember(videoCache, videoId, meta);
  return meta;
}

module.exports = { parseVideoId, lookupVideo, cachedVideo };
