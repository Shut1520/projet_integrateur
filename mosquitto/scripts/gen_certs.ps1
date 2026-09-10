# gen_certs.ps1 — Genere la PKI autosignee du broker Mosquitto (dev).
# Produit dans mosquitto/certs/ :
#   - mosquitto_ca.crt        (CA racine, a embarquer cote ESP32/subscriber)
#   - mosquitto_server.crt    (certificat serveur)
#   - mosquitto_server.key    (cle privee serveur — @ local uniquement)
# Reexecuter ce script regenere tout (idempotent).
#
# Requirements : OpenSSL (Git for Windows) + config.cnf genere dynamiquement.
$openssl = "C:\Program Files\Git\mingw64\bin\openssl.exe"
if (-not (Test-Path -LiteralPath $openssl)) { throw "OpenSSL introuvable : $openssl" }

# Repertoire cible = mosquitto/certs (a cote de ce script)
$certs = Join-Path $PSScriptRoot "..\certs"
New-Item -ItemType Directory -Path $certs -Force | Out-Null

# Fichiers temporaires de config
$caCnf   = Join-Path $certs "ca_ext.cnf"
$srvExt  = Join-Path $certs "server_ext.cnf"

# --- Parametres PKI ---
$caKey  = Join-Path $certs "mosquitto_ca.key"
$caCrt  = Join-Path $certs "mosquitto_ca.crt"
$srvKey = Join-Path $certs "mosquitto_server.key"
$srvCsr = Join-Path $certs "mosquitto_server.csr"
$srvCrt = Join-Path $certs "mosquitto_server.crt"

# --- [1/5] Config CA avec extensions critiques (requis par mbedTLS) ---
Write-Host "[1/5] Config CA (basicConstraints + keyUsage)..."
@"
[req]
distinguished_name = req_dn
x509_extensions = v3_ca
prompt = no

[req_dn]
CN = SAI-Mosquitto-CA

[v3_ca]
basicConstraints = critical, CA:TRUE
keyUsage = critical, keyCertSign, cRLSign
subjectKeyIdentifier = hash
"@ | Set-Content -Path $caCnf -Encoding ASCII

# --- [2/5] CA racine avec extensions ---
Write-Host "[2/5] CA racine..."
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
& $openssl req -x509 -newkey rsa:2048 -nodes `
    -keyout $caKey -out $caCrt -days 3650 `
    -config $caCnf 2>$null | Out-Null
$ErrorActionPreference = $prevEAP
if (-not (Test-Path -LiteralPath $caCrt)) { throw "Echec generation CA" }

# --- [3/5] Cle + CSR serveur ---
Write-Host "[3/5] Cle + CSR serveur..."
# Detection de l'IP locale (hors loopback)
$localIP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $localIP) { $localIP = "172.20.10.2" }

Write-Host "   IP detectee : $localIP"
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
& $openssl req -newkey rsa:2048 -nodes `
    -keyout $srvKey -out $srvCsr `
    -subj "/CN=$localIP" 2>$null | Out-Null
$ErrorActionPreference = $prevEAP
if (-not (Test-Path -LiteralPath $srvCsr)) { throw "Echec generation CSR" }

# --- [4/5] Extensions SAN (IP locale + localhost) ---
Write-Host "[4/5] Extensions SAN (DNS:localhost, IP:127.0.0.1, IP:$localIP)..."
@"
subjectAltName = DNS:localhost, IP:127.0.0.1, IP:$localIP
extendedKeyUsage = serverAuth
"@ | Set-Content -Path $srvExt -Encoding ASCII

# --- [5/5] Signature du certificat serveur par la CA ---
Write-Host "[5/5] Signature du certificat serveur par la CA..."
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
& $openssl x509 -req -in $srvCsr -CA $caCrt -CAkey $caKey `
    -CAcreateserial -out $srvCrt -days 825 `
    -extfile $srvExt 2>$null | Out-Null
$ErrorActionPreference = $prevEAP
if (-not (Test-Path -LiteralPath $srvCrt)) { throw "Echec signature certificat" }

# Nettoyage intermediaires
Remove-Item -LiteralPath $srvCsr, $srvExt, $caCnf, "$caCrt.srl" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Certificats generes dans $certs" -ForegroundColor Green
Write-Host "  CA    : mosquitto_ca.crt"
Write-Host "  Server: mosquitto_server.crt / mosquitto_server.key"
Write-Host "  IP    : $localIP (detectee automatiquement)"