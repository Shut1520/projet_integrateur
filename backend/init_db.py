"""
init_db.py — Initialisation de la base de donnees SAI.

Ce script :
1. Cree la base de donnees 'sai_db' si elle n'existe pas
2. Execute le fichier MPD (mpd.sql) pour creer les tables,
   contraintes, triggers et indexes
3. Verifie que toutes les tables sont bien presentes

Usage :
    python init_db.py              # Initialisation complete (sai_db)
    python init_db.py --seed       # Initialisation + donnees de test
    python init_db.py --drop       # Supprime les tables d'abord
    python init_db.py --db sai_test   # Initialise une autre base

Note : le MPD seul est INCOMPLET (colonne 'actif' utilisateurs,
table 'historique_actions'). Pour une BD de test (sai_test), construire
le schema via Alembic (source de verite) :
    1. psql (superuser) : DROP/CREATE DATABASE sai_test
    2. psql : ALTER SCHEMA public OWNER TO sai_user; GRANT ALL ON SCHEMA public TO sai_user;
    3. $env:DATABASE_URL="postgresql://sai_user:sai_password@localhost:5432/sai_test"
       + alembic upgrade head

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

# ─── Configuration (depuis .env via config.py) ───
from config import DB_SUPERUSER, DB_SUPERPASS, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

# Chemin vers le fichier MPD (relatif a ce script)
CHEMIN_MPD = os.path.join(
    os.path.dirname(__file__), "..", "Diagrammes", "2.Merise_&_classe", "MPD", "mpd.sql"
)


# ─── 1. Creer la base de donnees si elle n'existe pas ────────
def creer_base_si_absente(nom_base: str):
    """
    Se connecte a PostgreSQL (base 'postgres') et cree la base
    si elle n'existe pas encore.
    """
    # Connexion a la base systeme 'postgres'
    url = f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/postgres"
    engine = create_engine(url, isolation_level="AUTOCOMMIT")

    try:
        with engine.connect() as conn:
            # Verifier si la base existe deja
            resultat = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{nom_base}'")
            )
            if resultat.fetchone() is None:
                conn.execute(text(f"CREATE DATABASE {nom_base}"))
                print(f"✅ Base de donnees '{nom_base}' creee avec succes.")
            else:
                print(f"ℹ️  La base '{nom_base}' existe deja.")
    except OperationalError as e:
        print(f"❌ Erreur de connexion a PostgreSQL : {e}")
        print("   Verifie que PostgreSQL est en cours d'execution.")
        sys.exit(1)
    finally:
        engine.dispose()


# ─── 2b. Accorder les droits au user applicatif ───────────────
def accorder_droits(nom_base: str):
    """
    Donne les droits SELECT/INSERT/UPDATE/DELETE sur le schema public
    et toutes les tables/sequences a sai_user (user applicatif).
    PostgreSQL 15+ necessite cela explicitement.
    """
    url = f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/{nom_base}"
    engine = create_engine(url)
    try:
        with engine.connect() as conn:
            conn.execute(text("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sai_user"))
            conn.execute(text("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sai_user"))
            conn.execute(text("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sai_user"))
            conn.execute(text("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sai_user"))
            conn.commit()
            print("✅ Droits accordes a sai_user (schema public, tables, sequences).")
    except Exception as e:
        print(f"❌ Erreur lors de l'octroi des droits : {e}")
    finally:
        engine.dispose()


# ─── 2. Executer le fichier MPD ───────────────────────────────
def executer_mpd(nom_base: str):
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

    # Connexion a la base cible avec le superuser
    url = f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/{nom_base}"
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
def verifier_tables(nom_base: str):
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

    url = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{nom_base}"
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
def supprimer_tables(nom_base: str):
    """
    Supprime toutes les tables (pour repartir de zero).
    Utilise CASCADE pour gerer les dependances.
    """
    url = f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/{nom_base}"
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
    parser.add_argument(
        "--db",
        default=DB_NAME,
        help=f"Nom de la base a initialiser (defaut : {DB_NAME})",
    )
    args = parser.parse_args()

    nom_base = args.db

    print("╔══════════════════════════════════════╗")
    print("║   SAI — Initialisation de la BD      ║")
    print("╚══════════════════════════════════════╝")
    print(f"Base cible : {nom_base} sur {DB_HOST}:{DB_PORT}\n")

    # Étape 0 : Supprimer si demande
    if args.drop:
        supprimer_tables(nom_base)

    # Étape 1 : Creer la base
    print("─── Étape 1/3 : Creation de la base ───")
    creer_base_si_absente(nom_base)

    # Étape 2 : Executer le MPD
    print("─── Étape 2/3 : Execution du MPD ───")
    executer_mpd(nom_base)

    # Étape 2b : Accorder les droits
    print("─── Étape 2b : Configuration des droits ───")
    accorder_droits(nom_base)

    # Étape 3 : Verifier
    print("─── Étape 3/3 : Verification ───")
    verifier_tables(nom_base)

    # Optionnel : donnees de test
    if args.seed:
        print("\n─── Donnees de test (seed) ───")
        print("📝 Le seed sera implemente dans une prochaine etape.")

    print("\n✨ Initialisation terminee !")


if __name__ == "__main__":
    main()
