sequenceDiagram
    %%participant "🧑‍🌾_Agriculteur" as Agr
    %%participant "🌐_Dashboard_Web" as Web
    %%participant "⚙️_Backend" as API
    %%participant "🗄️_Base_de_Données" as BD
    %%participant "📡_Broker_MQTT" as MQTT
    %%participant "🔌_ESP32" as ESP
    %%participant "💧_Pompe" as Pompe

    Note over Agr,Pompe: Scénario : L'agriculteur arrose manuellement depuis le dashboard

    Agr->>Web: Clique sur "Arroser"<br/>(ou "Activer pompe")
    Note right of Agr: L'utilisateur peut aussi<br/>programmer une durée (optionnel)

    Web->>API: POST /api/actionneurs/arrosage<br/>Authorization: Bearer JWT<br/>{ "duree": 30 }

    API->>API: Vérifier le token JWT<br/>et les permissions
    API->>BD: Enregistrer la commande<br/>INSERT INTO actions
    BD-->>API: Commande enregistrée

    Note over API,MQTT: Publication de la commande sur MQTT
    API->>MQTT: Publier sur topic :<br/>sai/parcelle1/actionneurs/arrosage/cmd<br/>{ "commande": "on", "duree": 30 }

    MQTT-->>ESP: Message MQTT reçu<br/>(QoS 1)

    ESP->>ESP: Interpréter le message JSON<br/>→ extraire "commande": "on"
    ESP->>ESP: Activer GPIO26 (HIGH)
    ESP->>Pompe: Relais fermé → pompe sous tension
    Note over Pompe: 💧 Arrosage en cours

    ESP->>MQTT: Publier statut sur :<br/>sai/parcelle1/actionneurs/status<br/>{ "etat": "actif", "actionneur": "pompe" }

    MQTT-->>API: Statut reçu

    API->>BD: Mettre à jour le statut<br/>UPDATE actions SET statut = 'actif'
    BD-->>API: OK

    API-->>Web: HTTP 200<br/>{ "status": "success",<br/>  "message": "Arrosage en cours" }

    Web->>Web: Mettre à jour l'interface<br/>(icône pompe animée, timer)
    Web-->>Agr: Affichage : ✅ "Arrosage lancé<br/>pour 30 secondes"

    Note over ESP: ⏱️ Après 30 secondes (timer local)

    ESP->>ESP: Couper GPIO26 (LOW)
    ESP->>Pompe: Relais ouvert → pompe hors tension
    Note over Pompe: 🛑 Arrosage terminé

    ESP->>MQTT: Publier statut :<br/>sai/parcelle1/actionneurs/status<br/>{ "etat": "inactif", "actionneur": "pompe" }

    MQTT-->>API: Statut reçu
    API->>BD: Mettre à jour le statut<br/>UPDATE actions SET statut = 'termine'
    BD-->>API: OK
