/**
 * Jest setup file for jaiid (Just AI image descriptions) extension tests
 */

// Mock Chrome API
global.chrome = {
  action: {
    onClicked: {
      addListener: jest.fn()
    }
  },
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn()
  },
  runtime: {
    lastError: null
  }
};

// Mock Chrome AI API
global.window = global.window || {};
global.window.ai = {
  languageModel: {
    capabilities: jest.fn().mockResolvedValue({
      available: 'readily'
    }),
    create: jest.fn().mockResolvedValue({
      prompt: jest.fn().mockResolvedValue('A descriptive alt text for the image'),
      destroy: jest.fn()
    })
  }
};

// Mock LanguageModel global for content.js
global.LanguageModel = {
  availability: jest.fn().mockResolvedValue('readily'),
  create: jest.fn().mockResolvedValue({
    prompt: jest.fn().mockResolvedValue('A descriptive alt text for the image'),
    destroy: jest.fn()
  })
};

// Mock createImageBitmap
global.createImageBitmap = jest.fn().mockImplementation((blob) => {
  return Promise.resolve({});
});

// Mock fetch for image loading
global.fetch = jest.fn().mockImplementation((url) => {
  return Promise.resolve({
    blob: () => Promise.resolve(new Blob())
  });
});

// Override createElement to automatically mock getBoundingClientRect for images
const originalCreateElement = document.createElement.bind(document);
document.createElement = function(tagName) {
  const element = originalCreateElement(tagName);
  if (tagName.toLowerCase() === 'img') {
    // Auto-mock getBoundingClientRect for img elements
    // Use Object.defineProperty to make it writable but return dynamic values
    Object.defineProperty(element, 'getBoundingClientRect', {
      writable: true,
      configurable: true,
      value: jest.fn(function() {
        return {
          width: element.naturalWidth || 0,
          height: element.naturalHeight || 0,
          top: 0,
          left: 0,
          bottom: element.naturalHeight || 0,
          right: element.naturalWidth || 0
        };
      })
    });
  }
  return element;
};

// Mock console methods to reduce test noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Polyfill for Popover API (not supported in JSDOM)
HTMLElement.prototype.showPopover = function() {
  this.style.display = 'block';
  this.dispatchEvent(new Event('toggle'));
};

HTMLElement.prototype.hidePopover = function() {
  this.style.display = 'none';
  this.dispatchEvent(new Event('toggle'));
};

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  }
});