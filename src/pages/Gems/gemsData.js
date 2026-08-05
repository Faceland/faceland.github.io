import snapshot from './shopSnapshot.json';

// FaceGems catalog + shop sidebar.
//
// Live data is fetched at runtime in shopFetch.js (through a CORS proxy, since
// shop.face.land sends no Access-Control-Allow-Origin and a cross-origin iframe
// can never be read). `staticShopData` below is the FALLBACK rendered until that
// resolves — and permanently if the proxy is down.
//
// The fallback is NOT hand-maintained: scripts/scrape-gems.js regenerates
// shopSnapshot.json from the live shop on every `prebuild`, so each deploy ships
// a current one. Its shape must stay identical to what shopFetch returns.

export const SHOP_ORIGIN = 'https://shop.face.land';
export const CATEGORY_URL = `${SHOP_ORIGIN}/category/336956`;

export const staticShopData = snapshot;

const num = (n) => n.toLocaleString('en-US');

export const money = (usd) => `$${usd.toFixed(2)}`;
export const gemTitle = (pkg) => `${num(pkg.totalGems)} FaceGems`;
// The leading "+" is rendered separately (see .gemPlus) so it can be nudged
// onto the optical centre — hence it is not part of this string.
export const bonusLabel = (pkg) => (pkg.bonusPct > 0 ? `${pkg.bonusPct}% Value!` : null);

// Bonuses at or above this get the unhinged badge on the store page (see
// GemPackageCard). A fixed threshold rather than "whichever package is highest"
// so a new top tier joins in instead of taking the effect away from the one
// below it — every package advertising 30%+ freaks out, however many there are.
export const INSANE_BONUS_PCT = 30;
export const isInsaneBonus = (pkg) => pkg.bonusPct >= INSANE_BONUS_PCT;

// Whole dollars only — no cents, no "USD". e.g. "$5", "$2,845".
export const dollars = (usd) => `$${Math.round(usd).toLocaleString('en-US')}`;

// The shop records only what was bought ("1x 2,300 FaceGems [+15% Value!]"), not
// the price — so match it back to the catalog by gem total. Falls back to the
// bare package name (no "1x", no bonus tag) when it isn't a package we know.
export const purchaseLabel = (entry, list = snapshot.packages) => {
  const pkg = list.find((p) => p.totalGems === entry.gems);
  return pkg ? dollars(pkg.priceUSD) : `${num(entry.gems)} FaceGems`;
};

// Built from the numbers rather than scraped, so it stays on-brand (and so no
// third-party HTML is ever injected into the page).
const accent = (t) => `<span style="color:#c084fc;font-weight:700">${t}</span>`;

// `pkg.disclaimer` is the one part of the blurb that ISN'T boilerplate we can
// regenerate — it's per-package prose typed into the shop, so it has to come
// back from the intake (see scrape-gems.js / shopFetch.js). It arrives as plain
// text and is escaped on the way in here, because the string this function
// returns is handed to dangerouslySetInnerHTML: the no-third-party-markup rule
// the rest of the shop pipeline follows applies to it too.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const descriptionHtml = (pkg) => {
  const amount =
    pkg.bonusPct > 0
      ? `${num(pkg.baseGems)} FaceGems (Plus an extra ${pkg.bonusPct}%)`
      : `${num(pkg.baseGems)} FaceGems`;
  const aside = pkg.disclaimer
    ? `<p class="gemPkgDisclaimer"><strong>DISCLAIMER:</strong> ` +
      `${escapeHtml(pkg.disclaimer)}</p>`
    : '';
  return (
    `<p>Adds ${accent(amount)} to your account! ${accent('FaceGems')} can be used to buy ` +
    `various in-game cosmetics and global boosts!</p>` +
    `<p>Your first ${accent('FaceGem')} purchase comes with a bonus! When you first buy ` +
    `${accent('FaceGems')} (any package!) you gain the ` +
    `<span style="color:#f2c314;font-weight:700"><u>Contributor</u></span> rank, which gives ` +
    `you a snazzy color in-game, a cool discord role, and a global experience boost for ` +
    `everyone online when you're logged in!</p>` +
    aside +
    `<p class="gemDisclaimer">NOTE: FACELAND/FACEGEMS ARE NOT AN OFFICIAL MINECRAFT PRODUCT. ` +
    `NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.</p>`
  );
};
