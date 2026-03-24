# Stops Node/Metro (or other non-svchost) listening on the given port.
# Default 8082 - matches package.json "start" (8081 often used by Windows svchost).
param(
  [int] $Port = 8082
)
$ErrorActionPreference = 'SilentlyContinue'
$conns = Get-NetTCPConnection -LocalPort $Port -State Listen
if (-not $conns) {
  Write-Host "Nothing is listening on port $Port."
  exit 0
}
$pids = $conns.OwningProcess | Sort-Object -Unique
foreach ($p in $pids) {
  $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
  $name = if ($proc) { $proc.ProcessName } else { "?" }
  if ($name -eq "svchost") {
    Write-Host "Port $Port is used by svchost (PID $p) - Windows service. Do not kill it."
    Write-Host "Switch stack to 8082: gradle.properties REACT_NATIVE_DEV_SERVER_PORT=8082 + package.json ports + adb reverse 8082."
    exit 1
  }
  try {
    Stop-Process -Id $p -Force
    Write-Host "Stopped $name (PID $p) on port $Port"
  } catch {
    Write-Host "Could not stop PID $p : $_"
    exit 1
  }
}
Write-Host ('Done. Run: npm run start' + '  (or: npx react-native start --host 0.0.0.0 --port ' + $Port + ' --reset-cache)')
