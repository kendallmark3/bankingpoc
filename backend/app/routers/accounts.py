from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import (
    AccountCreate,
    AccountResponse,
    DepositWithdrawRequest,
    TransactionResponse,
)

router = APIRouter()


def _owned_account(account_id: UUID, db: Session, current_user: User):
    account = crud.get_account_by_id(db, account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    if str(account.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your account")
    return account


@router.get("", response_model=List[AccountResponse])
def list_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_accounts_for_user(db, current_user.id)


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_account(db, current_user.id, data)


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _owned_account(account_id, db, current_user)


@router.post("/{account_id}/deposit", response_model=TransactionResponse)
def deposit(
    account_id: UUID,
    body: DepositWithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _owned_account(account_id, db, current_user)
    return crud.deposit(db, account, body.amount, body.description or "Deposit")


@router.post("/{account_id}/withdraw", response_model=TransactionResponse)
def withdraw(
    account_id: UUID,
    body: DepositWithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = _owned_account(account_id, db, current_user)
    return crud.withdraw(db, account, body.amount, body.description or "Withdrawal")
