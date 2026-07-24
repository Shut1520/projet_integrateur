# Diagramme de Cas d'Utilisation — SAI (Système Agricole Intelligent)

## 📖 Introduction

Le diagramme de cas d'utilisation (Use Case) est le premier diagramme UML que l'on réalise dans la phase de conception. Il répond à une question fondamentale :

> **Qui fait quoi dans le système ?**

Il permet de :
- Définir les **limites du système** (ce qui est dedans vs dehors)
- Identifier les **acteurs** qui interagissent avec lui
- Lister les **fonctionnalités** attendues (les cas d'utilisation)
- Montrer les **relations** entre cas d'utilisation (inclusion, extension, héritage)

---

## 🎭 Les Acteurs

### Acteurs Primaires (humains)

| Acteur | Description | Pourquoi c'est un acteur primaire |
|--------|-------------|----------------------------------|
| **Agriculteur** | Utilisateur principal du système | C'est l'utilisateur métier cible : il consulte le tableau de bord, commande les actionneurs et configure les seuils |
| **Administrateur** | Agriculteur avec droits de gestion des utilisateurs | Il hérite de l'Agriculteur et peut en plus gérer les comptes (création, rôles, suppression) |

**L'héritage entre Agriculteur et Administrateur** : L'Administrateur peut tout faire comme un Agriculteur, plus les actions d'administration. C'est une relation d'héritage UML (`◁—`) car l'Admin est un cas particulier d'Agriculteur.

### Acteurs Secondaires (systèmes)

| Acteur | Description | Pourquoi c'est un acteur |
|--------|-------------|--------------------------|
| **ESP32** | Microcontrôleur embarqué | Il interagit avec le système en publiant des mesures sur MQTT et en recevant des commandes. C'est un système externe qui communique avec le backend |
| **Horloge Système (Temps)** | Déclencheur temporel | L'automatisation n'est pas déclenchée par un humain mais par le temps (toutes les 5 minutes, le système vérifie les seuils) |

### Pourquoi les interfaces ne sont pas des acteurs

Le **navigateur web** et le **terminal CLI** ne sont pas des acteurs car ils font **partie intégrante du système** que l'on conçoit. Ce sont des interfaces qui permettent aux acteurs humains d'interagir avec le système. Ils apparaîtront comme des **lignes de vie** dans les diagrammes de séquence et comme des **nœuds** dans le diagramme de déploiement.

---

## 📦 Les Cas d'Utilisation

### Paquet 1 : Authentification

#### UC1 — S'authentifier
- **Acteur** : Agriculteur (et Admin par héritage)
- **Description** : L'utilisateur se connecte au système avec son identifiant et mot de passe pour accéder aux fonctionnalités
- **Déclencheur** : L'utilisateur ouvre l'application web
- **Précondition** : L'utilisateur possède un compte valide
- **Postcondition** : L'utilisateur obtient un token JWT et accède au dashboard

**Relations** :
- `<<include>>` → **Valider les identifiants** : Obligatoire. À chaque connexion, le système vérifie que le login existe et que le mot de passe correspond
- `<<include>>` → **Vérifier le rôle utilisateur** : Obligatoire. Le système détermine si l'utilisateur est simple Agriculteur ou Administrateur pour adapter les fonctionnalités disponibles
- `<<extend>>` → **Récupérer le mot de passe** : Optionnel. Proposé seulement si l'utilisateur a oublié son mot de passe
- `<<extend>>` → **Afficher un message d'erreur** : Optionnel. Déclenché si les identifiants sont incorrects, le compte n'existe pas, ou les champs sont invalides. Le message diffère selon l'erreur pour guider l'utilisateur sans donner d'information sensible ("Identifiants incorrects" sans préciser si c'est le login ou le mot de passe)

---

### Paquet 2 : Surveillance & Consultation

#### UC2 — Consulter le tableau de bord
- **Acteur** : Agriculteur
- **Description** : L'utilisateur accède à la page principale du dashboard qui affiche en temps réel les mesures des capteurs, l'état des actionneurs et les alertes actives
- **Déclencheur** : Connexion réussie ou navigation vers la page d'accueil
- **Précondition** : L'utilisateur est authentifié
- **Postcondition** : Les données temps réel des capteurs sont affichées sous forme de graphiques et jauges
- **Note** : Ce cas inclut le rafraîchissement périodique des données (toutes les 30s)

#### UC3 — Visualiser l'historique des mesures
- **Acteur** : Agriculteur
- **Description** : L'utilisateur consulte l'historique des mesures sur une période choisie
- **Déclencheur** : Navigation vers la page Historique
- **Précondition** : Authentifié
- **Postcondition** : Les données historiques sont affichées sous forme de graphiques ou tableau

**Relations** :
- `<<extend>>` → **Filtrer par date / capteur / parcelle** : Optionnel. L'utilisateur peut affiner sa recherche selon plusieurs critères
- `<<extend>>` → **Exporter les données en CSV** : Optionnel. L'utilisateur peut télécharger un fichier CSV des données affichées pour une analyse externe

---

### Paquet 3 : Contrôle Manuel

Ce paquet regroupe les deux interfaces par lesquelles l'utilisateur peut commander les actionneurs. Les deux cas sont accessibles à l'Agriculteur et à l'Administrateur.

#### UC4 — Commander un actionneur depuis l'interface web
- **Acteur** : Agriculteur
- **Description** : L'utilisateur clique sur un bouton dans le dashboard web pour activer ou désactiver la pompe, la ventilation ou l'éclairage
- **Déclencheur** : Clic sur le bouton "Arroser", "Ventiler" ou "Éclairer"
- **Précondition** : Authentifié
- **Postcondition** : La commande est envoyée au backend qui la relaye à l'ESP32 via MQTT

**Relations** :
- `<<include>>` → **Sélectionner l'actionneur** : Obligatoire. L'utilisateur doit choisir quel actionneur commander (pompe/ventilation/éclairage)
- `<<include>>` → **Envoyer la commande au backend** : Obligatoire. La requête HTTP POST est envoyée à l'API
- `<<extend>>` → **Programmer une durée d'activation** : Optionnel. L'utilisateur peut spécifier une durée (ex : "Arroser pendant 30 secondes"). Si non spécifié, une durée par défaut est utilisée

#### UC5 — Commander un actionneur depuis la ligne de commande CLI
- **Acteur** : Agriculteur (et Admin)
- **Description** : L'utilisateur exécute un script Python dans son terminal pour commander les actionneurs
- **Déclencheur** : L'utilisateur tape une commande `python batch.py --action arrosage --duree 60`
- **Précondition** : Le script CLI est installé et accessible
- **Postcondition** : La commande est envoyée au backend via API REST

**Relations** :
- `<<include>>` → **S'authentifier via clé API** : Obligatoire. Le script doit fournir un token ou une clé API pour s'authentifier
- `<<include>>` → **Choisir l'action et les paramètres** : Obligatoire. L'utilisateur spécifie la commande (arrosage, ventilation, éclairage) et les paramètres (durée, parcelle)
- `<<extend>>` → **Exécuter une action en lot** : Optionnel. Le CLI permet d'appliquer la même action sur plusieurs parcelles simultanément

**Différence fondamentale entre UC4 et UC5** :

| Critère | UC4 — Web | UC5 — CLI |
|---------|-----------|-----------|
| Interface | Navigateur (graphique) | Terminal (texte) |
| Authentification | Session web (JWT implicite) | Clé API explicite |
| Actions possibles | Un actionneur à la fois | Un ou plusieurs en lot |
| Usage typique | Surveillance quotidienne | Automatisation, scripts batch |
| Connexion requise | Oui (navigateur) | Oui (API) mais script en local |

---

### Paquet 4 : Automatisation & Alertes

> ⚠️ **Important** : L'Agriculteur n'est PAS associé à ce cas d'utilisation. Il ne déclenche pas l'automatisation. Seul le temps le fait.

#### UC6 — Exécuter les règles d'automatisation
- **Acteur** : Horloge Système (Temps)
- **Description** : Le système vérifie périodiquement (toutes les 5 minutes) les dernières mesures des capteurs et les compare aux seuils configurés. Si les conditions sont remplies, il agit automatiquement sans intervention humaine
- **Déclencheur** : Timer périodique (toutes les 5 min)
- **Précondition** : Des seuils ont été configurés (UC7)
- **Postcondition** : Selon les cas, un actionneur est activé/désactivé ou une alerte est déclenchée

**Relations** :
- `<<include>>` → **Lire les dernières mesures capteurs** : Obligatoire. Le système récupère les dernières valeurs stockées en base de données pour chaque capteur
- `<<include>>` → **Comparer aux seuils configurés** : Obligatoire. Chaque mesure est comparée aux seuils définis par l'Agriculteur
- `<<extend>>` → **Déclencher une alerte** : Optionnel. Seulement si une valeur dépasse un seuil critique (ex : humidité < 20%, CO2 > 1000 ppm). L'alerte apparaît dans le dashboard
- `<<extend>>` → **Activer/désactiver un actionneur** : Optionnel. Seulement si les conditions d'automatisation sont remplies (ex : humidité < 30% → pompe ON)

**Où s'exécute cette automatisation ?**

| Mode | Lieu d'exécution | Situation |
|------|------------------|-----------|
| Normal | Backend (FastAPI) | Connexion internet disponible |
| Dégradé | ESP32 (local) | Perte de connexion, le firmware prend le relais |

**Scénarios concrets d'automatisation** :
1. **Irrigation** : Si humidité sol < 30% → activer pompe → arrêter quand humidité > 50%
2. **Ventilation** : Si température > 35°C OU CO2 > 1000 ppm → activer ventilation → arrêter quand température < 30°C ET CO2 < 800 ppm
3. **Éclairage** : Si luminosité < 200 lux pendant plus d'1h → allumer → éteindre quand luminosité > 400 lux
4. **Alerte réservoir** : Si niveau d'eau < 10% → notification "Réservoir vide"

> Note : L'Agriculteur n'exécute PAS ce cas. En revanche, il peut **configurer les seuils** (UC7) qui déterminent quand et comment l'automatisation se déclenche.

---

### Paquet 5 : Configuration & Administration

Ce paquet regroupe toutes les fonctionnalités de configuration du système et de gestion des ressources. L'Administrateur a accès à l'ensemble de ces fonctionnalités, tandis que l'Agriculteur peut configurer les seuils et gérer ses parcelles.

#### UC7 — Configurer les seuils d'alerte
- **Acteur** : Agriculteur (et Admin par héritage)
- **Description** : L'utilisateur définit ou modifie les valeurs seuils qui déclenchent les alertes et l'automatisation
- **Déclencheur** : Navigation vers la page Paramètres
- **Précondition** : Authentifié
- **Postcondition** : Les nouveaux seuils sont sauvegardés en base de données et pris en compte par le moteur d'automatisation

**Relations** :
- `<<include>>` → **Sauvegarder la configuration** : Obligatoire. Les seuils sont persistés en base de données

**Seuils configurables** :
| Paramètre | Valeur par défaut | Unité |
|-----------|-------------------|-------|
| Humidité sol minimale | 30 | % |
| Humidité sol maximale | 70 | % |
| Température maximale | 35 | °C |
| CO2 maximal | 1000 | ppm |
| Luminosité minimale | 200 | lux |
| Niveau d'eau critique | 10 | % |

#### UC8 — Gérer les utilisateurs
- **Acteur** : Administrateur
- **Description** : L'administrateur crée, modifie ou supprime des comptes utilisateurs
- **Déclencheur** : Navigation vers la page Gestion des utilisateurs
- **Précondition** : Authentifié avec le rôle Administrateur
- **Postcondition** : La base de données des utilisateurs est mise à jour

**Relations** :
- `<<include>>` → **Créer un compte utilisateur** : Obligatoire pour ajouter un utilisateur
- `<<include>>` → **Attribuer un rôle** : Obligatoire. Chaque utilisateur doit avoir un rôle (agriculteur, admin, consultatif)
- `<<include>>` → **Supprimer un compte** : Obligatoire pour retirer un accès

#### UC12 — Gérer les capteurs
- **Acteur** : Administrateur
- **Description** : L'administrateur enregistre, modifie ou supprime les capteurs installés sur les parcelles. Cela inclut l'ajout d'un nouveau capteur après installation physique par un technicien, la modification de ses paramètres (nom, référence, seuils associés) ou sa suppression lors d'un retrait.
- **Déclencheur** : Installation d'un nouveau capteur, remplacement, panne, ou réorganisation des équipements
- **Précondition** : Authentifié avec le rôle Administrateur
- **Postcondition** : La base de données des capteurs est mise à jour. L'ajout d'un capteur le rend disponible pour la collecte de mesures et l'automatisation.

**Relations** :
- `<<include>>` → **Associer le capteur à une parcelle** : Obligatoire. Un capteur doit être lié à une parcelle existante pour que ses mesures soient contextualisées
- `<<include>>` → **Configurer le type et la référence** : Obligatoire. L'administrateur renseigne le nom (DHT22, YL-69, BH1750, SEN0159, niveau d'eau), la référence constructeur et la position GPS/descriptive du capteur
- `<<extend>>` → **Étalonner le capteur** : Optionnel. Permet d'appliquer un offset ou un facteur de correction si le capteur dérive dans le temps

#### UC13 — Gérer les actionneurs
- **Acteur** : Administrateur
- **Description** : L'administrateur enregistre, modifie ou supprime les actionneurs installés (pompe, ventilation, éclairage). L'enregistrement permet au système de savoir quel actionneur est disponible sur quelle parcelle et quels sont ses paramètres de fonctionnement.
- **Déclencheur** : Installation d'un nouvel actionneur, remplacement, ou retrait
- **Précondition** : Authentifié avec le rôle Administrateur
- **Postcondition** : La base de données des actionneurs est mise à jour. L'actionneur devient disponible pour les commandes manuelles (UC4, UC5) et l'automatisation (UC6).

**Relations** :
- `<<include>>` → **Associer l'actionneur à une parcelle** : Obligatoire. Un actionneur est toujours lié à une parcelle spécifique
- `<<include>>` → **Configurer le type et la référence** : Obligatoire. L'administrateur précise le nom (pompe, ventilation, éclairage), la référence constructeur et les caractéristiques techniques
- `<<include>>` → **Définir les paramètres par défaut** : Obligatoire. Durée d'activation par défaut, mode de fonctionnement (automatique/manuel), GPIO ESP32 associé

#### UC14 — Gérer les parcelles
- **Acteur** : Administrateur, Agriculteur
- **Description** : L'utilisateur crée, modifie ou supprime les parcelles agricoles. Une parcelle est une unité de culture physique qui regroupe des capteurs, des actionneurs et des seuils. L'Agriculteur peut ajouter une parcelle après un rachat de terrain, l'Administrateur peut en créer pour organiser le système.
- **Déclencheur** : Acquisition d'un nouveau terrain, division d'une parcelle existante, ou réorganisation
- **Précondition** : Authentifié
- **Postcondition** : La base de données des parcelles est mise à jour. Une nouvelle parcelle est prête à recevoir des capteurs et actionneurs.

**Relations** :
- `<<include>>` → **Ajouter une parcelle avec ses informations** : Obligatoire. Nom, superficie (m²), type de culture, localisation (GPS ou adresse)
- `<<include>>` → **Modifier les informations de la parcelle** : Obligatoire pour mettre à jour les données (changement de culture, superficie ajustée)
- `<<include>>` → **Supprimer une parcelle** : Obligatoire avec confirmation. La suppression archive les mesures associées (pas de perte d'historique)
- `<<extend>>` → **Transférer la parcelle à un autre utilisateur** : Optionnel. Permet de changer le propriétaire/exploitant de la parcelle.

---

### Paquet 6 : Communication IoT

Ces cas d'utilisation sont exécutés par l'ESP32. Il s'agit du **firmware embarqué** qui tourne sur le microcontrôleur.

#### UC9 — Collecter les données des capteurs
- **Acteur** : ESP32
- **Description** : L'ESP32 lit périodiquement les valeurs des capteurs (DHT22, YL-69, BH1750, SEN0159, niveau d'eau) et les publie sur le broker MQTT
- **Déclencheur** : Timer interne (toutes les 10 secondes, configurable)
- **Précondition** : ESP32 sous tension, capteurs connectés et fonctionnels, Wi-Fi connecté
- **Postcondition** : Les mesures sont publiées sur le topic MQTT `sai/parcelle1/capteurs/mesures`

**Relations** :
- `<<include>>` → **Lire la valeur physique du capteur** : Obligatoire. L'ESP32 lit la broche analogique ou numérique correspondant à chaque capteur
- `<<include>>` → **Publier la mesure sur le topic MQTT** : Obligatoire. Les données formatées en JSON sont envoyées au broker

#### UC10 — Recevoir et exécuter une commande
- **Acteur** : ESP32
- **Description** : L'ESP32 reçoit un message MQTT du backend et active/désactive le relais correspondant (pompe, ventilation, éclairage)
- **Déclencheur** : Message MQTT reçu sur le topic `sai/parcelle1/actionneurs/{type}/cmd`
- **Précondition** : ESP32 connecté au broker MQTT, abonné aux topics de commande
- **Postcondition** : Le relais est activé ou désactivé selon la commande reçue

**Relations** :
- `<<include>>` → **Interpréter le message MQTT reçu** : Obligatoire. L'ESP32 parse le JSON pour extraire le type d'actionneur et l'état demandé
- `<<include>>` → **Activer/désactiver le relais** : Obligatoire. La broche GPIO correspondante est mise à HIGH ou LOW
- `<<extend>>` → **Signaler une erreur d'exécution** : Optionnel. Si le relais ne répond pas ou qu'une surintensité est détectée, un message d'erreur est publié sur le topic d'alerte

#### UC11 — Gérer la connexion réseau
- **Acteur** : ESP32
- **Description** : L'ESP32 maintient la connexion Wi-Fi et au broker MQTT, et réagit en cas de perte de connexion
- **Déclencheur** : Démarrage, perte de connexion détectée ou timer de vérification
- **Précondition** : ESP32 sous tension
- **Postcondition** : L'ESP32 est connecté au réseau et au broker MQTT, ou en mode dégradé local

**Relations** :
- `<<extend>>` → **Tenter une reconnexion Wi-Fi** : Optionnel. En cas de perte de connexion, l'ESP32 tente de se reconnecter automatiquement avec un backoff exponentiel
- `<<extend>>` → **Basculer en mode dégradé local** : Optionnel. Si la reconnexion échoue, l'ESP32 exécute localement les règles d'automatisation critiques (seuils d'humidité et température) pour protéger les cultures en attendant le retour du réseau

---

## 🔗 Relations UML : Guide de Compréhension

### Inclusion (`<<include>>`)
- **Sens** : De A vers B
- **Signification** : Si tu fais A, tu DOIS faire B. B est obligatoire
- **Exemple** : S'authentifier inclut Valider les identifiants (on ne peut pas s'authentifier sans valider)
- **Code mermaid** : `UC1 --> UC1_inc1`

### Extension (`<<extend>>`)
- **Sens** : De B vers A (flèche en pointillés)
- **Signification** : B peut arriver optionnellement pendant A, sous condition
- **Exemple** : Pendant l'authentification, un message d'erreur peut (ou non) s'afficher
- **Code mermaid** : `UC1_ext -.->|<<extend>>| UC1`

### Héritage des acteurs (`◁—`)
- **Sens** : De l'acteur spécialisé vers l'acteur général
- **Signification** : L'acteur spécialisé peut tout faire comme l'acteur général, plus ses propres cas
- **Exemple** : L'Administrateur hérite d'Agriculteur (il peut consulter, commander, configurer, ET gérer les utilisateurs)
- **Code mermaid** : `Administrateur ---|> Agriculteur`

---

## 📊 Tableau Récapitulatif des Cas d'Utilisation

| ID | Intitulé | Acteur(s) | Type | Relations |
|----|----------|-----------|------|-----------|
| UC1 | S'authentifier | Agriculteur | Principal | include (2), extend (2) |
| UC2 | Consulter le tableau de bord | Agriculteur | Principal | — |
| UC3 | Visualiser l'historique | Agriculteur | Principal | extend (2) |
| UC4 | Commander un actionneur (web) | Agriculteur | Principal | include (2), extend (1) |
| UC5 | Commander un actionneur (CLI) | Agriculteur | Principal | include (2), extend (1) |
| UC6 | Exécuter les règles d'automatisation | Horloge | Automatique | include (2), extend (2) |
| UC7 | Configurer les seuils d'alerte | Agriculteur | Principal | include (1) |
| UC8 | Gérer les utilisateurs | Administrateur | Principal | include (3) |
| UC9 | Collecter les données capteurs | ESP32 | Système | include (2) |
| UC10 | Recevoir et exécuter une commande | ESP32 | Système | include (2), extend (1) |
| UC11 | Gérer la connexion réseau | ESP32 | Système | extend (2) |
| UC12 | Gérer les capteurs | Administrateur | Principal | include (2), extend (1) |
| UC13 | Gérer les actionneurs | Administrateur | Principal | include (3) |
| UC14 | Gérer les parcelles | Agriculteur, Admin | Principal | include (3), extend (1) |

---

## 🖼️ Diagramme complet (Mermaid)

```mermaid
graph TB
    %% Acteurs
    Agriculteur((Agriculteur))
    Administrateur((Administrateur))
    ESP32((ESP32))
    Temps((Horloge<br/>Système))

    %% Héritage acteurs
    Administrateur ---|> Agriculteur

    %% Paquet 1
    subgraph Authentification
        UC1[S'authentifier]
        UC1_inc1[Valider les identifiants]
        UC1_inc2[Vérifier le rôle utilisateur]
        UC1_ext1[Récupérer le mot de passe]
        UC1_ext2[Afficher un message d'erreur]
    end

    %% Paquet 2
    subgraph "Surveillance & Consultation"
        UC2[Consulter le tableau de bord]
        UC3[Visualiser l'historique des mesures]
        UC3_ext1[Filtrer par date / capteur / parcelle]
        UC3_ext2[Exporter les données en CSV]
    end

    %% Paquet 3
    subgraph "Contrôle Manuel"
        UC4[Commander un actionneur<br/>depuis l'interface web]
        UC4_inc1[Sélectionner l'actionneur<br/>pompe / ventilation / éclairage]
        UC4_inc2[Envoyer la commande au backend]
        UC4_ext[Programmer une durée d'activation]

        UC5[Commander un actionneur<br/>depuis la ligne de commande CLI]
        UC5_inc1[S'authentifier via clé API]
        UC5_inc2[Choisir l'action et les paramètres]
        UC5_ext[Exécuter une action en lot<br/>sur plusieurs parcelles]
    end

    %% Paquet 4
    subgraph "Automatisation & Alertes"
        UC6[Exécuter les règles d'automatisation]
        UC6_inc1[Lire les dernières mesures capteurs]
        UC6_inc2[Comparer aux seuils configurés]
        UC6_ext1[Déclencher une alerte<br/>notification dashboard]
        UC6_ext2[Activer / désactiver un actionneur<br/>selon les seuils]
    end

    %% Paquet 5
    subgraph "Configuration & Administration"
        UC7[Configurer les seuils d'alerte<br/>pour l'automatisation]
        UC7_inc[Sauvegarder la configuration]
        UC8[Gérer les utilisateurs]
        UC8_inc1[Créer un compte utilisateur]
        UC8_inc2[Attribuer un rôle<br/>agriculteur / admin / consultatif]
        UC8_inc3[Supprimer un compte]

        UC12[Gérer les capteurs<br/>enregistrer / modifier / supprimer]
        UC12_inc1[Associer le capteur à une parcelle]
        UC12_inc2[Configurer le type et la référence]
        UC12_ext[Étalonner le capteur<br/>offset / facteur correction]

        UC13[Gérer les actionneurs<br/>enregistrer / modifier / supprimer]
        UC13_inc1[Associer l'actionneur à une parcelle]
        UC13_inc2[Configurer le type et la référence]
        UC13_inc3[Définir les paramètres par défaut<br/>durée / GPIO / mode]

        UC14[Gérer les parcelles<br/>créer / modifier / supprimer]
        UC14_inc1[Ajouter une parcelle<br/>nom / superficie / culture]
        UC14_inc2[Modifier les informations]
        UC14_inc3[Supprimer une parcelle<br/>avec confirmation]
        UC14_ext[Transférer la parcelle<br/>à un autre utilisateur]
    end

    %% Paquet 6
    subgraph "Communication IoT"
        UC9[Collecter les données des capteurs]
        UC9_inc1[Lire la valeur physique du capteur]
        UC9_inc2[Publier la mesure sur le topic MQTT]

        UC10[Recevoir et exécuter une commande]
        UC10_inc1[Interpréter le message MQTT reçu]
        UC10_inc2[Activer / désactiver le relais<br/>pompe / ventilo / éclairage]
        UC10_ext[Signaler une erreur d'exécution]

        UC11[Gérer la connexion réseau]
        UC11_ext1[Tenter une reconnexion Wi-Fi]
        UC11_ext2[Basculer en mode dégradé local<br/>automatisation sans serveur]
    end

    %% Connexions acteurs → UC
    Agriculteur --- UC1
    Agriculteur --- UC2
    Agriculteur --- UC3
    Agriculteur --- UC4
    Agriculteur --- UC5
    Agriculteur --- UC7

    Administrateur --- UC8
    Administrateur --- UC12
    Administrateur --- UC13
    Administrateur --- UC14

    Agriculteur --- UC14

    ESP32 --- UC9
    ESP32 --- UC10
    ESP32 --- UC11

    Temps --- UC6

    %% Relations include (obligatoire)
    UC1 --> UC1_inc1
    UC1 --> UC1_inc2
    UC4 --> UC4_inc1
    UC4 --> UC4_inc2
    UC5 --> UC5_inc1
    UC5 --> UC5_inc2
    UC6 --> UC6_inc1
    UC6 --> UC6_inc2
    UC7 --> UC7_inc
    UC8 --> UC8_inc1
    UC8 --> UC8_inc2
    UC8 --> UC8_inc3
    UC12 --> UC12_inc1
    UC12 --> UC12_inc2
    UC13 --> UC13_inc1
    UC13 --> UC13_inc2
    UC13 --> UC13_inc3
    UC14 --> UC14_inc1
    UC14 --> UC14_inc2
    UC14 --> UC14_inc3
    UC9 --> UC9_inc1
    UC9 --> UC9_inc2
    UC10 --> UC10_inc1
    UC10 --> UC10_inc2

    %% Relations extend (optionnel)
    UC1_ext1 -.->|<<extend>>| UC1
    UC1_ext2 -.->|<<extend>>| UC1
    UC3_ext1 -.->|<<extend>>| UC3
    UC3_ext2 -.->|<<extend>>| UC3
    UC4_ext -.->|<<extend>>| UC4
    UC5_ext -.->|<<extend>>| UC5
    UC6_ext1 -.->|<<extend>>| UC6
    UC6_ext2 -.->|<<extend>>| UC6
    UC10_ext -.->|<<extend>>| UC10
    UC11_ext1 -.->|<<extend>>| UC11
    UC11_ext2 -.->|<<extend>>| UC11
    UC12_ext -.->|<<extend>>| UC12
    UC14_ext -.->|<<extend>>| UC14
```

---

## ✅ Validation

Ce diagramme de cas d'utilisation a été conçu en suivant :
- Le **cahier des charges** du projet
- La **spécification technique fonctionnelle**
- Les **choix technologiques** validés (MQTT, ESP32, FastAPI, React, CLI)
- La **conception préliminaire** (architecture 3 couches)

**Prochaine étape** : Diagrammes de séquence pour les 6 scénarios.
