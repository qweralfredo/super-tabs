// Script do popup da extensão
document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const refreshBtn = document.getElementById('refresh-page');
  const optionsBtn = document.getElementById('open-options');
  const sidebarStatus = document.getElementById('sidebar-status');
  
  // Elementos de configuração
  const configSection = document.getElementById('config-section');
  const closeConfigBtn = document.getElementById('close-config');
  const saveConfigBtn = document.getElementById('save-config');
  const resetConfigBtn = document.getElementById('reset-config');
  
  // Checkboxes de configuração
  const autoShowSidebar = document.getElementById('auto-show-sidebar');
  const rememberSidebarState = document.getElementById('remember-sidebar-state');
  const autoHideSidebar = document.getElementById('auto-hide-sidebar');
  const showEnhancementIcons = document.getElementById('show-enhancement-icons');
  const enableHotkeys = document.getElementById('enable-hotkeys');
  
  // Configurações padrão
  const defaultConfig = {
    autoShowSidebar: true,
    rememberSidebarState: true,
    autoHideSidebar: false,
    showEnhancementIcons: true,
    enableHotkeys: true
  };
  
  // Carrega configurações salvas
  loadConfig();
  
  // Verifica se a aba atual é do NiFi
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const isNiFi = checkIfNiFiTab(currentTab.url);
    
    updateStatus(isNiFi);
    
    // Verifica se o sidebar está ativo
    if (isNiFi) {
      chrome.tabs.sendMessage(currentTab.id, { action: 'getSidebarStatus' }, function(response) {
        if (chrome.runtime.lastError) {
          // Content script não carregado ainda
          statusText.textContent = 'Recarregue a página para ativar';
          return;
        }
        
        if (response && response.sidebarVisible !== undefined) {
          updateSidebarButton(response.sidebarVisible);
        }
      });
    }
  });
  
  // Event listeners principais
  toggleBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSidebar' }, function(response) {
        if (response && response.sidebarVisible !== undefined) {
          updateSidebarButton(response.sidebarVisible);
        }
      });
    });
  });
  
  refreshBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
      window.close();
    });
  });
  
  optionsBtn.addEventListener('click', function() {
    showConfigSection();
  });
  
  // Event listeners de configuração
  closeConfigBtn.addEventListener('click', function() {
    hideConfigSection();
  });
  
  saveConfigBtn.addEventListener('click', function() {
    saveConfig();
  });
  
  resetConfigBtn.addEventListener('click', function() {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      resetConfig();
    }
  });
  
  // Event listeners para os checkboxes
  autoShowSidebar.addEventListener('change', function() {
    // Se auto-show estiver desabilitado, também desabilita auto-hide
    if (!this.checked) {
      autoHideSidebar.checked = false;
      autoHideSidebar.disabled = true;
    } else {
      autoHideSidebar.disabled = false;
    }
  });
  
  function showConfigSection() {
    configSection.style.display = 'block';
  }
  
  function hideConfigSection() {
    configSection.style.display = 'none';
  }
  
  function loadConfig() {
    chrome.storage.sync.get(defaultConfig, function(config) {
      autoShowSidebar.checked = config.autoShowSidebar;
      rememberSidebarState.checked = config.rememberSidebarState;
      autoHideSidebar.checked = config.autoHideSidebar;
      showEnhancementIcons.checked = config.showEnhancementIcons;
      enableHotkeys.checked = config.enableHotkeys;
      
      // Atualiza estado do auto-hide baseado no auto-show
      autoHideSidebar.disabled = !config.autoShowSidebar;
    });
  }
  
  function saveConfig() {
    const config = {
      autoShowSidebar: autoShowSidebar.checked,
      rememberSidebarState: rememberSidebarState.checked,
      autoHideSidebar: autoHideSidebar.checked,
      showEnhancementIcons: showEnhancementIcons.checked,
      enableHotkeys: enableHotkeys.checked
    };
    
    chrome.storage.sync.set(config, function() {
      // Notifica o content script sobre as mudanças
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateConfig', 
          config: config 
        });
      });
      
      // Feedback visual
      const originalText = saveConfigBtn.textContent;
      saveConfigBtn.textContent = '✅ Salvo!';
      saveConfigBtn.style.background = 'rgba(76, 175, 80, 0.4)';
      
      setTimeout(() => {
        saveConfigBtn.textContent = originalText;
        saveConfigBtn.style.background = '';
        hideConfigSection();
      }, 1500);
    });
  }
  
  function resetConfig() {
    chrome.storage.sync.set(defaultConfig, function() {
      loadConfig();
      
      // Notifica o content script
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateConfig', 
          config: defaultConfig 
        });
      });
      
      // Feedback visual
      const originalText = resetConfigBtn.textContent;
      resetConfigBtn.textContent = '✅ Restaurado!';
      resetConfigBtn.style.background = 'rgba(255, 152, 0, 0.4)';
      
      setTimeout(() => {
        resetConfigBtn.textContent = originalText;
        resetConfigBtn.style.background = '';
      }, 1500);
    });
  }
  
  function checkIfNiFiTab(url) {
    if (!url) return false;
    return url.includes('nifi') || 
           url.includes('localhost') || 
           url.includes('127.0.0.1') ||
           url.includes('8080') || // Porta padrão do NiFi
           url.includes('8443');   // Porta HTTPS padrão do NiFi
  }
  
  function updateStatus(isNiFi) {
    if (isNiFi) {
      statusDiv.className = 'status active';
      statusText.textContent = '✅ NiFi detectado - Extensão ativa';
      toggleBtn.disabled = false;
    } else {
      statusDiv.className = 'status inactive';
      statusText.textContent = '❌ Acesse uma página do NiFi';
      toggleBtn.disabled = true;
    }
  }
  
  function updateSidebarButton(isVisible) {
    if (isVisible) {
      sidebarStatus.textContent = '⚡ Fechar Painel Lateral';
    } else {
      sidebarStatus.textContent = '⚡ Abrir Painel Lateral';
    }
  }
});