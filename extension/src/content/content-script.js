// SuperTabs - Main Content Script
// Coordinates all extension functionality on NiFi pages

// Simple Logger utility
const SuperTabsLogger = {
  debug: (msg, data) => console.log(`[SuperTabs DEBUG] ${msg}`, data || ''),
  info: (msg, data) => console.log(`[SuperTabs INFO] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[SuperTabs WARN] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[SuperTabs ERROR] ${msg}`, data || ''),
  init: async () => { /* Logger initialization - placeholder */ },
  logUserAction: (action, data) => console.log(`[SuperTabs ACTION] ${action}`, data || ''),
  logNiFiPageState: (state) => console.log(`[SuperTabs PAGE] State: ${state}`)
};

// Simple Storage utility
const SuperTabsStorage = {
  getSettings: async () => {
    try {
      const result = await chrome.storage.sync.get({
        sidebarVisible: true,
        autoShowSidebar: true,
        enableNotifications: true,
        debugMode: false
      });
      return result;
    } catch (error) {
      SuperTabsLogger.warn('Failed to load settings, using defaults', error);
      return {
        sidebarVisible: true,
        autoShowSidebar: true,
        enableNotifications: true,
        debugMode: false
      };
    }
  },
  
  saveSettings: async (settings) => {
    try {
      await chrome.storage.sync.set(settings);
      SuperTabsLogger.debug('Settings saved', settings);
    } catch (error) {
      SuperTabsLogger.error('Failed to save settings', error);
    }
  }
};

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
      
      SuperTabsLogger.info('SuperTabs Content Script initialized');
      this.notifyReady();
    } catch (error) {
      SuperTabsLogger.error('Failed to initialize SuperTabs', error);
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
          SuperTabsLogger.info('NiFi UI detected and ready');
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
    if (typeof SuperTabsStorage !== 'undefined') {
      SuperTabsLogger.debug('Storage system ready');
    }

    // Initialize logger
    if (typeof SuperTabsLogger !== 'undefined') {
      await SuperTabsLogger.init();
    }

    // Initialize NiFi API client
    if (typeof nifiApiClient !== 'undefined' && nifiApiClient.authenticate) {
      await nifiApiClient.authenticate();
    } else {
      SuperTabsLogger.warn('NiFi API Client not available');
    }

    // Initialize PHI-3 agent
    if (typeof phi3Agent !== 'undefined' && phi3Agent.initialize) {
      await phi3Agent.initialize();
    } else {
      SuperTabsLogger.warn('PHI-3 Agent not available');
    }
  }

  async loadSettings() {
    this.settings = await SuperTabsStorage.getSettings();
    SuperTabsLogger.debug('Settings loaded', this.settings);
  }

  async initializeComponents() {
    // Initialize Canvas Detector
    if (typeof canvasDetector !== 'undefined') {
      await canvasDetector.init();
      SuperTabsLogger.debug('Canvas Detector initialized');
    } else {
      SuperTabsLogger.warn('Canvas Detector not available');
    }

    // Initialize Sidebar (will be created when needed)
    if (typeof SuperTabsSidebar !== 'undefined') {
      this.sidebar = new SuperTabsSidebar();
      await this.sidebar.initialize();
      SuperTabsLogger.debug('Sidebar ready');
    }

    // Initialize Alignment Tool
    if (typeof SuperTabsAlignmentTool !== 'undefined') {
      this.alignmentTool = new SuperTabsAlignmentTool();
      await this.alignmentTool.initialize();
      SuperTabsLogger.debug('Alignment Tool ready');
    }

    // Initialize Expression Generator
    if (typeof SuperTabsExpressionGenerator !== 'undefined') {
      this.expressionGenerator = new SuperTabsExpressionGenerator();
      await this.expressionGenerator.initialize();
      SuperTabsLogger.debug('Expression Generator ready');
    }

    // Setup component interactions
    this.setupComponentInteractions();
  }

  setupComponentInteractions() {
    // Listen for canvas detector events
    if (canvasDetector) {
      canvasDetector.addClickListener((type, componentInfo, event) => {
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
    SuperTabsLogger.debug('Content script received message', message);

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
            nifiDetected: !!canvasDetector?.canvasElement,
            componentsFound: canvasDetector?.getAllComponents()?.length || 0
          });
          break;

        case 'SETTINGS_UPDATED':
          await this.handleSettingsUpdate(message.settings);
          sendResponse({ success: true });
          break;

        default:
          SuperTabsLogger.warn('Unknown message action', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      SuperTabsLogger.error('Error handling runtime message', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  handleCanvasInteraction(type, componentInfo, event) {
    SuperTabsLogger.logUserAction(`Canvas interaction: ${type}`, { componentInfo });

    if (type === 'component' && componentInfo) {
      this.handleComponentClick(componentInfo, event);
    } else if (type === 'flowfile' && componentInfo) {
      this.handleFlowFileClick(componentInfo, event);
    } else if (type === 'canvas') {
      this.handleCanvasClick(event);
    }
  }

  async handleComponentClick(componentInfo, event) {
    if (this.settings.autoShowSidebar && this.sidebar) {
      await this.sidebar.show(componentInfo);
    }

    // Highlight clicked component
    if (canvasDetector) {
      canvasDetector.highlightComponent(componentInfo.id);
    }
  }

  async handleFlowFileClick(flowFileInfo, event) {
    SuperTabsLogger.debug('Handling FlowFile click', flowFileInfo);
    
    if (this.settings.autoShowSidebar && this.sidebar) {
      await this.sidebar.show(flowFileInfo);
    }

    // Highlight clicked FlowFile
    if (canvasDetector) {
      canvasDetector.highlightFlowFile(flowFileInfo.uuid);
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
    SuperTabsLogger.logNiFiPageState('ready');
  }

  // Public API methods
  async toggleSidebar() {
    if (!this.sidebar) return false;
    
    if (this.sidebar.isOpen()) {
      await this.sidebar.hide();
      return false;
    } else {
      // Show with current selected component or empty
      const selectedComponent = canvasDetector?.getSelectedComponent();
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
      SuperTabsLogger.warn('Expression Generator not available');
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
      SuperTabsLogger.error('Auto alignment failed', error);
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
    if (canvasDetector) {
      await canvasDetector.setAutoOpen(this.settings.autoOpen);
    }

    SuperTabsLogger.info('Settings updated in content script');
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
      SuperTabsLogger.warn('Attempting to recover SuperTabs...');
      
      // Re-initialize if needed
      if (!this.isInitialized) {
        await this.init();
        return;
      }

      // Check and fix components
      if (!canvasDetector?.isActive) {
        await canvasDetector?.init();
      }

      SuperTabsLogger.info('SuperTabs recovery successful');
    } catch (error) {
      SuperTabsLogger.error('SuperTabs recovery failed', error);
    }
  }

  // Cleanup
  destroy() {
    if (canvasDetector) {
      canvasDetector.destroy();
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
    SuperTabsLogger.info('SuperTabs Content Script destroyed');
  }
}

// Create and initialize the main content script
const superTabsContentScript = new SuperTabsContentScript();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    superTabsContentScript.init();
  });
} else {
  superTabsContentScript.init();
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
    SuperTabsLogger.debug('SuperTabs health check: OK');
  }
}, 30000);