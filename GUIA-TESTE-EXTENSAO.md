# 🚀 Guia Completo de Teste - SuperTabs Extension

## ✅ Status da Configuração

**Data do Teste:** 02 de Novembro de 2025  
**Autenticação NiFi:** ✅ **TOKEN OBTIDO COM SUCESSO!**  
**Credenciais Configuradas:** ✅ Prontas na extensão  

---

## 🔐 Credenciais Configuradas

```
URL NiFi:  https://localhost:8443/nifi
Usuário:   admin
Token:     eyJraWQiOiI2ZTE0NWI1YS1iYjliLTQwMGUtYWJjYi01OTUzYzJhN2M2YWUiLCJhbGciOiJFZERTQSJ9...
Status:    ✅ Autenticado com sucesso
```

---

## 📋 Passo a Passo para Testes

### **PASSO 1: Carregar a Extensão no Chrome**

1. Abra o Google Chrome
2. Digite na barra de endereços: `chrome://extensions/`
3. Ative o **"Modo do desenvolvedor"** (canto superior direito)
4. Clique em **"Carregar sem compactação"**
5. Navegue até: `C:\projetos\super-tabs\extension`
6. Clique em **"Selecionar pasta"**

✅ **Resultado esperado:** A extensão "SuperTabs" aparece na lista de extensões instaladas

---

### **PASSO 2: Verificar Instalação**

1. Clique no ícone de quebra-cabeça (extensões) na barra do Chrome
2. Procure por **"SuperTabs"** na lista
3. Clique no ícone de pin para fixar a extensão na barra

✅ **Resultado esperado:** Ícone da extensão aparece na barra de ferramentas

---

### **PASSO 3: Acessar o NiFi**

1. Abra uma nova aba no Chrome
2. Navegue para: `https://localhost:8443/nifi`
3. Aceite o aviso de certificado autoassinado (clique em "Avançado" → "Continuar")
4. Faça login com as credenciais:
   - **Usuário:** admin
   - **Senha:** ctsBtRBKHRAx69EqUghvvgEvjnaLjFEB

✅ **Resultado esperado:** Interface do Apache NiFi carregada

---

### **PASSO 4: Ativar a Sidebar da Extensão**

1. Com o NiFi aberto, clique no ícone da extensão SuperTabs
2. Ou use o atalho de teclado: `Ctrl+Shift+S`
3. A sidebar deve aparecer no lado direito da tela

✅ **Resultado esperado:** Sidebar com 3 abas (Chat, Info, Stats)

---

## 🧪 Testes de Funcionalidades

### **TESTE 1: Interface da Sidebar**

**Objetivo:** Verificar que a sidebar foi injetada corretamente

**Passos:**
1. Abra o NiFi (`https://localhost:8443/nifi`)
2. Clique no ícone da extensão
3. Verifique se a sidebar aparece

**Verificações:**
- [ ] Sidebar aparece à direita
- [ ] Design segue o tema NiFi (azul/branco)
- [ ] Fonte Roboto carregada corretamente
- [ ] Ícones Font Awesome visíveis
- [ ] 3 abas presentes: Chat, Info, Stats

---

### **TESTE 2: Assistente IA (Chat)**

**Objetivo:** Testar o assistente PHI-4 com fallback

**Passos:**
1. Clique na aba **"Chat"**
2. Digite uma pergunta: "Como funciona o NiFi?"
3. Pressione Enter

**Verificações:**
- [ ] Campo de input funcional
- [ ] Mensagem aparece no histórico
- [ ] Resposta da IA é exibida
- [ ] Interface de chat responsiva
- [ ] Scroll automático para última mensagem

---

### **TESTE 3: Detecção de Canvas NiFi**

**Objetivo:** Verificar que a extensão detecta o canvas SVG do NiFi

**Passos:**
1. Clique na aba **"Info"**
2. Verifique as informações exibidas

**Verificações:**
- [ ] Canvas SVG detectado
- [ ] URL da API exibida
- [ ] Status da conexão mostrado

---

### **TESTE 4: Integração com API NiFi**

**Objetivo:** Testar chamadas à API REST do NiFi

**Passos:**
1. Abra o Console do desenvolvedor (F12)
2. Vá para a aba "Console"
3. Procure por mensagens `[NiFi API]`

**Verificações:**
- [ ] Autenticação bem-sucedida
- [ ] Token obtido
- [ ] Chamadas à API funcionando
- [ ] Sem erros de CORS

---

### **TESTE 5: Auto-Alinhamento de Componentes**

**Objetivo:** Testar ferramenta de alinhamento automático

**Passos:**
1. Adicione alguns processadores no canvas NiFi
2. Selecione múltiplos processadores (Ctrl+Click)
3. Clique com botão direito → procure opção de alinhamento
4. Ou use atalho: `Ctrl+Shift+A`

**Verificações:**
- [ ] Ferramenta de alinhamento ativa
- [ ] Componentes alinhados corretamente
- [ ] Grid de alinhamento funcional

---

### **TESTE 6: Gerador de Expression Language**

**Objetivo:** Testar gerador de expressões NiFi

**Passos:**
1. Abra a sidebar
2. Procure pela ferramenta "Expression Generator"
3. Selecione um tipo de expressão
4. Clique em "Gerar"

**Verificações:**
- [ ] Interface do gerador aparece
- [ ] Expressões são geradas
- [ ] Código pode ser copiado
- [ ] Sintaxe NiFi válida

---

### **TESTE 7: Estatísticas e Métricas**

**Objetivo:** Verificar coleta de estatísticas

**Passos:**
1. Clique na aba **"Stats"**
2. Verifique as métricas exibidas

**Verificações:**
- [ ] Contagem de processadores
- [ ] Status dos componentes
- [ ] Threads ativas
- [ ] Gráficos/visualizações

---

### **TESTE 8: Página de Opções**

**Objetivo:** Testar configurações da extensão

**Passos:**
1. Vá para `chrome://extensions/`
2. Encontre SuperTabs
3. Clique em **"Detalhes"**
4. Clique em **"Opções da extensão"**

**Verificações:**
- [ ] Página de opções abre
- [ ] Configurações de API NiFi visíveis
- [ ] Credenciais podem ser editadas
- [ ] Botão "Testar Conexão" funcional
- [ ] Configurações de IA disponíveis
- [ ] Import/Export de configurações

---

### **TESTE 9: Persistência de Dados**

**Objetivo:** Verificar que configurações são salvas

**Passos:**
1. Altere uma configuração nas opções
2. Salve
3. Feche e reabra o Chrome
4. Verifique se a configuração foi mantida

**Verificações:**
- [ ] Configurações persistem
- [ ] Token NiFi salvo
- [ ] Preferências de interface mantidas

---

### **TESTE 10: Performance e Responsividade**

**Objetivo:** Avaliar desempenho geral

**Passos:**
1. Abra o NiFi com vários processadores (10+)
2. Use a extensão normalmente
3. Monitore uso de memória (chrome://system/)

**Verificações:**
- [ ] Sidebar abre rapidamente (< 1s)
- [ ] Sem lag na interface
- [ ] Uso de memória razoável (< 100MB)
- [ ] Sem travamentos

---

## 📊 Checklist de Validação Final

### ✅ Funcionalidades Principais
- [ ] Sidebar injeta corretamente
- [ ] Assistente IA responde
- [ ] API NiFi funciona com autenticação
- [ ] Detecção de canvas SVG
- [ ] Auto-alinhamento operacional
- [ ] Expression generator funcional
- [ ] Estatísticas coletadas
- [ ] Página de opções completa

### ✅ Design e UX
- [ ] Tema NiFi aplicado
- [ ] Tipografia Roboto carregada
- [ ] Ícones Font Awesome visíveis
- [ ] Interface responsiva
- [ ] Sem erros visuais

### ✅ Integração e API
- [ ] Autenticação NiFi OK
- [ ] Token válido e salvo
- [ ] Chamadas à API funcionando
- [ ] Sem erros de CORS
- [ ] Fallbacks de erro funcionando

---

## 🐛 Problemas Conhecidos

### Certificado SSL
**Problema:** Chrome pode reclamar de certificado autoassinado  
**Solução:** Clicar em "Avançado" → "Continuar para localhost (não seguro)"

### CORS
**Problema:** Possíveis erros de CORS na API  
**Solução:** Verificar permissões no `manifest.json`

---

## 📝 Relatório de Bugs

Se encontrar bugs durante os testes, documente:

```
🐛 Bug Encontrado:
   Funcionalidade: [nome]
   Passos para reproduzir: [1, 2, 3...]
   Comportamento esperado: [descrição]
   Comportamento atual: [descrição]
   Console errors: [se houver]
```

---

## ✅ Resultado Final

Após executar todos os testes, preencha:

**Total de testes:** 10  
**Testes aprovados:** ___  
**Testes falharam:** ___  
**Taxa de sucesso:** ____%

**Status da Extensão:** 🟢 Pronta | 🟡 Melhorias Necessárias | 🔴 Problemas Críticos

---

## 🎯 Próximos Passos

Após completar os testes:

1. ✅ Documentar todos os resultados
2. ✅ Corrigir bugs críticos encontrados
3. ✅ Otimizar performance se necessário
4. ✅ Preparar para release de produção
5. ✅ Criar documentação de usuário final

---

**Testador:** _______________  
**Data do Teste:** 02/11/2025  
**Versão Testada:** 1.0.0-RC  

---

*Guia gerado automaticamente pelo SuperTabs Test System*
