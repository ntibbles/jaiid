# Using jaiid Extension

This guide provides detailed instructions for using the jaiid (Just AI image descriptions) Chrome extension.

## First-Time Setup

### 1. Enable Chrome AI Features

**Before using the extension**, you must enable Chrome's experimental AI features:

1. Open Chrome Canary or Chrome Dev
2. Navigate to: `chrome://flags/#optimization-guide-on-device-model`
3. Set to **Enabled**
4. Navigate to: `chrome://flags/#prompt-api-for-gemini-nano`
5. Set to **Enabled**
6. **Restart Chrome**

### 2. Load the Extension

1. Open Chrome and go to: `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the extension folder (or `dist/` folder if using the built version)

### 3. First Model Download

**Important**: The first time you use the extension, Chrome needs to download the Gemini Nano AI model.

**What to expect**:
- First click on an info button will trigger the model download
- Download size: ~1-2 GB (varies by version)
- Download time: 2-10 minutes (depends on internet speed)
- Progress is shown in real-time in the dialog
- Download only happens **once** - model persists across sessions

**Download Process**:
```
1. Click extension icon → info buttons appear on images
2. Click an info button → dialog opens
3. Dialog shows: "Downloading AI model: X%"
4. Progress updates: 25%, 50%, 75%, 100%
5. After download: "Generating alt text..."
6. Alt text appears in dialog
```

## Daily Usage

After the initial model download, usage is fast and simple:

### Activating the Extension

1. **Navigate** to any webpage with images
2. **Click** the jaiid icon in your Chrome toolbar
3. **Look** for info buttons (ℹ️) on eligible images

### Generating Alt Text

**Method 1: Mouse**
1. Click an info button
2. Dialog opens with loading indicator
3. Alt text appears within 1-3 seconds
4. Click × to close, or click button again

**Method 2: Keyboard**
1. Tab to an info button
2. Press **Enter** to open dialog
3. Alt text generates and is announced by screen reader
4. Press **Escape** to close dialog

### Understanding Image Eligibility

The extension only processes images that meet **all** criteria:

✅ **Eligible Images**:
- Format: PNG, JPEG, JPG, or WebP
- Size: 125px × 125px minimum
- Width: Less than 1500px
- Type: `<img>` HTML elements (not background images)

❌ **Ignored Images**:
- GIF, SVG, BMP, TIFF files
- Images smaller than 125 × 125px
- Images 1500px wide or larger
- CSS background images
- Invisible images (display:none, etc.)

## Features and Capabilities

### What the AI Can Do

✅ Generate descriptive alt text based on:
- Image URL and filename context
- Image dimensions
- Surrounding page content (future)

✅ Create concise descriptions:
- Under 125 characters
- No redundant phrases ("image of", "picture of")
- Screen-reader friendly

### What the AI Cannot Do

❌ Currently cannot:
- Analyze actual image content/pixels
- Read text within images (OCR)
- Identify specific people or brands
- Access image metadata (EXIF)

**Note**: Future versions may support image analysis when Chrome's multimodal AI becomes available.

## Accessibility Features

### Screen Reader Support

The extension is fully compatible with screen readers:

- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS)
- **TalkBack** (Android Chrome)

**What screen readers announce**:
1. **Button focus**: "Generate AI alt text for image [number], button, has popup dialog"
2. **Dialog opens**: "AI-Generated Alt Text, dialog"
3. **Loading**: "Generating alt text, status"
4. **Result**: "Alt text generated: [description]"

### Keyboard Navigation

| Key | Action |
|-----|--------|
| **Tab** | Navigate to next info button |
| **Shift+Tab** | Navigate to previous info button |
| **Enter** | Open dialog / Generate alt text |
| **Escape** | Close dialog |
| **Space** | Activate focused button |

### High Contrast Mode

The extension respects system high contrast settings and provides:
- Clear focus indicators (2px blue outline)
- Sufficient color contrast (WCAG AA compliant)
- Hover states with increased contrast

## Troubleshooting

### Extension Icon Not Appearing

**Problem**: Can't find the extension icon in toolbar.

**Solution**:
1. Go to `chrome://extensions`
2. Verify extension is **enabled**
3. Click the puzzle icon in Chrome toolbar
4. Pin the jaiid extension

### No Info Buttons on Images

**Problem**: Clicked extension icon but no buttons appear.

**Possible causes**:

1. **No eligible images on page**
   - Check if images meet size/format criteria
   - Try a different webpage with larger images

2. **Images not loaded yet**
   - Wait for page to finish loading
   - Refresh and try again

3. **Extension not activated**
   - Click the extension icon again
   - Check if error appears in console

### Model Download Stuck

**Problem**: Download progress frozen at X%.

**Solution**:
1. **Check internet connection**
2. **Wait 5 minutes** (large file, may appear stuck)
3. **Close and reopen dialog** to retry
4. **Restart Chrome** if still stuck
5. **Check Chrome flags** are enabled correctly

### "Chrome AI is not available" Error

**Problem**: Error message appears instead of alt text.

**Solution**:
1. Verify you're using **Chrome Canary** or **Chrome Dev**
2. Check Chrome flags are enabled (see First-Time Setup)
3. Restart Chrome after enabling flags
4. Update Chrome to latest version
5. Check `chrome://components` - look for "Optimization Guide On Device Model"

### Alt Text Quality Issues

**Problem**: Generated text is generic or unhelpful.

**Explanation**: The AI currently uses limited context (URL, dimensions) as it cannot analyze actual image content yet.

**Workarounds**:
- Images with descriptive filenames produce better results
- Future versions will support image analysis
- For now, use as a starting point and manually refine

### Slow Generation (After Download)

**Problem**: Alt text takes >5 seconds to generate.

**Possible causes**:
1. **System resources** - Close other tabs/apps
2. **Model warming up** - First generation after restart is slower
3. **Complex page** - Many images competing for resources

**Normal speed**: 1-3 seconds per image after initial warmup

## Performance Tips

### Optimize for Speed

1. **Process fewer images at once**
   - Don't open multiple dialogs simultaneously
   - Generate alt text for one image at a time

2. **Keep Chrome updated**
   - Newer versions have performance improvements
   - Update Chrome Canary weekly

3. **Close unused tabs**
   - AI model uses system resources
   - More RAM = faster generation

### Reduce Data Usage

- **Model downloads once** - No ongoing data usage
- **Extension works offline** after model download
- **No external API calls** - Everything runs locally

## Privacy and Security

### What Gets Sent Where?

**Local Processing**:
- ✅ All AI processing happens **on your device**
- ✅ No image data sent to external servers
- ✅ No personal information collected
- ✅ No analytics or tracking

**What the Extension Accesses**:
- Image URLs and dimensions (from current page)
- Page DOM to find `<img>` elements
- Chrome AI API (local only)

**What it Does NOT Access**:
- Browsing history
- Other tabs or windows
- Personal files
- Network requests
- Cookies or storage

### Data Storage

**Model Storage**:
- Gemini Nano model stored in Chrome's component directory
- Managed by Chrome, not the extension
- Approximately 1-2 GB

**Extension Storage**:
- No persistent data stored
- No cache or history
- Temporary DOM modifications only

## Advanced Usage

### Testing the Extension

Use the included test page:

```bash
# Open test-page.html in Chrome
open test-page.html
# or
chrome test-page.html
```

The test page includes:
- Eligible images (various sizes/formats)
- Too-small images (should be ignored)
- Too-large images (should be ignored)
- Wrong formats (should be ignored)
- Dynamic image loading test

### Developer Mode

View extension logs:

1. Right-click extension icon
2. Select "Inspect popup" (if applicable)
3. Or open DevTools Console on any page
4. Look for messages prefixed with extension ID

**Useful console messages**:
```javascript
"Gemini Nano model is downloading..."
"Model download progress: X%"
"Error generating alt text: [details]"
```

## Frequently Asked Questions

### Q: Does this work on all websites?
A: Yes, on any website with eligible images. Some sites may have security policies that interfere.

### Q: Can I use this in production/work?
A: Currently experimental only. Not recommended for production until Chrome AI exits beta.

### Q: Will this work in stable Chrome?
A: Not yet. Requires Chrome Canary or Dev with experimental flags enabled.

### Q: How accurate is the alt text?
A: Currently limited by lack of image analysis. Quality will improve when Chrome adds multimodal AI support.

### Q: Can I edit the generated text?
A: Not yet. Planned for future release. Currently read-only.

### Q: Does it remember previous alt text?
A: No. Each generation is fresh. Caching planned for future version.

### Q: Why does download take so long?
A: The Gemini Nano model is 1-2 GB. This is a one-time download that persists.

### Q: Can I use this offline?
A: Yes, after the initial model download, everything works offline.

## Getting Help

### Report a Bug

1. Go to the [GitHub Issues page](https://github.com/YOUR-ORG/ai-alt-text/issues)
2. Click **New Issue**
3. Include:
   - Chrome version (`chrome://version`)
   - Operating system
   - Steps to reproduce
   - Screenshots if applicable
   - Console errors (if any)

### Request a Feature

1. Check [existing issues](https://github.com/YOUR-ORG/ai-alt-text/issues) first
2. Open a new issue with "Feature Request" label
3. Describe:
   - What you want to achieve
   - Why it would be useful
   - How you envision it working

### Ask Questions

Use [GitHub Discussions](https://github.com/YOUR-ORG/ai-alt-text/discussions) for:
- General questions
- Usage tips
- Best practices
- Feature ideas

---

**Happy alt-texting!** ♿