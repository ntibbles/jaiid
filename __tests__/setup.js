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

// Mock console methods to reduce test noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
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