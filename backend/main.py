"""
main.py — Point d'entree du serveur FastAPI.

Lancement :
    uvicorn main:app --reload

Ou directement :
    python main.py
"""

import os
import sys

# Ajoute le dossier backend au PYTHONPATH pour que 'routes' soit trouvable
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.utilisateurs import router as utilisateurs_router
from routes.parcelles import router as parcelles_router
from routes.capteurs import router as capteurs_router
from routes.mesures import router as mesures_router
from routes.actionneurs import router as actionneurs_router
from routes.commandes import router as commandes_router
from routes.actions import router as actions_router
from routes.alertes import router as alertes_router
from routes.seuils import router as seuils_router
from routes.tokens import router as tokens_router
from routes.auth import router as auth_router

# ─── Creation de l'application ───
app = FastAPI(
    title="SAI - Système Agricole Intelligent",
    description="API REST de gestion des parcelles, capteurs, actionneurs et automatisation",
    version="1.0.0",
)

# ─── Configuration CORS ───
# Permet au frontend React (sur un port different) d'appeler l'API
origins = [
    "http://localhost:5173",    # Frontend React (Vite)
    "http://localhost:3000",    # Alternative React
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   # Autorise tous les verbes (GET, POST, PUT, DELETE)
    allow_headers=["*"],   # Autorise tous les en-tetes
)

# ─── Montage des routeurs ───
app.include_router(utilisateurs_router)
app.include_router(parcelles_router)
app.include_router(capteurs_router)
app.include_router(mesures_router)
app.include_router(actionneurs_router)
app.include_router(commandes_router)
app.include_router(actions_router)
app.include_router(alertes_router)
app.include_router(seuils_router)
app.include_router(tokens_router)
app.include_router(auth_router)


# ─── Route de sante (health check) ───
@app.get("/")
def health_check():
    """Verifie que l'API est bien en ligne."""
    return {"status": "ok", "message": "SAI API is running"}


# ─── Point d'entree pour l'execution directe ───
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
