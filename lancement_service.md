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
#define BROKER_HOST          "192.168.1.10"    // IP du PC hote (hotspot)
#define BROKER_PORT          8883
#define BROKER_USER          "sai_esp32"
#define BROKER_PASS          "sai_esp32_pass"
#define API_BASE             "http://192.168.1.10:8000/api"
#define API_KEY              "sk_sai_...copier_ici..."
#define PARCELLE             "Serre A"
#define DEVICE_ID            "esp32_01"
```

> **Note** : La cle API peut aussi etre stockee en NVS (flash) sans reflash
> via `config_store_set_cle_api()` dans le firmware.

> **Important** : `BROKER_HOST` et `API_BASE` doivent pointer vers l'IP
> du hotspot de la machine (ex: `172.20.10.2`). Verifier avec `ipconfig`
> avant chaque demarrage. Si l'IP change, reflasher l'ESP32.

---

## 3. Ordre de demarrage normal

> **Avant de demarrer** : lire les erreurs ci-dessous. Ce sont les pieges
> les plus frequents, documentes lors des sessions de test.

### 3.A Erreurs a eviter (CRITIQUE)

| # | Erreur | Symptome | Cause | Fix |
|---|--------|----------|-------|-----|
| **1** | **Backend sans `--host 0.0.0.0`** | Commandes ESP32 bloquees a `envoyee` ; `GET /api/commandes/attente` refuse | `uvicorn main:app` (sans `--host`) lie sur `127.0.0.1:8000` uniquement. L'ESP32 (172.20.10.3) ne peut pas joindre `172.20.10.2:8000`. | Utiliser `python -m uvicorn main:app --host 0.0.0.0 --port 8000` OU `python main.py` (deja configure avec `host="0.0.0.0"`) |
| **2** | **Python 3.14 pour les tests** | `AttributeError: module 'sqlalchemy' has no attribute '__firstlineno__'` | Python 3.14 incompatible avec SQLAlchemy <2.0.25 | Utiliser le venv backend (Python 3.12) : `C:\Users\gilwa\AppData\Local\Programs\Python\Python312\python.exe` |
| **3** | **Deux uvicorn en meme temps** | `Address already in use :8000` OU commandes traitees par le mauvais process | Deux terminaux backend avec `--reload` = 2 process | Fermer tous les terminaux backend avant de relancer. `Stop-Process -Name python -Force` si necessaire |
| **4** | **Broker arrete avant le backend** | Subscriber MQTT reconnexion en boucle (backoff 2-60s) | Le broker n'ecoute pas encore sur 8883 | Demarrer le broker (3.1) **avant** le backend (3.2) |
| **5** | **Simulateur avec mauvais user MQTT** | `PUBACK rc135` (autorisation refusee) | Simulateur connecte en `sai_backend` au lieu de `sai_esp32` | Utiliser `--user sai_esp32 --pass sai_esp32_pass` |
| **6** | **`stop_broker.ps1` tue le service Windows** | Service Windows Mosquitto (1883) arrete | `stop_broker.ps1` fait `Get-Process -Name mosquitto` et tue tout | Preferer **Ctrl+C** dans le terminal du broker (au lieu de `stop_broker.ps1`) |
| **7** | **IP hotspot differente** | ESP32 ne repond plus, timeout HTTP | `config.h` contient l'IP du hotspot (172.20.10.2). Si le hotspot change, l'ESP32 ne peut plus joindre le backend. | Verifier l'IP du hotspot avant chaque demarrage (`ipconfig`) et reflasher si necessaire |

### 3.0 Verifier PostgreSQL (port 5432)

PostgreSQL doit ecouter sur le port 5432 **avant** de lancer le backend.

```powershell
Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
```

Si rien ne s'affiche, demarrer le service :
```powershell
Start-Service -Name "postgresql-x64-18"
```

### 3.1 Demarrer le broker Mosquitto (SAI)

**Terminal 1** — Depuis le dossier `projet_integrateur/` :
```powershell
powershell -ExecutionPolicy Bypass -File mosquitto\scripts\start_broker.ps1
```

Le broker demarre en **avant-plan** (Ctrl+C pour arreter) sur :
- **Port 8883** (MQTT/TLS) -> ESP32 / backend
- **Port 9001** (WebSocket) -> frontend web (temps reel)

Verifier que le broker ecoute :
```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 8883,9001 }
```

> **Attention** : `stop_broker.ps1` tue **tous** les processus `mosquitto.exe`,
> y compris le service Windows (port 1883). Apres arret du broker SAI,
> le service Windows se relance automatiquement si ses dependencies le necessitent.
> Pour eviter ce conflit, preferer **Ctrl+C** dans le terminal du broker
> (au lieu de `stop_broker.ps1`).

#### Service Windows Mosquitto (port 1883)

Le service Windows Mosquitto ecoute sur le port **1883** (config par defaut).
**Ce port n'est PAS utilise par SAI** (notre config utilise 8883 + 9001).
Le service peut rester actif sans conflit. Si besoin de l'arreter :
```powershell
Stop-Service -Name "Mosquitto"
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
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

> **CRITIQUE** : `--host 0.0.0.0` est **obligatoire**. Sans cette option,
> uvicorn lie sur `127.0.0.1` uniquement et l'ESP32 (sur le hotspot 172.20.10.x)
> ne peut plus joindre le backend → commandes bloquees a `envoyee`.
> Voir erreur #1 dans la section **3.A Erreurs a eviter**.

> **Alternative** : `python main.py` (egalement configure avec `host="0.0.0.0"`).
> Ne pas utiliser `--reload` en presentation (crée 2 process = conflit port).

Le backend demarre sur :
- **http://0.0.0.0:8000** (API REST, accessible depuis le reseau local)
- **http://localhost:8000/docs** (Swagger UI)

Verifier que le backend ecoute :
```powershell
Get-NetTCPConnection -LocalPort 8000 -State Listen
```
Doit afficher `0.0.0.0:8000 LISTENING` (et NON `127.0.0.1:8000`).

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
python scripts/mqtt_simulateur.py --parcelle "Serre A" --interval 5 --user sai_esp32 --pass sai_esp32_pass
```

> **Attention** : utiliser `--user sai_esp32` (pas `sai_backend`).
> `sai_backend` n'a pas le droit de publier sur `sai/+/capteurs/#` -> `PUBACK rc135`.

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

### 5.5 Verification E2E (commande ESP32)

Verifie que la chaine complete fonctionne : Backend -> MQTT -> ESP32 -> actionneur.

1. Ouvrir Swagger UI : http://localhost:8000/docs
2. Creer une commande : `POST /api/commandes` avec `{"id_actionneur": 37, "type_action": "on"}`
3. Verifier le statut : `GET /api/commandes/attente` avec cle API
   - Si la reponse contient la commande avec `statut: "envoyee"` -> **OK**
   - Si `401` ou `403` -> revoir la cle API (section 2.3)
4. Sur le moniteur serie ESP32, verifier :
   - `[http] cmd#XXX recue (rc=200)` -> le firmware recoit la commande
   - `[actuators] eclairage ON` -> l'actionneur s'active
5. Verifier dans Swagger : `GET /api/commandes` -> la commande passe a `executee`

> **Si la commande reste a `envoyee`** : le backend est probablement lie
> a `127.0.0.1` (erreur #1). Relancer avec `--host 0.0.0.0`.

---

## 6. Depannage

| Erreur | Cause | Solution |
|--------|-------|----------|
| **Commande reste a `envoyee`** | Backend lie sur `127.0.0.1` (pas `0.0.0.0`) | Relancer avec `--host 0.0.0.0` (voir 3.2 et erreur #1) |
| **`PUBACK rc135`** (simulateur) | Mauvais user MQTT (`sai_backend` au lieu de `sai_esp32`) | Utiliser `--user sai_esp32 --pass sai_esp32_pass` |
| **`AttributeError: __firstlineno__`** | Python 3.14 incompatible SQLAlchemy | Utiliser le venv backend (Python 3.12) |
| `Address already in use` | Deux uvicorn en meme temps | `Stop-Process -Name python -Force` puis relancer |
| `Connection refused` (MQTT) | Broker non demarre | Demarrer le broker (3.1) avant le backend |
| `Connection refused` (8000) | Backend non demarre ou lie sur 127.0.0.1 | Verifier `0.0.0.0:8000` avec `netstat` |
| `401 Unauthorized` (API) | Cle API invalide/expiree | Creer une nouvelle cle via Profil |
| `500 Internal Server Error` | BD non initialisee | `python init_db.py --drop --seed` |
| Frontend non connecte | MQTT WebSocket down | Verifier que le broker ecoute sur 9001 |
| ESP32 non connecte | WiFi ou MQTT KO | Verifier `config.h` (SSID, password, broker, IP hotspot) |
| ESP32 connecte mais pas de donnees | Broker actif mais backend arrete | Demarrer le backend (3.2) apres le broker |
| `passwd introuvable` | Fichier passwd non genere | Relancer `setup_broker.ps1` |
| `cert introuvable` | Certificats TLS non generes | Relancer `gen_certs.ps1` |

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
