// Avatar anchor tool for the DJ room: measures where eyes and hats go on
// each system's emoji and writes src/pages/DJ/avatarAnchors.js. See
// README.md. Usage: node scripts/dj-avatars/tool.js <step>...
//   fetch     download every system's art for the faces and accessories
//   measure   detect anchors and signatures on it        -> work/auto.json
//   build     auto.json + overrides.json                 -> avatarAnchors.js
//   sheets    review sheets drawn by the site's own code -> work/sheets/
//   annotate=win11:🐮,apple:🎃   zoomed, gridded glyphs  -> work/sheets/
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', '..');
const DJ = path.join(ROOT, 'src', 'pages', 'DJ');
const WORK = path.join(__dirname, 'work');
const OVERRIDES = path.join(__dirname, 'overrides.json');

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
const ALL = [
  ...parts.FACES,
  ...parts.EYES.map((part) => part.emoji),
  ...parts.HATS.map((part) => part.emoji),
];

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
    const res = await fetch(
      `https://emojipedia.org/${encodeURIComponent(emoji)}`,
      {
        headers,
      },
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
    const res = await fetch(
      `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/${encodeURI(file)}`,
    );
    const out = refFile('win11color', emoji, 'svg');
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
  for (const [system, faces] of Object.entries(result.faces)) {
    const missed = Object.keys(faces).filter((emoji) => !faces[emoji]);
    if (missed.length)
      console.log(`${system}: no eyes found on ${missed.join(' ')}`);
  }
}

function build() {
  const auto = JSON.parse(
    fs.readFileSync(path.join(WORK, 'auto.json'), 'utf8'),
  );
  const overrides = JSON.parse(fs.readFileSync(OVERRIDES, 'utf8'));
  const round = (values) => values.map((v) => Math.round(v * 1000) / 1000);
  const pick = (kind, system, emoji) =>
    (overrides[kind][system] || {})[emoji] || auto[kind][system][emoji];
  const missing = [];
  const table = (kind, emojis) =>
    Object.fromEntries(
      Object.keys(SYSTEMS).map((system) => [
        system,
        Object.fromEntries(
          emojis.flatMap((emoji) => {
            const anchor = pick(kind, system, emoji);
            if (!anchor) missing.push(`${system} ${emoji}`);
            return anchor ? [[emoji, round(anchor)]] : [];
          }),
        ),
      ]),
    );
  const faces = table('faces', parts.FACES);
  const accessories = table('accessories', [
    ...parts.EYES.filter((part) => part.kind === 'glasses').map(
      (part) => part.emoji,
    ),
    ...parts.HATS.map((part) => part.emoji),
  ]);
  if (missing.length) {
    console.log(
      `No anchors (add them to overrides.json): ${missing.join(', ')}`,
    );
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
  const source = `// Generated by scripts/dj-avatars/tool.js: put fixes in
// scripts/dj-avatars/overrides.json and rebuild rather than editing here.
//
// Where accessories go on each system's emoji, as fractions of the glyph's
// ink box (0,0 its top left, 1,1 its bottom right; spacings and widths are
// fractions of its width). Keyed by emoji font: Apple (iOS, macOS), Google
// (Android, ChromeOS, Linux), Samsung, Windows 11, Windows 10 and Twemoji
// (Firefox on some systems).

// Faces: [eyes x, eyes y, eye spacing, hat x, hat y, head width]; the eyes
// point is the midpoint between the eyes, the hat point the top of the
// head above it.
export const FACE_ANCHORS = {
${rows(faces)}
};

// Glasses: [lenses' midpoint x, y, lens spacing]. Hats: [x, y, width]: the
// point that sits on the hat point, and the width that's sized to the head.
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

// Per system: every face in glasses and a hat, and a few faces in every
// accessory.
async function sheets() {
  const anchors = asScript(path.join(DJ, 'avatarAnchors.js'));
  const result = await inBrowser(
    async (urls, systems, anchors) => {
      // eslint-disable-next-line no-new-func
      const { FACE_ANCHORS, ACCESSORY_ANCHORS } = new Function(
        `${anchors}; return { FACE_ANCHORS, ACCESSORY_ANCHORS };`,
      )();
      const samples = ['😀', '😜', '🐶', '🐸', '🧑', '👩', '💁', '🐰'];
      const out = {};
      for (const system of systems) {
        const glyphOf = await loadGlyphs(urls[system]);
        const draw = (looks, cols) =>
          drawSheet(
            looks,
            glyphOf,
            FACE_ANCHORS[system],
            ACCESSORY_ANCHORS[system],
            cols,
          );
        out[`${system}-faces`] = draw(
          parts.FACES.map((emoji, i) => ({
            emoji,
            eyes: i % 2 ? '👓' : '🕶️',
            hat: i % 2 ? '👑' : '🎩',
          })),
          10,
        );
        out[`${system}-eyes`] = draw(
          samples.flatMap((emoji) =>
            parts.EYES.map((part) => ({ emoji, eyes: part.emoji })),
          ),
          parts.EYES.length,
        );
        out[`${system}-hats`] = draw(
          samples.flatMap((emoji) =>
            parts.HATS.map((part) => ({ emoji, hat: part.emoji })),
          ),
          parts.HATS.length,
        );
      }
      return out;
    },
    refUrls(),
    Object.keys(SYSTEMS),
    anchors,
  );
  for (const [name, url] of Object.entries(result)) {
    save(path.join(WORK, 'sheets', `${name}.png`), url);
  }
  console.log('Wrote work/sheets/');
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
  if (!steps.length)
    console.log('Steps: fetch measure build sheets annotate=system:emoji,...');
  fs.mkdirSync(WORK, { recursive: true });
  if (steps.includes('fetch')) await fetchRefs();
  if (steps.includes('measure')) await measure();
  if (steps.includes('build')) build();
  if (steps.includes('sheets')) await sheets();
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
