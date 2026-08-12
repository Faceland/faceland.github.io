/**
 * Publishes public/resource-packs/ to BOTH branches without triggering a build.
 *
 * Usage:
 *   node scripts/publish-resource-packs.js                 # publish current files
 *   node scripts/publish-resource-packs.js -m "new armor"  # with a note in the message
 *   node scripts/publish-resource-packs.js --dry-run       # show what would happen
 *
 * WHY THIS EXISTS
 * ---------------
 * The packs are plain hosted files — nothing in src/ links to them. But they
 * live in public/, so `yarn build` copies them into build/, and the deploy
 * force-pushes build/ over master. That makes develop the ONLY source of truth:
 * a pack edited directly on master is silently reverted by the next deploy
 * (which is exactly what happened to commits 4593733 / 37307fd / d9a6bed).
 *
 * So this script writes the same bytes to both places, develop first:
 *   - develop: public/resource-packs/  (source of truth, survives deploys)
 *   - master:  resource-packs/         (live now, instead of after the next build)
 *
 * NO BUILD IS TRIGGERED
 * ---------------------
 * The develop commit carries [skip ci], which GitHub honours on push events
 * (same trick as site.yml's snapshot commit); public/resource-packs is also in
 * the workflow's paths-ignore as a belt-and-braces backstop. Nothing at all
 * watches pushes to master, so the master commit costs a Pages publish and no
 * runner time.
 *
 * NO CONFLICTS
 * ------------
 * master is never checked out and never merged — merging it into develop would
 * delete src/. Instead the master commit is assembled with plumbing in a
 * throwaway index: read origin/master's tree, swap in the pack blobs, write a
 * commit parented on origin/master. Parented on the tip means the push is
 * always a fast-forward, and the blobs are byte-identical to develop's, so git
 * stores exactly one copy of each pack across both branches.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'public', 'resource-packs');
const SRC_PATH = 'public/resource-packs'; // as git spells it, on develop
const DEST_PATH = 'resource-packs'; //       as git spells it, on master
const SOURCE_BRANCH = 'develop';
const DEPLOY_BRANCH = 'master';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const noteIdx = Math.max(args.indexOf('-m'), args.indexOf('--message'));
const NOTE = noteIdx !== -1 ? args[noteIdx + 1] : null;

const git = (gitArgs, opts = {}) =>
  execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8', ...opts }).trim();

const die = (msg) => {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
};

const human = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// --- Preflight ---------------------------------------------------------------

// The develop commit lands on whatever branch is checked out, so refuse to run
// from anywhere else rather than scattering packs onto a feature branch.
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== SOURCE_BRANCH) {
  die(`On '${branch}'. Packs are authored on '${SOURCE_BRANCH}' — switch first.`);
}

if (!fs.existsSync(SRC_DIR)) die(`${SRC_PATH}/ does not exist.`);

const files = fs
  .readdirSync(SRC_DIR)
  .filter((name) => !name.startsWith('.') && fs.statSync(path.join(SRC_DIR, name)).isFile())
  .sort(); // sorted so an unchanged set always produces an identical tree

if (files.length === 0) die(`${SRC_PATH}/ is empty — refusing to publish a deletion.`);

console.log(`\n  Fetching ${SOURCE_BRANCH} and ${DEPLOY_BRANCH}…`);
git(['fetch', '--quiet', 'origin', SOURCE_BRANCH, DEPLOY_BRANCH]);

// A stale local develop would make the push a non-fast-forward. Catch it here,
// where the fix is one `git pull`, rather than after the commit exists.
const localHead = git(['rev-parse', 'HEAD']);
const remoteHead = git(['rev-parse', `origin/${SOURCE_BRANCH}`]);
if (localHead !== remoteHead) {
  const behind = git(['rev-list', '--count', `HEAD..origin/${SOURCE_BRANCH}`]);
  if (behind !== '0') {
    die(`Local ${SOURCE_BRANCH} is ${behind} commit(s) behind origin. Run: git pull`);
  }
}

// --- Hash the packs ----------------------------------------------------------

// Writes each file into the object store and returns its blob sha. Both the
// develop commit and the master commit reference these same objects.
console.log(`  Hashing ${files.length} pack(s)…`);
const blobs = files.map((name) => {
  const abs = path.join(SRC_DIR, name);
  const sha = git(['hash-object', '-w', '--', abs]);
  return { name, sha, size: fs.statSync(abs).size };
});

const total = blobs.reduce((sum, b) => sum + b.size, 0);
for (const b of blobs) console.log(`    ${b.sha.slice(0, 8)}  ${b.name}  (${human(b.size)})`);

// --- What actually changed? --------------------------------------------------

// Compare against each branch separately: a previous half-finished run can
// leave develop current while master is stale, and that must still be fixable.
const treeOf = (ref, subPath) => {
  try {
    return git(['ls-tree', '-r', `${ref}:${subPath}`]);
  } catch {
    return ''; // path absent on that branch — treat as "everything changed"
  }
};
const wanted = blobs.map((b) => `100644 blob ${b.sha}\t${b.name}`).join('\n');

const developStale = treeOf(`origin/${SOURCE_BRANCH}`, SRC_PATH) !== wanted;
const masterStale = treeOf(`origin/${DEPLOY_BRANCH}`, DEST_PATH) !== wanted;

if (!developStale && !masterStale) {
  console.log(`\n  ✓ Both branches already match these files. Nothing to do.\n`);
  process.exit(0);
}

const message = `chore(resource-packs): ${NOTE || 'update packs'} [skip ci]`;
console.log(`\n  Message: ${message}`);
console.log(`  ${SOURCE_BRANCH}: ${developStale ? 'needs update' : 'already current'}`);
console.log(`  ${DEPLOY_BRANCH}: ${masterStale ? 'needs update' : 'already current'}`);

if (DRY_RUN) {
  console.log(`\n  (--dry-run — nothing pushed)\n`);
  process.exit(0);
}

// --- 1. develop --------------------------------------------------------------

// develop goes first on purpose. If a scheduled deploy fires mid-run it will
// then build from the NEW packs, so the worst case is master briefly holding
// packs it is about to receive anyway — never the old ones coming back.
if (developStale) {
  console.log(`\n  → ${SOURCE_BRANCH}`);
  // `add` picks up new/deleted packs; the pathspec on `commit` keeps any
  // unrelated staged work out of this commit.
  git(['add', '-A', '--', SRC_PATH]);
  git(['commit', '--quiet', '-m', message, '--', SRC_PATH]);
  git(['push', '--quiet', 'origin', `HEAD:${SOURCE_BRANCH}`]);
  console.log(`    pushed ${git(['rev-parse', '--short', 'HEAD'])}`);
}

// --- 2. master ---------------------------------------------------------------

// Assembled in a temp index so the working tree is never touched and master is
// never checked out.
if (masterStale) {
  console.log(`\n  → ${DEPLOY_BRANCH}`);
  const indexFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'packs-')), 'index');
  const env = { ...process.env, GIT_INDEX_FILE: indexFile };

  try {
    const parent = git(['rev-parse', `origin/${DEPLOY_BRANCH}`]);
    git(['read-tree', parent], { env });
    // Drop the old directory wholesale so removed packs disappear too.
    git(['rm', '-r', '--cached', '--quiet', '--ignore-unmatch', '--', DEST_PATH], { env });
    for (const b of blobs) {
      git(['update-index', '--add', '--cacheinfo', `100644,${b.sha},${DEST_PATH}/${b.name}`], { env });
    }

    const tree = git(['write-tree'], { env });
    const commit = git(['commit-tree', tree, '-p', parent, '-m', message]);
    // Parented on the freshly fetched tip, so this is a fast-forward.
    git(['push', '--quiet', 'origin', `${commit}:refs/heads/${DEPLOY_BRANCH}`]);
    console.log(`    pushed ${commit.slice(0, 7)}`);
  } finally {
    fs.rmSync(path.dirname(indexFile), { recursive: true, force: true });
  }
}

console.log(`\n  ✓ Published ${human(total)} of packs. No build triggered.`);
console.log(`    https://github.com/Faceland/faceland.github.io/tree/develop/${SRC_PATH}`);
console.log(`    https://face.land/${DEST_PATH}/${blobs[0].name}\n`);
