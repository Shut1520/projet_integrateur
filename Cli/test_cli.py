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

    # Liste des commandes à tester : (arguments, description)
    tests = [
        (["login", "--email", "admin@sai.com", "--password", "admin123"], "Connexion"),
        (["capteurs"], "Capteurs"),
        (["mesures", "1", "--nb", "3"], "Mesures capteur #1"),
        (["commander", "1", "--action", "on"], "Commander on"),
        (["alertes"], "Alertes"),
        (["seuils"], "Seuils"),
        (["status"], "Status"),
        (["logout"], "Logout"),
    ]

    success = 0
    for args, desc in tests:
        print(f"\n--- {desc} ---")
        # Exécution de chaque commande CLI comme un sous-processus indépendant
        result = subprocess.run(
            [sys.executable, "main.py"] + args,
            cwd=CLI_DIR, capture_output=True, text=True, timeout=10
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
