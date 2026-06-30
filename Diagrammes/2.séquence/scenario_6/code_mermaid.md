sequenceDiagram
    %%participant "⏱️_Horloge_Système" as Time
    %%participant "⚙️_Backend_FastAPI" as API
    %%participant "🗄️_Base_de_Données" as BD
    %%participant "📡_Broker_MQTT" as MQTT
    %%participant "🔌_ESP32" as ESP
    %%participant "💨_Ventilation" as Vent
    %%participant "🌐_Dashboard_Web" as Web
    %%participant "🧑‍🌾_Agriculteur" as Agr

    Note over Time,Agr: Alerte CO₂ critique avec action automatique

    %% === Déclenchement périodique ===
    loop Toutes les 5 minutes
        Time->>API: ⏰ Vérification automatique
    end

    %% === Lecture des mesures et seuils ===
    API->>BD: SELECT * FROM mesures<br/>ORDER BY timestamp DESC LIMIT 1
    BD-->>API: Dernières mesures<br/>{ co2: 1350, temp: 38, ... }

    API->>BD: SELECT * FROM seuils<br/>WHERE parcelle = 'parcelle1'
    BD-->>API: Seuils configurés<br/>{ co2_max: 1000, temp_max: 40, ... }

    %% === Décision : alerte ===
    API->>API: Comparer co2 (1350) > seuil (1000)
    Note over API: ✅ Condition critique détectée

    API->>API: Déterminer le type d'alerte<br/>→ "co2_eleve", sévérité haute<br/>→ Action : déclencher ventilation

    %% === Enregistrement en BD ===
    API->>BD: INSERT INTO alertes<br/>(type, valeur, seuil, parcelle,<br/> séverite, message, timestamp)
    BD-->>API: Alerte créée (id: 42)

    %% === Action automatique via MQTT ===
    API->>MQTT: Publier sur :<br/>sai/parcelle1/actionneurs/ventilation/cmd<br/>{ "commande": "on", "source": "auto",<br/>  "alerte_id": 42 }

    MQTT-->>ESP: Message MQTT reçu
    ESP->>ESP: Interpréter la commande<br/>Activer GPIO27 (HIGH)
    ESP->>Vent: Relais fermé → ventilation ON
    Note over Vent: 💨 Ventilation en marche

    ESP->>MQTT: Publier statut :<br/>sai/parcelle1/actionneurs/status<br/>{ "etat": "actif", "actionneur": "ventilation" }

    MQTT-->>API: Statut reçu
    API->>BD: UPDATE alertes SET statut_action = 'effectuee'<br/>WHERE id = 42
    BD-->>API: OK

    %% === Notification du dashboard ===
    API-->>Web: Notification WebSocket ou SSE<br/>{ "type": "alerte", "alerte_id": 42,<br/>  "message": "CO₂ critique : 1350 ppm" }

    Web->>Web: Afficher la notification d'alerte<br/>(popup rouge + icône clignotante)
    Web-->>Agr: 🚨 ALERTE : CO₂ trop élevé !<br/>   Valeur : 1350 ppm<br/>   Action : Ventilation activée

    Note over API: ⏱️ Vérification continue...

    %% === Fin de l'alerte ===
    Note over Time: 5 minutes plus tard...
    Time->>API: ⏰ Vérification suivante

    API->>BD: SELECT * FROM mesures<br/>ORDER BY timestamp DESC LIMIT 1
    BD-->>API: co2: 720 ppm (redescendu)

    API->>API: co2 (720) < seuil (1000)<br/>→ Condition normale

    opt Arrêt automatique
        API->>MQTT: Publier sur :<br/>sai/parcelle1/actionneurs/ventilation/cmd<br/>{ "commande": "off", "source": "auto" }

        MQTT-->>ESP: Message MQTT reçu
        ESP->>ESP: Couper GPIO27 (LOW)
        ESP->>Vent: Relais ouvert → ventilation OFF
        Note over Vent: ✅ Ventilation arrêtée

        API->>BD: UPDATE alertes SET statut = 'resolue',<br/>date_fin = NOW() WHERE id = 42
        BD-->>API: OK

        API-->>Web: Notification WebSocket<br/>{ "type": "alerte_resolue", "alerte_id": 42 }

        Web->>Web: Mettre à jour l'affichage
        Web-->>Agr: ✅ Alerte CO₂ résolue<br/>   Ventilation arrêtée
    end
