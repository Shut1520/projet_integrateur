#!/usr/bin/env python3
"""
main.py — Point d'entree du CLI SAI.

Utilisation :
    python cli.py login --email <email> --password <pass>
    python cli.py logout
    python cli.py status
    python cli.py capteurs
    python cli.py actionneurs
    python cli.py mesures <id_capteur> [--nb 10]
    python cli.py commander <id_actionneur> --action on|off [--duree 60]
    python cli.py commandes
    python cli.py alertes [--etat active] [--parcelle 1]
    python cli.py alertes reconnaitre <id>
    python cli.py alertes resoudre <id>
    python cli.py seuils [--parcelle 1]
    python cli.py seuils configurer --type humidite_sol --min 30 --max 80
                                   --unite % --parcelle 1
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from client import APIClient
from auth import login, logout, status
from commands import capteurs, mesures, actionneurs, commandes, alertes, seuils


def main():
    parser = argparse.ArgumentParser(
        description="SAI - Systeme Agricole Intelligent (CLI)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python cli.py login --email admin@sai.com --password admin123
  python cli.py capteurs
  python cli.py mesures 1 --nb 5
  python cli.py commander 1 --action on --duree 60
  python cli.py alertes --etat active
  python cli.py seuils configurer --type humidite_sol --min 30 --max 80 --unite %% --parcelle 1
        """,
    )

    sous_commandes = parser.add_subparsers(dest="commande", help="Commande a executer")
    sous_commandes.required = True

    # login
    p_login = sous_commandes.add_parser("login", help="Se connecter a l'API")
    p_login.add_argument("--email", required=True, help="Adresse email")
    p_login.add_argument("--password", required=True, help="Mot de passe")

    # logout
    p_logout = sous_commandes.add_parser("logout", help="Se deconnecter")

    # status
    p_status = sous_commandes.add_parser("status", help="Verifier l'etat de la connexion")
    p_status.add_argument("--check", action="store_true", help="Verifier le token aupres du serveur")

    # capteurs
    p_capteurs = sous_commandes.add_parser("capteurs", help="Lister les capteurs")

    # actionneurs
    p_actionneurs = sous_commandes.add_parser("actionneurs", help="Lister les actionneurs")

    # mesures
    p_mesures = sous_commandes.add_parser("mesures", help="Afficher les dernieres mesures d'un capteur")
    p_mesures.add_argument("capteur_id", type=int, help="ID du capteur")
    p_mesures.add_argument("--nb", type=int, default=10, help="Nombre de mesures (defaut: 10)")

    # commander
    p_commander = sous_commandes.add_parser("commander", help="Envoyer un ordre a un actionneur")
    p_commander.add_argument("actionneur_id", type=int, help="ID de l'actionneur")
    p_commander.add_argument("--action", required=True, choices=["on", "off"],
                             help="Action a executer (on/off)")
    p_commander.add_argument("--duree", type=int, default=None,
                             help="Duree en secondes (optionnel)")

    # commandes
    p_commandes = sous_commandes.add_parser("commandes", help="Lister les commandes recentes")

    # alertes
    p_alertes = sous_commandes.add_parser("alertes", help="Gerer les alertes")
    p_alertes.add_argument("sous-action", nargs="?", default="lister",
                           choices=["lister", "reconnaitre", "resoudre"],
                           help="Action sur les alertes (defaut: lister)")
    p_alertes.add_argument("id", nargs="?", type=int, default=None,
                           help="ID de l'alerte (pour reconnaitre/resoudre)")
    p_alertes.add_argument("--etat", choices=["active", "reconnue", "resolue"],
                           default=None, help="Filtrer par etat")
    p_alertes.add_argument("--parcelle", type=int, default=None,
                           help="Filtrer par parcelle")

    # seuils
    p_seuils = sous_commandes.add_parser("seuils", help="Gerer les seuils d'automatisation")
    p_seuils.add_argument("sous-action", nargs="?", default="lister",
                          choices=["lister", "configurer"],
                          help="Action sur les seuils (defaut: lister)")
    p_seuils.add_argument("--parcelle", type=int, default=None,
                          help="Filtrer par parcelle")
    p_seuils.add_argument("--type", dest="type_mesure", default=None,
                          help="Type de mesure (ex: humidite_sol)")
    p_seuils.add_argument("--min", type=float, dest="valeur_min", default=None,
                          help="Seuil minimum")
    p_seuils.add_argument("--max", type=float, dest="valeur_max", default=None,
                          help="Seuil maximum")
    p_seuils.add_argument("--unite", default=None,
                          help="Unite (ex: %%, C, ppm)")

    args = parser.parse_args()
    api = APIClient()

    if args.commande == "login":
        login(api, args.email, args.password)
    elif args.commande == "logout":
        logout(api)
    elif args.commande == "status":
        status(api)
    elif args.commande == "capteurs":
        capteurs.lister(api)
    elif args.commande == "actionneurs":
        actionneurs.lister(api)
    elif args.commande == "mesures":
        mesures.lister(api, args.capteur_id, args.nb)
    elif args.commande == "commander":
        commandes.envoyer(api, args.actionneur_id, args.action, args.duree)
    elif args.commande == "commandes":
        commandes.lister(api)
    elif args.commande == "alertes":
        sous_action = getattr(args, "sous-action", "lister")
        if sous_action == "lister":
            alertes.lister(api, etat=args.etat, parcelle_id=args.parcelle)
        elif sous_action == "reconnaitre":
            if args.id is None:
                print("[ERR] Utilisation : python cli.py alertes reconnaitre <id>")
                sys.exit(1)
            alertes.reconnaitre(api, args.id)
        elif sous_action == "resoudre":
            if args.id is None:
                print("[ERR] Utilisation : python cli.py alertes resoudre <id>")
                sys.exit(1)
            alertes.resoudre(api, args.id)
    elif args.commande == "seuils":
        sous_action = getattr(args, "sous-action", "lister")
        if sous_action == "lister":
            seuils.lister(api, parcelle_id=args.parcelle)
        elif sous_action == "configurer":
            if not all([args.type_mesure, args.valeur_min is not None,
                        args.valeur_max is not None, args.unite, args.parcelle]):
                print("[ERR] Utilisation : python cli.py seuils configurer")
                print("   --type humidite_sol --min 30 --max 80 --unite % --parcelle 1")
                sys.exit(1)
            seuils.configurer(api, args.type_mesure, args.valeur_min,
                              args.valeur_max, args.unite, args.parcelle)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAurevoir !")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERR] Erreur inattendue : {e}")
        sys.exit(1)
