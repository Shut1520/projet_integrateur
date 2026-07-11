"""
init_db.py - Initialisation de la base de donnees SAI.

Ce script :
1. Cree la base de donnees 'sai_db' si elle n'existe pas
2. Execute le fichier MPD (mpd.sql) pour creer les tables
3. Cree l'utilisateur 'sai_user' avec les droits necessaires
4. Verifie que les 10 tables sont presentes

Usage :
    python init_db.py              # Initialisation complete
    python init_db.py --drop       # Supprime les tables avant de les recreer
"""

import os
import sys
import argparse

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError


CHEMIN_MPD = os.path.join(
    os.path.dirname(__file__),
    "..", "Diagrammes", "2.Merise_&_classe", "MPD", "mpd.sql"
)

DB_SUPERUSER = "postgres"
DB_SUPERPASS = "EMMA050220"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "sai_db"
DB_USER = "sai_user"
DB_PASS = "sai_password"


def url_super():
    return f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def url_postgres():
    return f"postgresql://{DB_SUPERUSER}:{DB_SUPERPASS}@{DB_HOST}:{DB_PORT}/postgres"


def creer_base_si_absente():
    engine = create_engine(url_postgres(), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as conn:
            r = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'"))
            if r.fetchone() is None:
                conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
                print("OK - Base 'sai_db' creee.")
            else:
                print("OK - La base 'sai_db' existe deja.")
    except OperationalError as e:
        print(f"ERREUR de connexion a PostgreSQL : {e}")
        sys.exit(1)
    finally:
        engine.dispose()


def executer_mpd():
    if not os.path.exists(CHEMIN_MPD):
        print(f"ERREUR - Fichier MPD introuvable : {CHEMIN_MPD}")
        sys.exit(1)
    with open(CHEMIN_MPD, "r", encoding="utf-8") as f:
        sql = f.read()
    engine = create_engine(url_super())
    try:
        with engine.raw_connection() as raw_conn:
            with raw_conn.cursor() as cur:
                cur.execute(sql)
            raw_conn.commit()
        print("OK - Script MPD execute avec succes.")
    except Exception as e:
        print(f"ERREUR lors de l'execution du MPD : {e}")
        sys.exit(1)
    finally:
        engine.dispose()


def creer_utilisateur_si_absent():
    engine = create_engine(url_postgres(), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as conn:
            r = conn.execute(text("SELECT 1 FROM pg_roles WHERE rolname = 'sai_user'"))
            if r.scalar():
                print("OK - L'utilisateur 'sai_user' existe deja.")
            else:
                conn.execute(text("CREATE USER sai_user WITH PASSWORD 'sai_password'"))
                print("OK - Utilisateur 'sai_user' cree.")
    except Exception as e:
        print(f"ERREUR lors de la creation de l'utilisateur : {e}")
    finally:
        engine.dispose()
    engine2 = create_engine(url_super(), isolation_level="AUTOCOMMIT")
    try:
        with engine2.connect() as conn:
            conn.execute(text(f"GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO sai_user"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO sai_user"))
            conn.execute(text("GRANT ALL ON ALL TABLES IN SCHEMA public TO sai_user"))
            conn.execute(text("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sai_user"))
            print("OK - Droits accordes a 'sai_user'.")
    except Exception as e:
        print(f"ERREUR lors de l'octroi des droits : {e}")
    finally:
        engine2.dispose()


def verifier_tables():
    tables = ["utilisateurs", "parcelles", "capteurs", "actionneurs",
              "mesures", "commandes", "actions", "alertes", "seuils", "tokens"]
    engine = create_engine(url_super())
    try:
        with engine.connect() as conn:
            print("--- Verification des tables ---")
            tout_ok = True
            for table in tables:
                r = conn.execute(text(
                    f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table}')"
                ))
                if r.scalar():
                    c = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    print(f"  OK - {table:<15} ({c.scalar()} lignes)")
                else:
                    print(f"  NOK - {table:<15} NON TROUVEE")
                    tout_ok = False
            return tout_ok
    except Exception as e:
        print(f"ERREUR lors de la verification : {e}")
        return False
    finally:
        engine.dispose()


def supprimer_tables():
    tables = ["tokens", "seuils", "alertes", "actions", "commandes",
              "mesures", "actionneurs", "capteurs", "parcelles", "utilisateurs"]
    engine = create_engine(url_super())
    try:
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS " + ", ".join(tables) + " CASCADE"))
            conn.commit()
            print("OK - Tables supprimees.")
    except Exception as e:
        print(f"ERREUR lors de la suppression : {e}")
    finally:
        engine.dispose()


def main():
    parser = argparse.ArgumentParser(description="Initialise la base de donnees SAI")
    parser.add_argument("--drop", action="store_true", help="Supprime les tables avant de les recreer")
    args = parser.parse_args()
    print("=== SAI - Initialisation de la BD ===")
    print(f"Base cible : {DB_NAME} sur {DB_HOST}:{DB_PORT}")
    if args.drop:
        supprimer_tables()
    print("Etape 1/4 : Creation de la base")
    creer_base_si_absente()
    print("Etape 2/4 : Execution du MPD")
    executer_mpd()
    print("Etape 3/4 : Creation de l'utilisateur applicatif")
    creer_utilisateur_si_absent()
    print("Etape 4/4 : Verification")
    ok = verifier_tables()
    print(f"Initialisation {'OK' if ok else 'ECHEC'} !")

if __name__ == "__main__":
    main()
