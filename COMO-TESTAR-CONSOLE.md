# 🧪 Como Executar Testes Reais no NiFi

## ✅ Pré-requisitos
- [x] NiFi rodando em `https://localhost:8443/nifi`
- [x] Você já está logado no NiFi
- [x] Extensão SuperTabs já está atualizada no Chrome

---

## 🚀 Passo a Passo

### **1. Abra o Console do DevTools**

Com o NiFi aberto no Chrome:
1. Pressione **F12** (ou Ctrl+Shift+I)
2. Clique na aba **"Console"**

---

### **2. Copie e Cole o Script de Teste**

1. Abra o arquivo: `test-extension-console.js`
2. Selecione **TODO o conteúdo** (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no Console do Chrome (Ctrl+V)
5. Pressione **Enter**

---

### **3. Aguarde a Execução**

O script irá executar automaticamente e você verá:

```
╔════════════════════════════════════════════════════════════╗
║   SuperTabs Extension - Teste Real no NiFi                ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ DETECÇÃO DO AMBIENTE NIFI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ URL do NiFi detectada ...
✅ Canvas SVG do NiFi encontrado ...
...
```

---

### **4. Analise os Resultados**

Ao final, você verá um resumo:

```
╔════════════════════════════════════════════════════════════╗
║                    RESUMO DOS TESTES                       ║
╚════════════════════════════════════════════════════════════╝

📊 Total de testes: 30+
✅ Aprovados: XX
❌ Falharam: XX
📈 Taxa de sucesso: XX%
```

---

## 📋 O Que Será Testado

### ✅ Testes Incluídos:

1. **Detecção do Ambiente NiFi**
   - URL do NiFi
   - Canvas SVG
   - Flow presente

2. **Extensão Carregada**
   - Chrome Extension API
   - Content Script injetado

3. **Interface da Extensão (Sidebar)**
   - Sidebar no DOM
   - Sidebar visível
   - Abas (Chat, Info, Stats)

4. **Tema e Design System**
   - Font Awesome carregado
   - Fonte Roboto
   - CSS da extensão

5. **API NiFi Client**
   - Cliente disponível
   - Autenticação (Token JWT)
   - GET /flow/about
   - GET /flow/status
   - GET /flow/process-groups/root

6. **Assistente IA (PHI-4)**
   - Agente inicializado
   - Interface de chat
   - Container de mensagens

7. **Ferramentas de Produtividade**
   - Auto-alinhamento
   - Expression Generator
   - Icons Manager

8. **Detecção de Componentes NiFi**
   - Processadores
   - Conexões
   - Process Groups

9. **Event Listeners e Interatividade**
   - Listeners na sidebar
   - Atalhos de teclado

10. **Storage e Configurações**
    - Chrome Storage API
    - Configurações salvas

---

## 🐛 Se Algo Falhar

### Verificações Rápidas:

1. **Extensão não detectada?**
   - Verifique se está instalada: `chrome://extensions/`
   - Recarregue a extensão (botão de reload)

2. **Sidebar não aparece?**
   - Clique no ícone da extensão
   - Tente o atalho: `Ctrl+Shift+S`

3. **API NiFi falha?**
   - Verifique se está logado no NiFi
   - Teste manualmente: `.\test-nifi-auth.ps1`

4. **Muitos testes falhando?**
   - Recarregue a página do NiFi (F5)
   - Execute o script novamente

---

## 📊 Interpretando os Resultados

### Taxa de Sucesso:

- **≥ 80%** 🟢 Excelente - Extensão funcionando bem
- **60-79%** 🟡 Bom - Algumas funcionalidades podem estar faltando
- **< 60%** 🔴 Problemas - Verificar erros críticos

---

## 💾 Salvando os Resultados

O script retorna um objeto com todos os resultados.

Para salvar no console:
```javascript
// O script já retorna automaticamente os resultados
// Você pode acessar com:
let testResults = await [cole o script aqui]
console.table(testResults.tests);
```

---

## 🎯 Próximos Passos

Após executar os testes:

1. ✅ Anote a taxa de sucesso
2. ✅ Liste os testes que falharam
3. ✅ Tire prints dos resultados
4. ✅ Reporte qualquer bug encontrado

---

**Pronto!** Agora é só executar o teste e ver a extensão em ação! 🚀
