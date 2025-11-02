// SuperTabs - Main Content Script
// Coordinates all extension functionality on NiFi pages

// Wait for global utilities to be available
const waitForUtilities = async () => {
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    if (window.SuperTabsLogger && window.superTabsStorage) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  console.warn('[SuperTabs] Utilities not available, using fallbacks');
  return false;
};

// Initialize utilities or create fallbacks
const initializeUtilities = async () => {
  const utilitiesAvailable = await waitForUtilities();
  
  if (!utilitiesAvailable) {
    // Create minimal fallbacks only if utilities aren't available
    if (!window.SuperTabsLogger) {
      window.SuperTabsLogger = {
        debug: (msg, data) => console.log(`[SuperTabs DEBUG] ${msg}`, data || ''),
        info: (msg, data) => console.log(`[SuperTabs INFO] ${msg}`, data || ''),
        warn: (msg, data) => console.warn(`[SuperTabs WARN] ${msg}`, data || ''),
        error: (msg, data) => console.error(`[SuperTabs ERROR] ${msg}`, data || ''),
        init: async () => { /* Logger initialization - placeholder */ },
        logUserAction: (action, data) => console.log(`[SuperTabs ACTION] ${action}`, data || ''),
        logNiFiPageState: (state) => console.log(`[SuperTabs PAGE] State: ${state}`)
      };
    }
    
    if (!window.superTabsStorage) {
      window.superTabsStorage = {
        getSettings: async () => {
          try {
            const result = await chrome.storage.sync.get({
              sidebarVisible: true,
              autoShowSidebar: true,
              enableNotifications: true,
              debugMode: false,
              sidebarWidth: 400
            });
            return result;
          } catch (error) {
            window.SuperTabsLogger?.warn('Failed to load settings, using defaults', error);
            return {
              sidebarVisible: true,
              autoShowSidebar: true,
              enableNotifications: true,
              debugMode: false,
              sidebarWidth: 400
            };
          }
        },
        
        saveSettings: async (settings) => {
          try {
            await chrome.storage.sync.set(settings);
            window.SuperTabsLogger?.debug('Settings saved', settings);
          } catch (error) {
            window.SuperTabsLogger?.error('Failed to save settings', error);
          }
        },

        getChatHistory: async (componentId) => {
          try {
            const key = `chat_history_${componentId}`;
            const result = await chrome.storage.local.get(key);
            return result[key] || [];
          } catch (error) {
            window.SuperTabsLogger?.error('Failed to get chat history', error);
            return [];
          }
        },

        saveChatHistory: async (componentId, history) => {
          try {
            const key = `chat_history_${componentId}`;
            await chrome.storage.local.set({ [key]: history });
            window.SuperTabsLogger?.debug('Chat history saved', { componentId, messages: history.length });
          } catch (error) {
            window.SuperTabsLogger?.error('Failed to save chat history', error);
          }
        }
      };
    }
  }
};

// Aliases for compatibility
const SuperTabsLogger = window.SuperTabsLogger;
const SuperTabsStorage = window.superTabsStorage;

class SuperTabsContentScript {
  constructor() {
    this.isInitialized = false;
    this.sidebar = null;
    this.alignmentTool = null;
    this.expressionGenerator = null;
    this.settings = {};
  }

  async init() {
    try {
      // Initialize utilities first
      await initializeUtilities();
      
      // Wait for NiFi to be ready
      await this.waitForNiFi();
      
      // Initialize storage and logger
      await this.initializeCore();
      
      // Load settings
      await this.loadSettings();
      
      // Initialize components
      await this.initializeComponents();
      
      // Setup message listeners
      this.setupMessageListeners();
      
      // Mark as initialized
      this.isInitialized = true;
      
      window.SuperTabsLogger?.info('SuperTabs Content Script initialized');
      this.notifyReady();
    } catch (error) {
      window.SuperTabsLogger?.error('Failed to initialize SuperTabs', error);
    }
  }

  async waitForNiFi() {
    return new Promise((resolve) => {
      const checkNiFi = () => {
        // Look for NiFi-specific elements that indicate the page is loaded
        const nifiElements = [
          document.querySelector('#canvas'),
          document.querySelector('.canvas'),
          document.querySelector('[id*="canvas"]'),
          document.querySelector('.nf-canvas'),
          document.querySelector('#flow-canvas'),
          document.querySelector('.nf-header')
        ].filter(Boolean);

        if (nifiElements.length > 0) {
          window.SuperTabsLogger?.info('NiFi UI detected and ready');
          resolve();
        } else {
          setTimeout(checkNiFi, 500);
        }
      };

      // Start checking immediately, then every 500ms
      checkNiFi();
    });
  }

  async initializeCore() {
    // Initialize storage
    if (window.superTabsStorage) {
      window.SuperTabsLogger?.debug('Storage system ready');
    }

    // Initialize logger
    if (window.SuperTabsLogger) {
      await window.SuperTabsLogger.init();
    }

    // Initialize NiFi API client
    if (window.nifiApiClient && window.nifiApiClient.authenticate) {
      await window.nifiApiClient.authenticate();
    } else {
      window.SuperTabsLogger?.warn('NiFi API Client not available');
    }

    // Initialize PHI-4 agent
    if (window.phi4Agent && window.phi4Agent.initialize) {
      await window.phi4Agent.initialize();
    } else {
      window.SuperTabsLogger?.warn('PHI-4 Agent not available');
    }
  }

  async loadSettings() {
    this.settings = await SuperTabsStorage.getSettings();
    window.SuperTabsLogger?.debug('Settings loaded', this.settings);
  }

  async initializeComponents() {
    // Initialize Canvas Detector
    if (window.canvasDetector) {
      await window.canvasDetector.init();
      window.SuperTabsLogger?.debug('Canvas Detector initialized');
    } else {
      window.SuperTabsLogger?.warn('Canvas Detector not available');
    }

    // Initialize Sidebar (will be created when needed)
    if (typeof SuperTabsSidebar !== 'undefined') {
      this.sidebar = new SuperTabsSidebar();
      await this.sidebar.initialize();
      window.SuperTabsLogger?.debug('Sidebar ready');
    }

    // Initialize Alignment Tool
    if (typeof SuperTabsAlignmentTool !== 'undefined') {
      this.alignmentTool = new SuperTabsAlignmentTool();
      await this.alignmentTool.initialize();
      window.SuperTabsLogger?.debug('Alignment Tool ready');
    }

    // Initialize Expression Generator
    if (typeof SuperTabsExpressionGenerator !== 'undefined') {
      this.expressionGenerator = new SuperTabsExpressionGenerator();
      await this.expressionGenerator.initialize();
      window.SuperTabsLogger?.debug('Expression Generator ready');
    }

    // Setup component interactions
    this.setupComponentInteractions();
  }

  setupComponentInteractions() {
    // Listen for canvas detector events
    if (window.canvasDetector) {
      window.canvasDetector.addClickListener((type, componentInfo, event) => {
        this.handleCanvasInteraction(type, componentInfo, event);
      });
    }

    // Listen for window messages
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      
      switch (event.data.type) {
        case 'SUPERTABS_COMPONENT_SELECTED':
          this.handleComponentSelected(event.data.componentInfo);
          break;
        case 'SUPERTABS_NIFI_PAGE_READY':
          this.handleNiFiPageReady();
          break;
      }
    });
  }

  setupMessageListeners() {
    // Listen for messages from popup and background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleRuntimeMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleRuntimeMessage(message, sender, sendResponse) {
    window.SuperTabsLogger?.debug('Content script received message', message);

    try {
      switch (message.action) {
        case 'PING':
          sendResponse({ status: 'ready', initialized: this.isInitialized });
          break;

        case 'TOGGLE_SIDEBAR':
          const result = await this.toggleSidebar();
          sendResponse({ success: true, visible: result });
          break;

        case 'OPEN_EXPRESSION_GENERATOR':
          await this.openExpressionGenerator();
          sendResponse({ success: true });
          break;

        case 'ALIGN_COMPONENTS':
          const alignResult = await this.alignComponents();
          sendResponse(alignResult);
          break;

        case 'GET_STATUS':
          sendResponse({
            initialized: this.isInitialized,
            nifiDetected: !!window.canvasDetector?.canvasElement,
            componentsFound: window.canvasDetector?.getAllComponents()?.length || 0
          });
          break;

        case 'SETTINGS_UPDATED':
          await this.handleSettingsUpdate(message.settings);
          sendResponse({ success: true });
          break;

        default:
          window.SuperTabsLogger?.warn('Unknown message action', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      window.SuperTabsLogger?.error('Error handling runtime message', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleCanvasInteraction(type, componentInfo, event) {
    window.SuperTabsLogger?.logUserAction(`Canvas interaction: ${type}`, { componentInfo });

    if (type === 'component' && componentInfo) {
      this.handleComponentClick(componentInfo, event);
    } else if (type === 'flowfile' && componentInfo) {
      this.handleFlowFileClick(componentInfo, event);
    } else if (type === 'canvas') {
      this.handleCanvasClick(event);
    }
  }

  async handleComponentClick(componentInfo, event) {
    window.SuperTabsLogger?.debug('Handling component click', componentInfo);
    
    if (this.settings.autoShowSidebar && this.sidebar) {
      await this.sidebar.showForComponent(componentInfo);
    }

    // Highlight clicked component
    if (window.canvasDetector && window.canvasDetector.highlightComponent) {
      window.canvasDetector.highlightComponent(componentInfo.id);
    }
  }

  async handleFlowFileClick(flowFileInfo, event) {
    window.SuperTabsLogger?.debug('Handling FlowFile click', flowFileInfo);
    
    if (this.settings.autoShowSidebar && this.sidebar) {
      await this.sidebar.showForComponent(flowFileInfo);
    }

    // Highlight clicked FlowFile
    if (window.canvasDetector && window.canvasDetector.highlightFlowFile) {
      window.canvasDetector.highlightFlowFile(flowFileInfo.uuid || flowFileInfo.id);
    }
  }

  async handleCanvasClick(event) {
    // Show alignment tool if enabled
    if (this.settings.alignmentEnabled && this.alignmentTool) {
      this.alignmentTool.showAtPosition(event.clientX, event.clientY);
    }

    // Hide sidebar if showing
    if (this.sidebar?.isOpen()) {
      await this.sidebar.hide();
    }
  }

  handleComponentSelected(componentInfo) {
    this.handleComponentClick(componentInfo, null);
  }

  handleNiFiPageReady() {
    window.SuperTabsLogger?.logNiFiPageState('ready');
  }

  // Public API methods
  async toggleSidebar() {
    if (!this.sidebar) return false;
    
    if (this.sidebar.isOpen()) {
      await this.sidebar.hide();
      return false;
    } else {
      // Show with current selected component or empty
      const selectedComponent = window.canvasDetector?.getSelectedComponent();
      if (selectedComponent) {
        await this.sidebar.showForComponent(selectedComponent);
      } else {
        await this.sidebar.show();
      }
      return true;
    }
  }

  async openExpressionGenerator() {
    if (!this.expressionGenerator) {
      window.SuperTabsLogger?.warn('Expression Generator not available');
      return;
    }

    await this.expressionGenerator.show();
  }

  async alignComponents() {
    if (!this.alignmentTool) {
      return { success: false, error: 'Alignment tool not available' };
    }

    try {
      const result = await this.alignmentTool.autoAlign();
      return { success: true, aligned: result.aligned };
    } catch (error) {
      window.SuperTabsLogger?.error('Auto alignment failed', error);
      return { success: false, error: error.message };
    }
  }

  async handleSettingsUpdate(newSettings) {
    if (newSettings) {
      this.settings = { ...this.settings, ...newSettings };
    } else {
      await this.loadSettings();
    }

    // Notify components of settings change
    if (window.canvasDetector) {
      await window.canvasDetector.setAutoOpen(this.settings.autoOpen);
    }

    window.SuperTabsLogger?.info('Settings updated in content script');
  }

  notifyReady() {
    // Notify background script that we're ready
    chrome.runtime.sendMessage({
      action: 'CONTENT_SCRIPT_READY',
      url: window.location.href
    });

    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('supertabs:ready', {
      detail: { 
        initialized: this.isInitialized,
        version: '1.0.0'
      }
    }));
  }

  // Error recovery
  async recover() {
    try {
      window.SuperTabsLogger?.warn('Attempting to recover SuperTabs...');
      
      // Re-initialize if needed
      if (!this.isInitialized) {
        await this.init();
        return;
      }

      // Check and fix components
      if (!window.canvasDetector?.isActive) {
        await window.canvasDetector?.init();
      }

      window.SuperTabsLogger?.info('SuperTabs recovery successful');
    } catch (error) {
      window.SuperTabsLogger?.error('SuperTabs recovery failed', error);
    }
  }

  // Cleanup
  destroy() {
    if (window.canvasDetector) {
      window.canvasDetector.destroy();
    }

    if (this.sidebar) {
      this.sidebar.destroy();
    }

    if (this.alignmentTool) {
      this.alignmentTool.destroy();
    }

    if (this.expressionGenerator) {
      this.expressionGenerator.destroy();
    }

    this.isInitialized = false;
    window.SuperTabsLogger?.info('SuperTabs Content Script destroyed');
  }
}

// Create and initialize the main content script
const superTabsContentScript = new SuperTabsContentScript();

// Auto-initialize when script loads
const initializeScript = async () => {
  await initializeUtilities();
  await superTabsContentScript.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeScript);
} else {
  initializeScript();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !superTabsContentScript.isInitialized) {
    superTabsContentScript.recover();
  }
});

// Make available globally for debugging
window.superTabsContentScript = superTabsContentScript;

// Periodic health check
setInterval(() => {
  if (superTabsContentScript.isInitialized) {
    window.SuperTabsLogger?.debug('SuperTabs health check: OK');
  }
}, 30000);