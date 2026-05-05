from datetime import datetime, date
from pydantic import BaseModel, field_validator


class WatchlistAddRequest(BaseModel):
    symbol: str

    @field_validator("symbol")
    @classmethod
    def uppercase_symbol(cls, v: str) -> str:
        v = v.upper().strip()
        if not (1 <= len(v) <= 10):
            raise ValueError("Symbol must be 1–10 characters")
        return v


class StockQuote(BaseModel):
    symbol: str
    price: float
    change: float
    percent_change: float
    timestamp: datetime
    cached: bool = False


class StockTipResponse(BaseModel):
    symbol: str
    company_name: str
    tip_summary: str
    risk_level: str
    reasoning: str
    disclaimer: str
    effective_date: date
