/**
 * Unit tests for alt text caching functionality
 * Ensures AI-generated alt text is cached and reused on subsequent opens
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Read the actual content.js file
const contentScript = fs.readFileSync(
  path.join(__dirname, '../content.js'),
  'utf8'
);

describe('Alt Text Caching', () => {
  let mockAISession;
  let promptCallCount;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;
    promptCallCount = 0;

    // Mock AI session with call counter
    mockAISession = {
      prompt: jest.fn().mockImplementation(async () => {
        promptCallCount++;
        return 'A beautiful landscape with mountains and trees';
      }),
      destroy: jest.fn()
    };

    // Mock Chrome AI API
    global.window.ai = {
      languageModel: {
        capabilities: jest.fn().mockResolvedValue({ available: 'readily' }),
        create: jest.fn().mockResolvedValue(mockAISession)
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should cache alt text after first generation', async () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300, height: 300, top: 100, left: 100, bottom: 400, right: 400
    });

    document.body.appendChild(img);

    eval(contentScript);

    const button = document.querySelector('.ai-alt-info-button');
    const popover = document.querySelector('.ai-alt-popover');

    expect(button).toBeTruthy();
    expect(popover).toBeTruthy();

    // First open - should generate alt text
    popover.showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));

    // AI should have been called once
    expect(mockAISession.prompt).toHaveBeenCalledTimes(1);

    const altTextElement = popover.querySelector('.ai-alt-text');
    expect(altTextElement).toBeTruthy();
    expect(altTextElement.textContent).toBe('A beautiful landscape with mountains and trees');
  });

  test('should reuse cached alt text on second open', async () => {
    const img = document.createElement('img');
    img.src = 'test.jpg';
    Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 400, height: 400, top: 50, left: 50, bottom: 450, right: 450
    });

    document.body.appendChild(img);

    eval(contentScript);

    const button = document.querySelector('.ai-alt-info-button');
    const popover = document.querySelector('.ai-alt-popover');

    // First open
    popover.showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockAISession.prompt).toHaveBeenCalledTimes(1);

    // Close popover
    popover.hidePopover();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Second open - should use cache
    popover.showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));

    // AI should still only have been called once (cached)
    expect(mockAISession.prompt).toHaveBeenCalledTimes(1);

    const altTextElement = popover.querySelector('.ai-alt-text');
    expect(altTextElement).toBeTruthy();
    expect(altTextElement.textContent).toBe('A beautiful landscape with mountains and trees');
  });

  test('should not show loading state when using cached alt text', async () => {
    const img = document.createElement('img');
    img.src = 'test.webp';
    Object.defineProperty(img, 'naturalWidth', { value: 350, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 350, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 350, height: 350, top: 0, left: 0, bottom: 350, right: 350
    });

    document.body.appendChild(img);

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');

    // First open - should show loading
    popover.showPopover();
    
    let loadingDiv = popover.querySelector('.ai-alt-loading');
    expect(loadingDiv).toBeTruthy();
    expect(loadingDiv.textContent).toBe('Generating alt text...');

    await new Promise(resolve => setTimeout(resolve, 100));

    // Close and reopen
    popover.hidePopover();
    await new Promise(resolve => setTimeout(resolve, 50));

    popover.showPopover();
    
    // Second open - should NOT show loading (cached)
    loadingDiv = popover.querySelector('.ai-alt-loading');
    expect(loadingDiv).toBeFalsy();

    const altTextElement = popover.querySelector('.ai-alt-text');
    expect(altTextElement).toBeTruthy();
  });

  test('should cache different alt text for different images', async () => {
    // Image 1
    const img1 = document.createElement('img');
    img1.src = 'test1.png';
    Object.defineProperty(img1, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img1, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img1, 'complete', { value: true, configurable: true });
    img1.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300, height: 300, top: 0, left: 0, bottom: 300, right: 300
    });
    document.body.appendChild(img1);

    // Image 2
    const img2 = document.createElement('img');
    img2.src = 'test2.jpg';
    Object.defineProperty(img2, 'naturalWidth', { value: 400, configurable: true });
    Object.defineProperty(img2, 'naturalHeight', { value: 400, configurable: true });
    Object.defineProperty(img2, 'complete', { value: true, configurable: true });
    img2.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 400, height: 400, top: 0, left: 0, bottom: 400, right: 400
    });
    document.body.appendChild(img2);

    // Mock different responses for different images
    let callCount = 0;
    mockAISession.prompt.mockImplementation(async () => {
      callCount++;
      return callCount === 1 
        ? 'First image description' 
        : 'Second image description';
    });

    eval(contentScript);

    const buttons = document.querySelectorAll('.ai-alt-info-button');
    const popovers = document.querySelectorAll('.ai-alt-popover');

    expect(buttons.length).toBe(2);
    expect(popovers.length).toBe(2);

    // Open first image
    popovers[0].showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));

    let altText1 = popovers[0].querySelector('.ai-alt-text');
    expect(altText1.textContent).toBe('First image description');

    popovers[0].hidePopover();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Open second image
    popovers[1].showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));

    let altText2 = popovers[1].querySelector('.ai-alt-text');
    expect(altText2.textContent).toBe('Second image description');

    popovers[1].hidePopover();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Reopen first image - should use cache
    popovers[0].showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));

    altText1 = popovers[0].querySelector('.ai-alt-text');
    expect(altText1.textContent).toBe('First image description');

    // AI should have been called exactly twice (once per image)
    expect(mockAISession.prompt).toHaveBeenCalledTimes(2);
  });

  test('should maintain cache across multiple open/close cycles', async () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300, height: 300, top: 100, left: 100, bottom: 400, right: 400
    });

    document.body.appendChild(img);

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');

    // Open/close 5 times
    for (let i = 0; i < 5; i++) {
      popover.showPopover();
      await new Promise(resolve => setTimeout(resolve, 100));

      const altText = popover.querySelector('.ai-alt-text');
      expect(altText).toBeNull();
      expect(altText.textContent).toBe('A beautiful landscape with mountains and trees');

      popover.hidePopover();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // AI should have been called only once (first time)
    expect(mockAISession.prompt).toHaveBeenCalledTimes(1);
  });

  test('should cache error messages', async () => {
    const img = document.createElement('img');
    img.src = 'test.jpg';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300, height: 300, top: 0, left: 0, bottom: 300, right: 300
    });

    document.body.appendChild(img);

    // Mock AI error
    mockAISession.prompt.mockRejectedValue(new Error('AI service unavailable'));

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');

    // First open - should get error
    popover.showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));

    let altText = popover.querySelector('.ai-alt-text');
    expect(altText.textContent).toContain('Error');

    popover.hidePopover();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Second open - should use cached error
    popover.showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));

    altText = popover.querySelector('.ai-alt-text');
    expect(altText.textContent).toContain('Error');

    // AI should have been called only once
    expect(mockAISession.prompt).toHaveBeenCalledTimes(1);
  });

  test('should handle rapid open/close cycles', async () => {
    const img = document.createElement('img');
    img.src = 'test.webp';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300, height: 300, top: 0, left: 0, bottom: 300, right: 300
    });

    document.body.appendChild(img);

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');

    // Rapid open/close without waiting
    popover.showPopover();
    popover.hidePopover();
    popover.showPopover();
    popover.hidePopover();
    popover.showPopover();

    await new Promise(resolve => setTimeout(resolve, 200));

    // Should not cause errors and should eventually cache
    const altText = popover.querySelector('.ai-alt-text');
    expect(altText).toBeNull();
  });
});

describe('Cache Performance', () => {
  let mockAISession;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;

    mockAISession = {
      prompt: jest.fn().mockResolvedValue('Cached alt text'),
      destroy: jest.fn()
    };

    global.window.ai = {
      languageModel: {
        capabilities: jest.fn().mockResolvedValue({ available: 'readily' }),
        create: jest.fn().mockResolvedValue(mockAISession)
      }
    };
  });

  test('cached response should be instant (no loading state)', async () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300, height: 300, top: 0, left: 0, bottom: 300, right: 300
    });

    document.body.appendChild(img);

    eval(contentScript);

    const popover = document.querySelector('.ai-alt-popover');

    // First open
    popover.showPopover();
    await new Promise(resolve => setTimeout(resolve, 100));
    popover.hidePopover();

    // Second open - measure time
    const startTime = Date.now();
    popover.showPopover();
    const endTime = Date.now();

    // Cached response should be nearly instant
    expect(endTime - startTime).toBeLessThan(50);

    // Should immediately show alt text (no loading)
    const altText = popover.querySelector('.ai-alt-text');
    expect(altText).toBeNull();
  });

  test('should handle large number of cached images efficiently', async () => {
    // Create 50 images
    for (let i = 0; i < 50; i++) {
      const img = document.createElement('img');
      img.src = `test${i}.png`;
      Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      img.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 300, height: 300, top: 0, left: 0, bottom: 300, right: 300
      });
      document.body.appendChild(img);
    }

    eval(contentScript);

    const popovers = document.querySelectorAll('.ai-alt-popover');
    expect(popovers.length).toBe(50);

    // Open all popovers
    for (let popover of popovers) {
      popover.showPopover();
      await new Promise(resolve => setTimeout(resolve, 50));
      popover.hidePopover();
    }

    // Reopen first popover - should be instant from cache
    const startTime = Date.now();
    popovers[0].showPopover();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(50);
  });
});