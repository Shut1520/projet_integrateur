# Lancement des services SAI — Procedure complete

Ce document decrit **l'ordre exact** pour demarrer tous les services du projet SAI,
de zero, pour permettre la communication ESP32 <-> Backend <-> BD.

---

## 1. Pre-requis (une seule fois)

### 1.1 Installer Mosquitto

```powershell
winget install EclipseFoundation.Mosquitto
```

Verifier l'installation :
```powershell
& "C:\Program Files\mosquitto\mosquitto.exe" -h
```

### 1.2 Installer OpenSSL (via Git)

OpenSSL est utilise pour generer les certificats TLS. Il est inclus dans Git :
```
C:\Program Files\Git\mingw64\bin\openssl.exe
```

### 1.3 Installer Python 3.12+ et PostgreSQL

- Python 3.12+ avec pip
- PostgreSQL actif sur le port 5432

### 1.4 Installer Node.js (pour le frontend)

```powershell
node -v   # verifier l'installation
npm -v
```

### 1.5 Installer PlatformIO (pour l'ESP32)

```powershell
pip install platformio
```

---

## 2. Setup initial (une seule fois)

### 2.1 Generer la PKI TLS + users MQTT

Depuis le dossier `projet_integrateur/` :
```powershell
powershell -ExecutionPolicy Bypass -File mosquitto\scripts\setup_broker.ps1
```

Cela cree :
- `mosquitto/certs/mosquitto_ca.crt` (CA racine)
- `mosquitto/certs/mosquitto_server.crt` (certificat serveur)
- `mosquitto/certs/mosquitto_server.key` (cle privee serveur)
- `mosquitto/passwd` (3 utilisateurs : sai_backend, sai_esp32, sai_frontend)

### 2.2 Initialiser la base de donnees

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python init_db.py --drop --seed
```

### 2.3 Creer la clé API ESP32

1. Demarrer le backend (voir etape 3.2)
2. Ouvrir le frontend (voir etape 3.3)
3. Se connecter en tant que **admin** (admin@sai.com / admin123)
4. Aller dans **Profil** -> section **"Cles d'API"**
5. Cliquer sur **+** -> entrer un nom (ex: "ESP32 Serre A") -> **Generer**
6. **Copier la cle** `sk_sai_...` (affichee une seule fois)

### 2.4 Configurer l'ESP32

```powershell
cd Iot
cp include/config.h.example include/config.h
```

Editer `include/config.h` et remplir :
```c
#define WIFI_SSID            "VOTRE_RESEAU_WIFI"
#define WIFI_PASSWORD        "VOTRE_MOT_DE_PASSE"
#define BROKER_HOST          "192.168.1.10"    // IP du PC hote
#define BROKER_PORT          8883
#define BROKER_USER          "sai_esp32"
#define BROKER_PASS          "sai_esp32_pass"
#define API_BASE             "http://192.168.1.10:8000/api"
#define API_KEY              "sk_sai_...copier_ici..."
#define PARCELLE             "Serre A"
```

> **Note** : La cle API peut aussi etre stockee en NVS (flash) sans reflash
> via `config_store_set_cle_api()` dans le firmware.

---

## 3. Ordre de demarrage normal

### 3.0 Arrêter le service Windows Mosquitto (si actif)

Le service Windows Mosquitto utilise le port 1883. Il peut creer des conflits.
Arreter-le avant de demarrer le broker SAI :

```powershell
Stop-Service -Name "Mosquitto"
```

Pour le reactiver apres (optionnel) :
```powershell
Start-Service -Name "Mosquitto"
```

### 3.1 Demarrer le broker Mosquitto (SAI)

**Terminal 1** — Depuis le dossier `projet_integrateur/` :
```powershell
powershell -ExecutionPolicy Bypass -File mosquitto\scripts\start_broker.ps1
```

**Alternative directe** (si le script pose probleme) :
```powershell
& "C:\Program Files\mosquitto\mosquitto.exe" -c "B:\...\projet_integrateur\mosquitto\mosquitto.conf" -d
```

Le broker demarre en arriere-plan (mode daemon `-d`) sur :
- **Port 8883** (MQTT/TLS) -> ESP32 / backend
- **Port 9001** (WebSocket) -> frontend web (temps reel)

Verifier que le broker ecoute :
```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 8883,9001 }
```

#### Diagnostic erreur `start_broker.ps1` (corrigee le 2026-09-06)

Le script affichait :
```
Jeton inattendu " " dans l'expression ou l'instruction
Le terminateur " est manquant dans la chaine
```

**Cause** : le fichier contenait des octets UTF-8 corrompus sur la ligne 24. Le caractere `—` (em-dash, U+2014) avait ete **double-encode** en UTF-8 : au lieu de `E2 80 94` (3 octets), le fichier contenait `C3 A2 E2 80 9D` (5 octets, = `â` + `"` droit U+201D). Le parser PowerShell ne trouvait plus le `"` fermant de la chaine `Write-Host "..."` et declenchait l'erreur.

**Fix** : reecriture du fichier en ASCII pur (remplacement de `—` par des tirets simples, suppression des caracteres non-ASCII). Le script fonctionne a present.

### 3.2 Demarrer le backend FastAPI

**Terminal 2** — Depuis `projet_integrateur/backend/` :
```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

Le backend demarre sur :
- **http://localhost:8000** (API REST)
- **http://localhost:8000/docs** (Swagger UI)

Au demarrage, le backend lance automatiquement :
- Le **subscriber MQTT** (thread daemon) -> ecoute `sai/+/capteurs/#`
- La **boucle d'automatisation** (thread daemon) -> evalue les seuils toutes les 5 min

### 3.3 Demarrer le frontend React

**Terminal 3** — Depuis `projet_integrateur/frontend/` :
```powershell
cd frontend
npm install
npm run dev
```

Le frontend demarre sur :
- **http://localhost:3000** (Vite)

Le frontend se connecte automatiquement au broker MQTT via WebSocket :
- **ws://localhost:9001** (user `sai_frontend`)
- Souscrit aux topics : `sai/+/alertes`, `sai/+/capteurs/#`, `sai/+/actionneurs/#`

### 3.4 (Optionnel) Demarrer le simulateur ESP32

Si vous n'avez pas de vrai ESP32, utiliser le simulateur :

**Terminal 4** — Depuis `projet_integrateur/backend/` :
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python scripts/mqtt_simulateur.py --parcelle "Serre A" --interval 5
```

Le simulateur publie des mesures MQTT toutes les 5 secondes sur :
- `sai/Serre A/capteurs/telemetrie`
- `sai/Serre A/alertes` (toutes les 60 secondes)

### 3.5 Demarrer l'ESP32 physique

Avoir l'ESP32 branche en USB :

**Terminal 4** — Depuis `projet_integrateur/Iot/` :
```powershell
cd Iot
pio run --target upload
pio device monitor --baud 115200
```

---

## 4. Arret des services

Arreter dans l'ordre inverse :

### 4.1 Arreter l'ESP32 / simulateur
- Ctrl+C dans le terminal du simulateur
- Ou debrancher l'ESP32

### 4.2 Arreter le frontend
- Ctrl+C dans le terminal du frontend

### 4.3 Arreter le backend
- Ctrl+C dans le terminal du backend

### 4.4 Arreter le broker Mosquitto
```powershell
powershell -ExecutionPolicy Bypass -File mosquitto\scripts\stop_broker.ps1
```

### 4.5 (Optionnel) Reactiver le service Windows Mosquitto
```powershell
Start-Service -Name "Mosquitto"
```

---

## 5. Verification du fonctionnement

### 5.1 Tester la connexion MQTT

Subscriber manuel sur tous les topics SAI :
```powershell
& "C:\Program Files\mosquitto\mosquitto_sub.exe" -h localhost -p 8883 `
  --cafile mosquitto/certs/mosquitto_ca.crt `
  -u sai_backend -P sai_backend_pass `
  -t "sai/#" -v
```

### 5.2 Tester la publication MQTT

Publisher d'un message de test :
```powershell
& "C:\Program Files\mosquitto\mosquitto_pub.exe" -h localhost -p 8883 `
  --cafile mosquitto/certs/mosquitto_ca.crt `
  -u sai_esp32 -P sai_esp32_pass `
  -t "sai/Serre A/capteurs/telemetrie" `
  -m '{"device_id":"test","temperature":25.5,"humidite_sol":42}' `
  -q 1
```

### 5.3 Tester l'API backend

```powershell
# Health check
curl http://localhost:8000/

# Swagger UI
Start-Process "http://localhost:8000/docs"
```

### 5.4 Tester le frontend

Ouvrir http://localhost:3000 dans le navigateur.

---

## 6. Depannage

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Address already in use` | Broker deja en cours d'execution | `stop_broker.ps1` d'abord, puis relancer |
| `passwd introuvable` | Fichier passwd non genere | Relancer `setup_broker.ps1` |
| `cert introuvable` | Certificats TLS non generes | Relancer `gen_certs.ps1` |
| `Connection refused` (MQTT) | Broker non demarre | Demarrer le broker (3.1) |
| `401 Unauthorized` (API) | Cle API invalide/expiree | Creer une nouvelle cle via Profil |
| `500 Internal Server Error` | BD non initialisee | `python init_db.py --drop --seed` |
| Frontend non connecte | MQTT WebSocket down | Verifier que le broker ecoute sur 9001 |
| ESP32 non connecte | WiFi ou MQTT KO | Verifier `config.h` (SSID, password, broker) |

---

## 7. Ports utilises

| Port | Protocole | Service | Utilisateurs |
|------|-----------|---------|--------------|
| **8883** | MQTT/TLS | Broker SAI | sai_backend, sai_esp32 |
| **9001** | WebSocket | Broker SAI | sai_frontend |
| **8000** | HTTP | Backend FastAPI | Tous (JWT + cle API) |
| **3000** | HTTP | Frontend React | Utilisateurs web |
| **5432** | PostgreSQL | Base de donnees | sai_user |
| **1883** | MQTT (defaut) | Service Windows | Inutilise par SAI |

---

## 8. Comptes et credentials

### MQTT (broker Mosquitto)
| Utilisateur | Mot de passe | Role |
|-------------|--------------|------|
| `sai_backend` | `sai_backend_pass` | Subscriber backend + publisher alertes |
| `sai_esp32` | `sai_esp32_pass` | Publisher ESP32 (mesures + alertes) |
| `sai_frontend` | `sai_frontend_pass` | Frontend web (lecture temps reel) |

### Base de donnees PostgreSQL
| Utilisateur | Mot de passe | Base |
|-------------|--------------|------|
| `sai_user` | `sai_password` | `sai_db` |
| `postgres` | `EMMA050220` | Superuser |

### Application web
| Email | Mot de passe | Role |
|-------|--------------|------|
| `admin@sai.com` | `admin123` | Administrateur |
| `emmanuel@sai.com` | `emmanuel123` | Agriculteur |
