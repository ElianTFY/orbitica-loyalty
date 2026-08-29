import os
import tempfile
from pathlib import Path

TEST_DB = Path(tempfile.gettempdir()) / "orbitica_loyalty_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["JWT_SECRET"] = "test-secret-that-is-definitely-long-enough-123456"
os.environ["BFF_SHARED_SECRET"] = "test-bff-secret-that-is-definitely-long-enough-123456"
os.environ["APP_ENV"] = "test"
os.environ["SEED_DEMO"] = "false"
os.environ["WEB_PUSH_ENABLED"] = "false"
os.environ["APPLE_WALLET_ENABLED"] = "false"
os.environ["GOOGLE_WALLET_ENABLED"] = "false"

from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.main import app
from app.models import Business, User
from app.core.security import hash_password

Base.metadata.create_all(engine)

with SessionLocal() as db:
    business = Business(name="Test Barber", slug="test", reward_name="Corte", stamps_required=3)
    db.add(business)
    db.flush()
    db.add(
        User(
            business_id=business.id,
            email="owner@test.com",
            full_name="Owner",
            password_hash=hash_password("StrongPassword123!"),
            role="owner",
        )
    )
    db.commit()

client = TestClient(app)
BFF = {"X-Orbitica-BFF": os.environ["BFF_SHARED_SECRET"]}


def login_headers(email="owner@test.com", password="StrongPassword123!"):
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
        headers=BFF,
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}", **BFF}


def test_bff_guard_hides_private_routes():
    response = client.post(
        "/api/auth/login",
        json={"email": "owner@test.com", "password": "StrongPassword123!"},
    )
    assert response.status_code == 404


def test_public_join_does_not_leak_existing_token():
    join = client.post(
        "/api/public/business/test/join",
        json={"name": "Cliente Uno", "phone": "8888-8888", "email": "cliente@test.com"},
    )
    assert join.status_code == 201, join.text
    token = join.json()["public_token"]

    duplicate = client.post(
        "/api/public/business/test/join",
        json={"name": "Otra Persona", "phone": "8888-8888", "email": "otro@test.com"},
    )
    assert duplicate.status_code == 409
    assert token not in duplicate.text

    card = client.get(f"/api/public/card/{token}")
    assert card.status_code == 200
    assert card.json()["stamp_balance"] == 0

    push_status = client.get(f"/api/public/card/{token}/push/status")
    assert push_status.status_code == 200
    assert push_status.json() == {"enabled": False, "vapid_public_key": ""}

    subscribe = client.post(
        f"/api/public/card/{token}/push/subscribe",
        json={
            "endpoint": "https://push.example.com/subscriptions/0123456789abcdef",
            "keys": {"p256dh": "a" * 32, "auth": "b" * 16},
        },
    )
    assert subscribe.status_code == 503


def test_admin_flow_and_password_revocation():
    headers = login_headers()
    customers = client.get("/api/admin/customers", headers=headers)
    assert customers.status_code == 200
    customer_id = customers.json()[0]["id"]
    old_public_token = customers.json()[0]["public_token"]

    rotated = client.post(f"/api/admin/customers/{customer_id}/rotate-token", headers=headers)
    assert rotated.status_code == 200, rotated.text
    assert rotated.json()["public_token"] != old_public_token
    assert client.get(f"/api/public/card/{old_public_token}").status_code == 404

    for _ in range(3):
        stamp = client.post(
            f"/api/admin/customers/{customer_id}/stamp",
            json={"amount": 1},
            headers=headers,
        )
        assert stamp.status_code == 200, stamp.text

    redeem = client.post(f"/api/admin/customers/{customer_id}/redeem", headers=headers)
    assert redeem.status_code == 200, redeem.text
    assert redeem.json()["stamp_balance"] == 0
    assert redeem.json()["rewards_redeemed"] == 1

    dashboard = client.get("/api/admin/dashboard", headers=headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["customers"] == 1
    assert dashboard.json()["stamps_awarded"] == 3
    assert dashboard.json()["rewards_redeemed"] == 1

    changed = client.post(
        "/api/auth/change-password",
        json={
            "current_password": "StrongPassword123!",
            "new_password": "EvenStrongerPassword456!",
        },
        headers=headers,
    )
    assert changed.status_code == 200, changed.text

    old_session = client.get("/api/auth/me", headers=headers)
    assert old_session.status_code == 401

    relogin = client.post(
        "/api/auth/login",
        json={"email": "owner@test.com", "password": "EvenStrongerPassword456!"},
        headers=BFF,
    )
    assert relogin.status_code == 200, relogin.text


def test_tenant_isolation_blocks_cross_business_customer_access():
    from sqlalchemy import select
    from app.models import Customer

    with SessionLocal() as db:
        other = Business(name="Other Shop", slug="other", reward_name="Premio", stamps_required=5)
        db.add(other)
        db.commit()
        db.refresh(other)

    created = client.post(
        "/api/public/business/other/join",
        json={"name": "Cliente Dos", "phone": "8777-7777"},
    )
    assert created.status_code == 201, created.text

    with SessionLocal() as db:
        other_customer = db.scalar(select(Customer).where(Customer.phone == "87777777"))
        assert other_customer is not None
        other_customer_id = other_customer.id

    headers = login_headers(password="EvenStrongerPassword456!")
    attempt = client.post(
        f"/api/admin/customers/{other_customer_id}/stamp",
        json={"amount": 1},
        headers=headers,
    )
    assert attempt.status_code == 404
