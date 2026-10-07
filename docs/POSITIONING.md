# Popover Positioning Guide

This document explains how the jaiid (Just AI image descriptions) extension positions popovers relative to their trigger buttons.

## Overview

The popover dialog is dynamically positioned using JavaScript to appear **above** the info button that triggers it, with intelligent edge detection to keep it within the viewport.

## Positioning Strategy

### Default Position: Above Button

```
┌─────────────────────┐
│   Popover Dialog    │  ← 8px spacing
│  (Alt Text Here)    │
└─────────────────────┘
         ↑
        [i]  ← Info Button (24x24px)
```

**Calculation:**
```javascript
top = buttonRect.top - popoverRect.height - 8
left = buttonRect.left
```

### Fallback Position: Below Button

If there's not enough space above (top < 8px), the popover appears below:

```
        [i]  ← Info Button
         ↓
┌─────────────────────┐
│   Popover Dialog    │  ← 8px spacing
│  (Alt Text Here)    │
└─────────────────────┘
```

**Calculation:**
```javascript
if (top < 8) {
  top = buttonRect.bottom + 8
}
```

## Viewport Edge Detection

### Top Edge

Minimum 8px from top of viewport:

```
┌─────────────────────────────┐ ← Viewport top
│ 8px margin                  │
├─────────────────────────────┤
│ ┌─────────────────────┐     │
│ │   Popover Dialog    │     │
│ └─────────────────────┘     │
│          [i]                │
```

**Code:**
```javascript
top = Math.max(8, calculatedTop)
```

### Bottom Edge

Minimum 8px from bottom of viewport:

```
│          [i]                │
│ ┌─────────────────────┐     │
│ │   Popover Dialog    │     │
│ └─────────────────────┘     │
├─────────────────────────────┤
│ 8px margin                  │
└─────────────────────────────┘ ← Viewport bottom
```

**Code:**
```javascript
const maxTop = window.innerHeight - popoverRect.height - 8
top = Math.min(top, maxTop)
```

### Left Edge

Minimum 8px from left edge:

```
┌──┬──────────────────────────┐
│8 │┌─────────────────────┐   │
│px││   Popover Dialog    │   │
│  │└─────────────────────┘   │
│  │  [i]                     │
└──┴──────────────────────────┘
```

**Code:**
```javascript
left = Math.max(8, buttonRect.left)
```

### Right Edge

Minimum 8px from right edge:

```
┌──────────────────────────┬──┐
│   ┌─────────────────────┐│8 │
│   │   Popover Dialog    ││px│
│   └─────────────────────┘│  │
│                     [i]  │  │
└──────────────────────────┴──┘
```

**Code:**
```javascript
const maxLeft = window.innerWidth - popoverRect.width - 8
left = Math.min(left, maxLeft)
```

## Dynamic Repositioning

The popover automatically repositions when:

### Scroll Events

```javascript
window.addEventListener('scroll', repositionHandler, true)
```

**Why:** User scrolls page, button moves, popover should follow

**Capture phase (`true`):** Catches scroll on any element, not just window

### Resize Events

```javascript
window.addEventListener('resize', repositionHandler)
```

**Why:** Window size changes, need to recalculate viewport boundaries

### Cleanup

Listeners are removed when popover closes:

```javascript
popover.addEventListener('toggle', () => {
  if (event.newState === 'closed') {
    window.removeEventListener('scroll', repositionHandler, true)
    window.removeEventListener('resize', repositionHandler)
  }
}, { once: true })
```

## Implementation Details

### Position Function

```javascript
function positionPopover(popover, button) {
  const buttonRect = button.getBoundingClientRect()
  const popoverRect = popover.getBoundingClientRect()
  
  // Default: above button
  let top = buttonRect.top - popoverRect.height - 8
  let left = buttonRect.left
  
  // Fallback: below if not enough space above
  if (top < 8) {
    top = buttonRect.bottom + 8
  }
  
  // Keep within horizontal bounds
  const maxLeft = window.innerWidth - popoverRect.width - 8
  left = Math.max(8, Math.min(left, maxLeft))
  
  // Keep within vertical bounds
  const maxTop = window.innerHeight - popoverRect.height - 8
  top = Math.max(8, Math.min(top, maxTop))
  
  // Apply styles
  popover.style.top = `${top}px`
  popover.style.left = `${left}px`
}
```

### CSS Setup

Popover uses fixed positioning:

```css
.ai-alt-popover {
  position: fixed;
  z-index: 10000;
  inset: unset; /* Override browser defaults */
}
```

**Why fixed?**
- Positions relative to viewport, not parent element
- Stays in place even if parent scrolls
- Easier to calculate with `getBoundingClientRect()`

## Edge Cases

### Small Viewports (Mobile)

**Problem:** Popover (300px min-width) wider than viewport (e.g., 375px)

**Solution:**
```javascript
// Popover will be positioned at left: 8px
// May extend slightly off right edge on very small screens
// Still functional and readable
```

**Future improvement:** Add max-width: calc(100vw - 16px)

### Button at Bottom of Page

**Scenario:** Button at y=750, viewport height=800, popover height=200

**Calculation:**
```javascript
// Above: 750 - 200 - 8 = 542 ✓ (valid, > 8)
top = 542
```

**Result:** Positioned above, plenty of room

### Button at Top of Page

**Scenario:** Button at y=50, popover height=200

**Calculation:**
```javascript
// Above: 50 - 200 - 8 = -158 ✗ (invalid, < 8)
// Below: 74 + 8 = 82 ✓
top = 82
```

**Result:** Positioned below button

### Very Large Popover

**Scenario:** Popover height=600, viewport height=800

**Solution:**
```javascript
// maxTop = 800 - 600 - 8 = 192
// If calculated top > 192, clamp to 192
// Popover fits in viewport with 8px margins
```

### Popover Larger Than Viewport

**Scenario:** Popover height=900, viewport height=800

**Solution:**
```javascript
// maxTop = 800 - 900 - 8 = -108
// Math.max(8, -108) = 8
top = 8 // Aligned to top, will require scrolling
```

**Note:** This shouldn't happen with current popover design (max ~250px height)

## Performance Considerations

### Reposition Throttling

**Current:** Every scroll/resize event triggers repositioning

**Future Optimization:**
```javascript
let rafId = null
const repositionHandler = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    positionPopover(popover, button)
    rafId = null
  })
}
```

**Benefits:**
- Limits to 60fps max
- Reduces layout thrashing
- Improves scroll performance

### Cached Measurements

**Current:** `getBoundingClientRect()` called on every reposition

**Optimization:** Cache viewport size, only recalculate on resize

```javascript
let viewportWidth = window.innerWidth
let viewportHeight = window.innerHeight

window.addEventListener('resize', () => {
  viewportWidth = window.innerWidth
  viewportHeight = window.innerHeight
  repositionHandler()
})
```

## Browser Compatibility

### Fixed Positioning
✅ All modern browsers
✅ IE11+

### getBoundingClientRect()
✅ All browsers
✅ Returns values relative to viewport

### Popover API
⚠️ Chrome 114+
❌ Firefox (in development)
❌ Safari (not yet)

**Fallback:** Entire extension requires Popover API, so positioning compatibility matches popover support

## Accessibility Considerations

### Screen Reader Announcements

- Position changes don't trigger announcements
- Only content changes are announced
- `aria-live="polite"` on content area

### Keyboard Navigation

- Focus remains on trigger button when popover opens
- Tab moves focus into popover
- Escape closes popover (handled by Popover API)

### High Contrast Mode

- Positioning unaffected by color/contrast settings
- Borders and shadows still visible

### Zoom Levels

**Behavior:**
- `getBoundingClientRect()` returns zoomed values
- Positioning calculations work correctly
- Popover scales with page zoom

## Testing Checklist

- [ ] Popover appears above button (default)
- [ ] Popover appears below when near top edge
- [ ] Popover stays within left edge
- [ ] Popover stays within right edge
- [ ] Popover stays within top edge
- [ ] Popover stays within bottom edge
- [ ] Repositions on scroll
- [ ] Repositions on resize
- [ ] Event listeners removed on close
- [ ] Works on mobile viewports
- [ ] Works with page zoom
- [ ] Works with multiple popovers on same page

## Debugging

### Console Logging

Add to `positionPopover()` function:

```javascript
console.log('Positioning popover:', {
  buttonRect,
  popoverRect,
  calculatedTop: top,
  calculatedLeft: left,
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  }
})
```

### Visual Debugging

Add temporary outline:

```css
.ai-alt-popover {
  outline: 2px solid red;
}

.ai-alt-info-button {
  outline: 2px solid blue;
}
```

### DevTools

1. Open popover
2. Inspect popover element
3. Check computed styles for `top` and `left`
4. Verify `position: fixed`
5. Check z-index stacking

## Known Issues

### Issue: Popover flickers on fast scroll

**Cause:** Position calculated before popover renders

**Status:** Minor visual issue, functionally works

**Fix:** Use `requestAnimationFrame` throttling (future)

### Issue: Very wide popovers on mobile

**Cause:** Min-width 300px, some phones are 320px

**Impact:** 12px total margin instead of 16px

**Fix:** Consider reducing min-width or using `max-width: 100vw`

## Future Enhancements

1. **Smart positioning:** Detect available space in all 4 directions, choose best
2. **Arrow indicator:** Visual arrow pointing to trigger button
3. **Smooth transitions:** Animate position changes
4. **Viewport detection:** Different positioning strategy for mobile
5. **Accessibility option:** Prefer below/above based on screen reader user preference

---

**Questions about positioning?** Open an issue on GitHub.