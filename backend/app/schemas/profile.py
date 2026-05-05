from datetime import date
from pydantic import BaseModel, field_validator
import re


class AddressIn(BaseModel):
    line1: str
    city: str
    state: str
    postal_code: str
    country: str

    @field_validator("state")
    @classmethod
    def state_two_chars(cls, v: str) -> str:
        if len(v) != 2:
            raise ValueError("State must be a 2-letter code")
        return v.upper()

    @field_validator("country")
    @classmethod
    def country_two_chars(cls, v: str) -> str:
        if len(v) != 2:
            raise ValueError("Country must be ISO 3166-1 alpha-2")
        return v.upper()


class ProfileRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str
    date_of_birth: date
    tax_id_last4: str
    address: AddressIn

    @field_validator("tax_id_last4")
    @classmethod
    def four_digits(cls, v: str) -> str:
        if not re.fullmatch(r"\d{4}", v):
            raise ValueError("tax_id_last4 must be exactly 4 digits")
        return v


class AddressOut(BaseModel):
    line1: str
    city: str
    state: str
    postal_code: str
    country: str

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    first_name: str
    last_name: str
    phone: str
    date_of_birth: date
    tax_id_last4: str
    address: AddressOut | None

    model_config = {"from_attributes": True}
