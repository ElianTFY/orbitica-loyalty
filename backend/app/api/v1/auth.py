from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.request_utils import client_ip, privacy_key
from ...models import User
from ...schemas.auth import ChangePasswordIn, LoginIn, LoginOut, UserOut
from ...services.auth_service import AuthService
from ..deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginOut)
def login(request: Request, payload: LoginIn, db: Session = Depends(get_db)):
    ip = client_ip(request)
    email_key = privacy_key(payload.email)
    return AuthService.authenticate(db, payload, ip, email_key)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password", response_model=UserOut)
def change_password(
    request: Request,
    payload: ChangePasswordIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ip = client_ip(request)
    return AuthService.change_password(db, user, payload, ip)
