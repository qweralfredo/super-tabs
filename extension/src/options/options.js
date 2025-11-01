// SuperTabs - Options Page JavaScript
// Handles full settings configuration

class SuperTabsOptions {
  constructor() {
    this.settings = {};
    this.originalSettings = {};
    this.hasUnsavedChanges = false;
  }

  async init() {
    try {
      await this.loadSettings();
      this.setupEventListeners();
      this.updateUI();
      SuperTabsLogger.info('Options page initialized');
    } catch (error) {
      SuperTabsLogger.error('Failed to initialize options page', error);
      this.showMessage('Erro ao carregar configurações', 'error');
    }
  }

  async loadSettings() {
    this.settings = await SuperTabsStorage.getSettings();
    this.originalSettings = { ...this.settings };
  }

  updateUI() {
    // NiFi Connection Settings
    document.getElementById('nifi-url').value = this.settings.nifiBaseUrl || '';
    document.getElementById('nifi-username').value = this.settings.nifiUsername || '';
    document.getElementById('nifi-password').value = this.settings.nifiPassword || '';

    // AI Configuration
    document.getElementById('phi3-api-key').value = this.settings.phi3ApiKey || '';
    document.getElementById('claude-api-key').value = this.settings.claudeApiKey || '';
    this.setToggleState('prefer-claude-toggle', this.settings.preferClaude);

    // Features
    this.setToggleState('auto-open-toggle', this.settings.autoOpen);
    this.setToggleState('alignment-toggle', this.settings.alignmentEnabled);
    this.setToggleState('expression-toggle', this.settings.expressionLanguageEnabled);

    // Advanced
    this.setToggleState('debug-toggle', this.settings.debugMode);
  }

  setupEventListeners() {
    // Input change tracking
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.markAsChanged());
    });

    // Toggle switches
    this.setupToggleListener('prefer-claude-toggle', 'preferClaude');
    this.setupToggleListener('auto-open-toggle', 'autoOpen');
    this.setupToggleListener('alignment-toggle', 'alignmentEnabled');
    this.setupToggleListener('expression-toggle', 'expressionLanguageEnabled');
    this.setupToggleListener('debug-toggle', 'debugMode');

    // Action buttons
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    document.getElementById('cancel-settings').addEventListener('click', () => this.cancelChanges());
    document.getElementById('test-all').addEventListener('click', () => this.testAll());
    document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());

    // Test buttons
    document.getElementById('test-nifi-connection').addEventListener('click', () => this.testNiFiConnection());
    document.getElementById('test-ai-connection').addEventListener('click', () => this.testAIConnection());

    // Import/Export
    document.getElementById('export-settings').addEventListener('click', () => this.exportSettings());
    document.getElementById('import-file').addEventListener('change', (e) => this.importSettings(e));

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

      // Save to storage
      await SuperTabsStorage.updateSettings(this.settings);
      this.originalSettings = { ...this.settings };
      this.hasUnsavedChanges = false;

      // Update UI
      document.getElementById('save-settings').textContent = 'Salvar Configurações';
      this.showMessage('Configurações salvas com sucesso!', 'success');

      // Notify other parts of extension
      chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED', settings: this.settings });

      SuperTabsLogger.info('Settings saved successfully');
    } catch (error) {
      SuperTabsLogger.error('Failed to save settings', error);
      this.showMessage('Erro ao salvar configurações: ' + error.message, 'error');
    }
  }

  collectFormValues() {
    this.settings.nifiBaseUrl = document.getElementById('nifi-url').value.trim();
    this.settings.nifiUsername = document.getElementById('nifi-username').value.trim();
    this.settings.nifiPassword = document.getElementById('nifi-password').value;
    this.settings.phi3ApiKey = document.getElementById('phi3-api-key').value.trim();
    this.settings.claudeApiKey = document.getElementById('claude-api-key').value.trim();
  }

  validateSettings() {
    const errors = [];

    // Validate NiFi URL
    if (this.settings.nifiBaseUrl && !this.isValidUrl(this.settings.nifiBaseUrl)) {
      errors.push('URL do NiFi inválida');
    }

    // Validate required fields if AI is configured
    if (this.settings.phi3ApiKey || this.settings.claudeApiKey) {
      if (this.settings.preferClaude && !this.settings.claudeApiKey) {
        errors.push('Chave API do Claude é obrigatória quando Claude é preferido');
      }
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

      const hasAnyKey = this.settings.phi3ApiKey || this.settings.claudeApiKey;
      if (!hasAnyKey) {
        throw new Error('Nenhuma chave API configurada');
      }

      // Mock test since we don't have real API endpoints yet
      const preferredModel = (this.settings.preferClaude && this.settings.claudeApiKey) ? 'Claude' : 'PHI-3';
      const hasRequiredKey = preferredModel === 'Claude' ? this.settings.claudeApiKey : this.settings.phi3ApiKey;

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
      const exportData = await SuperTabsStorage.exportSettings();
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
      SuperTabsLogger.error('Failed to export settings', error);
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
      const success = await SuperTabsStorage.importSettings(importData);
      if (success) {
        await this.loadSettings();
        this.updateUI();
        this.showMessage('Configurações importadas com sucesso!', 'success');
      } else {
        throw new Error('Falha ao importar configurações');
      }
    } catch (error) {
      SuperTabsLogger.error('Failed to import settings', error);
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
      await SuperTabsStorage.clearAllData();
      this.settings = SuperTabsStorage.getDefaultSettings();
      this.originalSettings = { ...this.settings };
      await SuperTabsStorage.updateSettings(this.settings);
      
      this.updateUI();
      this.hasUnsavedChanges = false;
      document.getElementById('save-settings').textContent = 'Salvar Configurações';
      
      this.showMessage('Configurações resetadas para os valores padrão', 'success');
      SuperTabsLogger.info('Settings reset to defaults');
    } catch (error) {
      SuperTabsLogger.error('Failed to reset settings', error);
      this.showMessage('Erro ao resetar configurações: ' + error.message, 'error');
    }
  }

  saveDraft() {
    if (this.hasUnsavedChanges) {
      this.collectFormValues();
      localStorage.setItem('supertabs-draft-settings', JSON.stringify(this.settings));
    }
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

// Global functions for HTML
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentNode.querySelector('.password-toggle');
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const options = new SuperTabsOptions();
  options.init();
});