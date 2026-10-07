# Testing Guide for jaiid Extension

This document provides comprehensive information about testing the jaiid (Just AI image descriptions) Chrome extension.

## Test Suite Overview

The extension includes a comprehensive Jest-based test suite covering:

- **Background Script Tests**: Service worker functionality
- **Content Script Tests**: Image detection, UI creation, accessibility
- **Integration Tests**: End-to-end workflows

## Running Tests

### Prerequisites

```bash
npm install
```

### Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Coverage Goals

We aim for:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Test Files

### `__tests__/setup.js`

Configures the test environment:
- Mocks Chrome APIs (`chrome.action`, `chrome.scripting`)
- Mocks Chrome AI API (`self.ai.languageModel`)
- Sets up custom matchers
- Configures JSDOM environment

### `__tests__/background.test.js`

Tests for `background.js`:

#### Test Cases:
1. **Listener Registration**: Verifies action click listener is registered
2. **Script Injection**: Ensures content.js is injected on icon click
3. **CSS Injection**: Ensures styles.css is injected
4. **Injection Order**: Verifies script loads before CSS
5. **Error Handling**: Tests error scenarios
6. **Multiple Tabs**: Verifies functionality across different tabs

#### Example:
```javascript
test('should inject content script when extension icon is clicked', async () => {
  await actionClickListener(mockTab);
  expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
    target: { tabId: mockTab.id },
    files: ['content.js']
  });
});
```

### `__tests__/content.test.js`

Tests for `content.js`:

#### Test Suites:

**1. Image Detection**
- Multiple injection prevention
- Eligible image identification
- Valid format acceptance (png, jpg, jpeg, webp)
- Invalid format rejection (gif, svg, bmp, tiff)
- Minimum dimension validation (125×125px)
- Maximum width validation (<1500px)

**2. Button and Popover Creation**
- Button attribute verification
- Unique ID generation
- Popover structure
- Image wrapper creation
- Button positioning

**3. Accessibility Features**
- `aria-haspopup="dialog"` verification
- Unique descriptive labels
- `role="dialog"` on popovers
- `aria-labelledby` connections
- `aria-live` regions for dynamic content

**4. Dynamic Image Loading**
- Handling images that load after script injection
- MutationObserver functionality

#### Example:
```javascript
test('should create button with correct attributes', () => {
  const button = document.querySelector('.ai-alt-info-button');
  expect(button.getAttribute('aria-haspopup')).toBe('dialog');
  expect(button.getAttribute('aria-label')).toContain('Generate AI alt text');
});
```

## Manual Testing

### Setup

1. **Install the extension** (see README.md)
2. **Enable Chrome AI**:
   - Navigate to `chrome://flags`
   - Enable "Prompt API for Gemini Nano"
   - Restart Chrome

### Test Scenarios

#### Scenario 1: Basic Functionality

1. Navigate to a page with images (e.g., Wikipedia article)
2. Click the extension icon
3. **Expected**: Info buttons appear on eligible images
4. Click an info button
5. **Expected**: Popover opens, loading indicator appears
6. **Expected**: Alt text is generated and displayed
7. Press Escape
8. **Expected**: Popover closes

#### Scenario 2: Image Size Filtering

Test page HTML:
```html
<img src="small.jpg" width="100" height="100"> <!-- Should be ignored -->
<img src="good.jpg" width="300" height="300"> <!-- Should get button -->
<img src="huge.jpg" width="2000" height="400"> <!-- Should be ignored -->
```

**Expected**: Only the 300×300 image gets a button

#### Scenario 3: Image Format Filtering

Test page HTML:
```html
<img src="test.png" width="300" height="300"> <!-- Should get button -->
<img src="test.jpg" width="300" height="300"> <!-- Should get button -->
<img src="test.gif" width="300" height="300"> <!-- Should be ignored -->
<img src="test.svg" width="300" height="300"> <!-- Should be ignored -->
```

**Expected**: Only PNG and JPG images get buttons

#### Scenario 4: Keyboard Navigation

1. Click extension icon
2. Tab to an info button
3. Press Enter
4. **Expected**: Popover opens
5. Press Escape
6. **Expected**: Popover closes

#### Scenario 5: Screen Reader Compatibility

Using a screen reader (NVDA, JAWS, VoiceOver):

1. Navigate to an info button
2. **Expected**: Screen reader announces: "Generate AI alt text for image [number], button, has popup, dialog"
3. Activate the button
4. **Expected**: Screen reader announces loading state
5. **Expected**: Screen reader announces generated alt text

#### Scenario 6: Dynamic Images

1. Click extension icon
2. Use browser console to add a new eligible image:
   ```javascript
   const img = document.createElement('img');
   img.src = 'https://picsum.photos/400/400';
   document.body.appendChild(img);
   ```
3. **Expected**: Button appears on the new image within 1-2 seconds

#### Scenario 7: Multiple Popovers

1. Open a popover
2. While it's open, open another popover
3. **Expected**: First popover closes automatically (popover="auto" behavior)

#### Scenario 8: Error Handling

Disable Chrome AI or test without the flag enabled:

1. Click an info button
2. **Expected**: Error message appears in popover instead of alt text

## Accessibility Testing Checklist

- [ ] All buttons have `aria-label`
- [ ] All buttons have unique labels
- [ ] Buttons have `aria-haspopup="dialog"`
- [ ] Popovers have `role="dialog"`
- [ ] Popovers have `aria-labelledby`
- [ ] Loading state has `aria-live="polite"`
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus is visible on all interactive elements
- [ ] Screen readers announce all state changes
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 24×24px

## Performance Testing

### Test with Many Images

1. Navigate to image-heavy page (e.g., Pinterest, Instagram)
2. Click extension icon
3. **Monitor**: Page performance, memory usage
4. **Expected**: No significant lag or freezing

### Test AI Generation Speed

1. Open multiple popovers sequentially
2. **Monitor**: Time from click to text display
3. **Expected**: Consistent performance (<5 seconds per image)

## Debugging Tests

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Run Specific Test File

```bash
npm test -- background.test.js
```

### Run Specific Test

```bash
npm test -- -t "should inject content script"
```

### Debug with Chrome DevTools

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

## Common Issues

### Issue: Tests fail with "chrome is not defined"

**Solution**: Ensure `__tests__/setup.js` is properly configured in `jest.config.js`

### Issue: JSDOM doesn't support Popover API

**Solution**: This is expected. Manual testing required for popover interactions.

### Issue: AI mock doesn't return expected values

**Solution**: Check mock setup in `setup.js` and ensure promise resolution is correct.

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Test Maintenance

- Update tests when functionality changes
- Add tests for new features before implementation (TDD)
- Keep coverage above 80%
- Review and update manual test scenarios quarterly
- Test across different Chrome versions

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

---

**Questions or issues with testing?** Open an issue on the repository.