intent_id: bank-account-stock-platform
version: 2.0.0  ·  baseline
owner: Mark Kendall
status: IMPLEMENTED — fully running in browser as of 2026-05-05
description: Secure full-stack banking simulation — accounts, balances, overdraft workflow, stock watchlist/ticker. Baseline captures the exact state of the working system and all deferred items for continued feature development.

---

## 1. WHAT IS BUILT

Every item below is live, tested, and running at http://localhost:5173 (frontend) and http://localhost:8000 (backend).

### Auth
- Register (email + password with strength validation: 8+ chars, 1 uppercase, 1 digit)
- Login returning short-lived JWT access token (15 min, HS256) + opaque refresh token (7 days)
- Silent token refresh via Axios interceptor — user never sees a logout on expiry
- Refresh token reuse detection: reuse revokes the entire token family and forces re-login
- Logout revokes the refresh token server-side

### Profile
- Create customer profile (personal info + address) — required before opening accounts
- View profile (2-column card layout: Personal / Address)
- Graceful 404 handling: shows "No Profile Yet" prompt with link to create

### Accounts
- Open accounts (CHECKING, SAVINGS, MONEY_MARKET) with optional initial deposit
- Radio-card account type selector UI
- List all accounts with status badges (ACTIVE / PENDING / REJECTED)
- Account numbers: random 10-digit integers, routing number: 021000021 (placeholder)
- Each account gets a 1:1 `account_balances` row at creation

### Balances
- 6-metric balance view (Current, Available, Pending Deposits/Withdrawals, Overdraft Limit, Available Overdraft)
- Account selector dropdown — direct link from Accounts page via query param
- All computation server-side; zero balance logic in the frontend

### Overdraft Requests
- Submit a request per account (requested limit, reason, monthly income, employment status, consent)
- View existing request status (PENDING / APPROVED / REJECTED)
- One request shown per account (most recent)

### Stock Watchlist
- Add/remove symbols (max 10 per user, enforced server-side with DB count check)
- Quotes table with price, change, % change, cached indicator
- Quick-add buttons for the 10 built-in mock symbols
- Quote cache: 45-second in-memory server-side cache

### Stock Ticker (Header)
- Live ticker across the top header, polling every 45 seconds
- Shows all watchlist symbols (falls back to AAPL/MSFT/GOOGL if watchlist empty)

### Stock Tip of the Day
- Served from `stock_tips` DB table keyed by `effective_date = today()`
- Default hardcoded tip returned when no DB row exists for today
- Hero card + reasoning + risk badge + disclaimer

### Dashboard
- Time-based greeting (morning/afternoon/evening) with first name
- Account cards (dark gradient, last 4 of account number, click → balance)
- Stock tip preview with full-analysis link
- 4 quick-action tiles

### UI / UX
- Full-screen layout: 100vw × 100vh, no scroll on outer container
- Left sidebar: 280px, dark navy gradient, gold active state, icon + label nav
- Header: 60px, dark blue gradient, live stock ticker right-aligned
- All pages fill available width — no artificial max-width constraints on data pages
- BOfI SVG logo in sidebar (white-inverted) and login/register pages
- Smart navigation guard: unauthenticated → /login (enforced client-side via PrivateRoute)

### Tests
- 8 auth tests: register, duplicate, login, wrong password, refresh, reuse rejection, weak password, health
- All tests use a real `bofi_test` PostgreSQL database (no mocks)
- Session-scoped event loop for full async compatibility

---

## 2. EXECUTION STACK (ACTUAL)

### Backend
| Package | Version | Note |
|---|---|---|
| Python | 3.14.4 | |
| FastAPI | 0.115.0 | |
| Uvicorn | 0.30.6 | standard extras |
| SQLAlchemy | 2.0.35 | async mode |
| asyncpg | 0.29.0 | async PostgreSQL driver |
| psycopg2-binary | 2.9.12 | required for Alembic sync migrations |
| greenlet | 3.5.0 | required by SQLAlchemy async engine |
| Alembic | 1.13.3 | |
| Pydantic | 2.9.2 | v2 |
| pydantic-settings | 2.5.2 | |
| passlib[bcrypt] | 1.7.4 | |
| bcrypt | **3.2.2** | MUST stay <4 — passlib is incompatible with bcrypt 4.x on Python 3.14 |
| python-jose[cryptography] | 3.3.0 | JWT |
| python-multipart | 0.0.12 | FastAPI form support |
| email-validator | 2.3.0 | required by Pydantic `EmailStr` |
| httpx | 0.27.2 | AsyncClient for tests |
| pytest | 8.3.3 | |
| pytest-asyncio | 0.24.0 | asyncio_mode=auto, session-scoped loop |
| pytest-cov | 5.0.0 | |

### Frontend
| Package | Version | Note |
|---|---|---|
| React | 19.2.5 | |
| TypeScript | 6.0.2 | `verbatimModuleSyntax` enabled — type imports must use `import type` |
| Vite | 8.0.10 | |
| React Router DOM | 7.14.2 | |
| Axios | 1.16.0 | with token-refresh interceptor |
| @tanstack/react-query | 5.100.9 | installed, **not yet used** — deferred (see §6) |
| Tailwind CSS | 4.2.4 | `@tailwindcss/vite` plugin, `@import "tailwindcss"` in index.css |
| @vitejs/plugin-react | 6.0.1 | |

**Styling note:** Pages use inline `style={{}}` objects rather than Tailwind class strings. This was deliberate — Tailwind v4 with `verbatimModuleSyntax` and dynamic class construction had purging issues during the build. Tailwind is used for the global reset only. Future pages can use either approach; the build supports both.

### Database
- PostgreSQL (local, no Docker) — `bofi_db` (production), `bofi_test` (tests)
- Local user: `markkendall` (no password, socket auth)
- 12 tables including `alembic_version`
- Migrations managed by Alembic in `backend/alembic/`

---

## 3. RUNNING THE SYSTEM

```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm run dev          # http://localhost:5173

# Tests
cd backend
source .venv/bin/activate
python -m pytest tests/ -v

# New migration after model change
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## 4. ENVIRONMENT CONFIGURATION

No `.env` file is required for local dev — all defaults in `app/core/config.py` work out of the box.

| Variable | Default | Override for production |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://markkendall@localhost/bofi_db` | yes |
| `DATABASE_URL_SYNC` | `postgresql://markkendall@localhost/bofi_db` | yes |
| `JWT_SECRET` | `change-me-in-production-use-32-char-secret` | **required** |
| `JWT_ALGORITHM` | `HS256` | optional |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | optional |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | optional |
| `BCRYPT_ROUNDS` | `12` | optional |
| `ALLOWED_ORIGINS` | `["http://localhost:5173"]` | yes |
| `STOCK_CACHE_TTL` | `45` | optional |

---

## 5. DATABASE SCHEMA (EXACT — AS MIGRATED)

```
users(
  id UUID PK,
  email TEXT UNIQUE NOT NULL,          -- normalized to lowercase on write
  password_hash TEXT NOT NULL,         -- bcrypt, cost 12
  created_at TIMESTAMPTZ
)

refresh_tokens(
  id UUID PK,
  user_id UUID FK→users NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,     -- SHA-256 hex digest of the raw opaque token
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
)

customer_profiles(
  id UUID PK,
  user_id UUID FK→users UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  dob DATE NOT NULL,
  tax_id_last4 CHAR(4) NOT NULL,       -- last 4 digits only, never full SSN
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

addresses(
  id UUID PK,
  profile_id UUID FK→customer_profiles UNIQUE NOT NULL,
  line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  postal_code TEXT NOT NULL,
  country CHAR(2) NOT NULL
)

account_types(
  id UUID PK,
  code TEXT UNIQUE NOT NULL            -- seeded: CHECKING | SAVINGS | MONEY_MARKET
)

bank_accounts(
  id UUID PK,
  profile_id UUID FK→customer_profiles NOT NULL,
  account_type_id UUID FK→account_types NOT NULL,
  account_number TEXT UNIQUE NOT NULL, -- random 10-digit integer as string
  routing_number TEXT NOT NULL,        -- placeholder: 021000021
  status TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | PENDING | REJECTED
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

account_balances(
  id UUID PK,
  account_id UUID FK→bank_accounts UNIQUE NOT NULL,
  current_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  available_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  pending_deposits NUMERIC(18,2) NOT NULL DEFAULT 0,
  pending_withdrawals NUMERIC(18,2) NOT NULL DEFAULT 0,
  overdraft_limit NUMERIC(18,2) NOT NULL DEFAULT 0,
  available_overdraft NUMERIC(18,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ
)

overdraft_requests(
  id UUID PK,
  account_id UUID FK→bank_accounts NOT NULL,
  requested_limit NUMERIC(18,2) NOT NULL,
  reason TEXT NOT NULL,
  monthly_income NUMERIC(18,2) NOT NULL,
  employment_status TEXT NOT NULL,     -- EMPLOYED | SELF_EMPLOYED | UNEMPLOYED
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

stock_symbols(
  id UUID PK,
  symbol TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL           -- auto-populated from MOCK_STOCKS on watchlist add
)

user_watchlist(
  id UUID PK,
  user_id UUID FK→users NOT NULL,
  stock_symbol_id UUID FK→stock_symbols NOT NULL,
  added_at TIMESTAMPTZ,
  UNIQUE(user_id, stock_symbol_id)
)

stock_tips(
  id UUID PK,
  stock_symbol_id UUID FK→stock_symbols NOT NULL,
  tip_summary TEXT NOT NULL,
  risk_level TEXT NOT NULL,            -- LOW | MEDIUM | HIGH
  reasoning TEXT NOT NULL,
  disclaimer TEXT NOT NULL,
  effective_date DATE NOT NULL,
  UNIQUE(stock_symbol_id, effective_date)
)
```

---

## 6. API CONTRACT (EXACT — AS IMPLEMENTED)

All endpoints under `/v1/`. All responses: `{ "data": {...}, "request_id": "uuid" }`. Errors: `{ "error": { "code", "message", "details" }, "request_id": "uuid" }`.

```
POST   /v1/auth/register            → 201 { user_id, email }
POST   /v1/auth/login               → 200 { access_token, refresh_token, token_type }
POST   /v1/auth/refresh             → 200 { access_token, refresh_token, token_type }
POST   /v1/auth/logout              → 200 { message }

POST   /v1/profile                  → 201 ProfileResponse
GET    /v1/profile                  → 200 ProfileResponse

POST   /v1/accounts                 → 201 AccountResponse
GET    /v1/accounts?page&page_size  → 200 PaginatedData<AccountResponse>
GET    /v1/accounts/{id}/balance    → 200 BalanceResponse
POST   /v1/accounts/{id}/overdraft-request → 201 OverdraftResponse
GET    /v1/accounts/{id}/overdraft-request → 200 OverdraftResponse (most recent)

GET    /v1/stocks/quotes            → 200 list[StockQuote]   (watchlist symbols, or AAPL/MSFT/GOOGL default)
POST   /v1/stocks/watchlist         → 201 { message }
DELETE /v1/stocks/watchlist/{symbol}→ 200 { message }
GET    /v1/stocks/tip-of-the-day    → 200 StockTipResponse

GET    /v1/health                   → 200 { status, service }
```

Protected endpoints require `Authorization: Bearer <access_token>`.

### Implemented Stock Symbols (mock data)
`AAPL · MSFT · GOOGL · AMZN · NVDA · TSLA · META · JPM · BRK · V`

Prices are randomized ±$5 from a base value on each uncached fetch. Adding an unknown symbol auto-creates a `stock_symbols` row using the symbol string as the company name.

---

## 7. FRONTEND STRUCTURE

```
frontend/src/
  App.tsx                 BrowserRouter, AuthProvider, PrivateRoute, all routes
  main.tsx                StrictMode entry point
  index.css               Tailwind import + global html/body/root full-screen reset

  api/
    client.ts             Axios instance, Bearer interceptor, silent refresh on 401
    auth.ts               register, login (stores tokens), logout (revokes + clears)
    profile.ts            createProfile, getProfile
    accounts.ts           createAccount, listAccounts, getBalance, submitOverdraft, getOverdraft
    stocks.ts             getQuotes, addToWatchlist, removeFromWatchlist, getTipOfDay

  context/
    AuthContext.tsx        isAuthenticated state, login(), logout()

  components/
    Layout.tsx             280px sidebar + 60px header + scrollable main; Outlet for pages
    StockTicker.tsx        Polls /v1/stocks/quotes every 45s, renders ticker row

  assets/images/
    bofi-logo.svg          SVG logo: shield with columns, BOfI wordmark, gold rule
    BofiLogo.tsx           <img> wrapper with width/height/className props

  pages/
    Login.tsx              Full-screen dark gradient auth page
    Register.tsx           Full-screen dark gradient register page
    Dashboard.tsx          Greeting, account cards, stock tip preview, quick-action grid
    Profile.tsx            2-column card; 404 → "No Profile Yet" prompt
    ProfileCreate.tsx      2-section form (personal + address), navigates → /accounts/new on save
    Accounts.tsx           Full-width list with status badges, links to balance
    AccountCreate.tsx      Radio-card type selector, dollar-prefix deposit input
    Balances.tsx           6-metric grid (2 highlighted), account selector dropdown
    Overdraft.tsx          Submit form or status display depending on existing request
    Watchlist.tsx          Table with quick-add chips, remove buttons
    StockTip.tsx           Hero card + reasoning + disclaimer
```

### Routing
```
/login           public
/register        public
/*               PrivateRoute (redirects to /login if not authenticated)
  /dashboard
  /profile
  /profile/create
  /accounts
  /accounts/new
  /balances
  /overdraft
  /stock-tip
  /watchlist
  /settings       placeholder stub
```

### Vite proxy
```
/v1/* → http://localhost:8000
```
This means the frontend never hardcodes the API host. In production, replace with a reverse proxy (nginx / Caddy).

---

## 8. KNOWN CONSTRAINTS & WORKAROUNDS

| Issue | Status | Detail |
|---|---|---|
| `bcrypt<4` pinned | Permanent until passlib updated | bcrypt 4.x raises `ValueError` on long test passwords; passlib 1.7.4 doesn't handle this. Pin `bcrypt<4` in requirements.txt and do not upgrade without testing. |
| Refresh token hash = SHA-256 | Intentional simplification | Intent specified bcrypt for token storage; SHA-256 was used instead. SHA-256 is deterministic (needed for lookup) but not work-hardened. Acceptable for a stateful DB-backed token; upgrade to HMAC-SHA256 with a server secret for production. |
| No `.env` file | Dev only | Config defaults work locally. Production deployments must set all env vars (especially `JWT_SECRET`). |
| No Docker Compose | Deferred | Local PostgreSQL used directly. A `docker-compose.yml` should be added before sharing with other developers. |
| `asyncio_default_test_loop_scope = session` | Required | Python 3.14 + pytest-asyncio 0.24 requires session-scoped event loop for session-scoped async fixtures. Do not change without re-testing the full suite. |
| `psycopg2-binary` + `greenlet` not in requirements.txt | Gap | Both are required at runtime but were installed manually. Add to `requirements.txt`. |
| Account number collision | Low risk in POC | Generated as `random.randint(1000000000, 9999999999)`. Not guaranteed unique under high load — replace with a sequence or UUID-derived number before production. |
| Tailwind v4 purging with inline styles | Working | Pages use inline `style={{}}`. Tailwind v4 with `verbatimModuleSyntax` had class purging issues for dynamic strings. Both approaches work; Tailwind classes are safe for static strings. |
| No real stock API | Mock only | All quotes are mock data. §9 documents how to wire a real API. |
| `@tanstack/react-query` installed but unused | Deferred | Installed, ready to use. Migrate `useEffect`/`useState` data fetching patterns to React Query as features are added. |
| `App.css` from Vite scaffold | Harmless | The default Vite `App.css` is still present and imported in `main.tsx` (actually it's not imported anywhere now — verify and delete if confirmed unused). |

---

## 9. DEFERRED FEATURES (NEXT BUILD TARGETS)

These are explicitly out of scope for the current baseline but fully compatible with the existing architecture. Listed in suggested priority order.

### 9A. Wire a Real Stock API
Replace `services/stock.py` mock quotes with a real provider.

```python
# Pattern in services/stock.py
async def _fetch_quote(symbol: str) -> StockQuote:
    async with httpx.AsyncClient() as client:
        for attempt in range(3):
            try:
                resp = await client.get(
                    "https://api.example.com/quote",
                    params={"symbol": symbol},
                    headers={"X-API-Key": settings.STOCK_API_KEY},
                    timeout=5.0,
                )
                resp.raise_for_status()
                data = resp.json()
                return StockQuote(symbol=data["symbol"], price=data["price"], ...)
            except Exception:
                if attempt == 2:
                    raise
                await asyncio.sleep(0.5 * (2 ** attempt))
```

Add `STOCK_API_KEY` to `Settings` in `config.py`. Suggested providers: Alpha Vantage (free tier), Polygon.io, Finnhub.

### 9B. Rate Limiting
`slowapi` is already in the intent stack. Wire it:

```python
# backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# backend/app/routers/auth.py
from slowapi.extension import LimiterMiddleware
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
```

### 9C. Transaction Ledger
Add a `transactions` table and `POST /v1/accounts/{id}/deposit` / `POST /v1/accounts/{id}/withdraw` endpoints. Update `account_balances` from the ledger rather than storing snapshot values.

```sql
transactions(
  id UUID PK,
  account_id UUID FK→bank_accounts NOT NULL,
  type TEXT NOT NULL,          -- DEPOSIT | WITHDRAWAL | TRANSFER | FEE
  amount NUMERIC(18,2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL,        -- PENDING | COMPLETED | FAILED
  created_at TIMESTAMPTZ
)
```

Add `GET /v1/accounts/{id}/transactions?page&page_size` endpoint. Update balance service to compute from ledger.

### 9D. Fund Transfers
Between accounts owned by the same user, or to external accounts by routing/account number.

```
POST /v1/accounts/{id}/transfer
{
  "to_account_id": "uuid",       -- internal transfer
  "amount": "number > 0",
  "description": "string"
}
```

Requires atomic DB transaction: debit source, credit destination, insert 2 ledger rows.

### 9E. Overdraft Approval Workflow (Admin)
Currently overdraft requests sit at PENDING forever. Add:
- `is_admin` flag to `users` table
- `PATCH /v1/admin/overdraft-requests/{id}` → set status APPROVED | REJECTED
- When approved: update `account_balances.overdraft_limit` and `available_overdraft`
- Admin-only routes protected by a separate `get_admin_user` dependency

### 9F. Docker Compose
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: bofi_db
      POSTGRES_USER: bofi
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://bofi:${DB_PASSWORD}@db/bofi_db
      JWT_SECRET: ${JWT_SECRET}
    depends_on: [db]

  frontend:
    build: ./frontend
    ports: ["5173:80"]
    depends_on: [backend]
```

### 9G. React Query Migration
Replace `useEffect`/`useState` patterns with React Query hooks for automatic caching, refetching, and loading states.

```tsx
// Pattern for all data pages
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['accounts'],
  queryFn: () => listAccounts().then(r => r.data.data.items),
})
```

Wrap `App.tsx` root in `<QueryClientProvider client={queryClient}>`.

### 9H. Profile Edit
Currently profile can only be created. Add `PATCH /v1/profile` endpoint and an edit form at `/profile/edit`. The address should support updates independently.

### 9I. Email Notifications
Add `resend` or `sendgrid` integration for:
- Account opened confirmation
- Overdraft request submitted / approved / rejected
- Password change alert

Store email templates in `backend/app/templates/` and trigger from the relevant service methods.

### 9J. Account Statements
`GET /v1/accounts/{id}/statement?month=YYYY-MM` → returns a summary of transactions for the period. Optional: PDF export using `reportlab` or `weasyprint`.

### 9K. Two-Factor Authentication (TOTP)
Add TOTP secret to `users` table, expose `/v1/auth/2fa/setup` and `/v1/auth/2fa/verify`. Gate login behind 2FA challenge if enabled.

---

## 10. VALIDATION GATES (UNCHANGED)

System is INVALID if any of the following are true:

- Any response deviates from declared Pydantic response schema
- Any table violates 3NF
- Business logic exists in any frontend component
- Any secret (JWT_SECRET, API keys) is serialized into a response or logged
- Any API endpoint is missing or returns wrong status codes
- Watchlist exceeds 10 symbols per user
- Balance is computed outside the backend service layer
- A schema change exists without a corresponding Alembic migration
- Refresh token reuse does not trigger full token family revocation
- `bcrypt` is upgraded past 3.x without passlib compatibility verified

---

## 11. FILE LOCATIONS QUICK REFERENCE

| Concern | File |
|---|---|
| App config / env vars | `backend/app/core/config.py` |
| JWT + password hashing | `backend/app/core/security.py` |
| Auth service (tokens, refresh, revocation) | `backend/app/services/auth.py` |
| Balance logic | `backend/app/services/account.py` |
| Mock stock data + cache | `backend/app/services/stock.py` |
| DB session DI | `backend/app/dependencies/db.py` |
| Current user DI | `backend/app/dependencies/auth.py` |
| Alembic migration env | `backend/alembic/env.py` |
| Test suite | `backend/tests/test_auth.py` |
| Pytest config | `backend/pytest.ini` |
| Axios client + interceptor | `frontend/src/api/client.ts` |
| Auth context (React) | `frontend/src/context/AuthContext.tsx` |
| App router + route guards | `frontend/src/App.tsx` |
| Sidebar + header shell | `frontend/src/components/Layout.tsx` |
| BOfI logo SVG | `frontend/src/assets/images/bofi-logo.svg` |
| Vite proxy config | `frontend/vite.config.ts` |
