/*
 Script: Upload banner images to Cloudinary and write URLs to frontend/public/bannerImages.json
 Reads Cloudinary credentials from .env at repo root or backend/.env
 Images source: frontend/public/images/newbanners
*/

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env from repo root if present, then backend fallback
const rootEnv = path.resolve(__dirname, '../../.env');
const backendEnv = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
else if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv });
else dotenv.config();

const cloudinary = require('cloudinary').v2;

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const SOURCE_DIR = path.resolve(__dirname, '../../frontend/public/images/newbanners');
const OUTPUT_JSON = path.resolve(__dirname, '../../frontend/public/bannerImages.json');
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_BANNERS_FOLDER || 'pickles/banners';

async function uploadFile(filePath, fileName) {
  const publicId = `${CLOUDINARY_FOLDER}/${path.parse(fileName).name}`;
  return cloudinary.uploader.upload(filePath, {
    folder: CLOUDINARY_FOLDER,
    public_id: path.parse(fileName).name,
    overwrite: true,
    resource_type: 'image',
  });
}

async function run() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));

  if (files.length === 0) {
    console.warn('No images found in newbanners directory.');
  }

  // Read existing JSON to avoid re-uploading existing banners
  let existing = [];
  if (fs.existsSync(OUTPUT_JSON)) {
    try {
      const raw = fs.readFileSync(OUTPUT_JSON, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) existing = parsed;
    } catch (e) {
      console.warn('Warning: failed to parse existing bannerImages.json, continuing with empty list');
    }
  }

  const existingBaseNames = new Set(
    existing
      .map((item) => (item && item.title ? String(item.title).toLowerCase() : ''))
      .filter(Boolean)
  );

  const newFiles = files.filter((f) => !existingBaseNames.has(path.parse(f).name.toLowerCase()));

  if (newFiles.length === 0) {
    console.log('No new banner images to upload.');
    console.log(`Existing count: ${existing.length}`);
    return;
  }

  const results = [];

  for (const file of newFiles) {
    const fullPath = path.join(SOURCE_DIR, file);
    try {
      const res = await uploadFile(fullPath, file);
      results.push({
        id: (existing.length + results.length + 1),
        title: path.parse(file).name,
        image: res.secure_url,
      });
      console.log(`Uploaded: ${file} -> ${res.secure_url}`);
    } catch (err) {
      console.error(`Failed to upload ${file}:`, err.message);
    }
  }

  const outputDir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const combined = existing.concat(results);
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(combined, null, 2));
  console.log(`Added ${results.length} new banner URL(s). Total now: ${combined.length}.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


