"""flexible loyalty and rewards

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-28
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update businesses table
    op.add_column("businesses", sa.Column("program_type", sa.String(length=20), nullable=False, server_default="stamps"))
    op.add_column("businesses", sa.Column("points_ratio", sa.Float(), nullable=False, server_default="10.0"))
    op.add_column("businesses", sa.Column("points_currency_symbol", sa.String(length=10), nullable=False, server_default="?"))
    op.add_column("businesses", sa.Column("logo_url", sa.String(length=255), nullable=True))
    op.add_column("businesses", sa.Column("welcome_message", sa.String(length=255), nullable=True))

    # 2. Update customers table
    op.add_column("customers", sa.Column("point_balance", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("customers", sa.Column("total_visits", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("customers", sa.Column("last_visit_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_customers_business_search", "customers", ["business_id", "name", "phone"], unique=False)

    # 3. Create rewards table
    op.create_table(
        "rewards",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("business_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("stamps_required", sa.Integer(), nullable=True),
        sa.Column("points_required", sa.Integer(), nullable=True),
        sa.Column("stock", sa.Integer(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rewards_business_active", "rewards", ["business_id", "active"], unique=False)

    # 4. Update loyalty_transactions table
    op.add_column("loyalty_transactions", sa.Column("reward_id", sa.String(length=36), nullable=True))
    op.create_foreign_key(
        "fk_loyalty_transactions_reward_id",
        "loyalty_transactions",
        "rewards",
        ["reward_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_transactions_customer_created", "loyalty_transactions", ["customer_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_transactions_customer_created", table_name="loyalty_transactions")
    op.drop_constraint("fk_loyalty_transactions_reward_id", "loyalty_transactions", type_="foreignkey")
    op.drop_column("loyalty_transactions", "reward_id")
    op.drop_index("ix_rewards_business_active", table_name="rewards")
    op.drop_table("rewards")
    op.drop_index("ix_customers_business_search", table_name="customers")
    op.drop_column("customers", "last_visit_at")
    op.drop_column("customers", "total_visits")
    op.drop_column("customers", "point_balance")
    op.drop_column("businesses", "welcome_message")
    op.drop_column("businesses", "logo_url")
    op.drop_column("businesses", "points_currency_symbol")
    op.drop_column("businesses", "points_ratio")
    op.drop_column("businesses", "program_type")
