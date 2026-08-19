"""init - baseline migration (10 tables SAI)

Revision ID: 02b2bd3ff25a
Revises: 
Create Date: 2026-08-19 00:36:14.241194

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '02b2bd3ff25a'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. utilisateurs
    op.create_table(
        'utilisateurs',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('nom', sa.String(100), nullable=False),
        sa.Column('email', sa.String(150), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='agriculteur'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    # 2. parcelles
    op.create_table(
        'parcelles',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('nom', sa.String(100), nullable=False),
        sa.Column('localisation', sa.String(255), nullable=True),
        sa.Column('id_utilisateur', sa.Integer, sa.ForeignKey('utilisateurs.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    # 3. capteurs
    op.create_table(
        'capteurs',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('nom', sa.String(30), nullable=False),
        sa.Column('reference', sa.String(50), nullable=True),
        sa.Column('gpio', sa.Integer, nullable=False),
        sa.Column('protocole', sa.String(10), nullable=False, server_default='digital'),
        sa.Column('etat', sa.String(15), nullable=False, server_default='actif'),
        sa.Column('id_parcelle', sa.Integer, sa.ForeignKey('parcelles.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    # 4. actionneurs
    op.create_table(
        'actionneurs',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('nom', sa.String(20), nullable=False),
        sa.Column('reference', sa.String(50), nullable=True),
        sa.Column('gpio', sa.Integer, nullable=False),
        sa.Column('etat', sa.String(10), nullable=False, server_default='inactif'),
        sa.Column('id_parcelle', sa.Integer, sa.ForeignKey('parcelles.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    # 5. mesures
    op.create_table(
        'mesures',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('valeur', sa.Float, nullable=False),
        sa.Column('unite', sa.String(10), nullable=False),
        sa.Column('source', sa.String(20), nullable=False, server_default='esp32'),
        sa.Column('timestamp', sa.DateTime, server_default=sa.func.now()),
        sa.Column('id_capteur', sa.Integer, sa.ForeignKey('capteurs.id'), nullable=False),
    )
    op.create_index('idx_mesures_capteur_timestamp', 'mesures', ['id_capteur', sa.text('timestamp DESC')])
    op.create_index('idx_mesures_timestamp', 'mesures', [sa.text('timestamp DESC')])

    # 6. commandes
    op.create_table(
        'commandes',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('type_action', sa.String(20), nullable=False, server_default='on'),
        sa.Column('valeur_parametre', sa.String(50), nullable=True),
        sa.Column('source', sa.String(20), nullable=False),
        sa.Column('timestamp', sa.DateTime, server_default=sa.func.now()),
        sa.Column('statut', sa.String(15), nullable=False, server_default='envoyee'),
        sa.Column('id_utilisateur', sa.Integer, sa.ForeignKey('utilisateurs.id'), nullable=True),
        sa.Column('id_actionneur', sa.Integer, sa.ForeignKey('actionneurs.id'), nullable=False),
    )
    op.create_index('idx_commandes_actionneur', 'commandes', ['id_actionneur'])
    op.create_index('idx_commandes_statut', 'commandes', ['statut'])
    op.create_index('idx_commandes_timestamp', 'commandes', [sa.text('timestamp DESC')])

    # 7. actions
    op.create_table(
        'actions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('date_debut', sa.DateTime, server_default=sa.func.now()),
        sa.Column('date_fin', sa.DateTime, nullable=True),
        sa.Column('duree', sa.Integer, nullable=True),
        sa.Column('resultat', sa.Text, nullable=True),
        sa.Column('details', sa.Text, nullable=True),
        sa.Column('statut', sa.String(15), nullable=False, server_default='en_cours'),
        sa.Column('id_commande', sa.Integer, sa.ForeignKey('commandes.id'), unique=True, nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('idx_actions_commande', 'actions', ['id_commande'])
    op.create_index('idx_actions_statut', 'actions', ['statut'])

    # 8. alertes
    op.create_table(
        'alertes',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('type', sa.String(30), nullable=False),
        sa.Column('valeur', sa.Float, nullable=True),
        sa.Column('seuil', sa.Float, nullable=True),
        sa.Column('severite', sa.String(10), nullable=False, server_default='haute'),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('etat', sa.String(15), nullable=False, server_default='active'),
        sa.Column('date_debut', sa.DateTime, server_default=sa.func.now()),
        sa.Column('date_fin', sa.DateTime, nullable=True),
        sa.Column('id_parcelle', sa.Integer, sa.ForeignKey('parcelles.id'), nullable=False),
        sa.Column('id_mesure', sa.Integer, sa.ForeignKey('mesures.id'), nullable=True),
        sa.Column('id_action', sa.Integer, sa.ForeignKey('actions.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('idx_alertes_date', 'alertes', [sa.text('date_debut DESC')])
    op.create_index('idx_alertes_etat', 'alertes', ['etat'])
    op.create_index('idx_alertes_parcelle', 'alertes', ['id_parcelle'])

    # 9. seuils
    op.create_table(
        'seuils',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('type_mesure', sa.String(20), nullable=False),
        sa.Column('valeur_min', sa.Float, nullable=False),
        sa.Column('valeur_max', sa.Float, nullable=False),
        sa.Column('unite', sa.String(10), nullable=False),
        sa.Column('id_utilisateur', sa.Integer, sa.ForeignKey('utilisateurs.id'), nullable=False),
        sa.Column('id_parcelle', sa.Integer, sa.ForeignKey('parcelles.id'), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('idx_seuils_parcelle', 'seuils', ['id_parcelle'])

    # 10. tokens
    op.create_table(
        'tokens',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('cle_api', sa.String(255), unique=True, nullable=False),
        sa.Column('nom', sa.String(50), nullable=False),
        sa.Column('actif', sa.Boolean, nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime, nullable=True),
        sa.Column('last_used_at', sa.DateTime, nullable=True),
        sa.Column('id_utilisateur', sa.Integer, sa.ForeignKey('utilisateurs.id'), nullable=False),
    )
    op.create_index('idx_tokens_cle_api', 'tokens', ['cle_api'])
    op.create_index('idx_tokens_utilisateur', 'tokens', ['id_utilisateur'])


def downgrade() -> None:
    op.drop_table('tokens')
    op.drop_table('seuils')
    op.drop_table('alertes')
    op.drop_table('actions')
    op.drop_table('commandes')
    op.drop_table('mesures')
    op.drop_table('actionneurs')
    op.drop_table('capteurs')
    op.drop_table('parcelles')
    op.drop_table('utilisateurs')
