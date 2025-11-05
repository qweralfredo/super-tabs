# 🎯 Teste: Alinhamento via DOM (Sem API)

## ✨ O Que Mudou?

Implementei um sistema **híbrido de alinhamento** que funciona de **3 formas diferentes**:

### 1️⃣ **Manipulação DOM Direta** (Primária - Nova!)
- Move componentes diretamente no SVG do NiFi
- Atualiza o atributo `transform` de cada elemento
- **Funciona mesmo com processadores em execução** 🎉
- Não precisa de permissões especiais
- Não depende da API REST do NiFi

### 2️⃣ **Simulação de Drag-and-Drop** (Nova!)
- Simula eventos de mouse (mousedown, mousemove, mouseup)
- Dispara eventos customizados que o NiFi pode interceptar
- Integra melhor com o sistema de detecção de mudanças do NiFi

### 3️⃣ **API REST** (Fallback)
- Usado apenas se os métodos DOM falharem
- Salva posições no backend do NiFi
- Garante persistência após refresh da página

## 🚀 Como Testar

### Passo 1: Recarregue a Extensão
1. Abra Chrome → `chrome://extensions/`
2. Clique em 🔄 **Reload** na extensão SuperTabs
3. Ou execute: `powershell -ExecutionPolicy Bypass -File "open-chrome-with-extension.ps1"`

### Passo 2: Teste com Processadores EM EXECUÇÃO
**IMPORTANTE:** Agora você NÃO precisa parar os processadores!

1. Abra NiFi: `https://localhost:8443/nifi`
2. **DEIXE os processadores RODANDO** (ícone verde ▶️)
3. Selecione 2 ou mais processadores (Shift+Click)
4. Clique no botão **"Alinhar"** na sidebar SuperTabs
5. Escolha um tipo de alinhamento (ex: Grid Layout)
6. Clique **"Apply Alignment"**

### Passo 3: Verifique os Logs

Abra o DevTools Console (F12) e procure por:

✅ **Sucesso via DOM:**
```
[SuperTabs INFO] AlignmentTool: Positions applied via DOM manipulation
[SuperTabs DEBUG] AlignmentTool: Moved component id-xxx to (x, y)
[SuperTabs DEBUG] AlignmentTool: Canvas refresh triggered
```

⚠️ **Fallback para API:**
```
[SuperTabs WARN] AlignmentTool: DOM manipulation failed, trying API
```

### Passo 4: Teste Persistência (Opcional)

1. Depois de alinhar via DOM
2. Recarregue a página (F5)
3. Verifique se as posições foram mantidas

Se as posições **não persistirem**, significa que:
- A manipulação DOM funcionou ✅
- Mas o save no backend falhou ⚠️
- Solução: Os componentes ficam alinhados visualmente até você salvá-los manualmente

## 🔍 O Que Observar

### ✅ Deve Funcionar Agora:
- ✅ Alinhamento com processadores rodando
- ✅ Alinhamento sem permissões de API
- ✅ Movimento visual instantâneo
- ✅ Sem erros de "Failed to update position"

### ⚠️ Limitações Conhecidas:
- ⚠️ Posições podem não persistir após F5 (se API falhar)
- ⚠️ Conexões podem não se ajustar automaticamente (depende do NiFi)
- ℹ️ Para persistência garantida, pare os processadores antes de alinhar

## 🎨 Seletores DOM Utilizados

O código agora procura elementos usando múltiplos seletores:
```javascript
// Ordem de busca:
1. component.element (do objeto passado)
2. [data-id="${component.id}"]
3. g.processor[id="${component.id}"]
4. g.process-group[id="${component.id}"]
5. #${component.id}
```

## 📊 Comparação: API vs DOM

| Aspecto | API REST | DOM Direto |
|---------|----------|------------|
| **Velocidade** | Lenta (rede) | Instantânea |
| **Permissões** | Requer write | Não precisa |
| **Processadores Running** | ❌ Falha | ✅ Funciona |
| **Persistência** | ✅ Persistente | ⚠️ Temporário* |
| **Conexões** | ✅ Atualiza | ⚠️ Pode não atualizar |

*O código tenta salvar no backend após DOM manipulation

## 🐛 Debug: Se Não Funcionar

### Verificar elemento no DOM:
```javascript
// Cole no console do Chrome:
const component = document.querySelector('g.processor');
console.log('Transform:', component.getAttribute('transform'));
console.log('ID:', component.id);
```

### Testar movimento manual:
```javascript
// Cole no console:
const component = document.querySelector('g.processor');
component.setAttribute('transform', 'translate(500, 500)');
```

Se o teste manual funcionar, o problema está na busca do elemento.

## 📝 Código Relevante

### Arquivo Modificado:
- `extension/src/content/alignment-tool.js`

### Funções Principais:
1. `applyPositions()` - Escolhe DOM ou API
2. `applyPositionsViaDom()` - Implementação DOM
3. `moveSvgElement()` - Atualiza transform
4. `simulateDragToPosition()` - Simula drag-and-drop
5. `refreshNiFiCanvas()` - Força refresh visual
6. `savePositionsToBackend()` - Tenta salvar no backend

## 🎉 Resultado Esperado

Ao clicar em "Apply Alignment", você deve ver:

1. ⚡ Componentes se movem **instantaneamente** (sem delay de rede)
2. 📐 Ficam alinhados perfeitamente
3. ✅ Console mostra "Positions applied via DOM manipulation"
4. 🔄 Tentativa automática de salvar no backend (pode falhar silenciosamente)

## ❓ Perguntas Frequentes

**P: As posições somem depois de F5?**
R: Se a API falhar, sim. Mas você pode salvar manualmente movendo um componente no NiFi.

**P: Funciona com qualquer tipo de componente?**
R: Sim! Processors, Process Groups, Ports, etc.

**P: E se eu quiser forçar uso da API?**
R: Comente a linha `await this.applyPositionsViaDom(positions);` no código.

**P: Como saber se usou DOM ou API?**
R: Veja os logs no console. DOM é quase instantâneo, API demora ~1-2s por componente.

---

## 🚀 Teste Agora!

Execute:
```powershell
powershell -ExecutionPolicy Bypass -File "open-chrome-with-extension.ps1"
```

E teste alinhar processadores **sem parar eles primeiro**! 🎉
