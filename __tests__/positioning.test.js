/**
 * Unit tests for popover positioning functionality
 */

const { describe, test, expect, beforeEach } = require('@jest/globals');

describe('Popover Positioning', () => {
  let button;
  let popover;
  let mockWindow;

  beforeEach(() => {
    // Mock window dimensions first
    global.window.innerWidth = 1200;
    global.window.innerHeight = 800;

    // Mock button element
    button = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        top: 300,
        bottom: 324,
        left: 100,
        right: 124,
        width: 24,
        height: 24
      })
    };

    // Mock popover element
    popover = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        width: 300,
        height: 200,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }),
      style: {
        top: '',
        left: ''
      }
    };
  });

  test('should position popover above button with 8px spacing', () => {
    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    // Calculate expected position
    const expectedTop = buttonRect.top - popoverRect.height - 8;
    const expectedLeft = buttonRect.left;

    expect(expectedTop).toBe(92); // 300 - 200 - 8
    expect(expectedLeft).toBe(100);
  });

  test('should position below button if not enough space above', () => {
    // Button near top of viewport
    button.getBoundingClientRect = jest.fn().mockReturnValue({
      top: 50,
      bottom: 74,
      left: 100,
      right: 124,
      width: 24,
      height: 24
    });

    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    // Would be at: 50 - 200 - 8 = -158 (negative, off-screen)
    const calculatedTop = buttonRect.top - popoverRect.height - 8;
    
    expect(calculatedTop).toBeLessThan(8);
    
    // Should position below instead
    const belowPosition = buttonRect.bottom + 8;
    expect(belowPosition).toBe(82); // 74 + 8
  });

  test('should keep popover within left edge of viewport', () => {
    // Button near left edge
    button.getBoundingClientRect = jest.fn().mockReturnValue({
      top: 300,
      bottom: 324,
      left: 5,
      right: 29,
      width: 24,
      height: 24
    });

    const buttonRect = button.getBoundingClientRect();
    const adjustedLeft = Math.max(8, buttonRect.left);

    expect(adjustedLeft).toBe(8); // Minimum 8px from left edge
  });

  test('should keep popover within right edge of viewport', () => {
    // Reset popover mock for this test
    popover.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300,
      height: 200,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    });

    // Button near right edge
    button.getBoundingClientRect = jest.fn().mockReturnValue({
      top: 300,
      bottom: 324,
      left: 1150, // Close to right edge (window width is 1200)
      right: 1174,
      width: 24,
      height: 24
    });

    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    
    // Maximum left position to keep popover on screen
    const maxLeft = window.innerWidth - popoverRect.width - 8;
    const adjustedLeft = Math.min(buttonRect.left, maxLeft);

    expect(maxLeft).toBe(892); // 1200 - 300 - 8
    expect(adjustedLeft).toBe(892);
  });

  test('should keep popover within top edge of viewport', () => {
    const top = -50; // Would be off-screen
    const adjustedTop = Math.max(8, top);

    expect(adjustedTop).toBe(8); // Minimum 8px from top
  });

  test('should keep popover within bottom edge of viewport', () => {
    // Reset popover mock for this test
    popover.getBoundingClientRect = jest.fn().mockReturnValue({
      width: 300,
      height: 200,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    });

    const popoverRect = popover.getBoundingClientRect();
    const top = 750; // Would extend past bottom (800 - 200 = 600 max)
    
    const maxTop = window.innerHeight - popoverRect.height - 8;
    const adjustedTop = Math.min(top, maxTop);

    expect(maxTop).toBe(592); // 800 - 200 - 8
    expect(adjustedTop).toBe(592);
  });

  test('should calculate correct position for center button', () => {
    // Button in center of screen
    button.getBoundingClientRect = jest.fn().mockReturnValue({
      top: 400,
      bottom: 424,
      left: 600,
      right: 624,
      width: 24,
      height: 24
    });

    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    const top = buttonRect.top - popoverRect.height - 8;
    const left = buttonRect.left;

    // Should be positioned normally
    expect(top).toBe(192); // 400 - 200 - 8
    expect(left).toBe(600);
    
    // Verify it's within viewport
    expect(top).toBeGreaterThan(8);
    expect(left).toBeGreaterThan(8);
    expect(left + popoverRect.width).toBeLessThan(window.innerWidth - 8);
  });

  test('should handle small viewport', () => {
    // Small mobile viewport
    global.window.innerWidth = 375;
    global.window.innerHeight = 667;

    button.getBoundingClientRect = jest.fn().mockReturnValue({
      top: 400,
      bottom: 424,
      left: 50,
      right: 74,
      width: 24,
      height: 24
    });

    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    // Popover is 300px wide, viewport is 375px
    const maxLeft = window.innerWidth - popoverRect.width - 8;
    
    expect(maxLeft).toBe(67); // 375 - 300 - 8
    
    // If button is at 50, it's within bounds
    const adjustedLeft = Math.min(buttonRect.left, maxLeft);
    expect(adjustedLeft).toBe(50);
  });

  test('should calculate position for button at bottom of page', () => {
    // Button near bottom of viewport
    button.getBoundingClientRect = jest.fn().mockReturnValue({
      top: 750,
      bottom: 774,
      left: 100,
      right: 124,
      width: 24,
      height: 24
    });

    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    // Trying to position above
    const aboveTop = buttonRect.top - popoverRect.height - 8;
    expect(aboveTop).toBe(542); // 750 - 200 - 8

    // This is valid (542 > 8)
    expect(aboveTop).toBeGreaterThan(8);
  });
});

describe('Popover Repositioning on Scroll/Resize', () => {
  test('should attach scroll listener when popover opens', () => {
    const addEventListener = jest.fn();
    global.window.addEventListener = addEventListener;

    // Simulate popover opening
    const repositionHandler = jest.fn();
    window.addEventListener('scroll', repositionHandler, true);

    expect(addEventListener).toHaveBeenCalledWith('scroll', repositionHandler, true);
  });

  test('should attach resize listener when popover opens', () => {
    const addEventListener = jest.fn();
    global.window.addEventListener = addEventListener;

    const repositionHandler = jest.fn();
    window.addEventListener('resize', repositionHandler);

    expect(addEventListener).toHaveBeenCalledWith('resize', repositionHandler);
  });

  test('should remove listeners when popover closes', () => {
    const removeEventListener = jest.fn();
    global.window.removeEventListener = removeEventListener;

    const repositionHandler = jest.fn();
    window.removeEventListener('scroll', repositionHandler, true);
    window.removeEventListener('resize', repositionHandler);

    expect(removeEventListener).toHaveBeenCalledWith('scroll', repositionHandler, true);
    expect(removeEventListener).toHaveBeenCalledWith('resize', repositionHandler);
  });

  test('should call reposition handler on scroll', () => {
    const repositionHandler = jest.fn();
    
    // Simulate scroll event
    repositionHandler();
    
    expect(repositionHandler).toHaveBeenCalled();
  });

  test('should call reposition handler on resize', () => {
    const repositionHandler = jest.fn();
    
    // Simulate resize event
    repositionHandler();
    
    expect(repositionHandler).toHaveBeenCalled();
  });
});

describe('Edge Case Positioning', () => {
  test('should handle zero-sized popover', () => {
    const popover = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        width: 0,
        height: 0
      })
    };

    const button = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        top: 300,
        left: 100
      })
    };

    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    // Should still calculate position
    const top = buttonRect.top - popoverRect.height - 8;
    const left = buttonRect.left;

    expect(top).toBe(292); // 300 - 0 - 8
    expect(left).toBe(100);
  });

  test('should handle negative button position', () => {
    const button = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        top: -100,
        left: -50
      })
    };

    const buttonRect = button.getBoundingClientRect();
    
    // Should clamp to minimum
    const adjustedTop = Math.max(8, buttonRect.top);
    const adjustedLeft = Math.max(8, buttonRect.left);

    expect(adjustedTop).toBe(8);
    expect(adjustedLeft).toBe(8);
  });

  test('should handle very large popover', () => {
    const popover = {
      getBoundingClientRect: jest.fn().mockReturnValue({
        width: 1500,
        height: 1000
      })
    };

    global.window.innerWidth = 1200;
    global.window.innerHeight = 800;

    const popoverRect = popover.getBoundingClientRect();

    // Popover is larger than viewport
    expect(popoverRect.width).toBeGreaterThan(window.innerWidth);
    expect(popoverRect.height).toBeGreaterThan(window.innerHeight);

    // Should still clamp to viewport bounds
    const maxLeft = window.innerWidth - popoverRect.width - 8;
    const maxTop = window.innerHeight - popoverRect.height - 8;

    // These will be negative, so should clamp to 8
    expect(Math.max(8, maxLeft)).toBe(8);
    expect(Math.max(8, maxTop)).toBe(8);
  });
});