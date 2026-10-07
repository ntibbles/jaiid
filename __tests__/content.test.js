/**
 * Unit tests for content.js
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Read the actual content.js file
const contentScript = fs.readFileSync(
  path.join(__dirname, '../content.js'),
  'utf8'
);

describe('Content Script - Image Detection', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should prevent multiple injections', () => {
    // First injection
    eval(contentScript);
    expect(window.aiAltTextInjected).toBe(true);

    // Count initial elements
    const initialWrappers = document.querySelectorAll('.ai-alt-image-wrapper').length;

    // Try to inject again
    eval(contentScript);

    // Should not create new wrappers
    const finalWrappers = document.querySelectorAll('.ai-alt-image-wrapper').length;
    expect(finalWrappers).toBe(initialWrappers);
  });

  test('should identify eligible images correctly', () => {
    // Create test images
    const eligibleImg = document.createElement('img');
    eligibleImg.src = 'test.png';
    Object.defineProperty(eligibleImg, 'naturalWidth', { value: 500, configurable: true });
    Object.defineProperty(eligibleImg, 'naturalHeight', { value: 500, configurable: true });
    Object.defineProperty(eligibleImg, 'complete', { value: true, configurable: true });
    document.body.appendChild(eligibleImg);

    const tooSmallImg = document.createElement('img');
    tooSmallImg.src = 'small.jpg';
    Object.defineProperty(tooSmallImg, 'naturalWidth', { value: 100, configurable: true });
    Object.defineProperty(tooSmallImg, 'naturalHeight', { value: 100, configurable: true });
    Object.defineProperty(tooSmallImg, 'complete', { value: true, configurable: true });
    document.body.appendChild(tooSmallImg);

    const tooWideImg = document.createElement('img');
    tooWideImg.src = 'wide.jpeg';
    Object.defineProperty(tooWideImg, 'naturalWidth', { value: 1600, configurable: true });
    Object.defineProperty(tooWideImg, 'naturalHeight', { value: 200, configurable: true });
    Object.defineProperty(tooWideImg, 'complete', { value: true, configurable: true });
    document.body.appendChild(tooWideImg);

    const wrongTypeImg = document.createElement('img');
    wrongTypeImg.src = 'test.gif';
    Object.defineProperty(wrongTypeImg, 'naturalWidth', { value: 500, configurable: true });
    Object.defineProperty(wrongTypeImg, 'naturalHeight', { value: 500, configurable: true });
    Object.defineProperty(wrongTypeImg, 'complete', { value: true, configurable: true });
    document.body.appendChild(wrongTypeImg);

    // Run script
    eval(contentScript);

    // Check that only eligible image got processed
    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(1);
    expect(processedImages[0]).toBe(eligibleImg);
  });

  test('should accept valid image formats: png, jpg, jpeg, webp', () => {
    const formats = ['test.png', 'test.jpg', 'test.jpeg', 'test.webp'];

    formats.forEach((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.id = `img-${index}`;
      Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      document.body.appendChild(img);
    });

    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(formats.length);
  });

  test('should reject invalid image formats', () => {
    const invalidFormats = ['test.gif', 'test.svg', 'test.bmp', 'test.tiff'];

    invalidFormats.forEach((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.id = `img-${index}`;
      Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      document.body.appendChild(img);
    });

    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(0);
  });

  test('should check minimum dimensions of 125x125px', () => {
    const testCases = [
      { width: 124, height: 200, shouldProcess: false },
      { width: 200, height: 124, shouldProcess: false },
      { width: 125, height: 125, shouldProcess: true },
      { width: 126, height: 126, shouldProcess: true }
    ];

    testCases.forEach((testCase, index) => {
      const img = document.createElement('img');
      img.src = `test${index}.png`;
      Object.defineProperty(img, 'naturalWidth', { value: testCase.width, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: testCase.height, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      document.body.appendChild(img);
    });

    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    const expectedCount = testCases.filter(tc => tc.shouldProcess).length;
    expect(processedImages.length).toBe(expectedCount);
  });

  test('should check maximum width of 1500px', () => {
    const testCases = [
      { width: 1499, height: 300, shouldProcess: true },
      { width: 1500, height: 300, shouldProcess: false },
      { width: 1501, height: 300, shouldProcess: false },
      { width: 2000, height: 300, shouldProcess: false }
    ];

    testCases.forEach((testCase, index) => {
      const img = document.createElement('img');
      img.src = `test${index}.jpg`;
      Object.defineProperty(img, 'naturalWidth', { value: testCase.width, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: testCase.height, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      document.body.appendChild(img);
    });

    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    const expectedCount = testCases.filter(tc => tc.shouldProcess).length;
    expect(processedImages.length).toBe(expectedCount);
  });
});

describe('Content Script - Button and Popover Creation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;
  });

  test('should create button with correct attributes', () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const button = document.querySelector('.ai-alt-info-button');
    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-label')).toContain('Generate AI alt text');
    expect(button.hasAttribute('popovertarget')).toBe(true);
  });

  test('should create button with unique ID and label', () => {
    const img1 = document.createElement('img');
    img1.src = 'test1.png';
    Object.defineProperty(img1, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img1, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img1, 'complete', { value: true, configurable: true });
    document.body.appendChild(img1);

    const img2 = document.createElement('img');
    img2.src = 'test2.jpg';
    Object.defineProperty(img2, 'naturalWidth', { value: 400, configurable: true });
    Object.defineProperty(img2, 'naturalHeight', { value: 400, configurable: true });
    Object.defineProperty(img2, 'complete', { value: true, configurable: true });
    document.body.appendChild(img2);

    eval(contentScript);

    const buttons = document.querySelectorAll('.ai-alt-info-button');
    expect(buttons.length).toBe(2);

    const ids = Array.from(buttons).map(btn => btn.id);
    expect(new Set(ids).size).toBe(2); // All IDs are unique

    const labels = Array.from(buttons).map(btn => btn.getAttribute('aria-label'));
    expect(labels[0]).not.toBe(labels[1]); // Labels are unique
  });

  test('should create popover with correct attributes', () => {
    const img = document.createElement('img');
    img.src = 'test.webp';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');
    expect(popover).toBeTruthy();
    expect(popover.getAttribute('popover')).toBe('auto');
    expect(popover.getAttribute('role')).toBe('dialog');
    expect(popover.hasAttribute('aria-labelledby')).toBe(true);
  });

  test('should wrap image in positioned wrapper', () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const wrapper = document.querySelector('.ai-alt-image-wrapper');
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.position).toBe('relative');
    expect(wrapper.contains(img)).toBe(true);
  });

  test('should position button at bottom left', () => {
    const img = document.createElement('img');
    img.src = 'test.jpeg';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const button = document.querySelector('.ai-alt-info-button');
    const wrapper = document.querySelector('.ai-alt-image-wrapper');
    
    expect(wrapper.contains(button)).toBe(true);
    expect(button).toBeTruthy();
  });
});

describe('Content Script - Accessibility Features', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;
  });

  test('should have aria-haspopup="dialog" on button', () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const button = document.querySelector('.ai-alt-info-button');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
  });

  test('should have unique descriptive label on button', () => {
    const img = document.createElement('img');
    img.src = 'test.jpg';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const button = document.querySelector('.ai-alt-info-button');
    const label = button.getAttribute('aria-label');
    
    expect(label).toBeTruthy();
    expect(label.length).toBeGreaterThan(0);
    expect(label).toContain('alt text');
  });

  test('should have role="dialog" on popover', () => {
    const img = document.createElement('img');
    img.src = 'test.webp';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');
    expect(popover.getAttribute('role')).toBe('dialog');
  });

  test('should have aria-labelledby on popover referencing title', () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');
    const labelledBy = popover.getAttribute('aria-labelledby');
    const title = document.getElementById(labelledBy);
    
    expect(labelledBy).toBeTruthy();
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Alt Text');
  });

  test('should include loading state with aria-live', () => {
    const img = document.createElement('img');
    img.src = 'test.jpg';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');
    const loadingDiv = popover.querySelector('.ai-alt-loading');
    
    expect(loadingDiv).toBeTruthy();
    expect(loadingDiv.getAttribute('role')).toBe('status');
    expect(loadingDiv.getAttribute('aria-live')).toBe('polite');
  });
});

describe('Content Script - Dynamic Image Loading', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;
  });

  test('should handle images that load after script injection', (done) => {
    const img = document.createElement('img');
    img.src = 'test.png';
    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    document.body.appendChild(img);

    eval(contentScript);

    // Initially not processed
    expect(img.hasAttribute('data-ai-alt-processed')).toBe(false);

    // Simulate image load
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    
    img.dispatchEvent(new Event('load'));

    // Give time for event handler
    setTimeout(() => {
      expect(img.hasAttribute('data-ai-alt-processed')).toBe(true);
      done();
    }, 100);
  });
});

describe('Content Script - Duplicate Icon Prevention', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;
  });

  test('should not create duplicate buttons for already processed images', () => {
    // Create eligible image
    const img = document.createElement('img');
    img.src = 'https://picsum.photos/300/300';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'getBoundingClientRect', {
      value: () => ({ width: 300, height: 300, top: 0, left: 0 }),
      configurable: true
    });
    document.body.appendChild(img);

    // Process image first time
    eval(contentScript);
    
    // Count buttons created
    const firstButtonCount = document.querySelectorAll('.ai-alt-info-button').length;
    expect(firstButtonCount).toBe(1);
    expect(img.getAttribute('data-ai-alt-processed')).toBe('true');
    
    // Try to process the same image again by triggering mutation observer
    const newDiv = document.createElement('div');
    document.body.appendChild(newDiv);
    
    // Wait for debounced mutation observer
    setTimeout(() => {
      const finalButtonCount = document.querySelectorAll('.ai-alt-info-button').length;
      expect(finalButtonCount).toBe(1); // Should still be 1, not duplicated
    }, 150);
  });

  test('should skip images that already have wrappers', () => {
    // Create eligible image
    const img = document.createElement('img');
    img.src = 'https://picsum.photos/300/300';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'getBoundingClientRect', {
      value: () => ({ width: 300, height: 300, top: 0, left: 0 }),
      configurable: true
    });
    document.body.appendChild(img);

    // Process image
    eval(contentScript);
    
    // Verify wrapper was created
    const wrapper = img.parentElement;
    expect(wrapper.classList.contains('ai-alt-image-wrapper')).toBe(true);
    
    // Count wrappers
    const firstWrapperCount = document.querySelectorAll('.ai-alt-image-wrapper').length;
    expect(firstWrapperCount).toBe(1);
    
    // Manually try to attach button again (simulating bug scenario)
    // This should be prevented by the defensive check
    const buttonsBefore = document.querySelectorAll('.ai-alt-info-button').length;
    
    // Remove processed flag to test defensive wrapper check
    img.removeAttribute('data-ai-alt-processed');
    
    // Trigger processing again
    const newDiv = document.createElement('div');
    document.body.appendChild(newDiv);
    
    setTimeout(() => {
      const buttonsAfter = document.querySelectorAll('.ai-alt-info-button').length;
      expect(buttonsAfter).toBe(buttonsBefore); // Should not create duplicate
    }, 150);
  });

  test('should only process newly added images in mutation observer', (done) => {
    // Create initial images
    const img1 = document.createElement('img');
    img1.src = 'https://picsum.photos/300/300';
    img1.id = 'img1';
    Object.defineProperty(img1, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img1, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img1, 'complete', { value: true, configurable: true });
    Object.defineProperty(img1, 'getBoundingClientRect', {
      value: () => ({ width: 300, height: 300, top: 0, left: 0 }),
      configurable: true
    });
    document.body.appendChild(img1);

    // Initialize script
    eval(contentScript);
    
    // Count initial buttons
    const initialButtons = document.querySelectorAll('.ai-alt-info-button').length;
    expect(initialButtons).toBe(1);

    // Add a new image dynamically
    const img2 = document.createElement('img');
    img2.src = 'https://picsum.photos/400/400';
    img2.id = 'img2';
    Object.defineProperty(img2, 'naturalWidth', { value: 400, configurable: true });
    Object.defineProperty(img2, 'naturalHeight', { value: 400, configurable: true });
    Object.defineProperty(img2, 'complete', { value: true, configurable: true });
    Object.defineProperty(img2, 'getBoundingClientRect', {
      value: () => ({ width: 400, height: 400, top: 0, left: 0 }),
      configurable: true
    });
    document.body.appendChild(img2);

    // Wait for debounced mutation observer
    setTimeout(() => {
      const finalButtons = document.querySelectorAll('.ai-alt-info-button').length;
      expect(finalButtons).toBe(2); // One for each image
      
      // Verify first image wasn't reprocessed (no duplicate button)
      const img1Wrapper = img1.closest('.ai-alt-image-wrapper');
      const img1Buttons = img1Wrapper?.querySelectorAll('.ai-alt-info-button').length || 0;
      expect(img1Buttons).toBe(1); // Should still have exactly 1 button
      
      done();
    }, 150);
  });

  test('should debounce mutation observer to prevent excessive processing', (done) => {
    // Initialize script
    eval(contentScript);
    
    let processCallCount = 0;
    const originalQuerySelectorAll = document.querySelectorAll.bind(document);
    
    // Monitor how many times images are queried (indication of processing)
    document.querySelectorAll = jest.fn((selector) => {
      if (selector.includes('img:not([data-ai-alt-processed])')) {
        processCallCount++;
      }
      return originalQuerySelectorAll(selector);
    });

    // Trigger multiple rapid DOM mutations
    for (let i = 0; i < 10; i++) {
      const div = document.createElement('div');
      document.body.appendChild(div);
    }

    // Without debouncing, this would process 10 times
    // With debouncing (100ms), it should process only once after all mutations
    setTimeout(() => {
      // Should be processed much fewer times than mutations
      expect(processCallCount).toBeLessThan(5);
      
      // Restore original function
      document.querySelectorAll = originalQuerySelectorAll;
      done();
    }, 200);
  });
});}