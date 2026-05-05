# Banking POC

A secure, full-stack banking simulation platform with account management, balance tracking, overdraft workflows, and a stock watchlist with live ticker.

## Features

- JWT-based authentication and registration
- Customer profile management
- Bank account creation (Checking, Savings, Money Market)
- Server-side balance computation
- Overdraft limit request workflow
- Stock watchlist (max 10 symbols per user)
- Live stock ticker in the header
- Stock tip of the day on the dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | FastAPI, Pydantic |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Infrastructure | Docker Compose |

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Run with Docker

```bash
cp .env.example .env
# Fill in required values in .env
docker compose up
```

App will be available at `http://localhost:3000` (frontend) and `http://localhost:8000` (backend API).

### Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.example` for all required variables. Required secrets:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret key for signing JWT tokens
- `STOCK_API_KEY` — External stock data provider API key (backend only, never exposed to client)

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |
| POST | `/profile` | Create customer profile |
| GET | `/profile` | Get current user's profile |
| POST | `/accounts` | Create a bank account |
| GET | `/accounts` | List user's accounts |
| GET | `/accounts/{id}/balance` | Get account balance |
| POST | `/accounts/{id}/overdraft-request` | Submit overdraft request |
| GET | `/accounts/{id}/overdraft-request` | Get overdraft request status |
| GET | `/stocks/quotes` | Get quotes for watchlist symbols |
| POST | `/stocks/watchlist` | Add symbol to watchlist |
| DELETE | `/stocks/watchlist/{symbol}` | Remove symbol from watchlist |
| GET | `/stocks/tip-of-the-day` | Get today's stock tip |

All protected endpoints require `Authorization: Bearer <token>` header.

## Database Schema

10 tables, normalized to 3NF:

```
users                  → authentication credentials
customer_profiles      → personal info (linked to users)
addresses              → address data (linked to profiles)
account_types          → enum table: CHECKING, SAVINGS, MONEY_MARKET
bank_accounts          → account records (linked to profiles + account_types)
account_balances       → server-computed balances (linked to accounts)
overdraft_requests     → overdraft workflow (linked to accounts)
stock_symbols          → reference data for stock symbols
user_watchlist         → user's tracked symbols (max 10, linked to users + stock_symbols)
stock_tips             → daily tips per symbol
```

## User Flow

```
Register → Login → Create Profile → Create Account → Dashboard
```

Smart navigation enforces this order — incomplete onboarding redirects to the next required step.

## Security

- Passwords hashed with bcrypt; plaintext never stored
- Only last 4 digits of SSN/Tax ID stored
- All stock API calls proxied through the backend — API keys never reach the client
- All inputs validated via Pydantic schemas before processing
- All outputs serialized through defined response schemas
- Secrets loaded from environment variables only

## Project Structure

```
/frontend          React + TypeScript + Tailwind app
/backend           FastAPI application
/docs              Additional documentation
/intents           System specification (intent.md is the source of truth)
docker-compose.yml
.env.example
README.md
```
