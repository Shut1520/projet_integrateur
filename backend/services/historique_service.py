"""
Service d'historique (audit logging).

Enregistre toutes les operations effectuees sur le systeme
dans la table historique_actions.
"""

from sqlalchemy.orm import Session

from models.historique import HistoriqueAction


def enregistrer(
    db: Session,
    type_action: str,
    entite: str,
    entite_id: int,
    id_utilisateur: int,
    details: str | None = None,
) -> HistoriqueAction:
    """
    Enregistre une action dans l'historique.

    Args:
        db: Session de base de donnees
        type_action: creation | modification | suppression | activation | desactivation | commande
        entite: parcelle | capteur | actionneur
        entite_id: ID de l'entite concernee
        id_utilisateur: ID de l'utilisateur ayant effectue l'action
        details: Description optionnelle de l'action
    """
    historique = HistoriqueAction(
        type_action=type_action,
        entite=entite,
        entite_id=entite_id,
        details=details,
        id_utilisateur=id_utilisateur,
    )
    db.add(historique)
    db.flush()
    return historique


def _formater_modifications(data: dict) -> str:
    """Formate les champs modifies en texte lisible."""
    if not data:
        return None
    parties = []
    for champ, valeur in data.items():
        parties.append(f"{champ}: {valeur}")
    return "; ".join(parties)
