# Dual Dimension Checking

This document explains how the jaiid (Just AI image descriptions) extension checks both **natural** and **rendered** image dimensions to determine eligibility.

## Overview

The extension validates images against size requirements in **two dimensions**:

1. **Natural Dimensions** - The actual pixel dimensions of the image file
2. **Rendered Dimensions** - The displayed pixel dimensions on the web page

Both must meet the size requirements for an image to be eligible.

## Why Check Both?

### Problem: Natural Dimensions Only

If we only checked the natural (file) dimensions:

```html
<!-- 800x800 image displayed as tiny thumbnail -->
<img src="large-photo.jpg" style="width: 50px; height: 50px;">
```

**Result without dual checking:**
- ✅ Natural: 800×800 (passes)
- ❌ Rendered: 50×50 (tiny on page)
- ⚠️ Gets button overlay, but image is too small to be useful

**Result with dual checking:**
- ✅ Natural: 800×800 (passes)
- ❌ Rendered: 50×50 (fails)
- ✅ Correctly excluded - no button on thumbnail

### Problem: Rendered Dimensions Only

If we only checked the rendered (displayed) dimensions:

```html
<!-- Small 100x100 image scaled up with CSS -->
<img src="tiny-icon.png" style="width: 400px; height: 400px;">
```

**Result without dual checking:**
- ❌ Natural: 100×100 (low quality)
- ✅ Rendered: 400×400 (passes)
- ⚠️ Gets button, but AI can't generate good alt text from tiny image

**Result with dual checking:**
- ❌ Natural: 100×100 (fails)
- ✅ Rendered: 400×400 (passes)
- ✅ Correctly excluded - image quality too low

## Size Requirements

### Both Dimensions Must Meet:

**Minimum Size:**
- Width: ≥ 125px
- Height: ≥ 125px

**Maximum Size:**
- Width: < 1500px
- Height: No maximum

### Why These Limits?

**Minimum (125×125):**
- Ensures image is substantial enough to need alt text
- Excludes icons, bullets, decorative elements
- Provides meaningful context for AI generation

**Maximum Width (1500):**
- Prevents very wide banners/headers
- Focuses on content images
- Reduces processing overhead

## Examples

### ✅ Eligible: Both Pass

```html
<!-- Natural: 800x600, Rendered: 400x300 -->
<img src="photo.jpg" width="400">
```

| Dimension | Width | Height | Status |
|-----------|-------|--------|--------|
| Natural   | 800   | 600    | ✅ Pass |
| Rendered  | 400   | 300    | ✅ Pass |
| **Result** | | | ✅ **Eligible** |

---

### ❌ Ineligible: Natural Too Small

```html
<!-- Small icon scaled up with CSS -->
<img src="icon.png" style="width: 200px; height: 200px;">
<!-- Natural: 64x64, Rendered: 200x200 -->
```

| Dimension | Width | Height | Status |
|-----------|-------|--------|--------|
| Natural   | 64    | 64     | ❌ Fail (< 125) |
| Rendered  | 200   | 200    | ✅ Pass |
| **Result** | | | ❌ **Ineligible** |

---

### ❌ Ineligible: Rendered Too Small

```html
<!-- Large image displayed as thumbnail -->
<img src="photo.jpg" class="thumbnail">
<!-- CSS: .thumbnail { width: 80px; height: 80px; } -->
<!-- Natural: 1200x800, Rendered: 80x80 -->
```

| Dimension | Width | Height | Status |
|-----------|-------|--------|--------|
| Natural   | 1200  | 800    | ✅ Pass |
| Rendered  | 80    | 80     | ❌ Fail (< 125) |
| **Result** | | | ❌ **Ineligible** |

---

### ❌ Ineligible: Natural Too Wide

```html
<!-- Wide banner scaled down -->
<img src="banner.jpg" style="width: 100%;">
<!-- Natural: 2400x400, Rendered: 1000x400 -->
```

| Dimension | Width | Height | Status |
|-----------|-------|--------|--------|
| Natural   | 2400  | 400    | ❌ Fail (≥ 1500) |
| Rendered  | 1000  | 400    | ✅ Pass |
| **Result** | | | ❌ **Ineligible** |

---

### ❌ Ineligible: Rendered Too Wide

```html
<!-- Image stretched with CSS -->
<img src="photo.jpg" style="width: 1600px;">
<!-- Natural: 800x600, Rendered: 1600x600 -->
```

| Dimension | Width | Height | Status |
|-----------|-------|--------|--------|
| Natural   | 800   | 600    | ✅ Pass |
| Rendered  | 1600  | 600    | ❌ Fail (≥ 1500) |
| **Result** | | | ❌ **Ineligible** |

---

### ✅ Eligible: Edge Case at Minimum

```html
<!-- Exactly at minimum dimensions -->
<img src="small-photo.jpg">
<!-- Natural: 125x125, Rendered: 125x125 -->
```

| Dimension | Width | Height | Status |
|-----------|-------|--------|--------|
| Natural   | 125   | 125    | ✅ Pass (exactly 125) |
| Rendered  | 125   | 125    | ✅ Pass (exactly 125) |
| **Result** | | | ✅ **Eligible** |

---

### ✅ Eligible: Edge Case at Maximum

```html
<!-- Just under maximum width -->
<img src="wide-photo.jpg">
<!-- Natural: 1499x400, Rendered: 1499x400 -->
```

| Dimension | Width | Height | Status |
|-----------|-------|--------|--------|
| Natural   | 1499  | 400    | ✅ Pass (< 1500) |
| Rendered  | 1499  | 400    | ✅ Pass (< 1500) |
| **Result** | | | ✅ **Eligible** |

## Implementation

### Code

```javascript
function isEligibleImage(img) {
  const rect = img.getBoundingClientRect();
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  const renderedWidth = rect.width;
  const renderedHeight = rect.height;

  // Check if image is loaded
  if (!naturalWidth || !naturalHeight) {
    return false;
  }

  // Check natural dimensions
  if (naturalWidth < 125 || naturalHeight < 125 || naturalWidth >= 1500) {
    return false;
  }

  // Check rendered dimensions
  if (renderedWidth < 125 || renderedHeight < 125 || renderedWidth >= 1500) {
    return false;
  }

  // ... other checks (format, etc.)

  return true;
}
```

### How It Works

1. **Get Natural Dimensions:**
   ```javascript
   const naturalWidth = img.naturalWidth;
   const naturalHeight = img.naturalHeight;
   ```
   - `naturalWidth` and `naturalHeight` are intrinsic properties
   - Represent the actual image file dimensions
   - Not affected by CSS

2. **Get Rendered Dimensions:**
   ```javascript
   const rect = img.getBoundingClientRect();
   const renderedWidth = rect.width;
   const renderedHeight = rect.height;
   ```
   - `getBoundingClientRect()` returns the actual rendered size
   - Includes effects of CSS (`width`, `height`, `max-width`, etc.)
   - Reflects what user actually sees

3. **Validate Both:**
   ```javascript
   // Both must pass all checks
   if (naturalWidth < 125 || renderedWidth < 125) return false;
   if (naturalHeight < 125 || renderedHeight < 125) return false;
   if (naturalWidth >= 1500 || renderedWidth >= 1500) return false;
   ```

## Common Scenarios

### Responsive Images

```html
<img src="photo.jpg" 
     srcset="photo-400.jpg 400w, photo-800.jpg 800w"
     sizes="(max-width: 600px) 400px, 800px">
```

**Desktop (wide viewport):**
- Natural: 800×600 (loaded from srcset)
- Rendered: 800×600
- ✅ Both pass → Eligible

**Mobile (narrow viewport):**
- Natural: 400×300 (loaded from srcset)
- Rendered: 400×300
- ✅ Both pass → Eligible

### CSS Scaling

```html
<style>
  .gallery img { max-width: 100%; height: auto; }
</style>
<div class="gallery" style="width: 300px;">
  <img src="photo.jpg"> <!-- Natural: 1200x800 -->
</div>
```

- Natural: 1200×800 ✅
- Rendered: 300×200 ✅
- ✅ Both pass → Eligible

### Image in Flexbox

```html
<style>
  .flex { display: flex; }
  .flex img { flex: 1; max-width: 50%; }
</style>
<div class="flex" style="width: 600px;">
  <img src="photo.jpg"> <!-- Natural: 800x600 -->
</div>
```

- Natural: 800×600 ✅
- Rendered: 300×225 (50% of 600px) ✅
- ✅ Both pass → Eligible

### Thumbnail in Grid

```html
<style>
  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
  .grid img { width: 100%; }
</style>
<div class="grid" style="width: 600px;">
  <img src="photo.jpg"> <!-- Natural: 1000x1000 -->
</div>
```

- Natural: 1000×1000 ✅
- Rendered: ~90×90 (1/6 of 600px minus gaps) ❌
- ❌ Rendered too small → Ineligible

## Edge Cases

### Fractional Pixels

```javascript
renderedWidth = 124.8; // From getBoundingClientRect()
```

- JavaScript comparison: `124.8 < 125` → `true`
- ❌ Fails minimum check
- Correctly excluded

### Hidden Images

```html
<img src="photo.jpg" style="display: none;">
<!-- Natural: 800x600, Rendered: 0x0 -->
```

- Natural: 800×600 ✅
- Rendered: 0×0 ❌
- ❌ Rendered dimensions zero → Ineligible

### Images Loading

```javascript
if (!naturalWidth || !naturalHeight) return false;
```

- Before image loads: `naturalWidth = 0`
- ❌ Immediately rejected
- Event listener waits for `load` event before re-checking

### Aspect Ratio Preservation

```html
<img src="photo.jpg" width="200"> <!-- Natural: 800x600 -->
<!-- CSS automatically scales height to maintain aspect ratio -->
```

- Natural: 800×600 ✅
- Rendered: 200×150 (aspect ratio preserved) ✅
- ✅ Both pass → Eligible

## Benefits

### 1. Excludes Thumbnails

Thumbnails often use high-resolution images scaled down:

```html
<!-- Gallery with thumbnails -->
<div class="thumbnails">
  <img src="photo1.jpg" class="thumb"> <!-- 1200x800 → 100x100 -->
  <img src="photo2.jpg" class="thumb"> <!-- 1200x800 → 100x100 -->
</div>
```

- ❌ Thumbnails excluded (rendered < 125)
- ✅ Only full-size images get alt text buttons

### 2. Excludes Scaled Icons

Prevents buttons on decorative icons:

```html
<img src="icon.png" style="width: 300px;"> <!-- Natural: 48x48 -->
```

- ❌ Excluded (natural < 125)
- ✅ Focuses on actual photos/content images

### 3. Handles Responsive Design

Works correctly with modern responsive techniques:

```html
<picture>
  <source media="(max-width: 600px)" srcset="small.jpg">
  <source media="(max-width: 1200px)" srcset="medium.jpg">
  <img src="large.jpg">
</picture>
```

- ✅ Different natural dimensions at different viewport sizes
- ✅ Both natural and rendered scale together
- ✅ Correctly handles all breakpoints

### 4. Improves User Experience

Only shows buttons on images where alt text is actually useful:

- ✅ Content images: Get buttons
- ❌ Tiny thumbnails: No buttons (would clutter UI)
- ❌ Decorative icons: No buttons (not meaningful content)
- ❌ Stretched low-quality images: No buttons (poor AI input)

## Testing

See [__tests__/dimension-checking.test.js](/__tests__/dimension-checking.test.js) for comprehensive test coverage:

- ✅ Both dimensions meeting requirements
- ✅ Natural small, rendered large (rejected)
- ✅ Natural large, rendered small (rejected)
- ✅ Natural too wide (rejected)
- ✅ Rendered too wide (rejected)
- ✅ Exact minimum dimensions (125×125)
- ✅ Exact maximum width (1499px)
- ✅ One pixel below minimum (rejected)
- ✅ Responsive scaling
- ✅ Portrait vs. landscape
- ✅ Fractional pixel dimensions
- ✅ Hidden images (display:none)
- ✅ Multiple images with varying dimensions

## Future Enhancements

### Configurable Thresholds

Allow users to adjust size requirements:

```javascript
const MIN_SIZE = settings.minDimension || 125;
const MAX_WIDTH = settings.maxWidth || 1500;
```

### Aspect Ratio Filtering

Exclude extremely wide or tall images:

```javascript
const aspectRatio = naturalWidth / naturalHeight;
if (aspectRatio > 5 || aspectRatio < 0.2) return false;
```

### Rendered Area Check

Consider total pixel area instead of just width/height:

```javascript
const renderedArea = renderedWidth * renderedHeight;
if (renderedArea < MIN_AREA) return false;
```

---

**Questions about dimension checking?** Open an issue on GitHub.