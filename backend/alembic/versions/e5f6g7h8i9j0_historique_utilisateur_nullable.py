"""historique_actions id_utilisateur nullable

Revision ID: e5f6g7h8i9j0
Revises: d94e38b47852
Create Date: 2026-09-05 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6g7h8i9j0'
down_revision: Union[str, None] = 'a1b2c3d4e5f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('historique_actions', 'id_utilisateur',
                     existing_type=sa.Integer(),
                     nullable=True)


def downgrade() -> None:
    op.alter_column('historique_actions', 'id_utilisateur',
                     existing_type=sa.Integer(),
                     nullable=False)
