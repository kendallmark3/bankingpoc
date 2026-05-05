import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, field_validator
from typing import Literal


class AccountCreateRequest(BaseModel):
    account_type: Literal["CHECKING", "SAVINGS", "MONEY_MARKET"]
    initial_deposit: Decimal = Decimal("0.00")

    @field_validator("initial_deposit")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Initial deposit must be >= 0")
        return v


class AccountResponse(BaseModel):
    account_id: uuid.UUID
    account_number: str
    type: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BalanceResponse(BaseModel):
    current_balance: Decimal
    available_balance: Decimal
    pending_deposits: Decimal
    pending_withdrawals: Decimal
    overdraft_limit: Decimal
    available_overdraft: Decimal

    model_config = {"from_attributes": True}


class OverdraftRequest(BaseModel):
    requested_limit: Decimal
    reason: str
    monthly_income: Decimal
    employment_status: Literal["EMPLOYED", "SELF_EMPLOYED", "UNEMPLOYED"]
    consent: Literal[True]

    @field_validator("requested_limit")
    @classmethod
    def positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Requested limit must be > 0")
        return v

    @field_validator("reason")
    @classmethod
    def reason_length(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("Reason must be at least 10 characters")
        return v


class OverdraftResponse(BaseModel):
    request_id: uuid.UUID
    account_id: uuid.UUID
    requested_limit: Decimal
    status: str
    submitted_at: datetime

    model_config = {"from_attributes": True}
