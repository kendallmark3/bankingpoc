from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.db import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, TokenResponse
from app.schemas.common import DataResponse
from app.services import auth as auth_service

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.post("/register", response_model=DataResponse[dict], status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.register_user(body.email, body.password, db)
    return DataResponse(data={"user_id": str(user.id), "email": user.email})


@router.post("/login", response_model=DataResponse[TokenResponse])
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    access, refresh = await auth_service.login_user(body.email, body.password, db)
    return DataResponse(data=TokenResponse(access_token=access, refresh_token=refresh))


@router.post("/refresh", response_model=DataResponse[TokenResponse])
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    access, refresh = await auth_service.refresh_tokens(body.refresh_token, db)
    return DataResponse(data=TokenResponse(access_token=access, refresh_token=refresh))


@router.post("/logout", response_model=DataResponse[dict])
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.logout_user(body.refresh_token, db)
    return DataResponse(data={"message": "Logged out"})
