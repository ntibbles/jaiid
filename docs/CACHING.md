# Alt Text Caching

This document explains how the jaiid (Just AI image descriptions) extension caches generated alt text to improve performance and user experience.

## Overview

When alt text is generated for an image, the extension stores it in a cache. If the user reopens the same dialog, the cached text is displayed instantly without calling the AI model again.

## Why Caching?

### Problems Without Caching

```
User Action 1: Click info button → Wait 2-3 seconds → See alt text
User Action 2: Close dialog
User Action 3: Click same button → Wait 2-3 seconds again → See same text
```

**Issues:**
- ❌ Redundant AI calls for the same image
- ❌ Unnecessary waiting time
- ❌ Poor user experience
- ❌ Wasted compute resources
- ❌ Potential API rate limiting

### Benefits With Caching

```
User Action 1: Click info button → Wait 2-3 seconds → See alt text
User Action 2: Close dialog
User Action 3: Click same button → Instant display (0ms) → See same text
```

**Benefits:**
- ✅ Instant response on subsequent opens
- ✅ No redundant AI calls
- ✅ Better user experience
- ✅ Reduced compute usage
- ✅ No API rate limiting concerns

## Implementation

### Cache Data Structure

```javascript
// Map to store generated alt text
// Key: image ID (string), Value: alt text (string)
const altTextCache = new Map();
```

**Why Map?**
- Fast lookups: O(1) time complexity
- Key-value storage (image ID → alt text)
- Easy to check existence: `has(imageId)`
- Easy to retrieve: `get(imageId)`
- Easy to store: `set(imageId, altText)`

### Cache Key

Each image gets a unique ID:

```javascript
const imageId = `ai-alt-image-${imageCounter}`;
img.setAttribute('id', imageId);
```

**Why use image ID as key?**
- Unique per image on the page
- Persists even if image src changes (rare)
- Simple integer counter ensures uniqueness
- Doesn't rely on potentially duplicate src URLs

### Cache Flow

#### First Open (Cache Miss)

```javascript
popover.addEventListener('toggle', async (event) => {
  if (event.newState === 'open') {
    const contentDiv = popover.querySelector('.ai-alt-popover-content');
    
    // Check cache first
    const cachedAltText = altTextCache.get(imageId);
    
    if (cachedAltText) {
      // Cache hit - instant display
      contentDiv.innerHTML = `<p class="ai-alt-text" role="alert">${cachedAltText}</p>`;
    } else {
      // Cache miss - generate new alt text
      contentDiv.innerHTML = '<div class="ai-alt-loading">Generating...</div>';
      
      const altText = await generateAltText(img, updateProgress);
      
      // Store in cache
      altTextCache.set(imageId, altText);
      
      // Display result
      contentDiv.innerHTML = `<p class="ai-alt-text">${altText}</p>`;
    }
  }
});
```

**Steps:**
1. User clicks info button
2. Check cache: `altTextCache.get(imageId)` → `undefined` (not found)
3. Show loading state: "Generating alt text..."
4. Call AI: `await generateAltText(img)`
5. Store result: `altTextCache.set(imageId, altText)`
6. Display result in popover
7. User closes dialog

#### Subsequent Opens (Cache Hit)

**Steps:**
1. User clicks same info button again
2. Check cache: `altTextCache.get(imageId)` → `"A beautiful landscape..."` (found!)
3. **Skip loading state** (instant)
4. **Skip AI call** (instant)
5. Display cached result immediately
6. User sees alt text in <10ms

## Visual Flow

### First Open (Generate)

```
┌─────────────────────────────────────────────────┐
│  User clicks info button                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Check cache: altTextCache.get(imageId)         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────┴────────┐
        │  undefined      │
        │  (cache miss)   │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Show loading: "Generating alt text..."         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Call AI: await generateAltText(img)            │
│  [2-3 seconds]                                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Store: altTextCache.set(imageId, altText)      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Display: "A beautiful landscape with trees"    │
└─────────────────────────────────────────────────┘
```

### Second Open (Cache Hit)

```
┌─────────────────────────────────────────────────┐
│  User clicks same info button again             │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Check cache: altTextCache.get(imageId)         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────┴────────┐
        │  "A beautiful   │
        │  landscape..."  │
        │  (cache hit!)   │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Display immediately: "A beautiful landscape    │
│  with trees" [INSTANT - 0ms]                    │
└─────────────────────────────────────────────────┘
```

## Cache Lifetime

### Session-Based Cache

The cache persists **during the page session** only:

```javascript
// Cache is created when content script loads
const altTextCache = new Map();

// Cache persists until:
// - User navigates away from page
// - User reloads page (F5 / Cmd+R)
// - User closes tab
```

**Why session-based?**
- Images may change between page loads
- Simple implementation (no storage management)
- No disk I/O overhead
- Automatic cleanup on navigation
- Fresh start on each page load

### Cache Invalidation

**Cache is cleared when:**
- Page reload (F5, Cmd+R)
- Navigation to different page
- Tab close
- Browser restart

**Cache is NOT cleared when:**
- Dialog opens/closes
- User scrolls page
- User resizes window
- User switches tabs (comes back to same tab)

## Examples

### Example 1: Single Image - Multiple Opens

```html
<img src="photo.jpg" id="ai-alt-image-1">
```

**User Actions:**

| Action | Cache State | AI Called? | Loading? | Display Time |
|--------|-------------|------------|----------|-------------|
| Open #1 | Empty | ✅ Yes | ✅ Yes | 2-3 seconds |
| Close | Cached: "A sunset..." | - | - | - |
| Open #2 | Hit: "A sunset..." | ❌ No | ❌ No | <10ms |
| Close | Still cached | - | - | - |
| Open #3 | Hit: "A sunset..." | ❌ No | ❌ No | <10ms |
| Close | Still cached | - | - | - |
| Open #4 | Hit: "A sunset..." | ❌ No | ❌ No | <10ms |

**Result:** AI called once, cached response used 3 times

### Example 2: Multiple Images

```html
<img src="photo1.jpg" id="ai-alt-image-1">
<img src="photo2.jpg" id="ai-alt-image-2">
<img src="photo3.jpg" id="ai-alt-image-3">
```

**User Actions:**

| Action | Image | Cache State | AI Called? |
|--------|-------|-------------|------------|
| Open | #1 | Empty | ✅ Yes |
| Close | #1 | Cached: "Photo 1 desc" | - |
| Open | #2 | Cached: #1 only | ✅ Yes |
| Close | #2 | Cached: #1, #2 | - |
| Open | #1 | Hit: "Photo 1 desc" | ❌ No |
| Close | #1 | Still cached | - |
| Open | #3 | Cached: #1, #2 only | ✅ Yes |
| Close | #3 | Cached: #1, #2, #3 | - |
| Open | #2 | Hit: "Photo 2 desc" | ❌ No |

**Result:** Each image generates AI text once, cached thereafter

### Example 3: Error Caching

```html
<img src="photo.jpg" id="ai-alt-image-1">
```

**Scenario:** AI service unavailable

| Action | Cache State | AI Called? | Display |
|--------|-------------|------------|----------|
| Open #1 | Empty | ✅ Yes (fails) | "Error: AI service unavailable" |
| Close | Cached: "Error..." | - | - |
| Open #2 | Hit: "Error..." | ❌ No | "Error: AI service unavailable" |

**Why cache errors?**
- Prevents repeated failed API calls
- User sees same error instantly
- Reduces server load during outages
- User can refresh page to retry (clears cache)

### Example 4: Page Reload Clears Cache

```html
<img src="photo.jpg" id="ai-alt-image-1">
```

| Action | Cache State | AI Called? |
|--------|-------------|------------|
| Open | Empty | ✅ Yes |
| Close | Cached | - |
| Open | Hit | ❌ No (instant) |
| Close | Cached | - |
| **Page Reload** | **Cache cleared** | - |
| Open | Empty (fresh) | ✅ Yes |

**Note:** After reload, cache is empty and new counter starts

## Performance Impact

### Time Savings

**Without Cache:**
```
Open #1: 2.5s (AI generation)
Open #2: 2.5s (AI generation)
Open #3: 2.5s (AI generation)
Total: 7.5s
```

**With Cache:**
```
Open #1: 2.5s (AI generation)
Open #2: 0.01s (cached)
Open #3: 0.01s (cached)
Total: 2.52s (67% faster!)
```

### API Call Reduction

**Without Cache:**
- 10 opens = 10 AI calls
- 100 opens = 100 AI calls

**With Cache:**
- 10 opens (same image) = 1 AI call
- 100 opens (same image) = 1 AI call
- 100 opens (50 different images) = 50 AI calls

**Reduction:** Up to 99% fewer API calls!

### Memory Usage

**Per cached entry:**
- Key (imageId): ~20 bytes (`"ai-alt-image-123"`)
- Value (altText): ~100-500 bytes (typical description)
- Map overhead: ~50 bytes
- **Total per entry:** ~200-600 bytes

**For 100 images:**
- Total memory: ~20-60 KB
- **Negligible impact** on browser performance

## Edge Cases

### Edge Case 1: Dynamic Image Changes

**Scenario:** Image src changes while cache exists

```javascript
const img = document.getElementById('ai-alt-image-1');
img.src = 'photo1.jpg'; // Cache: "A sunset"

// Later, JavaScript changes src
img.src = 'photo2.jpg'; // Still id="ai-alt-image-1"

// User opens dialog
// Result: Shows cached "A sunset" (wrong!)
```

**Limitation:** Cache key is based on image ID, not src

**Workaround:** Page reload clears cache and regenerates

**Alternative:** Could use src as part of key, but adds complexity

### Edge Case 2: Rapid Open/Close

**Scenario:** User rapidly clicks button

```javascript
// User clicks rapidly before AI finishes
Open → Close → Open → Close → Open
```

**Handling:**
- First open starts AI generation
- Rapid closes don't cancel generation
- AI completes and caches result
- Next open uses cache

**No issues:** Async/await handles race conditions gracefully

### Edge Case 3: Very Large Cache

**Scenario:** Page with 1000+ images

**Memory:**
- 1000 images × 400 bytes = 400 KB
- Still negligible for modern browsers

**Lookup performance:**
- Map lookup: O(1) - constant time
- No performance degradation

### Edge Case 4: AI Timeout

**Scenario:** AI takes very long to respond

```javascript
// User opens dialog
// Waits 30 seconds...
// AI finally responds
// Result still cached
```

**Handling:** Cache stores result regardless of how long it took

## Future Enhancements

### Persistent Storage

**Could use:**
- `chrome.storage.local` for cross-session persistence
- IndexedDB for large-scale caching
- LocalStorage (limited to 5-10MB)

**Benefits:**
- Cache survives page reload
- Faster repeat visits

**Challenges:**
- Storage quota management
- Cache invalidation strategy
- Image change detection

### Smart Cache Invalidation

**Could detect:**
- Image src changes
- Image dimension changes
- Time-based expiration (e.g., 24 hours)

**Implementation:**
```javascript
// Store with metadata
altTextCache.set(imageId, {
  text: "A sunset...",
  src: img.src,
  timestamp: Date.now()
});

// Validate on retrieval
const cached = altTextCache.get(imageId);
if (cached.src !== img.src || Date.now() - cached.timestamp > 86400000) {
  // Invalidate and regenerate
}
```

### Cache Statistics

**Could track:**
- Cache hits vs. misses
- Average time saved
- Total API calls avoided

**Display to user:**
```
Cache Stats:
✅ 15 instant loads
⚡ 37.5 seconds saved
📉 14 API calls avoided
```

### Manual Cache Clear

**Could add:**
- Button to clear cache for single image
- Button to clear all cached data
- Settings page with cache management

**UI:**
```html
<button class="clear-cache" data-image-id="ai-alt-image-1">
  🔄 Regenerate Alt Text
</button>
```

## Testing

See [__tests__/alt-text-caching.test.js](/__tests__/alt-text-caching.test.js) for comprehensive tests:

- ✅ Cache stores alt text after first generation
- ✅ Cache returns text on second open
- ✅ No loading state when using cache
- ✅ Different images have separate cache entries
- ✅ Cache persists across multiple open/close cycles
- ✅ Error messages are cached
- ✅ Rapid open/close doesn't break cache
- ✅ Cached response is instant (<50ms)
- ✅ Large number of cached images handled efficiently

## Best Practices

### For Users

1. **Reload page if image changes:** Cache is based on page load
2. **Cache is automatic:** No manual management needed
3. **Instant on reopen:** Second+ opens are immediate

### For Developers

1. **Use image ID as key:** Ensures uniqueness
2. **Cache after generation:** Store immediately after AI returns
3. **Check cache first:** Always check before calling AI
4. **Handle cache misses:** Gracefully fall back to generation
5. **Cache errors too:** Prevents repeated failed calls

---

**Questions about caching?** Open an issue on GitHub.