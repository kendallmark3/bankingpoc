from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import TransactionResponse, TransferRequest

router = APIRouter()


@router.get("", response_model=List[TransactionResponse])
def list_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_transactions_for_user(db, current_user.id)


@router.get("/account/{account_id}", response_model=List[TransactionResponse])
def list_account_transactions(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = crud.get_account_by_id(db, account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    if str(account.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your account")
    return crud.get_transactions_for_account(db, account_id)


@router.post("/transfer", response_model=TransactionResponse)
def transfer(
    body: TransferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from_account = crud.get_account_by_id(db, body.from_account_id)
    if not from_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source account not found")
    if str(from_account.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your account")

    to_account = crud.get_account_by_number(db, body.to_account_number)
    if not to_account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination account not found")
    if str(from_account.id) == str(to_account.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot transfer to same account")

    return crud.transfer(db, from_account, to_account, body.amount, body.description or "")
