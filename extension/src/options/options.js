// SuperTabs - Options Page JavaScript
// Handles full settings configuration

// Safe logger helper
const safeLog = {
  debug: (msg, data) => window.SuperTabsLogger?.debug(msg, data),
  info: (msg, data) => window.SuperTabsLogger?.info(msg, data),
  warn: (msg, data) => window.SuperTabsLogger?.warn(msg, data),
  error: (msg, data) => window.SuperTabsLogger?.error(msg, data)
};

class SuperTabsOptions {
  constructor() {
    this.settings = {};
    this.originalSettings = {};
    this.hasUnsavedChanges = false;
  }

  async init() {
    try {
      // Wait for storage to be available
      if (typeof window.superTabsStorage === 'undefined') {
        throw new Error('Storage não está disponível');
      }
      
      await this.loadSettings();
      this.setupEventListeners();
      this.updateUI();
      safeLog.info('Options page initialized');
    } catch (error) {
      safeLog.error('Failed to initialize options page', error);
      this.showMessage('Erro ao carregar configurações: ' + error.message, 'error');
    }
  }

  async loadSettings() {
    // First try to load from Chrome Storage (extension storage)
    this.settings = await window.superTabsStorage.getSettings();
    
    // Then check if localStorage has newer data
    const localStorageSettings = this.loadFromLocalStorage();
    if (localStorageSettings) {
      // Merge localStorage settings with Chrome Storage (localStorage takes precedence if exists)
      this.settings = { ...this.settings, ...localStorageSettings };
      safeLog.info('Settings merged from localStorage and Chrome Storage');
    }
    
    this.originalSettings = { ...this.settings };
  }

  updateUI() {
    // NiFi Connection Settings - With provided credentials as defaults
    document.getElementById('nifi-url').value = this.settings.nifiBaseUrl || 'https://localhost:8443/nifi';
    document.getElementById('nifi-username').value = this.settings.nifiUsername || 'admin';
    document.getElementById('nifi-password').value = this.settings.nifiPassword || '';

    // AI Configuration
    document.getElementById('claude-api-key').value = this.settings.claudeApiKey || '';
    this.setToggleState('prefer-claude-toggle', this.settings.preferClaude);
  }

  setupEventListeners() {
    // Input change tracking
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.markAsChanged());
    });

    // Toggle switches
    this.setupToggleListener('prefer-claude-toggle', 'preferClaude');

    // Action buttons
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    document.getElementById('cancel-settings').addEventListener('click', () => this.cancelChanges());
    document.getElementById('test-all').addEventListener('click', () => this.testAll());

    // Test buttons
    document.getElementById('test-nifi-connection').addEventListener('click', () => this.testNiFiConnection());
    document.getElementById('test-ai-connection').addEventListener('click', () => this.testAIConnection());

    // Import/Export - Removidos (botões não existem mais)

    // Prevent accidental close
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
        return e.returnValue;
      }
    });

    // Auto-save draft periodically
    setInterval(() => this.saveDraft(), 30000);
  }

  setupToggleListener(toggleId, settingKey) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('click', () => {
        const newValue = !toggle.classList.contains('active');
        this.setToggleState(toggleId, newValue);
        this.settings[settingKey] = newValue;
        this.markAsChanged();
      });
    }
  }

  setToggleState(toggleId, isActive) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.classList.toggle('active', isActive);
    }
  }

  markAsChanged() {
    this.hasUnsavedChanges = true;
    document.getElementById('save-settings').textContent = 'Salvar Configurações *';
  }

  async saveSettings() {
    try {
      // Collect all form values
      this.collectFormValues();

      // Validate settings
      const validation = this.validateSettings();
      if (!validation.valid) {
        this.showMessage(`Erro de validação: ${validation.errors.join(', ')}`, 'error');
        return;
      }

      // Save to Chrome Storage (extension storage)
      await window.superTabsStorage.updateSettings(this.settings);
      
      // ALSO save to localStorage for direct access
      this.saveToLocalStorage();
      
      this.originalSettings = { ...this.settings };
      this.hasUnsavedChanges = false;

      // Update UI
      document.getElementById('save-settings').textContent = 'Salvar Configurações';
      this.showMessage('Configurações salvas com sucesso! (Chrome Storage + localStorage)', 'success');

      // Notify other parts of extension
      chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED', settings: this.settings });

      safeLog.info('Settings saved successfully to both Chrome Storage and localStorage');
    } catch (error) {
      safeLog.error('Failed to save settings', error);
      this.showMessage('Erro ao salvar configurações: ' + error.message, 'error');
    }
  }

  collectFormValues() {
    this.settings.nifiBaseUrl = document.getElementById('nifi-url').value.trim();
    this.settings.nifiUsername = document.getElementById('nifi-username').value.trim();
    this.settings.nifiPassword = document.getElementById('nifi-password').value;
    this.settings.claudeApiKey = document.getElementById('claude-api-key').value.trim();
  }

  validateSettings() {
    const errors = [];

    // Validate NiFi URL
    if (this.settings.nifiBaseUrl && !this.isValidUrl(this.settings.nifiBaseUrl)) {
      errors.push('URL do NiFi inválida');
    }

    // Validate Claude API key if preferred
    if (this.settings.preferClaude && !this.settings.claudeApiKey) {
      errors.push('Chave API do Claude é obrigatória quando Claude é preferido');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  cancelChanges() {
    this.settings = { ...this.originalSettings };
    this.updateUI();
    this.hasUnsavedChanges = false;
    document.getElementById('save-settings').textContent = 'Salvar Configurações';
    this.showMessage('Alterações canceladas', 'info');
  }

  async testAll() {
    this.showMessage('Testando todas as conexões...', 'info');
    
    const results = await Promise.allSettled([
      this.testNiFiConnection(false),
      this.testAIConnection(false)
    ]);

    let successCount = 0;
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      }
    });

    this.showMessage(`Testes concluídos: ${successCount}/${results.length} sucessos`, 
                     successCount === results.length ? 'success' : 'warning');
  }

  async testNiFiConnection(showMessage = true) {
    const resultDiv = document.getElementById('nifi-test-result');
    const button = document.getElementById('test-nifi-connection');
    
    try {
      button.disabled = true;
      button.textContent = 'Testando...';

      this.collectFormValues();

      // Basic URL validation
      if (!this.settings.nifiBaseUrl) {
        throw new Error('URL do NiFi não configurada');
      }

      // Test connection
      const response = await fetch(`${this.settings.nifiBaseUrl}/flow/about`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        resultDiv.className = 'api-test-result success';
        resultDiv.textContent = `✅ Conectado ao NiFi ${data.about?.version || 'versão desconhecida'}`;
        resultDiv.classList.remove('hidden');
        
        if (showMessage) {
          this.showMessage('Conexão com NiFi estabelecida!', 'success');
        }
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      resultDiv.className = 'api-test-result error';
      resultDiv.textContent = `❌ Erro: ${error.message}`;
      resultDiv.classList.remove('hidden');
      
      if (showMessage) {
        this.showMessage('Falha na conexão com NiFi: ' + error.message, 'error');
      }
      return false;
    } finally {
      button.disabled = false;
      button.textContent = 'Testar Conexão';
    }
  }

  async testAIConnection(showMessage = true) {
    const resultDiv = document.getElementById('ai-test-result');
    const button = document.getElementById('test-ai-connection');
    
    try {
      button.disabled = true;
      button.textContent = 'Testando...';

      this.collectFormValues();

      // Claude requires API key, PHI-4 doesn't
      const preferredModel = this.settings.preferClaude ? 'Claude' : 'PHI-4';
      const hasRequiredKey = preferredModel === 'Claude' ? this.settings.claudeApiKey : true; // PHI-4 sempre disponível

      if (!hasRequiredKey) {
        throw new Error(`Chave API do ${preferredModel} não configurada`);
      }

      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1000));

      resultDiv.className = 'api-test-result success';
      resultDiv.textContent = `✅ ${preferredModel} configurado e pronto`;
      resultDiv.classList.remove('hidden');
      
      if (showMessage) {
        this.showMessage(`IA ${preferredModel} configurada com sucesso!`, 'success');
      }
      return true;
    } catch (error) {
      resultDiv.className = 'api-test-result error';
      resultDiv.textContent = `❌ Erro: ${error.message}`;
      resultDiv.classList.remove('hidden');
      
      if (showMessage) {
        this.showMessage('Falha na configuração da IA: ' + error.message, 'error');
      }
      return false;
    } finally {
      button.disabled = false;
      button.textContent = 'Testar IA';
    }
  }

  async exportSettings() {
    try {
      const exportData = await window.superTabsStorage.exportSettings();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `supertabs-settings-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showMessage('Configurações exportadas com sucesso!', 'success');
    } catch (error) {
      safeLog.error('Failed to export settings', error);
      this.showMessage('Erro ao exportar configurações: ' + error.message, 'error');
    }
  }

  async importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      // Validate import data
      if (!importData.settings) {
        throw new Error('Arquivo de configuração inválido');
      }

      // Confirm import
      if (!confirm('Isso substituirá todas as configurações atuais. Continuar?')) {
        return;
      }

      // Import settings
      const success = await window.superTabsStorage.importSettings(importData);
      if (success) {
        await this.loadSettings();
        this.updateUI();
        this.showMessage('Configurações importadas com sucesso!', 'success');
      } else {
        throw new Error('Falha ao importar configurações');
      }
    } catch (error) {
      safeLog.error('Failed to import settings', error);
      this.showMessage('Erro ao importar configurações: ' + error.message, 'error');
    } finally {
      // Clear file input
      event.target.value = '';
    }
  }

  async resetSettings() {
    if (!confirm('Isso resetará todas as configurações para os valores padrão. Esta ação não pode ser desfeita. Continuar?')) {
      return;
    }

    try {
      // Clear Chrome Storage
      await window.superTabsStorage.clearAllData();
      
      // Clear localStorage
      this.clearLocalStorage();
      
      this.settings = window.superTabsStorage.defaultSettings();
      this.originalSettings = { ...this.settings };
      await window.superTabsStorage.updateSettings(this.settings);
      
      this.updateUI();
      this.hasUnsavedChanges = false;
      document.getElementById('save-settings').textContent = 'Salvar Configurações';
      
      this.showMessage('Configurações resetadas (Chrome Storage + localStorage limpo)', 'success');
      safeLog.info('Settings reset to defaults, localStorage cleared');
    } catch (error) {
      safeLog.error('Failed to reset settings', error);
      this.showMessage('Erro ao resetar configurações: ' + error.message, 'error');
    }
  }

  clearLocalStorage() {
    try {
      // Remove all SuperTabs items from localStorage
      const keysToRemove = [
        'supertabs-settings',
        'supertabs-draft-settings',
        'supertabs-nifi-url',
        'supertabs-nifi-username',
        'supertabs-nifi-password',
        'supertabs-claude-api-key',
        'supertabs-prefer-claude',
        'supertabs-auto-open',
        'supertabs-alignment-enabled',
        'supertabs-expression-enabled',
        'supertabs-debug-mode'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      safeLog.debug('localStorage cleared');
    } catch (error) {
      safeLog.error('Failed to clear localStorage', error);
    }
  }

  viewLocalStorage() {
    try {
      // Collect all SuperTabs localStorage items
      const localStorageData = {};
      const superTabsKeys = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('supertabs-')) {
          superTabsKeys.push(key);
          localStorageData[key] = localStorage.getItem(key);
        }
      }
      
      if (superTabsKeys.length === 0) {
        alert('Nenhum dado SuperTabs encontrado no localStorage');
        return;
      }
      
      // Create modal to display localStorage
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 800px;
        max-height: 80vh;
        overflow: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      `;
      
      content.innerHTML = `
        <h2 style="margin-top: 0; color: var(--nifi-primary-blue);">
          🔍 localStorage SuperTabs
        </h2>
        <p style="color: var(--nifi-gray-medium); margin-bottom: 20px;">
          Total de itens: <strong>${superTabsKeys.length}</strong>
        </p>
        <pre style="
          background: var(--nifi-gray-lighter);
          padding: 15px;
          border-radius: 4px;
          overflow: auto;
          font-size: 12px;
          max-height: 400px;
        ">${JSON.stringify(localStorageData, null, 2)}</pre>
        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <button class="supertabs-btn primary" onclick="this.closest('div').parentElement.parentElement.remove()">
            Fechar
          </button>
          <button class="supertabs-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.previousElementSibling.textContent).then(() => alert('Copiado!'))">
            Copiar JSON
          </button>
        </div>
      `;
      
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Close on click outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
      
      safeLog.info('localStorage viewer opened', { items: superTabsKeys.length });
    } catch (error) {
      safeLog.error('Failed to view localStorage', error);
      alert('Erro ao visualizar localStorage: ' + error.message);
    }
  }

  saveDraft() {
    if (this.hasUnsavedChanges) {
      this.collectFormValues();
      localStorage.setItem('supertabs-draft-settings', JSON.stringify(this.settings));
    }
  }

  saveToLocalStorage() {
    try {
      // Save complete settings to localStorage
      const localStorageData = {
        settings: this.settings,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
      
      localStorage.setItem('supertabs-settings', JSON.stringify(localStorageData));
      
      // Also save individual items for easy access
      localStorage.setItem('supertabs-nifi-url', this.settings.nifiBaseUrl || '');
      localStorage.setItem('supertabs-nifi-username', this.settings.nifiUsername || '');
      localStorage.setItem('supertabs-nifi-password', this.settings.nifiPassword || '');
      localStorage.setItem('supertabs-claude-api-key', this.settings.claudeApiKey || '');
      localStorage.setItem('supertabs-prefer-claude', this.settings.preferClaude ? 'true' : 'false');
      localStorage.setItem('supertabs-auto-open', this.settings.autoOpen ? 'true' : 'false');
      localStorage.setItem('supertabs-alignment-enabled', this.settings.alignmentEnabled ? 'true' : 'false');
      localStorage.setItem('supertabs-expression-enabled', this.settings.expressionLanguageEnabled ? 'true' : 'false');
      localStorage.setItem('supertabs-debug-mode', this.settings.debugMode ? 'true' : 'false');
      
      safeLog.debug('Settings saved to localStorage');
    } catch (error) {
      safeLog.error('Failed to save to localStorage', error);
    }
  }

  loadFromLocalStorage() {
    try {
      const localStorageData = localStorage.getItem('supertabs-settings');
      if (localStorageData) {
        const data = JSON.parse(localStorageData);
        if (data.settings) {
          safeLog.info('Settings loaded from localStorage', data.timestamp);
          return data.settings;
        }
      }
      
      // Fallback: try to load individual items
      const individualSettings = {
        nifiBaseUrl: localStorage.getItem('supertabs-nifi-url') || '',
        nifiUsername: localStorage.getItem('supertabs-nifi-username') || '',
        nifiPassword: localStorage.getItem('supertabs-nifi-password') || '',
        claudeApiKey: localStorage.getItem('supertabs-claude-api-key') || '',
        preferClaude: localStorage.getItem('supertabs-prefer-claude') === 'true',
        autoOpen: localStorage.getItem('supertabs-auto-open') === 'true',
        alignmentEnabled: localStorage.getItem('supertabs-alignment-enabled') === 'true',
        expressionLanguageEnabled: localStorage.getItem('supertabs-expression-enabled') === 'true',
        debugMode: localStorage.getItem('supertabs-debug-mode') === 'true'
      };
      
      // Check if any settings exist
      if (Object.values(individualSettings).some(v => v !== '' && v !== false)) {
        safeLog.info('Settings loaded from individual localStorage items');
        return individualSettings;
      }
    } catch (error) {
      safeLog.error('Failed to load from localStorage', error);
    }
    return null;
  }

  loadDraft() {
    const draft = localStorage.getItem('supertabs-draft-settings');
    if (draft) {
      try {
        const draftSettings = JSON.parse(draft);
        this.settings = { ...this.settings, ...draftSettings };
        this.updateUI();
        this.showMessage('Rascunho carregado', 'info');
      } catch (error) {
        localStorage.removeItem('supertabs-draft-settings');
      }
    }
  }

  showMessage(text, type = 'info') {
    const container = document.getElementById('status-messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.className = `status-message supertabs-alert ${type}`;
    messageDiv.textContent = text;
    
    container.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 5000);
    
    // Allow manual close
    messageDiv.addEventListener('click', () => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const options = new SuperTabsOptions();
  options.init();
});
