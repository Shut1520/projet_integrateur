#!/usr/bin/env python3
"""
main.py — Point d'entree du CLI SAI.

Utilisation :
    python cli.py login --email <email> --password <pass>
    python cli.py logout
    python cli.py status
    python cli.py apikey <sk_sai_...>            # enregistrer la cle API (ESP32/CLI)
    python cli.py apikey --effacer               # effacer la cle API
    python cli.py capteurs
    python cli.py actionneurs
    python cli.py mesures <id_capteur> [--nb 10]
    python cli.py commander <id_actionneur> --action on|off [--duree 60] [--oui]
    python cli.py batch arrosage --actionneur <id> [--duree 60] [--parcelle 1] [--oui]
    python cli.py batch ventilation --actionneur <id> [--duree 120] [--oui]
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
from commands import (capteurs, mesures, actionneurs, commandes, alertes,
                      seuils, statut, batch)
from logs import journal


def main():
    """
    Point d'entree principal du CLI.

    Configure l'analyseur d'arguments (argparse) avec toutes les sous-commandes
    disponibles (login, logout, status, capteurs, mesures, commander, etc.)
    et redirige vers la fonction de traitement correspondante.
    """
    # Construction du parser principal avec description et exemples d'utilisation
    parser = argparse.ArgumentParser(
        description="SAI - Systeme Agricole Intelligent (CLI)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python cli.py login --email admin@sai.com --password admin123
  python cli.py apikey sk_sai_xxxxxxxx
  python cli.py capteurs
  python cli.py mesures 1 --nb 5
  python cli.py commander 1 --action on --duree 60 --oui
  python cli.py batch arrosage --actionneur 1 --duree 60
  python cli.py alertes --etat active
  python cli.py seuils configurer --type humidite_sol --min 30 --max 80 --unite %% --parcelle 1
        """,
    )

    # Les sous-commandes sont mutuellement exclusives ; au moins une est requise
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

    # statut
    p_statut = sous_commandes.add_parser("statut", help="Tableau de bord du systeme")

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
    p_commander.add_argument("--oui", action="store_true",
                             help="Confirmer sans prompt (actions critiques, CDC 6.3)")

    # apikey
    p_apikey = sous_commandes.add_parser("apikey", help="Configurer la cle API")
    p_apikey.add_argument("--effacer", action="store_true",
                          help="Effacer la cle API enregistree")
    p_apikey.add_argument("cle", nargs="?", default=None,
                          help="Cle API (format sk_sai_...) a enregistrer")

    # batch
    p_batch = sous_commandes.add_parser("batch", help="Actions en lot (arrosage/ventilation)")
    p_batch.add_argument("sous-action", nargs="?", default="arrosage",
                         choices=["arrosage", "ventilation"],
                         help="Action a executer (defaut: arrosage)")
    p_batch.add_argument("--actionneur", type=int, required=True,
                         help="ID de l'actionneur (pompe pour arrosage, ventil pour ventilation)")
    p_batch.add_argument("--duree", type=int, default=None,
                         help="Duree en secondes (optionnel)")
    p_batch.add_argument("--parcelle", type=int, default=None,
                         help="ID de la parcelle (arrosage, pour localiser le capteur niveau_eau)")
    p_batch.add_argument("--oui", action="store_true",
                         help="Confirmer sans prompt (CDC 6.3)")

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
    # Instantiation du client HTTP unique utilisé par toutes les commandes
    api = APIClient()

    # Dispatch vers la commande correspondante
    if args.commande == "login":
        login(api, args.email, args.password)
        journal("login", f"{args.email} connecte")
    elif args.commande == "logout":
        logout(api)
        journal("logout", "deconnecte")
    elif args.commande == "status":
        status(api)
    elif args.commande == "statut":
        statut.run(api)
        journal("statut", "tableau de bord affiche")
    elif args.commande == "capteurs":
        capteurs.lister(api)
    elif args.commande == "actionneurs":
        actionneurs.lister(api)
    elif args.commande == "mesures":
        mesures.lister(api, args.capteur_id, args.nb)
    elif args.commande == "commander":
        journal("commander", f"actionneur #{args.actionneur_id} {args.action} duree={args.duree}")
        commandes.envoyer(api, args.actionneur_id, args.action, args.duree, args.oui)
    elif args.commande == "commandes":
        commandes.lister(api)
    elif args.commande == "apikey":
        if args.effacer:
            api.effacer_cle_api()
            print("[OK] Cle API effacee.")
            journal("apikey", "cle API effacee")
        elif args.cle:
            api.sauvegarder_cle_api(args.cle)
            print(f"[OK] Cle API enregistree : {args.cle[:16]}...")
            journal("apikey", "cle API enregistree")
        else:
            print("[ERR] Utilisation : python cli.py apikey <sk_sai_...> (ou --effacer)")
            sys.exit(1)
    elif args.commande == "batch":
        sous_action = getattr(args, "sous-action", "arrosage")
        if sous_action == "arrosage":
            batch.arrosage(api, args.actionneur, args.duree, args.parcelle, args.oui)
        elif sous_action == "ventilation":
            batch.ventilation(api, args.actionneur, args.duree, args.oui)
    elif args.commande == "alertes":
        # "sous-action" contient 'lister', 'reconnaitre' ou 'resoudre'
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
        # "sous-action" contient 'lister' ou 'configurer'
        sous_action = getattr(args, "sous-action", "lister")
        if sous_action == "lister":
            seuils.lister(api, parcelle_id=args.parcelle)
        elif sous_action == "configurer":
            # Vérification que tous les paramètres obligatoires sont présents
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
