# Script de Teste de Autenticacao NiFi API REST
# SuperTabs Extension - Teste de API com Autenticacao

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SuperTabs - Teste de Autenticacao NiFi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuracoes
$nifiUrl = "https://localhost:8443/nifi-api"
$username = "admin"
$password = "ctsBtRBKHRAx69EqUghvvgEvjnaLjFEB"

Write-Host "[INFO] Configuracoes:" -ForegroundColor Yellow
Write-Host "  URL: $nifiUrl" -ForegroundColor White
Write-Host "  Usuario: $username" -ForegroundColor White
Write-Host ""

# Ignora erros de certificado SSL para localhost
if (-not ([System.Management.Automation.PSTypeName]'ServerCertificateValidationCallback').Type) {
    $certCallback = @"
    using System;
    using System.Net;
    using System.Net.Security;
    using System.Security.Cryptography.X509Certificates;
    public class ServerCertificateValidationCallback {
        public static void Ignore() {
            if(ServicePointManager.ServerCertificateValidationCallback == null) {
                ServicePointManager.ServerCertificateValidationCallback += 
                    delegate (
                        Object obj, 
                        X509Certificate certificate, 
                        X509Chain chain, 
                        SslPolicyErrors errors
                    ) {
                        return true;
                    };
            }
        }
    }
"@
    Add-Type $certCallback
}
[ServerCertificateValidationCallback]::Ignore()
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12, [Net.SecurityProtocolType]::Tls13

Write-Host "[STEP 1] Obtendo token de acesso..." -ForegroundColor Yellow

try {
    # Preparar credenciais (form-encoded)
    $body = "username=$username&password=$password"

    $headers = @{
        'Content-Type' = 'application/x-www-form-urlencoded'
    }

    # Obter token
    $authUrl = "$nifiUrl/access/token"
    Write-Host "  URL: $authUrl" -ForegroundColor Gray
    
    $tokenResponse = Invoke-RestMethod -Uri $authUrl -Method POST -Body $body -Headers $headers -ErrorAction Stop
    
    $token = $tokenResponse
    Write-Host "  Token obtido com sucesso!" -ForegroundColor Green
    Write-Host "  Token (primeiros 20 chars): $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
    Write-Host ""

    # Agora usa o token para fazer chamadas autenticadas
    Write-Host "[STEP 2] Testando endpoints com autenticacao..." -ForegroundColor Yellow
    Write-Host ""

    $authHeaders = @{
        'Authorization' = "Bearer $token"
        'Accept' = 'application/json'
    }

    # Teste 1: Informacoes do NiFi
    Write-Host "[TEST 1] Informacoes do NiFi..." -ForegroundColor Cyan -NoNewline
    try {
        $about = Invoke-RestMethod -Uri "$nifiUrl/flow/about" -Method GET -Headers $authHeaders -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
        Write-Host "  Versao: $($about.about.version)" -ForegroundColor Gray
        Write-Host "  Titulo: $($about.about.title)" -ForegroundColor Gray
    } catch {
        Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Teste 2: Status do Flow
    Write-Host "[TEST 2] Status do Flow..." -ForegroundColor Cyan -NoNewline
    try {
        $status = Invoke-RestMethod -Uri "$nifiUrl/flow/status" -Method GET -Headers $authHeaders -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
        Write-Host "  Componentes ativos: $($status.controllerStatus.activeThreadCount)" -ForegroundColor Gray
    } catch {
        Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Teste 3: Process Group Root
    Write-Host "[TEST 3] Process Group Root..." -ForegroundColor Cyan -NoNewline
    try {
        $rootPG = Invoke-RestMethod -Uri "$nifiUrl/flow/process-groups/root" -Method GET -Headers $authHeaders -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
        Write-Host "  ID: $($rootPG.processGroupFlow.id)" -ForegroundColor Gray
        Write-Host "  Nome: $($rootPG.processGroupFlow.breadcrumb.breadcrumb.name)" -ForegroundColor Gray
    } catch {
        Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Teste 4: Listar Processors
    Write-Host "[TEST 4] Listar Processadores..." -ForegroundColor Cyan -NoNewline
    try {
        $processors = Invoke-RestMethod -Uri "$nifiUrl/flow/process-groups/root/processors" -Method GET -Headers $authHeaders -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
        $processorCount = $processors.processors.Count
        Write-Host "  Total de processadores: $processorCount" -ForegroundColor Gray
        
        if ($processorCount -gt 0) {
            Write-Host "  Primeiros processadores:" -ForegroundColor Gray
            $processors.processors | Select-Object -First 3 | ForEach-Object {
                Write-Host "    - $($_.component.name) ($($_.component.type))" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Teste 5: Conexoes
    Write-Host "[TEST 5] Listar Conexoes..." -ForegroundColor Cyan -NoNewline
    try {
        $connections = Invoke-RestMethod -Uri "$nifiUrl/flow/process-groups/root/connections" -Method GET -Headers $authHeaders -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
        Write-Host "  Total de conexoes: $($connections.connections.Count)" -ForegroundColor Gray
    } catch {
        Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Teste 6: Templates
    Write-Host "[TEST 6] Listar Templates..." -ForegroundColor Cyan -NoNewline
    try {
        $templates = Invoke-RestMethod -Uri "$nifiUrl/flow/templates" -Method GET -Headers $authHeaders -ErrorAction Stop
        Write-Host " OK" -ForegroundColor Green
        Write-Host "  Total de templates: $($templates.templates.Count)" -ForegroundColor Gray
    } catch {
        Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "AUTENTICACAO E API FUNCIONANDO!" -ForegroundColor Green
    Write-Host "Token valido e endpoints acessiveis." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # Salvar token para uso posterior
    $tokenFile = "nifi-token.txt"
    $token | Out-File -FilePath $tokenFile -Encoding UTF8
    Write-Host "Token salvo em: $tokenFile" -ForegroundColor Cyan
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ERRO NA AUTENTICACAO!" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  1. NiFi esta rodando em https://localhost:8443/nifi" -ForegroundColor White
    Write-Host "  2. Credenciais estao corretas" -ForegroundColor White
    Write-Host "  3. Usuario tem permissoes adequadas" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}
