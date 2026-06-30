# Scénario 3 : Commande manuelle depuis le CLI

## Description

L'agriculteur exécute un script Python dans son terminal pour commander les actionneurs sans passer par l'interface web.

## Acteurs / Lignes de vie

- 🧑‍🌾 **Agriculteur** : Utilisateur qui lance la commande
- 💻 **CLI (script Python)** : Interface en ligne de commande
- ⚙️ **Backend (FastAPI)** : API REST
- 🗄️ **Base de Données** : PostgreSQL
- 📡 **Broker MQTT** : Mosquitto
- 🔌 **ESP32** : Microcontrôleur
- 💧 **Pompe** : Actionneur physique

## Scénario pas à pas

```
Étape 1  : L'agriculteur ouvre son terminal
Étape 2  : Il tape la commande : python irriger.py --parcelle 1 --duree 30
Étape 3  : Le CLI charge la clé API depuis le fichier de configuration
Étape 4  : Le CLI envoie une requête HTTP POST au backend avec la clé API
Étape 5  : Le backend valide la clé API
Étape 6  : Le backend enregistre la commande en base de données
Étape 7  : Le backend publie un message MQTT sur le topic de commande
Étape 8  : L'ESP32 reçoit le message et active la pompe via GPIO26
Étape 9  : La pompe se met en marche
Étape 10 : L'ESP32 publie un statut "actif" sur MQTT
Étape 11 : Le backend reçoit le statut et met à jour la BD
Étape 12 : Le backend répond au CLI avec HTTP 200
Étape 13 : Le CLI affiche le résultat dans le terminal
Étape 14 : Après 30 secondes, le backend envoie la commande d'arrêt
Étape 15 : L'ESP32 coupe la pompe et publie le statut "inactif"
Étape 16 : Le CLI se termine
```

## Variante : action en lot (batch)

L'agriculteur peut aussi commander plusieurs parcelles en une seule commande :

```bash
python irriger.py --parcelles 1,2,3 --duree 60
```

Dans ce cas, le CLI envoie une seule requête avec la liste des parcelles, et le backend publie une commande MQTT pour chaque parcelle.
