"""push notifications and wallet updates

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "web_push_subscriptions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=False),
        sa.Column("endpoint_hash", sa.String(length=64), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh", sa.String(length=255), nullable=False),
        sa.Column("auth", sa.String(length=255), nullable=False),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("endpoint_hash", name="uq_web_push_endpoint_hash"),
    )
    op.create_index(
        "ix_web_push_subscriptions_customer_id",
        "web_push_subscriptions",
        ["customer_id"],
        unique=False,
    )
    op.create_index(
        "ix_web_push_subscriptions_endpoint_hash",
        "web_push_subscriptions",
        ["endpoint_hash"],
        unique=False,
    )
    op.create_index(
        "ix_web_push_customer_active",
        "web_push_subscriptions",
        ["customer_id", "active"],
        unique=False,
    )

    op.create_table(
        "apple_wallet_registrations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("customer_id", sa.String(length=36), nullable=False),
        sa.Column("device_library_identifier", sa.String(length=255), nullable=False),
        sa.Column("push_token", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "customer_id",
            "device_library_identifier",
            name="uq_apple_wallet_customer_device",
        ),
    )
    op.create_index(
        "ix_apple_wallet_registrations_customer_id",
        "apple_wallet_registrations",
        ["customer_id"],
        unique=False,
    )
    op.create_index(
        "ix_apple_wallet_device",
        "apple_wallet_registrations",
        ["device_library_identifier"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_apple_wallet_device", table_name="apple_wallet_registrations")
    op.drop_index("ix_apple_wallet_registrations_customer_id", table_name="apple_wallet_registrations")
    op.drop_table("apple_wallet_registrations")

    op.drop_index("ix_web_push_customer_active", table_name="web_push_subscriptions")
    op.drop_index("ix_web_push_subscriptions_endpoint_hash", table_name="web_push_subscriptions")
    op.drop_index("ix_web_push_subscriptions_customer_id", table_name="web_push_subscriptions")
    op.drop_table("web_push_subscriptions")
