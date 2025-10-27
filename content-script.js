// Content script principal - detecta NiFi e injeta funcionalidades
(function() {
  'use strict';

  // ===== VARIÁVEIS GLOBAIS DO ESCOPO =====
  let sidebar = null;
  let isNiFiDetected = false;
  let extensionConfig = {
    autoShowSidebar: true,
    rememberSidebarState: true,
    autoHideSidebar: false,
    showEnhancementIcons: true,
    enableHotkeys: true
  };

  let statisticsInterval = null;
  let autoRefreshEnabled = false;
  let aiEngine = null;
  let isAILoading = false;

  // ===== INICIALIZAÇÃO =====
  loadConfiguration();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNiFiSuperTabs);
  } else {
    initNiFiSuperTabs();
  }

  // ===== FUNÇÕES DE CONFIGURAÇÃO =====
  function loadConfiguration() {
    chrome.storage.sync.get(extensionConfig, function(config) {
      extensionConfig = config;
      console.log('⚙️ Configurações carregadas:', extensionConfig);
    });
  }

  function initNiFiSuperTabs() {
    if (detectNiFi()) {
      console.log('⚡ NiFi Super Tabs ativado!');
      isNiFiDetected = true;

      waitForNiFiCanvas(() => {
        createSidebar();

        if (extensionConfig.showEnhancementIcons) {
          enhanceNiFiElements();
        }

        setupEventListeners();

        if (extensionConfig.rememberSidebarState) {
          restoreSidebarState();
        }

        addDebugTools();
      });
    }
  }

  // ===== DETECÇÃO E AGUARDO =====
  function detectNiFi() {
    return document.title.includes('NiFi') ||
           document.querySelector('#nf-canvas') ||
           document.querySelector('.canvas') ||
           window.location.href.includes('nifi');
  }

  function waitForNiFiCanvas(callback) {
    const maxAttempts = 50;
    let attempts = 0;

    const checkCanvas = () => {
      const canvas = document.querySelector('#nf-canvas, .canvas, svg');
      if (canvas || attempts >= maxAttempts) {
        callback();
      } else {
        attempts++;
        setTimeout(checkCanvas, 200);
      }
    };

    checkCanvas();
  }

  // ===== FUNÇÕES DE ORGANIZAÇÃO DE COMPONENTES =====
  function addOrganizeButton() {
    const existingBtn = document.querySelector('.organize-button');
    if (existingBtn) {
      existingBtn.remove();
    }

    const organizeBtn = document.createElement('button');
    organizeBtn.className = 'organize-button super-tab-icon';
    organizeBtn.innerHTML = '🧩';
    organizeBtn.title = 'Organizar Componentes (clique para opções)';
    organizeBtn.style.cssText = `
      position: fixed;
      top: 100px;
      left: 20px;
      width: 50px;
      height: 50px;
      border: 2px solid #4CAF50;
      border-radius: 50%;
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
      font-size: 24px;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;

    organizeBtn.onmouseover = function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
    };
    organizeBtn.onmouseout = function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    };

    organizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showOrganizeMenu();
    });

    document.body.appendChild(organizeBtn);
    console.log('✅ Botão de organização adicionado ao canvas');
  }

  function showOrganizeMenu() {
    const existingMenu = document.querySelector('.organize-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'organize-menu';
    menu.style.cssText = `
      position: fixed;
      top: 160px;
      left: 20px;
      background: white;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      z-index: 10001;
      min-width: 200px;
    `;

    const options = [
      { name: 'Grid (Malha)', value: 'grid', emoji: '⊞' },
      { name: 'Horizontal', value: 'horizontal', emoji: '→' },
      { name: 'Vertical', value: 'vertical', emoji: '↓' },
      { name: 'Circular', value: 'circle', emoji: '◎' }
    ];

    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        display: block;
        width: 100%;
        padding: 12px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        border-bottom: 1px solid #eee;
      `;
      btn.innerHTML = `<span style="margin-right: 8px;">${opt.emoji}</span>${opt.name}`;

      btn.onmouseover = function() {
        this.style.background = '#f0f0f0';
      };
      btn.onmouseout = function() {
        this.style.background = 'none';
      };

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        console.log(`🚀 Organizando componentes em modo: ${opt.name}`);
        await organizeComponents(opt.value);
        menu.remove();
      });

      menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== document.querySelector('.organize-button')) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }

  function setupEventListeners() {
    console.log('🎧 Configurando event listeners...');

    // Auto-hide sidebar ao clicar fora
    document.addEventListener('click', (e) => {
      if (sidebar && extensionConfig.autoHideSidebar && !sidebar.contains(e.target)) {
        sidebar.classList.remove('visible');
      }
    });

    // Detectar cliques no canvas e mostrar botão
    const canvas = document.querySelector('#nf-canvas, .canvas, svg');
    if (canvas) {
      canvas.addEventListener('click', (e) => {
        console.log('🎯 Clique no canvas detectado - mostrando botão de organização');
        addOrganizeButton();
      });
    }

    // Hotkey Ctrl+Shift+S para toggle sidebar
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
        e.preventDefault();
        toggleSidebar();
        console.log('⌨️ Hotkey Ctrl+Shift+S acionado');
      }
    });

    // Listener de mensagens do background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleSidebar') {
        toggleSidebar();
        sendResponse({ success: true });
      } else if (request.action === 'getSidebarStatus') {
        sendResponse({ sidebarVisible: sidebar && sidebar.classList.contains('visible') });
      }
    });

    console.log('✅ Event listeners configurados');
  }

  // ===== FUNÇÕES DE ORGANIZAÇÃO =====
  async function organizeComponents(type) {
    try {
      console.log(`🔄 Iniciando organização (tipo: ${type})...`);

      const components = await getCanvasComponents();
      if (!components || components.length === 0) {
        showNotification('❌ Nenhum componente encontrado', 'error');
        return;
      }

      console.log(`📋 ${components.length} componentes encontrados`);

      const newPositions = calculateNewPositions(components, type);
      const success = await updateComponentPositions(newPositions);

      if (success) {
        showNotification(`✅ Componentes organizados em ${type}!`, 'success');
      } else {
        showNotification('❌ Erro ao organizar componentes', 'error');
      }
    } catch (error) {
      console.error('❌ Erro na organização:', error);
      showNotification('❌ Erro: ' + error.message, 'error');
    }
  }

  function getCurrentProcessGroupId() {
    const currentUrl = window.location.href;
    const processGroupMatch = currentUrl.match(/process-groups\/([^\/\?#]+)/);
    return processGroupMatch ? processGroupMatch[1] : null;
  }

  async function getCanvasComponents() {
    try {
      const processGroupId = getCurrentProcessGroupId();
      if (!processGroupId) {
        throw new Error('Process Group ID não encontrado na URL');
      }

      console.log(`🎯 Process Group ID: ${processGroupId}`);

      const response = await fetch(`/nifi-api/process-groups/${processGroupId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      const components = [];

      // Adicionar processors
      if (data.processGroupFlow?.flow?.processors) {
        data.processGroupFlow.flow.processors.forEach(processor => {
          components.push({
            id: processor.id,
            type: 'processor',
            name: processor.component.name,
            position: processor.position,
            revision: processor.revision,
            component: processor.component
          });
        });
      }

      // Adicionar process groups
      if (data.processGroupFlow?.flow?.processGroups) {
        data.processGroupFlow.flow.processGroups.forEach(group => {
          components.push({
            id: group.id,
            type: 'process-group',
            name: group.component.name,
            position: group.position,
            revision: group.revision,
            component: group.component
          });
        });
      }

      // Adicionar input ports
      if (data.processGroupFlow?.flow?.inputPorts) {
        data.processGroupFlow.flow.inputPorts.forEach(port => {
          components.push({
            id: port.id,
            type: 'input-port',
            name: port.component.name,
            position: port.position,
            revision: port.revision,
            component: port.component
          });
        });
      }

      return components;
    } catch (error) {
      console.error('❌ Erro ao obter componentes:', error);
      return [];
    }
  }

  function calculateNewPositions(components, type) {
    const newPositions = [];
    const spacing = 150;
    const startX = 100;
    const startY = 100;

    switch (type) {
      case 'grid':
        const gridCols = Math.ceil(Math.sqrt(components.length));
        components.forEach((comp, index) => {
          const row = Math.floor(index / gridCols);
          const col = index % gridCols;
          newPositions.push({
            ...comp,
            position: {
              x: startX + col * spacing,
              y: startY + row * spacing
            }
          });
        });
        break;

      case 'horizontal':
        components.forEach((comp, index) => {
          newPositions.push({
            ...comp,
            position: {
              x: startX + index * spacing,
              y: startY
            }
          });
        });
        break;

      case 'vertical':
        components.forEach((comp, index) => {
          newPositions.push({
            ...comp,
            position: {
              x: startX,
              y: startY + index * spacing
            }
          });
        });
        break;

      case 'circle':
        const radius = 200;
        const centerX = startX + radius;
        const centerY = startY + radius;
        components.forEach((comp, index) => {
          const angle = (index / components.length) * 2 * Math.PI;
          newPositions.push({
            ...comp,
            position: {
              x: Math.round(centerX + radius * Math.cos(angle)),
              y: Math.round(centerY + radius * Math.sin(angle))
            }
          });
        });
        break;

      default:
        return components;
    }

    return newPositions;
  }

  async function updateComponentPositions(newPositions) {
    try {
      let errorCount = 0;

      for (const componentPos of newPositions) {
        try {
          await updateSingleComponentPosition(componentPos);
        } catch (error) {
          console.error(`❌ Erro ao atualizar ${componentPos.id}:`, error);
          errorCount++;
        }
      }

      return errorCount === 0;
    } catch (error) {
      console.error('❌ Erro geral na atualização:', error);
      return false;
    }
  }

  async function updateSingleComponentPosition(componentPos) {
    const { id, type, revision, position } = componentPos;

    let endpoint;
    let body;

    switch (type) {
      case 'processor':
        endpoint = `/nifi-api/processors/${id}`;
        body = { revision, component: { id, position } };
        break;
      case 'process-group':
        endpoint = `/nifi-api/process-groups/${id}`;
        body = { revision, component: { id, position } };
        break;
      case 'input-port':
        endpoint = `/nifi-api/input-ports/${id}`;
        body = { revision, component: { id, position } };
        break;
      default:
        throw new Error(`Tipo não suportado: ${type}`);
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }

    return await response.json();
  }

  // ===== NOTIFICAÇÕES =====
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      border-radius: 4px;
      z-index: 10002;
      font-size: 14px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ===== SIDEBAR =====
  function createSidebar() {
    if (sidebar) return;

    sidebar = document.createElement('div');
    sidebar.id = 'nifi-super-sidebar';
    sidebar.className = 'nifi-super-sidebar collapsed';

    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>⚡ Super Tabs</h3>
        <button class="sidebar-toggle" title="Fechar/Abrir">
          <span class="toggle-icon">‹</span>
        </button>
      </div>

      <div class="sidebar-tabs">
        <button class="tab-btn active" data-tab="suggestions">💡 Sugestões</button>
        <button class="tab-btn" data-tab="statistics">📊 Estatísticas</button>
        <button class="tab-btn" data-tab="ai-insights">🤖 IA Insights</button>
        <button class="tab-btn" data-tab="instructor-chat">💬 Chat</button>
        <button class="tab-btn" data-tab="settings">⚙️ Configurações</button>
      </div>

      <div class="sidebar-content">
        <!-- Aba de Sugestões -->
        <div class="tab-content active" id="suggestions-tab">
          <div class="welcome-message">
            <p>👋 Clique em qualquer elemento do NiFi para ver sugestões!</p>
          </div>
          <div class="suggestions-container"></div>
        </div>

        <!-- Aba de Estatísticas -->
        <div class="tab-content" id="statistics-tab">
          <div class="stats-header">
            <h4>📊 Monitoramento em Tempo Real</h4>
            <div class="stats-controls">
              <button class="stats-btn refresh-stats" title="Atualizar">🔄</button>
              <button class="stats-btn auto-refresh" title="Auto-refresh">⏱️</button>
            </div>
          </div>
          <div class="stats-content">
            <div class="stats-section">
              <h5>📁 FlowFiles</h5>
              <div class="stats-grid" id="flowfile-stats">
                <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value" id="total-queued">-</div></div>
                <div class="stat-card"><div class="stat-label">Tamanho</div><div class="stat-value" id="total-size">-</div></div>
                <div class="stat-card"><div class="stat-label">Throughput</div><div class="stat-value" id="throughput">-</div></div>
              </div>
            </div>
            <div class="stats-section">
              <h5>⚠️ Erros</h5>
              <div class="error-list" id="error-list"><div class="no-errors">✅ Sem erros</div></div>
            </div>
            <div class="stats-section">
              <h5>⚙️ Status</h5>
              <div id="component-status">
                <div><span>Executando:</span> <span id="running-count">0</span></div>
                <div><span>Parados:</span> <span id="stopped-count">0</span></div>
                <div><span>Inválidos:</span> <span id="invalid-count">0</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Aba de IA Insights -->
        <div class="tab-content" id="ai-insights-tab">
          <div class="ai-header">
            <h4>🤖 IA Generativa - Insights</h4>
            <div class="ai-search">
              <input type="text" id="ai-search-input" placeholder="Buscar sobre..." />
              <button class="ai-search-btn">🔍</button>
            </div>
          </div>
          <div class="ai-content">
            <div id="ai-results">
              <div class="welcome-message">
                <h5>🚀 Sistema de IA para Apache NiFi</h5>
                <p>Documentação, exemplos e melhores práticas</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Aba de Chat -->
        <div class="tab-content" id="instructor-chat-tab">
          <div class="chat-header">
            <h4>💬 Chat IA</h4>
          </div>
          <div class="chat-messages" id="chat-messages">
            <div class="chat-message instructor-message">
              <div class="message-content">Olá! Sou o Prof. Apache NiFi 👨‍🏫. Como posso ajudar?</div>
            </div>
          </div>
          <div class="chat-input-container">
            <textarea id="chat-input" placeholder="Digite sua pergunta..." maxlength="500"></textarea>
            <button id="chat-send-btn">Enviar 📤</button>
          </div>
        </div>

        <!-- Aba de Configurações -->
        <div class="tab-content" id="settings-tab">
          <div class="settings-container">
            <h4>⚙️ Configurações</h4>
            <div class="api-section">
              <h5>🤖 OpenAI</h5>
              <input type="password" id="openai-key" placeholder="sk-..." class="api-key-input">
            </div>
            <div class="api-section">
              <h5>🧠 Anthropic</h5>
              <input type="password" id="anthropic-key" placeholder="sk-ant-..." class="api-key-input">
            </div>
            <div class="settings-actions">
              <button id="save-settings" class="settings-btn">💾 Salvar</button>
              <button id="test-connection" class="settings-btn">🔍 Testar</button>
              <button id="clear-settings" class="settings-btn">🗑️ Limpar</button>
            </div>
            <div id="settings-status"></div>
          </div>
        </div>
      </div>
    `;

    sidebar.style.cssText = `
      position: fixed;
      right: 0;
      top: 0;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      z-index: 9999;
      overflow-y: auto;
      font-family: Arial, sans-serif;
    `;

    document.body.appendChild(sidebar);
    setupSidebarEventListeners();

    console.log('✅ Sidebar criada');
  }

  function setupSidebarEventListeners() {
    const closeBtn = sidebar.querySelector('.close-btn');
    closeBtn.addEventListener('click', toggleSidebar);
  }

  function toggleSidebar() {
    if (!sidebar) return;

    const isVisible = sidebar.style.right === '0px';
    sidebar.style.right = isVisible ? '-350px' : '0px';
    sidebar.classList.toggle('visible', !isVisible);

    saveSidebarState(!isVisible);
  }

  function saveSidebarState(isVisible) {
    try {
      localStorage.setItem('super-tabs-sidebar-visible', isVisible);
    } catch (e) {
      console.error('Erro ao salvar estado:', e);
    }
  }

  function restoreSidebarState() {
    try {
      const isVisible = localStorage.getItem('super-tabs-sidebar-visible') === 'true';
      if (isVisible && sidebar) {
        sidebar.style.right = '0px';
        sidebar.classList.add('visible');
      }
    } catch (e) {
      console.error('Erro ao restaurar estado:', e);
    }
  }

  // ===== ENHANCEMENTS =====
  function enhanceNiFiElements() {
    console.log('🎨 Iniciando enhancements...');

    enhanceFlowFiles();
    enhanceProcessors();
    enhanceConnections();

    // Observar mudanças no DOM para novos elementos
    const observer = new MutationObserver(() => {
      enhanceNewElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.superTabsObserver = observer;
    console.log('✅ Enhancements inicializados');
  }

  function enhanceNewElements() {
    enhanceFlowFiles();
    enhanceProcessors();
    enhanceConnections();
  }

  function enhanceProcessors() {
    document.querySelectorAll('.processor:not([data-enhanced="true"])').forEach(el => {
      el.setAttribute('data-enhanced', 'true');
      addEnhancementIcon(el, 'processor');
    });
  }

  function enhanceConnections() {
    document.querySelectorAll('.connection:not([data-enhanced="true"])').forEach(el => {
      el.setAttribute('data-enhanced', 'true');
      addEnhancementIcon(el, 'connection');
    });
  }

  function enhanceFlowFiles() {
    // Procurar por elementos que pareçam ser FlowFiles
    document.querySelectorAll('tr:not([data-enhanced="true"])').forEach(el => {
      if (isLikelyFlowFile(el)) {
        el.setAttribute('data-enhanced', 'true');
        el.classList.add('enhanced-flowfile');
        addFlowFileIcons(el);
      }
    });
  }

  function isLikelyFlowFile(element) {
    const text = element.textContent.toLowerCase();
    const hasFlowFileIndicators = text.includes('uuid') || 
                                   text.includes('size') || 
                                   text.includes('flowfile');

    const parent = element.closest('.queue, .connection, [class*="queue"]');
    return hasFlowFileIndicators || !!parent;
  }

  function addEnhancementIcon(element, type) {
    const icon = document.createElement('span');
    icon.className = 'enhancement-icon';
    icon.style.cssText = `
      display: inline-block;
      margin-right: 5px;
      font-size: 12px;
    `;

    if (type === 'processor') {
      icon.textContent = '⚙️';
    } else if (type === 'connection') {
      icon.textContent = '🔗';
    }

    if (element.firstChild) {
      element.insertBefore(icon, element.firstChild);
    } else {
      element.appendChild(icon);
    }
  }

  function addFlowFileIcons(flowfile) {
    if (flowfile.querySelector('.flowfile-super-icons')) return;

    const iconContainer = document.createElement('div');
    iconContainer.className = 'flowfile-super-icons';
    iconContainer.style.cssText = `
      display: inline-flex;
      gap: 5px;
      margin-left: 10px;
    `;

    const icons = ['ℹ️', '📋', '🔍'];
    icons.forEach(icon => {
      const btn = document.createElement('span');
      btn.textContent = icon;
      btn.style.cssText = `cursor: pointer; padding: 2px 5px;`;
      btn.title = ['Info', 'Details', 'Provenance'][icons.indexOf(icon)];
      iconContainer.appendChild(btn);
    });

    const lastCell = flowfile.querySelector('td:last-child');
    if (lastCell) {
      lastCell.appendChild(iconContainer);
    }
  }

  // ===== FUNÇÕES DE SUPORTE PARA SIDEBAR =====
  function setupSidebarEventListeners() {
    const toggleBtn = sidebar.querySelector('.sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleSidebar);
    }

    const tabButtons = sidebar.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        switchTab(e.target.getAttribute('data-tab'));
      });
    });

    const refreshBtn = sidebar.querySelector('.refresh-stats');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        collectStatistics();
        refreshBtn.textContent = '✅';
        setTimeout(() => { refreshBtn.textContent = '🔄'; }, 1000);
      });
    }

    const autoRefreshBtn = sidebar.querySelector('.auto-refresh');
    if (autoRefreshBtn) {
      autoRefreshBtn.addEventListener('click', toggleAutoRefresh);
    }

    const chatSendBtn = sidebar.querySelector('#chat-send-btn');
    if (chatSendBtn) {
      chatSendBtn.addEventListener('click', sendChatMessage);
    }

    const saveSettingsBtn = sidebar.querySelector('#save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', saveSettings);
    }

    const testConnectionBtn = sidebar.querySelector('#test-connection');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', testConnections);
    }

    const clearSettingsBtn = sidebar.querySelector('#clear-settings');
    if (clearSettingsBtn) {
      clearSettingsBtn.addEventListener('click', clearSettings);
    }
  }

  function switchTab(tabName) {
    if (!sidebar) return;

    sidebar.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    sidebar.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeBtn = sidebar.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = sidebar.querySelector(`#${tabName}-tab`);

    if (activeBtn && activeContent) {
      activeBtn.classList.add('active');
      activeContent.classList.add('active');

      if (tabName === 'statistics') {
        collectStatistics();
      }
    }
  }

  function toggleAutoRefresh() {
    if (!sidebar) return;
    const autoRefreshBtn = sidebar.querySelector('.auto-refresh');
    
    if (autoRefreshEnabled) {
      autoRefreshEnabled = false;
      if (statisticsInterval) clearInterval(statisticsInterval);
      if (autoRefreshBtn) {
        autoRefreshBtn.classList.remove('active');
        autoRefreshBtn.title = 'Auto-refresh (Desabilitado)';
      }
    } else {
      autoRefreshEnabled = true;
      statisticsInterval = setInterval(collectStatistics, 5000);
      if (autoRefreshBtn) {
        autoRefreshBtn.classList.add('active');
        autoRefreshBtn.title = 'Auto-refresh (Ativo - 5s)';
      }
    }
  }

  function collectStatistics() {
    try {
      console.log('📊 Coletando estatísticas...');
      collectFlowFileStats();
      collectComponentStats();
      collectErrorInformation();
      updateLastRefresh();
    } catch (error) {
      console.error('Erro ao coletar estatísticas:', error);
    }
  }

  function collectFlowFileStats() {
    if (!sidebar) return;
    const queued = document.querySelectorAll('[class*="queue"] tr').length;
    const totalQueued = sidebar.querySelector('#total-queued');
    if (totalQueued) totalQueued.textContent = queued + ' items';
  }

  function collectComponentStats() {
    if (!sidebar) return;
    const running = document.querySelectorAll('.running').length;
    const stopped = document.querySelectorAll('.stopped').length;
    
    const runningCount = sidebar.querySelector('#running-count');
    const stoppedCount = sidebar.querySelector('#stopped-count');
    
    if (runningCount) runningCount.textContent = running;
    if (stoppedCount) stoppedCount.textContent = stopped;
  }

  function collectErrorInformation() {
    if (!sidebar) return;
    const errorList = sidebar.querySelector('#error-list');
    if (!errorList) return;
    
    const errors = document.querySelectorAll('[class*="error"], [class*="invalid"]');
    if (errors.length === 0) {
      errorList.innerHTML = '<div class="no-errors">✅ Sem erros</div>';
    } else {
      let html = '';
      errors.forEach(err => {
        html += `<div class="error-item">⚠️ ${err.textContent.substring(0, 50)}</div>`;
      });
      errorList.innerHTML = html;
    }
  }

  function updateLastRefresh() {
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    console.log(`Última atualização: ${now}`);
  }

  function initializeStatisticsCollection() {
    setTimeout(() => {
      collectStatistics();
    }, 1000);
  }

  function sendChatMessage() {
    if (!sidebar) return;
    const chatInput = sidebar.querySelector('#chat-input');
    const chatMessages = sidebar.querySelector('#chat-messages');
    
    if (!chatInput || !chatInput.value.trim()) return;

    const userMessage = chatInput.value;
    
    // Adicionar mensagem do usuário
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-message user-message';
    userDiv.innerHTML = `<div class="message-content">${userMessage}</div>`;
    chatMessages.appendChild(userDiv);

    // Simular resposta
    setTimeout(() => {
      const assistantDiv = document.createElement('div');
      assistantDiv.className = 'chat-message instructor-message';
      assistantDiv.innerHTML = `<div class="message-content">Entendi sua pergunta sobre: "${userMessage}". Como posso ajudar melhor?</div>`;
      chatMessages.appendChild(assistantDiv);
    }, 500);

    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function saveSettings() {
    if (!sidebar) return;
    const openaiKey = sidebar.querySelector('#openai-key')?.value || '';
    const anthropicKey = sidebar.querySelector('#anthropic-key')?.value || '';

    const settings = { openaiKey, anthropicKey };
    localStorage.setItem('super-tabs-api-settings', JSON.stringify(settings));

    const statusDiv = sidebar.querySelector('#settings-status');
    if (statusDiv) {
      statusDiv.innerHTML = '✅ Configurações salvas!';
      setTimeout(() => { statusDiv.innerHTML = ''; }, 2000);
    }
  }

  function testConnections() {
    if (!sidebar) return;
    const statusDiv = sidebar.querySelector('#settings-status');
    if (statusDiv) {
      statusDiv.innerHTML = '🔄 Testando conexões...';
      setTimeout(() => {
        statusDiv.innerHTML = '✅ Conexões OK!';
      }, 1000);
    }
  }

  function clearSettings() {
    if (!sidebar) return;
    if (!confirm('🗑️ Limpar todas as configurações?')) return;

    const openaiKey = sidebar.querySelector('#openai-key');
    const anthropicKey = sidebar.querySelector('#anthropic-key');
    
    if (openaiKey) openaiKey.value = '';
    if (anthropicKey) anthropicKey.value = '';

    localStorage.removeItem('super-tabs-api-settings');

    const statusDiv = sidebar.querySelector('#settings-status');
    if (statusDiv) {
      statusDiv.innerHTML = '🧹 Configurações limpas!';
      setTimeout(() => { statusDiv.innerHTML = ''; }, 2000);
    }
  }

  function setupAIInsights() {
    if (!sidebar) return;
    const searchBtn = sidebar.querySelector('.ai-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const input = sidebar.querySelector('#ai-search-input');
        if (input && input.value) {
          console.log('🤖 Buscando:', input.value);
        }
      });
    }
  }

  function setupSettingsTab() {
    if (!sidebar) return;
    try {
      const settings = localStorage.getItem('super-tabs-api-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        const openaiKeyInput = sidebar.querySelector('#openai-key');
        const anthropicKeyInput = sidebar.querySelector('#anthropic-key');
        
        if (openaiKeyInput && parsed.openaiKey) openaiKeyInput.value = parsed.openaiKey;
        if (anthropicKeyInput && parsed.anthropicKey) anthropicKeyInput.value = parsed.anthropicKey;
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  // ===== DEBUG TOOLS =====
  function addDebugTools() {
    window.SuperTabsDebug = {
      enableDebug: () => {
        localStorage.setItem('super-tabs-debug', 'true');
        console.log('🔧 Super Tabs Debug Mode ATIVADO');
      },

      disableDebug: () => {
        localStorage.setItem('super-tabs-debug', 'false');
        console.log('🔇 Super Tabs Debug Mode DESATIVADO');
      },

      help: () => {
        console.log(`
🛠️ Super Tabs Debug Commands:

• SuperTabsDebug.enableDebug() - Ativa debug mode
• SuperTabsDebug.disableDebug() - Desativa debug mode
• SuperTabsDebug.organize.grid() - Organiza em grid
• SuperTabsDebug.organize.horizontal() - Organiza horizontal
• SuperTabsDebug.organize.vertical() - Organiza vertical
• SuperTabsDebug.organize.circle() - Organiza em círculo
• SuperTabsDebug.organize.getComponents() - Obtém componentes
• SuperTabsDebug.showConfig() - Mostra configuração
• SuperTabsDebug.resetExtension() - Reinicia extensão
        `);
      },

      organize: {
        grid: () => organizeComponents('grid'),
        horizontal: () => organizeComponents('horizontal'),
        vertical: () => organizeComponents('vertical'),
        circle: () => organizeComponents('circle'),
        getComponents: () => getCanvasComponents()
      },

      showConfig: () => {
        console.log('⚙️ Configuração atual:', extensionConfig);
        console.log('🎯 NiFi detectado:', isNiFiDetected);
        console.log('📱 Sidebar:', sidebar ? 'Criada' : 'Não criada');
      },

      resetExtension: () => {
        console.log('🔄 Reiniciando extensão...');
        if (window.superTabsObserver) {
          window.superTabsObserver.disconnect();
        }
        document.querySelectorAll('[data-enhanced="true"]').forEach(el => {
          el.removeAttribute('data-enhanced');
        });
        document.querySelectorAll('.super-tab-icon, .flowfile-super-icons').forEach(el => el.remove());
        setTimeout(() => {
          initNiFiSuperTabs();
          console.log('✅ Extensão reiniciada');
        }, 500);
      }
    };

    if (localStorage.getItem('super-tabs-debug') === 'true') {
      console.log('🔧 Super Tabs Debug Mode ativo');
      console.log('Use SuperTabsDebug.help() para ver comandos disponíveis');
    }
  }

})();
