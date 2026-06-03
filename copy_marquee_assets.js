/**
 * copy_marquee_assets.js
 * ----------------------
 * Utility script: copies images from the local source folder
 * into the project's public/assets/marquee directory.
 *
 * Usage: node copy_marquee_assets.js
 *
 * Source: C:\Users\al3r18y\OneDrive\Desktop\Abraj\pic
 * Destination: public/assets/marquee
 */

import { readdirSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { join, extname, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOURCE_DIR = "C:\\Users\\al3r18y\\OneDrive\\Desktop\\Abraj\\pic";
const DEST_DIR = join(__dirname, "public", "assets", "marquee");

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

// Ensure destination directory exists
if (!existsSync(DEST_DIR)) {
  mkdirSync(DEST_DIR, { recursive: true });
  console.log(`✅ Created destination directory: ${DEST_DIR}`);
}

// Read source files
let files;
try {
  files = readdirSync(SOURCE_DIR).filter((f) =>
    ALLOWED_EXTENSIONS.includes(extname(f).toLowerCase())
  );
} catch (err) {
  console.error(`❌ Could not read source directory: ${SOURCE_DIR}`);
  console.error(err.message);
  process.exit(1);
}

if (files.length === 0) {
  console.warn("⚠️ No image files found in source directory.");
  process.exit(0);
}

console.log(`\n📂 Source: ${SOURCE_DIR}`);
console.log(`📁 Destination: ${DEST_DIR}`);
console.log(`📸 Found ${files.length} image(s) to copy:\n`);

let copied = 0;
for (const file of files) {
  const srcPath = join(SOURCE_DIR, file);
  // Sanitize file name: replace spaces/parentheses with dashes
  const cleanName = basename(file)
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/--+/g, "-")
    .toLowerCase();
  const destPath = join(DEST_DIR, cleanName);

  try {
    copyFileSync(srcPath, destPath);
    console.log(`  ✔ ${file} → ${cleanName}`);
    copied++;
  } catch (err) {
    console.error(`  ✘ Failed to copy ${file}: ${err.message}`);
  }
}

console.log(`\n✅ Done! ${copied}/${files.length} images copied successfully.`);
console.log(`\n📋 Public paths available as:`);
for (const file of files) {
  const cleanName = basename(file)
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/--+/g, "-")
    .toLowerCase();
  console.log(`   /assets/marquee/${cleanName}`);
}
