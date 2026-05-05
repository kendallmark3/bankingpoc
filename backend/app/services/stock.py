import uuid
import random
from datetime import datetime, date, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.stock import StockSymbol, UserWatchlist, StockTip
from app.schemas.stock import StockQuote, StockTipResponse

# In-memory quote cache: symbol -> (quote, fetched_at)
_quote_cache: dict[str, tuple[StockQuote, datetime]] = {}
CACHE_TTL_SECONDS = 45

# Mock stock data for demo (replaces external API)
MOCK_STOCKS = {
    "AAPL": {"company": "Apple Inc.", "base": 189.5},
    "MSFT": {"company": "Microsoft Corp.", "base": 415.2},
    "GOOGL": {"company": "Alphabet Inc.", "base": 175.8},
    "AMZN": {"company": "Amazon.com Inc.", "base": 198.3},
    "NVDA": {"company": "NVIDIA Corp.", "base": 875.4},
    "TSLA": {"company": "Tesla Inc.", "base": 245.6},
    "META": {"company": "Meta Platforms Inc.", "base": 525.1},
    "JPM": {"company": "JPMorgan Chase & Co.", "base": 198.7},
    "BRK": {"company": "Berkshire Hathaway Inc.", "base": 410.0},
    "V": {"company": "Visa Inc.", "base": 278.5},
}


def _mock_quote(symbol: str) -> StockQuote:
    info = MOCK_STOCKS.get(symbol, {"company": symbol, "base": 100.0})
    change = round(random.uniform(-5.0, 5.0), 2)
    price = round(info["base"] + change, 2)
    pct = round((change / info["base"]) * 100, 2)
    return StockQuote(
        symbol=symbol,
        price=price,
        change=change,
        percent_change=pct,
        timestamp=datetime.now(timezone.utc),
        cached=False,
    )


async def get_quotes(symbols: list[str]) -> list[StockQuote]:
    now = datetime.now(timezone.utc)
    quotes = []
    for symbol in symbols:
        cached_entry = _quote_cache.get(symbol)
        if cached_entry and (now - cached_entry[1]).total_seconds() < CACHE_TTL_SECONDS:
            q = cached_entry[0].model_copy(update={"cached": True})
            quotes.append(q)
        else:
            q = _mock_quote(symbol)
            _quote_cache[symbol] = (q, now)
            quotes.append(q)
    return quotes


async def get_watchlist_symbols(user_id: uuid.UUID, db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(UserWatchlist)
        .options(selectinload(UserWatchlist.stock_symbol))
        .where(UserWatchlist.user_id == user_id)
    )
    return [row.stock_symbol.symbol for row in result.scalars()]


async def add_to_watchlist(user_id: uuid.UUID, symbol: str, db: AsyncSession) -> None:
    count_result = await db.execute(
        select(func.count()).select_from(UserWatchlist).where(UserWatchlist.user_id == user_id)
    )
    count = count_result.scalar()
    if count >= 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Watchlist limit of 10 symbols reached")

    sym_result = await db.execute(select(StockSymbol).where(StockSymbol.symbol == symbol))
    stock = sym_result.scalar_one_or_none()
    if not stock:
        mock = MOCK_STOCKS.get(symbol)
        company = mock["company"] if mock else symbol
        stock = StockSymbol(symbol=symbol, company_name=company)
        db.add(stock)
        await db.flush()

    existing = await db.execute(
        select(UserWatchlist).where(UserWatchlist.user_id == user_id, UserWatchlist.stock_symbol_id == stock.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Symbol already in watchlist")

    db.add(UserWatchlist(user_id=user_id, stock_symbol_id=stock.id))
    await db.commit()


async def remove_from_watchlist(user_id: uuid.UUID, symbol: str, db: AsyncSession) -> None:
    sym_result = await db.execute(select(StockSymbol).where(StockSymbol.symbol == symbol))
    stock = sym_result.scalar_one_or_none()
    if not stock:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Symbol not found")
    result = await db.execute(
        select(UserWatchlist).where(UserWatchlist.user_id == user_id, UserWatchlist.stock_symbol_id == stock.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Symbol not in watchlist")
    await db.delete(entry)
    await db.commit()


async def get_tip_of_day(db: AsyncSession) -> StockTipResponse:
    today = date.today()
    result = await db.execute(
        select(StockTip)
        .options(selectinload(StockTip.stock_symbol))
        .where(StockTip.effective_date == today)
        .limit(1)
    )
    tip = result.scalar_one_or_none()
    if not tip:
        # Return a default tip if none seeded for today
        return StockTipResponse(
            symbol="AAPL",
            company_name="Apple Inc.",
            tip_summary="Strong buy signal as tech sector shows resilience.",
            risk_level="MEDIUM",
            reasoning="Consistent revenue growth and expanding services segment offset hardware slowdown concerns.",
            disclaimer="This is not financial advice. Past performance does not guarantee future results.",
            effective_date=today,
        )
    return StockTipResponse(
        symbol=tip.stock_symbol.symbol,
        company_name=tip.stock_symbol.company_name,
        tip_summary=tip.tip_summary,
        risk_level=tip.risk_level,
        reasoning=tip.reasoning,
        disclaimer=tip.disclaimer,
        effective_date=tip.effective_date,
    )
