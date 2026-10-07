# jaiid Chrome Extension

**jaiid** (Just AI image descriptions) - A Chrome extension that uses Google Chrome's built-in AI (Nano) to automatically generate descriptive alt text for images on web pages, making the web more accessible.

## Features

✨ **AI-Powered Alt Text Generation**: Uses Chrome's built-in AI to generate contextual, descriptive alt text

🎯 **Smart Image Detection**: Automatically identifies eligible images based on size and format

📥 **Intelligent Model Download**: Automatically handles Gemini Nano model download with real-time progress tracking
  - Shows download percentage in dialog
  - Resumes seamlessly after download completes
  - One-time download persists across sessions

💾 **Smart Caching**: Generated alt text is cached per image for instant reuse
  - First open: AI generates description (shows loading state)
  - Subsequent opens: Instant display from cache (no loading)
  - Cache persists for the session (until page reload)
  - Reduces API calls and improves performance

♿ **Fully Accessible**: Built with WCAG 2.2 Level AA standards in mind
  - Screen reader announcements
  - Keyboard navigation support
  - ARIA attributes for proper semantics
  - Popover API for non-intrusive dialogs

🎨 **Non-Intrusive UI**: Subtle info button overlays that appear only on eligible images

⚡ **Modern Standards**: Manifest V3 compliant

## Requirements

- **Chrome Canary** or **Chrome Dev** (version 121+)
- **Chrome AI features enabled** (experimental)

### Enabling Chrome AI
v
1. Open Chrome Canary or Chrome Dev
2. Navigate to `chrome://flags`
3. Search for "Prompt API for Gemini Nano"
4. Enable the flag
5. Restart Chrome

## Installation

### For Development

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd ai-alt-text
   ```

2. Install dependencies (for testing):
   ```bash
   npm install
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extension directory

### For Production

1. Download the latest release
2. Unzip the package
3. Follow step 3 from "For Development" above

## Usage

1. **Activate the Extension**: Click the jaiid icon in your Chrome toolbar

2. **View Eligible Images**: The extension will scan the page and add small info buttons (ℹ️) to the bottom-left corner of eligible images

3. **Generate Alt Text**:
   - Click the info button or press Enter when focused
   - A dialog will appear with a loading indicator
   - The AI will generate descriptive alt text
   - The text will be displayed and announced to screen readers

4. **Close the Dialog**:
   - Click the close button (×)
   - Click the info button again
   - Press the Escape key

## Image Eligibility Criteria

The extension processes images that meet ALL of these criteria:

**Dimension Requirements (checked for BOTH natural and rendered size):**
- ✅ **Natural dimensions** (actual image file): 125px × 125px minimum, width < 1500px
- ✅ **Rendered dimensions** (displayed on page): 125px × 125px minimum, width < 1500px
- 📌 **Why both?** Ensures images are meaningful size in both file and display
  - Excludes tiny thumbnails (e.g., 800×800 image displayed at 50×50)
  - Excludes low-quality small images scaled up with CSS
  - Ensures alt text is useful for the image as actually displayed

**Other Requirements:**
- ✅ File format: PNG, JPEG, JPG, or WebP
- ✅ Not a background image (must be `<img>` element)
- ❌ Excludes: GIF, SVG, BMP, TIFF, and other formats

## Technical Details

### Architecture

```
ai-alt-text/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker for extension lifecycle
├── content.js             # Content script for page interaction
├── styles.css             # Styling for UI elements
├── build.js               # Build script for distribution
├── images/
│   └── ai-alt-icon.svg   # Extension icon
├── __tests__/             # Unit tests
│   ├── setup.js
│   ├── background.test.js
│   ├── content.test.js
│   └── build.test.js
└── dist/                  # Distribution folder (generated)
    ├── manifest.json
    ├── background.js
    ├── content.js
    ├── styles.css
    └── images/
```

### Key Technologies

- **Manifest V3**: Latest Chrome extension standard
- **Popover API**: Native HTML popover for dialogs
- **Chrome AI (Nano)**: Built-in language model for text generation
- **ARIA**: Accessibility attributes for screen reader support
- **MutationObserver**: Detects dynamically loaded images
- **Jest**: Testing framework

### Accessibility Features

- ✅ `aria-haspopup="dialog"` on trigger buttons
- ✅ `role="dialog"` on popovers
- ✅ `aria-labelledby` connecting dialogs to titles
- ✅ `aria-live` regions for dynamic content announcements
- ✅ Unique descriptive labels on all interactive elements
- ✅ Keyboard navigation (Enter to open, Esc to close)
- ✅ Screen reader announcements for generated text
- ✅ **No nested interactive controls** (WCAG 4.1.2 Level A compliance)
  - Detects images inside `<a>` or `<button>` elements
  - Places info button outside interactive parent
  - Prevents button-inside-link and button-inside-button violations

## Testing

Run the comprehensive unit test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

The test suite covers:

- ✅ Background script event handling
- ✅ Script and CSS injection
- ✅ Image detection and filtering
- ✅ Size and format validation
- ✅ **Dual dimension checking (natural and rendered)**
- ✅ Responsive image handling (CSS scaling)
- ✅ Thumbnail detection and exclusion
- ✅ **Interactive parent detection (WCAG 4.1.2)**
- ✅ Button positioning outside anchor/button elements
- ✅ Nested interactive control prevention
- ✅ Button and popover creation
- ✅ Accessibility attributes
- ✅ Dynamic image loading
- ✅ Error handling
- ✅ AI model download progress tracking
- ✅ Model availability states (readily, after-download, no)
- ✅ Progress callback integration
- ✅ **Alt text caching and reuse**
- ✅ Cache hit/miss scenarios
- ✅ Multi-image cache management
- ✅ Popover positioning (above button, edge detection)
- ✅ Viewport boundary handling
- ✅ Scroll and resize repositioning

## Build and Distribution

**📘 For detailed build documentation, see [BUILD.md](BUILD.md)**

### Building for Production

Create a clean distribution package with only the required files:

```bash
# Build the extension
npm run build
```

This creates a `dist/` folder containing only:
- `manifest.json`
- `background.js`
- `content.js`
- `styles.css`
- `images/` directory

### Build Scripts

```bash
# Build the extension
npm run build

# Clean the dist folder
npm run clean

# Clean and rebuild
npm run rebuild
```

### What's Excluded from Distribution

The build process excludes:
- ❌ Test files (`__tests__/`, `*.test.js`)
- ❌ Documentation (`README.md`, `TESTING.md`)
- ❌ Development files (`package.json`, `jest.config.js`, `build.js`)
- ❌ Test page (`test-page.html`)
- ❌ Node modules and dependencies

### Loading the Built Extension

1. Run `npm run build` to create the dist folder
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder (not the root directory)

## Development

### Making Changes

1. Edit the source files
2. Run tests to ensure nothing breaks:
   ```bash
   npm test
   ```
3. Reload the extension in Chrome:
   - Go to `chrome://extensions`
   - Click the reload icon on the jaiid extension
4. Test manually on web pages

### Code Structure

**background.js**: Handles extension icon clicks and injects content script/styles

**content.js**: Core functionality
- Image detection and filtering with dual dimension checking (natural + rendered)
- Interactive parent detection (prevents nested interactive controls per WCAG 4.1.2)
- UI element creation (buttons, popovers) with smart positioning
- AI integration for text generation with caching
- Alt text cache (Map) for instant reuse on subsequent opens
- Dynamic popover positioning (above button with viewport edge detection)
- Event handling and accessibility
- Scroll and resize repositioning

**styles.css**: Visual styling
- Button overlay positioning
- Popover dialog appearance (fixed positioning for JavaScript control)
- Loading animations
- Accessibility helpers (screen-reader-only content)

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Extension | ✅ Canary/Dev | ❓ Untested | ❌ No | ❌ No |
| Popover API | ✅ 114+ | ✅ 114+ | ❌ No | ❌ No |
| Chrome AI | ✅ Canary | ❌ No | ❌ No | ❌ No |

**Note**: This extension currently requires Chrome Canary or Chrome Dev with experimental AI features enabled. It may not work in stable Chrome or other browsers.

## Known Limitations

- Requires experimental Chrome AI features
- Only works in Chrome Canary/Dev builds
- AI-generated text quality depends on Chrome's AI capabilities
- Cannot analyze image content directly (relies on context clues)
- Popover API support is limited to Chromium browsers
- First-time use may require downloading the Gemini Nano model (progress shown in dialog)
- Model download requires internet connection and may take several minutes

## Future Enhancements

- 🔄 Cache generated alt text for performance
- 🎨 Customizable button positioning
- 💾 Export generated alt text as CSV/JSON
- 🔍 Option to edit AI-generated text
- 🌐 Multi-language support
- 📋 Copy alt text to clipboard

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

**Built with ♿ accessibility in mind**