# Teste do Botão "Alinhar" - SuperTabs Extension

## ✅ Implementação Concluída

O botão "Alinhar" foi adicionado com sucesso à extensão SuperTabs!

## 📍 Localização

O botão está localizado no **header da sidebar SuperTabs**, ao lado dos controles de minimizar/redimensionar/fechar.

## 🎨 Características Visuais

- **Ícone**: Font Awesome `fa-align-justify`
- **Texto**: "Alinhar"
- **Estilo**: Botão com fundo semi-transparente branco, efeito hover
- **Posição**: Primeiro botão antes dos controles padrão

## 🧪 Testes a Realizar

### Teste 1: Sem Seleção
1. Abra o NiFi (Chrome já está aberto com a extensão)
2. Certifique-se de que **nenhum componente** está selecionado
3. Clique no botão **"Alinhar"** na sidebar
4. **Resultado Esperado**: 
   - Notificação aparece no canto superior direito
   - Mensagem: "Please select at least one component to align"
   - Notificação desaparece após 3 segundos

### Teste 2: Com Componentes Selecionados

#### Preparação:
1. Adicione 3-5 processors ao canvas do NiFi
   - Clique no ícone "Processor" na toolbar superior
   - Arraste para o canvas
   - Repita para criar vários processors
   - Posicione-os de forma desorganizada

2. Selecione múltiplos processors:
   - Clique no primeiro processor
   - **Segure Shift** e clique em outros processors
   - Os processors selecionados devem ter borda destacada

3. Clique no botão **"Alinhar"** na sidebar

4. **Resultado Esperado**:
   - A ferramenta de alinhamento abre (overlay modal)
   - Mostra lista dos componentes selecionados
   - Exibe 6 tipos de alinhamento:
     * **Horizontal** (esquerda/centro/direita)
     * **Vertical** (topo/meio/base)
     * **Grid** (grade automática)
     * **Flow** (fluxo da esquerda para direita)
     * **Circular** (arranjo circular)
     * **Hierarchical** (layout em árvore)
   - Canvas de preview SVG mostra posicionamento
   - Controles de espaçamento (horizontal/vertical)
   - Botões: "Apply Alignment" e "Close"

### Teste 3: Aplicar Alinhamento

1. Com a ferramenta de alinhamento aberta
2. Selecione um tipo de alinhamento (ex: **Grid**)
3. O preview deve atualizar automaticamente
4. Ajuste o espaçamento se necessário
5. Clique em **"Apply Alignment"**
6. **Resultado Esperado**:
   - Componentes no canvas movem-se para as novas posições
   - Alinhamento aplicado conforme o preview
   - Ferramenta de alinhamento fecha
   - Componentes permanecem selecionados

### Teste 4: Diferentes Tipos de Alinhamento

Repita o Teste 3 com cada tipo de alinhamento:

#### Horizontal
- Alinha todos no mesmo eixo Y
- Sub-opções: esquerda, centro, direita

#### Vertical
- Alinha todos no mesmo eixo X
- Sub-opções: topo, meio, base

#### Grid
- Organiza em grade retangular
- Distribui uniformemente
- Calcula automaticamente dimensões da grade

#### Flow
- Organiza em fluxo horizontal (esquerda → direita)
- Quebra linha quando atinge largura máxima
- Ideal para workflows sequenciais

#### Circular
- Organiza componentes em círculo
- Primeiro componente no topo
- Distribui uniformemente ao redor

#### Hierarchical
- Organiza em estrutura de árvore
- Níveis baseados em conexões
- Layout top-down hierárquico

## 📋 Checklist de Verificação

### Funcionalidade
- [ ] Botão "Alinhar" visível no header da sidebar
- [ ] Botão tem ícone e texto "Alinhar"
- [ ] Notificação aparece quando nenhum componente está selecionado
- [ ] Ferramenta de alinhamento abre com componentes selecionados
- [ ] Todos os 6 tipos de alinhamento estão disponíveis
- [ ] Preview atualiza quando tipo de alinhamento muda
- [ ] Controles de espaçamento funcionam
- [ ] Botão "Apply" atualiza posições no NiFi
- [ ] Botão "Close" fecha a ferramenta

### Interface
- [ ] Botão tem hover effect
- [ ] Notificação tem animação de entrada/saída
- [ ] Notificação usa cores corretas (warning = amarelo)
- [ ] Ferramenta de alinhamento tem design consistente com NiFi
- [ ] Preview SVG renderiza corretamente
- [ ] Responsivo (funciona em diferentes resoluções)

### Integração
- [ ] Detecta componentes selecionados corretamente
- [ ] Suporta processors
- [ ] Suporta input ports
- [ ] Suporta output ports
- [ ] Suporta labels
- [ ] API NiFi é chamada corretamente para atualizar posições
- [ ] Tokens JWT são incluídos nas requisições

## 🐛 Troubleshooting

### Botão não aparece
- Verifique se a sidebar está visível
- Recarregue a extensão (chrome://extensions → Reload)
- Verifique console do browser (F12) por erros

### Ferramenta não abre
- Verifique se há componentes selecionados
- Verifique console: `window.SuperTabsAlignmentTool` deve existir
- Verifique se `alignment-tool.js` foi carregado

### Alinhamento não aplica
- Verifique credenciais NiFi
- Verifique token JWT válido
- Verifique console de rede (Network tab) para erros API
- Verifique se componentes têm IDs válidos

## 📝 Arquivos Modificados

1. **extension/src/content/sidebar.js**
   - Adicionado botão "Alinhar" no HTML do header
   - Adicionado evento click no `bindEvents()`
   - Adicionado método `openAlignmentTool()`
   - Adicionado método `getSelectedComponents()`
   - Adicionado método `showNotification()`

2. **extension/src/content/sidebar.css**
   - Estilos para `.supertabs-align-btn`
   - Estilos para `.supertabs-notification` (4 variantes: info, warning, error, success)
   - Animações de entrada/saída

## 🚀 Como Testar Agora

O Chrome já está aberto com a extensão carregada!

1. **Vá para o NiFi**: https://localhost:8443/nifi
2. **Aguarde** o carregamento completo
3. **Adicione processors** ao canvas
4. **Selecione múltiplos** (Shift+Click)
5. **Clique "Alinhar"** na sidebar SuperTabs
6. **Teste os alinhamentos** disponíveis
7. **Aplique** e veja os componentes se organizarem!

## 📊 Status Final

✅ **Botão "Alinhar" implementado com sucesso!**

- Interface completa com notificações
- Integração com ferramenta de alinhamento existente
- Detecção automática de componentes selecionados
- 6 tipos de alinhamento disponíveis
- Preview em tempo real
- Aplicação via API NiFi

**Pronto para teste em ambiente real!** 🎉
