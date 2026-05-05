# Bank of Intent (BOfI)

A secure, full-stack banking simulation platform — account management, server-side balance computation, overdraft request workflow, stock watchlist with live ticker, and stock tip of the day.

**Status:** Fully running. Backend on port 8000, frontend on port 5173.

---

## Features

- JWT authentication with opaque refresh tokens and silent token rotation
- Customer profile creation and view (personal info + address)
- Bank accounts: Checking, Savings, Money Market — with initial deposit
- Server-side balance computation across 6 metrics (no balance logic in the frontend)
- Overdraft limit request workflow (submit + status view)
- Stock watchlist: add/remove up to 10 symbols per user, server-enforced
- Live stock ticker in the header, polling every 45 seconds
- Stock tip of the day (served from DB keyed by date)
- Full-screen professional UI — left sidebar, dark navy/gold theme, BOfI SVG logo

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + TypeScript | React 19.2.5, TS 6.0.2 |
| Build | Vite | 8.0.10 |
| Routing | React Router DOM | 7.14.2 |
| HTTP client | Axios | 1.16.0 |
| Backend | FastAPI | 0.115.0 |
| Runtime | Python | 3.14.4 |
| ORM | SQLAlchemy (async) | 2.0.35 |
| Migrations | Alembic | 1.13.3 |
| Validation | Pydantic v2 | 2.9.2 |
| Database | PostgreSQL | 15+ (local) |
| Auth | bcrypt + JWT (HS256) | passlib 1.7.4, python-jose 3.3.0 |

---

## Local Development

### Prerequisites

- Python 3.11+ (3.14 recommended)
- Node.js 20+
- PostgreSQL 15+ running locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install "bcrypt<4"          # must stay pinned — bcrypt 4.x breaks passlib on Python 3.14
pip install "pydantic[email]" greenlet psycopg2-binary email-validator

# Create the database and run migrations
createdb bofi_db
alembic upgrade head

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Vite proxies all `/v1/*` requests to `http://localhost:8000` automatically.

### Run Tests

```bash
cd backend
source .venv/bin/activate
createdb bofi_test    # one-time setup
python -m pytest tests/ -v
```

8 tests covering auth happy paths and error cases against a real `bofi_test` PostgreSQL database (no mocks).

---

## Environment Variables

No `.env` file is required for local development — all defaults in `backend/app/core/config.py` work out of the box.

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://markkendall@localhost/bofi_db` | Override for production |
| `DATABASE_URL_SYNC` | `postgresql://markkendall@localhost/bofi_db` | Used by Alembic |
| `JWT_SECRET` | `change-me-in-production-use-32-char-secret` | **Must override in production** |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | |
| `BCRYPT_ROUNDS` | `12` | |
| `ALLOWED_ORIGINS` | `["http://localhost:5173"]` | Add production domain |
| `STOCK_CACHE_TTL` | `45` | Seconds; quotes are mocked, no external API needed |

---

## API Reference

All endpoints are versioned under `/v1/`. All responses use the envelope:
- Success: `{ "data": {...}, "request_id": "<uuid>" }`
- Error: `{ "error": {...}, "request_id": "<uuid>" }`

Protected endpoints require `Authorization: Bearer <access_token>`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/register` | — | Register (email + password) |
| POST | `/v1/auth/login` | — | Login → access token + refresh token |
| POST | `/v1/auth/refresh` | — | Rotate refresh token (single-use) |
| POST | `/v1/auth/logout` | ✓ | Revoke refresh token server-side |
| POST | `/v1/profile` | ✓ | Create customer profile |
| GET | `/v1/profile` | ✓ | Get current user's profile |
| POST | `/v1/accounts` | ✓ | Open an account with optional initial deposit |
| GET | `/v1/accounts` | ✓ | List all accounts (paginated) |
| GET | `/v1/accounts/{id}/balance` | ✓ | Get 6-metric balance view |
| POST | `/v1/accounts/{id}/overdraft-request` | ✓ | Submit overdraft limit request |
| GET | `/v1/accounts/{id}/overdraft-request` | ✓ | Get overdraft request status |
| GET | `/v1/stocks/quotes` | ✓ | Get quotes for watchlist symbols |
| POST | `/v1/stocks/watchlist` | ✓ | Add symbol (max 10 per user) |
| DELETE | `/v1/stocks/watchlist/{symbol}` | ✓ | Remove symbol |
| GET | `/v1/stocks/tip-of-the-day` | ✓ | Get today's stock tip |
| GET | `/v1/health` | — | Health check |

---

## Database Schema

11 tables (+ `alembic_version`), normalized to 3NF. All PKs are UUID. All monetary values are `NUMERIC(18,2)`.

```
users                  — credentials (email, bcrypt password hash)
refresh_tokens         — opaque tokens stored as SHA-256 hex digests; single-use rotation
customer_profiles      — personal info linked 1:1 to users
addresses              — address linked 1:1 to profiles
account_types          — enum seed table: CHECKING | SAVINGS | MONEY_MARKET
bank_accounts          — account records with status: ACTIVE | PENDING | REJECTED
account_balances       — 6-metric balance row linked 1:1 to each account
overdraft_requests     — per-account overdraft workflow: PENDING | APPROVED | REJECTED
stock_symbols          — 10 built-in mock symbols (AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, JPM, BRK, V)
user_watchlist         — user↔symbol join table (max 10, enforced server-side)
stock_tips             — daily tips keyed by effective_date
```

---

## User Flow

```
Register → Login → Create Profile → Open Account → Dashboard
```

Smart navigation enforces this order on the frontend. Unauthenticated users are redirected to `/login` via `PrivateRoute`.

---

## Security

- Passwords hashed with bcrypt (cost 12); plaintext never stored or logged
- Refresh tokens: opaque, stored as SHA-256 hex digest in DB; single-use rotation with family revocation on reuse detection
- Access tokens: JWT HS256, 15-minute expiry; silent refresh via Axios interceptor
- Only last 4 digits of SSN/Tax ID stored — full SSN never accepted
- All stock quotes served from backend mock — no external API keys required or exposed
- All inputs validated by Pydantic at the API boundary; all outputs serialized through declared response schemas
- Secrets loaded from environment variables only; defaults are safe for local dev only

---

## Known Constraints

| Constraint | Detail |
|---|---|
| `bcrypt<4` must stay pinned | bcrypt 4.x raises `ValueError` on passlib's detect_wrap_bug test under Python 3.14 |
| No Docker Compose | Runs against a local PostgreSQL instance; Docker Compose is a deferred item |
| Mock stock data | 10 hardcoded symbols with random ±5% price simulation; no real API wired |
| React Query installed, not used | `@tanstack/react-query` is installed; migration deferred |
| Inline styles | Pages use `style={{}}` objects; Tailwind v4 had purging issues with dynamic class strings |

---

## Project Structure

```
/backend
  /alembic           — migration scripts
  /app
    /core            — settings (BaseSettings), security utils
    /dependencies    — FastAPI DI: db session, current_user
    /models          — SQLAlchemy ORM models
    /routers         — thin route handlers
    /schemas         — Pydantic request/response schemas
    /services        — all business logic (no logic in routers or frontend)
  /tests             — pytest async integration tests
  requirements.txt
  pytest.ini

/frontend
  /public            — static assets (favicon, icons)
  /src
    /api             — Axios API modules (auth, profile, accounts, stocks)
    /assets/images   — BOfI SVG logo + React component
    /components      — Layout (sidebar + header), StockTicker
    /context         — AuthContext (token state + login/logout)
    /pages           — 10 page components
  index.html
  vite.config.ts

/intents
  intent.md          — system specification (source of truth)
  /revisions
    baseline.md      — v2.0.0 baseline: exact implemented state + deferred features
```
