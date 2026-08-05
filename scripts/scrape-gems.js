/**
 * Refreshes src/pages/Gems/shopSnapshot.json from the live CraftingStore page.
 *
 * This snapshot is the FALLBACK the /gems page renders before (and if) the
 * runtime CORS-proxy fetch in shopFetch.js succeeds. Running this on `prebuild`
 * means every deploy ships a current fallback instead of a hand-scraped one.
 *
 * FAIL-SOFT BY DESIGN: any network, parse, or validation problem logs a warning
 * and leaves the existing snapshot untouched, exiting 0 — a flaky shop or a
 * template change must never break the site build.
 *
 * Usage:
 *   node scripts/scrape-gems.js              # fetch live
 *   node scripts/scrape-gems.js ./page.html  # parse a local file (testing)
 */

const fs = require('fs');
const path = require('path');

const CATEGORY_URL = 'https://shop.face.land/category/336956';
const OUT = path.join(__dirname, '..', 'src', 'pages', 'Gems', 'shopSnapshot.json');
const TIMEOUT_MS = 15000;
const ALLOWED_IMG_HOSTS = ['cdn.craftingstore.net', 'crafthead.net'];

const num = (s) => Number(String(s || '').replace(/[^0-9.]/g, '')) || 0;

const safeImg = (src) => {
  try {
    const u = new URL(src, CATEGORY_URL);
    return u.protocol === 'https:' && ALLOWED_IMG_HOSTS.includes(u.hostname) ? u.href : null;
  } catch (e) {
    return null;
  }
};

async function fetchHtml() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CATEGORY_URL, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (faceland.github.io build)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};
const stripTags = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, (e) => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim();

// Every package's blurb is boilerplate that gemsData.js regenerates locally —
// with one exception: a package can carry its own "DISCLAIMER:" aside, which is
// prose nobody can derive from the numbers. Pull just that aside out of the
// package's modal, from the marker up to the standard NOTE that closes every
// blurb. Returns '' when a package has no aside of its own, which is the norm.
//
// Text only, never markup: this HTML is third-party, and the /gems pipeline
// never injects any of it (see the SECURITY note in shopFetch.js).
function parseDisclaimer(html, id) {
  const modal = html.match(
    new RegExp(`id="package${id}"[\\s\\S]*?<div class="modal-body">([\\s\\S]*?)<div class="modal-footer"`),
  );
  if (!modal) return '';
  const body = stripTags(modal[1]);
  const aside = body.match(/DISCLAIMER:\s*([\s\S]*?)(?=\s*NOTE:|$)/i);
  return aside ? aside[1].trim() : '';
}

// Each product card runs from `item-wrapper` through its Buy Now button, which
// carries the package id. Captures: image, name, price, id, and any per-package
// disclaimer from the matching modal.
function parsePackages(html) {
  const re =
    /item-wrapper[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<b>([^<]+)<\/b>[\s\S]*?([\d,]+\.\d{2})[\s\S]*?data-target="#package(\d+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, rawImg, name, rawPrice, rawId] = m;
    const image = safeImg(rawImg);
    const id = Number(rawId);
    const priceUSD = num(rawPrice);
    const totalGems = num((name.match(/([\d,]+)\s*FaceGems/i) || [])[1]);
    const bonusPct = num((name.match(/\+\s*(\d+)\s*%/) || [])[1]);
    if (!image || !id || !priceUSD || !totalGems) continue;
    out.push({
      id,
      baseGems: bonusPct ? Math.round(totalGems / (1 + bonusPct / 100)) : totalGems,
      bonusPct,
      priceUSD,
      image,
      totalGems,
      disclaimer: parseDisclaimer(html, id),
    });
  }
  return out;
}

// Slice the HTML from a sidebar heading to the next heading — that span is the
// panel's body.
function panelHtml(html, headingRe) {
  const headings = [...html.matchAll(/<div class="panel-heading">([^<]*)<\/div>/g)];
  const idx = headings.findIndex((h) => headingRe.test(h[1]));
  if (idx === -1) return null;
  const start = headings[idx].index;
  const end = idx + 1 < headings.length ? headings[idx + 1].index : html.length;
  return html.slice(start, end);
}

function parseEntries(section) {
  if (!section) return [];
  const re =
    /<img[^>]+src="(https:\/\/crafthead\.net\/avatar\/[^"]+)"[^>]*>[\s\S]{0,120}?<b>([^<]+)<\/b>\s*<br>\s*([^<]*)/g;
  const out = [];
  let m;
  while ((m = re.exec(section)) !== null) {
    const avatar = safeImg(m[1]);
    const name = m[2].trim();
    const line = m[3].replace(/\s+/g, ' ').trim();
    if (avatar && name) out.push({ avatar, name, line });
  }
  return out;
}

function build(html) {
  const packages = parsePackages(html);

  const donor = parseEntries(panelHtml(html, /simp/i))[0] || null;
  const topDonor = donor
    ? {
        name: donor.name,
        avatar: donor.avatar,
        totalUSD: num((donor.line.match(/([\d,]+\.\d{2})/) || [])[1]),
      }
    : null;

  const recentPurchases = parseEntries(panelHtml(html, /boyz/i))
    .map((e) => ({
      name: e.name,
      avatar: e.avatar,
      gems: num((e.line.match(/([\d,]+)\s*FaceGems/i) || [])[1]),
    }))
    .filter((e) => e.gems);

  return { packages, topDonor, recentPurchases };
}

// Compare against the snapshot on disk, ignoring the timestamp. Key order is
// stable because both objects come out of build()'s literal in the same order.
function isUnchanged(data) {
  try {
    const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    delete prev.scrapedAt;
    return JSON.stringify(prev) === JSON.stringify(data);
  } catch (e) {
    return false; // missing or corrupt — write a fresh one
  }
}

// Only overwrite a known-good snapshot with something that also looks good.
function validate(data) {
  if (!data.packages.length) return 'no packages parsed';
  const bad = data.packages.find((p) => !p.id || !p.priceUSD || !p.totalGems || !p.image);
  if (bad) return `incomplete package ${JSON.stringify(bad)}`;
  if (data.topDonor && !data.topDonor.totalUSD) return 'top donor has no total';
  return null;
}

(async () => {
  try {
    const localFile = process.argv[2];
    const html = localFile ? fs.readFileSync(localFile, 'utf8') : await fetchHtml();

    const data = build(html);
    const problem = validate(data);
    if (problem) {
      console.warn(`scrape-gems: keeping existing snapshot (${problem})`);
      return;
    }

    // Only rewrite when the shop data itself moved. scrapedAt changes on every
    // run, so without this the file would always look dirty to git and the
    // scheduled refresh in site.yml would redeploy the site on an empty diff.
    if (isUnchanged(data)) {
      console.log('scrape-gems: snapshot already current');
      return;
    }

    const json = { ...data, scrapedAt: new Date().toISOString() };
    fs.writeFileSync(OUT, `${JSON.stringify(json, null, 2)}\n`);
    console.log(
      `scrape-gems: wrote ${data.packages.length} packages, ` +
        `${data.recentPurchases.length} recent purchases` +
        `${data.topDonor ? `, top donor ${data.topDonor.name}` : ''}`,
    );
  } catch (err) {
    console.warn(`scrape-gems: keeping existing snapshot (${err.message})`);
  }
})();
