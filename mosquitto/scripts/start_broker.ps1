# start_broker.ps1 — Demarre le broker Mosquitto SAI avec la config locale.
#
# Usage :  powershell -ExecutionPolicy Bypass -File scripts\start_broker.ps1
#
# Part le broker en avant-plan (Ctrl+C pour arreter), avec notre config
# versionnee (auth + ACL + TLS 8883). Pre-requis :
#   - mosquitto/passwd   (voir scripts\setup_broker.ps1)
#   - mosquitto/certs/   (voir scripts\gen_certs.ps1)
$ErrorActionPreference = "Stop"

$mosquitto = "$env:ProgramFiles\mosquitto\mosquitto.exe"
if (-not (Test-Path -LiteralPath $mosquitto)) { throw "Mosquitto introuvable : $mosquitto" }

# Chemin de la config (a cote de ce script, racine mosquitto/)
$config = Join-Path $PSScriptRoot "..\mosquitto.conf"
if (-not (Test-Path -LiteralPath $config)) { throw "Config introuvable : $config" }

# Les chemins relatifs de la config sont resolus depuis le dossier mosquitto/
$brokerDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Write-Host "Demarrage du broker Mosquitto SAI (config: $config)..." -ForegroundColor Green
Write-Host "  - listener 8883 (TLS, auth + ACL)"
Write-Host "  (1883 geree par le service Windows — inutilise par SAI)"
Write-Host "Ctrl+C pour arreter." -ForegroundColor Yellow

# Lance en avant-plan depuis le dossier mosquitto/ (reseolution des chemins)
Push-Location $brokerDir
try {
    & $mosquitto -c $config
} finally {
    Pop-Location
}
