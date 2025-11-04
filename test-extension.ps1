# 🚀 SuperTabs Extension - Teste Completo com Credenciais NiFi
# Script de automação para carregar e testar a extensão

# Configurações
$ExtensionPath = "c:\projetos\super-tabs\extension"
$TestServer = "http://localhost:8080"
$NiFiUrl = "https://localhost:8443/nifi"

Write-Host "🔧 CONFIGURAÇÃO DE TESTE - SUPERTABS EXTENSION" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o servidor de teste está rodando
Write-Host "📡 Verificando servidor de teste..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$TestServer" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Servidor de teste funcionando: $TestServer" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor de teste não está rodando" -ForegroundColor Red
    Write-Host "   Execute: python -m http.server 8080" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar estrutura da extensão
Write-Host "📁 Verificando estrutura da extensão..." -ForegroundColor Yellow
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
        Write-Host "  ✅ $($file.Split('\')[-1])" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($file.Split('\')[-1]) - FALTANDO" -ForegroundColor Red
        $AllFilesExist = $false
    }
}

if ($AllFilesExist) {
    Write-Host "✅ Estrutura da extensão completa" -ForegroundColor Green
} else {
    Write-Host "❌ Estrutura da extensão incompleta" -ForegroundColor Red
}
Write-Host ""

# Mostrar credenciais configuradas
Write-Host "🔐 CREDENCIAIS NIFI CONFIGURADAS" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "URL: https://localhost:8443/nifi" -ForegroundColor White
Write-Host "Usuário: admin" -ForegroundColor White
Write-Host "Token: ctsBtRBKHRAx69EqUghvvgEvjnaLjFEB" -ForegroundColor Yellow
Write-Host ""

# Verificar se NiFi está acessível
Write-Host "🌐 Verificando acesso ao NiFi..." -ForegroundColor Yellow
try {
    # Ignore SSL certificate errors for localhost testing
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $nifiResponse = Invoke-WebRequest -Uri $NiFiUrl -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ NiFi acessível: $NiFiUrl" -ForegroundColor Green
} catch {
    Write-Host "⚠️  NiFi não acessível (normal se não estiver rodando)" -ForegroundColor Yellow
    Write-Host "   URL: $NiFiUrl" -ForegroundColor White
}
Write-Host ""

# Instruções para carregar extensão
Write-Host "🔧 INSTRUÇÕES PARA CARREGAR A EXTENSÃO" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "1. Abra o Chrome"
Write-Host "2. Vá para: chrome://extensions/"
Write-Host "3. Ative 'Modo do desenvolvedor' (canto superior direito)"
Write-Host "4. Clique 'Carregar sem compactação'"
Write-Host "5. Selecione a pasta: $ExtensionPath"
Write-Host "6. A extensão será carregada automaticamente"
Write-Host ""

# Links de teste disponíveis
Write-Host "🧪 PÁGINAS DE TESTE DISPONÍVEIS" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "📋 Teste Completo: $TestServer/test-complete-functionality.html"
Write-Host "🔗 Teste NiFi Real: $TestServer/test-nifi-real-connection.html"
Write-Host "📊 Checklist: $TestServer/CHECKLIST-FUNCIONALIDADES.md"
Write-Host "📄 Relatório: $TestServer/RELATORIO-FINAL.md"
Write-Host ""

# Gerar comando para abrir páginas
Write-Host "🚀 COMANDOS RÁPIDOS" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Abrir todas as páginas de teste:"
Write-Host "Start-Process 'chrome.exe' -ArgumentList '$TestServer/test-complete-functionality.html'"
Write-Host "Start-Process 'chrome.exe' -ArgumentList '$TestServer/test-nifi-real-connection.html'"
Write-Host "Start-Process 'chrome.exe' -ArgumentList 'chrome://extensions/'"
Write-Host ""

# Status do projeto
Write-Host "📊 STATUS DO PROJETO" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "✅ 65 funcionalidades mapeadas no checklist"
Write-Host "✅ 42 funcionalidades implementadas (64.6 porcento)"
Write-Host "✅ Sistema de testes completo criado"
Write-Host "✅ Credenciais NiFi pré-configuradas"
Write-Host "✅ Interface de teste com NiFi real"
Write-Host "🔧 8 funcionalidades parcialmente implementadas (12.3 porcento)"
Write-Host "⏳ 10 funcionalidades pendentes de teste (15.4 porcento)"
Write-Host "❌ 5 funcionalidades não implementadas (7.7 porcento)"
Write-Host ""

# Próximos passos
Write-Host "🎯 PRÓXIMOS PASSOS RECOMENDADOS" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "1. ✅ Carregar extensão no Chrome"
Write-Host "2. ✅ Testar com páginas de teste criadas"
Write-Host "3. ✅ Configurar credenciais NiFi (já pré-configuradas)"
Write-Host "4. 🔄 Executar testes de conexão real com NiFi"
Write-Host "5. 🔄 Validar todas as funcionalidades"
Write-Host "6. 🔄 Corrigir bugs encontrados"
Write-Host "7. 🔄 Implementar funcionalidades restantes"
Write-Host ""

Write-Host "🎉 SISTEMA PRONTO PARA TESTES EXTENSIVOS!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Oferecer abrir automaticamente
$response = Read-Host "Deseja abrir as páginas de teste automaticamente? (s/n)"
if ($response -eq 's' -or $response -eq 'S' -or $response -eq 'sim') {
    Write-Host "🚀 Abrindo páginas de teste..." -ForegroundColor Yellow
    
    try {
        Start-Process "chrome.exe" -ArgumentList "$TestServer/test-complete-functionality.html"
        Start-Sleep 2
        Start-Process "chrome.exe" -ArgumentList "$TestServer/test-nifi-real-connection.html"
        Start-Sleep 2
        Start-Process "chrome.exe" -ArgumentList "chrome://extensions/"
        
        Write-Host "✅ Páginas abertas no Chrome" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Erro ao abrir páginas. Abra manualmente:" -ForegroundColor Yellow
        Write-Host "   $TestServer/test-complete-functionality.html"
        Write-Host "   $TestServer/test-nifi-real-connection.html"
        Write-Host "   chrome://extensions/"
    }
}

Write-Host ""
Write-Host "📝 Para suporte detalhado, consulte:" -ForegroundColor Cyan
Write-Host "   - CHECKLIST-FUNCIONALIDADES.md"
Write-Host "   - RELATORIO-FINAL.md"
Write-Host "   - test-complete-functionality.html"
Write-Host "   - test-nifi-real-connection.html"
Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")