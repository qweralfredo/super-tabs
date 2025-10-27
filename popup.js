// Script do popup - NiFi Super Tabs
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggle-sidebar');
  const optionsBtn = document.getElementById('open-options');
  const sidebarStatus = document.getElementById('sidebar-status');
  const configSection = document.getElementById('config-section');
  const closeConfigBtn = document.getElementById('close-config');
  const saveConfigBtn = document.getElementById('save-config');
  const resetConfigBtn = document.getElementById('reset-config');
  const headerIndicator = document.getElementById('header-indicator');
  
  // Função auxiliar para verificar disponibilidade de chrome
  function hasChrome() {
    return typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query;
  }
  
  // Verifica status da página NiFi
  function checkNiFiPage() {
    if (!hasChrome()) {
      headerIndicator.textContent = '✗';
      headerIndicator.style.color = '#FF6B6B';
      return;
    }
    
    try {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs || tabs.length === 0) return;
        
        const currentTab = tabs[0];
        const isNiFiPage = currentTab.url && (
          currentTab.url.includes('nifi') || 
          currentTab.title.includes('NiFi')
        );
        
        if (isNiFiPage) {
          headerIndicator.textContent = '✓';
          headerIndicator.style.color = '#81C784';
        } else {
          headerIndicator.textContent = '✗';
          headerIndicator.style.color = '#FF6B6B';
        }
      });
    } catch (e) {
      console.error('Erro ao verificar NiFi:', e);
    }
  }
  
  // Toggle da sidebar
  toggleBtn.addEventListener('click', function() {
    if (!hasChrome()) {
      alert('Em um extension real, isso alternaria a sidebar');
      return;
    }
    
    try {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs || tabs.length === 0) return;
        chrome.tabs.sendMessage(tabs[0].id, {action: 'toggleSidebar'}, function(response) {
          if (chrome.runtime.lastError) {
            console.log('Content script não está disponível');
            return;
          }
          
          if (response && response.success) {
            sidebarStatus.textContent = response.visible ? '⚡ Fechar Painel' : '⚡ Abrir Painel Lateral';
          }
        });
      });
    } catch (e) {
      console.error('Erro ao fazer toggle:', e);
    }
  });
  
  // Abrir/fechar configurações
  optionsBtn.addEventListener('click', function() {
    configSection.style.display = configSection.style.display === 'none' ? 'block' : 'none';
  });
  
  closeConfigBtn.addEventListener('click', function() {
    configSection.style.display = 'none';
  });
  
  // Salvar configurações
  saveConfigBtn.addEventListener('click', function() {
    const config = {
      userName: document.getElementById('user-name').value,
      proLicense: document.getElementById('pro-license').value
    };
    
    if (hasChrome() && chrome.storage) {
      chrome.storage.sync.set({nifiSuperTabsConfig: config}, function() {
        alert('✓ Configurações salvas com sucesso!');
      });
    } else {
      localStorage.setItem('nifiSuperTabsConfig', JSON.stringify(config));
      alert('✓ Configurações salvas localmente!');
    }
  });
  
  // Restaurar padrões
  resetConfigBtn.addEventListener('click', function() {
    if (confirm('Tem certeza que deseja restaurar os padrões?')) {
      document.getElementById('user-name').value = '';
      document.getElementById('pro-license').value = '';
      
      if (hasChrome() && chrome.storage) {
        chrome.storage.sync.remove('nifiSuperTabsConfig', function() {
          alert('✓ Padrões restaurados!');
        });
      } else {
        localStorage.removeItem('nifiSuperTabsConfig');
        alert('✓ Padrões restaurados!');
      }
    }
  });
  
  // Carregar configurações
  function loadConfig() {
    if (hasChrome() && chrome.storage) {
      chrome.storage.sync.get('nifiSuperTabsConfig', function(result) {
        if (result && result.nifiSuperTabsConfig) {
          const config = result.nifiSuperTabsConfig;
          document.getElementById('user-name').value = config.userName || '';
          document.getElementById('pro-license').value = config.proLicense || '';
        }
      });
    } else {
      const savedConfig = localStorage.getItem('nifiSuperTabsConfig');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          document.getElementById('user-name').value = config.userName || '';
          document.getElementById('pro-license').value = config.proLicense || '';
        } catch (e) {
          console.error('Erro ao carregar config:', e);
        }
      }
    }
  }
  
  // Inicializar
  loadConfig();
  checkNiFiPage();
  
  // Verificar status da página a cada 2 segundos
  setInterval(checkNiFiPage, 2000);
});