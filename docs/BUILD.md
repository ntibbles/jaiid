# Build Guide for jaiid Extension

This guide explains how to build and package the jaiid (Just AI image descriptions) Chrome extension for distribution.

## Quick Start

```bash
# Build the extension
npm run build

# The distributable files will be in the dist/ folder
```

## Build Process

### What the Build Does

The build script (`build.js`) performs the following operations:

1. **Cleans** - Removes any existing `dist/` folder
2. **Creates** - Creates a fresh `dist/` directory
3. **Copies** - Copies only required extension files to `dist/`
4. **Reports** - Shows file sizes and total distribution size

### Files Included in Distribution

#### Core Extension Files
- `manifest.json` - Extension configuration
- `background.js` - Service worker
- `content.js` - Content script
- `styles.css` - Styling

#### Assets
- `images/ai-alt-icon.svg` - Extension icon
- (All files in the `images/` directory)

### Files Excluded from Distribution

#### Development Files
- `package.json` - npm configuration
- `package-lock.json` - Dependency lock file
- `build.js` - Build script itself
- `jest.config.js` - Test configuration
- `.gitignore` - Git ignore rules

#### Documentation
- `README.md` - User documentation
- `TESTING.md` - Testing guide
- `BUILD.md` - This file

#### Test Files
- `__tests__/` - All test files
- `*.test.js` - Test scripts
- `test-page.html` - Manual testing page

#### Generated Files
- `node_modules/` - Dependencies
- `coverage/` - Test coverage reports

## Build Commands

### Build

```bash
npm run build
```

Creates the `dist/` folder with production-ready files.

**Output:**
```
🚀 Building jaiid Extension...

✓ Removed existing directory: dist
✓ Created directory: dist

📦 Copying files:
  ✓ manifest.json → dist/manifest.json (0.XX KB)
  ✓ background.js → dist/background.js (0.XX KB)
  ✓ content.js → dist/content.js (X.XX KB)
  ✓ styles.css → dist/styles.css (X.XX KB)

📁 Copying directories:
  Copying images/...
  ✓ images/ai-alt-icon.svg → dist/images/ai-alt-icon.svg (X.XX KB)

✅ Build completed successfully!
📊 Total size: XX.XX KB
📂 Distribution files are in: ./dist/
```

### Clean

```bash
npm run clean
```

Removes the `dist/` folder.

### Rebuild

```bash
npm run rebuild
```

Cleans and rebuilds in one command. Equivalent to:
```bash
npm run clean && npm run build
```

## Loading the Built Extension

### In Chrome

1. Build the extension:
   ```bash
   npm run build
   ```

2. Open Chrome and navigate to:
   ```
   chrome://extensions
   ```

3. Enable **Developer mode** (toggle in top-right)

4. Click **Load unpacked**

5. Navigate to and select the `dist/` folder

6. The extension should now be loaded and ready to use

### Verify Installation

- Extension icon should appear in the toolbar
- Click the icon on any webpage with images
- Info buttons should appear on eligible images

## Distribution Size

The built extension is typically:
- **Total size**: ~10-15 KB (uncompressed)
- **Files**: 4 JavaScript/CSS files + 1 JSON + images

### Size Breakdown (Approximate)

| File | Size |
|------|------|
| manifest.json | ~0.5 KB |
| background.js | ~0.6 KB |
| content.js | ~5-7 KB |
| styles.css | ~2-3 KB |
| images/ai-alt-icon.svg | ~1-2 KB |
| **Total** | **~10-15 KB** |

## Packaging for Chrome Web Store

### Creating a ZIP Archive

```bash
# Build the extension
npm run build

# Create ZIP archive (macOS/Linux)
cd dist
zip -r ../ai-alt-text-v1.0.0.zip .
cd ..

# Or use 7-Zip on Windows
# 7z a ai-alt-text-v1.0.0.zip ./dist/*
```

### Publishing Checklist

- [ ] Update version number in `manifest.json`
- [ ] Run all tests: `npm test`
- [ ] Build extension: `npm run build`
- [ ] Test the built extension manually
- [ ] Create ZIP archive from `dist/` folder
- [ ] Upload to Chrome Web Store Developer Dashboard
- [ ] Fill in store listing details
- [ ] Submit for review

## Troubleshooting

### Build Fails with "File not found"

**Problem**: Build script can't find required files.

**Solution**: Ensure you're running the build from the project root directory:
```bash
cd /path/to/ai-alt-text
npm run build
```

### dist/ Folder is Empty

**Problem**: No files were copied to `dist/`.

**Solution**: Check that all required files exist in the root directory:
- `manifest.json`
- `background.js`
- `content.js`
- `styles.css`
- `images/ai-alt-icon.svg`

### Permission Denied Error

**Problem**: Can't write to `dist/` folder.

**Solution**: 
1. Check folder permissions
2. Try running with appropriate permissions
3. Manually delete `dist/` folder and try again

### Extension Won't Load in Chrome

**Problem**: Chrome rejects the extension when loading from `dist/`.

**Solution**:
1. Verify `manifest.json` is valid JSON
2. Check Chrome DevTools console for errors
3. Ensure all file paths in manifest are correct
4. Verify `images/ai-alt-icon.svg` exists

### Old Files Remain in dist/

**Problem**: Deleted source files still appear in `dist/`.

**Solution**: The build script always creates a fresh `dist/` folder. If you see old files:
```bash
npm run clean
npm run build
```

## Advanced Build Options

### Customizing the Build

Edit `build.js` to customize what gets included:

```javascript
// Add more files
const INCLUDE_FILES = [
  'manifest.json',
  'background.js',
  'content.js',
  'styles.css',
  'your-new-file.js'  // Add here
];

// Add more directories
const INCLUDE_DIRS = [
  'images',
  'fonts'  // Add here
];
```

### Creating Multiple Build Variants

You can create different build configurations:

```bash
# Development build (with source maps, etc.)
npm run build:dev

# Production build (minified, optimized)
npm run build:prod
```

*(Not implemented yet - future enhancement)*

## Automated Build Testing

The build script has its own unit tests:

```bash
# Run build tests
npm test -- build.test.js
```

Tests verify:
- ✅ Required files list is correct
- ✅ Excluded files are not included
- ✅ File copy operations work
- ✅ Directory copying is recursive
- ✅ npm scripts are properly defined

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: extension-dist
          path: dist/
```

## Best Practices

1. **Always test before building**
   ```bash
   npm test && npm run build
   ```

2. **Verify the build manually**
   - Load the `dist/` folder in Chrome
   - Test core functionality
   - Check file sizes

3. **Version your releases**
   - Update `version` in `manifest.json`
   - Tag releases in Git
   - Keep a changelog

4. **Keep dist/ out of version control**
   - Already in `.gitignore`
   - Build on-demand or in CI/CD

5. **Document any build changes**
   - Update this file if you modify `build.js`
   - Note breaking changes in release notes

## File Size Optimization

### Current Approach
- No minification (for readability and debugging)
- No bundling (not needed for small extension)
- Clean code structure

### Future Optimizations
- Minify JavaScript and CSS
- Remove comments from production build
- Optimize SVG files
- Enable compression

*Estimated reduction: 30-40% with minification*

## Resources

- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Web Store Publishing](https://developer.chrome.com/docs/webstore/publish/)
- [Extension Package Format](https://developer.chrome.com/docs/extensions/mv3/linux_hosting/)

---

**Questions about the build process?** Open an issue on the repository.