from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_roles
from ..models import Business, User
from ..rate_limit import limiter
from ..request_utils import client_ip
from ..schemas import BusinessOut, SuperBusinessCreate, SuperBusinessOut
from ..security import hash_password

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])


@router.get("/businesses", response_model=list[BusinessOut])
def businesses(
    admin: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    return list(db.scalars(select(Business).order_by(Business.created_at.desc())).all())


@router.post("/businesses", response_model=SuperBusinessOut, status_code=201)
def create_business(
    request: Request,
    payload: SuperBusinessCreate,
    admin: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    limiter.check(f"superadmin-write:{admin.id}:{client_ip(request)}", limit=30, window_seconds=60)
    if db.scalar(select(Business).where(Business.slug == payload.slug)):
        raise HTTPException(409, "Ese slug ya existe.")
    if db.scalar(select(User).where(User.email == str(payload.owner_email).lower())):
        raise HTTPException(409, "El correo del dueño ya existe.")

    business = Business(
        name=payload.business_name.strip(),
        slug=payload.slug,
        reward_name=payload.reward_name.strip(),
        stamps_required=payload.stamps_required,
    )
    db.add(business)
    db.flush()

    owner = User(
        business_id=business.id,
        email=str(payload.owner_email).lower(),
        full_name=payload.owner_name.strip(),
        password_hash=hash_password(payload.owner_password),
        role="owner",
    )
    db.add(owner)
    db.commit()
    db.refresh(business)
    db.refresh(owner)

    return SuperBusinessOut(business=business, owner=owner)
