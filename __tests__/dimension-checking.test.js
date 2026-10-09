/**
 * Unit tests for dual dimension checking (natural and rendered)
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Read the actual content.js file
const contentScript = fs.readFileSync(
  path.join(__dirname, '../content.js'),
  'utf8'
);

describe('Dual Dimension Checking - Natural and Rendered', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;
  });

  test('should reject image with rendered width >= 1500px', () => {
    const img = document.createElement('img');
    img.src = 'test.jpg';
    
    // Natural dimensions: 800x300 (eligible)
    Object.defineProperty(img, 'naturalWidth', { value: 800, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 1600x300 (too wide - scaled up with CSS)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 1600,
      height: 300,
      top: 100,
      left: 100,
      bottom: 400,
      right: 1700
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(0);
  });

  test('should handle image exactly at minimum dimensions (125x125)', () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    
    // Natural dimensions: 125x125 (exactly minimum)
    Object.defineProperty(img, 'naturalWidth', { value: 125, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 125, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 125x125 (exactly minimum)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 125,
      height: 125,
      top: 100,
      left: 100,
      bottom: 225,
      right: 225
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(1);
  });

  test('should handle image exactly at maximum width (1499px)', () => {
    const img = document.createElement('img');
    img.src = 'test.webp';
    
    // Natural dimensions: 1499x300 (just under maximum)
    Object.defineProperty(img, 'naturalWidth', { value: 1499, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 1499x300 (just under maximum)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 1499,
      height: 300,
      top: 100,
      left: 100,
      bottom: 400,
      right: 1599
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(1);
  });

  test('should handle image one pixel below minimum (124x124)', () => {
    const img = document.createElement('img');
    img.src = 'test.jpg';
    
    // Natural dimensions: 124x124 (one pixel too small)
    Object.defineProperty(img, 'naturalWidth', { value: 124, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 124, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 124x124 (one pixel too small)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 124,
      height: 124,
      top: 100,
      left: 100,
      bottom: 224,
      right: 224
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(0);
  });

  test('should handle responsive image scaled down by CSS', () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    
    // Natural dimensions: 1200x800 (eligible)
    Object.defineProperty(img, 'naturalWidth', { value: 1200, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 800, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 300x200 (scaled down by CSS, still eligible)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300,
      height: 200,
      top: 100,
      left: 100,
      bottom: 300,
      right: 400
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(1);
  });

  test('should reject thumbnail with good natural size but tiny rendered size', () => {
    const img = document.createElement('img');
    img.src = 'test.jpg';
    
    // Natural dimensions: 800x600 (eligible)
    Object.defineProperty(img, 'naturalWidth', { value: 800, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 600, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 50x50 (thumbnail, too small)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 50,
      height: 50,
      top: 100,
      left: 100,
      bottom: 150,
      right: 150
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(0);
  });

  test('should handle portrait orientation images', () => {
    const img = document.createElement('img');
    img.src = 'test.webp';
    
    // Natural dimensions: 400x800 (portrait, eligible)
    Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 800, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 200x400 (portrait, scaled down, eligible)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 200,
      height: 400,
      top: 100,
      left: 100,
      bottom: 500,
      right: 300
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(1);
  });

  test('should reject landscape image with height too small in rendered', () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    
    // Natural dimensions: 800x200 (eligible)
    Object.defineProperty(img, 'naturalWidth', { value: 800, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 200, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 500x100 (height too small)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 500,
      height: 100,
      top: 100,
      left: 100,
      bottom: 200,
      right: 600
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(0);
  });

  test('should process multiple images with varying dimensions', () => {
    // Eligible image 1
    const img1 = document.createElement('img');
    img1.src = 'test1.png';
    Object.defineProperty(img1, 'naturalWidth', { value: 400, configurable: true });
    Object.defineProperty(img1, 'naturalHeight', { value: 400, configurable: true });
    Object.defineProperty(img1, 'complete', { value: true, configurable: true });
    img1.getBoundingClientRect = jest.fn().mockReturnValue({ width: 300, height: 300, top: 0, left: 0, bottom: 300, right: 300 });
    document.body.appendChild(img1);

    // Ineligible image (rendered too small)
    const img2 = document.createElement('img');
    img2.src = 'test2.jpg';
    Object.defineProperty(img2, 'naturalWidth', { value: 600, configurable: true });
    Object.defineProperty(img2, 'naturalHeight', { value: 600, configurable: true });
    Object.defineProperty(img2, 'complete', { value: true, configurable: true });
    img2.getBoundingClientRect = jest.fn().mockReturnValue({ width: 80, height: 80, top: 0, left: 0, bottom: 80, right: 80 });
    document.body.appendChild(img2);

    // Eligible image 2
    const img3 = document.createElement('img');
    img3.src = 'test3.webp';
    Object.defineProperty(img3, 'naturalWidth', { value: 500, configurable: true });
    Object.defineProperty(img3, 'naturalHeight', { value: 500, configurable: true });
    Object.defineProperty(img3, 'complete', { value: true, configurable: true });
    img3.getBoundingClientRect = jest.fn().mockReturnValue({ width: 450, height: 450, top: 0, left: 0, bottom: 450, right: 450 });
    document.body.appendChild(img3);

    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(2);
  });

  test('should reject image with zero rendered dimensions (hidden)', () => {
    const img = document.createElement('img');
    img.src = 'test.png';
    
    // Natural dimensions: 400x400 (eligible)
    Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered dimensions: 0x0 (hidden with display:none or similar)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(0);
  });
});

describe('Dimension Checking - Edge Cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.aiAltTextInjected = false;
  });

  test('should handle fractional rendered dimensions', () => {
    const img = document.createElement('img');
    img.src = 'test.jpg';
    
    Object.defineProperty(img, 'naturalWidth', { value: 300, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 300, configurable: true });
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    
    // Rendered with fractional pixels (common with responsive designs)
    img.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 124.5,
      height: 124.5,
      top: 100,
      left: 100,
      bottom: 224.5,
      right: 224.5
    });
    
    document.body.appendChild(img);
    eval(contentScript);

    // 124.5 < 125, so should be rejected
    const processedImages = document.querySelectorAll('[data-ai-alt-processed="true"]');
    expect(processedImages.length).toBe(0);
  });
});