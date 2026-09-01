# gen_certs.ps1 — Genere la PKI autosignee du broker Mosquitto (dev).
# Produit dans mosquitto/certs/ :
#   - mosquitto_ca.crt        (CA racine, a embarquer cote ESP32/subscriber)
#   - mosquitto_server.crt    (certificat serveur)
#   - mosquitto_server.key    (cle privee serveur — @ local uniquement)
# Reexecuter ce script regenere tout (idempotent).
$openssl = "C:\Program Files\Git\mingw64\bin\openssl.exe"
if (-not (Test-Path -LiteralPath $openssl)) { throw "OpenSSL introuvable : $openssl" }

# Repertoire cible = mosquitto/certs (a cote de ce script)
$certs = Join-Path $PSScriptRoot "..\certs"
New-Item -ItemType Directory -Path $certs -Force | Out-Null

# Parametres PKI
$caKey  = Join-Path $certs "mosquitto_ca.key"
$caCrt  = Join-Path $certs "mosquitto_ca.crt"
$srvKey = Join-Path $certs "mosquitto_server.key"
$srvCsr = Join-Path $certs "mosquitto_server.csr"
$srvCrt = Join-Path $certs "mosquitto_server.crt"
$srvExt = Join-Path $certs "server_ext.cnf"

Write-Host "[1/4] CA racine..."
& $openssl req -x509 -newkey rsa:2048 -nodes `
    -keyout $caKey -out $caCrt -days 3650 `
    -subj "/CN=SAI-Mosquitto-CA" 2>$null | Out-Null
if (-not (Test-Path -LiteralPath $caCrt)) { throw "Echec generation CA" }

Write-Host "[2/4] Cle + CSR serveur..."
& $openssl req -newkey rsa:2048 -nodes `
    -keyout $srvKey -out $srvCsr `
    -subj "/CN=localhost" 2>$null | Out-Null
if (-not (Test-Path -LiteralPath $srvCsr)) { throw "Echec generation CSR" }

Write-Host "[3/4] Extension SAN (localhost / 127.0.0.1)..."
@"
subjectAltName = DNS:localhost, IP:127.0.0.1
extendedKeyUsage = serverAuth
"@ | Set-Content -Path $srvExt

Write-Host "[4/4] Signature du certificat serveur par la CA..."
& $openssl x509 -req -in $srvCsr -CA $caCrt -CAkey $caKey `
    -CAcreateserial -out $srvCrt -days 825 `
    -extfile $srvExt 2>$null | Out-Null
if (-not (Test-Path -LiteralPath $srvCrt)) { throw "Echec signature certificat" }

# Nettoyage intermediaires
Remove-Item -LiteralPath $srvCsr, $srvExt -ErrorAction SilentlyContinue

Write-Host "Certificats generes dans $certs"
Write-Host "  CA    : mosquitto_ca.crt"
Write-Host "  Server: mosquitto_server.crt / mosquitto_server.key"