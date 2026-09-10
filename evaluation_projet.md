# Evaluation du Projet — Systeme Agricole Intelligent (SAI)

> Analyse croisee du cahier des charges (`Documentation/cahier_charge.md`) et de la realisation effective du prototype.

---

## I. Fonctionnalites realisees

### 1. Collecte des donnees avec des capteurs (CDC 1)

| Exigence | Statut | Details |
|----------|--------|---------|
| Capteur d'humidite du sol (YL-69) | **OK** | Firmware `sensors.cpp` : lecture ADC, conversion pourcentage, lissage glissant |
| Capteur de temperature/humidite (DHT22) | **OK** | Lecture via bibliotheque Adafruit, temperature + humidite air |
| Capteur de luminosite (BH1750/LDR) | **OK** | LDR analogique avec calibration (plage [300-3600], mapping pourcentage) |
| Capteur de CO2 (SEN0159/MQ-135) | **OK** | Calibration Rs/Ro, conversion en ppm |
| Capteur de niveau d'eau (HC-SR04) | **OK** | Capteur ultrason, formule : `pct = (200 - distance_mm) / 180 x 100`, diviseur 5V->3.3V |
| Envoi des donnees vers serveur | **OK** | MQTT (TLS 8883) via `mqtt_publisher.cpp` + fallback HTTP POST `/api/mesures` |
| Base de donnees centralisee | **OK** | PostgreSQL + SQLAlchemy, 11 tables, 5 types de mesure standard |
| Algorithme de filtrage | **OK** | Filtre glissant (`FiltreGlissant`) pour lisser les lectures capteurs |

### 2. Automatisation avec microcontroleur (CDC 2)

| Exigence | Statut | Details |
|----------|--------|---------|
| Automatisation de l'irrigation | **OK** | Seuil humidite sol basse -> pompe ON (`automation.cpp` + `automatisation_service.py`) |
| Automatisation de la ventilation | **OK** | Seuil temperature haute ou CO2 eleve -> ventilation ON |
| Eclairage automatique | **OK** | Seuil luminosite basse -> eclairage ON |
| Arret automatique | **OK** | Boucle d'evaluation toutes les 5 min (backend) + 10 s (local ESP32) |
| Automatisation locale (embaryee) | **OK** | `automation.cpp` : seuils locaux avec hysteresis, priorite local > distant |
| Automatisation serveur | **OK** | `automatisation_service.py` : thread daemon, evaluation par parcelle, dedoublonnage |

### 3. Application web pour gestion centralisee (CDC 3)

| Exigence | Statut | Details |
|----------|--------|---------|
| Authentification (login + mot de passe) | **OK** | JWT HS256 (24h), bcrypt (werkzeug) |
| Affichage des donnees capteurs dans le temps | **OK** | Dashboard avec 6 jauges, graphique Chart.js (24h/7j), tendances |
| Envoi d'actions au controleur | **OK** | Commandes ON/OFF depuis le Dashboard, flux pull/confirm ESP32 |
| Historisation des actions | **OK** | Table `historique_actions` + page History (2 onglets) |
| Export CSV | **OK** | Export CSV depuis History (BOM pour Excel) |
| Min 3 pages web | **OK** | 13 pages fonctionnelles |
| Application responsive | **OK** | Mobile-first, Tailwind 4, BottomNav, Sidebar overlay |

### 4. Notifications et alertes (CDC 4)

| Exigence | Statut | Details |
|----------|--------|---------|
| 5 types d'alertes (humidite, temperature, CO2, eau, luminosite) | **OK** | Tous implementes dans `automatisation_service.py` avec dedoublonnage |
| Transmission via application web | **OK** | MQTT push + panneau Dashboard + page Alertes |
| Gestion des etats d'alerte | **OK** | active -> reconnue -> resolue |

### 5. Securisation de l'architecture (CDC 5)

| Exigence | Statut | Details |
|----------|--------|---------|
| Mots de passe chiffres | **OK** | bcrypt via werkzeug |
| Protocole securise | **OK** | MQTT TLS 8883, PKI complete |
| Journalisation | **OK** | `historique_actions` + `cli.log` + `server.log` |
| Privileges differents | **OK** | Roles agriculteur/admin, RBAC |
| Rate limiting | **OK** | slowapi, 4 niveaux configurables |

### 6. Batch script (CDC 6)

| Exigence | Statut | Details |
|----------|--------|---------|
| CLI avec actions arrosage/ventilation | **OK** | 13+ sous-commandes |
| Verification niveau reservoir | **OK** | Blocage si < 5% (sauf `--oui`) |
| Confirmation interactive | **OK** | Prompt `[o/N]` pour actions critiques |
| Journalisation | **OK** | `cli.log` |

### 7. Diagrammes et documentation

| Exigence | Statut |
|----------|--------|
| Cas d'utilisation | **OK** |
| 6 scenarios d'interaction | **OK** |
| 4 diagrammes d'activite | **OK** |
| MCD / MLD | **OK** |
| Schema electronique (Fritzing) | **OK** |
| Architecture deploiement (local + prod) | **OK** |
| Architecture reseau (local + prod) | **OK** |
| Document de specification | **OK** |
| Document de conception | **OK** |
| MPD (SQL) | **OK** (pas de diagramme visuel) |

### 8. Tests

| Composante | Etat |
|------------|------|
| Backend pytest (~113 cas, 16 fichiers) | **OK** |
| CLI integration test (14 commandes) | **OK** |
| Simulateur ESP32 | **OK** |
| BD de test isolee `sai_test` | **OK** |

---

## II. Fonctionnalites partiellement realisees

| Fonctionnalite | Avancement | Manque |
|----------------|------------|--------|
| **Multilingue (fr/en)** | 0% | Aucune infrastructure i18n, toutes les chaines hardcodees en francais |
| **Firmware ESP32** | 95% | Compile, non valide sur materiel reel. TLS MQTT desactive (`setInsecure()`) |
| **Dashboard API** | 80% | Utilise 5 appels API au lieu de l'endpoint unique `/api/dashboard` |
| **Page Profile** | 90% | Bug latent : `handleToggle2FA` reference un etat inexistant |
| **MPD visuel** | 80% | SQL present, pas de diagramme .drawio/.svg/.png |

---

## III. Difficultes rencontrees

### A. Electronique

| Difficulte | Impact | Commentaire |
|------------|--------|-------------|
| **Compatibilite TLS MQTT (mbedTLS -9984)** | Eleve | Le certificat CA embarque dans `ca_cert.h` pose un probleme de verification avec le client PubSubClient sur ESP32. Contournement par `setInsecure()` — a resoudre avant production. |
| **Diviseur de tension HC-SR04 (5V -> 3.3V)** | Moyen | Le capteur ultrason fonctionne en 5V mais l'ESP32 est en 3.3V. Un diviseur resistif (1k/1k ou 1k/2k) est necessaire sur la broche ECHO. Solution documentee dans `README.md` mais delicate a monter. |
| **Calibration des capteurs analogiques** | Moyen | YL-69, LDR, MQ-135 necessitent une calibration manuelle (plages ADC, constantes Ro/Rs). Les valeurs par defaut dans `config.h` peuvent varier selon le materiel. |
| **Alimentation electrique** | Moyen | 5 capteurs + 3 relais + buzzer = consommation non negligeable. L'ESP32 seul ne peut pas alimenter tous les composants. Source d'alimentation externe necessaire. |
| **Branchements GPIO** | Faible | 10 composants sur 38 broches GPIO — marge suffisante, mais le cablage physique reste complexe (10+ fils). |

### B. Programmation

| Difficulte | Impact | Commentaire |
|------------|--------|-------------|
| **Architecture non-bloquante ESP32** | Eleve | Pas de `delay()` long dans le firmware — tout est base sur `millis()` avec un scheduler. Complexite importante pour maintenir la reactivite (commandes toutes les 1s, mesures toutes les 10s, alertes toutes les 30s). |
| **Machine a etats HTTP (ESP32)** | Eleve | Le workflow pull/confirm/action/close dans `http_commands.cpp` (466 lignes) implemente un etat complet IDLE->A_CONFIRMER->A_ACTION->A_EXECUTER->A_CLOTURE avec gestion d'erreurs et retries. |
| **Dedoublonnage des alertes** | Moyen | L'automatisation doit eviter de creer des alertes en double. Implementation via `_alerte_deja_active()` + `_commande_en_attente()` — logique non triviale. |
| **Synchronisation MQTT temps reel** | Moyen | 3 clients MQTT separes (backend subscriber, backend publisher, frontend WebSocket) avec roles ACL distincts. Coordination des topics et reconnexion automatique. |
| **Tests d'integration IoT** | Moyen | Le `test_cli.py` demarre le serveur en arriere-plan et lance des commandes CLI — fragile si le serveur n'est pas pret a temps (timeout 5s). |
| **Gestion des erreurs reseau** | Faible | ESP32 avec reconnexion WiFi/MQTT exponentielle (2s a 60s), fallback HTTP si MQTT down. |

### C. Reseau

| Difficulte | Impact | Commentaire |
|------------|--------|-------------|
| **Configuration TLS du broker Mosquitto** | Eleve | Mise en place d'une PKI complete (CA + serveur), configuration double listener (8883 TLS + 9001 WebSocket), scripts PowerShell de generation de certificats. |
| **ACL Mosquitto (3 utilisateurs)** | Moyen | 3 comptes MQTT (`sai_backend`, `sai_esp32`, `sai_frontend`) avec permissions par topic. Fichier `acl` + `passwd`.hashe. |
| **Connectivite WiFi ESP32** | Moyen | Mode STA non-bloquant avec reconnexion auto. Le WiFi doit etre stable pour le fonctionnement MQTT. |
| **Proxy Vite en developpement** | Faible | Configuration `vite.config.js` pour rediriger `/api` vers `localhost:8000` — ajoute une couche de complexite en dev. |
| **Port multiple** | Faible | Backend (8000), Frontend (3000/5173), Mosquitto TLS (8883), Mosquitto WS (9001) — documentation dans `lancement_service.md`. |

### D. Difficultes liees a l'integration

| Difficulte | Impact | Commentaire |
|------------|--------|-------------|
| **Integration ESP32 <-> Backend** | Eleve | Le firmware doit respecter le contrat `INTERFACE.md` (endpoints, formats JSON, topics MQTT). La resolution dynamique des IDs capteur/actionneur depuis le backend ajoute de la complexite. |
| **Integration MQTT <-> HTTP** | Eleve | Double protocole avec fallback : MQTT primaire, HTTP backup. Le frontend subscribe en WebSocket (port 9001) pendant que le backend subscribe en TLS (port 8883). |
| **Integration Frontend <-> Backend** | Moyen | Le frontend appelle 26+ endpoints REST. L'auto-attachement du JWT via intercepteur Axios + gestion des 401. |
| **Integration CLI <-> Backend** | Moyen | Le CLI gere 2 modes d'auth (JWT pour user, API key pour IoT) dans un seul `APIClient`. Config JSON locale gitignoree. |
| **Integration Automatisation <-> MQTT** | Moyen | La boucle d'automatisation genere des alertes qu'elle publie sur MQTT pour le temps reel frontend — pas de blocage HTTP. |
| **Synchronisation etats actionneurs** | Moyen | L'ESP32 publie l'etat des actionneurs sur `sai/+/actionneurs/#` — le frontend met a jour ses jauges en temps reel. Potentiel de desynchronisation si le message est perdu. |
| **Alembic vs MPD SQL** | Faible | Le `mpd.sql` est incomplet (pas de colonne `actif`, pas de table `historique_actions`). La source de verite est Alembic — confusion possible. |

---

## IV. Fonctionnalites non realisees

| Fonctionnalite | Priorite CDC |
|----------------|-------------|
| **Multilingue francais/anglais** | Haute (exigence explicite CDC Section I.4) |
| **Document de gestion de projet (Gantt, budget)** | Haute (CDC Section III.3) |
| **Manuel utilisateur agriculteur** | Moyenne (CDC Module 8.3) |
| **Guide installation/maintenance formel** | Moyenne (CDC Module 8.3) |
| **Verification TLS MQTT sur ESP32** | Haute (exigence CDC Section 5) |
| **Refresh token JWT** | Basse |
| **Reinitialisation mot de passe par email** | Basse |
| **Tests frontend (Vitest)** | Basse |
| **Deploiement production (Docker/nginx)** | Basse |
| **Push notifications mobile** | Basse |

---

## V. Synthese quantitative

| Composante | Fichiers | Lignes (est.) | Couverture CDC |
|------------|----------|---------------|----------------|
| Backend (FastAPI) | ~30 | ~4000 | ~98% |
| Frontend (React) | ~50 | ~8000 | ~90% |
| IoT firmware (Arduino C++) | ~12 | ~1500 | ~85% |
| CLI (Python) | ~10 | ~1200 | ~95% |
| Tests | ~18 | ~2500 | ~90% |
| Diagrammes UML/Merise | ~40 | — | ~90% |
| Documentation | ~15 | — | ~80% |
| **Total** | **~175** | **~17200** | **~90%** |

---

## VI. Conclusion

Le projet SAI est un prototype **solide et fonctionnel** qui couvre l'essentiel des exigences du cahier des charges. Les trois composantes (IoT, application web, CLI) sont operationnelles avec une architecture bien structuree (3 couches), une base de donnees PostgreSQL complete (11 tables), un broker MQTT securise (TLS + ACL), et une suite de tests etendue (~113 cas).

**Les points forts :**
- Architecture technique rigoureuse (non-bloquant ESP32, MQTT + HTTP fallback, RBAC)
- Securite complete (JWT, bcrypt, API keys, rate limiting, TLS)
- Frontend moderne et responsive (React 19, Tailwind 4, MQTT temps reel)
- Tests d'integration backend et CLI
- Documentation technique abondante (diagrammes UML, Merise, schema electronique)

**Les points a ameliorer avant la soutenance :**
- Multilingue non implemente (exigence CDC)
- TLS MQTT non valide sur ESP32 (`setInsecure()`)
- Pas de document de gestion de projet (Gantt, budget)
- Pas de tests frontend
- Pas de manuel utilisateur final
