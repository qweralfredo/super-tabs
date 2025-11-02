/**
 * SuperTabs - Chat Tab
 * AI-powered chat interface for component assistance
 */

class SuperTabsChatTab {
  constructor(container) {
    this.container = container;
    this.component = null;
    this.phi3Agent = null;
    this.isLoading = false;
    this.conversation = [];
    this.isTyping = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      SuperTabsLogger.debug('ChatTab', 'Initializing chat tab');
      
      // Get Phi3 agent instance
      this.phi3Agent = window.phi3Agent;
      
      // Show initial state
      this.showWelcomeState();
      
      SuperTabsLogger.info('ChatTab', 'Chat tab initialized');
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to initialize chat tab', error);
      this.showError('Failed to initialize AI chat');
    }
  }

  async setComponent(component) {
    try {
      SuperTabsLogger.debug('ChatTab', 'Setting component for chat tab', { id: component?.id });
      
      this.component = component;
      
      if (!component) {
        this.showWelcomeState();
        return;
      }

      // Load conversation history for this component
      await this.loadConversationHistory();
      
      // Render chat interface
      this.renderChatInterface();
      
      // Send welcome message if no history
      if (this.conversation.length === 0) {
        await this.sendWelcomeMessage();
      }
      
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to set component', error);
      this.showError('Failed to initialize chat for component');
    }
  }

  async refresh() {
    if (this.component) {
      this.renderChatInterface();
    }
  }

  async loadConversationHistory() {
    try {
      if (!this.component?.id) return;
      
      const history = await SuperTabsStorage.getChatHistory(this.component.id);
      this.conversation = history || [];
      
      SuperTabsLogger.debug('ChatTab', `Loaded ${this.conversation.length} messages from history`);
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to load conversation history', error);
      this.conversation = [];
    }
  }

  async saveConversationHistory() {
    try {
      if (!this.component?.id) return;
      
      await SuperTabsStorage.saveChatHistory(this.component.id, this.conversation);
      SuperTabsLogger.debug('ChatTab', 'Conversation history saved');
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to save conversation history', error);
    }
  }

  renderChatInterface() {
    const componentName = this.component?.component?.name || this.component?.name || 'Component';
    const html = `
      <div class="supertabs-chat-content">
        <div class="supertabs-chat-mode-selector">
          <div class="supertabs-mode-buttons">
            <button class="supertabs-mode-btn active" data-mode="assistant">🤖 AI Assistant</button>
            <button class="supertabs-mode-btn" data-mode="instructor">👨‍🏫 Instructor</button>
          </div>
          <div class="supertabs-mode-status">🟢 AI Assistant Mode</div>
        </div>
        
        <div class="supertabs-chat-context">
          <div class="supertabs-context-header">🎯 Active Context</div>
          <div class="supertabs-context-info">
            <div class="supertabs-context-component">
              <strong>${componentName}</strong>
              <span>${this.component?.component?.type || 'Processor'}</span>
            </div>
            <div class="supertabs-context-status">⚫ ${this.component?.component?.state || 'UNKNOWN'}</div>
          </div>
        </div>
        
        <div class="supertabs-chat-messages" id="supertabs-chat-messages">
          ${this.renderMessages()}
          ${this.isTyping ? this.renderTypingIndicator() : ''}
        </div>
        
        <div class="supertabs-chat-input-container">
          <div class="supertabs-chat-input-group">
            <textarea 
              class="supertabs-chat-input" 
              id="supertabs-chat-input"
              placeholder="Ask me about ${componentName}..."
              rows="1"
            ></textarea>
            <button 
              class="supertabs-chat-send-btn" 
              id="supertabs-chat-send"
              ${this.isTyping ? 'disabled' : ''}
            >
              Send 📤
            </button>
          </div>
          <div class="supertabs-chat-quick-actions">
            <button class="supertabs-quick-btn" id="supertabs-explain-btn">� Explain this component</button>
            <button class="supertabs-quick-btn" id="supertabs-troubleshoot-btn">� Troubleshoot issues</button>
            <button class="supertabs-quick-btn" id="supertabs-optimize-btn">⚡ Optimization tips</button>
            <button class="supertabs-quick-btn" id="supertabs-examples-btn">� Usage examples</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindChatEvents();
    this.scrollToBottom();
  }

  renderMessages() {
    return this.conversation.map(message => this.renderMessage(message)).join('');
  }

  renderMessage(message) {
    const timeStr = new Date(message.timestamp).toLocaleTimeString();
    const messageClass = message.role === 'user' ? 'user' : 'assistant';
    
    return `
      <div class="supertabs-chat-message ${messageClass}">
        <div class="supertabs-message-bubble">
          ${this.formatMessageContent(message.content)}
        </div>
        <div class="supertabs-message-time">${timeStr}</div>
      </div>
    `;
  }

  formatMessageContent(content) {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  renderTypingIndicator() {
    return `
      <div class="supertabs-typing-indicator">
        <div class="supertabs-typing-dots">
          <div class="supertabs-typing-dot"></div>
          <div class="supertabs-typing-dot"></div>
          <div class="supertabs-typing-dot"></div>
        </div>
        <span>AI is thinking...</span>
      </div>
    `;
  }

  bindChatEvents() {
    const input = this.container.querySelector('#supertabs-chat-input');
    const sendBtn = this.container.querySelector('#supertabs-chat-send');
    
    // Quick action buttons
    const explainBtn = this.container.querySelector('#supertabs-explain-btn');
    const troubleshootBtn = this.container.querySelector('#supertabs-troubleshoot-btn');
    const optimizeBtn = this.container.querySelector('#supertabs-optimize-btn');
    const examplesBtn = this.container.querySelector('#supertabs-examples-btn');

    // Send message on button click
    sendBtn?.addEventListener('click', () => this.sendMessage());

    // Send message on Enter key (but allow Shift+Enter for new line)
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    input?.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    });

    // Quick action buttons
    explainBtn?.addEventListener('click', () => {
      this.sendQuickMessage('💡 Explain this component');
    });

    troubleshootBtn?.addEventListener('click', () => {
      this.sendQuickMessage('🔧 Troubleshoot issues');
    });

    optimizeBtn?.addEventListener('click', () => {
      this.sendQuickMessage('⚡ Optimization tips');
    });

    examplesBtn?.addEventListener('click', () => {
      this.sendQuickMessage('📝 Usage examples');
    });

    // Mode selector
    const modeButtons = this.container.querySelectorAll('.supertabs-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);
      });
    });
  }

  async sendQuickMessage(message) {
    const input = this.container.querySelector('#supertabs-chat-input');
    if (input) {
      input.value = message;
      await this.sendMessage();
    }
  }

  switchMode(mode) {
    // Update button states
    const modeButtons = this.container.querySelectorAll('.supertabs-mode-btn');
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update status
    const statusElement = this.container.querySelector('.supertabs-mode-status');
    if (statusElement) {
      const modeText = mode === 'assistant' ? '🟢 AI Assistant Mode' : '🔵 Instructor Mode';
      statusElement.textContent = modeText;
    }

    SuperTabsLogger.debug('ChatTab', `Switched to ${mode} mode`);
  }

  async sendMessage() {
    const input = this.container.querySelector('#supertabs-chat-input');
    const message = input?.value?.trim();
    
    if (!message || this.isTyping) {
      return;
    }

    try {
      // Add user message
      this.addMessage('user', message);
      input.value = '';
      input.style.height = 'auto';
      
      // Update UI
      this.renderChatInterface();
      
      // Set typing state
      this.isTyping = true;
      this.renderChatInterface();
      
      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Add AI response
      this.addMessage('assistant', response);
      
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to send message', error);
      this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      this.isTyping = false;
      this.renderChatInterface();
      await this.saveConversationHistory();
    }
  }

  async getAIResponse(userMessage) {
    try {
      if (!this.phi3Agent) {
        SuperTabsLogger.warn('ChatTab', 'AI agent not available, using mock response');
        return this.getMockAIResponse(userMessage);
      }

      // Prepare context about the component
      const context = await this.prepareComponentContext();
      
      // Get response from AI agent
      const response = await this.phi3Agent.generateResponse(userMessage, {
        component: this.component,
        context: context,
        conversationHistory: this.conversation.slice(-10) // Last 10 messages for context
      });

      return response;
      
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to get AI response', error);
      return this.getMockAIResponse(userMessage);
    }
  }

  getMockAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what')) {
      return `Based on the selected component, I can see this is a ${this.component?.component?.type || 'Processor'} with specific configuration. Here are some insights:

• **Purpose**: Data processing and transformation
• **Status**: Currently ${this.component?.component?.state || 'UNKNOWN'}
• **Recommendations**: Consider optimizing batch size and concurrent tasks for better performance.`;
    }
    
    if (lowerMessage.includes('troubleshoot') || lowerMessage.includes('problem') || lowerMessage.includes('error')) {
      return `Here are common troubleshooting steps for this component:

• **Check Configuration**: Verify all required properties are set correctly
• **Review Logs**: Look for specific error messages in NiFi logs
• **Validate Connections**: Ensure input/output connections are properly configured
• **Test Data**: Try with smaller data sets to isolate issues
• **Performance**: Monitor memory and CPU usage during processing`;
    }
    
    if (lowerMessage.includes('optimize') || lowerMessage.includes('performance') || lowerMessage.includes('improve')) {
      return `Performance optimization suggestions:

• **Batch Size**: Increase batch size for better throughput
• **Concurrent Tasks**: Adjust based on available resources
• **Memory Settings**: Configure appropriate heap sizes
• **Connection Queues**: Set appropriate queue sizes and back pressure
• **Scheduling**: Optimize run schedule based on data patterns`;
    }
    
    if (lowerMessage.includes('example') || lowerMessage.includes('usage')) {
      return `Here are some usage examples for this component:

• **Basic Configuration**: Set required properties for standard operation
• **Advanced Settings**: Configure optional properties for specific use cases
• **Expression Language**: Use dynamic property values with NiFi EL
• **Error Handling**: Configure failure relationships and retry logic
• **Monitoring**: Set up bulletins and notifications for errors`;
    }
    
    return `I'm here to help you with this ${this.component?.component?.type || 'component'}! I can assist with:

• **Configuration** questions and property explanations
• **Troubleshooting** issues and error diagnosis
• **Performance** optimization and tuning advice
• **Usage examples** and best practices
• **Expression Language** generation and validation

What specific aspect would you like to explore?`;
  }

  async prepareComponentContext() {
    try {
      const comp = this.component.component || this.component;
      
      const context = {
        basic: {
          id: comp.id,
          name: comp.name || 'Unnamed Component',
          type: comp.type,
          state: comp.state
        },
        properties: comp.config?.properties || {},
        relationships: comp.relationships || [],
        position: comp.position || {},
        validation: comp.validationErrors || []
      };

      // Add recent stats if available from stats tab
      const statsTab = window.superTabsSidebar?.tabInstances?.stats;
      if (statsTab?.stats?.current) {
        context.recentStats = statsTab.stats.current;
      }

      return context;
      
    } catch (error) {
      SuperTabsLogger.warn('ChatTab', 'Failed to prepare component context', error);
      return {};
    }
  }

  addMessage(role, content) {
    const message = {
      role: role,
      content: content,
      timestamp: Date.now()
    };
    
    this.conversation.push(message);
    SuperTabsLogger.debug('ChatTab', `Added ${role} message`, { length: content.length });
  }

  async sendWelcomeMessage() {
    try {
      const comp = this.component.component || this.component;
      const componentName = comp.name || 'component';
      const componentType = comp.type || 'Processor';
      
      const welcomeMsg = `Hello! I'm now ready to help you with the **${componentName}**. What would you like to know?`;

      this.addMessage('assistant', welcomeMsg);
      this.renderChatInterface();
      
      SuperTabsLogger.info('ChatTab', 'Component context set successfully');
      
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to send welcome message', error);
    }
  }

  async clearChat() {
    try {
      const confirmed = confirm('Clear all chat messages for this component?');
      if (!confirmed) return;
      
      this.conversation = [];
      await this.saveConversationHistory();
      
      // Send new welcome message
      await this.sendWelcomeMessage();
      
      SuperTabsLogger.info('ChatTab', 'Chat history cleared');
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to clear chat', error);
    }
  }

  async exportChat() {
    try {
      const comp = this.component.component || this.component;
      const exportData = {
        component: {
          id: comp.id,
          name: comp.name || 'Unnamed Component',
          type: comp.type
        },
        conversation: this.conversation,
        exportTime: new Date().toISOString()
      };
      
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${comp.name || 'component'}_chat.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      SuperTabsLogger.info('ChatTab', 'Chat conversation exported');
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to export chat', error);
    }
  }

  async showSuggestions() {
    try {
      const componentType = this.component?.component?.type || 'component';
      const suggestions = [
        `💡 Explain this ${componentType}`,
        `🔧 Troubleshoot issues`,
        `⚡ Optimization tips`,
        `📝 Usage examples`,
        `⚙️ Configuration help`,
        `📊 Performance analysis`,
        `🔍 Expression Language help`,
        `📚 Best practices`
      ];

      // Create suggestions overlay
      const overlay = document.createElement('div');
      overlay.className = 'supertabs-suggestions-overlay';
      overlay.innerHTML = `
        <div class="supertabs-suggestions-modal">
          <div class="supertabs-suggestions-header">
            <h4>Quick Questions</h4>
            <button class="supertabs-close-suggestions">×</button>
          </div>
          <div class="supertabs-suggestions-content">
            ${suggestions.map(suggestion => 
              `<button class="supertabs-suggestion-btn" data-suggestion="${suggestion}">${suggestion}</button>`
            ).join('')}
          </div>
        </div>
      `;

      // Add to container
      this.container.appendChild(overlay);

      // Bind events
      overlay.querySelector('.supertabs-close-suggestions').addEventListener('click', () => {
        overlay.remove();
      });

      overlay.querySelectorAll('.supertabs-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const suggestion = btn.dataset.suggestion;
          const input = this.container.querySelector('#supertabs-chat-input');
          if (input) {
            input.value = suggestion;
            input.focus();
            input.dispatchEvent(new Event('input')); // Trigger auto-resize
          }
          overlay.remove();
        });
      });

      // Close on outside click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });

    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to show suggestions', error);
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = this.container.querySelector('#supertabs-chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  showWelcomeState() {
    this.container.innerHTML = `
      <div class="supertabs-chat-content">
        <div class="supertabs-chat-mode-selector">
          <div class="supertabs-mode-buttons">
            <button class="supertabs-mode-btn active" data-mode="assistant">🤖 AI Assistant</button>
            <button class="supertabs-mode-btn" data-mode="instructor">👨‍🏫 Instructor</button>
          </div>
          <div class="supertabs-mode-status">🟢 AI Assistant Mode</div>
        </div>
        
        <div class="supertabs-chat-context">
          <div class="supertabs-context-header">🎯 Active Context</div>
          <div class="supertabs-context-info">
            <div class="supertabs-context-component">
              <strong>No Component Selected</strong>
              <span>Select a component to start</span>
            </div>
            <div class="supertabs-context-status">⚫ WAITING</div>
          </div>
        </div>
        
        <div class="supertabs-chat-welcome">
          <div class="supertabs-welcome-content">
            <div class="supertabs-welcome-icon">🤖</div>
            <div class="supertabs-welcome-message">
              <h4>Hello! I'm your NiFi AI Assistant</h4>
              <p>I can help you with component analysis, configuration questions, and troubleshooting. Select a component to get started!</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="supertabs-error">
        <div class="supertabs-error-title">Chat Error</div>
        <p class="supertabs-error-message">${message}</p>
        <button class="supertabs-btn supertabs-btn-primary" onclick="this.closest('.supertabs-tab-pane').dispatchEvent(new CustomEvent('retry'))">
          🔄 Retry
        </button>
      </div>
    `;

    this.container.addEventListener('retry', () => this.refresh());
  }

  destroy() {
    this.component = null;
    this.phi3Agent = null;
    this.conversation = [];
    this.isTyping = false;
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsChatTab };
} else if (typeof window !== 'undefined') {
  window.SuperTabsChatTab = SuperTabsChatTab;
}