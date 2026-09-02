"""
test_cli.py — Tests d'intégration du CLI SAI.

Lance le serveur FastAPI en arrière-plan, vérifie qu'il est joignable,
puis exécute séquentiellement chaque commande CLI en sous-processus.
Affiche le nombre de tests réussis / total à la fin.
"""
import subprocess, time, sys, os

# Chemins absolus vers les répertoires backend et CLI
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
CLI_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    """
    Point d'entrée des tests d'intégration.

    1. Démarre le serveur uvicorn en arrière-plan.
    2. Attend 5 secondes pour le démarrage.
    3. Vérifie que le serveur répond sur http://localhost:8000/.
    4. Exécute chaque commande CLI et compte les succès.
    """
    print("Demarrage du serveur...")
    # Le serveur est lancé en arrière-plan avec sortie silenciée
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=BACKEND_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    # Attente du démarrage complet du serveur
    time.sleep(5)

    # Vérification de connectivité avec le serveur
    import urllib.request
    try:
        r = urllib.request.urlopen("http://localhost:8000/")
        print(f"Serveur OK: {r.status}")
    except Exception as e:
        print(f"Erreur: {e}")
        server.kill()
        sys.exit(1)

    # Résolution des IDs réels depuis l'API (la base seedée n'a pas des IDs fixes).
    # Nécessite un login pour récupérer un token, puis lecture des capteurs/actionneurs.
    import requests
    sess = requests.Session()
    login_resp = sess.post(
        "http://localhost:8000/api/auth/login",
        json={"email": "admin@sai.com", "password": "admin123"}, timeout=60,
    )
    if login_resp.status_code != 200:
        print(f"[ECHEC] Connexion API pour resolution des IDs: {login_resp.status_code}")
        server.kill()
        sys.exit(1)
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    capteur_id = None
    capteurs_resp = sess.get("http://localhost:8000/api/capteurs", headers=headers, timeout=60)
    if capteurs_resp.status_code == 200 and capteurs_resp.json():
        capteur_id = capteurs_resp.json()[0].get("id")

    pompe_id = ventilation_id = None
    actionneurs_resp = sess.get("http://localhost:8000/api/actionneurs", headers=headers, timeout=60)
    if actionneurs_resp.status_code == 200:
        for a in actionneurs_resp.json():
            nom = (a.get("nom") or "").lower()
            if nom == "pompe":
                pompe_id = a.get("id")
            elif nom == "ventilation":
                ventilation_id = a.get("id")

    if not (capteur_id and pompe_id and ventilation_id):
        print("[ECHEC] Resolution des IDs impossible (capteur/actionneurs manquants).")
        server.kill()
        sys.exit(1)

    # Liste des commandes à tester : (arguments, description)
    tests = [
        (["login", "--email", "admin@sai.com", "--password", "admin123"], "Connexion"),
        (["apikey", "sk_sai_test_cli_abc"], "Sauvegarde cle API"),
        (["status"], "Status (cle API affichee)"),
        (["capteurs"], "Capteurs"),
        (["mesures", str(capteur_id), "--nb", "3"], f"Mesures capteur #{capteur_id}"),
        (["commander", str(pompe_id), "--action", "on", "--duree", "30", "--oui"],
         f"Commander pompe #{pompe_id} on --oui"),
        (["batch", "arrosage", "--actionneur", str(pompe_id), "--duree", "30", "--oui"],
         f"Batch arrosage --oui (pompe #{pompe_id})"),
        (["batch", "ventilation", "--actionneur", str(ventilation_id), "--duree", "30", "--oui"],
         f"Batch ventilation --oui (ventil #{ventilation_id})"),
        (["alertes"], "Alertes"),
        (["seuils"], "Seuils"),
        (["commandes"], "Historique commandes"),
        (["apikey", "--effacer"], "Effacer cle API"),
        (["status"], "Status (apres effacement cle)"),
        (["logout"], "Logout"),
    ]

    success = 0
    for args, desc in tests:
        print(f"\n--- {desc} ---")
        # Exécution de chaque commande CLI comme un sous-processus indépendant
        result = subprocess.run(
            [sys.executable, "main.py"] + args,
            cwd=CLI_DIR, capture_output=True, text=True, timeout=90
        )
        if result.returncode == 0:
            print(result.stdout, end="")
            success += 1
        else:
            print(f"[ECHEC] code={result.returncode}")
            print(result.stdout, end="")
            if result.stderr:
                print(result.stderr[:300])

    print(f"\n{'='*40}")
    print(f"Resultat : {success}/{len(tests)} OK")
    # Arrêt du serveur en arrière-plan
    server.kill()

if __name__ == "__main__":
    main()
