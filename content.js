/**
 * Content script for jaiid (Just AI image descriptions) extension
 * Scans for eligible images, creates UI elements, generates alt text using Chrome AI
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.aiAltTextInjected) {
    return;
  }
  window.aiAltTextInjected = true;

  const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18.5,24H13.034A13.5,13.5,0,0,1,3,19.789a11.467,11.467,0,0,1-2.947-8.9A12.024,12.024,0,0,1,9.908.188a11.641,11.641,0,0,1,9.654,2.569A12.448,12.448,0,0,1,24,12.324V18.5A5.507,5.507,0,0,1,18.5,24ZM12.03,3a9.021,9.021,0,0,0-8.988,8.164,8.509,8.509,0,0,0,2.18,6.605A10.5,10.5,0,0,0,13.034,21H18.5A2.5,2.5,0,0,0,21,18.5V12.324a9.466,9.466,0,0,0-3.366-7.27A8.637,8.637,0,0,0,12.03,3ZM12,6a1.5,1.5,0,0,0,0,3A1.5,1.5,0,0,0,12,6Zm.5,13A1.5,1.5,0,0,1,11,17.5V13h-.5a1.5,1.5,0,0,1,0-3h1A2.5,2.5,0,0,1,14,12.5v5A1.5,1.5,0,0,1,12.5,19Z"/></svg>`;

  let imageCounter = 0;
  
  // Cache for storing generated alt text
  // Key: image ID, Value: generated alt text string
  const altTextCache = new Map();

  /**
   * Check if an image meets the size and type requirements
   * Checks both natural (actual file) dimensions and rendered (displayed) dimensions
   * @param {HTMLImageElement} img - The image element to check
   * @returns {boolean} - Whether the image is eligible
   */
  function isEligibleImage(img) {
    const rect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const renderedWidth = rect.width;
    const renderedHeight = rect.height;

    // Check if image is loaded
    if (!naturalWidth || !naturalHeight) {
      return false;
    }

    // Check rendered dimensions: must also be larger than 125x125, less than 1500px wide
    // This ensures the image is displayed at a meaningful size on the page
    if (renderedWidth < 125 || renderedHeight < 125 || renderedWidth >= 1500) {
      return false;
    }

    // Check file type from src
    const src = img.src || '';
    const srcLower = src.toLowerCase();
    
    // Allowed extensions
    const validExtensions = ['.png', '.jpeg', '.jpg', '.webp'];
    
    // Check if URL has an explicit extension
    const hasValidExtension = validExtensions.some(ext => srcLower.includes(ext));
    
    // Check if it's from picsum.photos (which defaults to JPEG if no extension)
    const isPicsum = srcLower.includes('picsum.photos');
    
    // Allow if either:
    // 1. Has a valid extension, OR
    // 2. Is from picsum.photos (defaults to JPEG)
    if (!hasValidExtension && !isPicsum) {
      return false;
    }
    
    // If it's picsum with an extension, make sure it's a valid one
    if (isPicsum && srcLower.includes('.')) {
      const hasPicsumValidExt = validExtensions.some(ext => srcLower.includes(ext));
      if (!hasPicsumValidExt) {
        return false;
      }
    }

    // Check that it's visible (already checked above but kept for explicitness)
    if (renderedWidth === 0 || renderedHeight === 0) {
      return false;
    }

    return true;
  }

  /**
   * Generate alt text using Chrome's built-in AI (Nano)
   * @param {HTMLImageElement} img - The image to analyze
   * @param {Function} progressCallback - Optional callback for download progress
   * @returns {Promise<string>} - Generated alt text
   */
  async function generateAltText(img, progressCallback = null) {
    try {
      const available = await LanguageModel.availability();
      
      if (available === 'unavailable') {
        throw new Error('Gemini Nano is not available on this device');
      }

      // Handle downloading state
      // if (available === 'after-download') {
      //   console.log('Gemini Nano model needs to be downloaded...');
        
      //   if (progressCallback) {
      //     progressCallback('Downloading AI model...');
      //   }
        
      //   // Create session which triggers download
      //   const session = await LanguageModel.create({
      //     monitor(m) {
      //       // Monitor download progress
      //       m.addEventListener('downloadprogress', (e) => {
      //         const percent = Math.round((e.loaded / e.total) * 100);
      //         console.log(`Model download progress: ${percent}%`);
      //         if (progressCallback) {
      //           progressCallback(`Downloading AI model: ${percent}%`);
      //         }
      //       });
      //     }
      //   });
        
      //   // Continue with session after download completes
      //   const imageSrc = img.src;
      //   const imageContext = `Image URL: ${imageSrc}\nImage dimensions: ${img.naturalWidth}x${img.naturalHeight}px`;
        
      //   const prompt = `Generate a concise, descriptive alt text for an image. The alt text should describe what's visible in the image in a way that would be helpful for screen reader users. Keep it under 125 characters. Do not include phrases like "image of" or "picture of". Just describe what you see.\n\n${imageContext}`;
        
      //   const result = await session.prompt(prompt);
      //   session.destroy();
        
      //   return result || 'Image description unavailable';
      // }

      // Model is readily available
      const session = await LanguageModel.create({
        systemPrompt: `You are an expert accessibility specialist. Your task is to write comprehensive, accurate, and descriptive alt text for images to be read by screen readers. 
        Rules:
          - Focus on the most important details, the context, and transcribe any visible text.
          - Describe the subject, setting, and mood.
          - NEVER start with 'A picture of' or 'An image of'. Start directly with the description.`,
        expectedInputs: [{ type: 'image' }, { type: 'text', languages: ["en"] }]
      });
      
      const response = await fetch(img.src);
      const imageSource = await response.blob();
      let imageBitmap;
      try {
        imageBitmap = imageSource instanceof ImageBitmap 
          ? imageSource 
          : await createImageBitmap(imageSource);
      } catch (err) {
        throw new Error("Failed to convert the provided image into an ImageBitmap: " + err.message);
      }
      
      const prompt = "Analyze this image and provide the highly accurate alt text following your system instructions.";
      const result = await session.prompt([
        {
          role: "user",
          content: [
            { 
              type: "text", 
              value: prompt 
            },
            { 
              type: "image", 
              value: imageBitmap
            }
          ]
        }
      ]);
      session.destroy();
      
      return result || 'Image description unavailable';
    } catch (error) {
      console.error('Error generating alt text:', error);
      return `Error: ${error.message}`;
    }
  }


  /**
   * Position popover above the button
   * @param {HTMLElement} popover - The popover element
   * @param {HTMLElement} button - The button element
   */
  function positionPopover(popover, button) {
    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    
    // Calculate position: above the button with 8px spacing
    let top = buttonRect.top - popoverRect.height - 8;
    let left = buttonRect.left;
    
    // If popover would go above viewport, position below button instead
    if (top < 8) {
      top = buttonRect.bottom + 8;
    }
    
    // Adjust horizontal position if popover would go off-screen
    const maxLeft = window.innerWidth - popoverRect.width - 8;
    left = Math.max(8, Math.min(left, maxLeft));
    
    // Ensure top is within viewport
    const maxTop = window.innerHeight - popoverRect.height - 8;
    top = Math.max(8, Math.min(top, maxTop));
    
    // Apply position
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  /**
   * Position wrapper absolutely over the target image
   * Used when image is inside an interactive element
   * @param {HTMLElement} wrapper - The wrapper element
   * @param {HTMLImageElement} img - The target image
   */
  function positionWrapperOverImage(wrapper, img) {
    const imgRect = img.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Position wrapper to match image position
    wrapper.style.top = `${imgRect.top + scrollTop}px`;
    wrapper.style.left = `${imgRect.left + scrollLeft}px`;
    wrapper.style.width = `${imgRect.width}px`;
    wrapper.style.height = `${imgRect.height}px`;
  }

  /**
   * Find the closest interactive parent element (anchor or button)
   * Interactive elements cannot be nested per WCAG 4.1.2
   * @param {HTMLElement} element - The element to start searching from
   * @returns {HTMLElement|null} - The interactive parent or null
   */
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

  /**
   * Create and attach button overlay for an image
   * @param {HTMLImageElement} img - The image element
   */
  function attachButtonToImage(img) {
    // Double-check if already processed (defensive check)
    if (img.getAttribute('data-ai-alt-processed') === 'true') {
      console.log('Image already processed, skipping:', img.src);
      return;
    }
    
    // Check if a wrapper already exists for this image
    const existingWrapper = img.parentElement?.classList?.contains('ai-alt-image-wrapper');
    if (existingWrapper) {
      console.log('Wrapper already exists, skipping:', img.src);
      return;
    }
    
    imageCounter++;
    const imageId = `ai-alt-image-${imageCounter}`;
    const buttonId = `ai-alt-btn-${imageCounter}`;
    const popoverId = `ai-alt-popover-${imageCounter}`;

    // Mark image as processed FIRST to prevent race conditions
    img.setAttribute('data-ai-alt-processed', 'true');
    img.setAttribute('id', imageId);

    // Check if image is inside an interactive element
    const interactiveParent = findInteractiveParent(img);
    
    // Create wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-alt-image-wrapper';
    wrapper.setAttribute('data-image-id', imageId);
    
    if (interactiveParent) {
      // Image is inside interactive element - position wrapper absolutely
      wrapper.style.position = 'absolute';
      wrapper.style.pointerEvents = 'none'; // Allow clicks through to interactive parent
      wrapper.style.zIndex = '1000';
      
      // Insert wrapper as sibling to interactive parent
      interactiveParent.parentNode.insertBefore(wrapper, interactiveParent);
      
      // Store reference to image for positioning
      wrapper.setAttribute('data-target-image', imageId);
    } else {
      // Image is not inside interactive element - use normal wrapping
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      
      // Wrap the image normally
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    }

    // Create button
    const button = document.createElement('button');
    button.id = buttonId;
    button.className = 'ai-alt-info-button';
    button.setAttribute('aria-label', `Generate AI alt text for image ${imageCounter}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('popovertarget', popoverId);
    button.innerHTML = ICON_SVG;
    
    // Re-enable pointer events on button (wrapper has pointer-events: none)
    if (interactiveParent) {
      button.style.pointerEvents = 'auto';
    }

    // Create popover dialog
    const popover = document.createElement('div');
    popover.id = popoverId;
    popover.className = 'ai-alt-popover';
    popover.setAttribute('popover', 'auto');

    // Popover content
    popover.innerHTML = `
      <div class="ai-alt-popover-header">
        <h2 id="${popoverId}-title" class="ai-alt-popover-title">AI Image Description</h2>
        <button class="ai-alt-close-btn" popovertarget="${popoverId}" popovertargetaction="hide" aria-label="Close dialog">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </div>
      <div class="ai-alt-popover-content">
        <p class="ai-alt-loading" role="status">Generating alt text...</p>
      </div>
    `;

    // Add elements to wrapper
    wrapper.appendChild(button);
    wrapper.appendChild(popover);
    
    // Position wrapper over image if inside interactive element
    if (interactiveParent) {
      positionWrapperOverImage(wrapper, img);
      
      // Reposition on scroll or resize
      const repositionWrapperHandler = () => positionWrapperOverImage(wrapper, img);
      window.addEventListener('scroll', repositionWrapperHandler, true);
      window.addEventListener('resize', repositionWrapperHandler);
      
      // Store cleanup function
      wrapper._cleanupReposition = () => {
        window.removeEventListener('scroll', repositionWrapperHandler, true);
        window.removeEventListener('resize', repositionWrapperHandler);
      };
    }

    // Handle popover toggle
    popover.addEventListener('toggle', async (event) => {
      if (event.newState === 'open') {
        // Position popover above the button
        positionPopover(popover, button);
        
        // Reposition on scroll or resize
        const repositionHandler = () => positionPopover(popover, button);
        window.addEventListener('scroll', repositionHandler, true);
        window.addEventListener('resize', repositionHandler);
        
        // Clean up listeners when popover closes
        const cleanupHandler = () => {
          window.removeEventListener('scroll', repositionHandler, true);
          window.removeEventListener('resize', repositionHandler);
          popover.removeEventListener('toggle', cleanupHandler);
        };
        
        // Add cleanup listener for next toggle (close)
        popover.addEventListener('toggle', cleanupHandler, { once: true });
        
        const contentDiv = popover.querySelector('.ai-alt-popover-content');
        
        // Check cache first
        const cachedAltText = altTextCache.get(imageId);
        
        if (cachedAltText) {
          // Use cached alt text (no loading state needed)
          contentDiv.innerHTML = `<p class="ai-alt-text" role="alert">${cachedAltText}</p>`;
        } else {
          // No cache - generate new alt text
          contentDiv.innerHTML = '<div class="ai-alt-loading" role="status" aria-live="polite">Generating alt text...</div>';
          
          // Progress callback to update UI during model download
          const updateProgress = (message) => {
            const loadingDiv = contentDiv.querySelector('.ai-alt-loading');
            if (loadingDiv) {
              loadingDiv.textContent = message;
            }
          };
          
          // Generate alt text with progress updates
          const altText = await generateAltText(img, updateProgress);
          
          // Store in cache
          altTextCache.set(imageId, altText);
          
          // Update popover with result
          contentDiv.innerHTML = `<p class="ai-alt-text" role="alert">${altText}</p>`;

          // reposition with new content
          positionPopover(popover, button);
        }
      }
    });

    // Handle Escape key
    popover.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        popover.hidePopover();
      }
    });
  }

  /**
   * Process all eligible images on the page
   */
  function processImages() {
    const images = document.querySelectorAll('img:not([data-ai-alt-processed])');
    
    images.forEach(img => {
      // Wait for image to load if not already loaded
      if (img.complete) {
        if (isEligibleImage(img)) {
          attachButtonToImage(img);
        }
      } else {
        img.addEventListener('load', () => {
          if (isEligibleImage(img)) {
            attachButtonToImage(img);
          }
        }, { once: true });
      }
    });
  }
  
  /**
   * Process only newly added images from mutations
   * More efficient than reprocessing all images
   * @param {MutationRecord[]} mutations - Array of mutation records
   */
  function processNewImages(mutations) {
    const newImages = new Set();
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        // Check if the added node is an image
        if (node.nodeName === 'IMG' && !node.getAttribute('data-ai-alt-processed')) {
          newImages.add(node);
        }
        // Check if the added node contains images
        if (node.querySelectorAll) {
          const imgs = node.querySelectorAll('img:not([data-ai-alt-processed])');
          imgs.forEach(img => newImages.add(img));
        }
      });
    });
    
    // Process only the new images
    newImages.forEach(img => {
      if (img.complete) {
        if (isEligibleImage(img)) {
          attachButtonToImage(img);
        }
      } else {
        img.addEventListener('load', () => {
          if (isEligibleImage(img)) {
            attachButtonToImage(img);
          }
        }, { once: true });
      }
    });
  }

  // Process images on load
  processImages();

  // Debounce timer for mutation observer
  let mutationTimer = null;
  
  // Observe for dynamically added images
  const observer = new MutationObserver((mutations) => {
    // Debounce: wait 100ms before processing to batch multiple mutations
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      // Only process newly added images, not all images
      processNewImages(mutations);
    }, 100);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();