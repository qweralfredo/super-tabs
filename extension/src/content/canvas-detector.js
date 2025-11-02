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

    // FlowFile specific selectors
    const flowFileSelectors = [
      '.flowfile',
      '.flow-file',
      '.flowfile-icon',
      '.queue-listing-flowfile',
      '.flowfile-summary',
      '.flowfile-details',
      '[class*="flowfile"]',
      '[data-flowfile-uuid]',
      'g[class*="flowfile"]',
      '.connection-label .queued',
      '.flowfile-container',
      '.ff-object',  // Common NiFi FlowFile object class
      '.flowfile-listing-table tbody tr'  // FlowFile in queue listing
    ];

    // Scan for existing components
    this.scanForComponents(componentSelectors);
    
    // Scan for FlowFiles
    this.scanForFlowFiles(flowFileSelectors);

    SuperTabsLogger.debug('CanvasDetector', `Found ${this.componentElements.size} components and FlowFiles`);
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

  scanForFlowFiles(selectors) {
    selectors.forEach(selector => {
      const elements = this.canvasElement.querySelectorAll(selector);
      elements.forEach(element => {
        const flowFileInfo = this.extractFlowFileInfo(element);
        if (flowFileInfo) {
          this.componentElements.set(element, flowFileInfo);
          this.bindFlowFileEvents(element, flowFileInfo);
        }
      });
    });

    // Also scan for FlowFiles in queue listings (may be in different containers)
    this.scanForQueuedFlowFiles();
  }

  scanForQueuedFlowFiles() {
    // Look for queue listing dialogs and tables
    const queueDialogs = document.querySelectorAll(
      '.queue-listing, .flowfile-dialog, .queue-dialog, [id*="queue"], [class*="queue-listing"]'
    );
    
    queueDialogs.forEach(dialog => {
      const flowFileRows = dialog.querySelectorAll(
        'tr[data-flowfile-uuid], .flowfile-item, .flowfile-row, tbody tr'
      );
      
      flowFileRows.forEach(row => {
        const flowFileInfo = this.extractFlowFileInfo(row);
        if (flowFileInfo) {
          this.componentElements.set(row, flowFileInfo);
          this.bindFlowFileEvents(row, flowFileInfo);
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

  extractFlowFileInfo(element) {
    try {
      let flowFileInfo = {};

      // Method 1: Look for FlowFile UUID (most reliable identifier)
      flowFileInfo.uuid = element.getAttribute('data-flowfile-uuid') || 
                         element.getAttribute('data-uuid') || 
                         element.querySelector('[data-flowfile-uuid]')?.getAttribute('data-flowfile-uuid') ||
                         element.querySelector('[data-uuid]')?.getAttribute('data-uuid');

      // Method 2: Extract from table cells (queue listing)
      if (element.tagName === 'TR') {
        const cells = element.querySelectorAll('td, th');
        if (cells.length > 0) {
          // Common NiFi FlowFile table structure
          // Usually: [Position, UUID, Filename, File Size, Queue Duration, Lineage Duration]
          if (cells.length >= 2) {
            flowFileInfo.uuid = flowFileInfo.uuid || cells[1]?.textContent?.trim();
            flowFileInfo.filename = cells[2]?.textContent?.trim();
            flowFileInfo.fileSize = cells[3]?.textContent?.trim();
            flowFileInfo.queueDuration = cells[4]?.textContent?.trim();
            flowFileInfo.lineageDuration = cells[5]?.textContent?.trim();
          }
        }
      }

      // Method 3: Look for filename and attributes
      const filenameElement = element.querySelector('.filename, .flowfile-filename, [data-filename]');
      if (filenameElement) {
        flowFileInfo.filename = filenameElement.textContent?.trim() || 
                               filenameElement.getAttribute('data-filename');
      }

      // Method 4: Extract size information
      const sizeElement = element.querySelector('.file-size, .flowfile-size, [data-size]');
      if (sizeElement) {
        flowFileInfo.fileSize = sizeElement.textContent?.trim() || 
                               sizeElement.getAttribute('data-size');
      }

      // Method 5: Extract queue information
      const queueElement = element.querySelector('.queue-duration, .flowfile-queue, [data-queue-duration]');
      if (queueElement) {
        flowFileInfo.queueDuration = queueElement.textContent?.trim() || 
                                    queueElement.getAttribute('data-queue-duration');
      }

      // Method 6: Look for attributes button or count
      const attributesElement = element.querySelector('.flowfile-attributes, .attributes-count, [data-attributes]');
      if (attributesElement) {
        flowFileInfo.attributesCount = attributesElement.textContent?.trim() || 
                                      attributesElement.getAttribute('data-attributes');
      }

      // Method 7: Extract from classes
      const classes = Array.from(element.classList);
      flowFileInfo.type = 'flowfile';
      flowFileInfo.subType = this.extractFlowFileSubType(classes);

      // Method 8: Get position
      flowFileInfo.position = this.getElementPosition(element);

      // Method 9: Look for connection context (which queue/connection this FlowFile belongs to)
      flowFileInfo.connectionId = this.findParentConnectionId(element);
      
      // Method 10: Try to extract from context menu or tooltip data
      flowFileInfo.tooltipData = this.extractTooltipData(element);

      // Create a unique identifier if UUID is not available
      if (!flowFileInfo.uuid && flowFileInfo.filename) {
        flowFileInfo.uuid = `flowfile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Check if this looks like a valid FlowFile
      if (!flowFileInfo.uuid && !flowFileInfo.filename && !flowFileInfo.fileSize) {
        return null; // Not a valid FlowFile
      }

      // Create a more complete FlowFile object
      flowFileInfo.element = element;
      flowFileInfo.timestamp = new Date();
      flowFileInfo.isFlowFile = true;

      SuperTabsLogger.debug('CanvasDetector', 'FlowFile extracted', flowFileInfo);
      return flowFileInfo;

    } catch (error) {
      SuperTabsLogger.warn('CanvasDetector', 'Failed to extract FlowFile info', error);
      return null;
    }
  }

  extractFlowFileSubType(classes) {
    const typeMap = {
      'queued': 'queued',
      'active': 'active',
      'selected': 'selected',
      'flowfile-item': 'listing',
      'flowfile-row': 'listing',
      'queue-listing-flowfile': 'queue-listing'
    };

    for (const className of classes) {
      if (typeMap[className]) {
        return typeMap[className];
      }
    }
    return 'unknown';
  }

  findParentConnectionId(element) {
    // Look up the DOM tree to find parent connection or queue context
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const connectionId = parent.getAttribute('data-connection-id') || 
                          parent.getAttribute('data-id') ||
                          parent.id;
      if (connectionId && (connectionId.includes('connection') || connectionId.includes('queue'))) {
        return connectionId;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  extractTooltipData(element) {
    const tooltip = element.getAttribute('title') || 
                   element.getAttribute('data-tooltip') ||
                   element.getAttribute('aria-label');
    
    if (tooltip) {
      try {
        // Try to parse if it's JSON
        return JSON.parse(tooltip);
      } catch {
        // Return as plain text
        return { text: tooltip };
      }
    }
    return null;
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

  bindFlowFileEvents(element, flowFileInfo) {
    // FlowFile click detection
    element.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent canvas click
      this.handleFlowFileClick(flowFileInfo, event);
    });

    // FlowFile hover effects
    element.addEventListener('mouseenter', () => {
      this.handleFlowFileHover(flowFileInfo, true);
    });

    element.addEventListener('mouseleave', () => {
      this.handleFlowFileHover(flowFileInfo, false);
    });

    // Double-click for detailed view
    element.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      this.handleFlowFileDoubleClick(flowFileInfo, event);
    });

    // Context menu for FlowFile actions
    element.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.handleFlowFileContextMenu(flowFileInfo, event);
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

  handleFlowFileClick(flowFileInfo, event) {
    SuperTabsLogger.debug('CanvasDetector', 'FlowFile clicked', flowFileInfo);
    
    this.selectedComponent = flowFileInfo;
    
    // Highlight the clicked FlowFile
    this.highlightFlowFile(flowFileInfo.uuid);
    
    // Notify all listeners
    this.notifyClickListeners('flowfile', flowFileInfo, event);

    // Auto-open sidebar if enabled
    if (this.autoOpen) {
      this.notifyAutoOpen(flowFileInfo);
    }
  }

  handleFlowFileHover(flowFileInfo, isEntering) {
    if (isEntering) {
      flowFileInfo.element?.classList.add('supertabs-hover');
      this.showFlowFileTooltip(flowFileInfo);
    } else {
      flowFileInfo.element?.classList.remove('supertabs-hover');
      this.hideFlowFileTooltip();
    }
  }

  handleFlowFileDoubleClick(flowFileInfo, event) {
    SuperTabsLogger.debug('CanvasDetector', 'FlowFile double-clicked', flowFileInfo);
    
    // Notify listeners for detailed view
    this.notifyClickListeners('flowfile-details', flowFileInfo, event);
    
    // Could open FlowFile details dialog, attributes, etc.
    this.openFlowFileDetails(flowFileInfo);
  }

  handleFlowFileContextMenu(flowFileInfo, event) {
    SuperTabsLogger.debug('CanvasDetector', 'FlowFile context menu', flowFileInfo);
    
    // Show context menu with FlowFile actions
    this.showFlowFileContextMenu(flowFileInfo, event.clientX, event.clientY);
  }

  highlightFlowFile(flowFileUuid) {
    // Clear previous highlights
    this.clearHighlights();
    
    // Find and highlight the FlowFile
    const flowFileElements = document.querySelectorAll(
      `[data-flowfile-uuid="${flowFileUuid}"], [data-uuid="${flowFileUuid}"]`
    );
    
    flowFileElements.forEach(element => {
      element.classList.add('supertabs-selected');
    });
  }

  showFlowFileTooltip(flowFileInfo) {
    // Create or update tooltip with FlowFile information
    let tooltip = document.getElementById('supertabs-flowfile-tooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'supertabs-flowfile-tooltip';
      tooltip.className = 'supertabs-tooltip';
      document.body.appendChild(tooltip);
    }

    const tooltipContent = `
      <div class="flowfile-tooltip-content">
        <h4>FlowFile Information</h4>
        ${flowFileInfo.filename ? `<p><strong>Filename:</strong> ${flowFileInfo.filename}</p>` : ''}
        ${flowFileInfo.fileSize ? `<p><strong>Size:</strong> ${flowFileInfo.fileSize}</p>` : ''}
        ${flowFileInfo.uuid ? `<p><strong>UUID:</strong> ${flowFileInfo.uuid.substring(0, 8)}...</p>` : ''}
        ${flowFileInfo.queueDuration ? `<p><strong>Queue Duration:</strong> ${flowFileInfo.queueDuration}</p>` : ''}
        ${flowFileInfo.connectionId ? `<p><strong>Connection:</strong> ${flowFileInfo.connectionId}</p>` : ''}
      </div>
    `;

    tooltip.innerHTML = tooltipContent;
    tooltip.style.display = 'block';

    // Position tooltip near mouse
    const rect = flowFileInfo.element.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${rect.top}px`;
  }

  hideFlowFileTooltip() {
    const tooltip = document.getElementById('supertabs-flowfile-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  openFlowFileDetails(flowFileInfo) {
    // This could trigger opening the FlowFile details in the sidebar
    // or in a separate dialog
    if (typeof window.superTabsSidebar !== 'undefined') {
      window.superTabsSidebar.showFlowFileDetails(flowFileInfo);
    }
  }

  showFlowFileContextMenu(flowFileInfo, x, y) {
    // Create context menu with FlowFile-specific actions
    let contextMenu = document.getElementById('supertabs-flowfile-context-menu');
    
    if (!contextMenu) {
      contextMenu = document.createElement('div');
      contextMenu.id = 'supertabs-flowfile-context-menu';
      contextMenu.className = 'supertabs-context-menu';
      document.body.appendChild(contextMenu);
    }

    const menuItems = [
      { label: 'View Details', action: 'details' },
      { label: 'View Attributes', action: 'attributes' },
      { label: 'View Content', action: 'content' },
      { label: 'Download Content', action: 'download' },
      { label: 'View Lineage', action: 'lineage' },
      { label: 'Copy UUID', action: 'copy-uuid' }
    ];

    const menuHTML = menuItems.map(item => 
      `<div class="context-menu-item" data-action="${item.action}">${item.label}</div>`
    ).join('');

    contextMenu.innerHTML = menuHTML;
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;

    // Add click handlers
    contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        this.executeFlowFileAction(flowFileInfo, item.dataset.action);
        contextMenu.style.display = 'none';
      });
    });

    // Hide menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', () => {
        contextMenu.style.display = 'none';
      }, { once: true });
    }, 100);
  }

  executeFlowFileAction(flowFileInfo, action) {
    SuperTabsLogger.debug('CanvasDetector', `Executing FlowFile action: ${action}`, flowFileInfo);
    
    switch (action) {
      case 'details':
        this.openFlowFileDetails(flowFileInfo);
        break;
      case 'attributes':
        this.showFlowFileAttributes(flowFileInfo);
        break;
      case 'content':
        this.showFlowFileContent(flowFileInfo);
        break;
      case 'download':
        this.downloadFlowFileContent(flowFileInfo);
        break;
      case 'lineage':
        this.showFlowFileLineage(flowFileInfo);
        break;
      case 'copy-uuid':
        this.copyFlowFileUUID(flowFileInfo);
        break;
      default:
        SuperTabsLogger.warn('CanvasDetector', `Unknown FlowFile action: ${action}`);
    }
  }

  showFlowFileAttributes(flowFileInfo) {
    // Show FlowFile attributes in sidebar
    if (typeof window.superTabsSidebar !== 'undefined') {
      window.superTabsSidebar.showFlowFileAttributes(flowFileInfo);
    }
  }

  showFlowFileContent(flowFileInfo) {
    // Show FlowFile content preview
    if (typeof window.superTabsSidebar !== 'undefined') {
      window.superTabsSidebar.showFlowFileContent(flowFileInfo);
    }
  }

  downloadFlowFileContent(flowFileInfo) {
    // Trigger download of FlowFile content
    if (typeof window.nifiApiClient !== 'undefined') {
      window.nifiApiClient.downloadFlowFileContent(flowFileInfo);
    }
  }

  showFlowFileLineage(flowFileInfo) {
    // Show FlowFile lineage/provenance
    if (typeof window.superTabsSidebar !== 'undefined') {
      window.superTabsSidebar.showFlowFileLineage(flowFileInfo);
    }
  }

  copyFlowFileUUID(flowFileInfo) {
    if (flowFileInfo.uuid) {
      navigator.clipboard.writeText(flowFileInfo.uuid).then(() => {
        SuperTabsLogger.info('CanvasDetector', 'FlowFile UUID copied to clipboard');
        this.showTemporaryMessage('UUID copied to clipboard!');
      }).catch(err => {
        SuperTabsLogger.error('CanvasDetector', 'Failed to copy UUID', err);
      });
    }
  }

  showTemporaryMessage(message) {
    // Show a temporary notification message
    const notification = document.createElement('div');
    notification.className = 'supertabs-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--nifi-primary-blue);
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
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
    // Clear existing components and FlowFiles
    this.componentElements.clear();
    
    // Rescan for components and FlowFiles
    this.setupComponentDetection();
    
    SuperTabsLogger.debug('CanvasDetector', 'Components and FlowFiles rescanned');
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