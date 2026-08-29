from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.exceptions import ConflictException, NotFoundException
from ..core.security import hash_password
from ..models import User
from ..schemas.staff import StaffCreate


class StaffService:
    @staticmethod
    def list_by_business(db: Session, business_id: str) -> list[User]:
        return list(
            db.scalars(
                select(User)
                .where(User.business_id == business_id, User.role.in_(["owner", "manager", "staff"]))
                .order_by(User.created_at.asc())
            ).all()
        )

    @staticmethod
    def create_staff(db: Session, business_id: str, payload: StaffCreate) -> User:
        email = str(payload.email).lower()
        if db.scalar(select(User).where(User.email == email)):
            raise ConflictException("Ese correo ya est? registrado.")

        staff = User(
            business_id=business_id,
            email=email,
            full_name=payload.full_name.strip(),
            password_hash=hash_password(payload.password),
            role=payload.role,
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)
        return staff

    @staticmethod
    def toggle_status(db: Session, business_id: str, staff_id: str) -> User:
        staff = db.scalar(
            select(User).where(
                User.id == staff_id,
                User.business_id == business_id,
                User.role.in_(["staff", "manager"]),
            )
        )
        if not staff:
            raise NotFoundException("Empleado no encontrado.")
        staff.active = not staff.active
        db.commit()
        db.refresh(staff)
        return staff
