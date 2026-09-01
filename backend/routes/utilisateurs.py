"""
Routes API pour l'entite Utilisateur.

Endpoints :
    GET    /api/utilisateurs              → Liste tous les utilisateurs
    GET    /api/utilisateurs/{id}         → Détail d'un utilisateur
    POST   /api/utilisateurs              → Créer un utilisateur
    PUT    /api/utilisateurs/{id}         → Modifier un utilisateur
    PUT    /api/utilisateurs/{id}/activer → Bascule actif/inactif
    DELETE /api/utilisateurs/{id}         → Supprimer un utilisateur
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash

from database import get_db
from models.utilisateur import Utilisateur
from schemas.utilisateur import (
    UtilisateurCreate,
    UtilisateurUpdate,
    UtilisateurResponse,
)
from auth import exiger_admin

# ─── Routeur avec prefixe et tag pour la doc automatique ───
# # Toutes les routes de ce fichier commenceront par `/api/utilisateurs`.
router = APIRouter(prefix="/api/utilisateurs", tags=["Utilisateurs"])




# ─── Helper : récupérer un utilisateur ou lever une erreur 404 ───
def _get_ou_404(db: Session, id: int) -> Utilisateur:
    """Cherche un utilisateur par son ID. Retourne 404 si introuvable."""
    utilisateur = db.get(Utilisateur, id)
    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec id={id} introuvable",
        )
    return utilisateur


# ====================================================================
#  GET /api/utilisateurs
# ====================================================================
@router.get("", response_model=list[UtilisateurResponse])
def lister_utilisateurs(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """
    Retourne la liste de tous les utilisateurs.
    """
    return db.query(Utilisateur).all()


# ====================================================================
#  GET /api/utilisateurs/{id}
# ====================================================================
@router.get("/{id}", response_model=UtilisateurResponse)
def lire_utilisateur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """
    Retourne un utilisateur specifique par son ID.
    """
    return _get_ou_404(db, id)


# ====================================================================
#  POST /api/utilisateurs
# ====================================================================
@router.post("", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def creer_utilisateur(
    data: UtilisateurCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """
    Crée un nouvel utilisateur.

    - Le mot de passe est hashé (bcrypt) avant stockage
    - L'email est vérifié (unique) par la base de données
    """
    # Verifier que l'email n'est pas deja pris
    existant = db.query(Utilisateur).filter(Utilisateur.email == data.email).first()
    if existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Un utilisateur avec l'email '{data.email}' existe déjà",
        )

    # Hacher le mot de passe
    password_hash = generate_password_hash(data.password)

    # Creer l'objet SQLAlchemy
    utilisateur = Utilisateur(
        nom=data.nom,
        email=data.email,
        role=data.role,
        password_hash=password_hash,
    )

    db.add(utilisateur)
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


# ====================================================================
#  PUT /api/utilisateurs/{id}
# ====================================================================
@router.put("/{id}", response_model=UtilisateurResponse)
def modifier_utilisateur(
    id: int,
    data: UtilisateurUpdate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """
    Modifie un utilisateur existant.

    Seuls les champs fournis dans le corps de la requete sont modifies.
    """
    utilisateur = _get_ou_404(db, id)

    # Mise à jour partielle : on ne touche qu'aux champs non-None
    update_data = data.model_dump(exclude_unset=True)

    if "password" in update_data:
        # Transformer le mot de passe en hash
        update_data["password_hash"] = generate_password_hash(update_data.pop("password"))

    # Appliquer les modifications sur l'objet ORM
    for champ, valeur in update_data.items():
        setattr(utilisateur, champ, valeur)

    db.commit()
    db.refresh(utilisateur)
    return utilisateur


# ====================================================================
#  PUT /api/utilisateurs/{id}/activer  →  Bascule actif/inactif
# ====================================================================
@router.put("/{id}/activer", response_model=UtilisateurResponse)
def basculer_etat_utilisateur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """
    Bascule l'état actif/inactif d'un utilisateur.
    Un admin ne peut pas se désactiver lui-même.
    """
    cible = _get_ou_404(db, id)

    # Un admin ne peut pas se désactiver lui-même
    if cible.id == utilisateur.id and cible.est_admin():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un administrateur ne peut pas se désactiver lui-même",
        )

    cible.actif = not cible.actif
    db.commit()
    db.refresh(cible)
    return cible


# ====================================================================
#  DELETE /api/utilisateurs/{id}
# ====================================================================
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_utilisateur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """
    Supprime un utilisateur.

    Les parcelles, tokens et seuils associés sont supprimes
    automatiquement par les CASCADE de la base de donnees.
    """
    utilisateur = _get_ou_404(db, id)
    db.delete(utilisateur)
    db.commit()
    return None  # 204 = pas de contenu dans la reponse
