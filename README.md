# BankingPOC

A full-stack banking application starter built with **FastAPI**, **React 18 + TypeScript**, and **PostgreSQL** — fully orchestrated with Docker Compose.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Postgres │  │ FastAPI  │  │  React   │  │
│  │ :5432    │◄─│ :8000    │◄─│ :3000    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Database  | PostgreSQL 15                                   |
| Backend   | Python 3.11, FastAPI, SQLAlchemy, Alembic, JWT  |
| Frontend  | React 18, TypeScript, React Router v6, Axios    |
| Dev tools | Docker Compose                                  |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)
- (For local dev) Python 3.11+, Node.js 18+

---

## Quick Start (Docker Compose)

```bash
git clone <repo-url>
cd bankingpoc

# Start all services
docker compose up --build

# The app is now running:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:8000
#   API docs  → http://localhost:8000/docs
```

Migrations run automatically on backend start.

---

## Development Setup (without Docker)

### Backend

```bash
cd backend

# Create virtual env
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your local Postgres

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path         | Description                              |
|--------|--------------|------------------------------------------|
| POST   | `/register`  | Create account + auto-create checking    |
| POST   | `/login`     | Return JWT access token                  |
| GET    | `/me`        | Get current authenticated user           |

### Accounts — `/api/accounts`

| Method | Path                      | Description               |
|--------|---------------------------|---------------------------|
| GET    | `/`                       | List user's accounts      |
| POST   | `/`                       | Create a new account      |
| GET    | `/{id}`                   | Get account details       |
| POST   | `/{id}/deposit`           | Deposit funds             |
| POST   | `/{id}/withdraw`          | Withdraw funds            |

### Transactions — `/api/transactions`

| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | `/`                       | All transactions for current user        |
| GET    | `/account/{account_id}`   | Transactions for a specific account      |
| POST   | `/transfer`               | Transfer between accounts                |

Full interactive docs: http://localhost:8000/docs

---

## Default Test Credentials

Register a new account at `/register`. A **Checking Account** is created automatically upon registration.

To test transfers, register two separate accounts and use the 10-digit account numbers shown on the Transfer page.

---

## Environment Variables (Backend)

| Variable                      | Default                                                | Description              |
|-------------------------------|--------------------------------------------------------|--------------------------|
| DATABASE_URL                  | postgresql://bankinguser:bankingpass@localhost/...     | Postgres connection URL  |
| SECRET_KEY                    | (set this!)                                            | JWT signing secret       |
| ALGORITHM                     | HS256                                                  | JWT algorithm            |
| ACCESS_TOKEN_EXPIRE_MINUTES   | 30                                                     | Token lifetime           |
