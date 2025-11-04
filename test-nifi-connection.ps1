# Script de Teste de Conexao NiFi
# SuperTabs Extension - Teste de API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SuperTabs - Teste de Conexao NiFi API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuracoes
$nifiUrl = "https://localhost:8443/nifi-api"
$username = "admin"
$password = "ctsBtRBKHRAx69EqUghvvgEvjnaLjFEB"

Write-Host "[INFO] Configuracoes:" -ForegroundColor Yellow
Write-Host "  URL: $nifiUrl" -ForegroundColor White
Write-Host "  Usuario: $username" -ForegroundColor White
Write-Host "  Senha: ****" -ForegroundColor White
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

# Funcao para testar endpoint
function Test-NiFiEndpoint {
    param(
        [string]$Endpoint,
        [string]$Description
    )
    
    Write-Host "[TEST] $Description..." -ForegroundColor Cyan -NoNewline
    
    try {
        $url = "$nifiUrl/$Endpoint"
        $headers = @{
            'Accept' = 'application/json'
        }
        
        # Tenta sem autenticação primeiro
        $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers -ErrorAction Stop
        
        Write-Host " OK" -ForegroundColor Green
        return $true
    } catch {
        # Se falhar, tenta com autenticação básica
        try {
            $base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("{0}:{1}" -f $username, $password)))
            $headers = @{
                'Authorization' = "Basic $base64AuthInfo"
                'Accept' = 'application/json'
            }
            $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers -ErrorAction Stop
            Write-Host " OK (com auth)" -ForegroundColor Green
            return $true
        } catch {
            Write-Host " ERRO: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
}

# Testes
Write-Host "Executando testes de API..." -ForegroundColor Yellow
Write-Host ""

$results = @()

# 1. Teste de acesso basico
$results += Test-NiFiEndpoint "flow/about" "Informacoes do NiFi"

# 2. Teste de status
$results += Test-NiFiEndpoint "flow/status" "Status do Flow"

# 3. Teste de processo groups
$results += Test-NiFiEndpoint "flow/process-groups/root" "Process Group Root"

# 4. Teste de conexao (pode falhar sem autenticacao)
$results += Test-NiFiEndpoint "access/config" "Configuracao de Acesso"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Resumo
$total = $results.Count
$passed = ($results | Where-Object {$_ -eq $true}).Count
$failed = $total - $passed

Write-Host "RESUMO DOS TESTES:" -ForegroundColor Yellow
Write-Host "  Total: $total" -ForegroundColor White
Write-Host "  Passou: $passed" -ForegroundColor Green
Write-Host "  Falhou: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "A API NiFi esta acessivel e funcionando." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ALGUNS TESTES FALHARAM!" -ForegroundColor Yellow
    Write-Host "Verifique se o NiFi esta rodando em https://localhost:8443/nifi" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Salvar resultados
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "test-results-$timestamp.txt"

$report = @"
SuperTabs Extension - Teste de API NiFi
Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
========================================

Configuracoes:
  URL: $nifiUrl
  Usuario: $username

Resultados:
  Total de testes: $total
  Testes aprovados: $passed
  Testes falhados: $failed

Status: $(if ($failed -eq 0) {"SUCESSO"} else {"FALHA"})
"@

$report | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host "Relatorio salvo em: $reportFile" -ForegroundColor Cyan
Write-Host ""
