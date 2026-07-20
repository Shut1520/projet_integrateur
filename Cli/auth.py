"""
auth.py — Gestion de l'authentification pour le CLI.
"""

from client import APIClient


def login(api: APIClient, email: str, password: str):
    """
    Authentifie l'utilisateur aupres de l'API.
    """
    print("Connexion en cours...")

    resultat = api.post("/api/auth/login", {
        "email": email,
        "password": password,
    })

    token = resultat.get("access_token")
    utilisateur = resultat.get("utilisateur", {})

    if token:
        api.sauvegarder_token(token)
        print(f"[OK] Connecte en tant que {utilisateur.get('nom', email)}")
        print(f"     Role : {utilisateur.get('role', 'inconnu')}")
        print(f"     Email : {utilisateur.get('email', email)}")
    else:
        print("[ERR] Reponse invalide du serveur")


def logout(api: APIClient):
    """Deconnecte l'utilisateur."""
    api.effacer_token()
    print("[OK] Deconnecte.")


def status(api: APIClient):
    """Affiche le statut de la connexion."""
    if api.est_connecte():
        print("[OK] Connecte a l'API")
        print(f"     URL : {api.api_url}")

        try:
            profil = api.get("/api/auth/me")
            print(f"     Utilisateur : {profil.get('nom', '?')}")
            print(f"     Email : {profil.get('email', '?')}")
            print(f"     Role : {profil.get('role', '?')}")
        except SystemExit:
            print("     [WARN] Token invalide ou expire. Reconnectez-vous.")
    else:
        print("[--] Non connecte")
        print("     Lancez : python cli.py login")
