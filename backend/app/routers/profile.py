from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.profile import ProfileRequest, ProfileResponse
from app.schemas.common import DataResponse
from app.services import profile as profile_service

router = APIRouter(prefix="/v1/profile", tags=["profile"])


@router.post("", response_model=DataResponse[ProfileResponse], status_code=201)
async def create_profile(
    body: ProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await profile_service.create_profile(current_user.id, body, db)
    return DataResponse(data=ProfileResponse(
        first_name=profile.first_name,
        last_name=profile.last_name,
        phone=profile.phone,
        date_of_birth=profile.dob,
        tax_id_last4=profile.tax_id_last4,
        address=profile.address,
    ))


@router.get("", response_model=DataResponse[ProfileResponse])
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await profile_service.get_profile(current_user.id, db)
    return DataResponse(data=ProfileResponse(
        first_name=profile.first_name,
        last_name=profile.last_name,
        phone=profile.phone,
        date_of_birth=profile.dob,
        tax_id_last4=profile.tax_id_last4,
        address=profile.address,
    ))
