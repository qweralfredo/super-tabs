/**
 * SuperTabs - Expression Language Generator
 * AI-powered tool for generating and validating NiFi Expression Language
 */

class SuperTabsExpressionLanguageGenerator {
  constructor() {
    this.isVisible = false;
    this.element = null;
    this.phi3Agent = null;
    this.currentContext = null;
    this.expressionHistory = [];
    
    this.initialize();
  }

  async initialize() {
    try {
      SuperTabsLogger.debug('ExpressionGenerator', 'Initializing Expression Language generator');
      
      // Get Phi3 agent instance
      this.phi3Agent = window.phi3Agent;
      
      // Load expression history
      await this.loadExpressionHistory();
      
      SuperTabsLogger.info('ExpressionGenerator', 'Expression Language generator initialized');
    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to initialize expression generator', error);
    }
  }

  async show(context = null) {
    try {
      SuperTabsLogger.debug('ExpressionGenerator', 'Showing expression generator', { context });

      this.currentContext = context;
      await this.createGeneratorElement();
      this.bindEvents();
      
      this.element.classList.add('visible');
      this.isVisible = true;

      // Focus on input
      setTimeout(() => {
        const input = this.element.querySelector('.el-input');
        input?.focus();
      }, 300);

      SuperTabsLogger.info('ExpressionGenerator', 'Expression generator shown');
    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to show expression generator', error);
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

  async createGeneratorElement() {
    // Remove existing generator if present
    const existing = document.getElementById('supertabs-el-generator');
    if (existing) {
      existing.remove();
    }

    // Create main generator container
    this.element = document.createElement('div');
    this.element.id = 'supertabs-el-generator';
    this.element.className = 'supertabs-el-generator';

    // Create generator structure
    this.element.innerHTML = `
      <div class="supertabs-el-overlay"></div>
      <div class="supertabs-el-modal">
        <div class="supertabs-el-header">
          <h3 class="supertabs-el-title">Expression Language Generator</h3>
          <button class="supertabs-el-close" title="Close">×</button>
        </div>

        <div class="supertabs-el-content">
          <div class="supertabs-el-section">
            <label class="supertabs-el-label">Describe what you want to achieve:</label>
            <textarea 
              class="supertabs-el-input" 
              placeholder="E.g., Extract the filename from a path, convert to uppercase, format a date, etc."
              rows="3"
            ></textarea>
          </div>

          <div class="supertabs-el-section">
            <label class="supertabs-el-label">Context Information:</label>
            <div class="supertabs-el-context">
              ${this.renderContext()}
            </div>
          </div>

          <div class="supertabs-el-actions">
            <button class="supertabs-btn supertabs-btn-primary supertabs-el-generate">
              🤖 Generate Expression
            </button>
            <button class="supertabs-btn supertabs-btn-secondary supertabs-el-examples">
              💡 Show Examples
            </button>
          </div>

          <div class="supertabs-el-result" style="display: none;">
            <div class="supertabs-el-section">
              <label class="supertabs-el-label">Generated Expression:</label>
              <div class="supertabs-el-expression-container">
                <code class="supertabs-el-expression"></code>
                <button class="supertabs-el-copy" title="Copy to clipboard">📋</button>
              </div>
            </div>

            <div class="supertabs-el-section">
              <label class="supertabs-el-label">Explanation:</label>
              <div class="supertabs-el-explanation"></div>
            </div>

            <div class="supertabs-el-section">
              <label class="supertabs-el-label">Validation:</label>
              <div class="supertabs-el-validation">
                <button class="supertabs-btn supertabs-btn-secondary supertabs-el-validate">
                  ✅ Validate Expression
                </button>
                <div class="supertabs-el-validation-result"></div>
              </div>
            </div>
          </div>

          <div class="supertabs-el-history">
            <div class="supertabs-el-section">
              <label class="supertabs-el-label">Recent Expressions:</label>
              <div class="supertabs-el-history-list">
                ${this.renderExpressionHistory()}
              </div>
            </div>
          </div>
        </div>

        <div class="supertabs-el-footer">
          <button class="supertabs-btn supertabs-btn-secondary supertabs-el-clear-history">
            🗑️ Clear History
          </button>
          <button class="supertabs-btn supertabs-btn-primary supertabs-el-save">
            💾 Save to Library
          </button>
        </div>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.element);
  }

  renderContext() {
    if (!this.currentContext) {
      return `
        <div class="supertabs-el-context-empty">
          <p>No component context available</p>
          <p>Select a processor or component to get context-aware suggestions</p>
        </div>
      `;
    }

    const comp = this.currentContext.component || this.currentContext;
    return `
      <div class="supertabs-el-context-info">
        <div class="supertabs-el-context-item">
          <label>Component:</label>
          <span>${comp.name || 'Unnamed'} (${comp.type || 'Unknown'})</span>
        </div>
        <div class="supertabs-el-context-item">
          <label>Available Attributes:</label>
          <div class="supertabs-el-attributes">
            ${this.getAvailableAttributes(comp).map(attr => 
              `<span class="supertabs-el-attribute">\${${attr}}</span>`
            ).join('')}
          </div>
        </div>
      </div>
    `;
  }

  getAvailableAttributes(component) {
    // Common NiFi attributes
    const commonAttributes = [
      'filename', 'path', 'uuid', 'entryDate', 'lineageStartDate',
      'fileSize', 'mime.type', 'fragment.identifier', 'fragment.count',
      'fragment.index', 'segment.original.filename'
    ];

    // Add component-specific attributes based on type
    const typeSpecificAttributes = {
      'GetFile': ['file.lastModifiedTime', 'file.permissions'],
      'FetchFile': ['file.lastModifiedTime', 'file.permissions'],
      'GetHTTP': ['http.response.code', 'http.response.reason'],
      'InvokeHTTP': ['http.response.code', 'http.response.reason'],
      'GenerateFlowFile': ['generated.filename'],
      'UpdateAttribute': [] // Dynamic based on configuration
    };

    const specific = typeSpecificAttributes[component.type] || [];
    return [...commonAttributes, ...specific];
  }

  renderExpressionHistory() {
    if (this.expressionHistory.length === 0) {
      return '<p class="supertabs-el-empty">No recent expressions</p>';
    }

    return this.expressionHistory.slice(-10).map(item => `
      <div class="supertabs-el-history-item">
        <div class="supertabs-el-history-description">${item.description}</div>
        <code class="supertabs-el-history-expression">${item.expression}</code>
        <div class="supertabs-el-history-actions">
          <button class="supertabs-el-history-use" data-expression="${item.expression}">Use</button>
          <button class="supertabs-el-history-copy" data-expression="${item.expression}">Copy</button>
        </div>
      </div>
    `).join('');
  }

  bindEvents() {
    // Close button
    const closeBtn = this.element.querySelector('.supertabs-el-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Overlay click to close
    const overlay = this.element.querySelector('.supertabs-el-overlay');
    overlay?.addEventListener('click', () => this.hide());

    // Generate button
    const generateBtn = this.element.querySelector('.supertabs-el-generate');
    generateBtn?.addEventListener('click', () => this.generateExpression());

    // Examples button
    const examplesBtn = this.element.querySelector('.supertabs-el-examples');
    examplesBtn?.addEventListener('click', () => this.showExamples());

    // Copy button
    const copyBtn = this.element.querySelector('.supertabs-el-copy');
    copyBtn?.addEventListener('click', () => this.copyExpression());

    // Validate button
    const validateBtn = this.element.querySelector('.supertabs-el-validate');
    validateBtn?.addEventListener('click', () => this.validateExpression());

    // Save button
    const saveBtn = this.element.querySelector('.supertabs-el-save');
    saveBtn?.addEventListener('click', () => this.saveToLibrary());

    // Clear history button
    const clearBtn = this.element.querySelector('.supertabs-el-clear-history');
    clearBtn?.addEventListener('click', () => this.clearHistory());

    // History item actions
    this.bindHistoryEvents();

    // Enter key to generate
    const input = this.element.querySelector('.supertabs-el-input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        this.generateExpression();
      }
    });
  }

  bindHistoryEvents() {
    const useButtons = this.element.querySelectorAll('.supertabs-el-history-use');
    const copyButtons = this.element.querySelectorAll('.supertabs-el-history-copy');

    useButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expression = e.target.dataset.expression;
        this.useExpression(expression);
      });
    });

    copyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expression = e.target.dataset.expression;
        this.copyToClipboard(expression);
      });
    });
  }

  async generateExpression() {
    try {
      const input = this.element.querySelector('.supertabs-el-input');
      const description = input?.value?.trim();

      if (!description) {
        this.showError('Please describe what you want to achieve');
        return;
      }

      this.showLoading();

      // Get AI-generated expression
      const result = await this.getAIExpression(description);
      
      if (result) {
        this.showResult(result, description);
        this.addToHistory(description, result.expression);
      } else {
        this.showError('Failed to generate expression');
      }

    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to generate expression', error);
      this.showError('Error generating expression: ' + error.message);
    }
  }

  async getAIExpression(description) {
    try {
      if (!this.phi3Agent) {
        throw new Error('AI agent not available');
      }

      // Prepare context for the AI
      const context = {
        description: description,
        component: this.currentContext,
        availableAttributes: this.currentContext ? 
          this.getAvailableAttributes(this.currentContext.component || this.currentContext) : []
      };

      // Get expression from AI agent
      const response = await this.phi3Agent.generateExpressionLanguage(context);
      
      return response;
      
    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to get AI expression', error);
      throw error;
    }
  }

  showResult(result, description) {
    const resultDiv = this.element.querySelector('.supertabs-el-result');
    const expressionEl = this.element.querySelector('.supertabs-el-expression');
    const explanationEl = this.element.querySelector('.supertabs-el-explanation');

    expressionEl.textContent = result.expression;
    explanationEl.innerHTML = this.formatExplanation(result.explanation);

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  formatExplanation(explanation) {
    return explanation
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  showExamples() {
    const examples = [
      {
        description: "Get filename without extension",
        expression: "${filename:substringBeforeLast('.')}"
      },
      {
        description: "Convert filename to uppercase",
        expression: "${filename:toUpper()}"
      },
      {
        description: "Format current date",
        expression: "${now():format('yyyy-MM-dd HH:mm:ss')}"
      },
      {
        description: "Get file extension",
        expression: "${filename:substringAfterLast('.')}"
      },
      {
        description: "Check if attribute exists",
        expression: "${myAttribute:isEmpty():not()}"
      },
      {
        description: "Concatenate attributes",
        expression: "${path}/${filename}"
      },
      {
        description: "Math operation",
        expression: "${fileSize:toNumber():multiply(2)}"
      },
      {
        description: "Random UUID",
        expression: "${UUID()}"
      }
    ];

    const examplesHtml = examples.map(ex => `
      <div class="supertabs-el-example">
        <div class="supertabs-el-example-desc">${ex.description}</div>
        <code class="supertabs-el-example-expr">${ex.expression}</code>
        <button class="supertabs-el-example-use" data-expression="${ex.expression}">Use</button>
      </div>
    `).join('');

    // Show examples in a modal or insert into the interface
    this.showExamplesModal(examplesHtml);
  }

  showExamplesModal(examplesHtml) {
    const modal = document.createElement('div');
    modal.className = 'supertabs-el-examples-modal';
    modal.innerHTML = `
      <div class="supertabs-el-examples-overlay"></div>
      <div class="supertabs-el-examples-content">
        <div class="supertabs-el-examples-header">
          <h3>Expression Language Examples</h3>
          <button class="supertabs-el-examples-close">×</button>
        </div>
        <div class="supertabs-el-examples-list">
          ${examplesHtml}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Bind events
    modal.querySelector('.supertabs-el-examples-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.supertabs-el-examples-overlay').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelectorAll('.supertabs-el-example-use').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const expression = e.target.dataset.expression;
        this.useExpression(expression);
        modal.remove();
      });
    });
  }

  useExpression(expression) {
    const expressionEl = this.element.querySelector('.supertabs-el-expression');
    if (expressionEl) {
      expressionEl.textContent = expression;
      this.element.querySelector('.supertabs-el-result').style.display = 'block';
    }
  }

  async copyExpression() {
    const expressionEl = this.element.querySelector('.supertabs-el-expression');
    const expression = expressionEl?.textContent;
    
    if (expression) {
      await this.copyToClipboard(expression);
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      SuperTabsLogger.debug('ExpressionGenerator', 'Expression copied to clipboard');
      
      // Show feedback
      this.showToast('Expression copied to clipboard!');
    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to copy to clipboard', error);
    }
  }

  async validateExpression() {
    const expressionEl = this.element.querySelector('.supertabs-el-expression');
    const expression = expressionEl?.textContent;
    
    if (!expression) {
      return;
    }

    try {
      this.showValidationLoading();
      
      // Basic syntax validation
      const validation = this.validateExpressionSyntax(expression);
      this.showValidationResult(validation);
      
    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to validate expression', error);
      this.showValidationResult({
        valid: false,
        error: 'Validation failed: ' + error.message
      });
    }
  }

  validateExpressionSyntax(expression) {
    const validation = {
      valid: true,
      warnings: [],
      errors: []
    };

    // Basic syntax checks
    if (!expression.startsWith('${') || !expression.endsWith('}')) {
      validation.valid = false;
      validation.errors.push('Expression must start with ${ and end with }');
    }

    // Check for balanced parentheses
    let parenCount = 0;
    let quoteCount = 0;
    for (let char of expression) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (char === "'") quoteCount++;
    }

    if (parenCount !== 0) {
      validation.valid = false;
      validation.errors.push('Unbalanced parentheses');
    }

    if (quoteCount % 2 !== 0) {
      validation.valid = false;
      validation.errors.push('Unmatched quotes');
    }

    // Check for common functions
    const commonFunctions = [
      'toUpper', 'toLower', 'substring', 'substringBefore', 'substringAfter',
      'replace', 'isEmpty', 'isNull', 'not', 'format', 'toNumber', 'toString',
      'length', 'trim', 'now', 'UUID'
    ];

    // Add warnings for unknown functions
    const functionPattern = /(\w+)\(/g;
    let match;
    while ((match = functionPattern.exec(expression)) !== null) {
      const funcName = match[1];
      if (!commonFunctions.includes(funcName)) {
        validation.warnings.push(`Unknown function: ${funcName}`);
      }
    }

    return validation;
  }

  showValidationResult(validation) {
    const resultEl = this.element.querySelector('.supertabs-el-validation-result');
    
    let html = '';
    if (validation.valid) {
      html += '<div class="supertabs-el-validation-success">✅ Expression syntax is valid</div>';
    } else {
      html += '<div class="supertabs-el-validation-error">❌ Expression has syntax errors</div>';
    }

    if (validation.errors?.length > 0) {
      html += '<div class="supertabs-el-validation-errors">';
      html += '<strong>Errors:</strong><ul>';
      validation.errors.forEach(error => {
        html += `<li>${error}</li>`;
      });
      html += '</ul></div>';
    }

    if (validation.warnings?.length > 0) {
      html += '<div class="supertabs-el-validation-warnings">';
      html += '<strong>Warnings:</strong><ul>';
      validation.warnings.forEach(warning => {
        html += `<li>${warning}</li>`;
      });
      html += '</ul></div>';
    }

    resultEl.innerHTML = html;
  }

  addToHistory(description, expression) {
    this.expressionHistory.push({
      description: description,
      expression: expression,
      timestamp: Date.now()
    });

    // Keep only last 50 entries
    if (this.expressionHistory.length > 50) {
      this.expressionHistory = this.expressionHistory.slice(-50);
    }

    this.saveExpressionHistory();
  }

  async saveToLibrary() {
    const expressionEl = this.element.querySelector('.supertabs-el-expression');
    const expression = expressionEl?.textContent;
    
    if (!expression) {
      return;
    }

    try {
      // Save to user's expression library
      await SuperTabsStorage.saveToExpressionLibrary({
        expression: expression,
        description: this.element.querySelector('.supertabs-el-input').value,
        context: this.currentContext,
        timestamp: Date.now()
      });

      this.showToast('Expression saved to library!');
    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to save to library', error);
    }
  }

  async loadExpressionHistory() {
    try {
      this.expressionHistory = await SuperTabsStorage.getExpressionHistory() || [];
    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to load expression history', error);
      this.expressionHistory = [];
    }
  }

  async saveExpressionHistory() {
    try {
      await SuperTabsStorage.saveExpressionHistory(this.expressionHistory);
    } catch (error) {
      SuperTabsLogger.error('ExpressionGenerator', 'Failed to save expression history', error);
    }
  }

  async clearHistory() {
    if (confirm('Clear all expression history?')) {
      this.expressionHistory = [];
      await this.saveExpressionHistory();
      
      // Update UI
      const historyList = this.element.querySelector('.supertabs-el-history-list');
      if (historyList) {
        historyList.innerHTML = '<p class="supertabs-el-empty">No recent expressions</p>';
      }
    }
  }

  showLoading() {
    const resultDiv = this.element.querySelector('.supertabs-el-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <div class="supertabs-loading">
        <div class="supertabs-spinner"></div>
        Generating expression...
      </div>
    `;
  }

  showValidationLoading() {
    const resultEl = this.element.querySelector('.supertabs-el-validation-result');
    resultEl.innerHTML = `
      <div class="supertabs-loading-small">
        <div class="supertabs-spinner"></div>
        Validating...
      </div>
    `;
  }

  showError(message) {
    const resultDiv = this.element.querySelector('.supertabs-el-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <div class="supertabs-error">
        <div class="supertabs-error-title">Generation Error</div>
        <p class="supertabs-error-message">${message}</p>
      </div>
    `;
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'supertabs-toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('visible');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Public API
  async handleMessage(message) {
    switch (message.action) {
      case 'showGenerator':
        await this.show(message.context);
        break;
      case 'hideGenerator':
        this.hide();
        break;
      default:
        SuperTabsLogger.warn('ExpressionGenerator', 'Unknown message action', message);
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.phi3Agent = null;
    this.currentContext = null;
    this.isVisible = false;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsExpressionLanguageGenerator };
} else if (typeof window !== 'undefined') {
  window.SuperTabsExpressionLanguageGenerator = SuperTabsExpressionLanguageGenerator;
}