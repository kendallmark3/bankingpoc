import uuid
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User, RefreshToken
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings


async def register_user(email: str, password: str, db: AsyncSession) -> User:
    existing = await db.execute(select(User).where(User.email == email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=email.lower(), password_hash=hash_password(password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login_user(email: str, password: str, db: AsyncSession) -> tuple[str, str]:
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return await _issue_tokens(user, db)


async def refresh_tokens(raw_token: str, db: AsyncSession) -> tuple[str, str]:
    hashed = _hash_token(raw_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == hashed))
    stored = result.scalar_one_or_none()
    if not stored or stored.revoked or stored.expires_at < datetime.now(timezone.utc):
        # Revoke all tokens for this user if token reuse detected
        if stored and not stored.revoked:
            await _revoke_all_user_tokens(stored.user_id, db)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    stored.revoked = True
    await db.commit()
    result2 = await db.execute(select(User).where(User.id == stored.user_id))
    user = result2.scalar_one()
    return await _issue_tokens(user, db)


async def logout_user(raw_token: str, db: AsyncSession) -> None:
    hashed = _hash_token(raw_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == hashed))
    stored = result.scalar_one_or_none()
    if stored:
        stored.revoked = True
        await db.commit()


async def _issue_tokens(user: User, db: AsyncSession) -> tuple[str, str]:
    access_token = create_access_token(str(user.id))
    raw_refresh = secrets.token_urlsafe(48)
    hashed = _hash_token(raw_refresh)
    expires = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(user_id=user.id, token_hash=hashed, expires_at=expires))
    await db.commit()
    return access_token, raw_refresh


async def _revoke_all_user_tokens(user_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked == False))  # noqa: E712
    for token in result.scalars():
        token.revoked = True
    await db.commit()


def _hash_token(raw: str) -> str:
    import hashlib
    return hashlib.sha256(raw.encode()).hexdigest()
