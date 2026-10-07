/**
 * Background service worker for jaiid (Just AI image descriptions) extension
 * Handles extension icon clicks and injects content script + styles
 */

chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Inject the content script into the active tab
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Inject the styles
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['styles.css']
    });
  } catch (error) {
    console.error('Error injecting content script:', error);
  }
});