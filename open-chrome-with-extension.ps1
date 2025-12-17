# Script para Abrir Chrome com Extensao SuperTabs
# Ignora erros SSL e carrega a extensao automaticamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Abrindo Chrome com SuperTabs Extension" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$extensionPath = "C:\projetos\super-tabs\extension"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Verifica se Chrome existe
if (-not (Test-Path $chromePath)) {
    # Tenta caminho alternativo
    $chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    
    if (-not (Test-Path $chromePath)) {
        Write-Host "ERRO: Chrome nao encontrado!" -ForegroundColor Red
        Write-Host "Instale o Google Chrome ou ajuste o caminho no script." -ForegroundColor Yellow
        exit 1
    }
}

# Verifica se extensao existe
if (-not (Test-Path $extensionPath)) {
    Write-Host "ERRO: Extensao nao encontrada em $extensionPath" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Chrome: $chromePath" -ForegroundColor Gray
Write-Host "[INFO] Extensao: $extensionPath" -ForegroundColor Gray
Write-Host ""

Write-Host "Iniciando Chrome..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Parametros:" -ForegroundColor Gray
Write-Host "  - Ignorar erros SSL" -ForegroundColor Gray
Write-Host "  - Carregar extensao SuperTabs" -ForegroundColor Gray
Write-Host "  - Abrir console DevTools" -ForegroundColor Gray
Write-Host ""

# Argumentos do Chrome
$chromeArgs = @(
    "--load-extension=$extensionPath",
    "--ignore-certificate-errors",
    "--ignore-urlfetcher-cert-requests",
    "--disable-web-security",
    "--auto-open-devtools-for-tabs",
    "https://localhost:8443/nifi"
)

# Inicia Chrome
Start-Process -FilePath $chromePath -ArgumentList $chromeArgs

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chrome iniciado com a extensao!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Faca login no NiFi (admin / ctsBtRBKHRAx69EqUghvvgEvjnaLjFEB)" -ForegroundColor White
Write-Host "  2. Clique no icone da extensao SuperTabs" -ForegroundColor White
Write-Host "  3. Verifique o console para mensagens da extensao" -ForegroundColor White
Write-Host "  4. Teste todas as funcionalidades" -ForegroundColor White
Write-Host ""
Write-Host "Console DevTools:" -ForegroundColor Yellow
Write-Host "  - Procure por: [SuperTabs], [NiFi API], [PHI-4]" -ForegroundColor White
Write-Host "  - Verifique erros em vermelho" -ForegroundColor White
Write-Host ""
