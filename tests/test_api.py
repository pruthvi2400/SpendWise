"""Pytest configuration and test suite for SpendWise API."""

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "a-very-long-and-secure-test-secret-key-at-least-32-chars!"
os.environ["JWT_EXPIRATION_MINUTES"] = "30"

from app.database import Base, get_db
from app.main import app
from app.models import Budget, Expense, User  # noqa

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "securepassword123",
            "full_name": "Test User",
        },
    )
    login_response = client.post(
        "/auth/login",
        json={"email": "test@example.com", "password": "securepassword123"},
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_home_and_health(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"

    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_user_registration_and_login(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "user@example.com",
            "password": "mypassword",
            "full_name": "Jane Doe",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user@example.com"
    assert "id" in data

    response = client.post(
        "/auth/register",
        json={
            "email": "user@example.com",
            "password": "anotherpassword",
        },
    )
    assert response.status_code == 400

    response = client.post(
        "/auth/login",
        json={
            "email": "user@example.com",
            "password": "mypassword",
        },
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"


def test_expense_crud(client, auth_headers):
    response = client.post(
        "/expenses",
        headers=auth_headers,
        json={
            "title": "Grocery Shopping",
            "amount": "45.50",
            "category": "Food",
            "description": "Weekly groceries",
            "expense_date": "2026-10-25",
        },
    )
    assert response.status_code == 201
    expense_data = response.json()
    assert expense_data["title"] == "Grocery Shopping"
    assert expense_data["amount"] == "45.50"
    expense_id = expense_data["id"]

    response = client.get("/expenses", headers=auth_headers)
    assert response.status_code == 200
    list_data = response.json()
    assert list_data["total"] == 1
    assert len(list_data["items"]) == 1

    response = client.get(f"/expenses/{expense_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Grocery Shopping"

    response = client.put(
        f"/expenses/{expense_id}",
        headers=auth_headers,
        json={"title": "Supermarket Shopping", "amount": "50.00"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Supermarket Shopping"
    assert response.json()["amount"] == "50.00"

    response = client.delete(f"/expenses/{expense_id}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get(f"/expenses/{expense_id}", headers=auth_headers)
    assert response.status_code == 404


def test_budget_and_analytics(client, auth_headers):
    response = client.post(
        "/budgets",
        headers=auth_headers,
        json={
            "category": "Food",
            "amount_limit": "200.00",
            "month": 10,
            "year": 2026,
        },
    )
    assert response.status_code == 201
    budget_id = response.json()["id"]

    client.post(
        "/expenses",
        headers=auth_headers,
        json={
            "title": "Lunch",
            "amount": "50.00",
            "category": "Food",
            "expense_date": "2026-10-10",
        },
    )
    client.post(
        "/expenses",
        headers=auth_headers,
        json={
            "title": "Dinner",
            "amount": "70.00",
            "category": "Food",
            "expense_date": "2026-10-15",
        },
    )

    response = client.get(f"/budgets/{budget_id}/status", headers=auth_headers)
    assert response.status_code == 200
    status_data = response.json()
    assert status_data["total_spent"] == "120.00"
    assert status_data["remaining"] == "80.00"
    assert status_data["percentage_used"] == 60.0
    assert status_data["is_over_budget"] is False

    response = client.get("/analytics/total", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total_amount"] == "120.00"
    assert response.json()["total_count"] == 2

    response = client.get("/analytics/categories", headers=auth_headers)
    assert response.status_code == 200
    cat_data = response.json()
    assert cat_data["total_amount"] == "120.00"
    assert len(cat_data["categories"]) == 1
    assert cat_data["categories"][0]["category"] == "Food"

    response = client.get("/analytics/monthly?year=2026", headers=auth_headers)
    assert response.status_code == 200
    monthly_data = response.json()
    assert len(monthly_data["months"]) == 1
    assert monthly_data["months"][0]["year"] == 2026
    assert monthly_data["months"][0]["month"] == 10
    assert monthly_data["months"][0]["total_amount"] == "120.00"

def test_missing_or_invalid_authentication(client):
    # Missing token
    response = client.get("/expenses")
    assert response.status_code == 401

    # Malformed token
    response = client.get("/expenses", headers={"Authorization": "Bearer invalidtoken"})
    assert response.status_code == 401

    # Invalid scheme
    response = client.get("/expenses", headers={"Authorization": "Basic dGVzdDp0ZXN0"})
    assert response.status_code == 401


def test_duplicate_registration_error_handling(client):
    payload = {
        "email": "dup@example.com",
        "password": "password123",
        "full_name": "Duplicate User",
    }
    response1 = client.post("/auth/register", json=payload)
    assert response1.status_code == 201

    response2 = client.post("/auth/register", json=payload)
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"]


def test_user_response_no_password_exposure(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "secure@example.com",
            "password": "mypassword123",
            "full_name": "Secure User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "hashed_password" not in data
    assert "password" not in data


def test_expense_validation_zero_and_negative(client, auth_headers):
    # Zero amount
    response = client.post(
        "/expenses",
        headers=auth_headers,
        json={
            "title": "Zero expense",
            "amount": "0.00",
            "category": "Food",
            "expense_date": "2026-10-25",
        },
    )
    assert response.status_code == 422

    # Negative amount
    response = client.post(
        "/expenses",
        headers=auth_headers,
        json={
            "title": "Negative expense",
            "amount": "-10.50",
            "category": "Food",
            "expense_date": "2026-10-25",
        },
    )
    assert response.status_code == 422


def test_budget_validation_zero_and_negative(client, auth_headers):
    # Zero budget limit
    response = client.post(
        "/budgets",
        headers=auth_headers,
        json={
            "category": "Food",
            "amount_limit": "0.00",
            "month": 10,
            "year": 2026,
        },
    )
    assert response.status_code == 422

    # Negative budget limit
    response = client.post(
        "/budgets",
        headers=auth_headers,
        json={
            "category": "Food",
            "amount_limit": "-100.00",
            "month": 10,
            "year": 2026,
        },
    )
    assert response.status_code == 422


def test_cross_user_resource_isolation(client):
    # Register User A
    client.post(
        "/auth/register",
        json={"email": "usera@example.com", "password": "password123", "full_name": "User A"},
    )
    token_a = client.post(
        "/auth/login", json={"email": "usera@example.com", "password": "password123"}
    ).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    client.post(
        "/auth/register",
        json={"email": "userb@example.com", "password": "password123", "full_name": "User B"},
    )
    token_b = client.post(
        "/auth/login", json={"email": "userb@example.com", "password": "password123"}
    ).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates an expense
    exp_res = client.post(
        "/expenses",
        headers=headers_a,
        json={
            "title": "User A Expense",
            "amount": "100.00",
            "category": "Travel",
            "expense_date": "2026-10-20",
        },
    )
    assert exp_res.status_code == 201
    exp_id = exp_res.json()["id"]

    # User B tries to read User A's expense -> 404
    assert client.get(f"/expenses/{exp_id}", headers=headers_b).status_code == 404

    # User B tries to update User A's expense -> 404
    assert client.put(
        f"/expenses/{exp_id}", headers=headers_b, json={"title": "Hacked Title"}
    ).status_code == 404

    # User B tries to delete User A's expense -> 404
    assert client.delete(f"/expenses/{exp_id}", headers=headers_b).status_code == 404

    # User A creates a budget
    bud_res = client.post(
        "/budgets",
        headers=headers_a,
        json={
            "category": "Travel",
            "amount_limit": "500.00",
            "month": 10,
            "year": 2026,
        },
    )
    assert bud_res.status_code == 201
    bud_id = bud_res.json()["id"]

    # User B tries to access User A's budget status -> 404
    assert client.get(f"/budgets/{bud_id}/status", headers=headers_b).status_code == 404

