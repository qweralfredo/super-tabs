/**
 * SuperTabs - Info Tab Component
 * Displays component information, insights, and use cases
 */

class SuperTabsInfoTab {
  constructor(container) {
    this.container = container;
    this.currentComponent = null;
    this.insights = [];
    this.isInitialized = false;
  }

  async init() {
    try {
      await this.createInterface();
      this.isInitialized = true;
      SuperTabsLogger.debug('InfoTab', 'Info tab initialized successfully');
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to initialize info tab', error);
    }
  }

  async createInterface() {
    if (!this.container) {
      throw new Error('Container not provided');
    }

    this.container.innerHTML = `
      <div class="supertabs-info-content">
        <div class="supertabs-component-details" id="component-details">
          <div class="supertabs-empty-state">
            <div class="supertabs-empty-icon">🔍</div>
            <h4>No Component Selected</h4>
            <p>Click on a NiFi component to view detailed information</p>
          </div>
        </div>

        <div class="supertabs-insights-section" id="insights-section" style="display: none;">
          <h4>📊 Component Insights</h4>
          <div class="supertabs-insights-content" id="insights-content">
            <div class="supertabs-loading">
              <div class="supertabs-spinner"></div>
              Generating insights...
            </div>
          </div>
        </div>

        <div class="supertabs-use-cases-section" id="use-cases-section" style="display: none;">
          <h4>💡 Common Use Cases</h4>
          <div class="supertabs-use-cases-content" id="use-cases-content">
            <div class="supertabs-loading">
              <div class="supertabs-spinner"></div>
              Loading use cases...
            </div>
          </div>
        </div>

        <div class="supertabs-actions-section" id="actions-section" style="display: none;">
          <h4>🔧 Quick Actions</h4>
          <div class="supertabs-action-buttons">
            <button class="supertabs-button small" id="view-config-btn">
              View Configuration
            </button>
            <button class="supertabs-button small secondary" id="view-docs-btn">
              View Documentation
            </button>
            <button class="supertabs-button small" id="analyze-component-btn">
              Analyze Component
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const viewConfigBtn = this.container.querySelector('#view-config-btn');
    const viewDocsBtn = this.container.querySelector('#view-docs-btn');
    const analyzeBtn = this.container.querySelector('#analyze-component-btn');

    viewConfigBtn?.addEventListener('click', () => this.viewConfiguration());
    viewDocsBtn?.addEventListener('click', () => this.viewDocumentation());
    analyzeBtn?.addEventListener('click', () => this.analyzeComponent());
  }

  async setComponent(component) {
    try {
      SuperTabsLogger.debug('InfoTab', 'Setting component', { id: component?.id });
      
      this.currentComponent = component;
      
      if (!component) {
        this.showEmptyState();
        return;
      }

      await this.displayComponentInfo(component);
      await this.generateInsights(component);
      await this.loadUseCases(component);
      
      SuperTabsLogger.info('InfoTab', 'Component information loaded successfully');
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to set component', error);
      this.showError('Failed to load component information');
    }
  }

  async displayComponentInfo(component) {
    const detailsContainer = this.container.querySelector('#component-details');
    const comp = component.component || component;
    
    const name = comp.name || comp.id || 'Unknown Component';
    const type = comp.type || 'Unknown Type';
    const id = comp.id || 'N/A';
    const state = comp.state || 'UNKNOWN';
    const description = comp.description || 'No description available';

    // Get processor properties if available
    const properties = comp.properties || {};
    const propertyCount = Object.keys(properties).length;

    // Status styling
    const statusMap = {
      'RUNNING': { class: 'success', icon: '🟢', text: 'Running' },
      'STOPPED': { class: 'secondary', icon: '⚪', text: 'Stopped' },
      'INVALID': { class: 'error', icon: '🔴', text: 'Invalid' },
      'DISABLED': { class: 'warning', icon: '🟡', text: 'Disabled' },
      'UNKNOWN': { class: 'secondary', icon: '⚫', text: 'Unknown' }
    };

    const status = statusMap[state] || statusMap['UNKNOWN'];

    detailsContainer.innerHTML = `
      <div class="supertabs-component-header">
        <div class="supertabs-component-title">
          <h3>${name}</h3>
          <span class="supertabs-component-type">${type}</span>
        </div>
        <div class="supertabs-component-status ${status.class}">
          <span class="supertabs-status-icon">${status.icon}</span>
          <span class="supertabs-status-text">${status.text}</span>
        </div>
      </div>

      <div class="supertabs-component-metadata">
        <div class="supertabs-metadata-item">
          <strong>Component ID:</strong>
          <code>${id}</code>
        </div>
        <div class="supertabs-metadata-item">
          <strong>Type:</strong>
          <span>${type}</span>
        </div>
        <div class="supertabs-metadata-item">
          <strong>Properties:</strong>
          <span>${propertyCount} configured</span>
        </div>
        <div class="supertabs-metadata-item">
          <strong>Description:</strong>
          <p>${description}</p>
        </div>
      </div>

      ${propertyCount > 0 ? this.renderProperties(properties) : ''}
    `;

    // Show sections
    this.container.querySelector('#insights-section').style.display = 'block';
    this.container.querySelector('#use-cases-section').style.display = 'block';
    this.container.querySelector('#actions-section').style.display = 'block';
  }

  renderProperties(properties) {
    const propertyEntries = Object.entries(properties).slice(0, 5); // Show first 5 properties
    
    return `
      <div class="supertabs-properties-summary">
        <h4>Key Properties</h4>
        <div class="supertabs-properties-list">
          ${propertyEntries.map(([key, value]) => `
            <div class="supertabs-property-item">
              <span class="supertabs-property-key">${key}:</span>
              <span class="supertabs-property-value">${value || 'Not set'}</span>
            </div>
          `).join('')}
          ${Object.keys(properties).length > 5 ? 
            `<div class="supertabs-property-more">... and ${Object.keys(properties).length - 5} more</div>` : 
            ''
          }
        </div>
      </div>
    `;
  }

  async generateInsights(component) {
    const insightsContent = this.container.querySelector('#insights-content');
    
    try {
      // Use PHI-3 agent to generate insights
      if (window.phi3Agent) {
        const insights = await window.phi3Agent.generateResponse(
          `Provide insights and analysis for this NiFi component: ${JSON.stringify(component, null, 2)}`,
          { component }
        );
        
        insightsContent.innerHTML = `
          <div class="supertabs-insights-text">
            ${this.formatInsightsText(insights)}
          </div>
        `;
      } else {
        // Fallback to static insights
        insightsContent.innerHTML = this.getStaticInsights(component);
      }
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to generate insights', error);
      insightsContent.innerHTML = this.getStaticInsights(component);
    }
  }

  formatInsightsText(text) {
    // Convert plain text to formatted HTML
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  getStaticInsights(component) {
    const comp = component.component || component;
    const type = comp.type || 'Unknown';
    
    const insightsMap = {
      'UpdateAttribute': `
        <div class="supertabs-insight-item">
          <strong>💡 Primary Function:</strong> Modifies FlowFile attributes using static values or Expression Language
        </div>
        <div class="supertabs-insight-item">
          <strong>📈 Performance:</strong> Lightweight processor, minimal impact on throughput
        </div>
        <div class="supertabs-insight-item">
          <strong>⚠️ Best Practices:</strong> Use for metadata enrichment, routing decisions, and attribute normalization
        </div>
      `,
      'GenerateFlowFile': `
        <div class="supertabs-insight-item">
          <strong>💡 Primary Function:</strong> Creates new FlowFiles for testing or data generation
        </div>
        <div class="supertabs-insight-item">
          <strong>📈 Performance:</strong> Can generate high volumes of data - monitor batch size
        </div>
        <div class="supertabs-insight-item">
          <strong>⚠️ Best Practices:</strong> Use for testing flows, synthetic data creation, and flow initialization
        </div>
      `,
      'default': `
        <div class="supertabs-insight-item">
          <strong>💡 Component Analysis:</strong> This is a ${type} processor with specific data processing capabilities
        </div>
        <div class="supertabs-insight-item">
          <strong>📈 Performance Tips:</strong> Monitor queue sizes and processing times for optimal performance
        </div>
        <div class="supertabs-insight-item">
          <strong>⚠️ Recommendations:</strong> Ensure proper error handling and relationship routing
        </div>
      `
    };

    return insightsMap[type] || insightsMap['default'];
  }

  async loadUseCases(component) {
    const useCasesContent = this.container.querySelector('#use-cases-content');
    const comp = component.component || component;
    const type = comp.type || 'Unknown';
    
    const useCasesMap = {
      'UpdateAttribute': [
        '🏷️ Adding routing metadata to FlowFiles',
        '📝 Standardizing attribute names across flows',
        '🔄 Converting attribute values using Expression Language',
        '📊 Adding timestamps and processing metadata',
        '🎯 Preparing attributes for downstream processors'
      ],
      'GenerateFlowFile': [
        '🧪 Testing flow logic with sample data',
        '📅 Creating scheduled data generation jobs',
        '🔄 Triggering flows at regular intervals',
        '📊 Generating synthetic datasets for development',
        '⚡ Flow initialization and startup triggers'
      ],
      'default': [
        '📊 Data processing and transformation',
        '🔄 Flow control and routing',
        '📁 File handling and management',
        '🔌 Integration with external systems',
        '⚡ Real-time data processing'
      ]
    };

    const useCases = useCasesMap[type] || useCasesMap['default'];
    
    useCasesContent.innerHTML = `
      <div class="supertabs-use-cases-list">
        ${useCases.map(useCase => `
          <div class="supertabs-use-case-item">
            ${useCase}
          </div>
        `).join('')}
      </div>
    `;
  }

  showEmptyState() {
    const detailsContainer = this.container.querySelector('#component-details');
    detailsContainer.innerHTML = `
      <div class="supertabs-empty-state">
        <div class="supertabs-empty-icon">🔍</div>
        <h4>No Component Selected</h4>
        <p>Click on a NiFi component to view detailed information</p>
      </div>
    `;

    // Hide sections
    this.container.querySelector('#insights-section').style.display = 'none';
    this.container.querySelector('#use-cases-section').style.display = 'none';
    this.container.querySelector('#actions-section').style.display = 'none';
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

  async refresh() {
    if (this.currentComponent) {
      await this.setComponent(this.currentComponent);
    }
  }

  // Action handlers
  async viewConfiguration() {
    if (this.currentComponent?.id) {
      // Open component configuration in new tab
      const configUrl = `${window.location.origin}/nifi/#/process-groups/${this.getProcessGroupId()}/processors/${this.currentComponent.id}/configure`;
      window.open(configUrl, '_blank');
    }
  }

  async viewDocumentation() {
    const comp = this.currentComponent?.component || this.currentComponent;
    if (comp?.type) {
      // Open NiFi documentation for component type
      const docsUrl = `https://nifi.apache.org/docs/nifi-docs/components/${comp.type.toLowerCase()}/index.html`;
      window.open(docsUrl, '_blank');
    }
  }

  async analyzeComponent() {
    try {
      if (!this.currentComponent) return;
      
      // Trigger component analysis
      const analysis = await window.phi3Agent?.analyzeComponent(this.currentComponent);
      
      if (analysis) {
        // Update insights with analysis
        const insightsContent = this.container.querySelector('#insights-content');
        insightsContent.innerHTML = `
          <div class="supertabs-analysis-result">
            <h5>🔍 AI Analysis Result</h5>
            <div class="supertabs-insights-text">
              ${this.formatInsightsText(analysis)}
            </div>
          </div>
        `;
      }
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to analyze component', error);
    }
  }

  getProcessGroupId() {
    // Extract process group ID from current URL
    const match = window.location.hash.match(/process-groups\/([^\/]+)/);
    return match ? match[1] : 'root';
  }

  destroy() {
    this.currentComponent = null;
    this.insights = [];
    this.isInitialized = false;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsInfoTab };
} else if (typeof window !== 'undefined') {
  window.SuperTabsInfoTab = SuperTabsInfoTab;
}