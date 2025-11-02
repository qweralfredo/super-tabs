/**
 * SuperTabs - Sidebar Component
 * Main sidebar with tabs for component information
 */

class SuperTabsSidebar {
  constructor() {
    this.isVisible = false;
    this.currentTab = 'info';
    this.currentComponent = null;
    this.element = null;
    this.tabs = ['info', 'stats', 'chat'];
    this.resizeWidth = 400;
    this.isResizing = false;
    
    // Tab instances
    this.tabInstances = {};
    
    this.initialize();
  }

  async initialize() {
    try {
      SuperTabsLogger.debug('Sidebar', 'Initializing sidebar component');
      
      await this.createSidebarElement();
      this.bindEvents();
      this.setupResizing();
      
      SuperTabsLogger.info('Sidebar', 'Sidebar initialized successfully');
    } catch (error) {
      SuperTabsLogger.error('Sidebar', 'Failed to initialize sidebar', error);
    }
  }

  async createSidebarElement() {
    // Remove existing sidebar if present
    const existing = document.getElementById('supertabs-sidebar');
    if (existing) {
      existing.remove();
    }

    // Create main sidebar container
    this.element = document.createElement('div');
    this.element.id = 'supertabs-sidebar';
    this.element.className = 'supertabs-sidebar';
    this.element.style.width = `${this.resizeWidth}px`;

    // Create sidebar structure
    this.element.innerHTML = `
      <div class="supertabs-resize-handle"></div>
      
      <div class="supertabs-sidebar-header">
        <div class="supertabs-sidebar-title-container">
          <h3 class="supertabs-sidebar-title">SuperTabs</h3>
          <p class="supertabs-sidebar-subtitle">Apache NiFi Enhancement</p>
        </div>
        <div class="supertabs-sidebar-controls">
          <button class="supertabs-sidebar-control-btn" id="supertabs-minimize-btn" title="Minimize">
            <span>-</span>
          </button>
          <button class="supertabs-sidebar-control-btn" id="supertabs-resize-btn" title="Resize">
            <span>⟷</span>
          </button>
          <button class="supertabs-sidebar-control-btn" id="supertabs-close-btn" title="Close">
            <span>×</span>
          </button>
        </div>
      </div>

      <div class="supertabs-component-info" id="supertabs-component-info">
        <div class="supertabs-empty">
          <div class="supertabs-empty-icon">📋</div>
          <div class="supertabs-empty-title">No Component Selected</div>
          <div class="supertabs-empty-message">Click on a NiFi component to view details</div>
        </div>
      </div>

      <div class="supertabs-tabs-container">
        <div class="supertabs-tab-header">
          <button class="supertabs-tab-btn active" data-tab="info" id="supertabs-tab-info">
            Info
          </button>
          <button class="supertabs-tab-btn" data-tab="stats" id="supertabs-tab-stats">
            Stats
            <span class="supertabs-tab-badge" id="supertabs-stats-badge" style="display: none;">0</span>
          </button>
          <button class="supertabs-tab-btn" data-tab="chat" id="supertabs-tab-chat">
            Chat
            <span class="supertabs-tab-badge" id="supertabs-chat-badge" style="display: none;">0</span>
          </button>
        </div>

        <div class="supertabs-tab-content">
          <div class="supertabs-tab-pane active" id="supertabs-pane-info">
            <div class="supertabs-loading">
              <div class="supertabs-spinner"></div>
              Loading component information...
            </div>
          </div>

          <div class="supertabs-tab-pane" id="supertabs-pane-stats">
            <div class="supertabs-loading">
              <div class="supertabs-spinner"></div>
              Loading statistics...
            </div>
          </div>

          <div class="supertabs-tab-pane" id="supertabs-pane-chat">
            <div class="supertabs-loading">
              <div class="supertabs-spinner"></div>
              Initializing AI chat...
            </div>
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.element);

    // Initialize tab instances after DOM is ready
    await this.initializeTabInstances();
  }

  async initializeTabInstances() {
    try {
      // Use classes from global scope (loaded by manifest.json)
      const SuperTabsInfoTab = window.SuperTabsInfoTab;
      const SuperTabsStatsTab = window.SuperTabsStatsTab;
      const SuperTabsChatTab = window.SuperTabsChatTab;

      if (!SuperTabsInfoTab || !SuperTabsStatsTab || !SuperTabsChatTab) {
        throw new Error('Tab classes not found in global scope');
      }

      // Initialize each tab
      this.tabInstances = {
        info: new SuperTabsInfoTab(document.getElementById('supertabs-pane-info')),
        stats: new SuperTabsStatsTab(document.getElementById('supertabs-pane-stats')),
        chat: new SuperTabsChatTab(document.getElementById('supertabs-pane-chat'))
      };

      // Initialize each tab instance
      for (const [tabName, tabInstance] of Object.entries(this.tabInstances)) {
        if (tabInstance && typeof tabInstance.init === 'function') {
          await tabInstance.init();
        }
      }

      SuperTabsLogger.debug('Sidebar', 'Tab instances initialized');
    } catch (error) {
      SuperTabsLogger.error('Sidebar', 'Failed to initialize tab instances', error);
      this.showTabLoadError();
    }
  }

  bindEvents() {
    // Control buttons
    const minimizeBtn = this.element.querySelector('#supertabs-minimize-btn');
    const resizeBtn = this.element.querySelector('#supertabs-resize-btn');
    const closeBtn = this.element.querySelector('#supertabs-close-btn');

    minimizeBtn?.addEventListener('click', () => this.minimize());
    resizeBtn?.addEventListener('click', () => this.toggleSize());
    closeBtn?.addEventListener('click', () => this.hide());

    // Tab switching
    const tabButtons = this.element.querySelectorAll('.supertabs-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.isVisible && e.key === 'Escape') {
        this.hide();
      }
    });

    // Click outside to hide (optional)
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.element.contains(e.target) && !e.target.closest('.processor, .port, .connection, .process-group')) {
        // Optional: uncomment to hide on outside click
        // this.hide();
      }
    });
  }

  setupResizing() {
    const resizeHandle = this.element.querySelector('.supertabs-resize-handle');
    
    resizeHandle.addEventListener('mousedown', (e) => {
      this.isResizing = true;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      
      const startX = e.clientX;
      const startWidth = this.resizeWidth;

      const handleMouseMove = (e) => {
        if (!this.isResizing) return;
        
        const deltaX = startX - e.clientX;
        const newWidth = Math.max(320, Math.min(600, startWidth + deltaX));
        
        this.resizeWidth = newWidth;
        this.element.style.width = `${newWidth}px`;
      };

      const handleMouseUp = async () => {
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Save width preference
        const settings = await SuperTabsStorage.getSettings();
        settings.sidebarWidth = this.resizeWidth;
        await SuperTabsStorage.saveSettings(settings);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }

  async show(component = null) {
    try {
      SuperTabsLogger.debug('Sidebar', 'Showing sidebar', { component });

      this.element.classList.add('visible');
      this.isVisible = true;

      if (component) {
        await this.setComponent(component);
      }

      // Focus management
      setTimeout(() => {
        const activeTab = this.element.querySelector('.supertabs-tab-btn.active');
        activeTab?.focus();
      }, 300);

      // Load saved preferences
      const settings = await SuperTabsStorage.getSettings();
      const savedWidth = settings.sidebarWidth;
      if (savedWidth && savedWidth !== this.resizeWidth) {
        this.resizeWidth = savedWidth;
        this.element.style.width = `${this.resizeWidth}px`;
      }

      SuperTabsLogger.info('Sidebar', 'Sidebar shown successfully');
    } catch (error) {
      SuperTabsLogger.error('Sidebar', 'Failed to show sidebar', error);
    }
  }

  async showForComponent(component) {
    return await this.show(component);
  }

  hide() {
    SuperTabsLogger.debug('Sidebar', 'Hiding sidebar');
    
    this.element.classList.remove('visible');
    this.isVisible = false;
    this.currentComponent = null;

    // Clear component info
    this.updateComponentInfo(null);
  }

  minimize() {
    this.element.classList.toggle('minimized');
    const isMinimized = this.element.classList.contains('minimized');
    
    SuperTabsLogger.debug('Sidebar', `Sidebar ${isMinimized ? 'minimized' : 'expanded'}`);
  }

  toggleSize() {
    const isWide = this.element.classList.contains('wide');
    const isNarrow = this.element.classList.contains('narrow');

    this.element.classList.remove('wide', 'narrow');

    if (!isWide && !isNarrow) {
      this.element.classList.add('narrow');
    } else if (isNarrow) {
      this.element.classList.add('wide');
    }
    // If wide, return to normal (no class)
  }

  async setComponent(component) {
    try {
      SuperTabsLogger.debug('Sidebar', 'Setting component', { 
        id: component.id,
        type: component.component?.type || component.type 
      });

      this.currentComponent = component;
      
      // Update component info display
      this.updateComponentInfo(component);
      
      // Update all tabs with new component
      for (const [tabName, tabInstance] of Object.entries(this.tabInstances)) {
        if (tabInstance && typeof tabInstance.setComponent === 'function') {
          await tabInstance.setComponent(component);
        }
      }

      // Refresh current tab
      await this.refreshCurrentTab();

      SuperTabsLogger.info('Sidebar', 'Component set successfully');
    } catch (error) {
      SuperTabsLogger.error('Sidebar', 'Failed to set component', error);
      this.showError('Failed to load component information');
    }
  }

  updateComponentInfo(component) {
    const infoContainer = this.element.querySelector('#supertabs-component-info');
    
    if (!component) {
      infoContainer.innerHTML = `
        <div class="supertabs-empty">
          <div class="supertabs-empty-icon">📋</div>
          <div class="supertabs-empty-title">No Component Selected</div>
          <div class="supertabs-empty-message">Click on a NiFi component to view details</div>
        </div>
      `;
      return;
    }

    const comp = component.component || component;
    const name = comp.name || comp.id || 'Unknown Component';
    const type = comp.type || 'Unknown Type';
    const id = comp.id || 'N/A';
    const state = comp.state || 'UNKNOWN';

    // Status mapping
    const statusMap = {
      'RUNNING': { class: 'running', text: 'Running' },
      'STOPPED': { class: 'stopped', text: 'Stopped' },
      'INVALID': { class: 'invalid', text: 'Invalid' },
      'DISABLED': { class: 'disabled', text: 'Disabled' },
      'UNKNOWN': { class: 'disabled', text: 'Unknown' }
    };

    const status = statusMap[state] || statusMap['UNKNOWN'];

    infoContainer.innerHTML = `
      <div class="supertabs-component-name">
        <span>${name}</span>
        <span class="supertabs-component-type">${type}</span>
      </div>
      <p class="supertabs-component-id">${id}</p>
      <div class="supertabs-component-status">
        <span class="supertabs-status-dot ${status.class}"></span>
        <span class="supertabs-status-text">${status.text}</span>
      </div>
    `;
  }

  async switchTab(tabName) {
    try {
      SuperTabsLogger.debug('Sidebar', 'Switching tab', { from: this.currentTab, to: tabName });

      if (!this.tabs.includes(tabName)) {
        throw new Error(`Invalid tab: ${tabName}`);
      }

      // Update tab buttons
      const tabButtons = this.element.querySelectorAll('.supertabs-tab-btn');
      tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
      });

      // Update tab panes
      const tabPanes = this.element.querySelectorAll('.supertabs-tab-pane');
      tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `supertabs-pane-${tabName}`);
      });

      this.currentTab = tabName;

      // Refresh the newly active tab
      await this.refreshCurrentTab();

      SuperTabsLogger.info('Sidebar', `Switched to ${tabName} tab`);
    } catch (error) {
      SuperTabsLogger.error('Sidebar', 'Failed to switch tab', error);
    }
  }

  async refreshCurrentTab() {
    try {
      const tabInstance = this.tabInstances[this.currentTab];
      if (tabInstance && typeof tabInstance.refresh === 'function') {
        await tabInstance.refresh();
      }
    } catch (error) {
      SuperTabsLogger.error('Sidebar', `Failed to refresh ${this.currentTab} tab`, error);
    }
  }

  updateTabBadge(tabName, count) {
    const badge = this.element.querySelector(`#supertabs-${tabName}-badge`);
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  showError(message) {
    const activePane = this.element.querySelector('.supertabs-tab-pane.active');
    if (activePane) {
      activePane.innerHTML = `
        <div class="supertabs-error">
          <div class="supertabs-error-title">Error</div>
          <p class="supertabs-error-message">${message}</p>
        </div>
      `;
    }
  }

  showTabLoadError() {
    // Show error in all tabs if tab instances failed to load
    const tabPanes = this.element.querySelectorAll('.supertabs-tab-pane');
    tabPanes.forEach(pane => {
      pane.innerHTML = `
        <div class="supertabs-error">
          <div class="supertabs-error-title">Failed to Load Tab</div>
          <p class="supertabs-error-message">Unable to initialize tab components. Please refresh the page.</p>
        </div>
      `;
    });
  }

  isComponentSelected() {
    return this.currentComponent !== null;
  }

  getCurrentComponent() {
    return this.currentComponent;
  }

  getCurrentTab() {
    return this.currentTab;
  }

  isOpen() {
    return this.isVisible;
  }

  // Public API for external communication
  async handleMessage(message) {
    try {
      switch (message.action) {
        case 'showComponent':
          await this.show(message.component);
          break;
        case 'hideComponent':
          this.hide();
          break;
        case 'switchTab':
          await this.switchTab(message.tab);
          break;
        case 'refreshTab':
          await this.refreshCurrentTab();
          break;
        case 'updateBadge':
          this.updateTabBadge(message.tab, message.count);
          break;
        default:
          SuperTabsLogger.warn('Sidebar', 'Unknown message action', message);
      }
    } catch (error) {
      SuperTabsLogger.error('Sidebar', 'Failed to handle message', error);
    }
  }

  // Cleanup
  destroy() {
    try {
      SuperTabsLogger.debug('Sidebar', 'Destroying sidebar');

      // Cleanup tab instances
      for (const tabInstance of Object.values(this.tabInstances)) {
        if (tabInstance && typeof tabInstance.destroy === 'function') {
          tabInstance.destroy();
        }
      }

      // Remove element
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      this.element = null;
      this.tabInstances = {};
      this.currentComponent = null;
      this.isVisible = false;

      SuperTabsLogger.info('Sidebar', 'Sidebar destroyed');
    } catch (error) {
      SuperTabsLogger.error('Sidebar', 'Failed to destroy sidebar', error);
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsSidebar };
} else if (typeof window !== 'undefined') {
  window.SuperTabsSidebar = SuperTabsSidebar;
}