"""
seed.py - Donnees de test (seed) pour la base SAI.

Insere les donnees minimales necessaires au fonctionnement
de l'application ainsi que des donnees factices pour les tests.

Usage :
    python seed.py                          # Seulement le seed
    python seed.py --drop                   # Vide les tables puis seed
    python seed.py --mock 100               # Seed + 100 mesures factices

Prerequis :
    - La base de donnees doit exister (lancer init_db.py d'abord)
    - Les tables doivent etre creees
"""

import argparse
import os
import random
import secrets
import sys
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models import Actionneur, Capteur, Mesure, Parcelle, Seuil, Token, Utilisateur


def hacher_mot_de_passe(mot_de_passe: str) -> str:
    """Hash un mot de passe en texte clair avec bcrypt via werkzeug."""
    from werkzeug.security import generate_password_hash

    return generate_password_hash(mot_de_passe)


def seed_utilisateurs(db: Session) -> dict:
    """Insere un administrateur et un agriculteur de test."""
    admin = Utilisateur(
        nom="Admin",
        email="admin@sai.com",
        password_hash=hacher_mot_de_passe("admin123"),
        role="admin",
    )
    db.add(admin)

    agriculteur = Utilisateur(
        nom="Emmanuel",
        email="emmanuel@sai.com",
        password_hash=hacher_mot_de_passe("emmanuel123"),
        role="agriculteur",
    )
    db.add(agriculteur)
    db.commit()
    print("  OK - 2 utilisateurs crees (admin, agriculteur)")
    return {"admin": admin, "agriculteur": agriculteur}


def seed_parcelle(db: Session, proprietaire: Utilisateur) -> Parcelle:
    """Cree une parcelle de test ('Serre A') rattachee a un proprietaire."""
    parcelle = Parcelle(
        nom="Serre A", localisation="Jardin principal", id_utilisateur=proprietaire.id
    )
    db.add(parcelle)
    db.commit()
    print("  OK - Parcelle 'Serre A' creee")
    return parcelle


def seed_capteurs(db: Session, parcelle: Parcelle) -> list:
    """Cree les 5 capteurs de test (DHT22, YL-69, BH1750, SEN0159, HC-SR04)."""
    capteurs_data = [
        {"nom": "dht22", "reference": "AM2302", "gpio": 4, "protocole": "digital"},
        {"nom": "yl-69", "reference": "YL-69", "gpio": 34, "protocole": "analog"},
        {"nom": "bh1750", "reference": "BH1750", "gpio": 21, "protocole": "i2c"},
        {"nom": "sen0159", "reference": "SEN0159", "gpio": 35, "protocole": "analog"},
        {
            "nom": "niveau_eau",
            "reference": "HC-SR04",
            "gpio": 32,
            "protocole": "analog",
        },
    ]
    capteurs = []
    for data in capteurs_data:
        capteur = Capteur(parcelle=parcelle, **data)
        db.add(capteur)
        capteurs.append(capteur)
    db.commit()
    print("  OK - 5 capteurs crees")
    return capteurs


def seed_actionneurs(db: Session, parcelle: Parcelle) -> list:
    """Cree les 3 actionneurs de test (pompe, ventilation, eclairage)."""
    actionneurs_data = [
        {"nom": "pompe", "reference": "Pompe 12V", "gpio": 26},
        {"nom": "ventilation", "reference": "Ventilateur 120mm", "gpio": 27},
        {"nom": "eclairage", "reference": "LED 50W", "gpio": 25},
    ]
    actionneurs = []
    for data in actionneurs_data:
        actionneur = Actionneur(parcelle=parcelle, **data)
        db.add(actionneur)
        actionneurs.append(actionneur)
    db.commit()
    print("  OK - 3 actionneurs crees")
    return actionneurs


def seed_seuils(db: Session, configurateur: Utilisateur, parcelle: Parcelle) -> list:
    """Definit les seuils d'automatisation pour chaque type de mesure."""
    seuils_data = [
        {
            "type_mesure": "humidite_sol",
            "valeur_min": 30,
            "valeur_max": 50,
            "unite": "%",
        },
        {
            "type_mesure": "temperature",
            "valeur_min": 30,
            "valeur_max": 35,
            "unite": "C",
        },
        {"type_mesure": "co2", "valeur_min": 800, "valeur_max": 1000, "unite": "ppm"},
        {
            "type_mesure": "luminosite",
            "valeur_min": 200,
            "valeur_max": 2000,
            "unite": "lux",
        },
        {
            "type_mesure": "niveau_eau",
            "valeur_min": 20,
            "valeur_max": 100,
            "unite": "%",
        },
    ]
    seuils = []
    for data in seuils_data:
        seuil = Seuil(configurateur=configurateur, parcelle=parcelle, **data)
        db.add(seuil)
        seuils.append(seuil)
    db.commit()
    print("  OK - 5 seuils crees")
    return seuils


def seed_token(db: Session, utilisateur: Utilisateur) -> Token:
    """Genere une cle API de developpement pour l'utilisateur donne."""
    token = Token(
        cle_api="sk_sai_" + secrets.token_hex(32),
        nom="Cle de developpement",
        actif=True,
        proprietaire=utilisateur,
        expires_at=datetime(2027, 12, 31),
    )
    db.add(token)
    db.commit()
    print(f"  OK - Token API cree : {token.cle_api[:20]}...")
    return token


def seed_mesures_mock(db: Session, capteurs: list, nb_mesures: int = 50):
    """Genere des mesures aleatoires pour simuler un historique temps reel."""
    maintenant = datetime.now()
    types_mesure = {
        "dht22": {"unite": "C", "min": 25, "max": 38},
        "yl-69": {"unite": "%", "min": 20, "max": 60},
        "bh1750": {"unite": "lux", "min": 100, "max": 3000},
        "sen0159": {"unite": "ppm", "min": 600, "max": 1200},
        "niveau_eau": {"unite": "%", "min": 15, "max": 100},
    }
    mesures = []
    for i in range(nb_mesures):
        timestamp = maintenant - timedelta(hours=nb_mesures - i)
        for capteur in capteurs:
            if capteur.nom in types_mesure:
                config = types_mesure[capteur.nom]
                valeur = round(random.uniform(config["min"], config["max"]), 1)
                mesure = Mesure(
                    valeur=valeur,
                    unite=config["unite"],
                    source="simulation",
                    timestamp=timestamp,
                    id_capteur=capteur.id,
                )
                mesures.append(mesure)
    # Insertion par lots de 100 pour optimiser les performances
    for i in range(0, len(mesures), 100):
        db.add_all(mesures[i : i + 100])
        db.flush()
    db.commit()
    print(f"  OK - {len(mesures)} mesures factices inserees")


def vider_tables(db: Session):
    """Supprime toutes les donnees de chaque table (ordre anti-FK)."""
    ordre = [
        "historique_actions",
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
    for table in ordre:
        db.execute(text(f"DELETE FROM {table}"))
    db.commit()
    print("  OK - Tables videes")


def main():
    """Point d'entree du script : parse les arguments et lance le seed."""
    parser = argparse.ArgumentParser(description="Seed la base de donnees SAI")
    parser.add_argument(
        "--drop", action="store_true", help="Vide les tables avant le seed"
    )
    parser.add_argument(
        "--mock",
        type=int,
        nargs="?",
        const=50,
        default=0,
        help="Cree N mesures factices (defaut: 50)",
    )
    args = parser.parse_args()

    print("=== SAI - Donnees de test (seed) ===")
    db = SessionLocal()

    try:
        if args.drop:
            vider_tables(db)

        utilisateurs = seed_utilisateurs(db)
        parcelle = seed_parcelle(db, utilisateurs["agriculteur"])
        capteurs = seed_capteurs(db, parcelle)
        seed_actionneurs(db, parcelle)
        seed_seuils(db, utilisateurs["admin"], parcelle)
        seed_token(db, utilisateurs["admin"])

        if args.mock > 0:
            seed_mesures_mock(db, capteurs, args.mock)

        print("\nSeed termine avec succes !")
    except Exception as e:
        db.rollback()
        print(f"\nERREUR lors du seed : {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
