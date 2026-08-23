import secrets
import string
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_business, get_current_user, require_roles
from ..models import Business, Customer, LoyaltyTransaction, User
from ..notifications import sync_business_channels, sync_customer_channels
from ..rate_limit import limiter
from ..request_utils import client_ip
from ..schemas import (
    BusinessOut,
    BusinessSettingsIn,
    CustomerCreate,
    CustomerDetailOut,
    CustomerOut,
    DashboardActivity,
    DashboardOut,
    StaffCreate,
    StaffOut,
    StampIn,
    TransactionOut,
)
from ..security import hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"])


def limit_write(request: Request, user: User) -> None:
    limiter.check(f"admin-write:{user.id}:{client_ip(request)}", limit=120, window_seconds=60)


def make_card_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(10))


def normalize_phone(phone: str) -> str:
    raw = phone.strip()
    leading_plus = raw.startswith("+")
    digits = "".join(ch for ch in raw if ch.isdigit())
    return ("+" if leading_plus else "") + digits


def scoped_customer(db: Session, business: Business, customer_id: str, lock: bool = False) -> Customer:
    stmt = select(Customer).where(Customer.id == customer_id, Customer.business_id == business.id)
    if lock:
        stmt = stmt.with_for_update()
    customer = db.scalar(stmt)
    if not customer:
        raise HTTPException(404, "Cliente no encontrado.")
    return customer


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    user: User = Depends(require_roles("owner", "staff")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
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
        .limit(12)
    ).all()

    activity = [
        DashboardActivity(
            id=tx.id,
            type=tx.type,
            amount=tx.amount,
            created_at=tx.created_at,
            customer_name=customer_name,
            actor_name=actor_name,
        )
        for tx, customer_name, actor_name in rows
    ]

    return DashboardOut(
        business=business,
        customers=int(customers),
        active_cards=int(active_cards),
        stamps_awarded=int(stamps),
        rewards_redeemed=int(redeemed),
        new_customers_month=int(new_month),
        recent_activity=activity,
    )


@router.get("/customers", response_model=list[CustomerOut])
def list_customers(
    q: str | None = Query(default=None, max_length=100),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    stmt = select(Customer).where(Customer.business_id == business.id).order_by(Customer.created_at.desc())
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            Customer.name.ilike(term)
            | Customer.phone.ilike(term)
            | Customer.card_code.ilike(term)
        )
    return list(db.scalars(stmt.limit(500)).all())


@router.post("/customers", response_model=CustomerOut, status_code=201)
def create_customer(
    request: Request,
    payload: CustomerCreate,
    user: User = Depends(require_roles("owner", "staff")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, user)
    phone = normalize_phone(payload.phone)
    existing = db.scalar(
        select(Customer).where(Customer.business_id == business.id, Customer.phone == phone)
    )
    if existing:
        return existing

    for _ in range(4):
        customer = Customer(
            business_id=business.id,
            name=payload.name.strip(),
            phone=phone,
            email=str(payload.email).lower() if payload.email else None,
            card_code=make_card_code(),
            public_token=secrets.token_urlsafe(32),
        )
        db.add(customer)
        try:
            db.commit()
            db.refresh(customer)
            return customer
        except IntegrityError:
            db.rollback()
    raise HTTPException(409, "No se pudo crear el cliente.")


@router.get("/customers/{customer_id}", response_model=CustomerDetailOut)
def customer_detail(
    customer_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    customer = scoped_customer(db, business, customer_id)
    rows = db.execute(
        select(LoyaltyTransaction, User.full_name)
        .outerjoin(User, User.id == LoyaltyTransaction.actor_user_id)
        .where(LoyaltyTransaction.customer_id == customer.id)
        .order_by(LoyaltyTransaction.created_at.desc())
        .limit(100)
    ).all()
    txs = [
        TransactionOut(
            id=tx.id,
            type=tx.type,
            amount=tx.amount,
            note=tx.note,
            created_at=tx.created_at,
            actor_name=actor_name,
        )
        for tx, actor_name in rows
    ]
    data = CustomerOut.model_validate(customer).model_dump()
    return CustomerDetailOut(**data, transactions=txs)


@router.post("/customers/{customer_id}/stamp", response_model=CustomerOut)
def add_stamp(
    request: Request,
    customer_id: str,
    payload: StampIn,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_roles("owner", "staff")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, user)
    customer = scoped_customer(db, business, customer_id, lock=True)
    if not customer.active:
        raise HTTPException(400, "La tarjeta está inactiva.")

    was_ready = customer.stamp_balance >= business.stamps_required
    customer.stamp_balance += payload.amount
    customer.updated_at = datetime.now(timezone.utc)
    db.add(
        LoyaltyTransaction(
            business_id=business.id,
            customer_id=customer.id,
            actor_user_id=user.id,
            type="stamp",
            amount=payload.amount,
            note=payload.note,
        )
    )
    db.commit()
    db.refresh(customer)

    became_ready = not was_ready and customer.stamp_balance >= business.stamps_required
    background_tasks.add_task(
        sync_customer_channels,
        customer.id,
        "reward" if became_ready else "stamp",
    )
    return customer


@router.post("/customers/{customer_id}/redeem", response_model=CustomerOut)
def redeem(
    request: Request,
    customer_id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_roles("owner", "staff")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, user)
    customer = scoped_customer(db, business, customer_id, lock=True)
    if customer.stamp_balance < business.stamps_required:
        raise HTTPException(
            400,
            f"El cliente necesita {business.stamps_required} sellos para canjear.",
        )

    customer.stamp_balance -= business.stamps_required
    customer.rewards_redeemed += 1
    customer.updated_at = datetime.now(timezone.utc)
    db.add(
        LoyaltyTransaction(
            business_id=business.id,
            customer_id=customer.id,
            actor_user_id=user.id,
            type="redeem",
            amount=-business.stamps_required,
            note=business.reward_name,
        )
    )
    db.commit()
    db.refresh(customer)
    background_tasks.add_task(sync_customer_channels, customer.id, "redeem")
    return customer


@router.post("/customers/{customer_id}/rotate-token", response_model=CustomerOut)
def rotate_card_token(
    request: Request,
    customer_id: str,
    background_tasks: BackgroundTasks,
    owner: User = Depends(require_roles("owner")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    customer = scoped_customer(db, business, customer_id, lock=True)
    customer.public_token = secrets.token_urlsafe(32)
    customer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(customer)
    background_tasks.add_task(sync_customer_channels, customer.id, "silent")
    return customer


@router.get("/business", response_model=BusinessOut)
def get_business_settings(
    business: Business = Depends(get_current_business),
):
    return business


@router.patch("/business", response_model=BusinessOut)
def update_business_settings(
    request: Request,
    payload: BusinessSettingsIn,
    background_tasks: BackgroundTasks,
    owner: User = Depends(require_roles("owner")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    data = payload.model_dump(exclude_none=True)
    now = datetime.now(timezone.utc)
    for key, value in data.items():
        setattr(business, key, value)
    business.updated_at = now

    if data:
        # Apple uses Customer.updated_at as its pass update tag. Mark all cards when
        # business-level fields shown on the pass change.
        db.execute(
            update(Customer)
            .where(Customer.business_id == business.id)
            .values(updated_at=now)
        )
    db.commit()
    db.refresh(business)

    if data:
        visible_program_change = bool({"name", "reward_name", "stamps_required"}.intersection(data))
        background_tasks.add_task(
            sync_business_channels,
            business.id,
            "program" if visible_program_change else "silent",
        )
    return business


@router.get("/staff", response_model=list[StaffOut])
def list_staff(
    owner: User = Depends(require_roles("owner")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(User)
            .where(User.business_id == business.id, User.role.in_(["owner", "staff"]))
            .order_by(User.created_at.asc())
        ).all()
    )


@router.post("/staff", response_model=StaffOut, status_code=201)
def create_staff(
    request: Request,
    payload: StaffCreate,
    owner: User = Depends(require_roles("owner")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    if db.scalar(select(User).where(User.email == str(payload.email).lower())):
        raise HTTPException(409, "Ese correo ya está registrado.")

    staff = User(
        business_id=business.id,
        email=str(payload.email).lower(),
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        role="staff",
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


@router.patch("/staff/{staff_id}/toggle", response_model=StaffOut)
def toggle_staff(
    request: Request,
    staff_id: str,
    owner: User = Depends(require_roles("owner")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    staff = db.scalar(
        select(User).where(
            User.id == staff_id,
            User.business_id == business.id,
            User.role == "staff",
        )
    )
    if not staff:
        raise HTTPException(404, "Empleado no encontrado.")
    staff.active = not staff.active
    db.commit()
    db.refresh(staff)
    return staff
