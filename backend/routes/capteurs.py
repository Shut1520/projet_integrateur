"""
Routes API pour l'entite Capteur.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.capteur import Capteur
from models.parcelle import Parcelle
from models.token import Token
from models.utilisateur import Utilisateur
from schemas.capteur import CapteurCreate, CapteurUpdate, CapteurResponse
from auth import exiger_admin, get_client_cle_api
from services.historique_service import enregistrer
from services.mqtt_service import TYPE_A_CAPTEUR, TYPE_A_UNITE

router = APIRouter(prefix="/api/capteurs", tags=["Capteurs"])


def _get_ou_404(db: Session, id: int) -> Capteur:
    """Recupere un capteur par son ID ou lève une 404."""
    capteur = db.get(Capteur, id)
    if not capteur:
        raise HTTPException(status_code=404, detail=f"Capteur id={id} introuvable")
    return capteur


@router.get("", response_model=list[CapteurResponse])
def lister_capteurs(
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """Retourne la liste de tous les capteurs."""
    return db.query(Capteur).all()


@router.get("/iot", response_model=dict)
def capteurs_iot(
    parcelle: str,
    db: Session = Depends(get_db),
    client: Token = Depends(get_client_cle_api),
):
    """
    Resolution IoT (cle API) : mapping type_mesure -> capteur pour le firmware.
    Le firmware connait la parcelle par NOM (pas l'id) ; il a besoin de l'id
    capteur pour le fallback HTTP POST /api/mesures.
    Retourne {type_mesure: {id, nom, unite}} pour chaque capteur actif de la
    parcelle, en réutilisant le mapping du subscriber MQTT.
    """
    parc = (
        db.query(Parcelle)
        .filter(Parcelle.nom == parcelle)
        .order_by(Parcelle.id)
        .first()
    )
    if not parc:
        raise HTTPException(status_code=404, detail=f"Parcelle '{parcelle}' introuvable")

    capteurs = (
        db.query(Capteur)
        .filter(Capteur.id_parcelle == parc.id, Capteur.etat == "actif")
        .all()
    )
    # type -> capteur inverse du mapping subscriber
    nom_vs_types = {}
    for type_mesure, nom_capteur in TYPE_A_CAPTEUR.items():
        nom_vs_types.setdefault(nom_capteur, []).append(type_mesure)

    resultat = {}
    for c in capteurs:
        for type_mesure in nom_vs_types.get(c.nom, []):
            resultat[type_mesure] = {
                "id": c.id,
                "nom": c.nom,
                "unite": TYPE_A_UNITE.get(type_mesure, ""),
            }
    return resultat


@router.get("/{id}", response_model=CapteurResponse)
def lire_capteur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """Retourne un capteur specifique par son ID."""
    return _get_ou_404(db, id)


@router.post("", response_model=CapteurResponse, status_code=201)
def creer_capteur(
    data: CapteurCreate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """Ajoute un nouveau capteur a une parcelle."""
    capteur = Capteur(**data.model_dump())
    db.add(capteur)
    db.flush()
    enregistrer(db, "creation", "capteur", capteur.id, utilisateur.id, f"Nom: {capteur.nom}")
    db.commit()
    db.refresh(capteur)
    return capteur


@router.put("/{id}", response_model=CapteurResponse)
def modifier_capteur(
    id: int,
    data: CapteurUpdate,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """Met a jour un capteur existant."""
    capteur = _get_ou_404(db, id)
    champs_modifies = data.model_dump(exclude_unset=True)
    for champ, valeur in champs_modifies.items():
        setattr(capteur, champ, valeur)
    details = "; ".join(f"{k}: {v}" for k, v in champs_modifies.items()) if champs_modifies else None
    enregistrer(db, "modification", "capteur", capteur.id, utilisateur.id, details)
    db.commit()
    db.refresh(capteur)
    return capteur


@router.delete("/{id}", status_code=204)
def supprimer_capteur(
    id: int,
    db: Session = Depends(get_db),
    utilisateur: Utilisateur = Depends(exiger_admin),
):
    """Supprime un capteur et ses mesures associees (CASCADE)."""
    capteur = _get_ou_404(db, id)
    nom = capteur.nom
    enregistrer(db, "suppression", "capteur", id, utilisateur.id, f"Nom: {nom}")
    db.delete(capteur)
    db.commit()
    return None
