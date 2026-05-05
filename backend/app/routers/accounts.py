import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.account import AccountCreateRequest, AccountResponse, BalanceResponse, OverdraftRequest, OverdraftResponse
from app.schemas.common import DataResponse, PaginatedData
from app.services import account as account_service

router = APIRouter(prefix="/v1/accounts", tags=["accounts"])


@router.post("", response_model=DataResponse[AccountResponse], status_code=201)
async def create_account(
    body: AccountCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await account_service.create_account(current_user.id, body, db)
    return DataResponse(data=AccountResponse(
        account_id=account.id,
        account_number=account.account_number,
        type=account.account_type.code,
        status=account.status,
        created_at=account.created_at,
    ))


@router.get("", response_model=DataResponse[PaginatedData[AccountResponse]])
async def list_accounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    accounts, total = await account_service.list_accounts(current_user.id, page, page_size, db)
    items = [AccountResponse(
        account_id=a.id,
        account_number=a.account_number,
        type=a.account_type.code,
        status=a.status,
        created_at=a.created_at,
    ) for a in accounts]
    return DataResponse(data=PaginatedData(items=items, total=total, page=page, page_size=page_size))


@router.get("/{account_id}/balance", response_model=DataResponse[BalanceResponse])
async def get_balance(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    balance = await account_service.get_balance(account_id, current_user.id, db)
    return DataResponse(data=BalanceResponse.model_validate(balance))


@router.post("/{account_id}/overdraft-request", response_model=DataResponse[OverdraftResponse], status_code=201)
async def submit_overdraft(
    account_id: uuid.UUID,
    body: OverdraftRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    req = await account_service.submit_overdraft(account_id, current_user.id, body, db)
    return DataResponse(data=OverdraftResponse(
        request_id=req.id,
        account_id=req.account_id,
        requested_limit=req.requested_limit,
        status=req.status,
        submitted_at=req.submitted_at,
    ))


@router.get("/{account_id}/overdraft-request", response_model=DataResponse[OverdraftResponse])
async def get_overdraft(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    req = await account_service.get_overdraft(account_id, current_user.id, db)
    return DataResponse(data=OverdraftResponse(
        request_id=req.id,
        account_id=req.account_id,
        requested_limit=req.requested_limit,
        status=req.status,
        submitted_at=req.submitted_at,
    ))
