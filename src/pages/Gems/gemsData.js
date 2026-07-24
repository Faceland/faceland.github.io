// Curated FaceGems package catalog.
//
// WHY THIS IS STATIC: the storefront (shop.face.land) is a CraftingStore-hosted
// webstore on a DIFFERENT origin. The same-origin policy makes it impossible to
// read anything back out of a shop iframe (no CORS, no cooperating postMessage,
// document.domain is dead), so we cannot scrape prices/descriptions at runtime.
// Instead this data was captured from https://shop.face.land/category/336956 and
// is baked in here. Packages change rarely; re-run scripts/scrape-gems.js to
// refresh (see that file), or edit the array below by hand.
//
// The cart itself is still driven live through the iframe at checkout time — see
// GemCheckoutModal.js. Only the *display* data lives here.

export const SHOP_ORIGIN = 'https://shop.face.land';

// CraftingStore CDN path for this store's product images.
const IMG_BASE =
  'https://cdn.craftingstore.net/rPPmDHlLQ1/0c94e9d3960688abe2d4124bbf7fc97c/';

// baseGems = advertised base amount; the headline total already folds in the
// bonus (e.g. 1000 base +10% = 1,100 FaceGems). priceUSD is whole-dollar here
// but rendered with cents. `id` is the CraftingStore package id used to add to
// the basket via POST /checkout/{id}.
export const gemPackages = [
  { id: 932891, baseGems: 500, bonusPct: 0, priceUSD: 5, image: 'yxbizgkt75svfxbu1ha9.png' },
  { id: 932894, baseGems: 1000, bonusPct: 10, priceUSD: 10, image: '80zcgvkocxqzcqad57wl.png' },
  { id: 932897, baseGems: 2000, bonusPct: 15, priceUSD: 20, image: 'wwylqrz9ruawvcgohp7w.png' },
  { id: 932900, baseGems: 3500, bonusPct: 20, priceUSD: 35, image: '9w62xvqyx2gwo8dyocp7.png' },
  { id: 932903, baseGems: 5000, bonusPct: 25, priceUSD: 50, image: 'dwbpoj03uelwpttecvyu.png' },
  { id: 932906, baseGems: 10000, bonusPct: 30, priceUSD: 100, image: 'lr4ftao7n3kzykr1rbny.png' },
].map((p) => ({
  ...p,
  totalGems: Math.round(p.baseGems * (1 + p.bonusPct / 100)),
  image: IMG_BASE + p.image,
}));

const num = (n) => n.toLocaleString('en-US');

export const money = (usd) => `$${usd.toFixed(2)}`;
export const gemTitle = (pkg) => `${num(pkg.totalGems)} FaceGems`;
export const bonusLabel = (pkg) => (pkg.bonusPct > 0 ? `+${pkg.bonusPct}% Value!` : null);

// The rich "buy now" blurb shown in the Info modal. Rebuilt from data (rather
// than stored verbatim) so it stays in sync with the numbers above. Purple
// (#a855f7) and gold (#f2c314) match the site's FaceGem accent colors.
const accent = (t) => `<span style="color:#c084fc;font-weight:700">${t}</span>`;
export const descriptionHtml = (pkg) => {
  const amount =
    pkg.bonusPct > 0
      ? `${num(pkg.baseGems)} FaceGems (Plus an extra ${pkg.bonusPct}%)`
      : `${num(pkg.baseGems)} FaceGems`;
  return (
    `<p>Adds ${accent(amount)} to your account! ${accent('FaceGems')} can be used to buy ` +
    `various in-game cosmetics and global boosts!</p>` +
    `<p>Your first ${accent('FaceGem')} purchase comes with a bonus! When you first buy ` +
    `${accent('FaceGems')} (any package!) you gain the ` +
    `<span style="color:#f2c314;font-weight:700"><u>Contributor</u></span> rank, which gives ` +
    `you a snazzy color in-game, a cool discord role, and a global experience boost for ` +
    `everyone online when you're logged in!</p>` +
    `<p class="gemDisclaimer">NOTE: FACELAND/FACEGEMS ARE NOT AN OFFICIAL MINECRAFT PRODUCT. ` +
    `NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.</p>`
  );
};
