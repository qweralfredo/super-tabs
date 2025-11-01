/**
 * SuperTabs - Stats Tab Component
 * Displays component statistics, performance metrics, and health analysis
 */

class SuperTabsStatsTab {
  constructor(container) {
    this.container = container;
    this.currentComponent = null;
    this.stats = {};
    this.refreshInterval = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      await this.createInterface();
      this.isInitialized = true;
      SuperTabsLogger.debug('StatsTab', 'Stats tab initialized successfully');
    } catch (error) {
      SuperTabsLogger.error('StatsTab', 'Failed to initialize stats tab', error);
    }
  }

  async createInterface() {
    if (!this.container) {
      throw new Error('Container not provided');
    }

    this.container.innerHTML = `
      <div class="supertabs-stats-content">
        <div class="supertabs-stats-empty" id="stats-empty">
          <div class="supertabs-empty-state">
            <div class="supertabs-empty-icon">📊</div>
            <h4>No Component Selected</h4>
            <p>Select a NiFi component to view statistics</p>
          </div>
        </div>

        <div class="supertabs-stats-data" id="stats-data" style="display: none;">
          <!-- Component Status -->
          <div class="supertabs-stats-section">
            <h4>📈 Component Status</h4>
            <div class="supertabs-stats-grid" id="status-grid">
              <div class="supertabs-loading">
                <div class="supertabs-spinner"></div>
                Loading status...
              </div>
            </div>
          </div>

          <!-- Performance Metrics -->
          <div class="supertabs-stats-section">
            <h4>⚡ Performance Metrics</h4>
            <div class="supertabs-stats-grid" id="performance-grid">
              <div class="supertabs-loading">
                <div class="supertabs-spinner"></div>
                Loading metrics...
              </div>
            </div>
          </div>

          <!-- Flow Data -->
          <div class="supertabs-stats-section">
            <h4>🔄 Flow Statistics</h4>
            <div class="supertabs-stats-grid" id="flow-grid">
              <div class="supertabs-loading">
                <div class="supertabs-spinner"></div>
                Loading flow data...
              </div>
            </div>
          </div>

          <!-- Error Information -->
          <div class="supertabs-stats-section" id="error-section" style="display: none;">
            <h4>⚠️ Error Information</h4>
            <div class="supertabs-error-info" id="error-info">
              <!-- Error details will be populated here -->
            </div>
          </div>

          <!-- AI Analysis -->
          <div class="supertabs-stats-section">
            <h4>🤖 Health Analysis</h4>
            <div class="supertabs-analysis-container">
              <button class="supertabs-button" id="analyze-btn">
                <span>🔍</span>
                Analyze Component Health
              </button>
              <div class="supertabs-analysis-result" id="analysis-result" style="display: none;">
                <div class="supertabs-loading">
                  <div class="supertabs-spinner"></div>
                  Analyzing component health...
                </div>
              </div>
            </div>
          </div>

          <!-- Refresh Controls -->
          <div class="supertabs-stats-controls">
            <button class="supertabs-button small secondary" id="refresh-btn">
              🔄 Refresh Stats
            </button>
            <button class="supertabs-button small secondary" id="auto-refresh-btn">
              ⏱️ Auto Refresh
            </button>
            <span class="supertabs-last-updated" id="last-updated">
              Never updated
            </span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const analyzeBtn = this.container.querySelector('#analyze-btn');
    const refreshBtn = this.container.querySelector('#refresh-btn');
    const autoRefreshBtn = this.container.querySelector('#auto-refresh-btn');

    analyzeBtn?.addEventListener('click', () => this.analyzeComponentHealth());
    refreshBtn?.addEventListener('click', () => this.refreshStats());
    autoRefreshBtn?.addEventListener('click', () => this.toggleAutoRefresh());
  }

  async setComponent(component) {
    try {
      SuperTabsLogger.debug('StatsTab', 'Setting component', { id: component?.id });
      
      this.currentComponent = component;
      
      if (!component) {
        this.showEmptyState();
        return;
      }

      this.showStatsView();
      await this.loadComponentStats(component);
      
      SuperTabsLogger.info('StatsTab', 'Component stats loaded successfully');
    } catch (error) {
      SuperTabsLogger.error('StatsTab', 'Failed to set component', error);
      this.showError('Failed to load component statistics');
    }
  }

  async loadComponentStats(component) {
    try {
      const comp = component.component || component;
      
      // Load different types of stats
      await Promise.all([
        this.loadStatusStats(comp),
        this.loadPerformanceStats(comp),
        this.loadFlowStats(comp)
      ]);

      this.updateLastUpdated();
      
    } catch (error) {
      SuperTabsLogger.error('StatsTab', 'Failed to load stats', error);
      this.showStatsError('Failed to load statistics');
    }
  }

  async loadStatusStats(component) {
    const statusGrid = this.container.querySelector('#status-grid');
    
    try {
      // Get component status via NiFi API
      let componentData = component;
      
      if (window.nifiApiClient && component.id) {
        try {
          componentData = await window.nifiApiClient.getComponent(component.id);
          componentData = componentData.component || componentData;
        } catch (apiError) {
          SuperTabsLogger.warn('StatsTab', 'API call failed, using provided data', apiError);
        }
      }

      const state = componentData.state || 'UNKNOWN';
      const runStatus = this.getRunStatusInfo(state);
      const validationErrors = componentData.validationErrors || [];
      const activeThreadCount = componentData.activeThreadCount || 0;

      statusGrid.innerHTML = `
        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon ${runStatus.class}">${runStatus.icon}</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Status</div>
            <div class="supertabs-stat-value">${runStatus.text}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">${activeThreadCount > 0 ? '🟢' : '⚪'}</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Active Threads</div>
            <div class="supertabs-stat-value">${activeThreadCount}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">${validationErrors.length > 0 ? '🔴' : '🟢'}</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Validation</div>
            <div class="supertabs-stat-value">${validationErrors.length === 0 ? 'Valid' : `${validationErrors.length} errors`}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">⏱️</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Run Duration</div>
            <div class="supertabs-stat-value">${this.formatDuration(componentData.runDuration || 0)}</div>
          </div>
        </div>
      `;

      // Show validation errors if any
      if (validationErrors.length > 0) {
        this.showValidationErrors(validationErrors);
      }

    } catch (error) {
      statusGrid.innerHTML = '<div class="supertabs-error">Failed to load status</div>';
    }
  }

  async loadPerformanceStats(component) {
    const performanceGrid = this.container.querySelector('#performance-grid');
    
    try {
      // Get performance stats - these might come from component stats
      const stats = component.status || {};
      const flowFilesSent = stats.outputCount || 0;
      const flowFilesReceived = stats.inputCount || 0;
      const bytesSent = stats.outputBytes || 0;
      const bytesReceived = stats.inputBytes || 0;
      
      performanceGrid.innerHTML = `
        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">📨</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">FlowFiles In</div>
            <div class="supertabs-stat-value">${flowFilesReceived.toLocaleString()}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">📤</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">FlowFiles Out</div>
            <div class="supertabs-stat-value">${flowFilesSent.toLocaleString()}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">📊</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Data In</div>
            <div class="supertabs-stat-value">${this.formatBytes(bytesReceived)}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">📈</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Data Out</div>
            <div class="supertabs-stat-value">${this.formatBytes(bytesSent)}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">⚡</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Processing Rate</div>
            <div class="supertabs-stat-value">${this.calculateRate(flowFilesReceived, flowFilesSent)}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">🎯</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Success Rate</div>
            <div class="supertabs-stat-value">${this.calculateSuccessRate(stats)}%</div>
          </div>
        </div>
      `;

    } catch (error) {
      performanceGrid.innerHTML = '<div class="supertabs-error">Failed to load performance data</div>';
    }
  }

  async loadFlowStats(component) {
    const flowGrid = this.container.querySelector('#flow-grid');
    
    try {
      // Get queue information and flow data
      const relationships = component.relationships || [];
      const connections = await this.getComponentConnections(component.id);
      
      flowGrid.innerHTML = `
        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">🔗</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Relationships</div>
            <div class="supertabs-stat-value">${relationships.length}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">📦</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Connections</div>
            <div class="supertabs-stat-value">${connections.length}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">⏳</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Queued Items</div>
            <div class="supertabs-stat-value">${this.getTotalQueuedItems(connections)}</div>
          </div>
        </div>

        <div class="supertabs-stat-card">
          <div class="supertabs-stat-icon">💾</div>
          <div class="supertabs-stat-info">
            <div class="supertabs-stat-label">Queue Size</div>
            <div class="supertabs-stat-value">${this.formatBytes(this.getTotalQueueSize(connections))}</div>
          </div>
        </div>
      `;

    } catch (error) {
      flowGrid.innerHTML = '<div class="supertabs-error">Failed to load flow data</div>';
    }
  }

  async getComponentConnections(componentId) {
    try {
      if (window.nifiApiClient) {
        const flowData = await window.nifiApiClient.getFlowContent();
        const connections = flowData.processGroupFlow?.flow?.connections || [];
        return connections.filter(conn => 
          conn.sourceId === componentId || conn.destinationId === componentId
        );
      }
    } catch (error) {
      SuperTabsLogger.warn('StatsTab', 'Failed to get connections', error);
    }
    return [];
  }

  async analyzeComponentHealth() {
    const analyzeBtn = this.container.querySelector('#analyze-btn');
    const analysisResult = this.container.querySelector('#analysis-result');
    
    try {
      analyzeBtn.disabled = true;
      analysisResult.style.display = 'block';
      analysisResult.innerHTML = `
        <div class="supertabs-loading">
          <div class="supertabs-spinner"></div>
          Analyzing component health with AI...
        </div>
      `;

      let analysisText = 'Component analysis not available';
      
      if (window.phi3Agent && this.currentComponent) {
        // Use PHI-3 agent for health analysis
        analysisText = await window.phi3Agent.analyzeComponent(this.currentComponent, this.stats);
      } else {
        // Fallback analysis
        analysisText = this.generateFallbackAnalysis();
      }

      analysisResult.innerHTML = `
        <div class="supertabs-analysis-content">
          <h5>🏥 Health Analysis Report</h5>
          <div class="supertabs-analysis-text">
            ${this.formatAnalysisText(analysisText)}
          </div>
        </div>
      `;

    } catch (error) {
      SuperTabsLogger.error('StatsTab', 'Failed to analyze component', error);
      analysisResult.innerHTML = `
        <div class="supertabs-error">
          <div class="supertabs-error-title">Analysis Failed</div>
          <p>Unable to analyze component health at this time.</p>
        </div>
      `;
    } finally {
      analyzeBtn.disabled = false;
    }
  }

  generateFallbackAnalysis() {
    const comp = this.currentComponent?.component || this.currentComponent;
    const state = comp?.state || 'UNKNOWN';
    const validationErrors = comp?.validationErrors || [];
    
    let analysis = `**Component Health Summary:**\n\n`;
    
    // Status analysis
    if (state === 'RUNNING') {
      analysis += `✅ **Status**: Component is currently running normally.\n`;
    } else if (state === 'STOPPED') {
      analysis += `⚪ **Status**: Component is stopped. Consider starting if processing is needed.\n`;
    } else if (state === 'INVALID') {
      analysis += `❌ **Status**: Component has configuration issues that need attention.\n`;
    }
    
    // Validation analysis
    if (validationErrors.length === 0) {
      analysis += `✅ **Configuration**: All validations passed.\n`;
    } else {
      analysis += `⚠️ **Configuration**: ${validationErrors.length} validation error(s) found.\n`;
    }
    
    // Performance recommendations
    analysis += `\n**Recommendations:**\n`;
    analysis += `• Monitor queue sizes to prevent backpressure\n`;
    analysis += `• Check error logs for any processing issues\n`;
    analysis += `• Review processor properties for optimization opportunities\n`;
    
    return analysis;
  }

  formatAnalysisText(text) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  // Utility functions
  getRunStatusInfo(state) {
    const statusMap = {
      'RUNNING': { class: 'success', icon: '🟢', text: 'Running' },
      'STOPPED': { class: 'secondary', icon: '⚪', text: 'Stopped' },
      'INVALID': { class: 'error', icon: '🔴', text: 'Invalid' },
      'DISABLED': { class: 'warning', icon: '🟡', text: 'Disabled' },
      'UNKNOWN': { class: 'secondary', icon: '⚫', text: 'Unknown' }
    };
    return statusMap[state] || statusMap['UNKNOWN'];
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(milliseconds) {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    if (milliseconds < 3600000) return `${(milliseconds / 60000).toFixed(1)}m`;
    return `${(milliseconds / 3600000).toFixed(1)}h`;
  }

  calculateRate(input, output) {
    if (input === 0 && output === 0) return 'No activity';
    const total = input + output;
    return `${(total / 60).toFixed(1)}/min`; // Assuming 1-minute window
  }

  calculateSuccessRate(stats) {
    const total = (stats.inputCount || 0) + (stats.outputCount || 0);
    if (total === 0) return '100';
    const errors = stats.errorCount || 0;
    return (((total - errors) / total) * 100).toFixed(1);
  }

  getTotalQueuedItems(connections) {
    return connections.reduce((total, conn) => {
      return total + (conn.status?.aggregateSnapshot?.queuedCount || 0);
    }, 0);
  }

  getTotalQueueSize(connections) {
    return connections.reduce((total, conn) => {
      return total + (conn.status?.aggregateSnapshot?.queuedSize || 0);
    }, 0);
  }

  showValidationErrors(errors) {
    const errorSection = this.container.querySelector('#error-section');
    const errorInfo = this.container.querySelector('#error-info');
    
    errorSection.style.display = 'block';
    errorInfo.innerHTML = `
      <div class="supertabs-validation-errors">
        ${errors.map(error => `
          <div class="supertabs-validation-error">
            <span class="supertabs-error-icon">⚠️</span>
            <span class="supertabs-error-text">${error}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  async refreshStats() {
    if (this.currentComponent) {
      await this.loadComponentStats(this.currentComponent);
    }
  }

  toggleAutoRefresh() {
    const autoRefreshBtn = this.container.querySelector('#auto-refresh-btn');
    
    if (this.refreshInterval) {
      // Stop auto refresh
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      autoRefreshBtn.textContent = '⏱️ Auto Refresh';
      autoRefreshBtn.classList.remove('active');
    } else {
      // Start auto refresh (every 30 seconds)
      this.refreshInterval = setInterval(() => {
        this.refreshStats();
      }, 30000);
      autoRefreshBtn.textContent = '⏹️ Stop Auto Refresh';
      autoRefreshBtn.classList.add('active');
    }
  }

  updateLastUpdated() {
    const lastUpdated = this.container.querySelector('#last-updated');
    if (lastUpdated) {
      lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  }

  showEmptyState() {
    this.container.querySelector('#stats-empty').style.display = 'block';
    this.container.querySelector('#stats-data').style.display = 'none';
  }

  showStatsView() {
    this.container.querySelector('#stats-empty').style.display = 'none';
    this.container.querySelector('#stats-data').style.display = 'block';
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="supertabs-error">
        <div class="supertabs-error-title">Error</div>
        <p class="supertabs-error-message">${message}</p>
        <button class="supertabs-button small" onclick="location.reload()">
          Reload Page
        </button>
      </div>
    `;
  }

  showStatsError(message) {
    const statsData = this.container.querySelector('#stats-data');
    if (statsData) {
      statsData.innerHTML = `
        <div class="supertabs-error">
          <div class="supertabs-error-title">Stats Error</div>
          <p class="supertabs-error-message">${message}</p>
        </div>
      `;
    }
  }

  async refresh() {
    if (this.currentComponent) {
      await this.setComponent(this.currentComponent);
    }
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.currentComponent = null;
    this.stats = {};
    this.isInitialized = false;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsStatsTab };
} else if (typeof window !== 'undefined') {
  window.SuperTabsStatsTab = SuperTabsStatsTab;
}