L'agriculteur est sur son dashboard, il voit que l'humidité du sol est basse. Il décide d'arroser manuellement.


Étape 1 : L'agriculteur clique sur "Arroser"
Étape 2 : Le navigateur envoie une requête HTTP POST au backend
Étape 3 : Le backend valide son token JWT
Étape 4 : Le backend publie un message MQTT "allume pompe"
Étape 5 : L'ESP32 reçoit le message et active le relais
Étape 6 : La pompe se met en marche
Étape 7 : L'ESP32 confirme que la pompe est active
Étape 8 : Le backend retourne "succès" au dashboard
Étape 9 : Le dashboard affiche "Arrosage en cours"
