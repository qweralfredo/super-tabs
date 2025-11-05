// SuperTabs Logger Utility
// Provides consistent logging across the extension

// Only define class if it doesn't exist
if (typeof window.SuperTabsLoggerClass === 'undefined') {
  window.SuperTabsLoggerClass = class SuperTabsLogger {
    constructor() {
      this.logLevel = 'info'; // debug, info, warn, error
      this.enableConsole = true;
      this.enableStorage = false;
      this.maxLogEntries = 1000;
      this.logBuffer = [];
    }

    // Initialize logger with settings
    async init() {
      try {
        if (typeof superTabsStorage !== 'undefined') {
          const settings = await superTabsStorage.getSettings();
          this.logLevel = settings.debugMode ? 'debug' : 'info';
          this.enableStorage = settings.debugMode;
        }
      } catch (error) {
        console.warn('[SuperTabs Logger] Failed to initialize with settings:', error);
      }
    }

    // Format timestamp
    getTimestamp() {
      return new Date().toISOString();
    }

    // Create log entry
    createLogEntry(level, message, data = null) {
      return {
        timestamp: this.getTimestamp(),
        level: level.toUpperCase(),
        message,
        data,
        url: window.location.href,
        userAgent: navigator.userAgent.split(' ')[0]
      };
    }

    // Check if level should be logged
    shouldLog(level) {
      const levels = { debug: 0, info: 1, warn: 2, error: 3 };
      const currentLevel = levels[this.logLevel] || 1;
      const messageLevel = levels[level] || 1;
      return messageLevel >= currentLevel;
    }

    // Main logging method
    log(level, message, data = null) {
      if (!this.shouldLog(level)) return;

      const entry = this.createLogEntry(level, message, data);
      
      // Console logging
      if (this.enableConsole) {
        const prefix = `[SuperTabs ${level.toUpperCase()}]`;
        const style = this.getLogStyle(level);
        
        // Map level to console method (debug -> log)
        const consoleMethod = level === 'debug' ? 'log' : level;
        
        if (data) {
          console[consoleMethod](`%c${prefix} ${message}`, style, data);
        } else {
          console[consoleMethod](`%c${prefix} ${message}`, style);
        }
      }

      // Buffer logging for storage
      if (this.enableStorage) {
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxLogEntries) {
          this.logBuffer.shift(); // Remove oldest entry
        }
      }
    }

    // Get console styling for log levels
    getLogStyle(level) {
      const styles = {
        debug: 'color: #666; font-weight: normal;',
        info: 'color: #2d4f91; font-weight: bold;',
        warn: 'color: #f0ad4e; font-weight: bold;',
        error: 'color: #d9534f; font-weight: bold;'
      };
      return styles[level] || styles.info;
    }

    // Convenience methods
    debug(message, data = null) {
      this.log('debug', message, data);
    }

    info(message, data = null) {
      this.log('info', message, data);
    }

    warn(message, data = null) {
      this.log('warn', message, data);
    }

    error(message, data = null) {
      this.log('error', message, data);
    }

    // Special logging methods
    logUserAction(action, data = null) {
      this.info(`User Action: ${action}`, data);
    }

    logNiFiPageState(state) {
      this.debug(`NiFi Page State: ${state}`);
    }

    logApiCall(method, url, status, data = null) {
      const message = `API ${method} ${url} - Status: ${status}`;
      if (status >= 400) {
        this.error(message, data);
      } else {
        this.debug(message, data);
      }
    }

    logPerformance(operation, duration) {
      this.debug(`Performance: ${operation} took ${duration}ms`);
    }

    // Get logged entries
    getLogEntries(level = null, limit = 100) {
      let entries = [...this.logBuffer];
      
      if (level) {
        entries = entries.filter(entry => entry.level.toLowerCase() === level.toLowerCase());
      }
      
      return entries.slice(-limit);
    }

    // Clear log buffer
    clearLogs() {
      this.logBuffer = [];
      this.info('Log buffer cleared');
    }

    // Export logs as JSON
    exportLogs() {
      return JSON.stringify(this.logBuffer, null, 2);
    }

    // Set log level dynamically
    setLogLevel(level) {
      this.logLevel = level;
      this.info(`Log level changed to: ${level}`);
    }

    // Enable/disable storage logging
    setStorageLogging(enabled) {
      this.enableStorage = enabled;
      if (!enabled) {
        this.clearLogs();
      }
      this.info(`Storage logging ${enabled ? 'enabled' : 'disabled'}`);
    }
  };
}

// Create global instance only if it doesn't exist
if (!window.SuperTabsLogger) {
  window.SuperTabsLogger = new window.SuperTabsLoggerClass();
  window.SuperTabsLogger.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SuperTabsLogger;
}