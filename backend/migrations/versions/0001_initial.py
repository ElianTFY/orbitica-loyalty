"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-22
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "businesses",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("reward_name", sa.String(length=120), nullable=False, server_default="Premio"),
        sa.Column("stamps_required", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("primary_color", sa.String(length=20), nullable=False, server_default="#2b76ff"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("slug", name="uq_business_slug"),
    )
    op.create_index("ix_businesses_slug", "businesses", ["slug"], unique=True)

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("business_id", sa.String(length=36), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=True),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("email", name="uq_user_email"),
    )
    op.create_index("ix_users_business_id", "users", ["business_id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "customers",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("business_id", sa.String(length=36), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=True),
        sa.Column("card_code", sa.String(length=16), nullable=False),
        sa.Column("public_token", sa.String(length=64), nullable=False),
        sa.Column("stamp_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rewards_redeemed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("business_id", "phone", name="uq_business_phone"),
        sa.UniqueConstraint("card_code", name="uq_customer_card_code"),
        sa.UniqueConstraint("public_token", name="uq_customer_public_token"),
    )
    op.create_index("ix_customers_business_id", "customers", ["business_id"], unique=False)
    op.create_index("ix_customers_card_code", "customers", ["card_code"], unique=True)
    op.create_index("ix_customers_public_token", "customers", ["public_token"], unique=True)

    op.create_table(
        "loyalty_transactions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("business_id", sa.String(length=36), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", sa.String(length=36), sa.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_transactions_business_id", "loyalty_transactions", ["business_id"], unique=False)
    op.create_index("ix_transactions_customer_id", "loyalty_transactions", ["customer_id"], unique=False)
    op.create_index("ix_transactions_actor_user_id", "loyalty_transactions", ["actor_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_transactions_actor_user_id", table_name="loyalty_transactions")
    op.drop_index("ix_transactions_customer_id", table_name="loyalty_transactions")
    op.drop_index("ix_transactions_business_id", table_name="loyalty_transactions")
    op.drop_table("loyalty_transactions")
    op.drop_index("ix_customers_public_token", table_name="customers")
    op.drop_index("ix_customers_card_code", table_name="customers")
    op.drop_index("ix_customers_business_id", table_name="customers")
    op.drop_table("customers")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_business_id", table_name="users")
    op.drop_table("users")
    op.drop_index("ix_businesses_slug", table_name="businesses")
    op.drop_table("businesses")
