# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Banking POC — a secure full-stack banking simulation platform. The authoritative specification is `intents/intent.md`. No interpretation outside that file's defined inputs, outputs, and constraints.

## Tech Stack

**Frontend:** React 18, TypeScript (strict), Tailwind CSS — React Query for server state, Axios with token-refresh interceptor  
**Backend:** FastAPI (async), Pydantic v2, SQLAlchemy 2.x + asyncpg, Alembic migrations, slowapi rate limiting  
**Database:** PostgreSQL 15+, strict 3NF, UUID PKs, FK enforced, indexed  
**Infrastructure:** Docker Compose, env-based config via Pydantic `BaseSettings`

## Planned Directory Structure

```
/frontend       React + TypeScript + Tailwind
/backend        FastAPI application
/docs           Documentation
docker-compose.yml
.env.example
```

## Development Commands

Once implemented, the expected commands are:

```bash
# Start all services
docker compose up

# Backend only (from /backend)
uvicorn main:app --reload

# Frontend only (from /frontend)
npm run dev

# Run backend tests
pytest

# Type-check frontend
npx tsc --noEmit

# Lint frontend
npm run lint
```

## Architecture

### Backend Structure
All business logic lives exclusively in the FastAPI backend. Pydantic enforces input validation and output schema at every endpoint. Balance computation must never happen on the client.

### API Endpoints

All endpoints versioned under `/v1/`. All responses use `{ "data": {...}, "request_id": "uuid" }` (errors use `{ "error": {...}, "request_id": "uuid" }`).

```
POST   /v1/auth/register       POST /v1/auth/login
POST   /v1/auth/refresh        POST /v1/auth/logout
POST   /v1/profile             GET  /v1/profile
POST   /v1/accounts            GET  /v1/accounts?page=1&page_size=20
GET    /v1/accounts/{id}/balance
POST   /v1/accounts/{id}/overdraft-request
GET    /v1/accounts/{id}/overdraft-request
GET    /v1/stocks/quotes
POST   /v1/stocks/watchlist    DELETE /v1/stocks/watchlist/{symbol}
GET    /v1/stocks/tip-of-the-day
GET    /v1/health
```

### Database Schema (3NF — 11 tables)
```
users(id, email UNIQUE, password_hash, created_at)
refresh_tokens(id, user_id FK, token_hash UNIQUE, expires_at, revoked, created_at)
customer_profiles(id, user_id FK UNIQUE, first_name, last_name, phone, dob, tax_id_last4, created_at, updated_at)
addresses(id, profile_id FK UNIQUE, line1, city, state, postal_code, country)
account_types(id, code UNIQUE)  -- CHECKING | SAVINGS | MONEY_MARKET
bank_accounts(id, profile_id FK, account_type_id FK, account_number UNIQUE, routing_number, status, created_at, updated_at)
account_balances(id, account_id FK UNIQUE, current_balance, available_balance,
                 pending_deposits, pending_withdrawals, overdraft_limit, available_overdraft, updated_at)
overdraft_requests(id, account_id FK, requested_limit, reason, monthly_income, employment_status,
                   status, submitted_at, updated_at)
stock_symbols(id, symbol UNIQUE, company_name)
user_watchlist(id, user_id FK, stock_symbol_id FK, added_at, UNIQUE(user_id, stock_symbol_id))
stock_tips(id, stock_symbol_id FK, tip_summary, risk_level, reasoning, disclaimer, effective_date,
           UNIQUE(stock_symbol_id, effective_date))
```

All PKs are UUID. All monetary columns are `NUMERIC(18,2)`.

### Frontend UI Structure
- **Layout:** Left sidebar (persistent) + top header (live stock ticker) + main content
- **Sidebar links:** Dashboard, Profile, Accounts, Balances, Overdraft Requests, Watchlist, Stock Tip, Settings, Logout
- **Smart navigation:**
  - Not authenticated → `/login`
  - No profile → `/profile`
  - No accounts → `/create-account`
  - Otherwise → `/dashboard`

## Key Constraints

### Hard Rules (system is invalid if violated)
- No balance computation on the frontend
- No business logic in React components
- No API keys or secrets in any response or log
- No plaintext passwords (bcrypt cost ≥ 12)
- No full SSN storage (last 4 digits only)
- All API responses must match declared Pydantic schemas exactly
- All DB tables must pass 3NF; all monetary values `NUMERIC(18,2)`
- Watchlist capped at 10 symbols per user (enforced server-side)
- Every schema change requires an Alembic migration
- Refresh token reuse must revoke the entire token family

### Auth Token Strategy
- Access tokens: JWT HS256, 15-minute expiry
- Refresh tokens: opaque, stored as bcrypt hash in DB, 7-day expiry, single-use rotation

### Rate Limiting
- `/v1/auth/*`: 5 requests/min per IP
- All other endpoints: 60 requests/min per authenticated user

### Stock API
- All external stock API calls proxied through backend only
- Retry 3x with exponential backoff (0.5s, 1s, 2s)
- Cache quotes 30–60 seconds; serve stale with `"cached": true` on failure

### Testing
- Backend tests use pytest + `AsyncClient` against a real test PostgreSQL DB
- Each test rolls back via transaction; no mocks for DB layer
- Every API endpoint needs at least one happy-path and one error-path test

## Enum Values

**Account types:** `CHECKING`, `SAVINGS`, `MONEY_MARKET`  
**Account status:** `PENDING`, `ACTIVE`, `REJECTED`  
**Overdraft status:** `PENDING`, `APPROVED`, `REJECTED`  
**Employment status:** `EMPLOYED`, `SELF_EMPLOYED`, `UNEMPLOYED`  
**Stock tip risk level:** `LOW`, `MEDIUM`, `HIGH`  
**Overdraft `consent` field must be `true`** to submit a request

## Backend Module Layout

```
/backend/app/
  /routers       FastAPI route handlers (thin — delegate to services)
  /models        SQLAlchemy ORM models
  /schemas       Pydantic request/response schemas
  /services      business logic layer (all domain rules live here)
  /dependencies  FastAPI DI: db session, current_user, rate limiter
  /core          settings (BaseSettings), security utils, logging config
/backend/alembic migrations
```
