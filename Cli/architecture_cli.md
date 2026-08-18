Cli/
├── main.py              # Point d'entrée : lit les arguments, appelle la bonne commande
├── client.py            # Client HTTP : parle à l'API (requests GET/POST/PUT/DELETE)
├── auth.py              # Gère la connexion (stocke le token JWT localement)
├── config.json          # Fichier qui stocke le token et l'URL du serveur
├── commands/
│   ├── capteurs.py      # "python cli.py capteurs"
│   ├── actionneurs.py   # "python cli.py actionneurs"
│   ├── mesures.py       # "python cli.py mesures"
│   ├── commandes.py     # "python cli.py commander"
│   ├── alertes.py       # "python cli.py alertes"
│   └── seuils.py        # "python cli.py seuils"
└── requirements.txt     # Dépendances (requests)



┌─────────────────────────────────────────────────────┐
│  Terminal : python cli.py capteurs                   │
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
