from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.exceptions import DomainException, NotFoundException, ValidationException
from ..models import Business, Customer, LoyaltyTransaction, Reward, User
from ..schemas.loyalty import PointsIn, RedeemIn, RewardCreate, RewardUpdate, StampIn
from .customer_service import CustomerService


class LoyaltyService:
    @staticmethod
    def add_stamp(
        db: Session, business: Business, customer_id: str, actor: User, payload: StampIn
    ) -> tuple[Customer, bool]:
        customer = CustomerService.get_scoped(db, business.id, customer_id, lock=True)
        if not customer.active:
            raise ValidationException("La tarjeta est? inactiva.")

        was_ready = customer.stamp_balance >= business.stamps_required
        customer.stamp_balance += payload.amount
        customer.total_visits += 1
        now = datetime.now(timezone.utc)
        customer.last_visit_at = now
        customer.updated_at = now

        db.add(
            LoyaltyTransaction(
                business_id=business.id,
                customer_id=customer.id,
                actor_user_id=actor.id,
                type="stamp",
                amount=payload.amount,
                note=payload.note or f"+{payload.amount} sello(s)",
            )
        )
        db.commit()
        db.refresh(customer)

        became_ready = not was_ready and customer.stamp_balance >= business.stamps_required
        return customer, became_ready

    @staticmethod
    def add_points(
        db: Session, business: Business, customer_id: str, actor: User, payload: PointsIn
    ) -> tuple[Customer, bool]:
        customer = CustomerService.get_scoped(db, business.id, customer_id, lock=True)
        if not customer.active:
            raise ValidationException("La tarjeta est? inactiva.")

        customer.point_balance += payload.amount
        customer.total_visits += 1
        now = datetime.now(timezone.utc)
        customer.last_visit_at = now
        customer.updated_at = now

        note = payload.note
        if not note and payload.spend_amount:
            note = f"Gasto: {business.points_currency_symbol}{payload.spend_amount:,.2f}"

        db.add(
            LoyaltyTransaction(
                business_id=business.id,
                customer_id=customer.id,
                actor_user_id=actor.id,
                type="points",
                amount=payload.amount,
                note=note or f"+{payload.amount} puntos",
            )
        )
        db.commit()
        db.refresh(customer)
        return customer, True

    @staticmethod
    def redeem_reward(
        db: Session, business: Business, customer_id: str, actor: User, payload: RedeemIn
    ) -> Customer:
        customer = CustomerService.get_scoped(db, business.id, customer_id, lock=True)
        reward: Reward | None = None

        if payload.reward_id:
            reward = db.scalar(
                select(Reward).where(
                    Reward.id == payload.reward_id,
                    Reward.business_id == business.id,
                    Reward.active.is_(True),
                ).with_for_update()
            )
            if not reward:
                raise NotFoundException("Recompensa no encontrada o inactiva.")
            if reward.stock is not None and reward.stock <= 0:
                raise DomainException("Esta recompensa no tiene stock disponible.", code="OUT_OF_STOCK")

            if reward.points_required and customer.point_balance < reward.points_required:
                raise DomainException(
                    f"El cliente necesita {reward.points_required} puntos para esta recompensa.",
                    code="INSUFFICIENT_POINTS",
                )
            if reward.stamps_required and customer.stamp_balance < reward.stamps_required:
                raise DomainException(
                    f"El cliente necesita {reward.stamps_required} sellos para esta recompensa.",
                    code="INSUFFICIENT_STAMPS",
                )

            if reward.points_required:
                customer.point_balance -= reward.points_required
            if reward.stamps_required:
                customer.stamp_balance -= reward.stamps_required
            if reward.stock is not None:
                reward.stock -= 1

            reward_name = reward.name
        else:
            if customer.stamp_balance < business.stamps_required:
                raise DomainException(
                    f"El cliente necesita {business.stamps_required} sellos para canjear.",
                    code="INSUFFICIENT_STAMPS",
                )
            customer.stamp_balance -= business.stamps_required
            reward_name = business.reward_name

        customer.rewards_redeemed += 1
        now = datetime.now(timezone.utc)
        customer.updated_at = now

        db.add(
            LoyaltyTransaction(
                business_id=business.id,
                customer_id=customer.id,
                actor_user_id=actor.id,
                reward_id=reward.id if reward else None,
                type="redeem",
                amount=-business.stamps_required if not (reward and reward.points_required) else -reward.points_required,
                note=payload.note or reward_name,
            )
        )
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def list_rewards(db: Session, business_id: str) -> list[Reward]:
        return list(
            db.scalars(
                select(Reward).where(Reward.business_id == business_id).order_by(Reward.created_at.desc())
            ).all()
        )

    @staticmethod
    def create_reward(db: Session, business_id: str, payload: RewardCreate) -> Reward:
        reward = Reward(
            business_id=business_id,
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            stamps_required=payload.stamps_required,
            points_required=payload.points_required,
            stock=payload.stock,
            expires_at=payload.expires_at,
        )
        db.add(reward)
        db.commit()
        db.refresh(reward)
        return reward

    @staticmethod
    def update_reward(db: Session, business_id: str, reward_id: str, payload: RewardUpdate) -> Reward:
        reward = db.scalar(select(Reward).where(Reward.id == reward_id, Reward.business_id == business_id))
        if not reward:
            raise NotFoundException("Recompensa no encontrada.")
        for key, value in payload.model_dump(exclude_none=True).items():
            setattr(reward, key, value)
        reward.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(reward)
        return reward
