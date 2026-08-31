"""add historique_actions table

Revision ID: d94e38b47852
Revises: a1b2c3d4e5f6
Create Date: 2026-08-31 22:51:00.993254

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd94e38b47852'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('historique_actions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('type_action', sa.String(length=20), nullable=False),
    sa.Column('entite', sa.String(length=20), nullable=False),
    sa.Column('entite_id', sa.Integer(), nullable=False),
    sa.Column('details', sa.Text(), nullable=True),
    sa.Column('id_utilisateur', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_utilisateur'], ['utilisateurs.id']),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('historique_actions')
