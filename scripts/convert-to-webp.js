/**
 * Script to convert PNG/JPG images to WebP format
 * Run with: node scripts/convert-to-webp.js
 *
 * Requires: npm install sharp --save-dev
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Directories to process
const DIRS_TO_PROCESS = [
  'assets/images',
  'assets/guides',
  'assets/textures',
  'assets/equipment',
  'assets/gem',
  'assets/portraits/backgroundOptions',
];

// Files to skip (favicons, embed logos that need to stay as PNG)
const SKIP_FILES = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'logo192.png',
  'logo512.png',
  'apple-touch-icon.png',
  'embed_logo.png', // Keep for social media embeds which may not support WebP
];

async function convertToWebP(inputPath) {
  const outputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  try {
    const stats = fs.statSync(inputPath);

    // Skip if WebP already exists and is newer than source
    if (fs.existsSync(outputPath)) {
      const webpStats = fs.statSync(outputPath);
      if (webpStats.mtime > stats.mtime) {
        console.log(`  Skipping (up to date): ${path.basename(inputPath)}`);
        return { skipped: true };
      }
    }

    await sharp(inputPath)
      .webp({
        quality: 85,
        effort: 6, // Higher effort = better compression
      })
      .toFile(outputPath);

    const originalSize = stats.size;
    const webpSize = fs.statSync(outputPath).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);

    console.log(`  Converted: ${path.basename(inputPath)} -> ${path.basename(outputPath)} (${savings}% smaller)`);
    return { converted: true, originalSize, webpSize };
  } catch (error) {
    console.error(`  Error converting ${inputPath}:`, error.message);
    return { error: true };
  }
}

async function processDirectory(dirPath) {
  const fullPath = path.join(PUBLIC_DIR, dirPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Directory not found: ${dirPath}`);
    return { converted: 0, skipped: 0, errors: 0 };
  }

  console.log(`\nProcessing: ${dirPath}`);

  const files = fs.readdirSync(fullPath);
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !SKIP_FILES.includes(f));

  let converted = 0, skipped = 0, errors = 0;
  let totalOriginalSize = 0, totalWebpSize = 0;

  for (const file of imageFiles) {
    const result = await convertToWebP(path.join(fullPath, file));
    if (result.converted) {
      converted++;
      totalOriginalSize += result.originalSize;
      totalWebpSize += result.webpSize;
    } else if (result.skipped) {
      skipped++;
    } else if (result.error) {
      errors++;
    }
  }

  return { converted, skipped, errors, totalOriginalSize, totalWebpSize };
}

async function main() {
  console.log('Converting images to WebP format...');
  console.log('=====================================');

  let totalConverted = 0, totalSkipped = 0, totalErrors = 0;
  let grandOriginalSize = 0, grandWebpSize = 0;

  for (const dir of DIRS_TO_PROCESS) {
    const result = await processDirectory(dir);
    totalConverted += result.converted;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
    grandOriginalSize += result.totalOriginalSize || 0;
    grandWebpSize += result.totalWebpSize || 0;
  }

  console.log('\n=====================================');
  console.log('Summary:');
  console.log(`  Converted: ${totalConverted} files`);
  console.log(`  Skipped: ${totalSkipped} files (already up to date)`);
  console.log(`  Errors: ${totalErrors} files`);

  if (grandOriginalSize > 0) {
    const totalSavings = ((1 - grandWebpSize / grandOriginalSize) * 100).toFixed(1);
    console.log(`  Total size reduction: ${(grandOriginalSize / 1024).toFixed(0)}KB -> ${(grandWebpSize / 1024).toFixed(0)}KB (${totalSavings}% saved)`);
  }
}

main().catch(console.error);
