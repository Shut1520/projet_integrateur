"""
auth.py — Gestion de l'authentification pour le CLI.

Fournit les fonctions login, logout et status qui gèrent
la connexion, la déconnexion et la vérification de session.
Le token JWT retourné par le serveur est stocké via APIClient.
"""

from client import APIClient


def login(api: APIClient, email: str, password: str):
    """
    Authentifie l'utilisateur auprès de l'API.

    Envoie les identifiants au endpoint /api/auth/login, récupère le token JWT
    et le sauvegarde localement pour les requêtes suivantes.
    """
    print("Connexion en cours...")

    # Envoi des identifiants au serveur
    resultat = api.post("/api/auth/login", {
        "email": email,
        "password": password,
    })

    # Extraction du token et des informations utilisateur depuis la réponse
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
    """
    Déconnecte l'utilisateur.

    Efface le token JWT stocké localement, ce qui empêche
    les futures requêtes authentifiées de fonctionner.
    """
    api.effacer_token()
    print("[OK] Deconnecte.")


def status(api: APIClient):
    """
    Affiche le statut de la connexion.

    Vérifie si un token est présent localement, puis interroge
    le serveur via /api/auth/me pour récupérer le profil utilisateur.
    En cas de token expiré ou invalide, un avertissement est affiché.
    """
    if api.est_connecte():
        print("[OK] Connecte a l'API")
        print(f"     URL : {api.api_url}")

        # Tentative de récupération du profil auprès du serveur
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
