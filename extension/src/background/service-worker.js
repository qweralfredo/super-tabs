// SuperTabs - Apache NiFi Assistant
// Service Worker (Background Script)

console.log('SuperTabs Service Worker initialized');

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  console.log('SuperTabs installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set default configuration on first install
    initializeDefaultSettings();
  } else if (details.reason === 'update') {
    console.log('SuperTabs updated from version', details.previousVersion);
  }
});

// Initialize default settings
async function initializeDefaultSettings() {
  const defaultSettings = {
    autoOpen: true,
    phi3ApiKey: '',
    claudeApiKey: '',
    preferClaude: false,
    nifiUsername: 'admin',
    nifiPassword: 'ctsBtRBKHRAx69EqUghvvgEvjnaLjFEB',
    nifiBaseUrl: 'https://localhost:8443/nifi-api',
    alignmentEnabled: true,
    expressionLanguageEnabled: true,
    debugMode: false
  };
  
  try {
    await chrome.storage.sync.set(defaultSettings);
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Failed to initialize settings:', error);
  }
}

// Tab update listener to inject scripts only on NiFi pages
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isNiFiPage = isNiFiUrl(tab.url);
    
    if (isNiFiPage) {
      console.log('NiFi page detected:', tab.url);
      
      try {
        // Ensure content scripts are properly injected
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: initializeNiFiPageDetection
        });
      } catch (error) {
        console.error('Failed to initialize NiFi page:', error);
      }
    }
  }
});

// Check if URL is a NiFi page
function isNiFiUrl(url) {
  const nifiPatterns = [
    /^https:\/\/localhost:8443\/nifi/,
    /^https:\/\/[^\/]+\/nifi/,
    /\/nifi\//
  ];
  
  return nifiPatterns.some(pattern => pattern.test(url));
}

// Function to inject into NiFi pages
function initializeNiFiPageDetection() {
  console.log('SuperTabs: NiFi page initialization');
  
  // Send message to content script that page is ready
  window.postMessage({
    type: 'SUPERTABS_NIFI_PAGE_READY',
    source: 'supertabs-extension'
  }, '*');
}

// Message handling from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Service worker received message:', message);
  
  switch (message.action) {
    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'UPDATE_SETTINGS':
      handleUpdateSettings(message.settings, sendResponse);
      return true;
      
    case 'LOG_ERROR':
      console.error('Content script error:', message.error);
      break;
      
    case 'NIFI_API_REQUEST':
      handleNiFiApiRequest(message.request, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message action:', message.action);
  }
});

// Handle settings retrieval
async function handleGetSettings(sendResponse) {
  try {
    const settings = await chrome.storage.sync.get();
    sendResponse({ success: true, settings });
  } catch (error) {
    console.error('Failed to get settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle settings update
async function handleUpdateSettings(newSettings, sendResponse) {
  try {
    await chrome.storage.sync.set(newSettings);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to update settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle NiFi API requests (for CORS bypass if needed)
async function handleNiFiApiRequest(request, sendResponse) {
  try {
    const response = await fetch(request.url, {
      method: request.method || 'GET',
      headers: request.headers || {},
      body: request.body || null
    });
    
    const data = await response.json();
    sendResponse({ 
      success: true, 
      data: data,
      status: response.status 
    });
  } catch (error) {
    console.error('NiFi API request failed:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// Extension state management
let extensionState = {
  isActive: false,
  currentTab: null,
  nifiDetected: false
};

// Keep track of extension state
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  extensionState.currentTab = activeInfo.tabId;
  extensionState.nifiDetected = isNiFiUrl(tab.url || '');
  
  console.log('Tab activated:', {
    tabId: activeInfo.tabId,
    nifiDetected: extensionState.nifiDetected,
    url: tab.url
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (isNiFiUrl(tab.url || '')) {
    // Send message to content script to toggle sidebar
    chrome.tabs.sendMessage(tab.id, {
      action: 'TOGGLE_SIDEBAR'
    });
  } else {
    // Show notification that extension only works on NiFi pages
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icon-48.png',
      title: 'SuperTabs - NiFi Assistant',
      message: 'This extension only works on Apache NiFi pages.'
    });
  }
});

console.log('SuperTabs Service Worker ready');