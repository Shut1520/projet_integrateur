"""alignement mpd.sql - triggers updated_at, CHECK constraints, index manquants

Revision ID: a1b2c3d4e5f7
Revises: d94e38b47852
Create Date: 2026-09-01 00:00:00.000000

Note : migration NON-destructive. Ramene la BD en phase avec le mpd.sql sur :
  - les triggers trg_*_updated_at (7 tables avec colonne updated_at)
  - les CHECK constraints (12) garantissant les valeurs enumerees
  - les 2 index manquants (idx_commandes_utilisateur, idx_mesures_id_capteur)

Le CASCADE (composition) n'est volontairement PAS traite ici (decision reportee).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, None] = 'd94e38b47852'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── 1. Fonction + triggers updated_at ───
    op.execute("""
        CREATE OR REPLACE FUNCTION mettre_a_jour_horodatage()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    triggers = [
        ('trg_utilisateurs_updated_at', 'utilisateurs'),
        ('trg_parcelles_updated_at', 'parcelles'),
        ('trg_capteurs_updated_at', 'capteurs'),
        ('trg_actionneurs_updated_at', 'actionneurs'),
        ('trg_actions_updated_at', 'actions'),
        ('trg_alertes_updated_at', 'alertes'),
        ('trg_seuils_updated_at', 'seuils'),
    ]
    for name, table in triggers:
        op.execute(f"""
            CREATE TRIGGER {name}
            BEFORE UPDATE ON {table}
            FOR EACH ROW
            EXECUTE FUNCTION mettre_a_jour_horodatage();
        """)

    # ─── 2. CHECK constraints ───
    op.create_check_constraint(
        'chk_utilisateurs_role', 'utilisateurs', "role IN ('agriculteur', 'admin')"
    )
    op.create_check_constraint(
        'chk_capteurs_protocole', 'capteurs', "protocole IN ('digital', 'analog', 'i2c')"
    )
    op.create_check_constraint(
        'chk_capteurs_etat', 'capteurs', "etat IN ('actif', 'inactif', 'defaillant')"
    )
    op.create_check_constraint(
        'chk_actionneurs_etat', 'actionneurs', "etat IN ('actif', 'inactif')"
    )
    op.create_check_constraint(
        'chk_mesures_source', 'mesures', "source IN ('esp32', 'manuel', 'simulation')"
    )
    op.create_check_constraint(
        'chk_commandes_type_action', 'commandes', "type_action IN ('on', 'off', 'programmer')"
    )
    op.create_check_constraint(
        'chk_commandes_source', 'commandes', "source IN ('web', 'cli', 'auto')"
    )
    op.create_check_constraint(
        'chk_commandes_statut', 'commandes', "statut IN ('envoyee', 'recue', 'executee', 'echouee')"
    )
    op.create_check_constraint(
        'chk_actions_statut', 'actions', "statut IN ('en_cours', 'termine', 'echouee')"
    )
    op.create_check_constraint(
        'chk_alertes_severite', 'alertes', "severite IN ('basse', 'haute', 'critique')"
    )
    op.create_check_constraint(
        'chk_alertes_etat', 'alertes', "etat IN ('active', 'reconnue', 'resolue')"
    )
    # NOTE : la contrainte chk_alertes_source du mpd.sql
    # (id_mesure IS NOT NULL OR id_action IS NOT NULL) n'est PAS appliquee :
    # l'application cree legitiment des alertes liees uniquement a une parcelle
    # (alerte manuelle / declenchee par seuil sans mesure ni action associee).

    # ─── 3. Index manquants ───
    op.create_index('idx_commandes_utilisateur', 'commandes', ['id_utilisateur'])
    op.create_index('idx_mesures_id_capteur', 'mesures', ['id_capteur'])


def downgrade() -> None:
    # ─── 3. Index ───
    op.drop_index('idx_mesures_id_capteur', table_name='mesures')
    op.drop_index('idx_commandes_utilisateur', table_name='commandes')

    # ─── 2. CHECK constraints ───
    op.drop_constraint('chk_alertes_etat', 'alertes', type_='check')
    op.drop_constraint('chk_alertes_severite', 'alertes', type_='check')
    op.drop_constraint('chk_actions_statut', 'actions', type_='check')
    op.drop_constraint('chk_commandes_statut', 'commandes', type_='check')
    op.drop_constraint('chk_commandes_source', 'commandes', type_='check')
    op.drop_constraint('chk_commandes_type_action', 'commandes', type_='check')
    op.drop_constraint('chk_mesures_source', 'mesures', type_='check')
    op.drop_constraint('chk_actionneurs_etat', 'actionneurs', type_='check')
    op.drop_constraint('chk_capteurs_etat', 'capteurs', type_='check')
    op.drop_constraint('chk_capteurs_protocole', 'capteurs', type_='check')
    op.drop_constraint('chk_utilisateurs_role', 'utilisateurs', type_='check')

    # ─── 1. triggers + fonction ───
    triggers = [
        ('trg_utilisateurs_updated_at', 'utilisateurs'),
        ('trg_parcelles_updated_at', 'parcelles'),
        ('trg_capteurs_updated_at', 'capteurs'),
        ('trg_actionneurs_updated_at', 'actionneurs'),
        ('trg_actions_updated_at', 'actions'),
        ('trg_alertes_updated_at', 'alertes'),
        ('trg_seuils_updated_at', 'seuils'),
    ]
    for name, table in triggers:
        op.execute(f"DROP TRIGGER IF EXISTS {name} ON {table};")
    op.execute("DROP FUNCTION IF EXISTS mettre_a_jour_horodatage();")
