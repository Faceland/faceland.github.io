import { CATEGORY_URL } from './gemsData';

// Live shop data for /gems.
//
// The shop (shop.face.land) sends no Access-Control-Allow-Origin — verified,
// including with an Origin header — so the browser cannot read it directly, and
// a cross-origin iframe can never be read either (different host = different
// origin; same-site only buys us cookies). These public proxies re-serve the
// page WITH CORS so we can parse it client-side on every visit.
//
// SECURITY: this HTML arrives via a third party, so none of it is ever injected
// as markup. We read textContent and image URLs that are validated against a
// host allow-list; package descriptions are generated locally from the numbers.
// Any failure at any step returns null and the caller keeps the baked-in
// snapshot, so a dead proxy is invisible to visitors.

const PROXIES = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

const CACHE_KEY = 'faceland.shopData.v1';
const CACHE_TTL_MS = 5 * 60 * 1000;
const ALLOWED_IMG_HOSTS = ['cdn.craftingstore.net', 'crafthead.net'];

const safeImg = (src) => {
  if (!src) return null;
  try {
    const u = new URL(src, CATEGORY_URL);
    return u.protocol === 'https:' && ALLOWED_IMG_HOSTS.includes(u.hostname) ? u.href : null;
  } catch (e) {
    return null;
  }
};

// "2,845.00" -> 2845 ; "1,100" -> 1100
const num = (s) => Number(String(s || '').replace(/[^0-9.]/g, '')) || 0;
const grab = (text, re) => (text.match(re) || [])[1];

const fetchText = async (url, ms = 8000) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
};

const parsePackages = (doc) => {
  const out = [];
  doc.querySelectorAll('.item-wrapper').forEach((card) => {
    const target = card.querySelector('button[data-target^="#package"]')?.getAttribute('data-target');
    const id = Number(String(target || '').replace('#package', ''));
    const name = card.querySelector('.item-footer b')?.textContent?.trim() || '';
    const image = safeImg(card.querySelector('img.img-responsive')?.getAttribute('src'));
    const footer = card.querySelector('.item-footer')?.textContent || '';

    const priceUSD = num(grab(footer, /([\d,]+\.\d{2})/));
    const totalGems = num(grab(name, /([\d,]+)\s*FaceGems/i));
    const bonusPct = num(grab(name, /\+\s*(\d+)\s*%/));
    if (!id || !image || !priceUSD || !totalGems) return;

    out.push({
      id,
      image,
      priceUSD,
      totalGems,
      bonusPct,
      baseGems: bonusPct ? Math.round(totalGems / (1 + bonusPct / 100)) : totalGems,
    });
  });
  return out;
};

// Match the heading itself and walk up to its own panel — panels nest, so
// scanning `.panel` elements could match an outer wrapper and over-collect.
const panelByHeading = (doc, re) => {
  const heading = Array.from(doc.querySelectorAll('.panel-heading')).find((h) =>
    re.test(h.textContent || ''),
  );
  return heading ? heading.closest('.panel') : null;
};

const parseEntries = (panel) => {
  if (!panel) return [];
  return Array.from(panel.querySelectorAll('.text-center'))
    .map((el) => ({
      avatar: safeImg(el.querySelector('img')?.getAttribute('src')),
      name: el.querySelector('b')?.textContent?.trim() || '',
      text: el.textContent.replace(/\s+/g, ' ').trim(),
    }))
    .filter((e) => e.avatar && e.name);
};

export const fetchLiveShopData = async () => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (raw) {
      const { at, data } = JSON.parse(raw);
      if (data && Date.now() - at < CACHE_TTL_MS) return data;
    }
  } catch (e) {
    /* cache unavailable — just refetch */
  }

  let html = null;
  for (const proxy of PROXIES) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const text = await fetchText(proxy(CATEGORY_URL));
      if (text && text.includes('item-wrapper')) {
        html = text;
        break;
      }
    } catch (e) {
      /* try the next proxy */
    }
  }
  if (!html) return null;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const packages = parsePackages(doc);
  if (!packages.length) return null;

  const donor = parseEntries(panelByHeading(doc, /simp/i))[0] || null;
  const topDonor = donor
    ? { name: donor.name, avatar: donor.avatar, totalUSD: num(grab(donor.text, /([\d,]+\.\d{2})/)) }
    : null;

  const recentPurchases = parseEntries(panelByHeading(doc, /boyz/i))
    .map((e) => ({ name: e.name, avatar: e.avatar, gems: num(grab(e.text, /([\d,]+)\s*FaceGems/i)) }))
    .filter((e) => e.gems);

  const data = { packages, topDonor, recentPurchases };
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch (e) {
    /* storage full / disabled — fine */
  }
  return data;
};
