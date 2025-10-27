// Sistema de Internacionalização - NiFi Super Tabs
(function() {
  'use strict';
  
  // Translations
  const translations = {
    'pt-BR': {
      // Header
      'extension_name': 'NiFi Super Tabs',
      'extension_subtitle': 'Turbine seu Apache NiFi',
      'extension_description': 'Aba lateral inteligente e ícones nos FlowFiles',
      
      // Status
      'status_active': '✅ NiFi detectado - Extensão ativa',
      'status_inactive': '❌ Acesse uma página do NiFi',
      'status_loading': 'Recarregue a página para ativar',
      
      // Buttons
      'btn_open_sidebar': '⚡ Abrir Painel Lateral',
      'btn_close_sidebar': '⚡ Fechar Painel Lateral',
      'btn_refresh': '↻ Recarregar Página',
      'btn_settings': '⚙️ Configurações',
      'btn_save': '💾 Salvar Configurações',
      'btn_reset': '🔄 Restaurar Padrões',
      'btn_close': '✕',
      'btn_copy_id': '📋 Copiar ID',
      'btn_refresh_data': '🔄 Atualizar Dados',
      'btn_play_audio': '🔊 Reproduzir Áudio',
      'btn_stop_audio': '⏹️ Parar Áudio',
      
      // Configuration
      'config_title': '⚙️ Configurações',
      'config_sidebar_section': '📱 Exibição da Sidebar',
      'config_features_section': '🎯 Funcionalidades',
      'config_audio_section': '🔊 Áudio e Narração',
      'config_language_section': '🌐 Idioma',
      
      // Sidebar Options
      'config_auto_show': 'Mostrar automaticamente',
      'config_auto_show_desc': 'Abre a sidebar automaticamente ao clicar em componentes',
      'config_remember_state': 'Lembrar estado',
      'config_remember_state_desc': 'Mantém a sidebar aberta/fechada entre sessões',
      'config_auto_hide': 'Fechar automaticamente',
      'config_auto_hide_desc': 'Fecha a sidebar ao clicar fora dela',
      
      // Features
      'config_show_icons': 'Ícones de enhancement',
      'config_show_icons_desc': 'Mostra ícones nos componentes do NiFi',
      'config_enable_hotkeys': 'Atalhos de teclado',
      'config_enable_hotkeys_desc': 'Habilita Ctrl+Shift+S para toggle da sidebar',
      
      // Audio Features
      'config_enable_audio': 'Narração por voz',
      'config_enable_audio_desc': 'Lê informações dos componentes em voz alta',
      'config_auto_read': 'Leitura automática',
      'config_auto_read_desc': 'Lê automaticamente ao selecionar componentes',
      'config_audio_speed': 'Velocidade da fala',
      'config_audio_speed_desc': 'Controla a velocidade da narração',
      'config_audio_voice': 'Voz do sistema',
      'config_audio_voice_desc': 'Seleciona a voz para narração',
      
      // Language
      'config_language': 'Idioma da interface',
      'config_language_desc': 'Seleciona o idioma da extensão',
      'language_pt': 'Português (Brasil)',
      'language_en': 'English (US)',
      
      // Sidebar Content
      'sidebar_welcome': '👋 Clique em qualquer elemento do NiFi para ver sugestões!',
      'sidebar_loading': 'Carregando informações...',
      'sidebar_component_info': '📋 Informações Básicas',
      'sidebar_statistics': '📊 Estatísticas de Execução',
      'sidebar_suggestions': '💡 Sugestões e Dicas',
      
      // Component Info
      'component_id': 'ID',
      'component_type': 'Tipo',
      'component_version': 'Versão',
      'component_status': 'Status',
      'component_name': 'Nome',
      
      // Features List
      'feature_sidebar': 'Painel lateral inteligente',
      'feature_suggestions': 'Sugestões contextuais',
      'feature_icons': 'Ícones nos FlowFiles',
      'feature_provenance': 'Análise de proveniência',
      'feature_hotkeys': 'Hotkeys (Ctrl+Shift+S)',
      'feature_audio': 'Narração por voz',
      
      // Audio Messages
      'audio_component_selected': 'Componente selecionado:',
      'audio_processor_type': 'Processador tipo',
      'audio_connection_type': 'Conexão tipo',
      'audio_flowfile_type': 'FlowFile tipo',
      'audio_status_running': 'Status: Em execução',
      'audio_status_stopped': 'Status: Parado',
      'audio_status_invalid': 'Status: Inválido',
      'audio_reading_stats': 'Lendo estatísticas de execução',
      
      // Suggestions
      'suggestion_best_practice': 'Melhores Práticas',
      'suggestion_documentation': 'Documentação',
      'suggestion_troubleshooting': 'Resolução de Problemas',
      'suggestion_performance': 'Performance',
      'suggestion_monitoring': 'Monitoramento',
      
      // Messages
      'saved_successfully': '✅ Salvo!',
      'reset_successfully': '✅ Restaurado!',
      'confirm_reset': 'Tem certeza que deseja restaurar as configurações padrão?',
      'audio_not_supported': 'Síntese de fala não suportada neste navegador',
      'copying_id': 'ID copiado para a área de transferência'
    },
    
    'en-US': {
      // Header
      'extension_name': 'NiFi Super Tabs',
      'extension_subtitle': 'Supercharge your Apache NiFi',
      'extension_description': 'Smart sidebar and FlowFile icons',
      
      // Status
      'status_active': '✅ NiFi detected - Extension active',
      'status_inactive': '❌ Navigate to a NiFi page',
      'status_loading': 'Reload page to activate',
      
      // Buttons
      'btn_open_sidebar': '⚡ Open Side Panel',
      'btn_close_sidebar': '⚡ Close Side Panel',
      'btn_refresh': '↻ Reload Page',
      'btn_settings': '⚙️ Settings',
      'btn_save': '💾 Save Settings',
      'btn_reset': '🔄 Reset Defaults',
      'btn_close': '✕',
      'btn_copy_id': '📋 Copy ID',
      'btn_refresh_data': '🔄 Refresh Data',
      'btn_play_audio': '🔊 Play Audio',
      'btn_stop_audio': '⏹️ Stop Audio',
      
      // Configuration
      'config_title': '⚙️ Settings',
      'config_sidebar_section': '📱 Sidebar Display',
      'config_features_section': '🎯 Features',
      'config_audio_section': '🔊 Audio & Narration',
      'config_language_section': '🌐 Language',
      
      // Sidebar Options
      'config_auto_show': 'Show automatically',
      'config_auto_show_desc': 'Opens sidebar automatically when clicking components',
      'config_remember_state': 'Remember state',
      'config_remember_state_desc': 'Keeps sidebar open/closed between sessions',
      'config_auto_hide': 'Auto-hide',
      'config_auto_hide_desc': 'Closes sidebar when clicking outside',
      
      // Features
      'config_show_icons': 'Enhancement icons',
      'config_show_icons_desc': 'Shows icons on NiFi components',
      'config_enable_hotkeys': 'Keyboard shortcuts',
      'config_enable_hotkeys_desc': 'Enables Ctrl+Shift+S to toggle sidebar',
      
      // Audio Features
      'config_enable_audio': 'Voice narration',
      'config_enable_audio_desc': 'Reads component information aloud',
      'config_auto_read': 'Auto-read',
      'config_auto_read_desc': 'Automatically reads when selecting components',
      'config_audio_speed': 'Speech speed',
      'config_audio_speed_desc': 'Controls narration speed',
      'config_audio_voice': 'System voice',
      'config_audio_voice_desc': 'Selects voice for narration',
      
      // Language
      'config_language': 'Interface language',
      'config_language_desc': 'Selects extension language',
      'language_pt': 'Português (Brasil)',
      'language_en': 'English (US)',
      
      // Sidebar Content
      'sidebar_welcome': '👋 Click any NiFi element to see suggestions!',
      'sidebar_loading': 'Loading information...',
      'sidebar_component_info': '📋 Basic Information',
      'sidebar_statistics': '📊 Execution Statistics',
      'sidebar_suggestions': '💡 Tips & Suggestions',
      
      // Component Info
      'component_id': 'ID',
      'component_type': 'Type',
      'component_version': 'Version',
      'component_status': 'Status',
      'component_name': 'Name',
      
      // Features List
      'feature_sidebar': 'Smart side panel',
      'feature_suggestions': 'Contextual suggestions',
      'feature_icons': 'FlowFile icons',
      'feature_provenance': 'Provenance analysis',
      'feature_hotkeys': 'Hotkeys (Ctrl+Shift+S)',
      'feature_audio': 'Voice narration',
      
      // Audio Messages
      'audio_component_selected': 'Component selected:',
      'audio_processor_type': 'Processor type',
      'audio_connection_type': 'Connection type',
      'audio_flowfile_type': 'FlowFile type',
      'audio_status_running': 'Status: Running',
      'audio_status_stopped': 'Status: Stopped',
      'audio_status_invalid': 'Status: Invalid',
      'audio_reading_stats': 'Reading execution statistics',
      
      // Suggestions
      'suggestion_best_practice': 'Best Practices',
      'suggestion_documentation': 'Documentation',
      'suggestion_troubleshooting': 'Troubleshooting',
      'suggestion_performance': 'Performance',
      'suggestion_monitoring': 'Monitoring',
      
      // Messages
      'saved_successfully': '✅ Saved!',
      'reset_successfully': '✅ Reset!',
      'confirm_reset': 'Are you sure you want to reset to default settings?',
      'audio_not_supported': 'Speech synthesis not supported in this browser',
      'copying_id': 'ID copied to clipboard'
    }
  };
  
  // Current language
  let currentLanguage = 'pt-BR';
  
  // Audio system
  const audioSystem = {
    synthesis: null,
    currentUtterance: null,
    isSupported: false,
    voices: [],
    currentVoice: null,
    settings: {
      enabled: false,
      autoRead: false,
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8
    }
  };
  
  // Initialize
  function initI18n() {
    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      audioSystem.synthesis = window.speechSynthesis;
      audioSystem.isSupported = true;
      loadVoices();
    }
    
    // Load language from storage
    chrome.storage.sync.get(['language'], function(result) {
      if (result.language) {
        currentLanguage = result.language;
      } else {
        // Auto-detect browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('pt')) {
          currentLanguage = 'pt-BR';
        } else {
          currentLanguage = 'en-US';
        }
      }
      
      // Apply translations
      applyTranslations();
    });
    
    // Load audio settings
    chrome.storage.sync.get(['audioSettings'], function(result) {
      if (result.audioSettings) {
        audioSystem.settings = { ...audioSystem.settings, ...result.audioSettings };
      }
    });
  }
  
  // Load available voices
  function loadVoices() {
    const voices = audioSystem.synthesis.getVoices();
    audioSystem.voices = voices;
    
    // Find best voice for current language
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(currentLanguage.split('-')[0])
    );
    
    if (preferredVoice) {
      audioSystem.currentVoice = preferredVoice;
    }
  }
  
  // Get translation
  function t(key, fallback = null) {
    const translation = translations[currentLanguage] && translations[currentLanguage][key];
    return translation || fallback || key;
  }
  
  // Apply translations to DOM
  function applyTranslations() {
    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = t(key);
      
      if (element.tagName === 'INPUT' && element.type === 'text') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // Update title attributes
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = t(key);
    });
  }
  
  // Change language
  function setLanguage(lang) {
    currentLanguage = lang;
    chrome.storage.sync.set({ language: lang });
    applyTranslations();
    loadVoices(); // Reload voices for new language
  }
  
  // Text-to-Speech functions
  function speak(text, options = {}) {
    if (!audioSystem.isSupported || !audioSystem.settings.enabled) {
      return false;
    }
    
    // Stop current speech
    stopSpeech();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply settings
    utterance.rate = options.rate || audioSystem.settings.rate;
    utterance.pitch = options.pitch || audioSystem.settings.pitch;
    utterance.volume = options.volume || audioSystem.settings.volume;
    
    // Set voice
    if (audioSystem.currentVoice) {
      utterance.voice = audioSystem.currentVoice;
    }
    
    // Set language
    utterance.lang = currentLanguage;
    
    // Event listeners
    utterance.onstart = () => {
      console.log('🔊 Audio started:', text);
    };
    
    utterance.onend = () => {
      console.log('🔊 Audio ended');
      audioSystem.currentUtterance = null;
    };
    
    utterance.onerror = (error) => {
      console.error('🔊 Audio error:', error);
      audioSystem.currentUtterance = null;
    };
    
    audioSystem.currentUtterance = utterance;
    audioSystem.synthesis.speak(utterance);
    
    return true;
  }
  
  function stopSpeech() {
    if (audioSystem.synthesis && audioSystem.synthesis.speaking) {
      audioSystem.synthesis.cancel();
    }
    audioSystem.currentUtterance = null;
  }
  
  function isSpeaking() {
    return audioSystem.synthesis && audioSystem.synthesis.speaking;
  }
  
  // Component narration
  function narrateComponent(elementInfo) {
    if (!audioSystem.settings.autoRead) return;
    
    let text = '';
    
    // Component selected announcement
    text += t('audio_component_selected') + ' ';
    
    // Component name
    if (elementInfo.name && elementInfo.name !== 'N/A') {
      text += elementInfo.name + '. ';
    }
    
    // Component type
    switch (elementInfo.type) {
      case 'processor':
        text += t('audio_processor_type') + '. ';
        break;
      case 'connection':
        text += t('audio_connection_type') + '. ';
        break;
      case 'flowfile':
        text += t('audio_flowfile_type') + '. ';
        break;
      default:
        text += elementInfo.type + '. ';
    }
    
    // Status
    if (elementInfo.status && elementInfo.status !== 'N/A') {
      switch (elementInfo.status.toLowerCase()) {
        case 'running':
          text += t('audio_status_running') + '. ';
          break;
        case 'stopped':
          text += t('audio_status_stopped') + '. ';
          break;
        case 'invalid':
          text += t('audio_status_invalid') + '. ';
          break;
        default:
          text += 'Status: ' + elementInfo.status + '. ';
      }
    }
    
    // Statistics if available
    if (Object.keys(elementInfo.statistics).length > 0) {
      text += t('audio_reading_stats') + '. ';
    }
    
    speak(text);
  }
  
  // Update audio settings
  function updateAudioSettings(newSettings) {
    audioSystem.settings = { ...audioSystem.settings, ...newSettings };
    chrome.storage.sync.set({ audioSettings: audioSystem.settings });
  }
  
  // Export functions to global scope
  window.NiFiSuperTabsI18n = {
    init: initI18n,
    t: t,
    setLanguage: setLanguage,
    applyTranslations: applyTranslations,
    getCurrentLanguage: () => currentLanguage,
    getAvailableLanguages: () => Object.keys(translations),
    
    // Audio functions
    speak: speak,
    stopSpeech: stopSpeech,
    isSpeaking: isSpeaking,
    narrateComponent: narrateComponent,
    updateAudioSettings: updateAudioSettings,
    getAudioSettings: () => audioSystem.settings,
    isAudioSupported: () => audioSystem.isSupported,
    getVoices: () => audioSystem.voices,
    getCurrentVoice: () => audioSystem.currentVoice,
    setVoice: (voice) => { audioSystem.currentVoice = voice; }
  };
  
  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
  
})();