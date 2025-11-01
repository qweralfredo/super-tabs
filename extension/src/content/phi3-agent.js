/**
 * PHI-3 Agent - Simplified version for Chrome Extension
 * Handles AI interactions with PHI-3 and Claude fallback
 */

class PHI3Agent {
  constructor() {
    this.modelPrimary = 'phi-3';
    this.modelFallback = 'claude-sonnet-4.5';
    this.apiEndpoint = 'https://api.phi3.ai/v1/chat/completions'; // Placeholder
    this.claudeEndpoint = 'https://api.anthropic.com/v1/messages'; // Placeholder
    this.apiKey = null;
    this.claudeKey = null;
    this.conversationHistory = [];
  }

  /**
   * Initialize with API keys from storage
   */
  async initialize() {
    try {
      const result = await chrome.storage.sync.get(['phi3ApiKey', 'claudeApiKey']);
      this.apiKey = result.phi3ApiKey;
      this.claudeKey = result.claudeApiKey;
      console.log('[PHI-3 Agent] Initialized');
    } catch (error) {
      console.error('[PHI-3 Agent] Initialization error:', error);
    }
  }

  /**
   * Generate response using AI
   */
  async generateResponse(prompt, context = {}) {
    try {
      // Try PHI-3 first
      if (this.apiKey) {
        return await this.callPHI3(prompt, context);
      }
      
      // Fallback to Claude if available
      if (this.claudeKey) {
        return await this.callClaude(prompt, context);
      }

      // Fallback to mock response
      return this.getMockResponse(prompt, context);
      
    } catch (error) {
      console.error('[PHI-3 Agent] Generation error:', error);
      return this.getMockResponse(prompt, context);
    }
  }

  /**
   * Call PHI-3 API
   */
  async callPHI3(prompt, context) {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt(context)
      },
      ...this.conversationHistory,
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'phi-3',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      this.addToHistory('user', prompt);
      this.addToHistory('assistant', aiResponse);
      return aiResponse;
    } else {
      throw new Error(`PHI-3 API error: ${response.status}`);
    }
  }

  /**
   * Call Claude API
   */
  async callClaude(prompt, context) {
    const response = await fetch(this.claudeEndpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.claudeKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        system: this.getSystemPrompt(context),
        messages: [
          ...this.conversationHistory,
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.content[0].text;
      this.addToHistory('user', prompt);
      this.addToHistory('assistant', aiResponse);
      return aiResponse;
    } else {
      throw new Error(`Claude API error: ${response.status}`);
    }
  }

  /**
   * Get system prompt based on context
   */
  getSystemPrompt(context) {
    const basePrompt = `You are an expert Apache NiFi assistant specializing in data flow analysis, component configuration, and Expression Language generation. You have deep knowledge of NiFi processors, relationships, and best practices.`;
    
    if (context.component) {
      return `${basePrompt}\n\nYou are currently analyzing a ${context.component.type} component named "${context.component.name}". The component has the following properties: ${JSON.stringify(context.component.properties, null, 2)}`;
    }

    if (context.expressionLanguage) {
      return `${basePrompt}\n\nYou are helping generate and validate NiFi Expression Language. Provide accurate, working expressions and explain their functionality.`;
    }

    return basePrompt;
  }

  /**
   * Generate mock response for testing
   */
  getMockResponse(prompt, context) {
    const responses = {
      component: `Based on the selected component, I can see this is a ${context.component?.type || 'processor'} with specific configuration. Here are some insights:\n\n• Purpose: Data processing and transformation\n• Status: Currently ${context.component?.state || 'stopped'}\n• Recommendations: Consider optimizing batch size and concurrent tasks for better performance.`,
      
      expressionLanguage: `Here's a NiFi Expression Language example:\n\n\`\${filename:substringBefore('.')}\`\n\nThis expression extracts the filename without extension. You can use it to:\n• Transform filenames\n• Route based on file types\n• Generate new attributes`,
      
      general: `I'm here to help you with Apache NiFi! I can assist with:\n\n• Component analysis and optimization\n• Expression Language generation\n• Flow design recommendations\n• Troubleshooting issues\n\nWhat would you like to know about your NiFi setup?`
    };

    if (context.component) return responses.component;
    if (context.expressionLanguage) return responses.expressionLanguage;
    return responses.general;
  }

  /**
   * Add message to conversation history
   */
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    
    // Keep only last 10 messages to manage context size
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Generate Expression Language
   */
  async generateExpressionLanguage(description, examples = []) {
    const prompt = `Generate a NiFi Expression Language for: ${description}\n\nProvide the expression and explain its functionality.${examples.length > 0 ? `\n\nExamples for reference: ${examples.join(', ')}` : ''}`;
    
    return await this.generateResponse(prompt, { expressionLanguage: true });
  }

  /**
   * Analyze component health
   */
  async analyzeComponent(component, stats = {}) {
    const prompt = `Analyze the health and performance of this NiFi component:\n\nComponent: ${JSON.stringify(component, null, 2)}\nStats: ${JSON.stringify(stats, null, 2)}\n\nProvide insights on performance, configuration, and recommendations.`;
    
    return await this.generateResponse(prompt, { component });
  }
}

// Global instance
window.phi3Agent = new PHI3Agent();
window.phi3Agent.initialize();