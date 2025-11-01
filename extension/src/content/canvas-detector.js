/**
 * SuperTabs - Canvas Detector
 * Detects clicks on NiFi components and canvas for automatic sidebar activation
 */

class SuperTabsCanvasDetector {
  constructor() {
    this.canvasElement = null;
    this.componentElements = new Map();
    this.clickListeners = [];
    this.isInitialized = false;
    this.selectedComponent = null;
    this.autoOpen = true;
    this.observerOptions = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'transform']
    };
    this.mutationObserver = null;
  }

  async init() {
    try {
      SuperTabsLogger.debug('CanvasDetector', 'Initializing canvas detector');
      
      await this.detectNiFiCanvas();
      this.setupComponentDetection();
      this.bindCanvasEvents();
      this.startMutationObserver();
      
      this.isInitialized = true;
      SuperTabsLogger.info('CanvasDetector', 'Canvas detector initialized successfully');
    } catch (error) {
      SuperTabsLogger.error('CanvasDetector', 'Failed to initialize canvas detector', error);
    }
  }

  async detectNiFiCanvas() {
    // Try multiple selectors to find the NiFi canvas
    const canvasSelectors = [
      '#canvas',
      '.canvas',
      '[id*="canvas"]',
      '.nf-canvas',
      '#flow-canvas',
      '.canvas-container',
      'svg[class*="canvas"]',
      '.process-group-details',
      '.graph-canvas'
    ];

    for (const selector of canvasSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.canvasElement = element;
        SuperTabsLogger.debug('CanvasDetector', `Canvas found with selector: ${selector}`);
        break;
      }
    }

    // If no canvas found, wait and try again
    if (!this.canvasElement) {
      SuperTabsLogger.warn('CanvasDetector', 'Canvas not found, waiting...');
      await this.waitForCanvas();
    }

    return this.canvasElement;
  }

  async waitForCanvas() {
    return new Promise((resolve) => {
      const checkCanvas = () => {
        this.detectNiFiCanvas().then((canvas) => {
          if (canvas) {
            resolve(canvas);
          } else {
            setTimeout(checkCanvas, 1000);
          }
        });
      };
      checkCanvas();
    });
  }

  setupComponentDetection() {
    if (!this.canvasElement) return;

    // Common selectors for NiFi components
    const componentSelectors = [
      '.processor',
      '.input-port',
      '.output-port',
      '.process-group',
      '.remote-process-group',
      '.connection',
      '.label',
      '.funnel',
      '[class*="component"]',
      '[class*="processor"]',
      'g[class*="component"]',
      'g[class*="processor"]'
    ];

    // Scan for existing components
    this.scanForComponents(componentSelectors);

    SuperTabsLogger.debug('CanvasDetector', `Found ${this.componentElements.size} components`);
  }

  scanForComponents(selectors) {
    selectors.forEach(selector => {
      const elements = this.canvasElement.querySelectorAll(selector);
      elements.forEach(element => {
        const componentInfo = this.extractComponentInfo(element);
        if (componentInfo) {
          this.componentElements.set(element, componentInfo);
          this.bindComponentEvents(element, componentInfo);
        }
      });
    });
  }

  extractComponentInfo(element) {
    try {
      // Try to extract component information from various sources
      let componentInfo = {};

      // Method 1: Look for data attributes
      componentInfo.id = element.getAttribute('data-id') || 
                        element.getAttribute('id') || 
                        element.querySelector('[data-id]')?.getAttribute('data-id');

      // Method 2: Extract from classes
      const classes = Array.from(element.classList);
      componentInfo.type = this.extractTypeFromClasses(classes);

      // Method 3: Look for text content (component name)
      const textElements = element.querySelectorAll('text, .component-name, .processor-name');
      if (textElements.length > 0) {
        componentInfo.name = textElements[0].textContent?.trim();
      }

      // Method 4: Extract from URL or context
      if (!componentInfo.id) {
        componentInfo.id = this.extractIdFromContext(element);
      }

      // Method 5: Try to get component state
      componentInfo.state = this.extractComponentState(element);

      // Method 6: Get position
      componentInfo.position = this.getElementPosition(element);

      // Method 7: Check if this looks like a valid component
      if (!componentInfo.id && !componentInfo.name && !componentInfo.type) {
        return null; // Not a valid component
      }

      // Create a more complete component object
      componentInfo.element = element;
      componentInfo.timestamp = new Date();

      SuperTabsLogger.debug('CanvasDetector', 'Component extracted', componentInfo);
      return componentInfo;

    } catch (error) {
      SuperTabsLogger.warn('CanvasDetector', 'Failed to extract component info', error);
      return null;
    }
  }

  extractTypeFromClasses(classes) {
    const typeMap = {
      'processor': 'Processor',
      'input-port': 'Input Port',
      'output-port': 'Output Port',
      'process-group': 'Process Group',
      'remote-process-group': 'Remote Process Group',
      'connection': 'Connection',
      'label': 'Label',
      'funnel': 'Funnel'
    };

    for (const className of classes) {
      if (typeMap[className]) {
        return typeMap[className];
      }
    }

    // Try partial matches
    for (const className of classes) {
      for (const [key, value] of Object.entries(typeMap)) {
        if (className.includes(key)) {
          return value;
        }
      }
    }

    return 'Component';
  }

  extractIdFromContext(element) {
    // Try to find ID from parent elements or URL
    let current = element;
    while (current && current !== this.canvasElement) {
      const id = current.getAttribute('data-id') || current.getAttribute('id');
      if (id && id.match(/^[a-f0-9-]{36}$/)) { // UUID pattern
        return id;
      }
      current = current.parentElement;
    }

    // Extract from current URL if it contains component ID
    const urlMatch = window.location.hash.match(/\/([a-f0-9-]{36})/);
    if (urlMatch) {
      return urlMatch[1];
    }

    return null;
  }

  extractComponentState(element) {
    const classes = Array.from(element.classList);
    
    if (classes.some(c => c.includes('running'))) return 'RUNNING';
    if (classes.some(c => c.includes('stopped'))) return 'STOPPED';
    if (classes.some(c => c.includes('invalid'))) return 'INVALID';
    if (classes.some(c => c.includes('disabled'))) return 'DISABLED';
    
    return 'UNKNOWN';
  }

  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  bindCanvasEvents() {
    if (!this.canvasElement) return;

    // Canvas click detection (for empty area clicks)
    this.canvasElement.addEventListener('click', (event) => {
      // Check if click was on empty canvas area
      if (event.target === this.canvasElement || 
          event.target.closest('.canvas-background')) {
        this.handleCanvasClick(event);
      }
    });

    SuperTabsLogger.debug('CanvasDetector', 'Canvas events bound');
  }

  bindComponentEvents(element, componentInfo) {
    // Component click detection
    element.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent canvas click
      this.handleComponentClick(componentInfo, event);
    });

    // Component hover effects (optional)
    element.addEventListener('mouseenter', () => {
      this.handleComponentHover(componentInfo, true);
    });

    element.addEventListener('mouseleave', () => {
      this.handleComponentHover(componentInfo, false);
    });
  }

  handleComponentClick(componentInfo, event) {
    SuperTabsLogger.debug('CanvasDetector', 'Component clicked', componentInfo);
    
    this.selectedComponent = componentInfo;
    
    // Highlight the clicked component
    this.highlightComponent(componentInfo.id);
    
    // Notify all listeners
    this.notifyClickListeners('component', componentInfo, event);

    // Auto-open sidebar if enabled
    if (this.autoOpen) {
      this.notifyAutoOpen(componentInfo);
    }
  }

  handleCanvasClick(event) {
    SuperTabsLogger.debug('CanvasDetector', 'Canvas clicked');
    
    this.selectedComponent = null;
    this.clearHighlights();
    
    // Notify all listeners
    this.notifyClickListeners('canvas', null, event);
  }

  handleComponentHover(componentInfo, isEntering) {
    if (isEntering) {
      componentInfo.element?.classList.add('supertabs-hover');
    } else {
      componentInfo.element?.classList.remove('supertabs-hover');
    }
  }

  highlightComponent(componentId) {
    // Clear previous highlights
    this.clearHighlights();
    
    // Find and highlight the component
    for (const [element, info] of this.componentElements) {
      if (info.id === componentId) {
        element.classList.add('supertabs-selected');
        break;
      }
    }
  }

  clearHighlights() {
    for (const [element] of this.componentElements) {
      element.classList.remove('supertabs-selected', 'supertabs-hover');
    }
  }

  startMutationObserver() {
    if (!this.canvasElement) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldRescan = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // New components might have been added
          shouldRescan = true;
        }
      });

      if (shouldRescan) {
        this.rescanComponents();
      }
    });

    this.mutationObserver.observe(this.canvasElement, this.observerOptions);
    SuperTabsLogger.debug('CanvasDetector', 'Mutation observer started');
  }

  rescanComponents() {
    // Clear existing components
    this.componentElements.clear();
    
    // Rescan for components
    this.setupComponentDetection();
    
    SuperTabsLogger.debug('CanvasDetector', 'Components rescanned');
  }

  // Public API for external communication
  addClickListener(callback) {
    this.clickListeners.push(callback);
  }

  removeClickListener(callback) {
    const index = this.clickListeners.indexOf(callback);
    if (index > -1) {
      this.clickListeners.splice(index, 1);
    }
  }

  notifyClickListeners(type, componentInfo, event) {
    this.clickListeners.forEach(callback => {
      try {
        callback(type, componentInfo, event);
      } catch (error) {
        SuperTabsLogger.error('CanvasDetector', 'Click listener error', error);
      }
    });
  }

  notifyAutoOpen(componentInfo) {
    // Dispatch custom event for auto-opening sidebar
    window.dispatchEvent(new CustomEvent('supertabs:component-selected', {
      detail: { componentInfo }
    }));
  }

  async setAutoOpen(enabled) {
    this.autoOpen = enabled;
    SuperTabsLogger.debug('CanvasDetector', `Auto-open ${enabled ? 'enabled' : 'disabled'}`);
  }

  getAllComponents() {
    return Array.from(this.componentElements.values());
  }

  getSelectedComponent() {
    return this.selectedComponent;
  }

  getComponentById(id) {
    for (const [element, info] of this.componentElements) {
      if (info.id === id) {
        return info;
      }
    }
    return null;
  }

  // Canvas information
  getCanvasInfo() {
    if (!this.canvasElement) return null;
    
    return {
      element: this.canvasElement,
      bounds: this.canvasElement.getBoundingClientRect(),
      componentCount: this.componentElements.size,
      isActive: this.isInitialized
    };
  }

  // Utility method to refresh/reinitialize
  async refresh() {
    SuperTabsLogger.debug('CanvasDetector', 'Refreshing canvas detector');
    
    this.destroy();
    await this.init();
  }

  get isActive() {
    return this.isInitialized && this.canvasElement !== null;
  }

  // Cleanup
  destroy() {
    try {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }

      // Clear component event listeners
      for (const [element] of this.componentElements) {
        element.classList.remove('supertabs-selected', 'supertabs-hover');
      }

      this.componentElements.clear();
      this.clickListeners = [];
      this.selectedComponent = null;
      this.canvasElement = null;
      this.isInitialized = false;

      SuperTabsLogger.debug('CanvasDetector', 'Canvas detector destroyed');
    } catch (error) {
      SuperTabsLogger.error('CanvasDetector', 'Error during cleanup', error);
    }
  }
}

// Create global instance
const canvasDetector = new SuperTabsCanvasDetector();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsCanvasDetector, canvasDetector };
} else if (typeof window !== 'undefined') {
  window.SuperTabsCanvasDetector = SuperTabsCanvasDetector;
  window.canvasDetector = canvasDetector;
}