# Interface ESP32 ←→ SAI

Contrat d'interface entre le microcontrôleur **ESP32** et le backend **SAI**.
Il définit les échanges : **clé API**, **MQTT** (ingestion mesures) et **HTTP REST** (workflow commandes).

> Établi — Phase 3 (authentification par clé API). Ce document est la référence pour implémenter le firmware.

---

## 1. Vue d'ensemble

| Couche | Rôle | Transport |
|--------|------|-----------|
| **Ingestion des mesures** | ESP32 → backend | **MQTT** (subscriber backend, TLS 8883) |
| **Workflow commandes** (pull) | ESP32 ↔ backend | **HTTP REST** (clé API) |
| **Confirmation/actions** | ESP32 → backend | **HTTP REST** (clé API) |

Deux canaux complémentaires :
- **MQTT** = pousser un grand volume de mesures (léger, continue) → le subscriber backend insère les `Mesure` en BD.
- **HTTP** = récupérer les commandes en attente et rendre compte de leur exécution (workflow pull/confirm).

---

## 2. Authentification du microcontrôleur

L'ESP32 s'authentifie par une **clé API** (table `tokens`, format `sk_sai_<hex>`).

- Création : côté admin (`POST /api/tokens`, ou seed → 1 clé `sk_sai_...` créée au seed).
- Transmission : **header `X-API-Key: sk_sai_...`** (recommandé pour l'ESP32) ou query `?api_key=...`.
- Validation serveur : clé présente, **active** (`actif=true`) et **non expirée** (`expires_at`). Chaque appel met à jour `last_used_at`.

> ⚠️ Une clé est **personnelle** : ne pas la partager. Stocker la clé dans une EEPROM/flash du microcontrôleur, jamais en clair dans le code source.

### Endpoints protégés par clé API

| Méthode | Path | Accès |
|---------|------|-------|
| POST | `/api/mesures` | **Clé API uniquement** (plus public) |
| GET | `/api/commandes/attente` | **Clé API uniquement** |
| PUT | `/api/commandes/{id}` | Clé API **ou** JWT |
| POST | `/api/actions` | Clé API **ou** JWT |
| PUT | `/api/actions/{id}` | Clé API **ou** JWT |

---

## 3. MQTT — ingestion des mesures

### 3.1 Broker

| Paramètre | Valeur |
|-----------|--------|
| Hôte | `localhost` (dev) / IP du serveur (prod) |
| Port | **8883** (TLS) |
| TLS | Requis (CA : `mosquitto/certs/mosquitto_ca.crt`) |
| Auth | user + mot de passe Mosquitto (`mosquitto/mosquitto.conf`, ACL) |
| QoS | **1** |

### 3.2 Topics

| Topic | Direction | Contenu |
|-------|-----------|---------|
| `sai/<parcelle>/capteurs/<sous-type>` | ESP32 → broker | Données capteurs |
| `sai/<parcelle>/actionneurs/<nom>` | (statut actionneur) | État actionneur |
| `sai/<parcelle>/alertes` | (alertes) | Événements d'alerte |

`<parcelle>` = nom/identifiant de la parcelle (ex. `serre-a`), `<sous-type>` = type de mesure.

### 3.3 Payload JSON (multi-mesures)

Un seul message peut porter plusieurs mesures (0..n) :

```json
{
  "device_id": "esp32_01",
  "parcelle": "serre-a",
  "timestamp": "2026-09-01T10:15:30Z",
  "temperature": 26.5,
  "humidite_sol": 42.3,
  "co2": 820,
  "luminosite": 1800,
  "niveau_eau": 75
}
```

- Une **`Mesure`** est insérée **par clé numérique** présente dans le payload.
- Chaque clé est mappée à un capteur de la parcelle (`temperature→dht22`, `humidite_sol→yl-69`, `co2→sen0159`, `luminosite→bh1750`, `niveau_eau→niveau_eau`).
- L'unité par défaut est prise du mapping (survoltable par une clé `unite` facultative).
- Les clés non numériques (`device_id`, `parcelle`, `timestamp`, `unite`) sont ignorées comme mesures.
- `timestamp` : ISO 8601 (le serveur applique `now()` si absent).

---

## 4. HTTP — workflow commandes (pull/confirm)

Cycle de vie d'une commande : `envoyee → recue → executee` (ou `echouee`).

### 4.1 Récupérer les commandes en attente

```
GET /api/commandes/attente
X-API-Key: sk_sai_...
```

Réponse `200` — tableau des commandes **`envoyee`** (les plus anciennes d'abord, FIFO) :

```json
[
  {
    "id": 42,
    "type_action": "on",
    "valeur_parametre": "30",
    "source": "web",
    "timestamp": "2026-09-01T10:15:00Z",
    "statut": "envoyee",
    "id_utilisateur": 2,
    "id_actionneur": 12
  }
]
```

> L'ESP32 doit **interroger cet endpoint périodiquement** (par ex. toutes les 2–5 s) et exécuter chaque commande sortie.

### 4.2 Confirmer la réception

```
PUT /api/commandes/{id}
X-API-Key: sk_sai_...

{ "statut": "recue" }
```

Réponse `200` — commande avec `statut: "recue"`.

### 4.3 Créer l'action d'exécution

```
POST /api/actions
X-API-Key: sk_sai_...

{ "id_commande": 42, "statut": "en_cours" }
```

Réponse `201` — action créée (1 action par commande, lien `id_commande` unique) :

```json
{ "id": 7, "id_commande": 42, "statut": "en_cours", "date_debut": "..." }
```

### 4.4 Clôturer l'action

```
PUT /api/actions/{id}
X-API-Key: sk_sai_...

{ "statut": "termine", "resultat": "ok", "date_fin": "2026-09-01T10:16:00Z" }
```

Réponse `200` — action mise à jour (`duree` calculée automatiquement si `date_fin` présente).

### 4.5 Signaler l'exécution de la commande

```
PUT /api/commandes/{id}
X-API-Key: sk_sai_...

{ "statut": "executee" }     // ou "echouee" en cas d'erreur
```

Réponse `200` — commande avec `statut` final.

### 4.6 Envoyer une mesure (fallback HTTP)

Si MQTT indisponible, `POST /api/mesures` (clé API, body `MesureCreate`) :

```json
{
  "valeur": 26.5,
  "unite": "C",
  "source": "esp32",
  "id_capteur": 71
}
```

Réponse `201`. Rate limitée (défaut **60/min par IP**).

---

## 5. Codes d'erreur communs (HTTP)

| Code | Sens | Cas typique |
|------|------|-------------|
| `401` | Non authentifié | Clé API absente, invalide, révoquée ou expirée |
| `404` | Introuvable | `id` commande/action/capteur inexistant |
| `400` | Requête invalide | Transition de statut illégale (`envoyee→executee` direct), `source='auto'` avec utilisateur |
| `429` | Trop de requêtes | Dépassement du rate limit (mesures/écritures) |
| `422` | Validation | Corps JSON incomplet/invalide (Pydantic) |

---

## 6. Séquençage recommandé (librairie ESP32)

1. À l'**initialisation** : charger la clé API + user/pass/topics MQTT depuis la config.
2. Boucle **MQTT** : publier les mesures sur `sai/<parcelle>/capteurs/<type>` (QoS 1, TLS).
3. Boucle **HTTP** (every N s) :
   - `GET /api/commandes/attente` → pour chaque commande :
     - `PUT /api/commandes/{id}` `recue`
     - `POST /api/actions` `en_cours`
     - exécuter l'actionneur
     - `PUT /api/actions/{id}` `termine`
     - `PUT /api/commandes/{id}` `executee`
4. Gérer la reconnexion réseau/MQTT et le backoff.

---

## 7. Variables de configuration (firmware)

| Variable | Exemple | Description |
|----------|---------|-------------|
| `BROKER_HOST` | `192.168.1.10` | Hôte du broker Mosquitto |
| `BROKER_PORT` | `8883` | Port TLS du broker |
| `BROKER_USER` / `BROKER_PASS` | `sai_esp32` | Credentials Mosquitto (ACL) |
| `CA_CERT` | `--` | Certificat CA pour valider le broker |
| `API_BASE` | `https://api.sai.local` | Base URL HTTP du backend |
| `API_KEY` | `sk_sai_...` | Clé API `X-API-Key` |
| `PARCELLE` | `serre-a` | Identifiant de parcelle (topics MQTT) |
| `CAPTEURS` | `{dht22:4, yl69:34}` | Map type→GPIO |
| `ACTIONNEURS` | `{pompe:26, ventilation:27}` | Map nom→GPIO |
