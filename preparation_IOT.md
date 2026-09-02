# Préparation IoT — SAI (Système Agricole Intelligent)

Document **vivant** : checklist de préparation de tout le terrain avant l'implémentation de la partie IoT (firmware ESP32 + MQTT). On coche `/ réalise` chaque point au fil de l'eau (voir *Journal de mise à jour* en bas).

---

## Décisions actées (définitives)

| Décision | Choix |
|----------|-------|
| Orientation communication | **MQTT complet** (ESP32 → broker Mosquitto → subscriber backend + temps réel frontend) |
| Auth du microcontrôleur | **Clé API** (table `tokens`, format `sk_sai_...`) |
| Périmètre | **Uniquement la préparation** (le firmware ESP32 sera traité ensuite, dans un plan séparé) |
| **Points (B)** | **Différés en toute dernière position** : 6.2, 6.3, 6.4, 4.5 sont **reportés** pour éviter de bloquer le développement. Ils seront joués **avec le vrai matériel ESP32** (firmware réel), le simulateur ne servant que de référence de développement |
| **Broker** | **Mosquitto natif (option A)** — seul et unique broker utilisé |
| Installation du broker | **winget** : `EclipseFoundation.Mosquitto` → **v2.1.2** (disponibilité vérifiée) |
| Source de vérité du schéma BD | **Alembic** (les migrations versionnées sont la référence) |
| `GET /api/logs/export` | **Différé** (le frontend exporte déjà côté client via `History.jsx`) — réévaluer plus tard, non bloquant |

> Le broker **Python (amqtt/gmqtt) est écarté** : décision utilisateur. Mosquitto seul sera implémenté et utilisé.

---

## Principe d'exécution — « terrain » ↔ « validation finale »

La préparation est découpée en deux catégories, distinguées **systématiquement** dans ce document :

- **(A) Terrain** : tout ce qui peut être développé, configuré et documenté **sans acteur « ESP32 »** — code backend/frontend/CLI, config broker, docs, tests unitaires/non-intégratifs. Ne dépend **d'aucune publication MQTT externe**.
- **(B) Validation finale** : tout ce qui exige de **« jouer l'ESP32 »** (publier des mesures MQTT, tirer les commandes en attente, confirmer les exécutions) **ou** de vérifier de bout en bout le circuit MQTT (broker ↔ backend ↔ BD ↔ frontend temps réel) — round-trips et tests d'intégration.

**Règle d'exécution** : on réalise **toute la catégorie (A)** d'abord, dans l'ordre des phases ; la catégorie **(B)** — intégration broker, simulateur « ESP32 virtuel », temps réel frontend vérifié — n'est entamée **qu'en toute dernière position**, une fois le terrain prêt.

**Application de la règle aux phases restantes** :

- **Phase 4** : les points d'implémentation (4.1-4.4) sont **(A)** ✅ ; le round-trip complet (simulateur → mesures en BD → WS 9001 → publisher backend) reste en **(B)**.
- **Phase 5 (CLI)** : entièrement **(A)**.
- **Phase 6** : **6.1** et **6.5** en **(A)** ; **6.2**, **6.3**, **6.4** en **(B)**.

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
> Légende : **(A)** = terrain (sans acteur ESP32) · **(B)** = validation finale (ESP32 / bout en bout) — voir *Principe d'exécution*.

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
- [x] **1.2** Configurer TLS **8883** + **auth** (`mosquitto_passwd`) + **ACL par topic** — fichiers versionnés dans `mosquitto/` (`mosquitto.conf`, `passwd`, `acl`).
- [x] **1.3** Tenir compte des **particularités Mosquitto v2.x** : écoute par défaut = loopback + `allow_anonymous true` par défaut → restreindre explicitement ; déclarer `listener 1883/8883` explicitement.
- [x] **1.4** Créer un **script de démarrage / arrêt** du broker en dev (reproductible).
- [x] **1.5** Ajouter `paho-mqtt` à `backend/requirements.txt` et l'installer dans le venv.
- [x] **1.6** Ajouter la config broker dans `backend/.env` + `config.py` : `MQTT_BROKER`, `MQTT_PORT`, `MQTT_USER`, `MQTT_PASS`, `MQTT_TLS`, topics.

### Phase 2 — Subscriber MQTT backend

- [x] **2.1** Créer `services/mqtt_service.py` (subscriber `paho-mqtt` lancé au démarrage de `main.py`).
- [x] **2.2** S'abonner aux topics selon la spécification : `sai/+/capteurs/#` (mesures), `sai/+/actionneurs/#` (statut), `sai/+/alertes`.
- [x] **2.3** Parser le JSON MQTT → mapper le capteur (parcelle/type) → **insérer la `Mesure` en BD** directement (au lieu de passer par HTTP).
- [x] **2.4** Gérer la **reconnexion au broker** (backoff) et la fidélité QoS.

### Nettoyage BD & BD de test dédiée (prérequis CI)

- [x] **N.1** Nettoyer `sai_db` (retour état seed propre) : backup `pg_dump` (dossier `backend/backups/`, gitignoré) + `seed.py --drop`.
- [x] **N.2** Étendre `init_db.py` avec un argument `--db <nom>` pour initialiser n'importe quelle base (défaut `sai_db`).
- [x] **N.3** Créer la **BD de test dédiée `sai_test`** : schéma construit **par Alembic** (`alembic upgrade head`, source de vérité) — le MPD seul est incomplet (colonne `actif`, `historique_actions`).
- [x] **N.4** Pointer `tests/conftest.py` vers `sai_test` (isolation par rapport à `sai_db`).
- [x] **N.5** Neutraliser le subscriber MQTT pendant les tests : flag `SAI_MQTT_DISABLED` lu dans `main.py`, activé dans `conftest.py`.
- [x] **N.6** Valider : **110 passed, 3 échecs pré-existants (401 vs 403)** sur `sai_test`, et **`sai_db` reste propre** (aucune pollution).

### Phase 3 — Authentification ESP32 par clé API

- [x] **3.1** Créer la dépendance `get_client_cle_api` : validation d'une clé (`X-API-Key` / query) contre la table `tokens` (active, non expirée, maj `last_used_at`).
- [x] **3.2** Sécuriser `POST /api/mesures` (passer de « public » à « clé API » requise).
- [x] **3.3** Ouvrir par clé API : `PUT /api/commandes/{id}` (confirmation `recue`/`executee`/`echouee`), `POST /api/actions`, `PUT /api/actions/{id}`.
- [x] **3.4** Créer `GET /api/commandes/attente` : l'ESP32 récupère les commandes `envoyee` en attente d'exécution (workflow pull — absent aujourd'hui).
- [x] **3.5** Rédiger le **contrat d'interface ESP32** → `Iot/INTERFACE.md` (endpoints, formats JSON, identifiants par modèle, clé API, topics MQTT).

### Phase 4 — Temps réel frontend

- [x] **(A)** **4.1** Client MQTT WebSocket (`mqtt.js`) utilisant `VITE_MQTT_URL` (variable aujourd'hui **non utilisée** dans le code).
- [x] **(A)** **4.2** Brancher le topic alertes (`sai/+/alertes`) pour le panneau/compteur **temps réel** (aujourd'hui la TopBar fait du **polling 30 s** de `GET /api/alertes`).
- [x] **(A)** **4.3** (Optionnel) Rafraîchissement auto des mesures du dashboard via MQTT capteurs (aujourd'hui chargement unique + bouton manuel).
- [x] **(A)** **4.4** Documenter `VITE_MQTT_URL` dans `frontend/.env.example`.
- [ ] **(B)** **4.5** **Round-trip de validation finale** : simulateur corrigé (user `sai_esp32`) → mesures insérées en BD via le subscriber → alertes/mesures reçues en WS 9001 (frontend) ; `POST /api/alertes` → publisher backend → message WS.

### Phase 5 — CLI complémentaire

- [x] **(A)** **5.1** Support de la **clé API** dans `Cli/config.json` + envoi du header `X-API-Key`.
- [x] **(A)** **5.2** **Vérification du niveau réservoir** avant irrigation (CDC 6.2.1) : requête du capteur `niveau_eau` avant de commander la pompe.
- [x] **(A)** **5.3** **Confirmation interactive** avant les actions critiques (CDC 6.3).
- [x] **(A)** **5.4** **Logging des exécutions** dans un fichier dédié (CDC 6.3), par ex. `cli.log`.
- [x] **(A)** **5.5** (Optionnel) Commande **batch** d'arrosage/ventilation (CDC F05).
- [x] **(A)** **5.6** Maintenir `python test_cli.py` à jour après ces ajouts.

### Phase 6 — Tests & validation écosystème (avant le firmware)

- [x] **(A)** **6.1** Tests `pytest` : `mqtt_service`, auth clé API, commandes/actions par clé API, dashboard agrégé.
- [ ] **(B)** **6.2** Test d'intégration broker : publier une mesure MQTT **réelle (ESP32)** → vérifier son insertion en BD via le subscriber.
- [ ] **(B)** **6.3** Flux commandes complet : le firmware ESP32 récupère une commande en attente, confirme l'exécution, crée une `Action` → vérifie le flux complet en BD.
- [ ] **(B)** **6.4** Vérifier l'affichage **temps réel frontend** (WS 9001, alertes TopBar + jauges Dashboard) nourri par le firmware ESP32 réel.
- [x] **(A)** **6.5** Mettre à jour `AGENTS.md` : ajouter la section MQTT, l'authentification clé API, les nouveaux endpoints, le broker ; **retirer la mention « MQTT non implémenté »** une fois la préparation faite.

### Phase 7 — Réalisation firmware ESP32 (après préparation, plan dédié)

> **Report de la partie (B)** : la validation (6.2-6.4, 4.5) est volontairement différée pour ne pas bloquer le développement. On réalise d'abord le **firmware** (Phase 7), puis on joue les (B) **avec le vrai ESP32** en toute dernière position.

- [x] **7.1** Setup matériel/logiciel ESP32 : IDE, WiFi, gestion connexion/reconnexion, sleep mode, watchdog.
- [x] **7.2** Lecture + filtrage des 5 capteurs (YL-69, DHT22, BH1750, SEN0159, niveau d'eau) — calibrés selon `modules_taches` 2.1.
- [x] **7.3** Commande des actionneurs (pompe, ventilation, éclairage via relais) + publication état sur `sai/<parcelle>/actionneurs/<nom>`.
- [x] **7.4** Publication MQTT multi-mesures (TLS 8883, QoS, topics `sai/<parcelle>/capteurs/<type>`, alerte périodique) — **alignée sur `mqtt_simulateur.py`**.
- [x] **7.5** Workflow pull HTTP : `GET /api/commandes/attente` → confirmations `recue`/`executee` → `POST /api/actions` (contrat `Iot/INTERFACE.md`).
- [x] **7.6** Automatisation embarquée : seuils locaux, priorité local > distant, alerte si perte de liaison.
- [x] **(A)** **7.7** Tests matériels ESP32 (unitaires capteurs/actionneurs + intégration réelle) — **partie (A)** : guide de flash/calibration rédigé (`Iot/README.md` §6) ; **partie jouée sur l'ESP32 réel en (B) dernière position** (upload + capteurs/actionneurs/MQTT/workflow, voir README).

---

## Livrables attendus en fin de préparation

- Schéma BD cohérent, **Alembic = référence**, migrations propres.
- Subscriber MQTT fonctionnel (broker démarré + ingestion mesures + reconnexion).
- Endpoints IoT sécurisés par **clé API** + `GET /api/commandes/attente` + contrat d'interface ESP32 documenté (`Iot/INTERFACE.md`).
- Frontend **temps réel** câblé (alertes + mesures MQTT WebSocket).
- CLI complété (clé API, niveau réservoir, confirmation, logging).
- Tests d'intégration écosystème + simulateur « ESP32 virtuel » verts.
- Environnement de dev reproductible (config broker versionnée + script de démarrage).
- **Firmware ESP32 dans `Iot/`** (code source + guide de flash/calibration) — Phase 7.

---

## Journal de mise à jour

> À chaque point réalisé : cocher dans la checklist **et** ajouter une entrée datée ici.

| Date | Point | Description | Qui |
|------|-------|-------------|-----|
| 2026-09-01 | **A1** | **Fix simulateur** `backend/scripts/mqtt_simulateur.py` : s'authentifie désormais en `sai_esp32` via `--user/--pass` (défaut `sai_esp32`/`sai_esp32_pass`) au lieu de relire `MQTT_USER` de config (`sai_backend`). Smoke test : publications capteurs **PUBACK rc0** (acceptées) — les `Denied rc135` du log broker ne proviennent plus que des simulateurs orphelins (ancien code, arrêtés en B1). | opencode |
| 2026-09-01 | **A2** | **Docs après fix** : `mosquitto/README.md` — table des utilisateurs complétée (`sai_frontend`) + nouvelle section « Simulateur ESP32 » (usage, avertissement `sai_backend`→rc135) ; `AGENTS.md` — simulateur documenté (authentification `sai_esp32`). `frontend/.env.example` déjà à jour. | opencode |
| 2026-09-01 | **Principe A/B** | **Reformation du document** : ajout de la section « Principe d'exécution — terrain ↔ validation finale » (définitions (A)/(B), règle d'exécution = tout (A) d'abord puis (B) en dernière position, application aux phases restantes) + annotations `(A)`/`(B)` sur les checklists Phases 4, 5, 6 + ajout du round-trip **4.5 (B)** de validation finale. | opencode |
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
| 2026-09-01 | **2.1** | `services/mqtt_service.py` : subscriber paho (API v2), TLS + auth depuis `config.py`, connect + `loop_forever`, lancé en thread daemon au démarrage de `main.py` (dans `demarrer_automatisation`). | opencode |
| 2026-09-01 | **2.2** | Abonné à `sai/+/capteurs/#` et `sai/+/alertes` (QoS 1). Payload JSON parsé conforme à la spec (multi-mesures, `sai/[parcelle]/capteurs/[type]`). | opencode |
| 2026-09-01 | **2.3** | Mapping type→capteur (`temperature→dht22`, `humidite_sol→yl-69`, `co2→sen0159`, `luminosite→bh1750`, `niveau_eau`), unités par défaut (surchargeables par `unite`). `_resoudre_capteur` : parcelle par nom + capteur actif. Une `Mesure` insérée par clé numérique du payload. | opencode |
| 2026-09-01 | **2.4** | Reconnexion avec backoff exponentiel borné (2→60 s) autour de `connect`/`loop_forever` ; QoS 1 sur l'abonnement mesures/alertes. | opencode |
| 2026-09-01 | **1.2 ✅ finalisé** | **Round-trip TLS confirmé** : test d'intégration réel (broker 8883 + subscriber + `mosquitto_pub` au user `sai_esp32` + vérif BD) → `1 mesure inserée, valeur=26.5, unite=°C, source=esp32`. Le bloqueur Phase 1 est levé. | opencode |
| 2026-09-01 | **Tests 2.x** | `tests/test_mqtt_service.py` créé (5 tests) : résolution capteur (trouvé/inconnu/parcelle inconnue), insertion payload spec (valeur+unité+source), clés non numériques ignorées. Suite : **110 passed**, 3 échecs pré-existants. Données d'intégration nettoyées. | opencode |
| 2026-09-01 | **N.1–N.6** | **Nettoyage BD + BD de test dédiée.** Backup `pg_dump` de `sai_db` dans `backend/backups/` (gitignoré) puis reseed propre (`seed.py --drop`, bug FK `historique_actions` corrigé). `init_db.py` paramétré par `--db`. `sai_test` construite **par Alembic** (`upgrade head`, schéma seul cohérent avec les modèles — le MPD n'inclut ni `actif` ni `historique_actions`). `conftest.py` pointe vers `sai_test` + flag `SAI_MQTT_DISABLED` neutralise le subscriber en test. Validation : **110 passed / 3 échecs pré-existants** sur `sai_test`, **`sai_db` intacte** (2 users, 1 parcelle `Serre A`, 5 capteurs sans doublons, 0 mesures) → fin de la pollution inter-tests. | opencode |
| 2026-09-01 | **3.1–3.5** | **Phase 3 — auth ESP32 par clé API.** `auth.py` : `get_client_cle_api` (header `X-API-Key` / query `api_key`, validation active+non expirée, maj `last_used_at`) et `get_client_iot` (OR clé API / JWT pour endpoints partagés). `POST /api/mesures` passe de **public à clé API requise**. `PUT /api/commandes/{id}`, `POST /api/actions`, `PUT /api/actions/{id}` acceptent clé API ou JWT. Nouveau `GET /api/commandes/attente` (commande `envoyee`, FIFO). Contrat `Iot/INTERFACE.md` (clé API, topics MQTT, payload multi-mesures, workflow pull/confirm, codes d'erreur, config firmware). Tests : `test_iot.py` (9 tests) + adaptation `test_mesures.py` ; suite **119 passed / 3 échecs pré-existants** (401 vs 403). Fixture autouse désactive le rate limiting en test (évite 429 flaky sur `POST /api/commandes`). | opencode |
| 2026-09-01 | **4.1–4.4** | **Phase 4 — temps réel frontend (partie A).** (1) Broker : nouveau listener **WebSocket 9001** dans `mosquitto.conf` + ACL (`sai_frontend` read `sai/#`, `sai_backend` + write `sai/+/alertes`), `passwd` régénéré (3 users), `setup_broker.ps1`/`start_broker.ps1` à jour, broker SAI relancé (8883 + 9001). (2) Backend : `publier_alerte()` dans `mqtt_service.py` (client paho dédié, payload « client-friendly », best effort) appelé sur `POST /api/alertes` et sur la boucle auto (`automatisation_service.py` après commit). (3) Frontend : `mqtt` npm installé ; `src/services/mqtt.js` (connexion `VITE_MQTT_URL` ws://localhost:9001, user `sai_frontend`, abonnements `sai/+/alertes` + `sai/+/capteurs/#`, reconnexion auto) ; `TopBar.jsx` passe du **polling 30 s** à l'abonnement MQTT (chargement HTTP initial conservé en fallback) ; `Dashboard.jsx` met à jour les jauges en direct sur `sai/+/capteurs/#` (`lastUpdateSecs` reset). (4) Simulateur `backend/scripts/mqtt_simulateur.py` (TLS 8883, user `sai_esp32`, multi-mesures + alerte périodique). Docs : `frontend/.env.example` (déjà présent), `mosquitto/README.md`, `AGENTS.md`. | opencode |
| 2026-09-01 | **5.1–5.6** | **Phase 5 — CLI complémentaire (100 % A).** (5.1) `Cli/client.py` : attribut `cle_api` + `sauvegarder_cle_api`/`effacer_cle_api` + header `X-API-Key` ; `config.example.json` +`cle_api` ; sous-commande `apikey <sk_sai_...> | --effacer` dans `main.py` ; `status` (auth.py) affiche la clé masquée (`sk_sai_...` préfixe). (5.2) `commandes.envoyer` : vérif réservoir (`_verifier_reservoir`, capteur `niveau_eau` de la parcelle, blocage < 15 % sauf `--oui`) ; `batch.arrosage` idem. (5.3) `_confirmer_critique` (commandes.py) + `_confirmer` (batch.py) : prompt `[o/N]` sur `pompe`/`ventilation`/`eclairage` (`ACTIONNEURS_CRITIQUES`), flag `--oui` sur `commander` et `batch`. (5.4) `Cli/logs.py` module `journal()` → `cli.log` (gitignoré) ; dispatch `main.py` journalise login/logout/commander/apikey/statut + erreurs. (5.5) `batch` arrosage/ventilation créé (`SEUIL_NIVEAU_EAU=15`, `SEUIL_TEMPERATURE=40`, `--oui` force l'arrosage si cohérent avec commandes.py). (5.6) `test_cli.py` étendu : `apikey`, `status` (clé affichée), `commander --oui`, `batch arrosage/ventilation --oui`, résolution **dynamique des IDs** (capteur/pompe/ventilation) depuis l'API seedée + timeout 90 s → **14/14 OK**, données de test nettoyées. Environnement : `requests` installé dans le venv backend (dépendance `Cli/requirements.txt`, le CLI tourne désormais via ce venv). | opencode |
| 2026-09-01 | **6.1** | **Phase 6 (A) — tests dashboard agrégé.** Création `tests/test_dashboard.py` (4 tests) : payload complet `{capteurs, actionneurs, parcelles, alertes, dernieres_mesures}`, **une seule mesure (la plus récente) par capteur**, exclusion des alertes `resolue`, 401 sans token. **Bug corrigé dans `services/dashboard_service.py`** (`_dernieres_mesures`) : la jointure sur la sous-requête DISTINCT ON ne portait que sur `id_capteur` (pas le `timestamp`) → la ligne « dernière mesure » n'était pas garantie d'être la plus récente ; jointure étendue à `(id_capteur, timestamp)`. Suite complète : **123 passed / 3 échecs pré-existants (401 vs 403) inchangés**. Rappel couverture 6.1 (déjà en place) : `test_mqtt_service.py` (5), `test_iot.py` (8 : clé API + commandes/actions). | opencode |
| 2026-09-01 | **6.5** | **Phase 6 (A) — `AGENTS.md` finalisé.** Section endpoints : ajout `GET /api/dashboard` (payload agrégé unique). Section CLI (§11) : enrichie (apikey, batch arrosage/ventilation, `--oui`, vérifs CDC 6.2.1/6.3, journal `cli.log`). Section Tests (§13) : documentés `test_mqtt_service.py`, `test_iot.py`, `test_dashboard.py` + `test_cli.py` (IDs dynamiques). **Plus aucune mention « MQTT non implémenté »** (section MQTT déjà « implémenté »). | opencode |
| 2026-09-02 | **Report B + Phase 7** | **Décision : reporter la validation (B) — ajout de la Phase 7 « Réalisation firmware ESP32 ».** Les points (B) 6.2, 6.3, 6.4, 4.5 sont **différés en toute dernière position** et seront joués **avec le vrai matériel ESP32** (firmware réel) plutôt qu'avec le simulateur ; le simulateur ne garde qu'un rôle de **référence de développement**. Ajout de la **Phase 7** (7.1-7.7 : setup, capteurs, actionneurs + publication état MQTT, publication MQTT TLS alignée sur le simulateur, workflow pull HTTP, automatisation embarquée, tests matériels). Reformulation des 4 points (B) en acteur « ESP32 réel ». Brochure de l'état courant nettoyée (broker SAI arrêté, logs B0 supprimés). | opencode |
| 2026-09-02 | **GAP-1** | **Fuite MQTT au logout corrigée.** `frontend/src/context/AuthContext.jsx` : `logout()` appelle désormais `deconnecterMqtt()` (importée depuis `services/mqtt`) avant de purger le localStorage — le client MQTT WebSocket est coupé et le singleton réinitialisé à la déconnexion. | opencode |
| 2026-09-02 | **GAP-4** | **Topic actionneurs désormais souscrit (temps réel).** `frontend/src/services/mqtt.js` : nouveau topic `sai/+/actionneurs/#`, famille `listeners.actionneur`, export `subscribeActionneurs(cb)`. `backend/services/mqtt_service.py` : import de `MQTT_TOPIC_ACTIONNEURS`, abonnement dans `_on_connect`, handler `_traiter_actionneurs()` (journalisation, pas d'écriture BD). `frontend/src/pages/Dashboard.jsx` : souscrit via `subscribeActionneurs` et met à jour l'état d'un actionneur en direct (par nom). | opencode |
| 2026-09-02 | **GAP-5** | **Alertes Dashboard en temps réel.** `frontend/src/pages/Dashboard.jsx` : souscrit à `subscribeAlertes` (en plus des mesures), fusionne les alertes push MQTT avec celles chargées en HTTP, déduplique par `id` et ignore les `resolue` (cap 50). Le chargement HTTP initial reste le fallback. | opencode |
| 2026-09-02 | **7.1** | **Phase 7 — scaffolding firmware.** `platformio.ini` (env `esp32dev`, framework arduino, `monitor_speed 115200`, libs PubSubClient/ArduinoJson/DHT/Adafruit Unified Sensor) ; `include/config.h.example` (versionné) + `include/config.h` (gitignoré) + `Iot/.gitignore` ; `src/wifi_manager.h/.cpp` (`wifi_begin`, `wifi_loop` non-bloquant, `wifi_connected`). Build PIO : **SUCCESS** (RAM 13.3-13.4 %, Flash 55.6-56.6 %). | opencode |
| 2026-09-02 | **7.2** | **Capteurs.** `src/pins.h` (DHT22 GP4, YL-69 GP34, LDR GP36, MQ-135 GP35 ADC-only, niveau eau GP32, pompe GP26, ventilation GP27, éclairage GP25) ; `src/sensors.h/.cpp` (`sensors_begin`, `sensors_loop`, `sensors_get_current` → struct `SensorReadings`, lecture par fonction, calibration LDR 300→3600, coefficients MQ-135 A=116.6/B=-2.77 ppm 200-2000, ADC 12 bits/11db). **Bug corrigé** : tampon de lissage partagé → `struct FiltreGlissant` (tampon isolé par capteur : `filtre_sol/ldr/co2/eau`). Intégré à `main.cpp`. Build **SUCCESS**. | opencode |
| 2026-09-02 | **7.3** | **Actionneurs.** `src/actuators.h/.cpp` : `actuators_begin`, `set_actionneur(nom, bool)` (false si nom inconnu), `actionneur_actif(nom)`, `au_moins_un_actif()` ; états logiques par `enum ActId` (POMPE/VENTILATION/ECLAIRAGE), pins sortie LOW au début. Intégré. Build **SUCCESS**. | opencode |
| 2026-09-02 | **7.4** | **Publisher MQTT TLS.** `src/ca_cert.h` (CA `SAI-Mosquitto-CA` embarqué, copie de `mosquitto/certs/mosquitto_ca.crt`) ; `src/mqtt_publisher.h/.cpp` : TLS 8883 (`WiFiClientSecure::setCACert`), `PubSubClient`, `mqtt_begin`, `mqtt_loop` non-bloquant (reconnexion 5 s, publie mesures à `INTERVALLE_MESURES`, alerte périodique si `INTERVALLE_ALERTES>0`), `mqtt_publish_measures` (JSON device_id/parcelle/timestamp sauté si NTP non sync/mesures non-NaN, topic `sai/<parcelle>/capteurs/telemetrie`, retain), `mqtt_publish_alert` (`sai/<parcelle>/alertes`), `mqtt_publish_actuator_state` (`sai/<parcelle>/actionneurs/<nom>`), `mqtt_connected`. **Warnings ArduinoJson corrigés** : `StaticJsonDocument<size>` → `JsonDocument` (déprécié v7). Build **SUCCESS**, build propre (RAM 14.1 %, Flash 69.3 %). | opencode |
| 2026-09-02 | **7.5** | **Workflow pull HTTP (commandes).** `src/http_commands.h/.cpp` : client `HTTPClient` + `ArduinoJson`, auth `X-API-Key` (`config_store_cle_api`). Machine à états non-bloquante (une commande à la fois) : `IDLE` → pull `GET /commandes/attente` (toutes `INTERVALLE_COMMANDES`) → `PUT /commandes/{id}` `recue` → `POST /actions` `en_cours` → `set_actionneur(nom, on/off)` selon `type_action` + `mqtt_publish_actuator_state` → `PUT /commandes/{id}` `executee`/`echouee`. Mapping `id_actionneur→nom` (`pompe/ventilation/eclairage`, défaut seed) + `http_set_mapping_actionneur` ; mapping `type_mesure→id_capteur` pour le **fallback HTTP mesures** (`POST /mesures` par capteur) quand MQTT down. Intégré à `main.cpp`. Bug corrigé : include `config_store.h` manquant. Build **SUCCESS** (RAM 14.5 %, Flash 72.9 %). | opencode |
| 2026-09-02 | **7.6** | **Automatisation embarquée.** `src/automation.h/.cpp` : `automation_begin`, `automation_loop` non-bloquant (éval toutes les 10 s), seuils locaux (`SEUIL_SOL_SEC`→pompe, `SEUIL_TEMP_HAUTE`→ventilation, `SEUIL_CO2_HAUT`→surventilation), priorité **local > distant** (réactive l'actionneur tant que le seuil est déchu), alerte liaison `mqtt_publish_alert` si WiFi/MQTT perdu (toutes 30 s). Intégré à `main.cpp` (suppression d'un `yield()}` orphelin laissé par une édition). Build **SUCCESS** (RAM 14.5 %, Flash 72.9 %), lib `HTTPClient` ajoutée au graphe de dépendances. | opencode |
| 2026-09-02 | **7.7 (A)** | **Fin de la Phase 7 (partie A).** `Iot/README.md` complet rédigé : architecture firmware (table des modules), câblage GPIO, configuration (`config.h` gitignoré + NVS), build/flash PlatformIO, comportement runtime (mesures MQTT, workflow commandes, fallback HTTP, automatisation, liaison) et **guide de tests matériels 7.7 §6** (upload, capteurs, actionneurs, MQTT, workflow, automatisation). La **validation (B) reste à jouer avec le vrai ESP32** (aucun port série détecté à ce jour) : 7.7 test réel + 6.2-6.4 + 4.5, en toute dernière position conformément au découpage A/B acté. Build final **SUCCESS** (RAM 14.5 %, Flash 72.9 %). | opencode |
| 2026-09-02 | **A** | **Cohérence `humidite_air` (backend).** `backend/services/mqtt_service.py` : `TYPE_A_CAPTEUR` += `"humidite_air":"dht22"` ; `TYPE_A_UNITE` += `"humidite_air":"%"` ; `luminosite`/`luminosite_lux` passées de `lx` à `%` (alignée sur le capteur LDR du firmware). | opencode |
| 2026-09-02 | **B** | **ACL fiabilité par nom actionneur.** `backend/schemas/commande.py` : champ `nom_actionneur: Optional[str]` dans `CommandeResponse`. `backend/routes/commandes.py` : `commandes_en_attente()` peuple `c.nom_actionneur = c.actionneur.nom` (boucle explicite). Le firmware pilote désormais par **nom** (fallback mapping id conservé). | opencode |
| 2026-09-02 | **C** | **Endpoint IoT `GET /api/capteurs/iot`.** `backend/routes/capteurs.py` : nouvelle route `GET /iot` (avant `GET /{id}` pour éviter le conflit de routage), param `parcelle` (query), auth **clé API** (`get_client_cle_api`), résout `Parcelle.nom`, filtre les capteurs actifs, inverse `TYPE_A_CAPTEUR` (nom→types) et renvoie `{type_mesure: {id, nom, unite}}`. Import `Token` ajouté. Le firmware charge ce mapping au boot. | opencode |
| 2026-09-02 | **D** | **ACL Mosquitto : `sai_esp32` écrit aussi les actionneurs.** `mosquitto/acl` : `topic write sai/+/actionneurs/#` ajouté au bloc `sai_esp32` (pour la publication d'état d'actionneur). Fichier réécrit en LF, UTF-8 sans BOM (octets préservés). Bloc final `sai_esp32` = read `sai/+/commandes` + write `sai/+/capteurs/#` + `sai/+/actionneurs/#` + `sai/+/alertes`. | opencode |
| 2026-09-02 | **F** | **Seuils luminosité en %.** `backend/seed.py` : seuil `luminosite` = `valeur_min 20 / valeur_max 80 / unite "%"` (remplace 200/2000 lx), cohérent avec la mesure LDR en % du firmware. | opencode |
| 2026-09-02 | **H** | **Simulateur aligné sur le firmware.** `backend/scripts/mqtt_simulateur.py` : `NOMINAUX["luminosite"]` 1500.0 → **60.0** (%), variation `±300` → `±10`, `round(...,0)`. | opencode |
| 2026-09-02 | **G** | **Frontend luminosité en %.** `Dashboard.jsx` : jauge luminosité `unite "%"`, `min 0`, `max 100` (remplace lx/2000) ; `SENSOR_CONFIG` ligne bh1750 `unit '%'`. `Thresholds.jsx` : slider luminosité `step 50→5`, `max 5000→100`. `GaugeCard.jsx` (`iconType='lux'`) inchangé (icône interne, aucune unité affichée). | opencode |
| 2026-09-02 | **E** | **Bug workflow 7.5 corrigé + chargement mapping au boot.** `Iot/src/http_commands.cpp/.h` : (1) `creer_action()` lit désormais **l'`id` de l'action** dans la réponse 201 (était ignorée → jamais de clôture) ; (2) nouvel état `A_CLOTURE` : après exécution, `PUT /api/actions/{id}` `{statut:'termine', resultat:'ok'}` **avant** de marquer la commande `executee` ; (3) `executer_actionneur()` utilise le `nom_actionneur` reçu du backend (fallback mapping codé si absent) ; (4) nouvelle API publique `http_load_mapping_capteurs()` : `GET /api/capteurs/iot?parcelle=<nom>` au boot → remplit `mapping_capteurs` (IDs résolus depuis la BD). Appelée depuis `http_commands_begin()`. Build **SUCCESS** (RAM 14.5 %, Flash 73.2 %). | opencode |
| 2026-09-02 | **I** | **Validation cohérence + tests ajoutés.** `tests/test_mqtt_service.py` : `test_traiter_payload_insere_humidite_air` (mapping `humidite_air`→dht22, unité %) ; `tests/test_iot.py` : `test_attente_renvoie_nom_actionneur` (pull expose le nom) ; **nouveau `tests/test_capteurs_iot.py`** (3 tests) : résolution IDs (temperature/humidite_air + bh1750 unité %), parcelle inconnue 404, clé API requise. **39 passed** (iot + capteurs_iot + mqtt + actions + capteurs). Note : `test_creer_web_sans_user_echoue` (pré-existant) reste rouge (incohérence interne du test, sans rapport avec ces changements). | opencode |
| 2026-09-02 | **J** | **Dernières incohérences seed corrigées.** `backend/seed.py` : (1) bh1750 `gpio` 21→**36** + `protocole` "i2c"→"analog" (aligné sur `pins.h GPIO_LDR=36`, la LDR remplace le BH1750 I2C) ; (2) mesures mock bh1750 `unite` "lux"→"**%**" et plage 100-3000→**0-100** (cohérent avec firmware `map_pourcent()` et jauges Dashboard 0-100%). Vérification : **39 passed** inchangés. | opencode |