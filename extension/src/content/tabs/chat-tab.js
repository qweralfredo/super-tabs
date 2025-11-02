/**
 * SuperTabs - Chat Tab Component
 * AI-powered chat interface for component assistance
 */

class SuperTabsChatTab {
  constructor(container) {
    this.container = container;
    this.currentComponent = null;
    this.conversationHistory = [];
    this.isInitialized = false;
    this.currentMode = 'ai'; // 'ai' or 'instructor'
  }

  async init() {
    try {
      await this.createInterface();
      this.isInitialized = true;
      window.SuperTabsLogger?.debug('ChatTab', 'Chat tab initialized successfully');
    } catch (error) {
      window.SuperTabsLogger?.error('ChatTab', 'Failed to initialize chat tab', error);
    }
  }

  async createInterface() {
    if (!this.container) {
      throw new Error('Container not provided');
    }

    this.container.innerHTML = `
      <div class="supertabs-chat-content">
        <!-- Chat Mode Selector -->
        <div class="supertabs-chat-mode">
          <div class="supertabs-mode-tabs">
            <button class="supertabs-mode-btn active" data-mode="ai" id="ai-mode-btn">
              🤖 AI Assistant
            </button>
            <button class="supertabs-mode-btn" data-mode="instructor" id="instructor-mode-btn">
              👨‍🏫 Instructor
            </button>
          </div>
          <div class="supertabs-mode-status" id="mode-status">
            <span class="supertabs-status-indicator ai">🟢</span>
            <span>AI Assistant Mode</span>
          </div>
        </div>

        <!-- Component Context -->
        <div class="supertabs-chat-context" id="chat-context">
          <div class="supertabs-context-empty">
            <span>💭</span>
            <span>No component context available</span>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="supertabs-chat-messages" id="chat-messages">
          <div class="supertabs-chat-welcome">
            <div class="supertabs-welcome-icon">🤖</div>
            <div class="supertabs-welcome-message">
              <h4>Hello! I'm your NiFi AI Assistant</h4>
              <p>I can help you with component analysis, configuration questions, and troubleshooting. Select a component to get started!</p>
            </div>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="supertabs-chat-input-container">
          <div class="supertabs-chat-input-wrapper">
            <textarea 
              class="supertabs-chat-input" 
              id="chat-input" 
              placeholder="Ask me anything about this component..."
              rows="3"
              disabled
            ></textarea>
            <button class="supertabs-chat-send" id="send-btn" disabled>
              <span>Send</span>
              <span>📤</span>
            </button>
          </div>
          <div class="supertabs-chat-suggestions" id="chat-suggestions" style="display: none;">
            <!-- Suggestion chips will be populated here -->
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="supertabs-chat-actions" id="chat-actions" style="display: none;">
          <button class="supertabs-action-chip" data-action="explain">
            💡 Explain this component
          </button>
          <button class="supertabs-action-chip" data-action="troubleshoot">
            🔧 Troubleshoot issues
          </button>
          <button class="supertabs-action-chip" data-action="optimize">
            ⚡ Optimization tips
          </button>
          <button class="supertabs-action-chip" data-action="examples">
            📝 Usage examples
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Mode switching
    const modeBtns = this.container.querySelectorAll('.supertabs-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Chat input
    const chatInput = this.container.querySelector('#chat-input');
    const sendBtn = this.container.querySelector('#send-btn');

    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    chatInput?.addEventListener('input', (e) => {
      const hasText = e.target.value.trim().length > 0;
      sendBtn.disabled = !hasText || !this.currentComponent;
    });

    sendBtn?.addEventListener('click', () => this.sendMessage());

    // Quick actions
    const actionChips = this.container.querySelectorAll('.supertabs-action-chip');
    actionChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.executeQuickAction(action);
      });
    });
  }

  async setComponent(component) {
    try {
      SuperTabsLogger.debug('ChatTab', 'Setting component', { id: component?.id });
      
      this.currentComponent = component;
      
      if (!component) {
        this.showNoComponentState();
        return;
      }

      await this.setupComponentContext(component);
      this.enableChat();
      this.showQuickActions();
      
      // Add welcome message for new component
      this.addSystemMessage(`Hello! I'm now ready to help you with the **${component.component?.name || component.name || 'selected component'}**. What would you like to know?`);
      
      SuperTabsLogger.info('ChatTab', 'Component context set successfully');
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to set component', error);
      this.showError('Failed to load component context');
    }
  }

  async setupComponentContext(component) {
    const contextContainer = this.container.querySelector('#chat-context');
    const comp = component.component || component;
    
    const name = comp.name || comp.id || 'Unknown Component';
    const type = comp.type || 'Unknown Type';
    const state = comp.state || 'UNKNOWN';
    
    const statusIcon = {
      'RUNNING': '🟢',
      'STOPPED': '⚪',
      'INVALID': '🔴',
      'DISABLED': '🟡'
    }[state] || '⚫';

    contextContainer.innerHTML = `
      <div class="supertabs-context-active">
        <div class="supertabs-context-header">
          <span class="supertabs-context-icon">🎯</span>
          <span class="supertabs-context-title">Active Context</span>
        </div>
        <div class="supertabs-context-details">
          <div class="supertabs-context-item">
            <strong>${name}</strong>
            <span class="supertabs-context-type">${type}</span>
          </div>
          <div class="supertabs-context-status">
            <span class="supertabs-status-icon">${statusIcon}</span>
            <span class="supertabs-status-text">${state}</span>
          </div>
        </div>
      </div>
    `;

    // Update input placeholder
    const chatInput = this.container.querySelector('#chat-input');
    if (chatInput) {
      chatInput.placeholder = `Ask me about ${name}...`;
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    
    // Update mode buttons
    const modeBtns = this.container.querySelectorAll('.supertabs-mode-btn');
    modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update status indicator
    const modeStatus = this.container.querySelector('#mode-status');
    if (mode === 'ai') {
      modeStatus.innerHTML = `
        <span class="supertabs-status-indicator ai">🟢</span>
        <span>AI Assistant Mode</span>
      `;
    } else {
      modeStatus.innerHTML = `
        <span class="supertabs-status-indicator instructor">🟡</span>
        <span>Instructor Mode</span>
      `;
    }

    SuperTabsLogger.debug('ChatTab', `Switched to ${mode} mode`);
  }

  async sendMessage() {
    const chatInput = this.container.querySelector('#chat-input');
    const message = chatInput.value.trim();
    
    if (!message || !this.currentComponent) return;

    try {
      // Add user message to chat
      this.addUserMessage(message);
      
      // Clear input
      chatInput.value = '';
      chatInput.dispatchEvent(new Event('input')); // Trigger input event to update send button
      
      // Show typing indicator
      this.showTypingIndicator();
      
      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Remove typing indicator and add response
      this.removeTypingIndicator();
      this.addAIMessage(response);
      
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to send message', error);
      this.removeTypingIndicator();
      this.addSystemMessage('Sorry, I encountered an error processing your message. Please try again.');
    }
  }

  async getAIResponse(message) {
    try {
      // Prepare context for AI
      const context = {
        component: this.currentComponent,
        mode: this.currentMode,
        conversationHistory: this.conversationHistory.slice(-6) // Last 3 exchanges
      };

      // Enhanced prompt based on mode
      let enhancedPrompt = message;
      
      if (this.currentMode === 'instructor') {
        enhancedPrompt = `As an expert NiFi instructor, please provide a detailed educational response to: ${message}. Include explanations, best practices, and learning points.`;
      } else {
        enhancedPrompt = `As a helpful NiFi assistant, please answer: ${message}. Be concise but informative, focusing on practical guidance.`;
      }

      // Use PHI-4 agent if available
      if (window.phi4Agent) {
        const response = await window.phi4Agent.generateResponse(enhancedPrompt, context);
        
        // Store in conversation history
        this.conversationHistory.push({
          user: message,
          assistant: response,
          timestamp: new Date(),
          mode: this.currentMode
        });
        
        return response;
      } else {
        // Fallback responses
        return this.getFallbackResponse(message);
      }
      
    } catch (error) {
      SuperTabsLogger.error('ChatTab', 'Failed to get AI response', error);
      return this.getFallbackResponse(message);
    }
  }

  getFallbackResponse(message) {
    const comp = this.currentComponent?.component || this.currentComponent;
    const type = comp?.type || 'component';
    const name = comp?.name || 'this component';
    
    // Simple pattern matching for common questions
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('what') || lowerMessage.includes('explain')) {
      return `The **${name}** is a ${type} processor in Apache NiFi. It's designed for data processing and flow management. For detailed information, check the processor documentation or configuration panel.`;
    }
    
    if (lowerMessage.includes('how') || lowerMessage.includes('configure')) {
      return `To configure **${name}**, right-click on the processor and select "Configure". You can then adjust properties, relationships, and scheduling settings based on your requirements.`;
    }
    
    if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      return `For troubleshooting **${name}**, I recommend:\n\n• Check the processor's status and validation errors\n• Review the NiFi logs for error messages\n• Verify all required properties are configured\n• Ensure relationships are properly connected`;
    }
    
    if (lowerMessage.includes('performance') || lowerMessage.includes('optimize')) {
      return `To optimize **${name}** performance:\n\n• Adjust concurrent tasks based on your workload\n• Monitor queue sizes to prevent backpressure\n• Review scheduling settings (run schedule, timer driven)\n• Consider batch processing if applicable`;
    }
    
    // Default response
    return `I'd be happy to help you with **${name}**! This ${type} processor has various capabilities for data processing. You can ask me about configuration, troubleshooting, performance optimization, or specific use cases.`;
  }

  async executeQuickAction(action) {
    const actionMessages = {
      explain: 'Please explain what this component does and how it works.',
      troubleshoot: 'What are common issues with this component and how can I troubleshoot them?',
      optimize: 'How can I optimize this component for better performance?',
      examples: 'Can you provide some usage examples for this component?'
    };

    const message = actionMessages[action];
    if (message) {
      // Set the message in input and send it
      const chatInput = this.container.querySelector('#chat-input');
      chatInput.value = message;
      await this.sendMessage();
    }
  }

  addUserMessage(message) {
    const messagesContainer = this.container.querySelector('#chat-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'supertabs-chat-message user';
    messageElement.innerHTML = `
      <div class="supertabs-message-avatar">👤</div>
      <div class="supertabs-message-content">
        <div class="supertabs-message-text">${this.escapeHtml(message)}</div>
        <div class="supertabs-message-time">${this.formatTime(new Date())}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  addAIMessage(message) {
    const messagesContainer = this.container.querySelector('#chat-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = `supertabs-chat-message assistant ${this.currentMode}`;
    messageElement.innerHTML = `
      <div class="supertabs-message-avatar">${this.currentMode === 'ai' ? '🤖' : '👨‍🏫'}</div>
      <div class="supertabs-message-content">
        <div class="supertabs-message-text">${this.formatMessage(message)}</div>
        <div class="supertabs-message-time">${this.formatTime(new Date())}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  addSystemMessage(message) {
    const messagesContainer = this.container.querySelector('#chat-messages');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'supertabs-chat-message system';
    messageElement.innerHTML = `
      <div class="supertabs-message-avatar">ℹ️</div>
      <div class="supertabs-message-content">
        <div class="supertabs-message-text">${this.formatMessage(message)}</div>
        <div class="supertabs-message-time">${this.formatTime(new Date())}</div>
      </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const messagesContainer = this.container.querySelector('#chat-messages');
    
    const typingElement = document.createElement('div');
    typingElement.className = 'supertabs-chat-message assistant typing';
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
      <div class="supertabs-message-avatar">${this.currentMode === 'ai' ? '🤖' : '👨‍🏫'}</div>
      <div class="supertabs-message-content">
        <div class="supertabs-typing-indicator">
          <div class="supertabs-typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="supertabs-typing-text">Thinking...</span>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(typingElement);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const typingIndicator = this.container.querySelector('#typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  formatMessage(text) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^•\s/gm, '<span class="supertabs-bullet">•</span> ');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  scrollToBottom() {
    const messagesContainer = this.container.querySelector('#chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  enableChat() {
    const chatInput = this.container.querySelector('#chat-input');
    const sendBtn = this.container.querySelector('#send-btn');
    
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.placeholder = `Ask me about ${this.currentComponent?.component?.name || this.currentComponent?.name || 'this component'}...`;
    }
    
    if (sendBtn) {
      sendBtn.disabled = chatInput?.value.trim().length === 0;
    }
  }

  showQuickActions() {
    const actionsContainer = this.container.querySelector('#chat-actions');
    if (actionsContainer) {
      actionsContainer.style.display = 'flex';
    }
  }

  showNoComponentState() {
    const contextContainer = this.container.querySelector('#chat-context');
    const chatInput = this.container.querySelector('#chat-input');
    const sendBtn = this.container.querySelector('#send-btn');
    const actionsContainer = this.container.querySelector('#chat-actions');
    
    contextContainer.innerHTML = `
      <div class="supertabs-context-empty">
        <span>💭</span>
        <span>No component context available</span>
      </div>
    `;
    
    if (chatInput) {
      chatInput.disabled = true;
      chatInput.placeholder = 'Select a component to start chatting...';
    }
    
    if (sendBtn) {
      sendBtn.disabled = true;
    }
    
    if (actionsContainer) {
      actionsContainer.style.display = 'none';
    }
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="supertabs-error">
        <div class="supertabs-error-title">Chat Error</div>
        <p class="supertabs-error-message">${message}</p>
        <button class="supertabs-button small" onclick="location.reload()">
          Reload Page
        </button>
      </div>
    `;
  }

  clearChat() {
    const messagesContainer = this.container.querySelector('#chat-messages');
    messagesContainer.innerHTML = `
      <div class="supertabs-chat-welcome">
        <div class="supertabs-welcome-icon">🤖</div>
        <div class="supertabs-welcome-message">
          <h4>Chat Cleared</h4>
          <p>Ready for a fresh conversation!</p>
        </div>
      </div>
    `;
    
    this.conversationHistory = [];
  }

  async refresh() {
    // Refresh can reload the current component context
    if (this.currentComponent) {
      await this.setComponent(this.currentComponent);
    }
  }

  destroy() {
    this.currentComponent = null;
    this.conversationHistory = [];
    this.isInitialized = false;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperTabsChatTab };
} else if (typeof window !== 'undefined') {
  window.SuperTabsChatTab = SuperTabsChatTab;
}