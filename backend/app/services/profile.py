import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.profile import CustomerProfile, Address
from app.schemas.profile import ProfileRequest


async def create_profile(user_id: uuid.UUID, data: ProfileRequest, db: AsyncSession) -> CustomerProfile:
    existing = await db.execute(select(CustomerProfile).where(CustomerProfile.user_id == user_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")
    profile = CustomerProfile(
        user_id=user_id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        dob=data.date_of_birth,
        tax_id_last4=data.tax_id_last4,
    )
    db.add(profile)
    await db.flush()
    address = Address(
        profile_id=profile.id,
        line1=data.address.line1,
        city=data.address.city,
        state=data.address.state,
        postal_code=data.address.postal_code,
        country=data.address.country,
    )
    db.add(address)
    await db.commit()
    await db.refresh(profile)
    return await get_profile(user_id, db)


async def get_profile(user_id: uuid.UUID, db: AsyncSession) -> CustomerProfile:
    result = await db.execute(
        select(CustomerProfile)
        .options(selectinload(CustomerProfile.address))
        .where(CustomerProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile
