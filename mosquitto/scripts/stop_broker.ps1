# stop_broker.ps1 — Arrete le broker Mosquitto SAI.
#
# Met fin au processus mosquitto demarre par start_broker.ps1.
# Usage : powershell -ExecutionPolicy Bypass -File scripts\stop_broker.ps1
$ErrorActionPreference = "SilentlyContinue"

$procs = Get-Process -Name mosquitto -ErrorAction SilentlyContinue
if (-not $procs) {
    Write-Host "Aucun processus mosquitto en cours." -ForegroundColor Yellow
    exit 0
}

foreach ($p in $procs) {
    Stop-Process -Id $p.Id -Force
    Write-Host "Broker arrete (PID $($p.Id))." -ForegroundColor Green
}
