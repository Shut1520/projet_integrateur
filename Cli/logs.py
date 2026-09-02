"""
logs.py — Journalisation des executions du CLI (CDC 6.3).

Ecrit chaque execution dans un fichier dedie `cli.log` (dans ce dossier,
gitignore). Format : [horodatage] COMMANDE -> message.
"""

import logging
from pathlib import Path

LOG_FILE = Path(__file__).parent / "cli.log"

_logger = logging.getLogger("sai.cli")
if not _logger.handlers:
    _logger.setLevel(logging.INFO)
    _handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    _handler.setFormatter(logging.Formatter("[%(asctime)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S"))
    _logger.addHandler(_handler)
    _logger.propagate = False


def journal(commande: str, message: str, erreur: bool = False):
    """
    Consigne une execution dans cli.log.

    Args:
        commande: Nom de la commande CLI (ex: 'commander', 'batch').
        message: Description de l'action + resultat.
        erreur: True si l'execution a echoue (message prefixe [ERREUR]).
    """
    prefixe = "[ERREUR]" if erreur else ""
    _logger.info("%s %s -> %s", commande, prefixe, message)