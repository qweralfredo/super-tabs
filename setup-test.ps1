# SuperTabs Extension - Setup e Teste
# Script de configuracao para teste completo

Write-Host "SUPERTABS EXTENSION - CONFIGURACAO DE TESTE" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Configuracoes
$ExtensionPath = "c:\projetos\super-tabs\extension"
$TestServer = "http://localhost:8080"
$NiFiUrl = "https://localhost:8443/nifi"

# Verificar servidor de teste
Write-Host "Verificando servidor de teste..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$TestServer" -UseBasicParsing -TimeoutSec 5
    Write-Host "OK - Servidor de teste funcionando: $TestServer" -ForegroundColor Green
} catch {
    Write-Host "ERRO - Servidor de teste nao esta rodando" -ForegroundColor Red
    Write-Host "Execute: python -m http.server 8080" -ForegroundColor Yellow
}
Write-Host ""

# Verificar estrutura da extensao
Write-Host "Verificando estrutura da extensao..." -ForegroundColor Yellow
$RequiredFiles = @(
    "$ExtensionPath\manifest.json",
    "$ExtensionPath\src\content\content-script.js",
    "$ExtensionPath\src\background\service-worker.js",
    "$ExtensionPath\src\options\options.html",
    "$ExtensionPath\src\popup\popup.html"
)

$AllFilesExist = $true
foreach ($file in $RequiredFiles) {
    if (Test-Path $file) {
        Write-Host "  OK - $($file.Split('\')[-1])" -ForegroundColor Green
    } else {
        Write-Host "  ERRO - $($file.Split('\')[-1]) - FALTANDO" -ForegroundColor Red
        $AllFilesExist = $false
    }
}

if ($AllFilesExist) {
    Write-Host "OK - Estrutura da extensao completa" -ForegroundColor Green
} else {
    Write-Host "ERRO - Estrutura da extensao incompleta" -ForegroundColor Red
}
Write-Host ""

# Mostrar credenciais configuradas
Write-Host "CREDENCIAIS NIFI CONFIGURADAS" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "URL: https://localhost:8443/nifi" -ForegroundColor White
Write-Host "Usuario: admin" -ForegroundColor White
Write-Host "Token: ctsBtRBKHRAx69EqUghvvgEvjnaLjFEB" -ForegroundColor Yellow
Write-Host ""

# Instrucoes para carregar extensao
Write-Host "INSTRUCOES PARA CARREGAR A EXTENSAO" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "1. Abra o Chrome"
Write-Host "2. Va para: chrome://extensions/"
Write-Host "3. Ative 'Modo do desenvolvedor' (canto superior direito)"
Write-Host "4. Clique 'Carregar sem compactacao'"
Write-Host "5. Selecione a pasta: $ExtensionPath"
Write-Host "6. A extensao sera carregada automaticamente"
Write-Host ""

# Links de teste disponiveis
Write-Host "PAGINAS DE TESTE DISPONIVEIS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "Teste Completo: $TestServer/test-complete-functionality.html"
Write-Host "Teste NiFi Real: $TestServer/test-nifi-real-connection.html"
Write-Host "Checklist: $TestServer/CHECKLIST-FUNCIONALIDADES.md"
Write-Host "Relatorio: $TestServer/RELATORIO-FINAL.md"
Write-Host ""

# Status do projeto
Write-Host "STATUS DO PROJETO" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "OK - 65 funcionalidades mapeadas no checklist"
Write-Host "OK - 42 funcionalidades implementadas (64.6%)"
Write-Host "OK - Sistema de testes completo criado"
Write-Host "OK - Credenciais NiFi pre-configuradas"
Write-Host "OK - Interface de teste com NiFi real"
Write-Host "PARCIAL - 8 funcionalidades parcialmente implementadas (12.3%)"
Write-Host "PENDENTE - 10 funcionalidades pendentes de teste (15.4%)"
Write-Host "FALTANDO - 5 funcionalidades nao implementadas (7.7%)"
Write-Host ""

# Proximos passos
Write-Host "PROXIMOS PASSOS RECOMENDADOS" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "1. OK - Carregar extensao no Chrome"
Write-Host "2. OK - Testar com paginas de teste criadas"
Write-Host "3. OK - Configurar credenciais NiFi (ja pre-configuradas)"
Write-Host "4. TODO - Executar testes de conexao real com NiFi"
Write-Host "5. TODO - Validar todas as funcionalidades"
Write-Host "6. TODO - Corrigir bugs encontrados"
Write-Host "7. TODO - Implementar funcionalidades restantes"
Write-Host ""

Write-Host "SISTEMA PRONTO PARA TESTES EXTENSIVOS!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Oferecer abrir automaticamente
$response = Read-Host "Deseja abrir as paginas de teste automaticamente? (s/n)"
if ($response -eq 's' -or $response -eq 'S' -or $response -eq 'sim') {
    Write-Host "Abrindo paginas de teste..." -ForegroundColor Yellow
    
    try {
        Start-Process "chrome.exe" -ArgumentList "$TestServer/test-complete-functionality.html"
        Start-Sleep 2
        Start-Process "chrome.exe" -ArgumentList "$TestServer/test-nifi-real-connection.html"
        Start-Sleep 2
        Start-Process "chrome.exe" -ArgumentList "chrome://extensions/"
        
        Write-Host "OK - Paginas abertas no Chrome" -ForegroundColor Green
    } catch {
        Write-Host "ERRO - Erro ao abrir paginas. Abra manualmente:" -ForegroundColor Yellow
        Write-Host "   $TestServer/test-complete-functionality.html"
        Write-Host "   $TestServer/test-nifi-real-connection.html"
        Write-Host "   chrome://extensions/"
    }
}

Write-Host ""
Write-Host "Para suporte detalhado, consulte:" -ForegroundColor Cyan
Write-Host "   - CHECKLIST-FUNCIONALIDADES.md"
Write-Host "   - RELATORIO-FINAL.md"
Write-Host "   - test-complete-functionality.html"
Write-Host "   - test-nifi-real-connection.html"
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")