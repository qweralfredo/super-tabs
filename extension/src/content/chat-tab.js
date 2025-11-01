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
      this.phi3Agent = window.superTabsPhi3Agent;
      
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
    const html = `
      <div class="supertabs-chat-content">
        <div class="supertabs-chat-messages" id="supertabs-chat-messages">
          ${this.renderMessages()}
          ${this.isTyping ? this.renderTypingIndicator() : ''}
        </div>
        
        <div class="supertabs-chat-input-container">
          <div class="supertabs-chat-input-group">
            <textarea 
              class="supertabs-chat-input" 
              id="supertabs-chat-input"
              placeholder="Ask about this component..."
              rows="1"
            ></textarea>
            <button 
              class="supertabs-chat-send-btn" 
              id="supertabs-chat-send"
              ${this.isTyping ? 'disabled' : ''}
            >
              Send
            </button>
          </div>
          <div class="supertabs-chat-actions">
            <button class="supertabs-btn supertabs-btn-secondary supertabs-btn-small" id="supertabs-clear-chat">
              🗑️ Clear
            </button>
            <button class="supertabs-btn supertabs-btn-secondary supertabs-btn-small" id="supertabs-export-chat">
              💾 Export
            </button>
            <button class="supertabs-btn supertabs-btn-secondary supertabs-btn-small" id="supertabs-suggest-questions">
              💡 Suggestions
            </button>
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
    const clearBtn = this.container.querySelector('#supertabs-clear-chat');
    const exportBtn = this.container.querySelector('#supertabs-export-chat');
    const suggestBtn = this.container.querySelector('#supertabs-suggest-questions');

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

    // Action buttons
    clearBtn?.addEventListener('click', () => this.clearChat());
    exportBtn?.addEventListener('click', () => this.exportChat());
    suggestBtn?.addEventListener('click', () => this.showSuggestions());
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
        throw new Error('AI agent not available');
      }

      // Prepare context about the component
      const context = await this.prepareComponentContext();
      
      // Get response from AI agent
      const response = await this.phi3Agent.chatWithComponent(
        this.component,
        userMessage,
        {
          context: context,
          conversationHistory: this.conversation.slice(-10) // Last 10 messages for context
        }
      );

      return response;
      
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to get AI response', error);
      throw error;
    }
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
      const welcomeMsg = `Hello! I'm your AI assistant for the ${comp.type} "${comp.name || 'component'}". 

I can help you with:
• **Configuration** - Explain properties and settings
• **Troubleshooting** - Analyze issues and suggest solutions  
• **Optimization** - Performance tips and best practices
• **Expression Language** - Generate and explain expressions
• **Documentation** - Answer questions about functionality

What would you like to know about this component?`;

      this.addMessage('assistant', welcomeMsg);
      this.renderChatInterface();
      
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
    const suggestions = [
      "How do I configure this component?",
      "What are the available properties?",
      "How can I troubleshoot errors?",
      "Show me example configurations",
      "What relationships are available?",
      "How can I optimize performance?",
      "Generate an expression for property X",
      "Explain the validation errors"
    ];

    const suggestionsHtml = suggestions.map(suggestion => 
      `<button class="supertabs-suggestion-btn" data-suggestion="${suggestion}">${suggestion}</button>`
    ).join('');

    // Show suggestions modal or insert into chat
    const input = this.container.querySelector('#supertabs-chat-input');
    if (input) {
      // For now, just show the first suggestion
      input.value = suggestions[0];
      input.focus();
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
      <div class="supertabs-empty">
        <div class="supertabs-empty-icon">💬</div>
        <div class="supertabs-empty-title">AI Chat Assistant</div>
        <div class="supertabs-empty-message">Select a component to start chatting with the AI assistant</div>
        <div style="margin-top: 16px; font-size: 14px; color: var(--nifi-gray-medium);">
          <p><strong>I can help you with:</strong></p>
          <ul style="text-align: left; margin-top: 8px;">
            <li>Component configuration</li>
            <li>Troubleshooting issues</li>
            <li>Performance optimization</li>
            <li>Expression Language</li>
            <li>Documentation questions</li>
          </ul>
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