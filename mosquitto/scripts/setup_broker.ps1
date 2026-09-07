# setup_broker.ps1 — Pre-requis du broker Mosquitto SAI (a executer une fois).
#
# 1. Genere la PKI TLS (certs/).
# 2. Cree le fichier de mots de passe (passwd) avec les utilisateurs.
#
# Options :
#   -Dev     Utilise des mots de passe par defaut (pour le developpement)
#   -Prod    Genere des mots de passe aleatoires (defaut)
#
# Usage :
#   powershell -ExecutionPolicy Bypass -File scripts\setup_broker.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\setup_broker.ps1 -Dev
param(
    [switch]$Dev,
    [switch]$Prod
)
$ErrorActionPreference = "Stop"

$mosquittoExe  = "$env:ProgramFiles\mosquitto\mosquitto.exe"
$passwdExe     = "$env:ProgramFiles\mosquitto\mosquitto_passwd.exe"
if (-not (Test-Path -LiteralPath $mosquittoExe)) { throw "Mosquitto introuvable : $mosquittoExe" }
if (-not (Test-Path -LiteralPath $passwdExe)) { throw "mosquitto_passwd introuvable : $passwdExe" }

$scriptsDir = $PSScriptRoot
$brokerDir  = Join-Path $scriptsDir ".."
$passwdFile = Join-Path $brokerDir "passwd"

# Fonction : generer un mot de passe aleatoire
function New-RandomPass {
    param([int]$Length = 16)
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    -join ((0..($Length - 1)) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

# 1) Certificats TLS
Write-Host "[1/2] Generation de la PKI TLS..." -ForegroundColor Green
& (Join-Path $scriptsDir "gen_certs.ps1")

# 2) Fichier de mots de passe (regenere a chaque setup)
Write-Host "[2/2] Mots de passe Mosquitto..." -ForegroundColor Green

if ($Dev) {
    $passBackend  = "sai_backend_pass"
    $passEsp32    = "sai_esp32_pass"
    $passFrontend = "sai_frontend_pass"
    Write-Host "   Mode DEV : mots de passe par defaut" -ForegroundColor Yellow
} else {
    $passBackend  = New-RandomPass
    $passEsp32    = New-RandomPass
    $passFrontend = New-RandomPass
    Write-Host "   Mode PROD : mots de passe generes aleatoirement" -ForegroundColor Yellow
}

$jobs = @(
    @{ user = "sai_backend";  pass = $passBackend },
    @{ user = "sai_esp32";    pass = $passEsp32 },
    @{ user = "sai_frontend"; pass = $passFrontend }
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
Write-Host ""
Write-Host "Mots de passe (a sauvegarder si mode PROD) :" -ForegroundColor Yellow
Write-Host "  sai_backend  : $passBackend"
Write-Host "  sai_esp32    : $passEsp32"
Write-Host "  sai_frontend : $passFrontend"
Write-Host ""
Write-Host "Pour demarrer : scripts\start_broker.ps1"
