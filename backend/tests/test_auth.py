import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.main import app
from app.dependencies.db import get_db
from app.models import Base

TEST_DB = "postgresql+asyncpg://markkendall@localhost/bofi_test"

engine = create_async_engine(TEST_DB)
TestSession = async_sessionmaker(engine, expire_on_commit=False)


async def override_db():
    async with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text(
            "INSERT INTO account_types (id, code) VALUES (gen_random_uuid(), 'CHECKING'), "
            "(gen_random_uuid(), 'SAVINGS'), (gen_random_uuid(), 'MONEY_MARKET') "
            "ON CONFLICT (code) DO NOTHING"
        ))
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="session")
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_register_success(client):
    res = await client.post("/v1/auth/register", json={"email": "test@bofi.com", "password": "Secure123"})
    assert res.status_code == 201
    assert res.json()["data"]["email"] == "test@bofi.com"


async def test_register_duplicate(client):
    await client.post("/v1/auth/register", json={"email": "dup@bofi.com", "password": "Secure123"})
    res = await client.post("/v1/auth/register", json={"email": "dup@bofi.com", "password": "Secure123"})
    assert res.status_code == 409


async def test_login_success(client):
    await client.post("/v1/auth/register", json={"email": "login@bofi.com", "password": "Secure123"})
    res = await client.post("/v1/auth/login", json={"email": "login@bofi.com", "password": "Secure123"})
    assert res.status_code == 200
    assert "access_token" in res.json()["data"]
    assert "refresh_token" in res.json()["data"]


async def test_login_wrong_password(client):
    await client.post("/v1/auth/register", json={"email": "bad@bofi.com", "password": "Secure123"})
    res = await client.post("/v1/auth/login", json={"email": "bad@bofi.com", "password": "WrongPass1"})
    assert res.status_code == 401


async def test_refresh_token(client):
    await client.post("/v1/auth/register", json={"email": "refresh@bofi.com", "password": "Secure123"})
    login = await client.post("/v1/auth/login", json={"email": "refresh@bofi.com", "password": "Secure123"})
    rt = login.json()["data"]["refresh_token"]
    res = await client.post("/v1/auth/refresh", json={"refresh_token": rt})
    assert res.status_code == 200
    assert "access_token" in res.json()["data"]


async def test_refresh_token_reuse_rejected(client):
    await client.post("/v1/auth/register", json={"email": "reuse@bofi.com", "password": "Secure123"})
    login = await client.post("/v1/auth/login", json={"email": "reuse@bofi.com", "password": "Secure123"})
    rt = login.json()["data"]["refresh_token"]
    await client.post("/v1/auth/refresh", json={"refresh_token": rt})
    res = await client.post("/v1/auth/refresh", json={"refresh_token": rt})
    assert res.status_code == 401


async def test_weak_password_rejected(client):
    res = await client.post("/v1/auth/register", json={"email": "weak@bofi.com", "password": "short"})
    assert res.status_code == 422


async def test_health(client):
    res = await client.get("/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
