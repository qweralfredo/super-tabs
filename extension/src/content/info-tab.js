/**
 * SuperTabs - Info Tab
 * Displays detailed component information and properties
 */

class SuperTabsInfoTab {
  constructor(container) {
    this.container = container;
    this.component = null;
    this.nifiApi = null;
    this.isLoading = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      SuperTabsLogger.debug('InfoTab', 'Initializing info tab');
      
      // Get NiFi API instance
      this.nifiApi = window.superTabsNifiApi;
      
      // Show initial empty state
      this.showEmptyState();
      
      SuperTabsLogger.info('InfoTab', 'Info tab initialized');
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to initialize info tab', error);
      this.showError('Failed to initialize component information');
    }
  }

  async setComponent(component) {
    try {
      SuperTabsLogger.debug('InfoTab', 'Setting component for info tab', { id: component?.id });
      
      this.component = component;
      
      if (!component) {
        this.showEmptyState();
        return;
      }

      await this.loadComponentInfo();
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to set component', error);
      this.showError('Failed to load component information');
    }
  }

  async refresh() {
    if (this.component && !this.isLoading) {
      await this.loadComponentInfo();
    }
  }

  async loadComponentInfo() {
    try {
      this.isLoading = true;
      this.showLoading();

      const componentInfo = await this.gatherComponentInfo();
      this.renderComponentInfo(componentInfo);
      
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to load component info', error);
      this.showError('Failed to load component information');
    } finally {
      this.isLoading = false;
    }
  }

  async gatherComponentInfo() {
    const comp = this.component.component || this.component;
    const info = {
      basic: {
        id: comp.id,
        name: comp.name || 'Unnamed Component',
        type: comp.type,
        state: comp.state || 'UNKNOWN',
        parentGroupId: comp.parentGroupId
      },
      properties: {},
      relationships: [],
      bundle: {},
      runStatus: {},
      position: {},
      validation: [],
      connections: {
        incoming: [],
        outgoing: []
      }
    };

    try {
      // Get detailed component information from NiFi API
      if (this.nifiApi && comp.id) {
        const details = await this.getComponentDetails(comp);
        if (details) {
          Object.assign(info, details);
        }
      }

      // Get properties
      if (comp.config && comp.config.properties) {
        info.properties = comp.config.properties;
      }

      // Get relationships
      if (comp.relationships) {
        info.relationships = comp.relationships;
      }

      // Get bundle info
      if (comp.bundle) {
        info.bundle = comp.bundle;
      }

      // Get position
      if (comp.position) {
        info.position = comp.position;
      }

      // Get validation errors
      if (comp.validationErrors) {
        info.validation = comp.validationErrors;
      }

    } catch (error) {
      SuperTabsLogger.warn('InfoTab', 'Failed to gather complete component info', error);
    }

    return info;
  }

  async getComponentDetails(component) {
    try {
      const type = component.type;
      const id = component.id;
      const groupId = component.parentGroupId;

      // Determine component endpoint based on type
      let endpoint = '';
      if (type === 'Processor') {
        endpoint = `/flow/processors/${id}`;
      } else if (type === 'InputPort') {
        endpoint = `/flow/input-ports/${id}`;
      } else if (type === 'OutputPort') {
        endpoint = `/flow/output-ports/${id}`;
      } else if (type === 'ProcessGroup') {
        endpoint = `/flow/process-groups/${id}`;
      } else if (type === 'ControllerService') {
        endpoint = `/flow/controller-services/${id}`;
      } else if (type === 'ReportingTask') {
        endpoint = `/flow/reporting-tasks/${id}`;
      } else {
        return null;
      }

      const response = await this.nifiApi.request('GET', endpoint);
      return response;
      
    } catch (error) {
      SuperTabsLogger.warn('InfoTab', 'Failed to get component details from API', error);
      return null;
    }
  }

  renderComponentInfo(info) {
    const html = `
      <div class="supertabs-info-content">
        ${this.renderBasicInfo(info.basic)}
        ${this.renderProperties(info.properties)}
        ${this.renderRelationships(info.relationships)}
        ${this.renderBundleInfo(info.bundle)}
        ${this.renderPositionInfo(info.position)}
        ${this.renderValidationInfo(info.validation)}
        ${this.renderConnectionsInfo(info.connections)}
        ${this.renderActionsBar()}
      </div>
    `;

    this.container.innerHTML = html;
    this.bindInfoEvents();
  }

  renderBasicInfo(basic) {
    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">ℹ️</span>
          Basic Information
        </h4>
        <div class="supertabs-info-grid">
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Name:</label>
            <span class="supertabs-info-value">${basic.name}</span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Type:</label>
            <span class="supertabs-info-value supertabs-component-type">${basic.type}</span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">ID:</label>
            <span class="supertabs-info-value supertabs-monospace">${basic.id}</span>
            <button class="supertabs-copy-btn" data-copy="${basic.id}" title="Copy ID">📋</button>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">State:</label>
            <span class="supertabs-info-value">
              <span class="supertabs-status-dot ${this.getStatusClass(basic.state)}"></span>
              ${basic.state}
            </span>
          </div>
          ${basic.parentGroupId ? `
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Parent Group:</label>
            <span class="supertabs-info-value supertabs-monospace">${basic.parentGroupId}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderProperties(properties) {
    if (!properties || Object.keys(properties).length === 0) {
      return `
        <div class="supertabs-content-section">
          <h4 class="supertabs-section-title">
            <span class="supertabs-section-icon">⚙️</span>
            Properties
          </h4>
          <div class="supertabs-empty-small">
            <p>No properties configured</p>
          </div>
        </div>
      `;
    }

    const propertyItems = Object.entries(properties).map(([key, value]) => `
      <div class="supertabs-property-item">
        <label class="supertabs-property-label">${key}:</label>
        <div class="supertabs-property-value">
          <span class="supertabs-property-text">${value || '<em>Not set</em>'}</span>
          ${value ? `<button class="supertabs-copy-btn" data-copy="${value}" title="Copy value">📋</button>` : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">⚙️</span>
          Properties
          <span class="supertabs-count-badge">${Object.keys(properties).length}</span>
        </h4>
        <div class="supertabs-properties-list">
          ${propertyItems}
        </div>
      </div>
    `;
  }

  renderRelationships(relationships) {
    if (!relationships || relationships.length === 0) {
      return `
        <div class="supertabs-content-section">
          <h4 class="supertabs-section-title">
            <span class="supertabs-section-icon">🔗</span>
            Relationships
          </h4>
          <div class="supertabs-empty-small">
            <p>No relationships available</p>
          </div>
        </div>
      `;
    }

    const relationshipItems = relationships.map(rel => `
      <div class="supertabs-relationship-item">
        <div class="supertabs-relationship-name">${rel.name}</div>
        <div class="supertabs-relationship-description">${rel.description || 'No description'}</div>
        ${rel.autoTerminate ? '<span class="supertabs-auto-terminate">Auto-terminate</span>' : ''}
      </div>
    `).join('');

    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">🔗</span>
          Relationships
          <span class="supertabs-count-badge">${relationships.length}</span>
        </h4>
        <div class="supertabs-relationships-list">
          ${relationshipItems}
        </div>
      </div>
    `;
  }

  renderBundleInfo(bundle) {
    if (!bundle || Object.keys(bundle).length === 0) {
      return '';
    }

    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">📦</span>
          Bundle Information
        </h4>
        <div class="supertabs-info-grid">
          ${bundle.group ? `
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Group:</label>
            <span class="supertabs-info-value">${bundle.group}</span>
          </div>
          ` : ''}
          ${bundle.artifact ? `
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Artifact:</label>
            <span class="supertabs-info-value">${bundle.artifact}</span>
          </div>
          ` : ''}
          ${bundle.version ? `
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Version:</label>
            <span class="supertabs-info-value">${bundle.version}</span>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderPositionInfo(position) {
    if (!position) {
      return '';
    }

    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">📍</span>
          Position
        </h4>
        <div class="supertabs-info-grid">
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">X:</label>
            <span class="supertabs-info-value">${position.x || 0}</span>
          </div>
          <div class="supertabs-info-item">
            <label class="supertabs-info-label">Y:</label>
            <span class="supertabs-info-value">${position.y || 0}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderValidationInfo(validation) {
    if (!validation || validation.length === 0) {
      return `
        <div class="supertabs-content-section">
          <h4 class="supertabs-section-title">
            <span class="supertabs-section-icon">✅</span>
            Validation
          </h4>
          <div class="supertabs-validation-success">
            <span class="supertabs-status-dot running"></span>
            Component is valid
          </div>
        </div>
      `;
    }

    const validationItems = validation.map(error => `
      <div class="supertabs-validation-error">
        <span class="supertabs-error-icon">⚠️</span>
        <span class="supertabs-error-message">${error}</span>
      </div>
    `).join('');

    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">⚠️</span>
          Validation Errors
          <span class="supertabs-count-badge supertabs-error-badge">${validation.length}</span>
        </h4>
        <div class="supertabs-validation-list">
          ${validationItems}
        </div>
      </div>
    `;
  }

  renderConnectionsInfo(connections) {
    const hasConnections = (connections.incoming && connections.incoming.length > 0) || 
                          (connections.outgoing && connections.outgoing.length > 0);

    if (!hasConnections) {
      return `
        <div class="supertabs-content-section">
          <h4 class="supertabs-section-title">
            <span class="supertabs-section-icon">🔄</span>
            Connections
          </h4>
          <div class="supertabs-empty-small">
            <p>No connections found</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="supertabs-content-section">
        <h4 class="supertabs-section-title">
          <span class="supertabs-section-icon">🔄</span>
          Connections
        </h4>
        ${connections.incoming && connections.incoming.length > 0 ? `
        <div class="supertabs-connections-group">
          <h5>Incoming (${connections.incoming.length})</h5>
          <div class="supertabs-connections-list">
            ${connections.incoming.map(conn => `
              <div class="supertabs-connection-item incoming">
                <span class="supertabs-connection-label">${conn.name || conn.id}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        ${connections.outgoing && connections.outgoing.length > 0 ? `
        <div class="supertabs-connections-group">
          <h5>Outgoing (${connections.outgoing.length})</h5>
          <div class="supertabs-connections-list">
            ${connections.outgoing.map(conn => `
              <div class="supertabs-connection-item outgoing">
                <span class="supertabs-connection-label">${conn.name || conn.id}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  renderActionsBar() {
    return `
      <div class="supertabs-action-bar">
        <button class="supertabs-btn supertabs-btn-primary" id="supertabs-refresh-info">
          🔄 Refresh
        </button>
        <button class="supertabs-btn supertabs-btn-secondary" id="supertabs-copy-info">
          📋 Copy Info
        </button>
        <button class="supertabs-btn supertabs-btn-secondary" id="supertabs-export-info">
          💾 Export
        </button>
      </div>
    `;
  }

  bindInfoEvents() {
    // Copy buttons
    const copyButtons = this.container.querySelectorAll('.supertabs-copy-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const textToCopy = e.target.dataset.copy;
        this.copyToClipboard(textToCopy);
      });
    });

    // Action buttons
    const refreshBtn = this.container.querySelector('#supertabs-refresh-info');
    const copyInfoBtn = this.container.querySelector('#supertabs-copy-info');
    const exportBtn = this.container.querySelector('#supertabs-export-info');

    refreshBtn?.addEventListener('click', () => this.refresh());
    copyInfoBtn?.addEventListener('click', () => this.copyAllInfo());
    exportBtn?.addEventListener('click', () => this.exportInfo());
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      SuperTabsLogger.debug('InfoTab', 'Text copied to clipboard');
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to copy to clipboard', error);
    }
  }

  async copyAllInfo() {
    try {
      const info = await this.gatherComponentInfo();
      const textInfo = this.formatInfoAsText(info);
      await this.copyToClipboard(textInfo);
      SuperTabsLogger.info('InfoTab', 'Component info copied to clipboard');
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to copy component info', error);
    }
  }

  formatInfoAsText(info) {
    let text = `Component Information\n`;
    text += `========================\n\n`;
    text += `Name: ${info.basic.name}\n`;
    text += `Type: ${info.basic.type}\n`;
    text += `ID: ${info.basic.id}\n`;
    text += `State: ${info.basic.state}\n\n`;

    if (Object.keys(info.properties).length > 0) {
      text += `Properties:\n`;
      text += `-----------\n`;
      Object.entries(info.properties).forEach(([key, value]) => {
        text += `${key}: ${value || 'Not set'}\n`;
      });
      text += `\n`;
    }

    if (info.relationships.length > 0) {
      text += `Relationships:\n`;
      text += `--------------\n`;
      info.relationships.forEach(rel => {
        text += `${rel.name}: ${rel.description || 'No description'}\n`;
      });
      text += `\n`;
    }

    return text;
  }

  async exportInfo() {
    try {
      const info = await this.gatherComponentInfo();
      const jsonInfo = JSON.stringify(info, null, 2);
      
      const blob = new Blob([jsonInfo], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${info.basic.name || 'component'}_info.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      SuperTabsLogger.info('InfoTab', 'Component info exported');
    } catch (error) {
      SuperTabsLogger.error('InfoTab', 'Failed to export component info', error);
    }
  }

  getStatusClass(state) {
    const statusMap = {
      'RUNNING': 'running',
      'STOPPED': 'stopped',
      'INVALID': 'invalid',
      'DISABLED': 'disabled'
    };
    return statusMap[state] || 'disabled';
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="supertabs-loading">
        <div class="supertabs-spinner"></div>
        Loading component information...
      </div>
    `;
  }

  showEmptyState() {
    this.container.innerHTML = `
      <div class="supertabs-empty">
        <div class="supertabs-empty-icon">📋</div>
        <div class="supertabs-empty-title">No Component Selected</div>
        <div class="supertabs-empty-message">Select a component to view detailed information</div>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="supertabs-error">
        <div class="supertabs-error-title">Error Loading Information</div>
        <p class="supertabs-error-message">${message}</p>
        <button class="supertabs-btn supertabs-btn-primary" onclick="this.closest('.supertabs-tab-pane').dispatchEvent(new CustomEvent('retry'))">
          🔄 Retry
        </button>
      </div>
    `;

    // Bind retry event
    this.container.addEventListener('retry', () => this.refresh());
  }

  destroy() {
    this.component = null;
    this.nifiApi = null;
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsInfoTab };
} else if (typeof window !== 'undefined') {
  window.SuperTabsInfoTab = SuperTabsInfoTab;
}