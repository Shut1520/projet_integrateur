sequenceDiagram
    participant "⏱️ Horloge<br/>Système" as Time
    participant "⚙️ Backend<br/>FastAPI" as API
    participant "🗄️ Base de<br/>Données" as BD
    participant "📡 Broker<br/>MQTT" as MQTT
    participant "🔌 ESP32" as ESP
    participant "💧 Pompe" as Pomp
    participant "🌐 Dashboard<br/>Web" as Web

    Note over Time,Web: Scénario : Irrigation automatique par seuil d'humidité

    %% === Phase 1 : Détection ============================================

    loop Toutes les 5 minutes
        Time->>API: ⏰ Vérification des conditions
    end

    API->>BD: SELECT valeur FROM mesures<br/>WHERE capteur = 'humidite_sol'<br/>ORDER BY timestamp DESC LIMIT 1
    BD-->>API: humidite_sol = 25%

    API->>BD: SELECT seuil_min, seuil_max FROM seuils<br/>WHERE parcelle = 'parcelle1'<br/>AND type = 'humidite_sol'
    BD-->>API: seuil_min = 30%, seuil_max = 50%

    API->>API: Vérifier état actuel de la pompe<br/>→ Dernière action = OFF

    Note over API: Décision : 25% < 30%<br/>→ Déclencher irrigation

    %% === Phase 2 : Exécution ===========================================

    API->>BD: INSERT INTO actions<br/>(type, statut, declencheur,<br/> valeur, seuil, timestamp)
    BD-->>API: Action créée (id: 87)

    API->>MQTT: Publier QoS 1 sur :<br/>sai/parcelle1/actionneurs/arrosage/cmd<br/>{ "commande": "on",<br/>  "duree": 0,<br/>  "source": "auto",<br/>  "action_id": 87 }

    MQTT-->>ESP: Message MQTT reçu

    ESP->>ESP: Interpréter JSON<br/>→ commande = "on"
    ESP->>ESP: Vérifier niveau réservoir<br/>→ Niveau = 78% (OK)
    ESP->>ESP: Activer GPIO26 (HIGH)
    ESP->>Pomp: Relais fermé → pompe sous tension
    Note over Pomp: 💧 Arrosage en cours

    ESP->>MQTT: Publier statut sur :<br/>sai/parcelle1/actionneurs/status<br/>{ "etat": "actif",<br/>  "actionneur": "pompe",<br/>  "action_id": 87 }

    MQTT-->>API: Statut reçu
    API->>BD: UPDATE actions SET statut = 'actif'<br/>WHERE id = 87
    BD-->>API: OK

    API-->>Web: Notification WebSocket<br/>{ "type": "info",<br/>  "message": "🌱 Irrigation automatique<br/>  démarrée (humidité: 25%)" }

    Web->>Web: Mettre à jour le dashboard<br/>(icône pompe animée, timer)
    Web-->>Agriculteur: (via l'interface)

    %% === Phase 3 : Arrêt ===============================================

    Note over Time: 5 minutes plus tard...

    loop Toutes les 5 minutes
        Time->>API: ⏰ Vérification suivante
    end

    API->>BD: SELECT valeur FROM mesures<br/>WHERE capteur = 'humidite_sol'<br/>ORDER BY timestamp DESC LIMIT 1
    BD-->>API: humidite_sol = 52%

    API->>BD: SELECT seuil_min, seuil_max FROM seuils<br/>WHERE parcelle = 'parcelle1'
    BD-->>API: seuil_min = 30%, seuil_max = 50%

    API->>API: Vérifier état de la pompe<br/>→ Dernière action = ACTIF

    Note over API: Décision : 52% > 50%<br/>→ Arrêter irrigation

    API->>MQTT: Publier QoS 1 sur :<br/>sai/parcelle1/actionneurs/arrosage/cmd<br/>{ "commande": "off",<br/>  "source": "auto",<br/>  "action_id": 87 }

    MQTT-->>ESP: Message MQTT reçu

    ESP->>ESP: Interpréter JSON<br/>→ commande = "off"
    ESP->>ESP: Couper GPIO26 (LOW)
    ESP->>Pomp: Relais ouvert → pompe hors tension
    Note over Pomp: ✅ Arrosage terminé

    ESP->>MQTT: Publier statut sur :<br/>sai/parcelle1/actionneurs/status<br/>{ "etat": "inactif",<br/>  "actionneur": "pompe",<br/>  "action_id": 87 }

    MQTT-->>API: Statut reçu
    API->>BD: UPDATE actions SET statut = 'termine',<br/>date_fin = NOW() WHERE id = 87
    BD-->>API: OK

    API-->>Web: Notification WebSocket<br/>{ "type": "info",<br/>  "message": "✅ Irrigation terminée<br/>  (humidité: 52%)" }

    Web->>Web: Mettre à jour le dashboard
