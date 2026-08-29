from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Business, Customer, LoyaltyTransaction, User
from ..schemas.loyalty import DashboardActivity, DashboardOut


class AnalyticsService:
    @staticmethod
    def get_dashboard(db: Session, business: Business) -> DashboardOut:
        customers = db.scalar(
            select(func.count(Customer.id)).where(Customer.business_id == business.id)
        ) or 0
        active_cards = db.scalar(
            select(func.count(Customer.id)).where(
                Customer.business_id == business.id, Customer.active.is_(True)
            )
        ) or 0
        stamps = db.scalar(
            select(func.coalesce(func.sum(LoyaltyTransaction.amount), 0)).where(
                LoyaltyTransaction.business_id == business.id,
                LoyaltyTransaction.type == "stamp",
            )
        ) or 0
        points = db.scalar(
            select(func.coalesce(func.sum(LoyaltyTransaction.amount), 0)).where(
                LoyaltyTransaction.business_id == business.id,
                LoyaltyTransaction.type == "points",
            )
        ) or 0
        redeemed = db.scalar(
            select(func.count(LoyaltyTransaction.id)).where(
                LoyaltyTransaction.business_id == business.id,
                LoyaltyTransaction.type == "redeem",
            )
        ) or 0

        now = datetime.now(timezone.utc)
        month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        new_month = db.scalar(
            select(func.count(Customer.id)).where(
                Customer.business_id == business.id,
                Customer.created_at >= month_start,
            )
        ) or 0

        rows = db.execute(
            select(LoyaltyTransaction, Customer.name, User.full_name)
            .join(Customer, Customer.id == LoyaltyTransaction.customer_id)
            .outerjoin(User, User.id == LoyaltyTransaction.actor_user_id)
            .where(LoyaltyTransaction.business_id == business.id)
            .order_by(LoyaltyTransaction.created_at.desc())
            .limit(15)
        ).all()

        activity = [
            DashboardActivity(
                id=tx.id,
                type=tx.type,
                amount=tx.amount,
                created_at=tx.created_at,
                customer_name=customer_name,
                actor_name=actor_name,
                note=tx.note,
            )
            for tx, customer_name, actor_name in rows
        ]

        return DashboardOut(
            business=business,
            customers=int(customers),
            active_cards=int(active_cards),
            stamps_awarded=int(stamps),
            points_awarded=int(points),
            rewards_redeemed=int(redeemed),
            new_customers_month=int(new_month),
            recent_activity=activity,
        )
