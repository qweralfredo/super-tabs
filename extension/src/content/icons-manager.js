/**
 * SuperTabs Icons Manager
 * Gerencia todos os ícones SVG do SuperTabs
 */

class SuperTabsIcons {
  constructor() {
    this.iconsLoaded = false;
    this.iconCache = new Map();
    this.loadIcons();
  }

  /**
   * Carrega todos os ícones SVG
   */
  async loadIcons() {
    try {
      // Carrega o arquivo SVG com todos os ícones
      const response = await fetch(chrome.runtime.getURL('icons/supertabs-icons.svg'));
      const svgText = await response.text();
      
      // Cria um elemento temporário para parsear o SVG
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = svgText;
      
      // Extrai cada ícone individual
      const svgElements = tempDiv.querySelectorAll('svg[id^="icon-"]');
      svgElements.forEach(svg => {
        const iconId = svg.id.replace('icon-', '');
        this.iconCache.set(iconId, svg.outerHTML);
      });
      
      this.iconsLoaded = true;
      console.log(`[SuperTabs Icons] Loaded ${this.iconCache.size} icons`);
    } catch (error) {
      console.error('[SuperTabs Icons] Failed to load icons:', error);
    }
  }

  /**
   * Obtém um ícone SVG por nome
   * @param {string} iconName - Nome do ícone (sem o prefixo 'icon-')
   * @param {Object} options - Opções de personalização
   * @returns {string} HTML do ícone SVG
   */
  getIcon(iconName, options = {}) {
    if (!this.iconsLoaded) {
      console.warn('[SuperTabs Icons] Icons not loaded yet');
      return this.getFallbackIcon(iconName);
    }

    const iconHtml = this.iconCache.get(iconName);
    if (!iconHtml) {
      console.warn(`[SuperTabs Icons] Icon '${iconName}' not found`);
      return this.getFallbackIcon(iconName);
    }

    return this.customizeIcon(iconHtml, options);
  }

  /**
   * Customiza um ícone SVG com opções
   * @param {string} iconHtml - HTML do ícone SVG
   * @param {Object} options - Opções de personalização
   * @returns {string} HTML customizado
   */
  customizeIcon(iconHtml, options = {}) {
    const {
      size = '24',
      color = 'currentColor',
      className = '',
      title = '',
      style = ''
    } = options;

    let customizedHtml = iconHtml;

    // Atualiza o tamanho
    if (size !== '24') {
      customizedHtml = customizedHtml.replace(
        /width="[^"]*"|height="[^"]*"/g, 
        `width="${size}" height="${size}"`
      );
    }

    // Adiciona classe CSS
    if (className) {
      customizedHtml = customizedHtml.replace(
        /<svg([^>]*)>/,
        `<svg$1 class="${className}">`
      );
    }

    // Adiciona título para acessibilidade
    if (title) {
      customizedHtml = customizedHtml.replace(
        /<svg([^>]*)>/,
        `<svg$1><title>${title}</title>`
      );
    }

    // Adiciona estilos inline
    if (style) {
      customizedHtml = customizedHtml.replace(
        /<svg([^>]*)>/,
        `<svg$1 style="${style}">`
      );
    }

    // Atualiza cor se especificada e não for 'currentColor'
    if (color !== 'currentColor') {
      customizedHtml = customizedHtml.replace(
        /fill="currentColor"/g,
        `fill="${color}"`
      ).replace(
        /stroke="currentColor"/g,
        `stroke="${color}"`
      );
    }

    return customizedHtml;
  }

  /**
   * Cria um ícone de fallback para casos onde o ícone não existe
   * @param {string} iconName - Nome do ícone
   * @returns {string} HTML do ícone de fallback
   */
  getFallbackIcon(iconName) {
    const fallbackIcons = {
      // Ícones básicos
      'default': '●',
      'processor': '⚙️',
      'input-port': '◀',
      'output-port': '▶',
      'funnel': '▽',
      'label': '🏷️',
      'process-group': '📁',
      
      // Ações
      'settings': '⚙️',
      'close': '✕',
      'minimize': '−',
      'maximize': '□',
      'resize': '↗',
      'refresh': '↻',
      'reset': '⟲',
      'copy': '📋',
      'generate': '✨',
      'validate': '✓',
      'apply': '▶',
      'preview': '👁',
      'history': '🕐',
      
      // Alinhamento
      'align-horizontal': '⟷',
      'align-vertical': '↕',
      'align-grid': '⊞',
      'align-flow': '→',
      'align-circular': '○',
      'align-hierarchical': '🌳',
      'spacing': '↔',
      
      // Estados
      'success': '✓',
      'warning': '⚠',
      'error': '✕',
      'loading': '⟳',
      'info': 'ℹ',
      
      // Expression Language
      'expression-language': 'fx',
      
      // Chat
      'chat': '💬',
      'send': '📤',
      'ai': '🤖'
    };

    const fallbackChar = fallbackIcons[iconName] || fallbackIcons['default'];
    
    return `<span class="supertabs-icon-fallback" style="font-size: inherit; line-height: 1;">${fallbackChar}</span>`;
  }

  /**
   * Cria um elemento DOM com o ícone
   * @param {string} iconName - Nome do ícone
   * @param {Object} options - Opções de personalização
   * @returns {HTMLElement} Elemento DOM com o ícone
   */
  createIconElement(iconName, options = {}) {
    const wrapper = document.createElement('span');
    wrapper.className = 'supertabs-icon';
    wrapper.innerHTML = this.getIcon(iconName, options);
    return wrapper;
  }

  /**
   * Verifica se um ícone existe
   * @param {string} iconName - Nome do ícone
   * @returns {boolean} True se o ícone existe
   */
  hasIcon(iconName) {
    return this.iconCache.has(iconName);
  }

  /**
   * Lista todos os ícones disponíveis
   * @returns {Array<string>} Array com nomes dos ícones
   */
  listIcons() {
    return Array.from(this.iconCache.keys()).sort();
  }

  /**
   * Agrupa ícones por categoria
   * @returns {Object} Objeto com ícones agrupados por categoria
   */
  getIconsByCategory() {
    const categories = {
      alignment: [
        'align-horizontal', 'align-vertical', 'align-grid', 
        'align-flow', 'align-circular', 'align-hierarchical', 'spacing'
      ],
      actions: [
        'settings', 'close', 'minimize', 'maximize', 'resize',
        'refresh', 'reset', 'copy', 'generate', 'validate', 
        'apply', 'preview', 'history'
      ],
      components: [
        'processor', 'input-port', 'output-port', 'funnel', 
        'label', 'process-group'
      ],
      states: [
        'success', 'warning', 'error', 'loading', 'info'
      ],
      tools: [
        'expression-language', 'chat', 'send', 'ai'
      ]
    };

    const result = {};
    for (const [category, icons] of Object.entries(categories)) {
      result[category] = icons.filter(icon => this.hasIcon(icon));
    }

    // Adiciona ícones não categorizados
    const allCategorized = Object.values(categories).flat();
    const uncategorized = this.listIcons().filter(icon => !allCategorized.includes(icon));
    if (uncategorized.length > 0) {
      result.other = uncategorized;
    }

    return result;
  }

  /**
   * Gera CSS para todos os ícones
   * @returns {string} CSS para ícones
   */
  generateIconCSS() {
    return `
      .supertabs-icon {
        display: inline-block;
        vertical-align: middle;
        line-height: 1;
      }
      
      .supertabs-icon svg {
        width: 1em;
        height: 1em;
        fill: currentColor;
        vertical-align: middle;
      }
      
      .supertabs-icon-fallback {
        display: inline-block;
        vertical-align: middle;
        text-align: center;
      }
      
      /* Tamanhos pré-definidos */
      .supertabs-icon-xs { font-size: 12px; }
      .supertabs-icon-sm { font-size: 16px; }
      .supertabs-icon-md { font-size: 20px; }
      .supertabs-icon-lg { font-size: 24px; }
      .supertabs-icon-xl { font-size: 32px; }
      
      /* Cores específicas do NiFi */
      .supertabs-icon-primary { color: var(--nifi-primary-blue); }
      .supertabs-icon-secondary { color: var(--nifi-secondary-blue); }
      .supertabs-icon-success { color: var(--nifi-success-green); }
      .supertabs-icon-warning { color: var(--nifi-warning-orange); }
      .supertabs-icon-error { color: var(--nifi-error-red); }
      .supertabs-icon-muted { color: var(--nifi-gray-medium); }
    `;
  }

  /**
   * Injetar CSS dos ícones no documento
   */
  injectIconCSS() {
    const styleId = 'supertabs-icons-css';
    
    // Remove estilo existente se houver
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // Cria novo estilo
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = this.generateIconCSS();
    document.head.appendChild(style);
  }
}

// Instância global do gerenciador de ícones
window.SuperTabsIcons = new SuperTabsIcons();

// Utility functions para uso fácil
window.getIcon = (iconName, options) => window.SuperTabsIcons.getIcon(iconName, options);
window.createIcon = (iconName, options) => window.SuperTabsIcons.createIconElement(iconName, options);

// Injetar CSS quando os ícones carregarem
window.SuperTabsIcons.loadIcons().then(() => {
  window.SuperTabsIcons.injectIconCSS();
});

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SuperTabsIcons;
}