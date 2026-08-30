"""
Service de gestion des commandes.

Logique metier :
- Creer une commande (web, CLI, auto)
- Mettre a jour le statut (recue, executee, echouee)
- Valider la coherence (actionneur existe, source valide)
"""

from sqlalchemy.orm import Session

from models.commande import Commande
from models.actionneur import Actionneur


def creer_commande(
    db: Session,
    type_action: str,
    source: str,
    id_actionneur: int,
    id_utilisateur: int | None = None,
    valeur_parametre: str | None = None,
) -> Commande:
    """
    Cree une nouvelle commande.

    Regles :
    - L'actionneur doit exister
    - Si source='auto', id_utilisateur doit etre None
    - Si source='web' ou 'cli', id_utilisateur est obligatoire
    """
    from fastapi import HTTPException, status

    # Verifier que l'actionneur existe
    actionneur = db.get(Actionneur, id_actionneur)
    if not actionneur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Actionneur id={id_actionneur} introuvable",
        )

    # Valider la coherence source/utilisateur
    if source == "auto" and id_utilisateur is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="source='auto' ne doit pas avoir d'id_utilisateur",
        )
    if source in ("web", "cli") and id_utilisateur is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"source='{source}' necessite un id_utilisateur",
        )

    commande = Commande(
        type_action=type_action,
        valeur_parametre=valeur_parametre,
        source=source,
        statut="envoyee",
        id_utilisateur=id_utilisateur,
        id_actionneur=id_actionneur,
    )
    db.add(commande)
    db.commit()
    db.refresh(commande)
    return commande


def mettre_a_jour_statut(
    db: Session,
    commande_id: int,
    nouveau_statut: str,
) -> Commande:
    """
    Met a jour le statut d'une commande.

    Transitions valides :
    - envoyee → recue → executee
    - envoyee → recue → echouee
    """
    from fastapi import HTTPException, status

    transitions_valides = {
        "envoyee": ["recue"],
        "recue": ["executee", "echouee"],
    }

    commande = db.get(Commande, commande_id)
    if not commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commande id={commande_id} introuvable",
        )

    statuts_permis = transitions_valides.get(commande.statut, [])
    if nouveau_statut not in statuts_permis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition invalide : {commande.statut} → {nouveau_statut}",
        )

    commande.statut = nouveau_statut
    db.commit()
    db.refresh(commande)
    return commande


def lister_commandes(db: Session, actionneur_id: int | None = None) -> list[Commande]:
    """Liste les commandes, optionnellement filtree par actionneur."""
    query = db.query(Commande)
    if actionneur_id is not None:
        query = query.filter(Commande.id_actionneur == actionneur_id)
    return query.order_by(Commande.timestamp.desc()).all()
