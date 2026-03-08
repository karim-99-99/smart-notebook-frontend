# Sync full mobile project from WSL to Windows (make both versions identical)
# Run from PowerShell: cd C:\Users\DELL\SmartNotebook\mobile; .\scripts\sync-to-windows.ps1
# Or from WSL mobile: powershell.exe -ExecutionPolicy Bypass -File scripts/sync-to-windows.ps1
$wsl = "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile"
$win = "C:\Users\DELL\SmartNotebook\mobile"

$allFiles = @(
    "src\theme\colors.ts", "src\theme\borders.ts",
    "src\navigation\AppNavigator.tsx", "src\navigation\types.ts",
    "src\screens\LoginScreen.tsx", "src\screens\ScanScreen.tsx", "src\screens\PreviewScreen.tsx",
    "src\screens\EditNoteScreen.tsx", "src\screens\ResultScreen.tsx", "src\screens\FoldersScreen.tsx",
    "src\screens\HistoryScreen.tsx", "src\screens\ScanScreen.fallback.tsx",
    "src\components\StyledMessageModal.tsx", "src\components\QRCodeDetector.tsx", "src\components\ConfidenceHighlighter.tsx",
    "src\lib\supabase.ts", "src\services\api.ts", "src\services\database.ts", "src\services\versioning.ts",
    "src\services\search.ts", "src\services\supabaseSync.ts",
    "src\utils\qrCodeParser.ts", "src\utils\changeTracker.ts", "src\utils\editDistance.ts",
    "src\types\index.ts", "src\assets\.gitkeep",
    "App.tsx", "index.js", "app.json", "babel.config.js", "metro.config.js", "package.json", "tsconfig.json"
)

$scripts = @(
    "sync-images.js", "sync-to-windows.ps1", "sync-wsl-to-windows.ps1", "sync-full-wsl-to-windows.ps1",
    "copy-login-logo-to-images.js", "copy-all-files.ps1", "copy-to-windows.ps1",
    "generate-qr-image.js", "postinstall.js", "sync-to-windows.sh", "README-SYNC.md", "sync-all-to-windows.js", "RUN-SYNC-NOW.md"
)
foreach ($s in $scripts) { $allFiles += "scripts\$s" }
if (Test-Path (Join-Path $wsl "scripts\windows-fixes")) {
    Get-ChildItem (Join-Path $wsl "scripts\windows-fixes") -File | ForEach-Object { $allFiles += "scripts\windows-fixes\$($_.Name)" }
}

$count = 0
foreach ($f in $allFiles) {
    $src = Join-Path $wsl $f
    $dst = Join-Path $win $f
    if (Test-Path $src) {
        $dir = Split-Path $dst -Parent
        if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item $src $dst -Force
        $count++
    }
}
# Mirror entire src and scripts trees so nothing is missed
$trees = @("src", "scripts")
foreach ($tree in $trees) {
    $sw = Join-Path $wsl $tree
    $dw = Join-Path $win $tree
    if (Test-Path $sw) {
        Get-ChildItem -Path $sw -Recurse -File | ForEach-Object {
            $rel = $_.FullName.Substring([string]$sw.Length).TrimStart("\")
            $d = Join-Path $dw $rel
            $parent = Split-Path $d -Parent
            if (!(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
            Copy-Item $_.FullName $d -Force
            $count++
        }
    }
}
Write-Host "Synced $count items. WSL and Windows mobile are in sync."
