from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.stock import WatchlistAddRequest, StockQuote, StockTipResponse
from app.schemas.common import DataResponse
from app.services import stock as stock_service

router = APIRouter(prefix="/v1/stocks", tags=["stocks"])


@router.get("/quotes", response_model=DataResponse[list[StockQuote]])
async def get_quotes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbols = await stock_service.get_watchlist_symbols(current_user.id, db)
    if not symbols:
        symbols = ["AAPL", "MSFT", "GOOGL"]
    quotes = await stock_service.get_quotes(symbols)
    return DataResponse(data=quotes)


@router.post("/watchlist", response_model=DataResponse[dict], status_code=201)
async def add_watchlist(
    body: WatchlistAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await stock_service.add_to_watchlist(current_user.id, body.symbol, db)
    return DataResponse(data={"message": f"{body.symbol} added to watchlist"})


@router.delete("/watchlist/{symbol}", response_model=DataResponse[dict])
async def remove_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await stock_service.remove_from_watchlist(current_user.id, symbol.upper(), db)
    return DataResponse(data={"message": f"{symbol.upper()} removed from watchlist"})


@router.get("/tip-of-the-day", response_model=DataResponse[StockTipResponse])
async def tip_of_day(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tip = await stock_service.get_tip_of_day(db)
    return DataResponse(data=tip)
