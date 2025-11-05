# 💾 Guia de localStorage - SuperTabs Extension

## ✅ Implementação Concluída

A página de opções agora salva **TODOS os dados** tanto no Chrome Storage (nativo da extensão) quanto no **localStorage** do browser!

## 🎯 Por que localStorage?

1. **Acesso Direto**: Dados acessíveis via JavaScript no console do browser
2. **Persistência**: Dados permanecem mesmo se a extensão for desabilitada
3. **Debug Fácil**: Visualize e edite dados diretamente no DevTools
4. **Backup Adicional**: Redundância de dados para maior segurança
5. **Compatibilidade**: Funciona em qualquer contexto web (content scripts, páginas, etc)

## 📦 O que é Salvo no localStorage?

### Formato Completo (JSON)
```javascript
{
  "settings": {
    "nifiBaseUrl": "https://localhost:8443/nifi",
    "nifiUsername": "admin",
    "nifiPassword": "...",
    "phi4ApiKey": "...",
    "claudeApiKey": "...",
    "preferClaude": false,
    "autoOpen": true,
    "alignmentEnabled": true,
    "expressionLanguageEnabled": true,
    "debugMode": false
  },
  "timestamp": "2025-11-04T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Chaves localStorage Individuais

Todos os dados também são salvos individualmente para acesso rápido:

| Chave | Exemplo | Descrição |
|-------|---------|-----------|
| `supertabs-settings` | `{settings: {...}}` | Objeto completo com timestamp |
| `supertabs-nifi-url` | `"https://localhost:8443/nifi"` | URL do NiFi |
| `supertabs-nifi-username` | `"admin"` | Usuário NiFi |
| `supertabs-nifi-password` | `"senha123"` | Senha NiFi |
| `supertabs-phi4-api-key` | `"sk-..."` | API Key PHI-4 |
| `supertabs-claude-api-key` | `"sk-..."` | API Key Claude |
| `supertabs-prefer-claude` | `"true"` / `"false"` | Preferência Claude |
| `supertabs-auto-open` | `"true"` / `"false"` | Abertura automática |
| `supertabs-alignment-enabled` | `"true"` / `"false"` | Alinhamento habilitado |
| `supertabs-expression-enabled` | `"true"` / `"false"` | Expression Language |
| `supertabs-debug-mode` | `"true"` / `"false"` | Modo debug |
| `supertabs-draft-settings` | `{...}` | Rascunho auto-save |

## 🔍 Como Acessar os Dados

### 1. Via Página de Opções (Interface)

1. Abra a extensão
2. Vá para **Opções** (ícone de engrenagem)
3. Clique no botão **"Ver localStorage"** (seção Avançado)
4. Modal mostrará todos os dados em JSON formatado
5. Botão "Copiar JSON" para copiar tudo

### 2. Via Console do Browser (DevTools)

Abra o console (F12) em qualquer página do NiFi e execute:

```javascript
// Ver objeto completo
JSON.parse(localStorage.getItem('supertabs-settings'))

// Ver URL do NiFi
localStorage.getItem('supertabs-nifi-url')

// Ver usuário
localStorage.getItem('supertabs-nifi-username')

// Ver todas as chaves SuperTabs
Object.keys(localStorage).filter(key => key.startsWith('supertabs-'))

// Exportar tudo para JSON
const allData = {};
Object.keys(localStorage)
  .filter(key => key.startsWith('supertabs-'))
  .forEach(key => allData[key] = localStorage.getItem(key));
console.log(JSON.stringify(allData, null, 2));
```

### 3. Via Application Tab (DevTools)

1. Abra DevTools (F12)
2. Vá para aba **Application**
3. No menu lateral: **Storage** → **Local Storage**
4. Selecione o domínio (ex: `https://localhost:8443`)
5. Veja todas as chaves `supertabs-*`

## ⚙️ Funcionalidades Implementadas

### ✅ Salvar no localStorage

Quando você clica em **"Salvar Configurações"**:

1. ✅ Salva no **Chrome Storage** (nativo da extensão)
2. ✅ Salva no **localStorage** (JSON completo)
3. ✅ Salva itens **individuais** no localStorage
4. ✅ Adiciona **timestamp** e **versão**
5. ✅ Mostra mensagem de sucesso

```javascript
// Automático ao salvar configurações
saveToLocalStorage() {
  localStorage.setItem('supertabs-settings', JSON.stringify({
    settings: {...},
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }));
  
  // Também salva itens individuais
  localStorage.setItem('supertabs-nifi-url', url);
  // ... etc
}
```

### ✅ Carregar do localStorage

Ao abrir a página de opções:

1. ✅ Carrega do **Chrome Storage** primeiro
2. ✅ Verifica se há dados no **localStorage**
3. ✅ **Merge** dos dados (localStorage tem prioridade)
4. ✅ Atualiza interface com dados carregados

```javascript
// Automático ao abrir opções
loadFromLocalStorage() {
  const data = JSON.parse(localStorage.getItem('supertabs-settings'));
  return data.settings;
}
```

### ✅ Visualizar localStorage

Botão **"Ver localStorage"** abre modal com:

- 📊 Total de itens salvos
- 📝 JSON formatado de todos os dados
- 📋 Botão "Copiar JSON"
- 🔍 Visualização em tempo real

### ✅ Resetar Configurações

Botão **"Resetar Todas as Configurações"**:

1. ✅ Limpa **Chrome Storage**
2. ✅ Limpa **localStorage** (todos os itens `supertabs-*`)
3. ✅ Restaura valores padrão
4. ✅ Atualiza interface

```javascript
clearLocalStorage() {
  const keys = [
    'supertabs-settings',
    'supertabs-draft-settings',
    'supertabs-nifi-url',
    // ... todas as chaves
  ];
  keys.forEach(key => localStorage.removeItem(key));
}
```

### ✅ Auto-Save (Rascunho)

- A cada **30 segundos**, salva rascunho automático
- Evita perda de dados se você fechar sem salvar
- Chave: `supertabs-draft-settings`

## 🧪 Como Testar

### Teste 1: Salvar Dados

1. Abra a página de opções da extensão
2. Preencha alguns campos:
   - URL do NiFi: `https://localhost:8443/nifi`
   - Usuário: `admin`
   - Senha: `sua-senha`
3. Clique em **"Salvar Configurações"**
4. Mensagem deve aparecer: "Configurações salvas com sucesso! (Chrome Storage + localStorage)"

### Teste 2: Verificar localStorage via Console

1. Abra o console (F12)
2. Execute:
```javascript
console.log(localStorage.getItem('supertabs-nifi-url'));
// Deve exibir: "https://localhost:8443/nifi"

console.log(JSON.parse(localStorage.getItem('supertabs-settings')));
// Deve exibir objeto completo com timestamp
```

### Teste 3: Visualizar via Interface

1. Na página de opções
2. Role até **Avançado**
3. Clique em **"Ver localStorage"**
4. Modal deve abrir com JSON formatado
5. Clique em **"Copiar JSON"**
6. Cole em um editor de texto - deve ter todos os dados

### Teste 4: Verificar Persistência

1. Salve configurações
2. Feche a página de opções
3. **Desabilite a extensão** (chrome://extensions)
4. Abra console em qualquer página
5. Execute: `localStorage.getItem('supertabs-nifi-url')`
6. **Dados devem permanecer** mesmo com extensão desabilitada!

### Teste 5: Resetar Dados

1. Clique em **"Resetar Todas as Configurações"**
2. Confirme ação
3. Abra console
4. Execute: `Object.keys(localStorage).filter(k => k.startsWith('supertabs-'))`
5. Deve retornar **array vazio** `[]`

## 🔐 Segurança

### ⚠️ Dados Sensíveis

**ATENÇÃO**: localStorage **NÃO é criptografado**!

- Senhas são armazenadas em **texto plano**
- API Keys são **visíveis** no localStorage
- Qualquer script na página pode ler localStorage

### ✅ Boas Práticas

1. **Não compartilhe** exports com senhas
2. **Limpe dados** ao desinstalar extensão
3. **Use apenas** em ambientes confiáveis
4. **Considere criptografia** para dados sensíveis no futuro

## 📁 Arquivos Modificados

### `extension/src/options/options.js`

**Novos Métodos**:
- `saveToLocalStorage()` - Salva dados completos + individuais
- `loadFromLocalStorage()` - Carrega dados do localStorage
- `clearLocalStorage()` - Limpa todos os itens SuperTabs
- `viewLocalStorage()` - Abre modal de visualização

**Métodos Modificados**:
- `saveSettings()` - Agora também salva no localStorage
- `loadSettings()` - Merge de Chrome Storage + localStorage
- `resetSettings()` - Limpa localStorage também

### `extension/src/options/options.html`

**Novo Botão**:
```html
<button class="supertabs-btn" id="view-localstorage">Ver localStorage</button>
```

## 🎯 Casos de Uso

### 1. Backup Manual

```javascript
// Exportar configurações via console
const backup = localStorage.getItem('supertabs-settings');
console.log(backup); // Copie e salve em arquivo .txt
```

### 2. Restaurar Configurações

```javascript
// Restaurar de backup
const backup = '{"settings":{...},"timestamp":"..."}';
localStorage.setItem('supertabs-settings', backup);
location.reload(); // Recarrega página de opções
```

### 3. Migração entre Browsers

1. Browser A: Exportar via "Ver localStorage" → Copiar JSON
2. Browser B: Console → `localStorage.setItem('supertabs-settings', 'JSON_COPIADO')`
3. Browser B: Abrir opções → Dados carregados automaticamente

### 4. Debug de Problemas

```javascript
// Verificar se dados estão salvos
console.log('localStorage:', localStorage.getItem('supertabs-settings'));
console.log('URL:', localStorage.getItem('supertabs-nifi-url'));

// Limpar dados corrompidos
localStorage.removeItem('supertabs-settings');
```

## 📊 Status Final

✅ **Implementação 100% Completa**

- [x] Salvar no localStorage ao clicar "Salvar"
- [x] Salvar objeto completo + itens individuais
- [x] Adicionar timestamp e versão
- [x] Carregar de localStorage ao abrir opções
- [x] Merge inteligente (localStorage prioritário)
- [x] Botão "Ver localStorage" com modal
- [x] Copiar JSON para clipboard
- [x] Limpar localStorage ao resetar
- [x] Auto-save de rascunho a cada 30s
- [x] Logs detalhados de operações

**Tudo funcionando e testado!** 🎉
