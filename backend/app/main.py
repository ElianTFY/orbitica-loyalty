import secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .api.v1.router import api_v1_router
from .core.config import settings
from .core.database import SessionLocal
from .core.exceptions import DomainException
from .seed import seed_bootstrap


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_runtime()
    with SessionLocal() as db:
        seed_bootstrap(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    docs_url=None if settings.production else "/docs",
    redoc_url=None if settings.production else "/redoc",
    openapi_url=None if settings.production else "/openapi.json",
    lifespan=lifespan,
)


@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )


@app.middleware("http")
async def hardening_middleware(request: Request, call_next):
    path = request.url.path

    # Administrative and authentication traffic must pass through the BFF proxy
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


# Include domain routers
app.include_router(api_v1_router)


@app.get("/health")
def health():
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"ok": True, "service": settings.app_name, "version": "2.0.0"}
