/**
 * SuperTabs - Alignment Tool
 * Automatic alignment and organization of NiFi components
 */

class SuperTabsAlignmentTool {
  constructor() {
    this.isVisible = false;
    this.element = null;
    this.nifiApi = null;
    this.selectedComponents = [];
    this.alignmentTypes = [
      'horizontal', 'vertical', 'grid', 'flow', 'circular', 'hierarchical'
    ];
    
    this.initialize();
  }

  async initialize() {
    try {
      SuperTabsLogger.debug('AlignmentTool', 'Initializing alignment tool');
      
      // Get NiFi API instance
      this.nifiApi = window.nifiApiClient;
      
      SuperTabsLogger.info('AlignmentTool', 'Alignment tool initialized');
    } catch (error) {
      SuperTabsLogger.error('AlignmentTool', 'Failed to initialize alignment tool', error);
    }
  }

  async show(selectedComponents = []) {
    try {
      SuperTabsLogger.debug('AlignmentTool', 'Showing alignment tool', { componentCount: selectedComponents.length });

      this.selectedComponents = selectedComponents;
      await this.createToolElement();
      this.bindEvents();
      
      this.element.classList.add('visible');
      this.isVisible = true;

      SuperTabsLogger.info('AlignmentTool', 'Alignment tool shown');
    } catch (error) {
      SuperTabsLogger.error('AlignmentTool', 'Failed to show alignment tool', error);
    }
  }

  hide() {
    if (this.element) {
      this.element.classList.remove('visible');
      this.isVisible = false;
      
      setTimeout(() => {
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
      }, 300);
    }
  }

  async createToolElement() {
    // Remove existing tool if present
    const existing = document.getElementById('supertabs-alignment-tool');
    if (existing) {
      existing.remove();
    }

    // Create main tool container
    this.element = document.createElement('div');
    this.element.id = 'supertabs-alignment-tool';
    this.element.className = 'supertabs-alignment-tool';

    // Create tool structure
    this.element.innerHTML = `
      <div class="supertabs-alignment-overlay"></div>
      <div class="supertabs-alignment-panel">
        <div class="supertabs-alignment-header">
          <h3 class="supertabs-alignment-title">Auto-Alignment Tool</h3>
          <button class="supertabs-alignment-close" title="Close">×</button>
        </div>

        <div class="supertabs-alignment-content">
          <div class="supertabs-alignment-section">
            <label class="supertabs-alignment-label">Selected Components:</label>
            <div class="supertabs-alignment-selection">
              ${this.renderSelectedComponents()}
            </div>
          </div>

          <div class="supertabs-alignment-section">
            <label class="supertabs-alignment-label">Alignment Type:</label>
            <div class="supertabs-alignment-types">
              ${this.renderAlignmentTypes()}
            </div>
          </div>

          <div class="supertabs-alignment-section">
            <label class="supertabs-alignment-label">Spacing Options:</label>
            <div class="supertabs-alignment-spacing">
              <div class="supertabs-spacing-item">
                <label>Horizontal Spacing:</label>
                <input type="range" min="50" max="300" value="150" class="supertabs-spacing-h" />
                <span class="supertabs-spacing-value">150px</span>
              </div>
              <div class="supertabs-spacing-item">
                <label>Vertical Spacing:</label>
                <input type="range" min="50" max="300" value="100" class="supertabs-spacing-v" />
                <span class="supertabs-spacing-value">100px</span>
              </div>
            </div>
          </div>

          <div class="supertabs-alignment-section">
            <label class="supertabs-alignment-label">Advanced Options:</label>
            <div class="supertabs-alignment-options">
              <label class="supertabs-option-checkbox">
                <input type="checkbox" class="supertabs-option-preserve-connections" checked />
                <span>Preserve connection paths</span>
              </label>
              <label class="supertabs-option-checkbox">
                <input type="checkbox" class="supertabs-option-auto-route" />
                <span>Auto-route connections</span>
              </label>
              <label class="supertabs-option-checkbox">
                <input type="checkbox" class="supertabs-option-group-labels" />
                <span>Align labels with components</span>
              </label>
            </div>
          </div>

          <div class="supertabs-alignment-preview">
            <div class="supertabs-alignment-section">
              <label class="supertabs-alignment-label">Preview:</label>
              <div class="supertabs-alignment-canvas" id="supertabs-alignment-canvas">
                ${this.renderPreviewCanvas()}
              </div>
            </div>
          </div>

          <div class="supertabs-alignment-actions">
            <button class="supertabs-btn supertabs-btn-secondary supertabs-alignment-select-all">
              📋 Select All Components
            </button>
            <button class="supertabs-btn supertabs-btn-secondary supertabs-alignment-preview-btn">
              👁️ Preview Changes
            </button>
            <button class="supertabs-btn supertabs-btn-primary supertabs-alignment-apply">
              ✨ Apply Alignment
            </button>
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.element);
  }

  renderSelectedComponents() {
    if (this.selectedComponents.length === 0) {
      return `
        <div class="supertabs-alignment-empty">
          <p>No components selected</p>
          <p>Select multiple components on the canvas to enable alignment</p>
        </div>
      `;
    }

    return `
      <div class="supertabs-alignment-component-list">
        ${this.selectedComponents.map(comp => `
          <div class="supertabs-alignment-component-item">
            <span class="supertabs-component-icon">${this.getComponentIcon(comp.type)}</span>
            <span class="supertabs-component-name">${comp.name || comp.id}</span>
            <span class="supertabs-component-type">${comp.type}</span>
          </div>
        `).join('')}
      </div>
      <div class="supertabs-alignment-summary">
        <strong>${this.selectedComponents.length}</strong> components selected
      </div>
    `;
  }

  renderAlignmentTypes() {
    return this.alignmentTypes.map(type => `
      <div class="supertabs-alignment-type" data-type="${type}">
        <div class="supertabs-alignment-type-icon">${this.getAlignmentIcon(type)}</div>
        <div class="supertabs-alignment-type-info">
          <div class="supertabs-alignment-type-name">${this.getAlignmentName(type)}</div>
          <div class="supertabs-alignment-type-desc">${this.getAlignmentDescription(type)}</div>
        </div>
      </div>
    `).join('');
  }

  renderPreviewCanvas() {
    return `
      <div class="supertabs-preview-canvas">
        <div class="supertabs-preview-message">
          Select an alignment type to see preview
        </div>
      </div>
    `;
  }

  getComponentIcon(type) {
    const iconMap = {
      'Processor': '⚙️',
      'InputPort': '📥',
      'OutputPort': '📤',
      'ProcessGroup': '📁',
      'ControllerService': '🔧',
      'Funnel': '🔀'
    };
    return iconMap[type] || '🔹';
  }

  getAlignmentIcon(type) {
    const iconMap = {
      'horizontal': '↔️',
      'vertical': '↕️',
      'grid': '⊞',
      'flow': '🌊',
      'circular': '🔄',
      'hierarchical': '🌳'
    };
    return iconMap[type] || '📐';
  }

  getAlignmentName(type) {
    const nameMap = {
      'horizontal': 'Horizontal',
      'vertical': 'Vertical',
      'grid': 'Grid Layout',
      'flow': 'Flow Direction',
      'circular': 'Circular',
      'hierarchical': 'Hierarchical'
    };
    return nameMap[type] || type;
  }

  getAlignmentDescription(type) {
    const descMap = {
      'horizontal': 'Align components in a horizontal line',
      'vertical': 'Align components in a vertical line',
      'grid': 'Arrange components in a grid pattern',
      'flow': 'Align following data flow direction',
      'circular': 'Arrange components in a circle',
      'hierarchical': 'Arrange in a tree/hierarchy structure'
    };
    return descMap[type] || 'Custom alignment';
  }

  bindEvents() {
    // Close button
    const closeBtn = this.element.querySelector('.supertabs-alignment-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Overlay click to close
    const overlay = this.element.querySelector('.supertabs-alignment-overlay');
    overlay?.addEventListener('click', () => this.hide());

    // Alignment type selection
    const alignmentTypes = this.element.querySelectorAll('.supertabs-alignment-type');
    alignmentTypes.forEach(type => {
      type.addEventListener('click', (e) => {
        // Remove active class from all
        alignmentTypes.forEach(t => t.classList.remove('active'));
        // Add active class to clicked
        e.currentTarget.classList.add('active');
        
        const alignmentType = e.currentTarget.dataset.type;
        this.updatePreview(alignmentType);
      });
    });

    // Spacing sliders
    const spacingH = this.element.querySelector('.supertabs-spacing-h');
    const spacingV = this.element.querySelector('.supertabs-spacing-v');
    
    spacingH?.addEventListener('input', (e) => {
      const value = e.target.value;
      e.target.nextElementSibling.textContent = `${value}px`;
      this.updatePreview();
    });

    spacingV?.addEventListener('input', (e) => {
      const value = e.target.value;
      e.target.nextElementSibling.textContent = `${value}px`;
      this.updatePreview();
    });

    // Action buttons
    const selectAllBtn = this.element.querySelector('.supertabs-alignment-select-all');
    const previewBtn = this.element.querySelector('.supertabs-alignment-preview-btn');
    const applyBtn = this.element.querySelector('.supertabs-alignment-apply');

    selectAllBtn?.addEventListener('click', () => this.selectAllComponents());
    previewBtn?.addEventListener('click', () => this.showPreview());
    applyBtn?.addEventListener('click', () => this.applyAlignment());

    // Option checkboxes
    const options = this.element.querySelectorAll('.supertabs-alignment-options input[type="checkbox"]');
    options.forEach(option => {
      option.addEventListener('change', () => this.updatePreview());
    });
  }

  async selectAllComponents() {
    try {
      // Get all components from the current process group
      const components = await this.getAllComponentsInView();
      this.selectedComponents = components;
      
      // Update the UI
      const selectionDiv = this.element.querySelector('.supertabs-alignment-selection');
      if (selectionDiv) {
        selectionDiv.innerHTML = this.renderSelectedComponents();
      }

      SuperTabsLogger.info('AlignmentTool', `Selected ${components.length} components`);
    } catch (error) {
      SuperTabsLogger.error('AlignmentTool', 'Failed to select all components', error);
    }
  }

  async getAllComponentsInView() {
    try {
      if (!this.nifiApi) {
        throw new Error('NiFi API not available');
      }

      // Get current process group ID from URL or context
      const processGroupId = this.getCurrentProcessGroupId();
      
      // Fetch all components in the process group
      const response = await this.nifiApi.request('GET', `/flow/process-groups/${processGroupId}`);
      
      const components = [];
      
      // Add processors
      if (response.processGroupFlow?.flow?.processors) {
        components.push(...response.processGroupFlow.flow.processors);
      }
      
      // Add input ports
      if (response.processGroupFlow?.flow?.inputPorts) {
        components.push(...response.processGroupFlow.flow.inputPorts);
      }
      
      // Add output ports
      if (response.processGroupFlow?.flow?.outputPorts) {
        components.push(...response.processGroupFlow.flow.outputPorts);
      }
      
      // Add process groups
      if (response.processGroupFlow?.flow?.processGroups) {
        components.push(...response.processGroupFlow.flow.processGroups);
      }

      return components;
      
    } catch (error) {
      SuperTabsLogger.error('AlignmentTool', 'Failed to get all components', error);
      return [];
    }
  }

  getCurrentProcessGroupId() {
    // Extract process group ID from current URL
    const urlMatch = window.location.hash.match(/process-groups\/([^\/]+)/);
    return urlMatch ? urlMatch[1] : 'root';
  }

  updatePreview(alignmentType = null) {
    const activeType = alignmentType || this.element.querySelector('.supertabs-alignment-type.active')?.dataset.type;
    if (!activeType || this.selectedComponents.length === 0) {
      return;
    }

    const preview = this.generateAlignmentPreview(activeType);
    this.renderPreview(preview);
  }

  generateAlignmentPreview(alignmentType) {
    const spacingH = parseInt(this.element.querySelector('.supertabs-spacing-h')?.value || 150);
    const spacingV = parseInt(this.element.querySelector('.supertabs-spacing-v')?.value || 100);

    const positions = this.calculateAlignmentPositions(this.selectedComponents, alignmentType, spacingH, spacingV);
    
    return {
      type: alignmentType,
      positions: positions,
      bounds: this.calculateBounds(positions)
    };
  }

  calculateAlignmentPositions(components, alignmentType, spacingH, spacingV) {
    const positions = [];
    const baseX = 100;
    const baseY = 100;

    switch (alignmentType) {
      case 'horizontal':
        components.forEach((comp, index) => {
          positions.push({
            id: comp.id,
            x: baseX + (index * spacingH),
            y: baseY
          });
        });
        break;

      case 'vertical':
        components.forEach((comp, index) => {
          positions.push({
            id: comp.id,
            x: baseX,
            y: baseY + (index * spacingV)
          });
        });
        break;

      case 'grid':
        const cols = Math.ceil(Math.sqrt(components.length));
        components.forEach((comp, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          positions.push({
            id: comp.id,
            x: baseX + (col * spacingH),
            y: baseY + (row * spacingV)
          });
        });
        break;

      case 'flow':
        // Analyze data flow to determine optimal positioning
        positions.push(...this.calculateFlowPositions(components, spacingH, spacingV));
        break;

      case 'circular':
        const radius = Math.max(100, components.length * 20);
        const angleStep = (2 * Math.PI) / components.length;
        components.forEach((comp, index) => {
          const angle = index * angleStep;
          positions.push({
            id: comp.id,
            x: baseX + radius + (radius * Math.cos(angle)),
            y: baseY + radius + (radius * Math.sin(angle))
          });
        });
        break;

      case 'hierarchical':
        positions.push(...this.calculateHierarchicalPositions(components, spacingH, spacingV));
        break;
    }

    return positions;
  }

  calculateFlowPositions(components, spacingH, spacingV) {
    // Simplified flow-based positioning
    // In a real implementation, this would analyze connections between components
    const positions = [];
    let currentX = 100;
    let currentY = 100;
    let level = 0;

    components.forEach((comp, index) => {
      if (index > 0 && index % 3 === 0) {
        level++;
        currentX = 100;
        currentY = 100 + (level * spacingV);
      }

      positions.push({
        id: comp.id,
        x: currentX,
        y: currentY
      });

      currentX += spacingH;
    });

    return positions;
  }

  calculateHierarchicalPositions(components, spacingH, spacingV) {
    // Simplified hierarchical positioning
    const positions = [];
    const levels = Math.ceil(Math.log2(components.length + 1));
    
    components.forEach((comp, index) => {
      const level = Math.floor(Math.log2(index + 1));
      const posInLevel = index - (Math.pow(2, level) - 1);
      const maxInLevel = Math.pow(2, level);
      
      const x = 100 + (posInLevel * spacingH * maxInLevel / (maxInLevel + 1));
      const y = 100 + (level * spacingV);

      positions.push({
        id: comp.id,
        x: x,
        y: y
      });
    });

    return positions;
  }

  calculateBounds(positions) {
    if (positions.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs) + 200, // Add component width
      height: Math.max(...ys) - Math.min(...ys) + 100  // Add component height
    };
  }

  renderPreview(preview) {
    const canvas = this.element.querySelector('.supertabs-preview-canvas');
    if (!canvas || !preview) return;

    const scale = 0.3; // Scale down for preview
    const svgWidth = Math.max(300, preview.bounds.width * scale);
    const svgHeight = Math.max(200, preview.bounds.height * scale);

    canvas.innerHTML = `
      <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
        ${preview.positions.map(pos => {
          const x = (pos.x - preview.bounds.x) * scale;
          const y = (pos.y - preview.bounds.y) * scale;
          const component = this.selectedComponents.find(c => c.id === pos.id);
          return `
            <rect x="${x}" y="${y}" width="50" height="30" 
                  fill="var(--nifi-primary-blue)" 
                  stroke="var(--nifi-border)" 
                  rx="3" opacity="0.8"/>
            <text x="${x + 25}" y="${y + 20}" 
                  text-anchor="middle" 
                  font-size="8" 
                  fill="white">
              ${component?.name?.substring(0, 6) || 'Comp'}
            </text>
          `;
        }).join('')}
      </svg>
    `;
  }

  async showPreview() {
    const activeType = this.element.querySelector('.supertabs-alignment-type.active')?.dataset.type;
    if (!activeType) {
      alert('Please select an alignment type first');
      return;
    }

    try {
      const preview = this.generateAlignmentPreview(activeType);
      
      // Show preview on the actual canvas (temporarily)
      await this.highlightPreviewOnCanvas(preview);
      
    } catch (error) {
      SuperTabsLogger.error('AlignmentTool', 'Failed to show preview', error);
    }
  }

  async highlightPreviewOnCanvas(preview) {
    // Create temporary preview overlay on the NiFi canvas
    const overlay = document.createElement('div');
    overlay.id = 'supertabs-alignment-preview-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;

    // Add preview elements
    preview.positions.forEach(pos => {
      const previewElement = document.createElement('div');
      previewElement.style.cssText = `
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        width: 200px;
        height: 100px;
        border: 2px dashed var(--nifi-primary-blue);
        background: rgba(45, 79, 145, 0.1);
        border-radius: 4px;
        pointer-events: none;
      `;
      overlay.appendChild(previewElement);
    });

    // Find NiFi canvas and add overlay
    const canvas = document.querySelector('#canvas, .canvas-container, svg[class*="canvas"]');
    if (canvas) {
      canvas.appendChild(overlay);
      
      // Remove preview after 3 seconds
      setTimeout(() => {
        overlay.remove();
      }, 3000);
    }
  }

  async applyAlignment() {
    const activeType = this.element.querySelector('.supertabs-alignment-type.active')?.dataset.type;
    if (!activeType) {
      alert('Please select an alignment type first');
      return;
    }

    if (this.selectedComponents.length === 0) {
      alert('No components selected for alignment');
      return;
    }

    try {
      this.showApplyingProgress();
      
      const preview = this.generateAlignmentPreview(activeType);
      await this.applyPositions(preview.positions);
      
      this.showSuccess(`Successfully aligned ${this.selectedComponents.length} components`);
      
      // Auto-close after success
      setTimeout(() => this.hide(), 2000);
      
    } catch (error) {
      SuperTabsLogger.error('AlignmentTool', 'Failed to apply alignment', error);
      this.showError('Failed to apply alignment: ' + error.message);
    }
  }

  async applyPositions(positions) {
    if (!this.nifiApi) {
      throw new Error('NiFi API not available');
    }

    // Apply positions to each component
    for (const position of positions) {
      const component = this.selectedComponents.find(c => c.id === position.id);
      if (!component) continue;

      try {
        // Update component position via NiFi API
        const updateData = {
          revision: component.revision || { version: 0 },
          component: {
            id: component.id,
            position: {
              x: position.x,
              y: position.y
            }
          }
        };

        const endpoint = this.getUpdateEndpoint(component);
        await this.nifiApi.request('PUT', endpoint, updateData);
        
      } catch (error) {
        SuperTabsLogger.warn('AlignmentTool', `Failed to update position for component ${component.id}`, error);
      }
    }
  }

  getUpdateEndpoint(component) {
    const type = component.component?.type || component.type;
    const id = component.id;

    switch (type) {
      case 'Processor':
        return `/processors/${id}`;
      case 'InputPort':
        return `/input-ports/${id}`;
      case 'OutputPort':
        return `/output-ports/${id}`;
      case 'ProcessGroup':
        return `/process-groups/${id}`;
      default:
        throw new Error(`Unknown component type: ${type}`);
    }
  }

  showApplyingProgress() {
    const actionsDiv = this.element.querySelector('.supertabs-alignment-actions');
    if (actionsDiv) {
      actionsDiv.innerHTML = `
        <div class="supertabs-loading">
          <div class="supertabs-spinner"></div>
          Applying alignment changes...
        </div>
      `;
    }
  }

  showSuccess(message) {
    const actionsDiv = this.element.querySelector('.supertabs-alignment-actions');
    if (actionsDiv) {
      actionsDiv.innerHTML = `
        <div class="supertabs-success">
          <span class="supertabs-success-icon">✅</span>
          <span class="supertabs-success-message">${message}</span>
        </div>
      `;
    }
  }

  showError(message) {
    const actionsDiv = this.element.querySelector('.supertabs-alignment-actions');
    if (actionsDiv) {
      actionsDiv.innerHTML = `
        <div class="supertabs-error">
          <div class="supertabs-error-title">Alignment Error</div>
          <p class="supertabs-error-message">${message}</p>
          <button class="supertabs-btn supertabs-btn-primary" onclick="location.reload()">
            🔄 Refresh Page
          </button>
        </div>
      `;
    }
  }

  // Public API
  async handleMessage(message) {
    switch (message.action) {
      case 'showAlignmentTool':
        await this.show(message.selectedComponents);
        break;
      case 'hideAlignmentTool':
        this.hide();
        break;
      case 'alignComponents':
        if (message.components && message.type) {
          this.selectedComponents = message.components;
          await this.applyAlignment(message.type);
        }
        break;
      default:
        SuperTabsLogger.warn('AlignmentTool', 'Unknown message action', message);
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.nifiApi = null;
    this.selectedComponents = [];
    this.isVisible = false;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsAlignmentTool };
} else if (typeof window !== 'undefined') {
  window.SuperTabsAlignmentTool = SuperTabsAlignmentTool;
}