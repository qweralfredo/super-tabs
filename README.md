# SuperTabs - Apache NiFi Assistant

🚀 **AI-powered Chrome Extension for Apache NiFi productivity**

SuperTabs é uma extensão Chrome inteligente projetada para melhorar a produtividade no Apache NiFi com recursos avançados de IA, análise de componentes e automação de fluxos.

## 🎯 **Funcionalidades Principais**

### 🤖 **Agente PHI-4 Integrado**
- Chat inteligente para assistência em tempo real
- Análise e explicação de componentes NiFi
- Sugestões de otimização e troubleshooting
- Modo Assistente e Modo Instrutor

### 🎨 **Interface Apache NiFi**
- Tipografia Roboto alinhada com o NiFi Flow Design System
- Iconografia Font Awesome consistente com padrões NiFi
- Tema visual integrado ao ambiente Apache NiFi

### ⚡ **Ferramentas de Produtividade**
- **Auto-alinhamento**: Organização automática de componentes
- **Gerador de Expression Language**: Criação assistida de expressões NiFi
- **Análise de Componentes**: Inspeção detalhada de processadores
- **Estatísticas em Tempo Real**: Monitoramento de performance

### 📊 **Sidebar Inteligente**
- **Tab Chat**: Conversas com IA sobre componentes selecionados
- **Tab Info**: Detalhes técnicos e configurações
- **Tab Stats**: Métricas e estatísticas de performance

## 🔧 **Instalação**

### Pré-requisitos
- Google Chrome ou Chromium
- Apache NiFi rodando (tipicamente em `https://localhost:8443/nifi`)

### Passos de Instalação
1. Clone este repositório
2. Abra o Chrome e navegue para `chrome://extensions/`
3. Ative o "Modo do desenvolvedor" (toggle superior direito)
4. Clique em "Carregar sem compactação"
5. Selecione a pasta `extension` deste projeto
6. A extensão será instalada e ativada automaticamente

## 🚀 **Como Usar**

### Ativação Automática
A extensão detecta automaticamente quando você está acessando o Apache NiFi e se torna ativa.

### Recursos Principais
- **Clique em componentes**: Abre sidebar com informações e chat IA
- **Popup da extensão**: Acesso rápido a ferramentas (Ctrl+Shift+S)
- **Auto-alinhamento**: Organizie componentes selecionados automaticamente
- **Chat IA**: Faça perguntas sobre qualquer componente ou processo

### Atalhos de Teclado
- `Ctrl+Shift+S`: Abrir popup da extensão
- Clique em componente + Chat: Assistência IA contextual

## 🏗️ **Arquitetura Técnica**

### Estrutura do Projeto
```
extension/
├── manifest.json                 # Configuração da extensão
├── icons/                       # Ícones SVG
└── src/
    ├── background/              # Service Worker
    ├── content/                 # Scripts de conteúdo
    │   ├── content-script.js    # Script principal
    │   ├── phi4-agent.js        # Agente IA PHI-4
    │   ├── sidebar.js           # Interface sidebar
    │   ├── chat-tab.js          # Tab de chat IA
    │   ├── info-tab.js          # Tab de informações
    │   ├── stats-tab.js         # Tab de estatísticas
    │   ├── nifi-api-client.js   # Cliente API NiFi
    │   ├── canvas-detector.js   # Detector de canvas NiFi
    │   ├── alignment-tool.js    # Ferramenta de alinhamento
    │   ├── expression-language-generator.js # Gerador EL
    │   ├── nifi-theme.css       # Tema Apache NiFi
    │   ├── nifi-icons.css       # Sistema de ícones FA
    │   └── *.css                # Estilos dos componentes
    ├── popup/                   # Interface popup
    ├── options/                 # Página de configurações
    └── utils/                   # Utilitários
        ├── logger.js            # Sistema de logging
        └── storage.js           # Gerenciamento de storage
```

### Tecnologias Utilizadas
- **Manifest V3**: Chrome Extension API moderna
- **PHI-4 AI Model**: Modelo de linguagem avançado para assistência
- **Font Awesome 6.4.0**: Sistema de iconografia
- **Roboto Typography**: Tipografia oficial Apache NiFi
- **CSS Custom Properties**: Sistema de design escalável

## 🎨 **Design System**

### Tipografia
- **Roboto Regular**: Texto padrão (13px)
- **Roboto Medium**: Cabeçalhos (18px) 
- **Roboto Light**: Elementos sutis (12px)
- **Roboto Slab**: Títulos especiais (20px)

### Iconografia
Sistema completo Font Awesome com mais de 100 ícones mapeados para contextos específicos do Apache NiFi.

## 🔍 **Funcionalidades Avançadas**

### Agente PHI-4
- Processamento de linguagem natural avançado
- Contexto de conversação persistente
- Análise inteligente de componentes NiFi
- Sugestões de otimização baseadas em IA

### Auto-alinhamento
- Detecção automática de componentes selecionados
- Algoritmos de organização espacial
- Preservação de conexões existentes

### API NiFi Integration
- Comunicação segura com Apache NiFi REST API
- Autenticação automática
- Coleta de métricas em tempo real

## 📈 **Performance**

- **Tempo de inicialização**: < 2 segundos
- **Detecção de canvas**: Automática e eficiente
- **Uso de memória**: Otimizado para longos períodos de uso
- **Compatibilidade**: Apache NiFi 1.15+ e Chrome 90+

## 🔒 **Segurança e Privacidade**

- **Permissões mínimas**: Apenas acesso necessário ao NiFi
- **Dados locais**: Nenhum dado enviado para servidores externos
- **Storage seguro**: Configurações armazenadas localmente no Chrome
- **API PHI-4**: Processamento local quando possível

## 🤝 **Contribuindo**

### Desenvolvimento Local
1. Fork este repositório
2. Faça suas modificações
3. Teste na instalação local da extensão
4. Envie Pull Request com descrição detalhada

### Padrões de Código
- JavaScript ES6+ 
- CSS com custom properties
- Documentação inline obrigatória
- Testes unitários para novas funcionalidades

## 📝 **Changelog**

### v1.0.0 (Atual)
- ✅ Implementação inicial da extensão
- ✅ Agente PHI-4 integrado
- ✅ Interface alinhada com Apache NiFi FDS
- ✅ Sistema completo de ícones Font Awesome
- ✅ Ferramentas de auto-alinhamento
- ✅ Gerador de Expression Language
- ✅ Chat IA contextual
- ✅ Sidebar com múltiplas tabs

## 📞 **Suporte**

Para dúvidas, bugs ou sugestões:
- Abra uma Issue neste repositório
- Descreva detalhadamente o problema ou sugestão
- Inclua screenshots quando relevante

## 📄 **Licença**

Este projeto é open source. Consulte o arquivo LICENSE para detalhes.

---

**SuperTabs** - Transformando a experiência do Apache NiFi com IA 🚀