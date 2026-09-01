# Préparation IoT — SAI (Système Agricole Intelligent)

Document **vivant** : checklist de préparation de tout le terrain avant l'implémentation de la partie IoT (firmware ESP32 + MQTT). On coche `/ réalise` chaque point au fil de l'eau (voir *Journal de mise à jour* en bas).

---

## Décisions actées (définitives)

| Décision | Choix |
|----------|-------|
| Orientation communication | **MQTT complet** (ESP32 → broker Mosquitto → subscriber backend + temps réel frontend) |
| Auth du microcontrôleur | **Clé API** (table `tokens`, format `sk_sai_...`) |
| Périmètre | **Uniquement la préparation** (le firmware ESP32 sera traité ensuite, dans un plan séparé) |
| **Broker** | **Mosquitto natif (option A)** — seul et unique broker utilisé |
| Installation du broker | **winget** : `EclipseFoundation.Mosquitto` → **v2.1.2** (disponibilité vérifiée) |
| Source de vérité du schéma BD | **Alembic** (les migrations versionnées sont la référence) |
| `GET /api/logs/export` | **Différé** (le frontend exporte déjà côté client via `History.jsx`) — réévaluer plus tard, non bloquant |

> Le broker **Python (amqtt/gmqtt) est écarté** : décision utilisateur. Mosquitto seul sera implémenté et utilisé.

---

## Baseline environnement (vérifiée le 2026-09-01)

- ❌ **Docker** : absent → **non requis / non utilisé** (Mosquitto est un binaire natif, pas un container).
- ❌ **Mosquitto** : absent → à installer via winget (v2.1.2).
- ✅ **winget** et **choco** disponibles → on retient **winget**.
- ✅ **Venv backend** = Python 3.12.10 → toujours l'utiliser pour les dépendances.
- ✅ **Node v24.11.0** + **npm 11.6.1** → OK pour le frontend et les outils de test MQTT.
- ⚠️ **`backend/requirements.txt`** : ne contient **pas** `paho-mqtt` → à ajouter (Phase 1).

---

## Checklist de préparation

> Cocher `[x]` chaque point réalisé et mentionner `@ <date>` + qui. Voir le *Journal de mise à jour*.

### Phase 0 — Alignement de l'existant (prérequis IoT)

- [x] **0.1** Réconcilier `mpd.sql` / modèles SQLAlchemy / Alembic :
  - Faire de **Alembic la référence** (migrations versionnées).
  - `mpd.sql` manque la colonne `actif` (utilisateurs) et la table `historique_actions` → à documenter/aligner (info).
  - Compléter les 3 migrations Alembic pour reproduire les **triggers `updated_at`** et les **contraintes CHECK** du `mpd.sql`.
- [x] **0.2** Enforcer les **rôles admin côté serveur** (aujourd'hui `/api/capteurs`, `/api/utilisateurs`, `/api/tokens` sont JWT-only mais **sans contrôle `admin`** dans le code — le frontend bloque mais pas l'API). Ajouter une dépendance `exiger_admin`.
- [x] **0.3** Ajouter le **rate limiting** (`slowapi`) sur les endpoints sensibles — indispensable dès qu'un ESP32 pousse des mesures en continu (protège la table `mesures` à gros volume).
- [x] **0.4** Créer les tests manquants : `tests/test_actions.py`, `tests/test_historique.py` (2 entités sans coverage).
- [x] **0.5** (Non bloquant, à décider à l'implémentation) `GET /api/dashboard` (endpoint agrégat pour le frontend, absent aujourd'hui).

### Phase 1 — Infrastructure : broker Mosquitto

- [x] **1.1** Installer Mosquitto : `winget install EclipseFoundation.Mosquitto` (v2.1.2) puis vérifier `mosquitto -v`.
- [~] **1.2** Configurer TLS **8883** + **auth** (`mosquitto_passwd`) + **ACL par topic** — fichiers versionnés dans `mosquitto/` (`mosquitto.conf`, `passwd`, `acl`). *(en cours : PKI + passwd + acl + config TLS créés et démarrage broker validé ; round-trip TLS pub/sub à confirmer en Phase 6.2)*
- [x] **1.3** Tenir compte des **particularités Mosquitto v2.x** : écoute par défaut = loopback + `allow_anonymous true` par défaut → restreindre explicitement ; déclarer `listener 1883/8883` explicitement.
- [x] **1.4** Créer un **script de démarrage / arrêt** du broker en dev (reproductible).
- [x] **1.5** Ajouter `paho-mqtt` à `backend/requirements.txt` et l'installer dans le venv.
- [x] **1.6** Ajouter la config broker dans `backend/.env` + `config.py` : `MQTT_BROKER`, `MQTT_PORT`, `MQTT_USER`, `MQTT_PASS`, `MQTT_TLS`, topics.

### Phase 2 — Subscriber MQTT backend

- [ ] **2.1** Créer `services/mqtt_service.py` (subscriber `paho-mqtt` lancé au démarrage de `main.py`).
- [ ] **2.2** S'abonner aux topics selon la spécification : `sai/+/capteurs/#` (mesures), `sai/+/actionneurs/#` (statut), `sai/+/alertes`.
- [ ] **2.3** Parser le JSON MQTT → mapper le capteur (parcelle/type) → **insérer la `Mesure` en BD** directement (au lieu de passer par HTTP).
- [ ] **2.4** Gérer la **reconnexion au broker** (backoff) et la fidélité QoS.

### Phase 3 — Authentification ESP32 par clé API

- [ ] **3.1** Créer la dépendance `get_client_cle_api` : validation d'une clé (`X-API-Key` / query) contre la table `tokens` (active, non expirée, maj `last_used_at`).
- [ ] **3.2** Sécuriser `POST /api/mesures` (passer de « public » à « clé API » requise).
- [ ] **3.3** Ouvrir par clé API : `PUT /api/commandes/{id}` (confirmation `recue`/`executee`/`echouee`), `POST /api/actions`, `PUT /api/actions/{id}`.
- [ ] **3.4** Créer `GET /api/commandes/attente` : l'ESP32 récupère les commandes `envoyee` en attente d'exécution (workflow pull — absent aujourd'hui).
- [ ] **3.5** Rédiger le **contrat d'interface ESP32** → `Iot/INTERFACE.md` (endpoints, formats JSON, identifiants par modèle, clé API, topics MQTT).

### Phase 4 — Temps réel frontend

- [ ] **4.1** Ajouter le client MQTT WebSocket (`mqtt.js`) utilisant `VITE_MQTT_URL` (variable aujourd'hui **non utilisée** dans le code).
- [ ] **4.2** Brancher le topic alertes (`sai/+/alertes`) pour le panneau/compteur **temps réel** (aujourd'hui la TopBar fait du **polling 30 s** de `GET /api/alertes`).
- [ ] **4.3** (Optionnel) Rafraîchissement auto des mesures du dashboard via MQTT capteurs (aujourd'hui chargement unique + bouton manuel).
- [ ] **4.4** Documenter `VITE_MQTT_URL` dans `frontend/.env.example`.

### Phase 5 — CLI complémentaire

- [ ] **5.1** Support de la **clé API** dans `Cli/config.json` + envoi du header `X-API-Key`.
- [ ] **5.2** **Vérification du niveau réservoir** avant irrigation (CDC 6.2.1) : requête du capteur `niveau_eau` avant de commander la pompe.
- [ ] **5.3** **Confirmation interactive** avant les actions critiques (CDC 6.3).
- [ ] **5.4** **Logging des exécutions** dans un fichier dédié (CDC 6.3), par ex. `cli.log`.
- [ ] **5.5** (Optionnel) Commande **batch** d'arrosage/ventilation (CDC F05).
- [ ] **5.6** Maintenir `python test_cli.py` à jour après ces ajouts.

### Phase 6 — Tests & validation écosystème (avant le firmware)

- [ ] **6.1** Tests `pytest` : `mqtt_service`, auth clé API, commandes/actions par clé API, dashboard agrégé.
- [ ] **6.2** Test d'intégration broker : publier une mesure MQTT fictive → vérifier son insertion en BD via le subscriber.
- [ ] **6.3** Simulateur **« ESP32 virtuel »** (script Python/test) : publie des mesures MQTT, récupère une commande en attente, confirme l'exécution, crée une `Action` → vérifie le flux complet en BD.
- [ ] **6.4** Vérifier l'affichage **temps réel frontend** avec un publisher MQTT de test.
- [ ] **6.5** Mettre à jour `AGENTS.md` : ajouter la section MQTT, l'auth clé API, les nouveaux endpoints, le broker ; **retirer la mention « MQTT non implémenté »** une fois la préparation faite.

---

## Livrables attendus en fin de préparation

- Schéma BD cohérent, **Alembic = référence**, migrations propres.
- Subscriber MQTT fonctionnel (broker démarré + ingestion mesures + reconnexion).
- Endpoints IoT sécurisés par **clé API** + `GET /api/commandes/attente` + contrat d'interface ESP32 documenté (`Iot/INTERFACE.md`).
- Frontend **temps réel** câblé (alertes MQTT WebSocket).
- CLI complété (clé API, niveau réservoir, confirmation, logging).
- Tests d'intégration écosystème + simulateur « ESP32 virtuel » verts.
- Environnement de dev reproductible (config broker versionnée + script de démarrage).

---

## Journal de mise à jour

> À chaque point réalisé : cocher dans la checklist **et** ajouter une entrée datée ici.

| Date | Point | Description | Qui |
|------|-------|-------------|-----|
| 2026-09-01 | **0.1** | Schéma aligné sur `mpd.sql` : migration Alembic `a1b2c3d4e5f7_alignement_mpd.py` (7 triggers `updated_at`, 11 CHECK, 2 index manquants recréés, non-destructif). Écart documenté : `chk_alertes_source` retirée (l'app crée des alertes sans mesure/action) ; CASCADE volontairement non traité (décision utilisateur, à reporter). | opencode |
| 2026-09-01 | **0.2** | Dépendance `exiger_admin` dans `auth.py` (403 si role ≠ admin) appliquée sur capteurs/utilisateurs/tokens. Tests `TestControleRole` (3 négatifs, fixture `agri_fresh` isolée). | opencode |
| 2026-09-01 | **0.3** | Rate limiting `slowapi` 0.1.10 : `services/rate_limit.py` + config (60/min mesures, 20/min écritures/auth) + handler dans `main.py`. Vérifié : 429 atteint après 20 requêtes. | opencode |
| 2026-09-01 | **0.4** | `tests/test_actions.py` (11) + `tests/test_historique.py` (6). Bug pré-existant corrigé dans `routes/actions.py` (`data.date_debut` absent → `action.date_debut`). Suite : 105 passed, 3 échecs pré-existants (401 vs 403). | opencode |
| 2026-09-01 | **0.5** | `GET /api/dashboard` agrégat : `services/dashboard_service.py` + `routes/dashboard.py` (JWT). Payload unique `{capteurs, actionneurs, parcelles, alertes (!=resolue), dernieres_mesures (map id_capteur→mesure)}`. Testé : 200 (14 capteurs, 5 actionneurs, 8 parcelles, 8 alertes), 401 sans token. | opencode |
| 2026-09-01 | **1.1** | Mosquitto **2.1.2** installé via winget (`EclipseFoundation.Mosquitto`), `mosquitto -v` OK (TLS + websockets support). Service Windows déjà présent sur 1883 (config par défaut). | opencode |
| 2026-09-01 | **1.3** | Particularités v2.x : `per_listener_settings` + `allow_anonymous` par listener ; listener 8883 TLS explicite ; bloc 1883 commenté car occupé par le service Windows. Broker SAI exposé sur **8883** seul (décision utilisateur : garder le service sur 1883). | opencode |
| 2026-09-01 | **1.4** | Scripts `mosquitto/scripts/` : `gen_certs.ps1` (PKI CA + serveur, OpenSSL de Git), `setup_broker.ps1` (PKI + passwd), `start_broker.ps1` (lance depuis `mosquitto/` pour résoudre les chemins relatifs), `stop_broker.ps1`. `README.md` d'usage. Démarrage broker validé. | opencode |
| 2026-09-01 | **1.5** | `paho-mqtt>=2.1.0` ajouté à `backend/requirements.txt` + installé (2.1.0, API v2 vérifiée). | opencode |
| 2026-09-01 | **1.6** | Bloc MQTT dans `backend/config.py` + `backend/.env` : `MQTT_BROKER=localhost`, `MQTT_PORT=8883`, `MQTT_TLS=true`, `MQTT_USER=sai_backend`, `MQTT_PASS=sai_backend_pass`, `MQTT_CA_CERT` (résolue vers `mosquitto/certs/mosquitto_ca.crt`), topics `sai/+/capteurs/#` / `sai/+/actionneurs/#` / `sai/+/alertes`. Config chargée + app FastAPI importe sans erreur. | opencode |
