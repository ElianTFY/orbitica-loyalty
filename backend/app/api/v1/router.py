from fastapi import APIRouter
from .auth import router as auth_router
from .public import router as public_router
from .admin import router as admin_router
from .superadmin import router as superadmin_router
from .apple_wallet import router as apple_wallet_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(public_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(superadmin_router)
api_v1_router.include_router(apple_wallet_router)
