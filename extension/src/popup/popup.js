// SuperTabs - Popup JavaScript
// Handles popup UI interactions and settings

class SuperTabsPopup {
  constructor() {
    this.settings = {};
    this.currentTab = null;
    this.isNiFiPage = false;
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime;
  }

  async init() {
    try {
      // Load current settings
      await this.loadSettings();
      
      // Check current tab (only in extension context)
      if (this.isExtensionContext) {
        await this.checkCurrentTab();
      }
      
      // Update UI
      this.updateUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Check statuses
      this.checkStatuses();
      
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.info('Popup initialized');
      } else {
        console.log('[SuperTabs] Popup initialized');
      }
    } catch (error) {
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.error('Failed to initialize popup', error);
      } else {
        console.error('[SuperTabs] Failed to initialize popup:', error);
      }
    }
  }

  async loadSettings() {
    if (typeof superTabsStorage !== 'undefined') {
      this.settings = await superTabsStorage.getSettings();
    } else {
      // Fallback settings for testing
      this.settings = {
        autoOpen: true,
        alignmentEnabled: true,
        expressionLanguageEnabled: true,
        debugMode: false,
        phi4ApiKey: '',
        claudeApiKey: '',
        preferClaude: false
      };
    }
  }

  async checkCurrentTab() {
    if (!this.isExtensionContext) {
      // For testing outside extension context
      this.currentTab = { url: 'https://localhost:8443/nifi/canvas' };
      this.isNiFiPage = true;
      return;
    }

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        this.currentTab = tabs[0];
        this.isNiFiPage = this.isNiFiUrl(this.currentTab.url);
      }
    } catch (error) {
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.error('Failed to check current tab', error);
      } else {
        console.error('[SuperTabs] Failed to check current tab:', error);
      }
    }
  }

  isNiFiUrl(url) {
    if (!url) return false;
    const nifiPatterns = [
      /^https:\/\/localhost:8443\/nifi/,
      /^https:\/\/[^\/]+\/nifi/,
      /\/nifi\//
    ];
    return nifiPatterns.some(pattern => pattern.test(url));
  }

  updateUI() {
    // Update status indicators
    this.updateNiFiStatus();
    this.updateAIStatus();
    
    // Update toggle switches
    this.updateToggles();
    
    // Enable/disable actions based on context
    this.updateActions();
  }

  updateNiFiStatus() {
    const statusElement = document.getElementById('nifi-status');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');

    if (this.isNiFiPage) {
      statusElement.className = 'status-indicator connected';
      dot.className = 'status-dot connected';
      text.textContent = 'Conectado ao NiFi';
    } else {
      statusElement.className = 'status-indicator inactive';
      dot.className = 'status-dot inactive';
      text.textContent = 'Abra uma página do NiFi';
    }
  }

  updateAIStatus() {
    const statusElement = document.getElementById('ai-status');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');

    const hasAIKey = this.settings.phi4ApiKey || this.settings.claudeApiKey;

    if (hasAIKey) {
      statusElement.className = 'status-indicator connected';
      dot.className = 'status-dot connected';
      text.textContent = `IA configurada (${this.settings.preferClaude && this.settings.claudeApiKey ? 'Claude' : 'PHI-4'})`;
    } else {
      statusElement.className = 'status-indicator inactive';
      dot.className = 'status-dot inactive';
      text.textContent = 'Configure as chaves da IA';
    }
  }

  updateToggles() {
    this.setToggleState('auto-open-toggle', this.settings.autoOpen);
    this.setToggleState('alignment-toggle', this.settings.alignmentEnabled);
    this.setToggleState('expression-toggle', this.settings.expressionLanguageEnabled);
    this.setToggleState('debug-toggle', this.settings.debugMode);
  }

  setToggleState(toggleId, isActive) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.classList.toggle('active', isActive);
    }
  }

  updateActions() {
    const actions = ['toggle-sidebar', 'open-expression-generator', 'align-components'];
    
    actions.forEach(actionId => {
      const button = document.getElementById(actionId);
      if (button) {
        button.style.opacity = this.isNiFiPage ? '1' : '0.5';
        button.style.pointerEvents = this.isNiFiPage ? 'auto' : 'none';
      }
    });
  }

  setupEventListeners() {
    // Toggle switches
    this.setupToggleListener('auto-open-toggle', 'autoOpen');
    this.setupToggleListener('alignment-toggle', 'alignmentEnabled');
    this.setupToggleListener('expression-toggle', 'expressionLanguageEnabled');
    this.setupToggleListener('debug-toggle', 'debugMode');

    // Action buttons
    document.getElementById('toggle-sidebar')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('open-expression-generator')?.addEventListener('click', () => this.openExpressionGenerator());
    document.getElementById('align-components')?.addEventListener('click', () => this.alignComponents());
    document.getElementById('open-settings')?.addEventListener('click', () => this.openSettings());

    // Footer links
    document.getElementById('open-full-settings')?.addEventListener('click', () => this.openFullSettings());
    document.getElementById('view-logs')?.addEventListener('click', () => this.viewLogs());
    document.getElementById('export-settings')?.addEventListener('click', () => this.exportSettings());
  }

  setupToggleListener(toggleId, settingKey) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('click', async () => {
        const newValue = !this.settings[settingKey];
        await this.updateSetting(settingKey, newValue);
        this.setToggleState(toggleId, newValue);
      });
    }
  }

  async updateSetting(key, value) {
    try {
      this.settings[key] = value;
      if (typeof superTabsStorage !== 'undefined') {
        await superTabsStorage.setSetting(key, value);
      }
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.info(`Setting updated: ${key} = ${value}`);
      } else {
        console.log(`[SuperTabs] Setting updated: ${key} = ${value}`);
      }
    } catch (error) {
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.error(`Failed to update setting ${key}`, error);
      } else {
        console.error(`[SuperTabs] Failed to update setting ${key}:`, error);
      }
    }
  }

  async checkStatuses() {
    // Check if extension is working on current page
    if (this.isNiFiPage && this.isExtensionContext) {
      try {
        await chrome.tabs.sendMessage(this.currentTab.id, { action: 'PING' });
        // If no error, content script is loaded
      } catch (error) {
        // Content script not loaded, show warning
        this.showContentScriptWarning();
      }
    }
  }

  showContentScriptWarning() {
    const statusElement = document.getElementById('nifi-status');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');

    statusElement.className = 'status-indicator disconnected';
    dot.className = 'status-dot disconnected';
    text.textContent = 'Recarregue a página do NiFi';
  }

  // Action handlers
  async toggleSidebar() {
    if (!this.isNiFiPage || !this.isExtensionContext) return;

    try {
      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'TOGGLE_SIDEBAR'
      });
      window.close();
    } catch (error) {
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.error('Failed to toggle sidebar', error);
      } else {
        console.error('[SuperTabs] Failed to toggle sidebar:', error);
      }
    }
  }

  async openExpressionGenerator() {
    if (!this.isNiFiPage || !this.isExtensionContext) return;

    try {
      await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'OPEN_EXPRESSION_GENERATOR'
      });
      window.close();
    } catch (error) {
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.error('Failed to open expression generator', error);
      } else {
        console.error('[SuperTabs] Failed to open expression generator:', error);
      }
    }
  }

  async alignComponents() {
    if (!this.isNiFiPage || !this.isExtensionContext) return;

    try {
      const result = await chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'ALIGN_COMPONENTS'
      });
      
      if (result.success) {
        this.showTemporaryMessage('Componentes alinhados com sucesso!', 'success');
      } else {
        this.showTemporaryMessage('Falha no alinhamento: ' + result.error, 'error');
      }
    } catch (error) {
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.error('Failed to align components', error);
      } else {
        console.error('[SuperTabs] Failed to align components:', error);
      }
      this.showTemporaryMessage('Erro ao alinhar componentes', 'error');
    }
  }

  openSettings() {
    if (this.isExtensionContext) {
      chrome.runtime.openOptionsPage();
      window.close();
    }
  }

  openFullSettings() {
    if (this.isExtensionContext) {
      chrome.runtime.openOptionsPage();
      window.close();
    }
  }

  async viewLogs() {
    try {
      let logs = '';
      if (typeof SuperTabsLogger !== 'undefined') {
        logs = SuperTabsLogger.exportLogs();
      } else {
        logs = JSON.stringify({ message: 'Logs não disponíveis fora do contexto da extensão' }, null, 2);
      }
      
      if (this.isExtensionContext) {
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        await chrome.downloads.download({
          url: url,
          filename: `supertabs-logs-${new Date().toISOString().slice(0, 19)}.json`
        });
        
        this.showTemporaryMessage('Logs exportados', 'success');
      } else {
        // Fallback for testing
        console.log('[SuperTabs] Export logs:', logs);
        this.showTemporaryMessage('Logs mostrados no console', 'info');
      }
    } catch (error) {
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.error('Failed to export logs', error);
      } else {
        console.error('[SuperTabs] Failed to export logs:', error);
      }
      this.showTemporaryMessage('Erro ao exportar logs', 'error');
    }
  }

  async exportSettings() {
    try {
      let exportData = '';
      if (typeof superTabsStorage !== 'undefined') {
        exportData = await superTabsStorage.exportSettings();
      } else {
        exportData = JSON.stringify(this.settings, null, 2);
      }
      
      if (this.isExtensionContext) {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        await chrome.downloads.download({
          url: url,
          filename: `supertabs-settings-${new Date().toISOString().slice(0, 19)}.json`
        });
        
        this.showTemporaryMessage('Configurações exportadas', 'success');
      } else {
        // Fallback for testing
        console.log('[SuperTabs] Export settings:', exportData);
        this.showTemporaryMessage('Configurações mostradas no console', 'info');
      }
    } catch (error) {
      if (typeof SuperTabsLogger !== 'undefined') {
        SuperTabsLogger.error('Failed to export settings', error);
      } else {
        console.error('[SuperTabs] Failed to export settings:', error);
      }
      this.showTemporaryMessage('Erro ao exportar configurações', 'error');
    }
  }

  showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `supertabs-alert ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '10px';
    messageDiv.style.left = '10px';
    messageDiv.style.right = '10px';
    messageDiv.style.zIndex = '10000';
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  // Keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            this.toggleSidebar();
            break;
          case '2':
            event.preventDefault();
            this.openExpressionGenerator();
            break;
          case '3':
            event.preventDefault();
            this.alignComponents();
            break;
        }
      }
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popup = new SuperTabsPopup();
  popup.init();
});

// Handle messages from background script (only in extension context)
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Popup received message:', message);
    
    switch (message.action) {
      case 'SETTINGS_UPDATED':
        location.reload(); // Reload popup to reflect changes
        break;
    }
  });
}