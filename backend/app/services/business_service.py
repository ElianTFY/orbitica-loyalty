from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..core.exceptions import NotFoundException
from ..models import Business, Customer
from ..schemas.business import BusinessSettingsIn


class BusinessService:
    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Business:
        business = db.scalar(select(Business).where(Business.slug == slug, Business.active.is_(True)))
        if not business:
            raise NotFoundException("Negocio no encontrado.")
        return business

    @staticmethod
    def update_settings(db: Session, business: Business, payload: BusinessSettingsIn) -> tuple[Business, bool]:
        data = payload.model_dump(exclude_none=True)
        now = datetime.now(timezone.utc)
        for key, value in data.items():
            setattr(business, key, value)
        business.updated_at = now

        if data:
            db.execute(
                update(Customer)
                .where(Customer.business_id == business.id)
                .values(updated_at=now)
            )
        db.commit()
        db.refresh(business)

        visible_change = bool({"name", "reward_name", "stamps_required", "program_type"}.intersection(data))
        return business, visible_change
