# setup_broker.ps1 — Pre-requis du broker Mosquitto SAI (a executer une fois).
#
# 1. Genere la PKI TLS (certs/).
# 2. Cree le fichier de mots de passe (passwd) avec les utilisateurs.
#
# Usage : powershell -ExecutionPolicy Bypass -File scripts\setup_broker.ps1
$ErrorActionPreference = "Stop"

$mosquittoExe  = "$env:ProgramFiles\mosquitto\mosquitto.exe"
$passwdExe     = "$env:ProgramFiles\mosquitto\mosquitto_passwd.exe"
if (-not (Test-Path -LiteralPath $mosquittoExe)) { throw "Mosquitto introuvable : $mosquittoExe" }
if (-not (Test-Path -LiteralPath $passwdExe)) { throw "mosquitto_passwd introuvable : $passwdExe" }

$scriptsDir = $PSScriptRoot
$brokerDir  = Join-Path $scriptsDir ".."
$passwdFile = Join-Path $brokerDir "passwd"

# 1) Certificats TLS
Write-Host "[1/2] Generation de la PKI TLS..." -ForegroundColor Green
& (Join-Path $scriptsDir "gen_certs.ps1")

# 2) Fichier de mots de passe (regeneré a chaque setup)
Write-Host "[2/2] Mots de passe Mosquitto..." -ForegroundColor Green
$jobs = @(
    @{ user = "sai_backend";  pass = "sai_backend_pass" },
    @{ user = "sai_esp32";    pass = "sai_esp32_pass" },
    @{ user = "sai_frontend"; pass = "sai_frontend_pass" }
)

# Creation -c puis -b pour ajouter/apdater (methodes via le .exe)
$first = $true
foreach ($j in $jobs) {
    if ($first) {
        & $passwdExe -c -b $passwdFile $j.user $j.pass
        $first = $false
    } else {
        & $passwdExe -b $passwdFile $j.user $j.pass
    }
    Write-Host "   -> utilisateur ajoute : $($j.user)"
}

Write-Host ""
Write-Host "Setup termine." -ForegroundColor Green
Write-Host "Pour demarrer : scripts\start_broker.ps1"
