from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.auth import hash_password
from app.models import generate_account_number
from app.schemas import AccountCreate, UserRegister


# ── Users ──────────────────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, data: UserRegister) -> models.User:
    if get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = models.User(
        email=data.email,
        hashed_password=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    # Auto-create a checking account
    account = _make_account(db, user.id, models.AccountType.checking)
    db.add(account)
    db.commit()
    db.refresh(user)
    return user


# ── Accounts ───────────────────────────────────────────────────────────────────

def _make_account(db: Session, user_id, account_type: models.AccountType) -> models.Account:
    # Ensure unique account number
    while True:
        number = generate_account_number()
        if not db.query(models.Account).filter(models.Account.account_number == number).first():
            break
    return models.Account(user_id=user_id, account_type=account_type, account_number=number)


def get_accounts_for_user(db: Session, user_id) -> List[models.Account]:
    return db.query(models.Account).filter(models.Account.user_id == str(user_id)).all()


def get_account_by_id(db: Session, account_id) -> Optional[models.Account]:
    return db.query(models.Account).filter(models.Account.id == str(account_id)).first()


def get_account_by_number(db: Session, account_number: str) -> Optional[models.Account]:
    return db.query(models.Account).filter(models.Account.account_number == account_number).first()


def create_account(db: Session, user_id, data: AccountCreate) -> models.Account:
    account_type = models.AccountType[data.account_type.value]
    account = _make_account(db, user_id, account_type)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def deposit(db: Session, account: models.Account, amount: Decimal, description: str) -> models.Transaction:
    account.balance = Decimal(str(account.balance)) + amount
    tx = models.Transaction(
        account_id=account.id,
        transaction_type=models.TransactionType.deposit,
        amount=amount,
        description=description or "Deposit",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def withdraw(db: Session, account: models.Account, amount: Decimal, description: str) -> models.Transaction:
    if Decimal(str(account.balance)) < amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient funds")
    account.balance = Decimal(str(account.balance)) - amount
    tx = models.Transaction(
        account_id=account.id,
        transaction_type=models.TransactionType.withdrawal,
        amount=amount,
        description=description or "Withdrawal",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


# ── Transactions ───────────────────────────────────────────────────────────────

def get_transactions_for_user(db: Session, user_id) -> List[models.Transaction]:
    account_ids = [str(a.id) for a in get_accounts_for_user(db, user_id)]
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.account_id.in_(account_ids))
        .order_by(models.Transaction.created_at.desc())
        .all()
    )


def get_transactions_for_account(db: Session, account_id) -> List[models.Transaction]:
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.account_id == str(account_id))
        .order_by(models.Transaction.created_at.desc())
        .all()
    )


def transfer(
    db: Session,
    from_account: models.Account,
    to_account: models.Account,
    amount: Decimal,
    description: str,
):
    if Decimal(str(from_account.balance)) < amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient funds")

    from_account.balance = Decimal(str(from_account.balance)) - amount
    to_account.balance = Decimal(str(to_account.balance)) + amount

    desc_out = description or f"Transfer to {to_account.account_number}"
    desc_in = description or f"Transfer from {from_account.account_number}"

    tx_out = models.Transaction(
        account_id=from_account.id,
        related_account_id=to_account.id,
        transaction_type=models.TransactionType.transfer_out,
        amount=amount,
        description=desc_out,
    )
    tx_in = models.Transaction(
        account_id=to_account.id,
        related_account_id=from_account.id,
        transaction_type=models.TransactionType.transfer_in,
        amount=amount,
        description=desc_in,
    )
    db.add_all([tx_out, tx_in])
    db.commit()
    db.refresh(tx_out)
    return tx_out
