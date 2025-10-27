// Configurações e utilitários para o NiFi Super Tabs
const NiFiSuperTabsConfig = {
  // Seletores para diferentes versões do NiFi
  selectors: {
    canvas: ['#nf-canvas', '.canvas', 'svg', '#canvas-container'],
    processors: [
      '.processor',
      '[class*="processor"]',
      'g[class*="component"]',
      '.component.processor',
      'rect[class*="processor"]'
    ],
    connections: [
      '.connection',
      '[class*="connection"]',
      'path[class*="connection"]',
      'g[class*="connection"]',
      '.flow-connection'
    ],
    flowfiles: [
      '.flowfile',
      '[class*="flowfile"]',
      '[data-flowfile]',
      '.queue-listing-table tr',
      '.flowfile-summary'
    ]
  },
  
  // Configurações de detecção
  detection: {
    maxAttempts: 50,
    retryDelay: 200,
    observerConfig: {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'data-flowfile']
    }
  },
  
  // URLs que indicam presença do NiFi
  nifiIndicators: [
    'nifi',
    '/nf/',
    'canvas',
    'processor',
    'flow.xml',
    '8080', // Porta padrão
    '8443'  // Porta HTTPS padrão
  ],
  
  // Tipos de sugestões disponíveis
  suggestionTypes: {
    tip: { emoji: '💡', color: '#4ade80' },
    warning: { emoji: '⚠️', color: '#fbbf24' },
    info: { emoji: 'ℹ️', color: '#60a5fa' },
    link: { emoji: '🔗', color: '#a78bfa' },
    feature: { emoji: '✨', color: '#f472b6' },
    action: { emoji: '🚀', color: '#fb7185' },
    history: { emoji: '📜', color: '#34d399' },
    error: { emoji: '❌', color: '#f87171' },
    success: { emoji: '✅', color: '#10b981' }
  }
};

// Utilitários para detecção aprimorada do NiFi
const NiFiDetector = {
  // Detecta se estamos em uma página do NiFi
  isNiFiPage() {
    const indicators = [
      // Título da página
      () => document.title.toLowerCase().includes('nifi'),
      
      // Meta tags
      () => {
        const metas = document.querySelectorAll('meta[name*="nifi"], meta[content*="nifi"]');
        return metas.length > 0;
      },
      
      // Scripts do NiFi
      () => {
        const scripts = document.querySelectorAll('script[src*="nifi"]');
        return scripts.length > 0;
      },
      
      // Elementos específicos do NiFi
      () => {
        return NiFiSuperTabsConfig.selectors.canvas.some(selector => 
          document.querySelector(selector)
        );
      },
      
      // URL
      () => {
        const url = window.location.href.toLowerCase();
        return NiFiSuperTabsConfig.nifiIndicators.some(indicator => 
          url.includes(indicator)
        );
      },
      
      // Classes CSS específicas
      () => {
        const bodyClasses = document.body.className.toLowerCase();
        return bodyClasses.includes('nifi') || bodyClasses.includes('canvas');
      }
    ];
    
    return indicators.some(check => check());
  },
  
  // Detecta a versão do NiFi (se possível)
  detectVersion() {
    // Tenta detectar versão através de diferentes métodos
    const versionSelectors = [
      'meta[name="nifi-version"]',
      '[data-nifi-version]',
      '.nifi-version',
      '#nifi-version'
    ];
    
    for (const selector of versionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.content || element.textContent || element.dataset.nifiVersion;
      }
    }
    
    return 'unknown';
  },
  
  // Aguarda elementos específicos aparecerem
  waitForElements(selectors, callback, maxAttempts = 50) {
    let attempts = 0;
    
    const check = () => {
      const found = selectors.some(selector => 
        document.querySelector(selector)
      );
      
      if (found || attempts >= maxAttempts) {
        callback(found);
      } else {
        attempts++;
        setTimeout(check, NiFiSuperTabsConfig.detection.retryDelay);
      }
    };
    
    check();
  }
};

// Sistema de sugestões inteligentes
const SuggestionEngine = {
  // Base de conhecimento expandida
  knowledgeBase: {
    processor: {
      'GetFile': [
        {
          title: 'Configuração de Diretório',
          content: 'Use caminhos absolutos e verifique permissões de leitura',
          type: 'tip'
        },
        {
          title: 'Polling Interval',
          content: 'Ajuste o intervalo conforme a frequência de novos arquivos',
          type: 'warning'
        }
      ],
      'PutFile': [
        {
          title: 'Permissões de Escrita',
          content: 'Certifique-se que o NiFi tem permissão para escrever no diretório',
          type: 'warning'
        },
        {
          title: 'Conflict Resolution',
          content: 'Configure estratégia para arquivos existentes',
          type: 'tip'
        }
      ],
      'RouteOnAttribute': [
        {
          title: 'Expressões Regulares',
          content: 'Use ${filename:matches(".*\\.csv")} para filtrar CSVs',
          type: 'feature'
        }
      ]
    },
    
    connection: {
      default: [
        {
          title: 'Back Pressure',
          content: 'Configure object threshold baseado no volume esperado',
          type: 'tip'
        },
        {
          title: 'Prioritizers',
          content: 'Use FirstInFirstOutPrioritizer para FIFO simples',
          type: 'feature'
        }
      ]
    },
    
    flowfile: {
      default: [
        {
          title: 'Atributos Core',
          content: 'filename, path, absolute.path, mime.type são atributos fundamentais',
          type: 'info'
        },
        {
          title: 'Tamanho Máximo',
          content: 'FlowFiles muito grandes podem causar problemas de memória',
          type: 'warning'
        }
      ]
    }
  },
  
  // Gera sugestões baseadas no contexto
  generateSuggestions(elementType, element) {
    const suggestions = [];
    
    // Sugestões baseadas no tipo de elemento
    const typeDB = this.knowledgeBase[elementType];
    if (typeDB) {
      if (element && element.textContent) {
        // Tenta identificar o tipo específico do processor
        const elementText = element.textContent.toLowerCase();
        for (const [processorType, processorSuggestions] of Object.entries(typeDB)) {
          if (elementText.includes(processorType.toLowerCase())) {
            suggestions.push(...processorSuggestions);
            break;
          }
        }
      }
      
      // Adiciona sugestões padrão
      if (typeDB.default) {
        suggestions.push(...typeDB.default);
      }
    }
    
    // Adiciona sugestões contextuais baseadas no estado da página
    this.addContextualSuggestions(suggestions, elementType, element);
    
    return suggestions;
  },
  
  // Adiciona sugestões baseadas no contexto atual
  addContextualSuggestions(suggestions, elementType, element) {
    // Verifica se há erros visíveis
    const errorElements = document.querySelectorAll('.error, .warning, [class*="error"]');
    if (errorElements.length > 0) {
      suggestions.unshift({
        title: 'Erros Detectados',
        content: 'Há elementos com erros visíveis na interface',
        type: 'error'
      });
    }
    
    // Verifica performance
    const queueElements = document.querySelectorAll('[class*="queue"]');
    if (queueElements.length > 10) {
      suggestions.push({
        title: 'Muitas Filas',
        content: 'Considere revisar a arquitetura do fluxo',
        type: 'warning'
      });
    }
    
    // Adiciona sugestão de documentação sempre
    suggestions.push({
      title: 'Documentação Oficial',
      content: 'Consulte a documentação do Apache NiFi para mais detalhes',
      type: 'link',
      url: 'https://nifi.apache.org/docs.html'
    });
  }
};

// Exporta configurações para uso global
if (typeof window !== 'undefined') {
  window.NiFiSuperTabsConfig = NiFiSuperTabsConfig;
  window.NiFiDetector = NiFiDetector;
  window.SuggestionEngine = SuggestionEngine;
}