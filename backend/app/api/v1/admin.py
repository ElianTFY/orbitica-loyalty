from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.rate_limit import limiter
from ...core.request_utils import client_ip
from ...models import Business, User
from ...schemas.business import BusinessOut, BusinessSettingsIn
from ...schemas.common import PaginatedResponse
from ...schemas.customer import CustomerCreate, CustomerDetailOut, CustomerOut
from ...schemas.loyalty import (
    DashboardOut,
    PointsIn,
    RedeemIn,
    RewardCreate,
    RewardOut,
    RewardUpdate,
    StampIn,
)
from ...schemas.staff import StaffCreate, StaffOut
from ...services.analytics_service import AnalyticsService
from ...services.business_service import BusinessService
from ...services.customer_service import CustomerService
from ...services.loyalty_service import LoyaltyService
from ...services.notification_service import sync_business_channels, sync_customer_channels
from ...services.staff_service import StaffService
from ..deps import get_current_business, require_roles

router = APIRouter(prefix="/api/admin", tags=["admin"])


def limit_write(request: Request, user: User) -> None:
    limiter.check(f"admin-write:{user.id}:{client_ip(request)}", limit=120, window_seconds=60)


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    return AnalyticsService.get_dashboard(db, business)


@router.get("/customers", response_model=list[CustomerOut])
def list_customers(
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=500, ge=1, le=500),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    res = CustomerService.list_paginated(db, business.id, query=q, page=page, page_size=page_size)
    return res.items


@router.get("/customers/paginated", response_model=PaginatedResponse[CustomerOut])
def list_customers_paginated(
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    return CustomerService.list_paginated(db, business.id, query=q, page=page, page_size=page_size)


@router.post("/customers", response_model=CustomerOut, status_code=201)
def create_customer(
    request: Request,
    payload: CustomerCreate,
    user: User = Depends(require_roles("owner", "manager", "staff")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, user)
    return CustomerService.create_admin(db, business.id, payload)


@router.get("/customers/{customer_id}", response_model=CustomerDetailOut)
def customer_detail(
    customer_id: str,
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    return CustomerService.get_detail(db, business, customer_id)


@router.post("/customers/{customer_id}/stamp", response_model=CustomerOut)
def add_stamp(
    request: Request,
    customer_id: str,
    payload: StampIn,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_roles("owner", "manager", "staff")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, user)
    customer, became_ready = LoyaltyService.add_stamp(db, business, customer_id, user, payload)
    background_tasks.add_task(
        sync_customer_channels,
        customer.id,
        "reward" if became_ready else "stamp",
    )
    return customer


@router.post("/customers/{customer_id}/points", response_model=CustomerOut)
def add_points(
    request: Request,
    customer_id: str,
    payload: PointsIn,
    background_tasks: BackgroundTasks,
    user: User = Depends(require_roles("owner", "manager", "staff")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, user)
    customer, _ = LoyaltyService.add_points(db, business, customer_id, user, payload)
    background_tasks.add_task(sync_customer_channels, customer.id, "stamp")
    return customer


@router.post("/customers/{customer_id}/redeem", response_model=CustomerOut)
def redeem(
    request: Request,
    customer_id: str,
    payload: RedeemIn = RedeemIn(),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: User = Depends(require_roles("owner", "manager", "staff")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, user)
    customer = LoyaltyService.redeem_reward(db, business, customer_id, user, payload)
    background_tasks.add_task(sync_customer_channels, customer.id, "redeem")
    return customer


@router.post("/customers/{customer_id}/rotate-token", response_model=CustomerOut)
def rotate_card_token(
    request: Request,
    customer_id: str,
    background_tasks: BackgroundTasks,
    owner: User = Depends(require_roles("owner", "manager")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    customer = CustomerService.rotate_token(db, business.id, customer_id)
    background_tasks.add_task(sync_customer_channels, customer.id, "silent")
    return customer


@router.get("/rewards", response_model=list[RewardOut])
def list_rewards(
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    return LoyaltyService.list_rewards(db, business.id)


@router.post("/rewards", response_model=RewardOut, status_code=201)
def create_reward(
    request: Request,
    payload: RewardCreate,
    owner: User = Depends(require_roles("owner", "manager")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    return LoyaltyService.create_reward(db, business.id, payload)


@router.patch("/rewards/{reward_id}", response_model=RewardOut)
def update_reward(
    request: Request,
    reward_id: str,
    payload: RewardUpdate,
    owner: User = Depends(require_roles("owner", "manager")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    return LoyaltyService.update_reward(db, business.id, reward_id, payload)


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
    updated_business, visible_change = BusinessService.update_settings(db, business, payload)
    if visible_change:
        background_tasks.add_task(sync_business_channels, business.id, "program")
    return updated_business


@router.get("/staff", response_model=list[StaffOut])
def list_staff(
    owner: User = Depends(require_roles("owner", "manager")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    return StaffService.list_by_business(db, business.id)


@router.post("/staff", response_model=StaffOut, status_code=201)
def create_staff(
    request: Request,
    payload: StaffCreate,
    owner: User = Depends(require_roles("owner")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    return StaffService.create_staff(db, business.id, payload)


@router.patch("/staff/{staff_id}/toggle", response_model=StaffOut)
def toggle_staff(
    request: Request,
    staff_id: str,
    owner: User = Depends(require_roles("owner")),
    business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    limit_write(request, owner)
    return StaffService.toggle_status(db, business.id, staff_id)
