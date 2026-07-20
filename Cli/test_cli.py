"""
Test du CLI SAI.
"""
import subprocess, time, sys, os

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
CLI_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    print("Demarrage du serveur...")
    server = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=BACKEND_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    time.sleep(5)

    import urllib.request
    try:
        r = urllib.request.urlopen("http://localhost:8000/")
        print(f"Serveur OK: {r.status}")
    except Exception as e:
        print(f"Erreur: {e}")
        server.kill()
        sys.exit(1)

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
    server.kill()

if __name__ == "__main__":
    main()
