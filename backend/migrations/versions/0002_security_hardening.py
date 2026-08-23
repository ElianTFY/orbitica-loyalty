"""security hardening

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-23
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("token_version", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("users", sa.Column("failed_login_attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True))

    op.create_index("ix_customers_business_created", "customers", ["business_id", "created_at"], unique=False)
    op.create_index("ix_transactions_business_created", "loyalty_transactions", ["business_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_transactions_business_created", table_name="loyalty_transactions")
    op.drop_index("ix_customers_business_created", table_name="customers")
    op.drop_column("users", "locked_until")
    op.drop_column("users", "failed_login_attempts")
    op.drop_column("users", "token_version")
