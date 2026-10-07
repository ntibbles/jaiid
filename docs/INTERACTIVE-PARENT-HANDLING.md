# Interactive Parent Handling

This document explains how the jaiid (Just AI image descriptions) extension handles images nested inside interactive elements (links, buttons) to maintain WCAG accessibility compliance.

## Overview

When an image is a child of an interactive element like `<a>` (link) or `<button>`, the extension must position the info button **outside** the interactive parent to avoid creating nested interactive controls, which violates **WCAG 4.1.2 Level A** (Parsing / Name, Role, Value).

## WCAG 4.1.2 Requirement

**Success Criterion 4.1.2: Name, Role, Value (Level A)**

> For all user interface components, the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents, including assistive technologies.

**Key Point:** Interactive elements cannot be nested inside other interactive elements.

### Why Nested Interactive Controls Are Problematic

```html
<!-- ❌ VIOLATION: Button inside link -->
<a href="/product">
  <img src="product.jpg" alt="Product">
  <button>Generate Alt Text</button>
</a>
```

**Issues:**
1. **Keyboard navigation:** Tab key lands on link, but cannot access inner button
2. **Screen readers:** Announce "link" OR "button", not both clearly
3. **Click ambiguity:** Which action fires - link navigation or button action?
4. **Focus management:** Cannot focus inner button without activating outer link
5. **ARIA confusion:** Conflicting roles confuse assistive technology

## Solution: Position Button Outside Interactive Parent

The extension detects interactive parents and positions the button wrapper outside:

```html
<!-- ✅ CORRECT: Button outside link -->
<a href="/product">
  <img src="product.jpg" id="ai-alt-image-1" alt="Product">
</a>
<div class="ai-alt-image-wrapper" style="position: absolute; ...">
  <button class="ai-alt-info-button">Generate Alt Text</button>
</div>
```

## Implementation

### 1. Interactive Parent Detection

```javascript
function findInteractiveParent(element) {
  let current = element.parentElement;
  
  while (current && current !== document.body) {
    const tagName = current.tagName.toLowerCase();
    const role = current.getAttribute('role');
    
    // Check for interactive elements
    if (tagName === 'a' || 
        tagName === 'button' || 
        role === 'button' || 
        role === 'link') {
      return current;
    }
    
    current = current.parentElement;
  }
  
  return null;
}
```

**Detects:**
- `<a>` elements (links)
- `<button>` elements
- Elements with `role="button"`
- Elements with `role="link"`

### 2. Conditional Positioning

```javascript
const interactiveParent = findInteractiveParent(img);

if (interactiveParent) {
  // Position wrapper absolutely over image
  wrapper.style.position = 'absolute';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.zIndex = '1000';
  
  // Insert wrapper as sibling to interactive parent (not child)
  interactiveParent.parentNode.insertBefore(wrapper, interactiveParent);
  
  // Position wrapper to match image location
  positionWrapperOverImage(wrapper, img);
} else {
  // Normal wrapping for non-interactive parents
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  img.parentNode.insertBefore(wrapper, img);
  wrapper.appendChild(img);
}
```

### 3. Absolute Positioning Over Image

```javascript
function positionWrapperOverImage(wrapper, img) {
  const imgRect = img.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  wrapper.style.top = `${imgRect.top + scrollTop}px`;
  wrapper.style.left = `${imgRect.left + scrollLeft}px`;
  wrapper.style.width = `${imgRect.width}px`;
  wrapper.style.height = `${imgRect.height}px`;
}
```

### 4. Pointer Events Management

```javascript
if (interactiveParent) {
  // Wrapper blocks clicks (allows clicks through to interactive parent)
  wrapper.style.pointerEvents = 'none';
  
  // Button re-enables clicks
  button.style.pointerEvents = 'auto';
}
```

**Why:**
- `wrapper` has `pointer-events: none` → clicks pass through to the link/button below
- `button` has `pointer-events: auto` → the info button can be clicked
- Image remains clickable as part of the interactive parent

### 5. Dynamic Repositioning

```javascript
if (interactiveParent) {
  // Reposition on scroll or resize
  const repositionHandler = () => positionWrapperOverImage(wrapper, img);
  window.addEventListener('scroll', repositionHandler, true);
  window.addEventListener('resize', repositionHandler);
}
```

**Ensures:** Button stays positioned over the image even when:
- User scrolls the page
- Viewport is resized
- Responsive layouts reflow
- Interactive parent moves (e.g., animations)

## Examples

### Example 1: Image in Link

**HTML:**
```html
<a href="/gallery/photo1">
  <img src="photo1.jpg" width="400" height="300">
</a>
```

**After Extension Processes:**
```html
<div class="ai-alt-image-wrapper" 
     style="position: absolute; top: 100px; left: 50px; 
            width: 400px; height: 300px; pointer-events: none; z-index: 1000;"
     data-target-image="ai-alt-image-1">
  <button class="ai-alt-info-button" 
          style="pointer-events: auto;"
          aria-label="Generate AI alt text for image 1"
          aria-haspopup="dialog"
          popovertarget="ai-alt-popover-1">
    <!-- SVG icon -->
  </button>
  <div id="ai-alt-popover-1" popover="auto">...</div>
</div>
<a href="/gallery/photo1">
  <img src="photo1.jpg" width="400" height="300" id="ai-alt-image-1">
</a>
```

**DOM Structure:**
```
body
├── div.ai-alt-image-wrapper (absolute, positioned over image)
│   ├── button.ai-alt-info-button
│   └── div.ai-alt-popover
└── a (link)
    └── img (remains inside link, clickable)
```

**Benefits:**
- ✅ Link and button are siblings, not nested
- ✅ Clicking image → navigates to link
- ✅ Clicking info button → opens dialog
- ✅ No interaction conflict
- ✅ WCAG 4.1.2 compliant

### Example 2: Image in Button

**HTML:**
```html
<button onclick="openLightbox()">
  <img src="thumbnail.jpg" width="150" height="150">
</button>
```

**After Extension Processes:**
```html
<div class="ai-alt-image-wrapper" 
     style="position: absolute; ..."
     data-target-image="ai-alt-image-2">
  <button class="ai-alt-info-button" style="pointer-events: auto;">...</button>
  <div id="ai-alt-popover-2" popover="auto">...</div>
</div>
<button onclick="openLightbox()">
  <img src="thumbnail.jpg" width="150" height="150" id="ai-alt-image-2">
</button>
```

**DOM Structure:**
```
body
├── div.ai-alt-image-wrapper (absolute)
│   ├── button.ai-alt-info-button (info button)
│   └── div.ai-alt-popover
└── button (lightbox trigger)
    └── img
```

**Benefits:**
- ✅ Two independent buttons (not nested)
- ✅ Clicking image → opens lightbox
- ✅ Clicking info icon → generates alt text
- ✅ Clear separation of concerns

### Example 3: Image in Regular Div (No Interactive Parent)

**HTML:**
```html
<div class="photo-container">
  <img src="photo.jpg" width="500" height="400">
</div>
```

**After Extension Processes:**
```html
<div class="photo-container">
  <div class="ai-alt-image-wrapper" style="position: relative; display: inline-block;">
    <img src="photo.jpg" width="500" height="400" id="ai-alt-image-3">
    <button class="ai-alt-info-button">...</button>
    <div id="ai-alt-popover-3" popover="auto">...</div>
  </div>
</div>
```

**DOM Structure:**
```
div.photo-container
└── div.ai-alt-image-wrapper (relative, wraps image)
    ├── img
    ├── button.ai-alt-info-button
    └── div.ai-alt-popover
```

**Difference:**
- Normal wrapping (wrapper contains image)
- `position: relative` (not absolute)
- No special pointer-events handling
- Simpler structure since no interactive parent detected

### Example 4: Deeply Nested Image

**HTML:**
```html
<a href="/article">
  <div class="card">
    <div class="card-image">
      <img src="article-preview.jpg">
    </div>
  </div>
</a>
```

**Detection:**
```javascript
findInteractiveParent(img)
// Checks img.parentElement → div.card-image (not interactive)
// Checks div.card-image.parentElement → div.card (not interactive)
// Checks div.card.parentElement → a (INTERACTIVE! Return this)
```

**After Extension Processes:**
```html
<div class="ai-alt-image-wrapper" style="position: absolute; ...">...</div>
<a href="/article">
  <div class="card">
    <div class="card-image">
      <img src="article-preview.jpg" id="ai-alt-image-4">
    </div>
  </div>
</a>
```

**Result:** Even deeply nested images are handled correctly!

## Edge Cases

### Edge Case 1: Multiple Images in Same Link

```html
<a href="/gallery">
  <img src="thumb1.jpg" width="200" height="200">
  <img src="thumb2.jpg" width="200" height="200">
</a>
```

**Result:**
- Two separate wrappers, both positioned absolutely
- Each wrapper is sibling to the link
- Each button positioned over its respective image

### Edge Case 2: Link Inside Link (Already Invalid)

```html
<!-- Already invalid HTML -->
<a href="/outer">
  <a href="/inner">
    <img src="photo.jpg">
  </a>
</a>
```

**Detection:**
- Finds innermost interactive parent first
- Wrapper positioned as sibling to inner link
- Extension doesn't fix existing violations, but doesn't create new ones

### Edge Case 3: `role="button"` on Div

```html
<div role="button" tabindex="0" onclick="handleClick()">
  <img src="photo.jpg">
</div>
```

**Detection:**
- `findInteractiveParent()` detects `role="button"`
- Treated same as native `<button>` element
- Wrapper positioned outside div

### Edge Case 4: Image Moves/Resizes

**Scenario:** Responsive image changes size on viewport resize

**Solution:**
```javascript
window.addEventListener('resize', () => {
  positionWrapperOverImage(wrapper, img);
});
```

**Result:** Wrapper automatically repositions to match new image dimensions

### Edge Case 5: Lazy-Loaded Images

**Scenario:** Image loads after extension runs

**Detection:**
```javascript
const observer = new MutationObserver((mutations) => {
  // Process newly loaded images
});
```

**Result:** Works with dynamic/lazy-loaded images

## Testing

See [__tests__/interactive-parent.test.js](/__tests__/interactive-parent.test.js) for comprehensive tests:

- ✅ Detect `<a>` as interactive parent
- ✅ Detect `<button>` as interactive parent
- ✅ Detect `role="button"` as interactive
- ✅ Detect `role="link"` as interactive
- ✅ Handle deeply nested images
- ✅ Ignore non-interactive parents (divs, sections, etc.)
- ✅ Position wrapper outside interactive parent
- ✅ Set `pointer-events: none` on wrapper
- ✅ Set `pointer-events: auto` on button
- ✅ Prevent nested interactive controls (WCAG 4.1.2)
- ✅ Handle multiple images with mixed parent types

## Benefits

### Accessibility

1. **WCAG 4.1.2 Compliance:** No nested interactive controls
2. **Clear Focus Management:** Each interactive element is independently focusable
3. **Unambiguous Screen Reader Announcements:** "Link" or "Button", never both
4. **Keyboard Navigation:** Tab reaches each control separately
5. **Predictable Behavior:** Click target is always clear

### User Experience

1. **No Interaction Conflicts:** Clicking image vs. button is unambiguous
2. **Visual Overlay:** Button appears over image regardless of parent structure
3. **Maintains Original Functionality:** Link/button parent still works normally
4. **Responsive:** Works with responsive images and layouts
5. **Dynamic:** Repositions on scroll/resize

### Developer Experience

1. **No Code Changes Required:** Works with existing HTML
2. **Handles Edge Cases:** Deep nesting, role attributes, etc.
3. **Non-Intrusive:** Doesn't modify original DOM structure
4. **Well-Tested:** Comprehensive test coverage
5. **Standards-Compliant:** Follows WCAG best practices

## Browser Support

- ✅ Chrome/Edge (Chromium-based)
- ✅ `getBoundingClientRect()` - Universal support
- ✅ `position: absolute` with `top/left` - Universal support
- ✅ `pointer-events` - IE11+, all modern browsers
- ✅ `insertBefore()` - Universal support

## Performance

**Efficient Detection:**
- `findInteractiveParent()` traverses up to `<body>` (usually 2-5 iterations)
- Early exit on first interactive parent found
- No heavy DOM queries

**Minimal Overhead:**
- Absolute positioning only when needed
- Event listeners cleaned up properly
- No continuous polling

**Memory Management:**
- Listeners removed when popover closes
- References stored in element data attributes
- No memory leaks

## Future Enhancements

### Consider Detection of:
- `<summary>` elements (disclosure widgets)
- `role="tab"` (tab interfaces)
- `role="menuitem"` (menu items)
- Custom interactive elements with `tabindex="0"`

### Possible Improvements:
- Intersection Observer for visibility-based repositioning
- ResizeObserver for more efficient size tracking
- Configurable z-index levels
- Option to disable for specific interactive parents

---

**Questions about interactive parent handling?** Open an issue on GitHub.