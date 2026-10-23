import {
  ACCESSORY_ANCHORS,
  FACE_ANCHORS,
  SIGNATURE_PROBES,
  SIGNATURES,
} from './avatarAnchors';
import { EYES, HATS } from './avatarParts';

// An avatar is drawn into a single image per look: the face emoji, then its
// eyes and hat placed from per-system anchor points (every system draws
// its emoji differently, so a hat that sits right on Apple's 🐶 floats
// above Google's). Everything is measured on the viewer's own glyphs:
// anchors are fractions of a glyph's ink box (its non-transparent bounds),
// found here by drawing it to a canvas, so they hold whatever the glyph's
// size, padding or baseline.

const FONT_FAMILY =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
// Glyphs are drawn once at this size and scaled down from there.
export const GLYPH_PX = 160;
// Alpha above which a pixel counts as ink (the anchor tool uses the same).
export const INK_ALPHA = 48;
// Room around the face's 1em square for the hat (above) and anything wider
// than the face (sides), in em. The image is (1 + 2 * SIDE) x (1 + TOP +
// BOTTOM) em; the CSS pulls it back with matching negative margins, so it
// lays out exactly like the old 1em text emoji.
export const ART_SIDE = 0.4;
export const ART_TOP = 0.8;
export const ART_BOTTOM = 0.1;
// Pixels per em in the image: sharp at the largest avatar on a 2x screen.
const ART_PX = 128;

// Fallbacks for anything without anchors (avatarAnchors.js has the
// formats): a typical round face, and an accessory centered and a unit wide.
const DEFAULT_FACE = [0.5, 0.42, 0.34, 0.5, 0, 0.9];
const DEFAULT_PLACEMENT = [0.5, 0.5, 1, 0, 0, 0];
// Accessory layers (see avatarAnchors.js).
const BEHIND = 1;
const SPLIT = 2;
// Glasses are at most this many head widths across.
const MAX_GLASSES = 1.15;

const eyesByEmoji = Object.fromEntries(EYES.map((part) => [part.emoji, part]));
const hatsByEmoji = Object.fromEntries(HATS.map((part) => [part.emoji, part]));

export const inkBox = (data, width, height) => {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > INK_ALPHA) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return right < 0
    ? null
    : { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
};

// Some privacy modes blank or randomize canvas reads; then nothing can be
// measured and avatars fall back to typical proportions.
let readable = null;
const canReadPixels = () => {
  if (readable === null) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 2;
      const g = canvas.getContext('2d');
      g.fillStyle = '#ff0000';
      g.fillRect(0, 0, 1, 1);
      const d = g.getImageData(0, 0, 2, 2).data;
      readable = d[0] === 255 && d[1] === 0 && d[3] === 255 && d[15] === 0;
    } catch {
      readable = false;
    }
  }
  return readable;
};

const glyphs = new Map();

// The emoji drawn on its own canvas, with its ink box.
const glyph = (emoji) => {
  let entry = glyphs.get(emoji);
  if (!entry) {
    const size = GLYPH_PX * 1.5;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d');
    g.font = `${GLYPH_PX}px ${FONT_FAMILY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(emoji, size / 2, size / 2);
    const box = (canReadPixels() &&
      inkBox(g.getImageData(0, 0, size, size).data, size, size)) ||
      // Typical: a little under the font size, centered.
      {
        x: size / 2 - GLYPH_PX * 0.46,
        y: size / 2 - GLYPH_PX * 0.46,
        w: GLYPH_PX * 0.92,
        h: GLYPH_PX * 0.92,
      };
    entry = { canvas, box };
    glyphs.set(emoji, entry);
  }
  return entry;
};

// A coarse colour layout of a glyph: an N x N grid over its ink box, each
// cell's average colour (over black). Close enough across sizes that the
// nearest stored signature names the emoji font.
export const SIGNATURE_GRID = 6;
export const signature = (data, width, box) => {
  const n = SIGNATURE_GRID;
  const values = [];
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const x0 = Math.floor(box.x + (gx * box.w) / n);
      const x1 = Math.floor(box.x + ((gx + 1) * box.w) / n);
      const y0 = Math.floor(box.y + (gy * box.h) / n);
      const y1 = Math.floor(box.y + ((gy + 1) * box.h) / n);
      const sum = [0, 0, 0];
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          const alpha = data[i + 3] / 255;
          for (let c = 0; c < 3; c++) sum[c] += data[i + c] * alpha;
        }
      }
      const count = Math.max(1, (x1 - x0) * (y1 - y0));
      sum.forEach((total) => values.push(Math.round(total / count)));
    }
  }
  return values;
};

const unhex = (hex) =>
  Array.from({ length: hex.length / 2 }, (_, i) =>
    parseInt(hex.substr(i * 2, 2), 16),
  );

// Which system's emoji the viewer sees. The platform narrows it down; where
// it can't (Android makers, Windows 10 vs 11, Linux) the probe glyphs'
// colour layout is matched against each candidate's.
const detectVendor = () => {
  const ua = navigator.userAgent;
  let candidates = Object.keys(FACE_ANCHORS);
  if (/iPhone|iPad|iPod|Macintosh/.test(ua)) candidates = ['apple'];
  else if (/Android/.test(ua)) candidates = ['google', 'samsung'];
  else if (/Windows/.test(ua)) candidates = ['win11', 'win10', 'twemoji'];
  else if (/CrOS|Linux/.test(ua)) candidates = ['google', 'twemoji'];
  if (candidates.length === 1 || !canReadPixels()) return candidates[0];
  const seen = SIGNATURE_PROBES.flatMap((emoji) => {
    const { canvas, box } = glyph(emoji);
    const g = canvas.getContext('2d');
    return signature(
      g.getImageData(0, 0, canvas.width, canvas.height).data,
      canvas.width,
      box,
    );
  });
  let best = candidates[0];
  let bestDistance = Infinity;
  candidates.forEach((vendor) => {
    SIGNATURES[vendor].forEach((hex) => {
      const known = unhex(hex);
      const distance = seen.reduce((sum, v, i) => sum + (v - known[i]) ** 2, 0);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = vendor;
      }
    });
  });
  return best;
};

let vendor = null;
export const emojiVendor = () => {
  if (!vendor) vendor = detectVendor();
  return vendor;
};

// Draws `part` (a glyph) at `scale` image pixels per glyph pixel, with its
// point (px, py) (fractions of its ink box) on (x, y), turned `tilt`
// degrees about that point; `aboveOnly` draws just what's above the point.
const place = (g, part, [px, py], scale, x, y, tilt = 0, aboveOnly = false) => {
  const { canvas, box } = part;
  g.save();
  g.translate(x, y);
  if (tilt) g.rotate((tilt * Math.PI) / 180);
  if (aboveOnly) {
    const far = canvas.width * scale * 2;
    g.beginPath();
    g.rect(-far, -far, 2 * far, far);
    g.clip();
  }
  g.drawImage(
    canvas,
    -(box.x + px * box.w) * scale,
    -(box.y + py * box.h) * scale,
    canvas.width * scale,
    canvas.height * scale,
  );
  g.restore();
};

// Draws a look into `g` at `em` pixels per em (see ART_SIDE etc. for the
// layout). `glyphOf` gives each emoji's { canvas, box } and the anchor maps
// are one system's; the anchor tool draws its review sheets through here
// with every system's reference art.
export const drawLook = (g, look, em, glyphOf, faces, accessories) => {
  const face = glyphOf(look.emoji);
  const k = em / GLYPH_PX;
  // The face's ink box, centered on its em square.
  const w = face.box.w * k;
  const h = face.box.h * k;
  const x = (ART_SIDE + 0.5) * em - w / 2;
  const y = (ART_TOP + 0.5) * em - h / 2;
  const [ex, ey, es, hx, hy, hw, eyeTilt = 0, headTilt = 0] =
    faces[look.emoji] || DEFAULT_FACE;
  const spacing = es * w;
  const head = hw * w;

  // Puts an accessory on the spot (sx, sy) by this system's placement for
  // it: `unit` px per eye spacing or head width, the whole thing turned
  // `turn` degrees with the face. `behindFace` says which pass this is
  // (each accessory draws in its layer's: a split one in both). `side` -1
  // mirrors its offset and tilt (a pair's left one); `max` caps its width.
  const wear = (emoji, sx, sy, unit, turn, behindFace, side = 1, max = 1e9) => {
    const part = glyphOf(emoji);
    const [px, py, size, dx, dy, tilt, layer = 0] =
      accessories[emoji] || DEFAULT_PLACEMENT;
    if (behindFace ? !layer : layer === BEHIND) return;
    const r = (turn * Math.PI) / 180;
    const ox = side * dx * unit;
    const oy = dy * unit;
    place(
      g,
      part,
      [px, py],
      Math.min(size * unit, max) / part.box.w,
      sx + ox * Math.cos(r) - oy * Math.sin(r),
      sy + ox * Math.sin(r) + oy * Math.cos(r),
      turn + side * tilt,
      !behindFace && layer === SPLIT,
    );
  };

  const hat = hatsByEmoji[look.hat];
  const drawHat = (behindFace) =>
    hat && wear(hat.emoji, x + hx * w, y + hy * h, head, headTilt, behindFace);
  const eyes = eyesByEmoji[look.eyes];
  const drawEyes = (behindFace) => {
    if (!eyes) return;
    const mx = x + ex * w;
    const my = y + ey * h;
    if (eyes.kind === 'pair') {
      // One on each eye, along the (maybe slanted) eye line.
      const r = (eyeTilt * Math.PI) / 180;
      [-1, 1].forEach((side) =>
        wear(
          eyes.emoji,
          mx + (side * spacing * Math.cos(r)) / 2,
          my + (side * spacing * Math.sin(r)) / 2,
          spacing,
          eyeTilt,
          behindFace,
          side,
        ),
      );
    } else {
      // Never much wider than the head: wide-set eyes, like a frog's, would
      // otherwise get enormous glasses.
      const max = MAX_GLASSES * head;
      wear(eyes.emoji, mx, my, spacing, eyeTilt, behindFace, 1, max);
    }
  };

  // Whatever's worn behind the face (headphones, so only the band and the
  // cups' edges show), the face, then everything in front of it.
  drawHat(true);
  drawEyes(true);
  place(g, face, [0, 0], k, x, y);
  drawEyes(false);
  drawHat(false);
};

const images = new Map();

// The look as an image URL (cached), or null where canvas isn't available.
export const lookImage = (look) => {
  const key = `${look.emoji}|${look.eyes || ''}|${look.hat || ''}`;
  if (!images.has(key)) {
    let url = null;
    try {
      const system = emojiVendor();
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((1 + 2 * ART_SIDE) * ART_PX);
      canvas.height = Math.round((1 + ART_TOP + ART_BOTTOM) * ART_PX);
      const g = canvas.getContext('2d');
      g.imageSmoothingQuality = 'high';
      drawLook(
        g,
        look,
        ART_PX,
        glyph,
        FACE_ANCHORS[system] || {},
        ACCESSORY_ANCHORS[system] || {},
      );
      url = canvas.toDataURL('image/png');
    } catch {
      // No canvas: the plain emoji will do.
    }
    images.set(key, url);
  }
  return images.get(key);
};
