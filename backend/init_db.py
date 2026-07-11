"""
init_db.py — Initialisation de la base de donnees SAI.

Ce script :
1. Cree la base de donnees 'sai_db' si elle n'existe pas
2. Execute le fichier MPD (mpd.sql) pour creer les tables,
   contraintes, triggers et indexes
3. Verifie que toutes les tables sont bien presentes

Usage :
    python init_db.py              # Initialisation complete
    python init_db.py --seed       # Initialisation + donnees de test
    python init_db.py --drop       # Supprime les tables d'abord

Prerequis :
    - PostgreSQL doit etre installe et en cours d'execution
    - Un superuser PostgreSQL (par defaut 'postgres')
"""

import argparse
import os
import sys

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError

# ─── Configuration ────────────────────────────────────────────
# Chemin vers le fichier MPD (relatif a ce script)
CHEMIN_MPD = os.path.join(
    os.path.dirname(__file__), "..", "Diagrammes", "2.Merise_&_classe", "MPD", "mpd.sql"
)

# Identifiants de connexion au serveur PostgreSQL
DB_SUPERUSER = "postgres"  # Superuser PostgreSQL
DB_SUPERPASS = "EMMA050220"  # Mot de passe du superuser
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "sai_db"
DB_USER = "sai_user"
DB_PASS = "sai_password"


# ─── 1. Creer la base de donnees si elle n'existe pas ────────
def creer_base_si_absente():
    """
    Se connecte a PostgreSQL (base 'postgres') et cree 'sai_db'
    si elle n'existe pas encore.
    """
    # Connexion a la base systeme 'postgres'
    url = f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/postgres"
    engine = create_engine(url, isolation_level="AUTOCOMMIT")

    try:
        with engine.connect() as conn:
            # Verifier si la base existe deja
            resultat = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
            )
            if resultat.fetchone() is None:
                conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
                print(f"✅ Base de donnees '{DB_NAME}' creee avec succes.")
            else:
                print(f"ℹ️  La base '{DB_NAME}' existe deja.")
    except OperationalError as e:
        print(f"❌ Erreur de connexion a PostgreSQL : {e}")
        print("   Verifie que PostgreSQL est en cours d'execution.")
        sys.exit(1)
    finally:
        engine.dispose()


# ─── 2. Executer le fichier MPD ───────────────────────────────
def executer_mpd():
    """
    Lit et execute le fichier mpd.sql pour creer
    toutes les tables, contraintes, triggers et indexes.
    """
    # Verifier que le fichier MPD existe
    if not os.path.exists(CHEMIN_MPD):
        print(f"❌ Fichier MPD introuvable : {CHEMIN_MPD}")
        print("   Verifie le chemin et reessaie.")
        sys.exit(1)

    # Lire le contenu du fichier SQL
    with open(CHEMIN_MPD, "r", encoding="utf-8") as f:
        sql = f.read()

    # Connexion a notre base 'sai_db' avec le superuser
    url = f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(url)

    try:
        with engine.connect() as conn:
            # Execute le script SQL complet
            # Note : on utilise execute() car le MPD contient
            # des commandes TRIGGER qui ne passent pas par text()
            conn.execute(text(sql))
            conn.commit()
            print(f"✅ Script MPD execute avec succes.")
    except Exception as e:
        print(f"❌ Erreur lors de l'execution du MPD : {e}")
        sys.exit(1)
    finally:
        engine.dispose()


# ─── 3. Verifier les tables creees ────────────────────────────
def verifier_tables():
    """
    Verifie que les 10 tables du projet sont bien presentes.
    Affiche leur nombre de lignes si elles existent.
    """
    tables_attendues = [
        "utilisateurs",
        "parcelles",
        "capteurs",
        "actionneurs",
        "mesures",
        "commandes",
        "actions",
        "alertes",
        "seuils",
        "tokens",
    ]

    url = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(url)

    try:
        with engine.connect() as conn:
            print("\n─── Verification des tables ───")
            for table in tables_attendues:
                resultat = conn.execute(
                    text(
                        f"SELECT EXISTS (SELECT FROM information_schema.tables "
                        f"WHERE table_name = '{table}')"
                    )
                )
                existe = resultat.scalar()
                if existe:
                    comptage = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    nb_lignes = comptage.scalar()
                    print(
                        f"  ✅ {table:<15} ({nb_lignes} ligne{'s' if nb_lignes != 1 else ''})"
                    )
                else:
                    print(f"  ❌ {table:<15} NON TROUVEE")
    except Exception as e:
        print(f"❌ Erreur lors de la verification : {e}")
    finally:
        engine.dispose()


# ─── 4. Supprimer les tables (option --drop) ──────────────────
def supprimer_tables():
    """
    Supprime toutes les tables (pour repartir de zero).
    Utilise CASCADE pour gerer les dependances.
    """
    url = f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(url)

    # Ordre inverse de creation pour respecter les FK
    tables = [
        "tokens",
        "seuils",
        "alertes",
        "actions",
        "commandes",
        "mesures",
        "actionneurs",
        "capteurs",
        "parcelles",
        "utilisateurs",
    ]

    try:
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS " + ", ".join(tables) + " CASCADE"))
            conn.commit()
            print("🗑️  Toutes les tables ont ete supprimees.")
    except Exception as e:
        print(f"❌ Erreur lors de la suppression : {e}")
    finally:
        engine.dispose()


# ─── 5. Point d'entree principal ─────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Initialise la base de donnees SAI")
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Ajoute des donnees de test apres l'initialisation",
    )
    parser.add_argument(
        "--drop", action="store_true", help="Supprime les tables avant de les recreer"
    )
    args = parser.parse_args()

    print("╔══════════════════════════════════════╗")
    print("║   SAI — Initialisation de la BD      ║")
    print("╚══════════════════════════════════════╝")
    print(f"Base cible : {DB_NAME} sur {DB_HOST}:{DB_PORT}\n")

    # Étape 0 : Supprimer si demande
    if args.drop:
        supprimer_tables()

    # Étape 1 : Creer la base
    print("─── Étape 1/3 : Creation de la base ───")
    creer_base_si_absente()

    # Étape 2 : Executer le MPD
    print("─── Étape 2/3 : Execution du MPD ───")
    executer_mpd()

    # Étape 3 : Verifier
    print("─── Étape 3/3 : Verification ───")
    verifier_tables()

    # Optionnel : donnees de test
    if args.seed:
        print("\n─── Donnees de test (seed) ───")
        print("📝 Le seed sera implemente dans une prochaine etape.")

    print("\n✨ Initialisation terminee !")


if __name__ == "__main__":
    main()
