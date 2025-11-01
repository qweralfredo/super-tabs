// SuperTabs Storage Utility
// Handles Chrome extension storage operations

class SuperTabsStorage {
  constructor() {
    this.defaultSettings = {
      sidebarVisible: true,
      autoShowSidebar: true,
      alignmentEnabled: true,
      expressionLanguageEnabled: true,
      debugMode: false,
      enableNotifications: true,
      theme: 'auto',
      autoSaveEnabled: true,
      phi3Config: {
        endpoint: '',
        apiKey: '',
        model: 'phi3',
        temperature: 0.7
      },
      nifiConfig: {
        host: 'localhost',
        port: 8443,
        protocol: 'https',
        username: 'admin',
        password: 'password123'
      }
    };
  }

  // Get all settings
  async getSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(this.defaultSettings);
        return { ...this.defaultSettings, ...result };
      } else {
        // Fallback for testing outside extension environment
        const stored = localStorage.getItem('supertabs-settings');
        return stored ? { ...this.defaultSettings, ...JSON.parse(stored) } : this.defaultSettings;
      }
    } catch (error) {
      console.warn('[SuperTabs Storage] Failed to load settings, using defaults:', error);
      return this.defaultSettings;
    }
  }

  // Save settings
  async saveSettings(settings) {
    try {
      const mergedSettings = { ...this.defaultSettings, ...settings };
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.sync.set(mergedSettings);
      } else {
        // Fallback for testing outside extension environment
        localStorage.setItem('supertabs-settings', JSON.stringify(mergedSettings));
      }
      
      console.log('[SuperTabs Storage] Settings saved successfully');
      return true;
    } catch (error) {
      console.error('[SuperTabs Storage] Failed to save settings:', error);
      return false;
    }
  }

  // Get specific setting
  async getSetting(key) {
    const settings = await this.getSettings();
    return settings[key];
  }

  // Set specific setting
  async setSetting(key, value) {
    const settings = await this.getSettings();
    settings[key] = value;
    return await this.saveSettings(settings);
  }

  // Reset to defaults
  async resetSettings() {
    return await this.saveSettings(this.defaultSettings);
  }

  // Export settings
  async exportSettings() {
    const settings = await this.getSettings();
    return JSON.stringify(settings, null, 2);
  }

  // Import settings
  async importSettings(settingsJson) {
    try {
      const settings = JSON.parse(settingsJson);
      return await this.saveSettings(settings);
    } catch (error) {
      console.error('[SuperTabs Storage] Failed to import settings:', error);
      return false;
    }
  }

  // Storage event listener for cross-tab synchronization
  onSettingsChanged(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
          callback(changes);
        }
      });
    } else {
      // Fallback for testing
      window.addEventListener('storage', (event) => {
        if (event.key === 'supertabs-settings') {
          callback({
            settings: {
              newValue: JSON.parse(event.newValue || '{}'),
              oldValue: JSON.parse(event.oldValue || '{}')
            }
          });
        }
      });
    }
  }
}

// Create global instance
const superTabsStorage = new SuperTabsStorage();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SuperTabsStorage;
}