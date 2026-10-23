import { useEffect, useRef } from 'react';

// Ambient color: while a song plays, the room's purple (glows, borders,
// the floor and its lines) takes on the video's colors, all in this
// browser; the server isn't involved.
//
// The player is a cross-origin iframe, so its pixels can't be read. What
// can be: the video's thumbnail and three frames YouTube grabs from about
// 25%, 50% and 75% of the way through (small images on i.ytimg.com, which
// allows it). Each one's dominant hue becomes a color, and the room glides
// from one to the next as the song plays.
//
// Hues are picked and colors made in OKLCH: pixels count by how colorful
// they are (grays and near-black barely count), and every color is drawn
// at a lightness and chroma set per hue, near its most vivid, so orange
// stays orange instead of turning brown and nothing comes out gray. Mostly
// colorless images keep the purple.

// The images, and how far through the song each one shows.
const FRAMES = [
  { file: 'mqdefault.jpg', at: 0 },
  { file: 'mq1.jpg', at: 0.25 },
  { file: 'mq2.jpg', at: 0.5 },
  { file: 'mq3.jpg', at: 0.75 },
];
// How often the colors follow the song (cheap: no image work, just math).
const TICK_MS = 250;
// How quickly the shown colors chase the target (seconds to get ~63% there).
const EASE_S = 0.45;
// Opacity of the second color's glows at the top corners while a song plays.
const ACCENT_ALPHA = 0.24;
const CACHE_KEPT = 30;

// --- Color math (sRGB <-> OKLab / OKLCH) ---------------------------------------

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (c) =>
  255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const rgbToOklab = (r, g, b) => {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

// Linear sRGB of an OKLCH color (may be out of gamut).
const oklchToLinear = ([L, C, h]) => {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const inGamut = (lch) =>
  oklchToLinear(lch).every((v) => v >= -0.0001 && v <= 1.0001);

const oklchFromHex = (hex) => {
  const [L, a, b] = rgbToOklab(
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  );
  return [
    L,
    Math.hypot(a, b),
    ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  ];
};

// "r, g b" for rgba(var(...), alpha), chroma reduced until it fits sRGB.
const rgbTriplet = ([L, C, h]) => {
  let chroma = C;
  while (chroma > 0 && !inGamut([L, chroma, h])) chroma -= 0.005;
  return oklchToLinear([L, Math.max(0, chroma), h])
    .map((v) => Math.round(Math.min(255, Math.max(0, toSrgb(v)))))
    .join(', ');
};

// The most chroma sRGB has at this lightness and hue.
const maxChroma = (L, h) => {
  let low = 0;
  let high = 0.4;
  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2;
    if (inGamut([L, mid, h])) low = mid;
    else high = mid;
  }
  return low;
};

// A vivid, never muddy color of this hue for a dark room: drawn near the
// lightness where the hue is most colorful (so yellow and orange stay
// bright), kept between mid and fairly light.
const vivid = (h) => {
  let cuspL = 0.6;
  let best = 0;
  for (let L = 0.4; L <= 0.96; L += 0.02) {
    const c = maxChroma(L, h);
    if (c > best) {
      best = c;
      cuspL = L;
    }
  }
  const L = Math.min(0.84, Math.max(0.64, cuspL));
  return [L, Math.min(0.19, 0.92 * maxChroma(L, h)), h];
};

// --- Palettes --------------------------------------------------------------------

// The room's own colors (dj.scss), used with nothing playing.
const PURPLE = oklchFromHex('#8f5cff');
export const DEFAULT_PALETTE = {
  glow: PURPLE,
  accent: PURPLE,
  floorTop: oklchFromHex('#1d1530'),
  floorBottom: oklchFromHex('#0d0a12'),
  accentAlpha: 0,
};

// How much of the floor's tint a hue keeps: dark yellows and oranges are
// olive and brown, so near those (around 95 degrees) the floor's tint
// fades toward a plain dark.
const floorTint = (hue) => {
  const off = Math.abs(((hue - 95 + 540) % 360) - 180);
  return 1 - 0.65 * Math.exp(-((off / 40) ** 2));
};

// Colors for a hue: the glow, a second one (another strong hue in the
// image, else a near neighbour), and the floor's dark tints of the glow.
const paletteFor = (hue, hue2) => ({
  glow: vivid(hue),
  accent: vivid(hue2),
  floorTop: [0.21, 0.05 * floorTint(hue), hue],
  floorBottom: [0.135, 0.022 * floorTint(hue), hue],
  accentAlpha: ACCENT_ALPHA,
});

const HUE_BINS = 36;
const SAMPLE_W = 48;
const SAMPLE_H = 27;

// The image's palette, or null if it's mostly colorless.
export const paletteOf = (image) => {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_W;
  canvas.height = SAMPLE_H;
  const g = canvas.getContext('2d');
  g.drawImage(image, 0, 0, SAMPLE_W, SAMPLE_H);
  const { data } = g.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
  const weight = new Float64Array(HUE_BINS);
  const sumA = new Float64Array(HUE_BINS);
  const sumB = new Float64Array(HUE_BINS);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [L, a, b] = rgbToOklab(data[i], data[i + 1], data[i + 2]);
    const chroma = Math.hypot(a, b);
    // Near-black (letterboxing, shadows), near-white and near-gray pixels
    // say little about the image's color.
    if (L < 0.12 || L > 0.97 || chroma < 0.02) continue;
    const hue = (Math.atan2(b, a) / (2 * Math.PI) + 1) % 1;
    const bin = Math.floor(hue * HUE_BINS) % HUE_BINS;
    weight[bin] += chroma;
    sumA[bin] += a * chroma;
    sumB[bin] += b * chroma;
    total += chroma;
  }
  if (total / (SAMPLE_W * SAMPLE_H) < 0.003) return null;
  // Smooth around the circle, so a hue split across two bins still wins.
  const smooth = Array.from({ length: HUE_BINS }, (_, i) =>
    [-2, -1, 0, 1, 2].reduce(
      (sum, d, k) =>
        sum + weight[(i + d + HUE_BINS) % HUE_BINS] * [1, 2, 3, 2, 1][k],
      0,
    ),
  );
  const hueNear = (bin) => {
    let a = 0;
    let b = 0;
    for (let d = -2; d <= 2; d++) {
      const j = (bin + d + HUE_BINS) % HUE_BINS;
      a += sumA[j];
      b += sumB[j];
    }
    return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  };
  const peak = smooth.indexOf(Math.max(...smooth));
  const away = (i) => {
    const d = Math.abs(i - peak) % HUE_BINS;
    return Math.min(d, HUE_BINS - d);
  };
  let second = -1;
  smooth.forEach((value, i) => {
    if (away(i) >= 6 && value > 0.3 * smooth[peak]) {
      if (second < 0 || value > smooth[second]) second = i;
    }
  });
  const hue = hueNear(peak);
  return paletteFor(hue, second >= 0 ? hueNear(second) : (hue + 35) % 360);
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

// videoId -> Promise of [{ at, palette }] (a missing frame is left out; a
// colorless one is purple).
const cache = new Map();

const framesOf = (videoId) => {
  if (!cache.has(videoId)) {
    if (cache.size >= CACHE_KEPT) cache.delete(cache.keys().next().value);
    const loads = FRAMES.map(({ file, at }) =>
      loadImage(`https://i.ytimg.com/vi/${videoId}/${file}`)
        .then((image) => {
          // A frame YouTube doesn't have comes back as its small gray
          // placeholder instead of the size asked for.
          if (file !== FRAMES[0].file && image.naturalWidth < 300) return null;
          return { at, palette: paletteOf(image) || DEFAULT_PALETTE };
        })
        .catch(() => null),
    );
    cache.set(
      videoId,
      Promise.all(loads).then((frames) => frames.filter(Boolean)),
    );
  }
  return cache.get(videoId);
};

// --- Blending and applying --------------------------------------------------------

const mixLch = ([L1, C1, h1], [L2, C2, h2], t) => {
  const dh = ((h2 - h1 + 540) % 360) - 180; // the short way round
  return [L1 + (L2 - L1) * t, C1 + (C2 - C1) * t, (h1 + dh * t + 360) % 360];
};

const mix = (from, to, t) => ({
  glow: mixLch(from.glow, to.glow, t),
  accent: mixLch(from.accent, to.accent, t),
  floorTop: mixLch(from.floorTop, to.floorTop, t),
  floorBottom: mixLch(from.floorBottom, to.floorBottom, t),
  accentAlpha: from.accentAlpha + (to.accentAlpha - from.accentAlpha) * t,
});

// How far apart two palettes look (OKLab distance of the glows, plus the
// accent's fade).
const distance = (p, q) => {
  const lab = ([L, C, h]) => [
    L,
    C * Math.cos((h * Math.PI) / 180),
    C * Math.sin((h * Math.PI) / 180),
  ];
  const [a, b] = [lab(p.glow), lab(q.glow)];
  const [c, d] = [lab(p.accent), lab(q.accent)];
  return (
    Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) +
    Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]) +
    Math.abs(p.accentAlpha - q.accentAlpha)
  );
};

// Where the song is between its frames: the two frames either side, mixed
// by position. Before the length is known, the first frame.
const paletteAt = (frames, fraction) => {
  if (!(fraction >= 0)) return frames[0].palette;
  let before = frames[0];
  let after = null;
  frames.forEach((frame) => {
    if (frame.at <= fraction) before = frame;
    else if (!after) after = frame;
  });
  if (!after || after === before) return before.palette;
  return mix(
    before.palette,
    after.palette,
    (fraction - before.at) / (after.at - before.at),
  );
};

const PROPERTIES = {
  glow: '--dj-glow-rgb',
  accent: '--dj-glow2-rgb',
  floorTop: '--dj-floor-top-rgb',
  floorBottom: '--dj-floor-bottom-rgb',
};

// Keeps the room's colors on the playing video's (`current` from the room;
// null with nothing playing), as CSS variables on the page root.
export const useAmbientColors = (current) => {
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    const root = document.documentElement;
    const written = {};
    const write = (name, value) => {
      if (written[name] === value) return;
      written[name] = value;
      if (value === null) root.style.removeProperty(name);
      else root.style.setProperty(name, value);
    };
    const apply = (palette, settled) => {
      // Settled back on the defaults: hand back to the stylesheet's.
      const idle = settled && palette === DEFAULT_PALETTE;
      Object.entries(PROPERTIES).forEach(([key, name]) =>
        write(name, idle ? null : rgbTriplet(palette[key])),
      );
      write('--dj-glow2-alpha', idle ? null : palette.accentAlpha.toFixed(3));
    };

    let shown = DEFAULT_PALETTE;
    let frames = null;
    let framesFor = null;
    let raf = 0;
    let last = performance.now();
    let disposed = false;

    const target = () => {
      const song = currentRef.current;
      if (!song) return DEFAULT_PALETTE;
      if (framesFor !== song.videoId) {
        framesFor = song.videoId;
        frames = null;
        framesOf(song.videoId).then((loaded) => {
          if (!disposed && framesFor === song.videoId) frames = loaded;
        });
      }
      // Until the new song's frames arrive, stay put rather than flash.
      if (!frames) return null;
      if (!frames.length) return DEFAULT_PALETTE;
      const elapsed = (performance.now() - song.startPerf) / 1000;
      return paletteAt(frames, song.duration ? elapsed / song.duration : -1);
    };

    // Eases the shown colors toward the target. Small drifts (a song moving
    // between its frames) are followed by the timer; a jump (a new song)
    // animates every frame until it lands.
    const step = (now) => {
      raf = 0;
      const dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      const goal = target();
      if (!goal) return;
      const gap = distance(shown, goal);
      if (gap < 0.003) {
        shown = goal;
        apply(shown, true);
        return;
      }
      shown = mix(shown, goal, 1 - Math.exp(-dt / EASE_S));
      apply(shown, false);
      if (gap > 0.02) raf = requestAnimationFrame(step);
    };

    const timer = setInterval(() => {
      if (raf || document.hidden) return;
      step(performance.now());
    }, TICK_MS);

    return () => {
      disposed = true;
      clearInterval(timer);
      cancelAnimationFrame(raf);
      Object.values(PROPERTIES).forEach((name) =>
        root.style.removeProperty(name),
      );
      root.style.removeProperty('--dj-glow2-alpha');
    };
  }, []);
};
