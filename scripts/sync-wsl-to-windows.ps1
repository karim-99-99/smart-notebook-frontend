# Sync entire mobile project from WSL to Windows so both versions are identical.
# Run from PowerShell (from any path). Excludes node_modules and build artifacts.
$ErrorActionPreference = "Stop"
$wsl = "\\wsl.localhost\Ubuntu\home\karim\smart-notebook\mobile"
$win = "C:\Users\DELL\SmartNotebook\mobile"

if (-not (Test-Path $wsl)) {
    Write-Error "WSL path not found: $wsl"
    exit 1
}
$winParent = Split-Path $win -Parent
if (-not (Test-Path $winParent)) {
    New-Item -ItemType Directory -Path $winParent -Force
}

# Robocopy: mirror source to dest, exclude large/generated dirs
$excludeDirs = "node_modules", ".gradle", "build", ".expo", "dist", ".git", "android\app\build", "ios\build"
$excludeArgs = $excludeDirs | ForEach-Object { "/XD", $_ }
& robocopy $wsl $win /E /MIR /NFL /NDL /NJH /NJS @excludeArgs /R:2 /W:5

$exitCode = $LASTEXITCODE
# Robocopy: 0=nothing copied, 1=files copied, 2+ = extra (e.g. mismatches). 0-7 are success.
if ($exitCode -ge 8) {
    Write-Error "Robocopy failed with exit code $exitCode"
    exit $exitCode
}
Write-Host "Sync complete. WSL and Windows mobile folders are in sync. (Robocopy exit: $exitCode)"
exit 0
