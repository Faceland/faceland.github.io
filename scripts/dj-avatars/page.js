/* eslint-disable no-unused-vars */
// Browser side of the avatar anchor tool (see README.md). Loaded as a plain
// script after the site's avatarParts.js and avatarArt.js, exposed as
// `parts` and `art`.

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

// One system's glyphs as the site's glyph() would draw them: a canvas
// (GLYPH_PX * 1.5 square) plus its ink box. `urls` maps emoji to reference
// images; without them (win10) the emoji are drawn with this machine's
// Segoe UI Emoji.
async function loadGlyphs(urls) {
  const size = art.GLYPH_PX * 1.5;
  const cache = new Map();
  const make = (draw) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d');
    g.imageSmoothingQuality = 'high';
    draw(g);
    const box = art.inkBox(g.getImageData(0, 0, size, size).data, size, size);
    return { canvas, box };
  };
  if (!urls) {
    return (emoji) => {
      if (!cache.has(emoji)) {
        cache.set(
          emoji,
          make((g) => {
            g.font = `${art.GLYPH_PX}px "Segoe UI Emoji"`;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(emoji, size / 2, size / 2);
          }),
        );
      }
      return cache.get(emoji);
    };
  }
  for (const [emoji, url] of Object.entries(urls)) {
    const image = await loadImage(url);
    const k = art.GLYPH_PX / Math.max(image.width, image.height);
    const w = image.width * k;
    const h = image.height * k;
    cache.set(
      emoji,
      make((g) => g.drawImage(image, (size - w) / 2, (size - h) / 2, w, h)),
    );
  }
  return (emoji) => cache.get(emoji);
}

const pixels = ({ canvas }) =>
  canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
const alphaAt = (img, x, y) =>
  img.data[(Math.round(y) * img.width + Math.round(x)) * 4 + 3];
const luminance = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

// Connected blobs of pixels passing `test(data, index)`, with their area and
// centroid.
function blobs(img, test) {
  const { width: W, height: H, data } = img;
  const label = new Int32Array(W * H).fill(-1);
  const found = [];
  const stack = [];
  for (let p = 0; p < W * H; p++) {
    if (label[p] !== -1 || !test(data, p * 4)) continue;
    const blob = { area: 0, sx: 0, sy: 0 };
    label[p] = found.length;
    stack.push(p);
    while (stack.length) {
      const q = stack.pop();
      const x = q % W;
      blob.area++;
      blob.sx += x;
      blob.sy += (q / W) | 0;
      for (const n of [q - 1, q + 1, q - W, q + W]) {
        if (n < 0 || n >= W * H || label[n] !== -1) continue;
        if (Math.abs((n % W) - x) > 1 || !test(data, n * 4)) continue;
        label[n] = found.length;
        stack.push(n);
      }
    }
    blob.cx = blob.sx / blob.area;
    blob.cy = blob.sy / blob.area;
    found.push(blob);
  }
  return found;
}

// The likeliest pair of eyes among dark blobs: similar size, level, a
// sensible distance apart, in the upper part of the face. Bigger and higher
// wins (so eyes beat eyebrows' and nostrils' smaller pairs, mostly).
function eyePair(found, box) {
  let best = null;
  for (let i = 0; i < found.length; i++) {
    for (let j = i + 1; j < found.length; j++) {
      const a = found[i];
      const b = found[j];
      const dx = Math.abs(a.cx - b.cx);
      const dy = Math.abs(a.cy - b.cy);
      if (dx < 0.12 * box.w || dx > 0.7 * box.w || dy > 0.15 * box.h) continue;
      const ratio = Math.max(a.area, b.area) / Math.min(a.area, b.area);
      if (ratio > 6) continue;
      const rel = ((a.cy + b.cy) / 2 - box.y) / box.h;
      if (rel < 0.06 || rel > 0.8) continue;
      const score =
        ((Math.sqrt(Math.min(a.area, b.area)) * (1 - dy / (0.15 * box.h))) /
          Math.sqrt(ratio)) *
        Math.sqrt(dx / box.w) *
        (1.3 - rel * 0.6);
      if (!best || score > best.score) {
        best = { score, pair: a.cx < b.cx ? [a, b] : [b, a] };
      }
    }
  }
  return best && best.pair;
}

// Median luminance of the solid ink mid-face: the face's own colour, so
// "dark" can be relative to it (a purple devil's eyes vs a yellow smiley's).
function faceLuminance(img, box) {
  const values = [];
  for (let y = Math.round(box.y + 0.2 * box.h); y < box.y + 0.6 * box.h; y++) {
    for (
      let x = Math.round(box.x + 0.25 * box.w);
      x < box.x + 0.75 * box.w;
      x++
    ) {
      const i = (y * img.width + x) * 4;
      if (img.data[i + 3] > 200) values.push(luminance(img.data, i));
    }
  }
  values.sort((a, b) => a - b);
  return values.length ? values[values.length >> 1] : 200;
}

// A face's anchors (see avatarAnchors.js), or null if no eyes were found.
function faceAnchor(glyph) {
  const img = pixels(glyph);
  const { box } = glyph;
  const dark = Math.max(35, Math.min(100, faceLuminance(img, box) * 0.5));
  const found = blobs(img, (d, i) => d[i + 3] > 200 && luminance(d, i) < dark);
  const area = box.w * box.h;
  let pair = null;
  // Huge eyes (aliens, skull sockets) only if nothing eye-sized pairs up.
  for (const max of [0.04, 0.12]) {
    pair = eyePair(
      found.filter((b) => b.area >= 0.0005 * area && b.area <= max * area),
      box,
    );
    if (pair) break;
  }
  if (!pair) return null;
  const [l, r] = pair;
  const mx = (l.cx + r.cx) / 2;
  const my = (l.cy + r.cy) / 2;
  const spacing = r.cx - l.cx;
  // Head width: the solid run along the eye line through the eyes.
  const solid = (x) => alphaAt(img, x, my) > 128;
  let left = Math.round(mx);
  let right = Math.round(mx);
  for (let gap = 0; left > 0 && gap < 3; left--)
    gap = solid(left - 1) ? 0 : gap + 1;
  for (let gap = 0; right < img.width - 1 && gap < 3; right++)
    gap = solid(right + 1) ? 0 : gap + 1;
  left += 3;
  right -= 3;
  // Head top: the median top over the columns between the eyes (ignores a
  // tuft, an antenna or the gap between ears).
  const tops = [];
  for (let x = Math.round(mx - 0.35 * spacing); x <= mx + 0.35 * spacing; x++) {
    for (let y = 0; y < my; y++) {
      if (alphaAt(img, x, y) > 128) {
        tops.push(y);
        break;
      }
    }
  }
  tops.sort((a, b) => a - b);
  const top = tops.length ? tops[tops.length >> 1] : box.y;
  const anchor = [
    (mx - box.x) / box.w,
    (my - box.y) / box.h,
    Math.hypot(r.cx - l.cx, r.cy - l.cy) / box.w,
    ((left + right) / 2 - box.x) / box.w,
    (top - box.y) / box.h,
    (right - left) / box.w,
  ];
  // Eyes at a clear slant (🤪, 🥴) tilt the eyewear to match.
  const tilt = (Math.atan2(r.cy - l.cy, r.cx - l.cx) * 180) / Math.PI;
  return Math.abs(tilt) >= 8 ? anchor.concat(Math.round(tilt)) : anchor;
}

// Glasses: the alpha-weighted centres of the left and right halves.
function lensAnchor(glyph) {
  const img = pixels(glyph);
  const { box } = glyph;
  const mid = box.x + box.w / 2;
  const sums = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const a = img.data[(y * img.width + x) * 4 + 3];
      if (a <= art.INK_ALPHA) continue;
      const sum = sums[x < mid ? 0 : 1];
      sum[0] += a;
      sum[1] += a * x;
      sum[2] += a * y;
    }
  }
  const [l, r] = sums.map(([a, sx, sy]) => [sx / a, sy / a]);
  return [
    ((l[0] + r[0]) / 2 - box.x) / box.w,
    ((l[1] + r[1]) / 2 - box.y) / box.h,
    (r[0] - l[0]) / box.w,
  ];
}

// Hats: the bottom of the hat's main body (the lowest row at least 45% as
// full as the fullest, so tassels, straps and dangling bows don't count),
// centred on the ink just above it.
function hatAnchor(glyph) {
  const img = pixels(glyph);
  const { box } = glyph;
  const solid = (x, y) => img.data[(y * img.width + x) * 4 + 3] > art.INK_ALPHA;
  const cover = [];
  for (let y = box.y; y < box.y + box.h; y++) {
    let n = 0;
    for (let x = box.x; x < box.x + box.w; x++) if (solid(x, y)) n++;
    cover.push(n);
  }
  const max = Math.max(...cover);
  let row = cover.length - 1;
  while (row > 0 && cover[row] < 0.45 * max) row--;
  let n = 0;
  let sx = 0;
  for (let y = Math.max(0, row - Math.round(0.1 * box.h)); y <= row; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      if (solid(x, box.y + y)) {
        n++;
        sx += x;
      }
    }
  }
  return [(sx / n - box.x) / box.w, (row + 1) / box.h, 1];
}

// Looks drawn through the site's own drawLook, a labelled row each:
// rows are [{ label, looks, glyphOf, faces, accessories }].
function drawGrid(rows, em = 64) {
  const label = 70;
  const cw = Math.round((1 + 2 * art.ART_SIDE) * em);
  const ch = Math.round((1 + art.ART_TOP + art.ART_BOTTOM) * em);
  const canvas = document.createElement('canvas');
  canvas.width = label + Math.max(...rows.map((row) => row.looks.length)) * cw;
  canvas.height = rows.length * ch;
  const g = canvas.getContext('2d');
  g.fillStyle = '#2a2633';
  g.fillRect(0, 0, canvas.width, canvas.height);
  rows.forEach((row, r) => {
    g.fillStyle = '#ffeb3b';
    g.font = 'bold 14px sans-serif';
    g.fillText(row.label, 8, r * ch + ch / 2);
    row.looks.forEach((look, i) => {
      const x = label + i * cw;
      const y = r * ch;
      g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      g.save();
      g.translate(x, y);
      g.beginPath();
      g.rect(0, 0, cw, ch);
      g.clip();
      art.drawLook(g, look, em, row.glyphOf, row.faces, row.accessories);
      g.restore();
    });
  });
  return canvas.toDataURL('image/png');
}

// Zoomed glyphs with a 0.1 grid over each ink box, for reading off anchors
// by eye. `items` is [[system, emoji], ...].
function drawAnnotate(items, glyphSets) {
  const cell = 320;
  const pad = 30;
  const cols = 4;
  const canvas = document.createElement('canvas');
  canvas.width = cols * cell;
  canvas.height = Math.ceil(items.length / cols) * cell;
  const g = canvas.getContext('2d');
  g.fillStyle = '#2a2633';
  g.fillRect(0, 0, canvas.width, canvas.height);
  items.forEach(([system, emoji], i) => {
    const { canvas: source, box } = glyphSets[system](emoji);
    const ox = (i % cols) * cell + pad;
    const oy = Math.floor(i / cols) * cell + pad;
    const k = (cell - 2 * pad) / Math.max(box.w, box.h);
    const w = box.w * k;
    const h = box.h * k;
    g.drawImage(source, box.x, box.y, box.w, box.h, ox, oy, w, h);
    g.font = '11px sans-serif';
    for (let t = 0; t <= 10; t++) {
      g.strokeStyle =
        t % 5 ? 'rgba(0, 255, 255, 0.35)' : 'rgba(255, 0, 255, 0.7)';
      g.beginPath();
      g.moveTo(ox + (w * t) / 10, oy);
      g.lineTo(ox + (w * t) / 10, oy + h);
      g.moveTo(ox, oy + (h * t) / 10);
      g.lineTo(ox + w, oy + (h * t) / 10);
      g.stroke();
      g.fillStyle = '#fff';
      g.fillText(String(t), ox + (w * t) / 10 - 3, oy - 6);
      g.fillText(String(t), ox - 18, oy + (h * t) / 10 + 4);
    }
    g.fillStyle = '#ffeb3b';
    g.font = 'bold 13px sans-serif';
    g.fillText(`${system} ${emoji}`, ox + w - 80, oy + h + 22);
  });
  return canvas.toDataURL('image/png');
}
