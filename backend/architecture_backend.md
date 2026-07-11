backend/
├── routes/
│   ├── __init__.py
│   ├── utilisateurs.py      # CRUD utilisateurs
│   ├── parcelles.py         # CRUD parcelles
│   ├── capteurs.py          # CRUD capteurs
│   ├── mesures.py           # Lecture des mesures
│   ├── actionneurs.py       # CRUD actionneurs
│   ├── commandes.py         # Envoyer des commandes
│   ├── actions.py           # Suivi des actions
│   ├── alertes.py           # Gestion des alertes
│   ├── seuils.py            # Configuration des seuils
│   ├── tokens.py            # Gestion des tokens CLI
│   └── auth.py              # Authentification (JWT)
├── main.py                  # Point d'entrée du serveur
├── database.py              # ✅ déjà existant
├── models/                  # ✅ déjà existant
├── schemas/                 # ✅ déjà existant
├── init_db.py               # ✅ déjà existant
└── seed.py                  # ✅ déjà existant
