intent_id: bank-account-stock-platform
version: 1.1.0
owner: Mark Kendall
maturity: Structured (Level 3)
description: Secure full-stack banking-style system with account management, balances, overdraft workflows, and stock watchlist/ticker.

---

## 1. INTENT

Build a secure, deterministic system where:

- Users authenticate via short-lived JWT access tokens + refresh tokens
- Users create and manage customer profiles
- Users create bank accounts (CHECKING, SAVINGS, MONEY_MARKET)
- Balances are computed server-side only
- Users request overdraft limit increases via a tracked workflow
- Users manage a stock watchlist (max 10 symbols)
- Header displays a live stock ticker (backend-proxied)
- Dashboard shows stock tip of the day
- UI uses left sidebar + smart navigation with onboarding gate

---

## 2. EXECUTION BOUNDARIES

Must NOT:

- Compute balances on the frontend
- Expose any external API keys to the client
- Store plaintext passwords
- Store full SSN (last 4 digits only)
- Place business logic in React components
- Use untyped or implicit fields
- Duplicate data across tables (3NF)
- Use magic values (all enums defined in DB or Pydantic)
- Bypass Pydantic validation at any API boundary
- Return undeclared fields in responses

---

## 3. EXECUTION STACK

**Frontend**
- React 18, TypeScript (strict mode), Tailwind CSS
- React Query for all server state (no local cache of server data)
- Axios with interceptor for silent token refresh
- `VITE_API_URL` for backend base URL (no other env vars exposed to client)

**Backend**
- FastAPI (async throughout), Python 3.11+
- Pydantic v2 for input validation and output serialization
- Pydantic `BaseSettings` for all configuration (loaded from environment)
- SQLAlchemy 2.x (async) + asyncpg driver
- Alembic for schema migrations
- bcrypt (cost factor ≥ 12) for password hashing
- slowapi for rate limiting
- Structured JSON logging (include `request_id` in every log line)

**Database**
- PostgreSQL 15+
- All primary keys: UUID (`gen_random_uuid()`)
- All mutable tables include `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ`
- Foreign keys enforced; cascades defined explicitly
- Indexes on all FK columns and frequent query paths

---

## 4. API CONTRACT

All endpoints versioned under `/v1/`. All responses use the envelope below.

### Response Envelope

Success:
```json
{ "data": { ... }, "request_id": "uuid" }
```

Error:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] }, "request_id": "uuid" }
```

`request_id` is echoed from the `X-Request-ID` request header, or generated server-side if absent.

### Endpoints

```
POST   /v1/auth/register
POST   /v1/auth/login
POST   /v1/auth/refresh
POST   /v1/auth/logout

POST   /v1/profile
GET    /v1/profile

POST   /v1/accounts
GET    /v1/accounts?page=1&page_size=20

GET    /v1/accounts/{id}/balance

POST   /v1/accounts/{id}/overdraft-request
GET    /v1/accounts/{id}/overdraft-request

GET    /v1/stocks/quotes
POST   /v1/stocks/watchlist
DELETE /v1/stocks/watchlist/{symbol}

GET    /v1/stocks/tip-of-the-day

GET    /v1/health
```

Paginated list endpoints return:
```json
{ "data": { "items": [...], "total": 0, "page": 1, "page_size": 20 }, "request_id": "uuid" }
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error |
| 401 | Missing or invalid token |
| 403 | Valid token, insufficient permission |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 429 | Rate limit exceeded |
| 500 | Server error (logged with request_id) |

---

## 5. INPUT CONTRACTS

### Auth — Register / Login
```json
{
  "email": "string (valid email, normalized to lowercase)",
  "password": "string (min 8 chars, at least 1 digit, 1 uppercase)"
}
```

### Auth — Refresh
```json
{ "refresh_token": "string" }
```

### Profile
```json
{
  "first_name": "string (1–50 chars)",
  "last_name": "string (1–50 chars)",
  "phone": "string (E.164 format)",
  "date_of_birth": "YYYY-MM-DD",
  "tax_id_last4": "string (exactly 4 digits)",
  "address": {
    "line1": "string",
    "city": "string",
    "state": "string (2-letter code)",
    "postal_code": "string",
    "country": "string (ISO 3166-1 alpha-2)"
  }
}
```

### Account Creation
```json
{
  "account_type": "CHECKING | SAVINGS | MONEY_MARKET",
  "initial_deposit": "number >= 0"
}
```

### Overdraft Request
```json
{
  "requested_limit": "number > 0",
  "reason": "string (10–500 chars)",
  "monthly_income": "number >= 0",
  "employment_status": "EMPLOYED | SELF_EMPLOYED | UNEMPLOYED",
  "consent": true
}
```

### Stock Watchlist
```json
{ "symbol": "string (1–10 uppercase chars)" }
```

---

## 6. OUTPUT CONTRACTS

### Auth — Login / Refresh
```json
{
  "access_token": "string (JWT, 15min expiry)",
  "refresh_token": "string (opaque, 7-day expiry)",
  "token_type": "bearer"
}
```

### Account
```json
{
  "account_id": "uuid",
  "account_number": "string",
  "type": "CHECKING | SAVINGS | MONEY_MARKET",
  "status": "PENDING | ACTIVE | REJECTED",
  "created_at": "ISO8601"
}
```

### Balance
```json
{
  "current_balance": "number",
  "available_balance": "number",
  "pending_deposits": "number",
  "pending_withdrawals": "number",
  "overdraft_limit": "number",
  "available_overdraft": "number"
}
```

### Stock Quote
```json
{
  "symbol": "string",
  "price": "number",
  "change": "number",
  "percent_change": "number",
  "timestamp": "ISO8601",
  "cached": "boolean"
}
```

### Overdraft Request
```json
{
  "request_id": "uuid",
  "account_id": "uuid",
  "requested_limit": "number",
  "status": "PENDING | APPROVED | REJECTED",
  "submitted_at": "ISO8601"
}
```

---

## 7. DATABASE SCHEMA (3NF)

```
users(
  id UUID PK,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ
)

refresh_tokens(
  id UUID PK,
  user_id UUID FK→users NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
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
  tax_id_last4 CHAR(4) NOT NULL,
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
  code TEXT UNIQUE NOT NULL   -- CHECKING | SAVINGS | MONEY_MARKET
)

bank_accounts(
  id UUID PK,
  profile_id UUID FK→customer_profiles NOT NULL,
  account_type_id UUID FK→account_types NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  routing_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | ACTIVE | REJECTED
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
  employment_status TEXT NOT NULL,  -- EMPLOYED | SELF_EMPLOYED | UNEMPLOYED
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

stock_symbols(
  id UUID PK,
  symbol TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL
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
  risk_level TEXT NOT NULL,  -- LOW | MEDIUM | HIGH
  reasoning TEXT NOT NULL,
  disclaimer TEXT NOT NULL,
  effective_date DATE NOT NULL,
  UNIQUE(stock_symbol_id, effective_date)
)
```

**Required indexes (beyond PK/UNIQUE):**
- `refresh_tokens(user_id)`
- `bank_accounts(profile_id)`
- `overdraft_requests(account_id)`
- `user_watchlist(user_id)`

---

## 8. SECURITY

| Concern | Implementation |
|---|---|
| Passwords | bcrypt, cost factor ≥ 12 |
| Access tokens | JWT HS256, 15-minute expiry |
| Refresh tokens | Stored as bcrypt hash in `refresh_tokens` table; single-use rotation |
| Secrets | Loaded via `BaseSettings` from environment only |
| Input | Pydantic v2 with strict types at every boundary |
| Output | Explicit response models; no `model_config = {"extra": "allow"}` |
| CORS | Whitelist `ALLOWED_ORIGINS` env var; no wildcard in production |
| Rate limiting | `/v1/auth/*` → 5 req/min per IP; all other endpoints → 60 req/min per user |
| Stock API keys | Server-side only; never serialized into any response |

---

## 9. FAILURE HANDLING & RETRY

| Scenario | Behavior |
|---|---|
| Stock API failure | Serve cached quote; mark `"cached": true` in response |
| Stock API retry | 3 attempts with exponential backoff (0.5s, 1s, 2s) |
| DB write failure | Rollback transaction; return 500 with `request_id` |
| DB read failure | Return 500 with `request_id`; no retry |
| Auth endpoints | No retry; no token issued on failure |
| Refresh token reuse | Revoke entire token family; force re-login |

---

## 10. STOCK RULES

- Max 10 symbols per user (enforced in DB via count check before insert)
- All external stock API calls proxied through backend
- Quotes cached 30–60 seconds server-side
- Stock tip of the day resolved by `effective_date = today()` in DB

---

## 11. UI STRUCTURE

```
Layout:
  ┌─ Left Sidebar (persistent) ─┬─ Top Header (live ticker) ──┐
  │  Dashboard                  │ Main Content Area            │
  │  Profile                    │                              │
  │  Accounts                   │                              │
  │  Balances                   │                              │
  │  Overdraft Requests         │                              │
  │  Watchlist                  │                              │
  │  Stock Tip                  │                              │
  │  Settings                   │                              │
  │  Logout                     │                              │
  └─────────────────────────────┴──────────────────────────────┘
```

### Smart Navigation (onboarding gate)

```
not authenticated   → /login
no profile          → /profile/create
no active accounts  → /accounts/new
otherwise           → /dashboard
```

---

## 12. TESTING REQUIREMENTS

- Backend: pytest + httpx `AsyncClient` against a real test PostgreSQL DB (no mocks)
- Each test module uses a transaction that rolls back after each test
- Factory functions (not fixtures) for test entity creation
- Frontend: React Testing Library for component behavior; no snapshot tests
- All API contract endpoints must have at least one happy-path and one error-path test

---

## 13. DELIVERABLE STRUCTURE

```
/frontend
/backend
  /alembic            migrations
  /app
    /routers
    /models           SQLAlchemy ORM models
    /schemas          Pydantic request/response schemas
    /services         business logic layer
    /dependencies     FastAPI DI (db session, current user)
    /core             settings, security utilities
/docs
docker-compose.yml
.env.example
README.md
```

---

## 14. VALIDATION GATES

System is INVALID if:

- Any response deviates from declared schema
- Any table violates 3NF
- Business logic exists in the frontend
- Any secret is serialized into a response or logged
- API contract endpoint is missing or returns wrong status codes
- Watchlist exceeds 10 symbols per user
- Balance is computed outside the backend service layer
- A migration is missing for any schema change
- Refresh token reuse does not trigger full token family revocation
