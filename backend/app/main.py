from contextlib import asynccontextmanager
import secrets

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .config import settings
from .database import SessionLocal
from .routers import admin, apple_wallet, auth, public, superadmin
from .seed import seed_bootstrap


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_runtime()
    with SessionLocal() as db:
        seed_bootstrap(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.2.0",
    docs_url=None if settings.production else "/docs",
    redoc_url=None if settings.production else "/redoc",
    openapi_url=None if settings.production else "/openapi.json",
    lifespan=lifespan,
)


@app.middleware("http")
async def hardening_middleware(request: Request, call_next):
    path = request.url.path

    # Administrative/authentication traffic must come through our Next.js BFF.
    if path.startswith(("/api/auth", "/api/admin", "/api/superadmin")) and settings.bff_shared_secret:
        supplied = request.headers.get("x-orbitica-bff", "")
        if not secrets.compare_digest(supplied, settings.bff_shared_secret):
            return JSONResponse({"detail": "Ruta no disponible."}, status_code=404)

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    if path.startswith(
        ("/api/auth", "/api/admin", "/api/superadmin", "/api/public/card", "/api/apple-wallet")
    ):
        response.headers["Cache-Control"] = "no-store"
    return response


app.include_router(auth.router)
app.include_router(public.router)
app.include_router(apple_wallet.router)
app.include_router(admin.router)
app.include_router(superadmin.router)


@app.get("/health")
def health():
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"ok": True, "service": settings.app_name, "version": "1.2.0"}
