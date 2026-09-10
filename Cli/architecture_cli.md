Cli/
├── main.py              # Point d'entrée : lit les arguments, appelle la bonne commande
├── client.py            # Client HTTP : parle à l'API (requests GET/POST/PUT/DELETE)
├── auth.py              # Gère la connexion (stocke le token JWT localement)
├── config.json          # Fichier qui stocke le token et l'URL du serveur
├── commands/
│   ├── capteurs.py      # "python main.py capteurs"
│   ├── actionneurs.py   # "python main.py actionneurs"
│   ├── mesures.py       # "python main.py mesures"
│   ├── commandes.py     # "python main.py commander"
│   ├── alertes.py       # "python main.py alertes"
│   └── seuils.py        # "python main.py seuils"
└── requirements.txt     # Dépendances (requests)



┌─────────────────────────────────────────────────────┐
│  Terminal : python main.py capteurs                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  main.py                                             │
│  1. Parse la commande : "capteurs"                   │
│  2. Vérifie si l'utilisateur est connecté (JWT)     │
│  3. Appelle la fonction capteurs_lister()            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  commands/capteurs.py                                │
│  1. Appelle client.get("/api/capteurs")              │
│  2. Formate l'affichage                              │
│  3. Affiche dans le terminal                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  client.py → GET http://localhost:8000/api/capteurs  │
│              Header: Authorization: Bearer <JWT>     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  FastAPI → PostgreSQL → Réponse JSON                 │
└─────────────────────────────────────────────────────┘
