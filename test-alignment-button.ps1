# Test Alignment Button
# Opens Chrome with SuperTabs extension and navigates to NiFi for testing

Write-Host "Starting Alignment Button Test..." -ForegroundColor Cyan
Write-Host ""

# Extension path
$extensionPath = "$PSScriptRoot\extension"

# Chrome path
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

if (-not (Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

if (-not (Test-Path $chromePath)) {
    Write-Host "ERROR: Chrome not found" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Chrome found: $chromePath" -ForegroundColor Green

# Verify extension exists
if (-not (Test-Path $extensionPath)) {
    Write-Host "ERROR: Extension not found at: $extensionPath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Extension found: $extensionPath" -ForegroundColor Green
Write-Host ""

# Launch Chrome
Write-Host "Launching Chrome with SuperTabs extension..." -ForegroundColor Yellow
Write-Host ""

$arguments = @(
    "--ignore-certificate-errors",
    "--ignore-certificate-errors-spki-list",
    "--unsafely-treat-insecure-origin-as-secure=https://localhost:8443",
    "--load-extension=$extensionPath",
    "--new-window",
    "https://localhost:8443/nifi"
)

Start-Process -FilePath $chromePath -ArgumentList $arguments

Write-Host "✓ Chrome launched" -ForegroundColor Green
Write-Host ""
Write-Host "=== Testing Instructions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Wait for NiFi to load completely" -ForegroundColor White
Write-Host "2. The SuperTabs sidebar should appear on the right" -ForegroundColor White
Write-Host "3. If not visible, it will auto-show when you click a component" -ForegroundColor White
Write-Host ""
Write-Host "=== Test Case 1: No Selection ===" -ForegroundColor Yellow
Write-Host "1. Click the 'Alinhar' button in the sidebar header" -ForegroundColor White
Write-Host "2. You should see a warning notification" -ForegroundColor White
Write-Host "   Expected: 'Please select at least one component to align'" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Test Case 2: With Selection ===" -ForegroundColor Yellow
Write-Host "1. Add 3-5 processors to the canvas" -ForegroundColor White
Write-Host "2. Select multiple processors:" -ForegroundColor White
Write-Host "   - Click first processor" -ForegroundColor Gray
Write-Host "   - Hold Shift and click other processors" -ForegroundColor Gray
Write-Host "3. Click the 'Alinhar' button in the sidebar header" -ForegroundColor White
Write-Host "4. The alignment tool should open with:" -ForegroundColor White
Write-Host "   - Component list showing selected items" -ForegroundColor Gray
Write-Host "   - 6 alignment type buttons" -ForegroundColor Gray
Write-Host "   - Spacing controls" -ForegroundColor Gray
Write-Host "   - Preview canvas" -ForegroundColor Gray
Write-Host "   - Apply button" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Test Case 3: Apply Alignment ===" -ForegroundColor Yellow
Write-Host "1. With alignment tool open, select an alignment type:" -ForegroundColor White
Write-Host "   - Horizontal: left, center, or right" -ForegroundColor Gray
Write-Host "   - Vertical: top, middle, or bottom" -ForegroundColor Gray
Write-Host "   - Grid: auto-arrange in grid" -ForegroundColor Gray
Write-Host "   - Flow: left-to-right flow" -ForegroundColor Gray
Write-Host "   - Circular: arrange in circle" -ForegroundColor Gray
Write-Host "   - Hierarchical: tree layout" -ForegroundColor Gray
Write-Host "2. Preview should update automatically" -ForegroundColor White
Write-Host "3. Adjust spacing if needed" -ForegroundColor White
Write-Host "4. Click 'Apply Alignment' button" -ForegroundColor White
Write-Host "5. Components should move to aligned positions" -ForegroundColor White
Write-Host ""
Write-Host "=== Features to Verify ===" -ForegroundColor Cyan
Write-Host "✓ Align button visible in sidebar header" -ForegroundColor White
Write-Host "✓ Button has icon and 'Alinhar' text" -ForegroundColor White
Write-Host "✓ Warning shown when no components selected" -ForegroundColor White
Write-Host "✓ Alignment tool opens with selected components" -ForegroundColor White
Write-Host "✓ All 6 alignment types available" -ForegroundColor White
Write-Host "✓ Preview updates in real-time" -ForegroundColor White
Write-Host "✓ Apply button updates component positions in NiFi" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
