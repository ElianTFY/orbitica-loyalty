from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Business, User
from .security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión requerida.")
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida o vencida.")

    user = db.get(User, payload.get("sub"))
    if not user or not user.active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no disponible.")
    if int(payload.get("tv", -1)) != int(user.token_version):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión revocada.")
    return user


def require_roles(*roles: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tenés permiso para esta acción.")
        return user
    return dependency


def get_current_business(
    user: User = Depends(require_roles("owner", "staff")),
    db: Session = Depends(get_db),
) -> Business:
    if not user.business_id:
        raise HTTPException(status_code=403, detail="El usuario no tiene un negocio asignado.")
    business = db.get(Business, user.business_id)
    if not business or not business.active:
        raise HTTPException(status_code=403, detail="Negocio inactivo o no disponible.")
    return business
