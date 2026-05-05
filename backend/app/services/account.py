import uuid
import random
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.account import AccountType, BankAccount, AccountBalance, OverdraftRequest
from app.models.profile import CustomerProfile
from app.schemas.account import AccountCreateRequest, OverdraftRequest as OverdraftReqSchema


async def create_account(user_id: uuid.UUID, data: AccountCreateRequest, db: AsyncSession) -> BankAccount:
    profile_result = await db.execute(select(CustomerProfile).where(CustomerProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    type_result = await db.execute(select(AccountType).where(AccountType.code == data.account_type))
    account_type = type_result.scalar_one_or_none()
    if not account_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid account type")

    account_number = _generate_account_number()
    account = BankAccount(
        profile_id=profile.id,
        account_type_id=account_type.id,
        account_number=account_number,
        status="ACTIVE",
    )
    db.add(account)
    await db.flush()

    balance = AccountBalance(
        account_id=account.id,
        current_balance=data.initial_deposit,
        available_balance=data.initial_deposit,
    )
    db.add(balance)
    await db.commit()
    await db.refresh(account)
    return await _load_account(account.id, db)


async def list_accounts(user_id: uuid.UUID, page: int, page_size: int, db: AsyncSession) -> tuple[list[BankAccount], int]:
    profile_result = await db.execute(select(CustomerProfile).where(CustomerProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        return [], 0

    result = await db.execute(
        select(BankAccount)
        .options(selectinload(BankAccount.account_type))
        .where(BankAccount.profile_id == profile.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    accounts = list(result.scalars().all())

    count_result = await db.execute(select(BankAccount).where(BankAccount.profile_id == profile.id))
    total = len(list(count_result.scalars().all()))
    return accounts, total


async def get_balance(account_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> AccountBalance:
    account = await _get_user_account(account_id, user_id, db)
    result = await db.execute(select(AccountBalance).where(AccountBalance.account_id == account.id))
    balance = result.scalar_one_or_none()
    if not balance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Balance not found")
    return balance


async def submit_overdraft(account_id: uuid.UUID, user_id: uuid.UUID, data: OverdraftReqSchema, db: AsyncSession) -> OverdraftRequest:
    account = await _get_user_account(account_id, user_id, db)
    req = OverdraftRequest(
        account_id=account.id,
        requested_limit=data.requested_limit,
        reason=data.reason,
        monthly_income=data.monthly_income,
        employment_status=data.employment_status,
        status="PENDING",
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return req


async def get_overdraft(account_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> OverdraftRequest:
    account = await _get_user_account(account_id, user_id, db)
    result = await db.execute(
        select(OverdraftRequest)
        .where(OverdraftRequest.account_id == account.id)
        .order_by(OverdraftRequest.submitted_at.desc())
    )
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No overdraft request found")
    return req


async def _get_user_account(account_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> BankAccount:
    profile_result = await db.execute(select(CustomerProfile).where(CustomerProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    result = await db.execute(
        select(BankAccount).where(BankAccount.id == account_id, BankAccount.profile_id == profile.id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


async def _load_account(account_id: uuid.UUID, db: AsyncSession) -> BankAccount:
    result = await db.execute(
        select(BankAccount)
        .options(selectinload(BankAccount.account_type))
        .where(BankAccount.id == account_id)
    )
    return result.scalar_one()


def _generate_account_number() -> str:
    return str(random.randint(1000000000, 9999999999))
