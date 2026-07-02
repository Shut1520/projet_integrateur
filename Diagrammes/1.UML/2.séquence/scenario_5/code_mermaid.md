sequenceDiagram
    %%participant "⏱️_Horloge_ESP32" as Time
    %%participant "🔌_ESP32" as ESP
    %%participant "🌡️_DHT22" as DHT
    %%participant "💧_YL-69" as YL
    %%participant "☀️_BH1750" as BH
    %%participant "💨_SEN0159" as SEN
    %%participant "🪣_Niveau_eau" as NIV
    %%participant "📡_Broker_MQTT" as MQTT
    %%participant "⚙️_Backend" as API
    %%participant "🗄️_Base_de_Données" as BD

    Note over Time,BD: Scénario : L'ESP32 collecte et publie les mesures

    %% === Boucle de lecture périodique ===
    loop Toutes les 10 secondes
        Time->>ESP: ⏰ Timer déclenché

        %% --- Lecture des capteurs ---
        ESP->>DHT: Demander température et humidité
        DHT-->>ESP: temp=28.4°C, hum=62%

        ESP->>YL: Lire valeur analogique
        YL-->>ESP: raw=2048 → 41.2%

        ESP->>BH: Lire luminosité (I2C)
        BH-->>ESP: lux=320

        ESP->>SEN: Lire concentration CO2
        SEN-->>ESP: ppm=850

        ESP->>NIV: Lire niveau d'eau
        NIV-->>ESP: raw=2500 → 78%

        %% --- Formatage et envoi ---
        ESP->>ESP: Formater les mesures en JSON<br/>{ temperature, humidite_sol, co2,<br/>  luminosite, niveau_eau, timestamp }
        Note over ESP: payload = { device_id, parcelle,<br/>  timestamp, mesures: { ... } }

        ESP-->>MQTT: Publier MQTT (QoS 1)<br/>Topic: sai/parcelle1/capteurs/mesures<br/>Payload: { JSON complet }

        %% --- Réception côté backend ---
        MQTT-->>API: Message MQTT reçu<br/>(backend abonné au topic)

        API->>API: Valider et parser le JSON<br/>Vérifier les champs obligatoires

        API->>BD: INSERT INTO mesures<br/>(parcelle, timestamp, temperature,<br/> humidite_air, humidite_sol, co2,<br/> luminosite, niveau_eau)

        BD-->>API: ✅ Mesure enregistrée (id: 1542)

        API->>API: Mettre à jour le cache temps réel<br/>pour le dashboard

        Note over API: Les données sont maintenant<br/>accessibles depuis le dashboard
    end
