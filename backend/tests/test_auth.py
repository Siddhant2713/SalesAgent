"""Tests for authentication endpoints — register, login, and access control."""


def test_register_new_user(client_no_auth):
    """Registering a new user should succeed and return the user email."""
    res = client_no_auth.post(
        "/api/auth/register",
        json={"email": "newuser@test.com", "password": "securepass123"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "newuser@test.com"
    assert "id" in data


def test_register_duplicate_email(client_no_auth):
    """Registering the same email twice should return 400."""
    client_no_auth.post(
        "/api/auth/register",
        json={"email": "dup@test.com", "password": "securepass123"}
    )
    res = client_no_auth.post(
        "/api/auth/register",
        json={"email": "dup@test.com", "password": "differentpass123"}
    )
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


def test_login_wrong_password(client_no_auth):
    """Login with incorrect password should return 401."""
    # First register
    client_no_auth.post(
        "/api/auth/register",
        json={"email": "logintest@test.com", "password": "correctpass1"}
    )
    # Then login with wrong password
    res = client_no_auth.post(
        "/api/auth/login",
        data={"username": "logintest@test.com", "password": "wrongpassword"}
    )
    assert res.status_code == 401


def test_protected_route_without_token(client_no_auth):
    """Accessing a protected route without a token should return 401."""
    res = client_no_auth.get("/api/leads")
    assert res.status_code == 401
