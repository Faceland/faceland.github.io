// Avatar anchor tool for the DJ room: measures where eyes and hats go on
// each system's emoji and writes src/pages/DJ/avatarAnchors.js. See
// README.md. Usage: node scripts/dj-avatars/tool.js <step>...
//   fetch     download each system's art for faces and accessories (new ones)
//   measure   detect anchors and signatures on it           -> work/auto.json
//   build     auto.json + tuning.json                       -> avatarAnchors.js
//   sheets    review sheets drawn by the site's own code    -> work/sheets/
//             (sheets=faces or sheets=🎩,👓 for just some; samples=🌵,🐞
//             to review on other faces, em=128 to zoom in)
//   annotate=win11:🐮,apple:🎃   zoomed, gridded glyphs     -> work/sheets/
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', '..');
const DJ = path.join(ROOT, 'src', 'pages', 'DJ');
const WORK = path.join(__dirname, 'work');
const TUNING = path.join(__dirname, 'tuning.json');

// System -> Emojipedia's name for it. Windows 10 has no current set there:
// it's drawn from this machine's Segoe UI Emoji, so measure on Windows 10.
const SYSTEMS = {
  apple: 'apple',
  google: 'google',
  samsung: 'samsung',
  win11: 'microsoft',
  twemoji: 'twitter',
  win10: null,
};
// Glyphs whose colour layout tells the systems apart (see avatarArt.js),
// with the Windows 11 gradient (COLRv1) versions' paths in Microsoft's
// fluentui-emoji repo: Windows 11 draws either style depending on the app.
const PROBES = {
  '😀': 'Grinning face/Color/grinning_face_color.svg',
  '🐶': 'Dog face/Color/dog_face_color.svg',
  '🧑': 'Person/Default/Color/person_color_default.svg',
};
// The faces every accessory is reviewed on.
const SAMPLE_FACES = [
  '😀',
  '😜',
  '💩',
  '🐶',
  '🐸',
  '🐰',
  '🧑',
  '👩',
  '💁',
  '🐞',
  '🐌',
  '🌵',
];

// The site's ES modules as plain scripts.
const asScript = (file) =>
  fs
    .readFileSync(file, 'utf8')
    .replace(/^import[\s\S]*?from '.*?';\n/gm, '')
    .replace(/^export const /gm, 'const ');

// eslint-disable-next-line no-new-func
const parts = new Function(
  `${asScript(path.join(DJ, 'avatarParts.js'))}; return { FACES, EYES, HATS };`,
)();
const ACCESSORIES = [...parts.EYES, ...parts.HATS];
const ALL = [...parts.FACES, ...ACCESSORIES.map((part) => part.emoji)];

const codepoints = (emoji) =>
  [...emoji].map((c) => c.codePointAt(0).toString(16)).join('-');
const refFile = (system, emoji, ext = 'png') =>
  path.join(WORK, 'refs', system, `${codepoints(emoji)}.${ext}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const save = (file, dataUrl) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
};

async function fetchRefs() {
  const headers = { 'User-Agent': 'Mozilla/5.0 (faceland avatar anchor tool)' };
  for (const emoji of ALL) {
    const have = Object.entries(SYSTEMS).every(
      ([system, vendor]) => !vendor || fs.existsSync(refFile(system, emoji)),
    );
    if (have) continue;
    const res = await fetch(
      `https://emojipedia.org/${encodeURIComponent(emoji)}`,
      { headers },
    );
    const html = await res.text();
    const latest = {};
    for (const [, vendor, version, file] of html.matchAll(
      /source\/([a-z-]+)\/(\d+)\/([a-z0-9-]+_[0-9a-f-]+\.png)/g,
    )) {
      if (!latest[vendor] || Number(version) > latest[vendor].version) {
        latest[vendor] = { version: Number(version), file };
      }
    }
    for (const [system, vendor] of Object.entries(SYSTEMS)) {
      if (!vendor) continue;
      const out = refFile(system, emoji);
      if (!latest[vendor]) {
        console.log(`${emoji} has no ${vendor} image on Emojipedia`);
        continue;
      }
      const { version, file } = latest[vendor];
      const image = await fetch(
        `https://em-content.zobj.net/source/${vendor}/${version}/${file}`,
        { headers },
      );
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(await image.arrayBuffer()));
    }
    console.log(emoji, 'fetched');
    await sleep(300);
  }
  for (const [emoji, file] of Object.entries(PROBES)) {
    const out = refFile('win11color', emoji, 'svg');
    if (fs.existsSync(out)) continue;
    const res = await fetch(
      `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURI(file)}`,
    );
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, await res.text());
  }
}

// Reference images as data URLs, per system (null: draw with the local font).
function refUrls() {
  const urls = {};
  for (const [system, vendor] of Object.entries(SYSTEMS)) {
    urls[system] = vendor
      ? Object.fromEntries(
          ALL.map((emoji) => [
            emoji,
            `data:image/png;base64,${fs.readFileSync(refFile(system, emoji)).toString('base64')}`,
          ]),
        )
      : null;
  }
  urls.win11color = Object.fromEntries(
    Object.keys(PROBES).map((emoji) => {
      const svg = fs
        .readFileSync(refFile('win11color', emoji, 'svg'), 'utf8')
        .replace('width="32" height="32"', 'width="512" height="512"');
      return [
        emoji,
        `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      ];
    }),
  );
  return urls;
}

async function inBrowser(fn, ...args) {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    page.on('console', (message) => console.log('[page]', message.text()));
    page.on('pageerror', (error) => console.log('[page error]', error.message));
    await page.addScriptTag({
      content: [
        // avatarArt.js imports these; the tool passes anchors in itself.
        'const FACE_ANCHORS = {}, ACCESSORY_ANCHORS = {}, SIGNATURE_PROBES = [], SIGNATURES = {};',
        asScript(path.join(DJ, 'avatarParts.js')),
        asScript(path.join(DJ, 'avatarArt.js')),
        'window.parts = { FACES, EYES, HATS };',
        'window.art = { drawLook, inkBox, signature, GLYPH_PX, INK_ALPHA, ART_SIDE, ART_TOP, ART_BOTTOM };',
      ].join('\n'),
    });
    await page.addScriptTag({ path: path.join(__dirname, 'page.js') });
    return await page.evaluate(fn, ...args);
  } finally {
    await browser.close();
  }
}

async function measure() {
  const result = await inBrowser(
    async (urls, systems, probes) => {
      const hex = (values) =>
        values.map((v) => v.toString(16).padStart(2, '0')).join('');
      const out = { faces: {}, accessories: {}, signatures: {} };
      for (const system of systems.concat('win11color')) {
        const glyphOf = await loadGlyphs(urls[system]);
        out.signatures[system] = probes
          .map((emoji) => {
            const glyph = glyphOf(emoji);
            const { data, width } = pixels(glyph);
            return hex(art.signature(data, width, glyph.box));
          })
          .join('');
        if (system === 'win11color') continue;
        out.faces[system] = {};
        for (const emoji of parts.FACES) {
          out.faces[system][emoji] = faceAnchor(glyphOf(emoji));
        }
        out.accessories[system] = {};
        for (const part of parts.EYES) {
          if (part.kind === 'glasses') {
            out.accessories[system][part.emoji] = lensAnchor(
              glyphOf(part.emoji),
            );
          }
        }
        for (const part of parts.HATS) {
          out.accessories[system][part.emoji] = hatAnchor(glyphOf(part.emoji));
        }
      }
      return out;
    },
    refUrls(),
    Object.keys(SYSTEMS),
    Object.keys(PROBES),
  );
  fs.writeFileSync(
    path.join(WORK, 'auto.json'),
    JSON.stringify(result, null, 1),
  );
  const tuning = JSON.parse(fs.readFileSync(TUNING, 'utf8'));
  // Detections that can't be right (ear tips or a pattern taken for eyes,
  // a head with no width) are as bad as none.
  const implausible = ([, ey, spacing, , hy, width]) =>
    ey < 0.12 || ey <= hy || spacing > 0.6 || width < 0.15;
  for (const [system, faces] of Object.entries(result.faces)) {
    const untuned = Object.keys(faces).filter(
      (emoji) => !(tuning.faces[system] || {})[emoji],
    );
    const missed = untuned.filter((emoji) => !faces[emoji]);
    const odd = untuned.filter(
      (emoji) => faces[emoji] && implausible(faces[emoji]),
    );
    if (missed.length) {
      console.log(`${system}: no eyes found on ${missed.join(' ')}`);
    }
    if (odd.length) {
      console.log(`${system}: implausible anchors on ${odd.join(' ')}`);
    }
  }
}

const LAYERS = ['front', 'behind', 'split'];

// One accessory's placement on one system, [x, y, size, dx, dy, tilt,
// layer] (see avatarAnchors.js): measured where the tool can, then the
// "default" tuning, then the system's own. A glasses `fit` (lens spacing in
// eye spacings) becomes a size through the measured lens spacing.
function placement(part, system, measured, tuning) {
  const p = { x: 0.5, y: 0.5, size: 1, dx: 0, dy: 0, tilt: 0, layer: 'front' };
  if (measured) [p.x, p.y] = measured;
  for (const source of ['default', system]) {
    const tuned = (tuning.accessories[source] || {})[part.emoji] || {};
    if (tuned.fit !== undefined) p.size = tuned.fit / measured[2];
    for (const key of Object.keys(p)) {
      if (tuned[key] !== undefined) p[key] = tuned[key];
    }
  }
  const layer = LAYERS.indexOf(p.layer);
  if (layer < 0) throw new Error(`${part.emoji}: unknown layer ${p.layer}`);
  const values = [p.x, p.y, p.size, p.dx, p.dy, p.tilt];
  return layer ? values.concat(layer) : values;
}

function build() {
  const auto = JSON.parse(
    fs.readFileSync(path.join(WORK, 'auto.json'), 'utf8'),
  );
  const tuning = JSON.parse(fs.readFileSync(TUNING, 'utf8'));
  const round = (values) => values.map((v) => Math.round(v * 1000) / 1000);
  const missing = [];
  const faces = {};
  const accessories = {};
  for (const system of Object.keys(SYSTEMS)) {
    faces[system] = {};
    for (const emoji of parts.FACES) {
      const anchor =
        (tuning.faces[system] || {})[emoji] || auto.faces[system][emoji];
      if (anchor) faces[system][emoji] = round(anchor);
      else missing.push(`${system} ${emoji}`);
    }
    accessories[system] = {};
    for (const part of ACCESSORIES) {
      accessories[system][part.emoji] = round(
        placement(part, system, auto.accessories[system][part.emoji], tuning),
      );
    }
  }
  if (missing.length) {
    console.log(`No anchors (add them to tuning.json): ${missing.join(', ')}`);
  }
  const signatures = Object.fromEntries(
    Object.keys(SYSTEMS).map((system) => [
      system,
      system === 'win11'
        ? [auto.signatures.win11, auto.signatures.win11color]
        : [auto.signatures[system]],
    ]),
  );
  const rows = (obj) =>
    Object.entries(obj)
      .map(
        ([system, entries]) =>
          `  ${system}: {\n${Object.entries(entries)
            .map(([emoji, a]) => `    '${emoji}': [${a.join(', ')}],`)
            .join('\n')}\n  },`,
      )
      .join('\n');
  const source = `// Generated by scripts/dj-avatars/tool.js: tune in
// scripts/dj-avatars/tuning.json and rebuild rather than editing here.
//
// Where accessories go on each system's emoji, and how big. Points are
// fractions of a glyph's ink box (0,0 its top left, 1,1 its bottom right).
// Keyed by emoji font: Apple (iOS, macOS), Google (Android, ChromeOS,
// Linux), Samsung, Windows 11, Windows 10 and Twemoji (Firefox on some
// systems).

// Faces: [eyes x, eyes y, eye spacing, hat x, hat y, head width, eye tilt,
// head tilt]. The eyes point is midway between the eyes, the hat point the
// top of the head; spacing and width are fractions of the ink box's width;
// the tilts (degrees, clockwise, only when not 0) turn whatever's worn there.
export const FACE_ANCHORS = {
${rows(faces)}
};

// Accessories: [x, y, size, dx, dy, tilt, layer]. Point (x, y) of the
// accessory goes on the face's eyes point (eyes; a pair on each eye) or hat
// point (hats), moved by (dx, dy), and it's \`size\` wide. Eyes measure all
// three in eye spacings, hats in head widths. \`tilt\` turns it (degrees,
// clockwise; a pair's left one turns and moves the mirror way). \`layer\`,
// only when not 0: 1 draws it behind the face; 2 behind the face with the
// part above (x, y) again in front (a helmet's dome over the head, its
// chin strap behind the face).
export const ACCESSORY_ANCHORS = {
${rows(accessories)}
};

// Colour layouts of these glyphs on each system (see signature() in
// avatarArt.js), for telling the systems apart.
export const SIGNATURE_PROBES = [${Object.keys(PROBES)
    .map((emoji) => `'${emoji}'`)
    .join(', ')}];

// prettier-ignore
export const SIGNATURES = {
${Object.entries(signatures)
  .map(
    ([system, list]) =>
      `  ${system}: [\n${list.map((h) => `    '${h}',`).join('\n')}\n  ],`,
  )
  .join('\n')}
};
`;
  fs.writeFileSync(path.join(DJ, 'avatarAnchors.js'), source);
  console.log('Wrote src/pages/DJ/avatarAnchors.js');
}

// faces-<system>.png: every face in glasses and a hat. <accessory>.png: one
// accessory on the sample faces, a row per system, to compare and tune.
async function sheets(only, samples, em) {
  const anchors = asScript(path.join(DJ, 'avatarAnchors.js'));
  const wanted = only
    ? ACCESSORIES.filter((part) => only.includes(part.emoji))
    : ACCESSORIES;
  const result = await inBrowser(
    async (urls, systems, anchors, wanted, samples, withFaces, em) => {
      // eslint-disable-next-line no-new-func
      const { FACE_ANCHORS, ACCESSORY_ANCHORS } = new Function(
        `${anchors}; return { FACE_ANCHORS, ACCESSORY_ANCHORS };`,
      )();
      const out = {};
      const glyphSets = {};
      for (const system of systems) {
        glyphSets[system] = await loadGlyphs(urls[system]);
      }
      const row = (system, looks, label = system) => ({
        label,
        looks,
        glyphOf: glyphSets[system],
        faces: FACE_ANCHORS[system],
        accessories: ACCESSORY_ANCHORS[system],
      });
      if (withFaces) {
        for (const system of systems) {
          const looks = parts.FACES.map((emoji, i) => ({
            emoji,
            eyes: i % 2 ? '👓' : '🕶️',
            hat: i % 2 ? '👑' : '🎩',
          }));
          const rows = [];
          for (let i = 0; i < looks.length; i += 12) {
            rows.push(row(system, looks.slice(i, i + 12), i ? '' : system));
          }
          out[`faces-${system}`] = drawGrid(rows, em);
        }
      }
      for (const { emoji, kind } of wanted) {
        const slot = kind ? 'eyes' : 'hat';
        out[emoji] = drawGrid(
          systems.map((system) =>
            row(
              system,
              samples.map((face) => ({ emoji: face, [slot]: emoji })),
            ),
          ),
          em,
        );
      }
      return out;
    },
    refUrls(),
    Object.keys(SYSTEMS),
    anchors,
    wanted,
    samples,
    !only || only.includes('faces'),
    em,
  );
  for (const [name, url] of Object.entries(result)) {
    const file = name.startsWith('faces-') ? name : codepoints(name);
    save(path.join(WORK, 'sheets', `${file}.png`), url);
  }
  console.log(`Wrote ${Object.keys(result).length} sheets to work/sheets/`);
}

async function annotate(items) {
  const url = await inBrowser(
    async (urls, items) => {
      const sets = {};
      for (const [system] of items) {
        if (!sets[system]) sets[system] = await loadGlyphs(urls[system]);
      }
      return drawAnnotate(items, sets);
    },
    refUrls(),
    items,
  );
  save(path.join(WORK, 'sheets', 'annotate.png'), url);
  console.log('Wrote work/sheets/annotate.png');
}

(async () => {
  const steps = process.argv.slice(2);
  if (!steps.length) {
    console.log('Steps: fetch measure build sheets annotate=system:emoji,...');
  }
  fs.mkdirSync(WORK, { recursive: true });
  if (steps.includes('fetch')) await fetchRefs();
  if (steps.includes('measure')) await measure();
  if (steps.includes('build')) build();
  const sheet = steps.find((step) => /^sheets(=|$)/.test(step));
  const option = (name) => {
    const found = steps.find((step) => step.startsWith(`${name}=`));
    return found && found.slice(name.length + 1);
  };
  if (sheet) {
    await sheets(
      sheet.includes('=') ? sheet.slice(7).split(',') : null,
      option('samples') ? option('samples').split(',') : SAMPLE_FACES,
      Number(option('em')) || 64,
    );
  }
  const marked = steps.find((step) => step.startsWith('annotate='));
  if (marked) {
    await annotate(
      marked
        .slice('annotate='.length)
        .split(',')
        .map((item) => item.split(':')),
    );
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
