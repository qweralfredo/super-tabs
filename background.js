// Background script para gerenciar a extensão
chrome.runtime.onInstalled.addListener(() => {
  console.log('⚡ NiFi Super Tabs instalada com sucesso!');
});

// Detecta quando uma aba é atualizada
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && isNiFiUrl(tab.url)) {
    // Injeta scripts adicionais se necessário
    console.log('Página NiFi detectada:', tab.url);
  }
});

// Verifica se a URL é do NiFi
function isNiFiUrl(url) {
  return url.includes('nifi') || 
         url.includes('localhost') || 
         url.includes('127.0.0.1');
}

// Gerencia mensagens dos content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSuggestions':
      getSuggestions(request.elementType, request.elementId)
        .then(suggestions => sendResponse({ suggestions }));
      return true; // Indica resposta assíncrona
      
    case 'saveUserPreference':
      chrome.storage.sync.set({
        [request.key]: request.value
      });
      break;
  }
});

// Obtém sugestões baseadas no elemento selecionado
async function getSuggestions(elementType, elementId) {
  // Aqui você pode implementar lógica mais complexa
  // Por exemplo, consultar uma API externa ou base de conhecimento
  
  const suggestions = {
    'processor': [
      {
        title: 'Melhores Práticas',
        content: 'Configure timeouts adequados e monitore backpressure',
        type: 'tip'
      },
      {
        title: 'Documentação',
        content: 'Consulte a documentação oficial do Apache NiFi',
        type: 'link',
        url: 'https://nifi.apache.org/docs.html'
      },
      {
        title: 'Troubleshooting',
        content: 'Verifique logs em caso de erros de processamento',
        type: 'warning'
      }
    ],
    'connection': [
      {
        title: 'Configuração de Fila',
        content: 'Ajuste o tamanho da fila conforme o volume de dados',
        type: 'tip'
      },
      {
        title: 'FlowFile Prioritizers',
        content: 'Use prioritizadores para otimizar o fluxo',
        type: 'feature'
      }
    ],
    'flowfile': [
      {
        title: 'Atributos Importantes',
        content: 'Verifique filename, path e mime.type',
        type: 'info'
      },
      {
        title: 'Conteúdo',
        content: 'Visualize o conteúdo do FlowFile',
        type: 'action'
      },
      {
        title: 'Histórico',
        content: 'Rastreie a proveniência do FlowFile',
        type: 'history'
      }
    ]
  };
  
  return suggestions[elementType] || [
    {
      title: 'Ajuda Geral',
      content: 'Clique em um processor, connection ou flowfile para ver sugestões específicas',
      type: 'info'
    }
  ];
}