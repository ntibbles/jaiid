/**
 * Build script for jaiid (Just AI image descriptions) Chrome Extension
 * Creates a clean distribution package with only production files
 */

const fs = require('fs');
const path = require('path');

// Files and directories to include in the distribution
const INCLUDE_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'styles.css'
];

const INCLUDE_DIRS = [
  'images'
];

const DIST_DIR = 'dist';

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
}

/**
 * Remove directory and its contents recursively
 */
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`✓ Removed existing directory: ${dir}`);
  }
}

/**
 * Copy file to destination
 */
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  const stats = fs.statSync(dest);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`  ✓ ${src} → ${dest} (${sizeKB} KB)`);
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

/**
 * Main build function
 */
function build() {
  console.log('\n🚀 Building jaiid Extension...\n');
  
  // Remove existing dist folder
  removeDir(DIST_DIR);
  
  // Create fresh dist folder
  ensureDir(DIST_DIR);
  
  console.log('\n📦 Copying files:\n');
  
  // Copy individual files
  for (const file of INCLUDE_FILES) {
    const src = path.join(__dirname, file);
    const dest = path.join(__dirname, DIST_DIR, file);
    
    if (fs.existsSync(src)) {
      copyFile(src, dest);
    } else {
      console.warn(`  ⚠ Warning: ${file} not found, skipping...`);
    }
  }
  
  console.log('\n📁 Copying directories:\n');
  
  // Copy directories
  for (const dir of INCLUDE_DIRS) {
    const src = path.join(__dirname, dir);
    const dest = path.join(__dirname, DIST_DIR, dir);
    
    if (fs.existsSync(src)) {
      console.log(`  Copying ${dir}/...`);
      copyDir(src, dest);
    } else {
      console.warn(`  ⚠ Warning: ${dir}/ not found, skipping...`);
    }
  }
  
  // Calculate total size
  const getTotalSize = (dir) => {
    let size = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        size += getTotalSize(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    }
    return size;
  };
  
  const totalSize = getTotalSize(path.join(__dirname, DIST_DIR));
  const totalKB = (totalSize / 1024).toFixed(2);
  
  console.log('\n✅ Build completed successfully!');
  console.log(`📊 Total size: ${totalKB} KB\n`);
  console.log(`📂 Distribution files are in: ./${DIST_DIR}/\n`);
}

// Run build
try {
  build();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}