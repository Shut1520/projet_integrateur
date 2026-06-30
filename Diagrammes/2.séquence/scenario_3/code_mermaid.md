sequenceDiagram
    %%participant "🧑‍🌾_Agriculteur" as Agr
    %%participant "💻_CLI" as CLI
    %%participant "⚙️_Backend" as API
    %%participant "🗄️_Base_de_Données" as BD
    %%participant "📡_Broker_MQTT" as MQTT
    %%participant "🔌_ESP32" as ESP
    %%participant "💧_Pompe" as Pompe

    Note over Agr,Pompe: Scénario : L'agriculteur commande la pompe depuis le terminal

    Agr->>CLI: python irriger.py --parcelle 1 --duree 30
    Note right of Agr: L'utilisateur peut aussi<br/>faire un batch :<br/>--parcelles 1,2,3

    CLI->>CLI: Charger la configuration<br/>(clé API, URL backend)

    CLI->>API: POST /api/actionneurs/arrosage<br/>Authorization: Bearer API_KEY<br/>{ "parcelle": "1", "duree": 30 }

    API->>API: Valider la clé API<br/>Vérifier les permissions
    API->>BD: Enregistrer la commande<br/>INSERT INTO actions
    BD-->>API: Commande enregistrée (id: 42)

    Note over API,MQTT: Publication de la commande sur MQTT
    API->>MQTT: Publier sur topic :<br/>sai/parcelle1/actionneurs/arrosage/cmd<br/>{ "commande": "on", "duree": 30 }

    MQTT-->>ESP: Message MQTT reçu (QoS 1)

    ESP->>ESP: Interpréter le message JSON<br/>→ extraire "commande": "on"
    ESP->>ESP: Activer GPIO26 (HIGH)
    ESP->>Pompe: Relais fermé → pompe sous tension
    Note over Pompe: 💧 Arrosage en cours

    ESP->>MQTT: Publier statut sur :<br/>sai/parcelle1/actionneurs/status<br/>{ "etat": "actif", "actionneur": "pompe", "id_commande": 42 }

    MQTT-->>API: Statut reçu
    API->>BD: Mettre à jour le statut<br/>UPDATE actions SET statut = 'actif' WHERE id = 42
    BD-->>API: OK

    API-->>CLI: HTTP 200<br/>{ "status": "success",<br/>  "message": "Arrosage lancé",<br/>  "id_commande": 42,<br/>  "duree": 30 }

    CLI->>CLI: Afficher le résultat
    CLI-->>Agr: ✅ Arrosage Parcelle 1 lancé<br/>   ID Commande : 42<br/>   Durée : 30 secondes

    Note over API: ⏱️ Après 30 secondes

    API->>MQTT: Publier sur topic :<br/>sai/parcelle1/actionneurs/arrosage/cmd<br/>{ "commande": "off" }

    MQTT-->>ESP: Message MQTT reçu (QoS 1)
    ESP->>ESP: Couper GPIO26 (LOW)
    ESP->>Pompe: Relais ouvert → pompe hors tension
    Note over Pompe: 🛑 Arrosage terminé

    ESP->>MQTT: Publier statut :<br/>sai/parcelle1/actionneurs/status<br/>{ "etat": "inactif", "actionneur": "pompe" }

    MQTT-->>API: Statut reçu
    API->>BD: Mettre à jour le statut<br/>UPDATE actions SET statut = 'termine' WHERE id = 42
    BD-->>API: OK
