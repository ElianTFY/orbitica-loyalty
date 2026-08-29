import os
import tempfile
from pathlib import Path

TEST_DB = Path(tempfile.gettempdir()) / "orbitica_loyalty_test2.db"
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
from app.models import Business, User, Customer
from app.core.security import hash_password

Base.metadata.create_all(engine)

with SessionLocal() as db:
    business = Business(
        name="Caf? Central",
        slug="cafe",
        program_type="points",
        reward_name="Caf? Gratis",
        stamps_required=10,
        points_ratio=10.0,
    )
    db.add(business)
    db.flush()
    user = User(
        business_id=business.id,
        email="cafe_owner@test.com",
        full_name="Cafe Owner",
        password_hash=hash_password("StrongPassword123!"),
        role="owner",
    )
    db.add(user)
    customer = Customer(
        business_id=business.id,
        name="Cliente Caf?",
        phone="8999-9999",
        card_code="CAFE123456",
        public_token="cafe-public-token-12345678901234567890",
        point_balance=50,
    )
    db.add(customer)
    db.commit()

client = TestClient(app)
BFF = {"X-Orbitica-BFF": os.environ["BFF_SHARED_SECRET"]}


def login():
    res = client.post(
        "/api/auth/login",
        json={"email": "cafe_owner@test.com", "password": "StrongPassword123!"},
        headers=BFF,
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}", **BFF}


def test_points_award_and_reward_catalog():
    headers = login()

    # 1. Create a reward
    reward_res = client.post(
        "/api/admin/rewards",
        json={
            "name": "Postre Especial",
            "description": "Un postre de la casa",
            "points_required": 100,
            "stock": 5,
        },
        headers=headers,
    )
    assert reward_res.status_code == 201
    reward_id = reward_res.json()["id"]

    # 2. List customers paginated
    cust_res = client.get("/api/admin/customers/paginated?page=1&page_size=10", headers=headers)
    assert cust_res.status_code == 200
    assert cust_res.json()["total"] == 1
    customer_id = cust_res.json()["items"][0]["id"]

    # 3. Award points
    pts_res = client.post(
        f"/api/admin/customers/{customer_id}/points",
        json={"amount": 60, "spend_amount": 6000},
        headers=headers,
    )
    assert pts_res.status_code == 200
    assert pts_res.json()["point_balance"] == 110  # 50 + 60

    # 4. Redeem reward
    redeem_res = client.post(
        f"/api/admin/customers/{customer_id}/redeem",
        json={"reward_id": reward_id},
        headers=headers,
    )
    assert redeem_res.status_code == 200
    assert redeem_res.json()["point_balance"] == 10  # 110 - 100
    assert redeem_res.json()["rewards_redeemed"] == 1

    # 5. Check customer details
    detail_res = client.get(f"/api/admin/customers/{customer_id}", headers=headers)
    assert detail_res.status_code == 200
    assert len(detail_res.json()["transactions"]) >= 2
