/**
 * SuperTabs - Stats Tab
 * Displays component statistics and performance metrics
 */

class SuperTabsStatsTab {
  constructor(container) {
    this.container = container;
    this.component = null;
    this.nifiApi = null;
    this.isLoading = false;
    this.updateInterval = null;
    this.stats = {
      current: {},
      history: []
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      SuperTabsLogger.debug('StatsTab', 'Initializing stats tab');
      
      // Get NiFi API instance
      this.nifiApi = window.superTabsNifiApi;
      
      // Show initial empty state
      this.showEmptyState();
      
      SuperTabsLogger.info('StatsTab', 'Stats tab initialized');
    } catch (error) {
      SuperTabsLogger.error('StatsTab', 'Failed to initialize stats tab', error);
      this.showError('Failed to initialize statistics');
    }
  }

  async setComponent(component) {
    try {
      SuperTabsLogger.debug('StatsTab', 'Setting component for stats tab', { id: component?.id });
      
      this.component = component;
      
      // Clear existing interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      
      if (!component) {
        this.showEmptyState();
        return;
      }

      await this.loadComponentStats();
      
      // Start auto-refresh for stats
      this.startAutoRefresh();
      
    } catch (error) {
      SuperTabsLogger.error('StatsTab', 'Failed to set component', error);
      this.showError('Failed to load component statistics');
    }
  }

  async refresh() {
    if (this.component && !this.isLoading) {
      await this.loadComponentStats();
    }
  }

  async loadComponentStats() {
    try {
      this.isLoading = true;
      this.showLoading();

      const stats = await this.gatherComponentStats();
      this.stats.current = stats;
      this.stats.history.push({
        timestamp: Date.now(),
        ...stats
      });
      
      // Keep only last 50 entries
      if (this.stats.history.length > 50) {
        this.stats.history = this.stats.history.slice(-50);
      }

      this.renderComponentStats(stats);
      
    } catch (error) {
      SuperTabsLogger.error('StatsTab', 'Failed to load component stats', error);
      this.showError('Failed to load component statistics');
    } finally {
      this.isLoading = false;
    }
  }

  async gatherComponentStats() {
    const comp = this.component.component || this.component;
    const stats = {
      basic: {
        id: comp.id,
        name: comp.name || 'Unnamed Component',
        type: comp.type,
        state: comp.state || 'UNKNOWN'
      },
      flowFiles: {
        in: 0,
        out: 0,
        queued: 0
      },
      bytes: {
        in: 0,
        out: 0,
        queued: 0
      },
      processing: {
        activeThreads: 0,
        tasks: 0,
        averageLineageDuration: 0
      },
      bulletin: {
        level: null,
        message: null,
        timestamp: null
      },
      performance: {
        fiveMinuteStats: null,
        uptime: null,
        lastAccessed: null
      }
    };

    try {
      // Get detailed stats from NiFi API
      if (this.nifiApi && comp.id) {
        const detailedStats = await this.getComponentStatsFromAPI(comp);
        if (detailedStats) {
          Object.assign(stats, detailedStats);
        }
      }

      // Get stats from component object itself
      if (comp.status) {
        this.extractStatusStats(comp.status, stats);
      }

      // Get bulletin information
      if (comp.bulletins && comp.bulletins.length > 0) {
        const latestBulletin = comp.bulletins[0];
        stats.bulletin = {
          level: latestBulletin.bulletin?.level,
          message: latestBulletin.bulletin?.message,
          timestamp: latestBulletin.bulletin?.timestamp
        };
      }

    } catch (error) {
      SuperTabsLogger.warn('StatsTab', 'Failed to gather complete stats', error);
    }

    return stats;
  }

  async getComponentStatsFromAPI(component) {
    try {
      const type = component.type;
      const id = component.id;

      // Determine stats endpoint based on component type
      let endpoint = '';
      if (type === 'Processor') {
        endpoint = `/flow/processors/${id}/status`;
      } else if (type === 'ProcessGroup') {
        endpoint = `/flow/process-groups/${id}/status`;
      } else if (type === 'InputPort') {
        endpoint = `/flow/input-ports/${id}/status`;
      } else if (type === 'OutputPort') {
        endpoint = `/flow/output-ports/${id}/status`;
      } else {
        return null;
      }

      const response = await this.nifiApi.request('GET', endpoint);
      return this.extractAPIStats(response);
      
    } catch (error) {
      SuperTabsLogger.warn('StatsTab', 'Failed to get stats from API', error);
      return null;
    }
  }

  extractAPIStats(apiResponse) {
    const stats = {};
    
    if (apiResponse?.status) {
      const status = apiResponse.status;
      
      // Flow file stats
      if (status.aggregateSnapshot) {
        const snapshot = status.aggregateSnapshot;
        stats.flowFiles = {
          in: parseInt(snapshot.flowFilesIn) || 0,
          out: parseInt(snapshot.flowFilesOut) || 0,
          queued: parseInt(snapshot.flowFilesQueued) || 0
        };
        
        stats.bytes = {
          in: this.parseByteString(snapshot.bytesIn) || 0,
          out: this.parseByteString(snapshot.bytesOut) || 0,
          queued: this.parseByteString(snapshot.bytesQueued) || 0
        };
        
        stats.processing = {
          activeThreads: parseInt(snapshot.activeThreadCount) || 0,
          tasks: parseInt(snapshot.taskCount) || 0,
          averageLineageDuration: this.parseDurationString(snapshot.averageLineageDuration) || 0
        };
      }
    }
    
    return stats;
  }

  extractStatusStats(status, stats) {
    // Extract what we can from the component's status object
    if (status.aggregateSnapshot) {
      const snapshot = status.aggregateSnapshot;
      
      stats.flowFiles.in = parseInt(snapshot.flowFilesIn) || stats.flowFiles.in;
      stats.flowFiles.out = parseInt(snapshot.flowFilesOut) || stats.flowFiles.out;
      stats.flowFiles.queued = parseInt(snapshot.flowFilesQueued) || stats.flowFiles.queued;
      
      if (snapshot.bytesIn) stats.bytes.in = this.parseByteString(snapshot.bytesIn);
      if (snapshot.bytesOut) stats.bytes.out = this.parseByteString(snapshot.bytesOut);
      if (snapshot.bytesQueued) stats.bytes.queued = this.parseByteString(snapshot.bytesQueued);
    }
  }

  renderComponentStats(stats) {
    const html = `
      <div class="supertabs-stats-content">
        ${this.renderStatsOverview(stats)}
        ${this.renderFlowFileStats(stats.flowFiles)}
        ${this.renderByteStats(stats.bytes)}
        ${this.renderProcessingStats(stats.processing)}
        ${this.renderPerformanceChart()}
        ${this.renderBulletinInfo(stats.bulletin)}
        ${this.renderStatsTable()}
        ${this.renderActionsBar()}
      </div>
    `;

    this.container.innerHTML = html;
    this.bindStatsEvents();
  }

  renderStatsOverview(stats) {
    const totalFlowFiles = stats.flowFiles.in + stats.flowFiles.out + stats.flowFiles.queued;
    const totalBytes = this.formatBytes(stats.bytes.in + stats.bytes.out + stats.bytes.queued);
    
    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">📊</span>
          Statistics Overview
        </h4>
        <div class="supertabs-stats-summary">
          <div class="supertabs-stat-card">
            <div class="supertabs-stat-value">${totalFlowFiles}</div>
            <div class="supertabs-stat-label">Total FlowFiles</div>
          </div>
          <div class="supertabs-stat-card">
            <div class="supertabs-stat-value">${totalBytes}</div>
            <div class="supertabs-stat-label">Total Bytes</div>
          </div>
          <div class="supertabs-stat-card">
            <div class="supertabs-stat-value">${stats.processing.activeThreads}</div>
            <div class="supertabs-stat-label">Active Threads</div>
          </div>
          <div class="supertabs-stat-card">
            <div class="supertabs-stat-value">${stats.flowFiles.queued}</div>
            <div class="supertabs-stat-label">Queued</div>
          </div>
        </div>
      </div>
    `;
  }

  renderFlowFileStats(flowFiles) {
    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">📄</span>
          FlowFile Statistics
        </h4>
        <div class="supertabs-info-grid">
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">In:</label>
            <span class="supertabs-info-value">
              ${flowFiles.in.toLocaleString()}
              ${this.getTrendIndicator('flowFiles.in')}
            </span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Out:</label>
            <span class="supertabs-info-value">
              ${flowFiles.out.toLocaleString()}
              ${this.getTrendIndicator('flowFiles.out')}
            </span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Queued:</label>
            <span class="supertabs-info-value">
              ${flowFiles.queued.toLocaleString()}
              ${this.getTrendIndicator('flowFiles.queued')}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  renderByteStats(bytes) {
    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">💾</span>
          Byte Statistics
        </h4>
        <div class="supertabs-info-grid">
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">In:</label>
            <span class="supertabs-info-value">
              ${this.formatBytes(bytes.in)}
              ${this.getTrendIndicator('bytes.in')}
            </span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Out:</label>
            <span class="supertabs-info-value">
              ${this.formatBytes(bytes.out)}
              ${this.getTrendIndicator('bytes.out')}
            </span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Queued:</label>
            <span class="supertabs-info-value">
              ${this.formatBytes(bytes.queued)}
              ${this.getTrendIndicator('bytes.queued')}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  renderProcessingStats(processing) {
    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">⚙️</span>
          Processing Statistics
        </h4>
        <div class="supertabs-info-grid">
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Active Threads:</label>
            <span class="supertabs-info-value">${processing.activeThreads}</span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Tasks:</label>
            <span class="supertabs-info-value">${processing.tasks}</span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Avg Duration:</label>
            <span class="supertabs-info-value">${this.formatDuration(processing.averageLineageDuration)}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderPerformanceChart() {
    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">📈</span>
          Performance Trend
        </h4>
        <div class="supertabs-chart-container" id="supertabs-performance-chart">
          <div>Performance chart will be rendered here</div>
          <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Chart implementation pending</div>
        </div>
      </div>
    `;
  }

  renderBulletinInfo(bulletin) {
    if (!bulletin.message) {
      return `
        <div class="supertabs-content-section">
          <h4 class="supertabs-section-title">
            <span class="supertabs-section-icon">📢</span>
            Bulletins
          </h4>
          <div class="supertabs-empty-small">
            <p>No active bulletins</p>
          </div>
        </div>
      `;
    }

    const levelClass = bulletin.level ? bulletin.level.toLowerCase() : 'info';
    const levelIcon = {
      'error': '❌',
      'warn': '⚠️',
      'info': 'ℹ️'
    }[levelClass] || 'ℹ️';

    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">📢</span>
          Latest Bulletin
        </h4>
        <div class="supertabs-bulletin-item ${levelClass}">
          <div class="supertabs-bulletin-header">
            <span class="supertabs-bulletin-icon">${levelIcon}</span>
            <span class="supertabs-bulletin-level">${bulletin.level}</span>
            <span class="supertabs-bulletin-time">${this.formatTimestamp(bulletin.timestamp)}</span>
          </div>
          <div class="supertabs-bulletin-message">${bulletin.message}</div>
        </div>
      </div>
    `;
  }

  renderStatsTable() {
    if (this.stats.history.length < 2) {
      return '';
    }

    const recent = this.stats.history.slice(-5);
    const tableRows = recent.map(entry => `
      <tr>
        <td>${this.formatTimestamp(entry.timestamp)}</td>
        <td>${entry.flowFiles?.in || 0}</td>
        <td>${entry.flowFiles?.out || 0}</td>
        <td>${entry.flowFiles?.queued || 0}</td>
        <td>${this.formatBytes(entry.bytes?.in || 0)}</td>
        <td>${this.formatBytes(entry.bytes?.out || 0)}</td>
      </tr>
    `).join('');

    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">📋</span>
          Recent History
        </h4>
        <table class="supertabs-metrics-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>FlowFiles In</th>
              <th>FlowFiles Out</th>
              <th>Queued</th>
              <th>Bytes In</th>
              <th>Bytes Out</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  renderActionsBar() {
    return `
      <div class="supertabs-action-bar">
        <button class="supertabs-btn supertabs-btn-primary" id="supertabs-refresh-stats">
          🔄 Refresh
        </button>
        <button class="supertabs-btn supertabs-btn-secondary" id="supertabs-export-stats">
          💾 Export
        </button>
        <button class="supertabs-btn supertabs-btn-secondary" id="supertabs-clear-history">
          🗑️ Clear History
        </button>
      </div>
    `;
  }

  bindStatsEvents() {
    const refreshBtn = this.container.querySelector('#supertabs-refresh-stats');
    const exportBtn = this.container.querySelector('#supertabs-export-stats');
    const clearBtn = this.container.querySelector('#supertabs-clear-history');

    refreshBtn?.addEventListener('click', () => this.refresh());
    exportBtn?.addEventListener('click', () => this.exportStats());
    clearBtn?.addEventListener('click', () => this.clearHistory());
  }

  getTrendIndicator(metric) {
    if (this.stats.history.length < 2) {
      return '';
    }

    const current = this.getNestedValue(this.stats.current, metric);
    const previous = this.getNestedValue(this.stats.history[this.stats.history.length - 2], metric);

    if (current > previous) {
      return '<span class="supertabs-metric-trend supertabs-trend-up">↗️</span>';
    } else if (current < previous) {
      return '<span class="supertabs-metric-trend supertabs-trend-down">↘️</span>';
    } else {
      return '<span class="supertabs-metric-trend supertabs-trend-stable">→</span>';
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o && o[p], obj) || 0;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(duration) {
    if (!duration || duration === 0) return '0 ms';
    if (duration < 1000) return `${duration} ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)} s`;
    return `${(duration / 60000).toFixed(1)} min`;
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  parseByteString(byteStr) {
    if (!byteStr || typeof byteStr !== 'string') return 0;
    
    const units = { B: 1, KB: 1024, MB: 1024**2, GB: 1024**3, TB: 1024**4 };
    const match = byteStr.match(/^([\d.]+)\s*([A-Z]{1,2})$/);
    
    if (match) {
      const [, value, unit] = match;
      return parseFloat(value) * (units[unit] || 1);
    }
    
    return parseInt(byteStr) || 0;
  }

  parseDurationString(durationStr) {
    if (!durationStr || typeof durationStr !== 'string') return 0;
    
    const units = { ms: 1, s: 1000, min: 60000, h: 3600000 };
    const match = durationStr.match(/^([\d.]+)\s*(\w+)$/);
    
    if (match) {
      const [, value, unit] = match;
      return parseFloat(value) * (units[unit] || 1);
    }
    
    return parseFloat(durationStr) || 0;
  }

  startAutoRefresh() {
    // Refresh every 30 seconds
    this.updateInterval = setInterval(() => {
      if (this.component && !this.isLoading) {
        this.loadComponentStats();
      }
    }, 30000);
  }

  async exportStats() {
    try {
      const exportData = {
        component: {
          id: this.component.id,
          name: this.component.name,
          type: this.component.type
        },
        currentStats: this.stats.current,
        history: this.stats.history,
        exportTime: new Date().toISOString()
      };
      
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.stats.current.basic.name || 'component'}_stats.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      SuperTabsLogger.info('StatsTab', 'Statistics exported');
    } catch (error) {
      SuperTabsLogger.error('StatsTab', 'Failed to export statistics', error);
    }
  }

  clearHistory() {
    this.stats.history = [];
    SuperTabsLogger.info('StatsTab', 'Statistics history cleared');
    
    // Re-render to update the table
    if (this.stats.current && Object.keys(this.stats.current).length > 0) {
      this.renderComponentStats(this.stats.current);
    }
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="supertabs-loading">
        <div class="supertabs-spinner"></div>
        Loading component statistics...
      </div>
    `;
  }

  showEmptyState() {
    this.container.innerHTML = `
      <div class="supertabs-empty">
        <div class="supertabs-empty-icon">📊</div>
        <div class="supertabs-empty-title">No Component Selected</div>
        <div class="supertabs-empty-message">Select a component to view performance statistics</div>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="supertabs-error">
        <div class="supertabs-error-title">Error Loading Statistics</div>
        <p class="supertabs-error-message">${message}</p>
        <button class="supertabs-btn supertabs-btn-primary" onclick="this.closest('.supertabs-tab-pane').dispatchEvent(new CustomEvent('retry'))">
          🔄 Retry
        </button>
      </div>
    `;

    this.container.addEventListener('retry', () => this.refresh());
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.component = null;
    this.nifiApi = null;
    this.stats = { current: {}, history: [] };
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsStatsTab };
} else if (typeof window !== 'undefined') {
  window.SuperTabsStatsTab = SuperTabsStatsTab;
}