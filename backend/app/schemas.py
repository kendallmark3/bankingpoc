from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ── Enums ──────────────────────────────────────────────────────────────────────

class AccountTypeEnum(str, Enum):
    checking = "checking"
    savings = "savings"


class TransactionTypeEnum(str, Enum):
    deposit = "deposit"
    withdrawal = "withdrawal"
    transfer_in = "transfer_in"
    transfer_out = "transfer_out"


# ── Auth / User ────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    first_name: str
    last_name: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


# ── Accounts ───────────────────────────────────────────────────────────────────

class AccountCreate(BaseModel):
    account_type: AccountTypeEnum = AccountTypeEnum.checking


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    account_type: AccountTypeEnum
    balance: Decimal
    account_number: str
    created_at: datetime


class DepositWithdrawRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    description: Optional[str] = None


# ── Transactions ───────────────────────────────────────────────────────────────

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    account_id: UUID
    related_account_id: Optional[UUID]
    transaction_type: TransactionTypeEnum
    amount: Decimal
    description: Optional[str]
    created_at: datetime


class TransferRequest(BaseModel):
    from_account_id: UUID
    to_account_number: str = Field(min_length=10, max_length=10)
    amount: Decimal = Field(gt=0)
    description: Optional[str] = None
