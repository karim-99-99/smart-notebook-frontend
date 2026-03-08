# Full sync: WSL mobile -> Windows mobile (make both versions identical)
# Run from PowerShell: .\scripts\sync-full-wsl-to-windows.ps1 (from mobile folder)
# Or: powershell -ExecutionPolicy Bypass -File "C:\Users\DELL\SmartNotebook\mobile\scripts\sync-full-wsl-to-windows.ps1"
$ErrorActionPreference = "Stop"
$wsl = "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile"
$win = "C:\Users\DELL\SmartNotebook\mobile"
$logPath = "$win\sync-log.txt"

$relPaths = @(
    "src\theme\colors.ts",
    "src\theme\borders.ts",
    "src\navigation\AppNavigator.tsx",
    "src\navigation\types.ts",
    "src\screens\LoginScreen.tsx",
    "src\screens\ScanScreen.tsx",
    "src\screens\PreviewScreen.tsx",
    "src\screens\EditNoteScreen.tsx",
    "src\screens\ResultScreen.tsx",
    "src\screens\FoldersScreen.tsx",
    "src\screens\HistoryScreen.tsx",
    "src\screens\ScanScreen.fallback.tsx",
    "src\components\StyledMessageModal.tsx",
    "src\components\QRCodeDetector.tsx",
    "src\components\ConfidenceHighlighter.tsx",
    "src\lib\supabase.ts",
    "src\services\api.ts",
    "src\services\database.ts",
    "src\services\versioning.ts",
    "src\services\search.ts",
    "src\services\supabaseSync.ts",
    "src\utils\qrCodeParser.ts",
    "src\utils\changeTracker.ts",
    "src\utils\editDistance.ts",
    "src\types\index.ts",
    "scripts\sync-images.js",
    "scripts\sync-to-windows.ps1",
    "scripts\sync-wsl-to-windows.ps1",
    "scripts\sync-full-wsl-to-windows.ps1",
    "scripts\copy-login-logo-to-images.js",
    "scripts\copy-all-files.ps1",
    "scripts\copy-to-windows.ps1",
    "scripts\generate-qr-image.js",
    "scripts\postinstall.js",
    "App.tsx",
    "index.js",
    "app.json",
    "babel.config.js",
    "metro.config.js",
    "package.json",
    "tsconfig.json"
)

$ok = 0
$fail = 0
$log = @()
$log += "Sync WSL -> Windows at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$log += "Source: $wsl"
$log += "Dest:   $win"
$log += ""

if (-not (Test-Path $wsl)) {
    $log += "ERROR: WSL path not found: $wsl"
    $log | Set-Content $logPath -Encoding UTF8
    Write-Host "ERROR: WSL path not found. Log: $logPath"
    exit 1
}

foreach ($rel in $relPaths) {
    $src = Join-Path $wsl $rel
    $dst = Join-Path $win $rel
    $dir = Split-Path $dst -Parent
    if (Test-Path $src) {
        try {
            if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            Copy-Item $src $dst -Force
            $ok++
            $log += "OK: $rel"
        } catch {
            $fail++
            $log += "FAIL: $rel - $_"
        }
    } else {
        $log += "SKIP (no source): $rel"
    }
}

# Sync entire src tree (any file we might have missed)
$srcDir = Join-Path $wsl "src"
$dstDir = Join-Path $win "src"
if (Test-Path $srcDir) {
    Get-ChildItem -Path $srcDir -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($srcDir.Length).TrimStart("\")
        $src = $_.FullName
        $dst = Join-Path $dstDir $rel
        $dstParent = Split-Path $dst -Parent
        if (-not (Test-Path $dstParent)) { New-Item -ItemType Directory -Path $dstParent -Force | Out-Null }
        try {
            Copy-Item $src $dst -Force
            if ($rel -notin $relPaths) { $ok++; $log += "OK: src\$rel" }
        } catch { $fail++; $log += "FAIL: src\$rel" }
    }
}

# Sync scripts
$scriptsSrc = Join-Path $wsl "scripts"
$scriptsDst = Join-Path $win "scripts"
if (Test-Path $scriptsSrc) {
    Get-ChildItem -Path $scriptsSrc -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($scriptsSrc.Length).TrimStart("\")
        $dst = Join-Path $scriptsDst $rel
        $dstParent = Split-Path $dst -Parent
        if (-not (Test-Path $dstParent)) { New-Item -ItemType Directory -Path $dstParent -Force | Out-Null }
        try {
            Copy-Item $_.FullName $dst -Force
            $ok++; $log += "OK: scripts\$rel"
        } catch { $fail++; $log += "FAIL: scripts\$rel" }
    }
}

$log += ""
$log += "Done. OK=$ok FAIL=$fail"
$log | Set-Content $logPath -Encoding UTF8
Write-Host "Sync complete. OK=$ok FAIL=$fail. Log: $logPath"
exit 0
