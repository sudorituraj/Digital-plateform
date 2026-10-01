"""
FastAPI application entry point.

Run locally (from backend/):   .venv/bin/uvicorn app.main:app --reload --port 8010
API docs (development only):   http://localhost:8010/api/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .config import get_settings
from .errors import install_error_handlers
from .routers import analytics, appointments, auth, doctor, me, notifications, patients, reception, staff_auth
from .staff_accounts import seed_demo_staff

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    database = await db.connect()
    await seed_demo_staff(database, get_settings())
    yield
    await db.close()


def create_app() -> FastAPI:
    settings = get_settings()
    is_prod = settings.app_env == "production"
    app = FastAPI(
        title="Saran Nursing Home API",
        lifespan=lifespan,
        # Interactive docs are handy locally but not exposed in production.
        docs_url=None if is_prod else "/api/docs",
        redoc_url=None,
        openapi_url=None if is_prod else "/api/openapi.json",
    )
    install_error_handlers(app)

    if settings.cors_origin_list:  # only for split-domain deployments; explicit allow-list, never "*"
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
            allow_headers=["Content-Type"],
        )

    @app.get("/api/health", tags=["system"])
    async def health():
        await db.get_db().command("ping")
        return {"status": "ok", "env": settings.app_env, "otp_mode": settings.otp_mode}

    for router in (
        auth.router, me.router, appointments.router, staff_auth.router, reception.router, patients.router, doctor.router,
        notifications.router, analytics.router,
    ):
        app.include_router(router, prefix="/api")
    return app


app = create_app()
