import uuid
import random
import string
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, Numeric, DateTime, ForeignKey, Enum, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class AccountType(PyEnum):
    checking = "checking"
    savings = "savings"


class TransactionType(PyEnum):
    deposit = "deposit"
    withdrawal = "withdrawal"
    transfer_in = "transfer_in"
    transfer_out = "transfer_out"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    accounts = relationship("Account", back_populates="owner", cascade="all, delete-orphan")


def generate_account_number() -> str:
    return "".join(random.choices(string.digits, k=10))


class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    account_type = Column(Enum(AccountType), nullable=False, default=AccountType.checking)
    balance = Column(Numeric(15, 2), nullable=False, default=0)
    account_number = Column(String(10), unique=True, nullable=False, default=generate_account_number)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="accounts")
    transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.account_id",
        back_populates="account",
        cascade="all, delete-orphan",
    )
    related_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.related_account_id",
        back_populates="related_account",
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    related_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=True)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    account = relationship("Account", foreign_keys=[account_id], back_populates="transactions")
    related_account = relationship("Account", foreign_keys=[related_account_id], back_populates="related_transactions")
