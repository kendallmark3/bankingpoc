# Running BOfI Locally

Complete setup guide for running the Bank of Intent stack on your own machine. No Docker required.

---

## Prerequisites

| Tool | Minimum version | Check |
|---|---|---|
| Python | 3.11 (3.14 recommended) | `python3 --version` |
| pip | 23+ | `pip --version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| PostgreSQL | 15+ | `psql --version` |

### macOS — install prerequisites

```bash
# Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install python@3.14 node postgresql@15

# Start PostgreSQL and enable it at login
brew services start postgresql@15
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm postgresql postgresql-contrib

sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows

Install [Python](https://www.python.org/downloads/), [Node.js](https://nodejs.org/), and [PostgreSQL](https://www.postgresql.org/download/windows/) using their official installers. Use **Git Bash** or **WSL2** for the commands below.

---

## 1. Clone the Repository

```bash
git clone https://github.com/kendallmark3/bankingpoc.git
cd bankingpoc
```

---

## 2. Database Setup

### Create the databases

```bash
# macOS / Linux (socket auth — no password needed for local dev)
createdb bofi_db
createdb bofi_test    # only needed if you plan to run tests

# If createdb is not on your PATH, use psql:
psql postgres -c "CREATE DATABASE bofi_db;"
psql postgres -c "CREATE DATABASE bofi_test;"
```

### Configure database credentials

The app defaults to connecting as your current OS user with no password (standard macOS Homebrew PostgreSQL setup). If your PostgreSQL requires a username or password, create a `.env` file in `backend/`:

```bash
# backend/.env  (only needed if your PG setup differs from the defaults)
DATABASE_URL=postgresql+asyncpg://YOUR_PG_USER:YOUR_PG_PASSWORD@localhost/bofi_db
DATABASE_URL_SYNC=postgresql://YOUR_PG_USER:YOUR_PG_PASSWORD@localhost/bofi_db
```

Leave the file out entirely if you use macOS Homebrew PostgreSQL with the default socket auth — the built-in defaults will work.

---

## 3. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# CRITICAL: pin bcrypt — version 4.x breaks passlib on Python 3.11+
pip install "bcrypt<4"

# Install extras not in requirements.txt
pip install "pydantic[email]" greenlet psycopg2-binary email-validator
```

### Run database migrations

```bash
# Still inside backend/ with .venv active
alembic upgrade head
```

You should see output ending in `Running upgrade -> 08e8a5710dc6, initial schema`.

### Verify the schema was created

```bash
psql bofi_db -c "\dt"
```

Expected: 12 tables including `users`, `bank_accounts`, `account_balances`, `refresh_tokens`, `stock_tips`, etc.

### Start the backend server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`. Confirm it's running:

```bash
curl http://localhost:8000/v1/health
# → {"data":{"status":"ok"},"request_id":"..."}
```

---

## 4. Frontend Setup

Open a **new terminal tab** (keep the backend running).

```bash
cd frontend

npm install

npm run dev
```

The app will open at **http://localhost:5173**.

Vite automatically proxies all `/v1/*` API requests to `http://localhost:8000` — no CORS configuration needed for local dev.

---

## 5. First-Time Use

Open `http://localhost:5173` in your browser and follow the onboarding flow:

1. **Register** — create an account with email + password (min 8 chars, 1 uppercase, 1 digit)
2. **Login** — sign in to receive your session tokens
3. **Create Profile** — fill in personal info and address (required before opening accounts)
4. **Open Account** — choose Checking, Savings, or Money Market with an optional initial deposit
5. **Dashboard** — view accounts, balances, stock watchlist, and tip of the day

---

## 6. Running Tests

```bash
cd backend
source .venv/bin/activate

python -m pytest tests/ -v
```

Expected output: `8 passed` covering auth registration, login, refresh tokens, reuse detection, and health check.

Tests run against `bofi_test` (a separate database), not `bofi_db`. Each test rolls back its changes via transaction — the database is left clean after every run.

---

## 7. Environment Variables (Optional Overrides)

All variables have working local defaults. Only override them if your setup differs.

Create `backend/.env` and add only the variables you need to change:

```env
# Required override for production — use a strong random secret
JWT_SECRET=your-random-32-char-secret-here

# Override if your PostgreSQL user/password differs from OS defaults
DATABASE_URL=postgresql+asyncpg://myuser:mypassword@localhost/bofi_db
DATABASE_URL_SYNC=postgresql://myuser:mypassword@localhost/bofi_db

# Override if running frontend on a different port
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

Full variable reference:

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://YOUR_OS_USER@localhost/bofi_db` | asyncpg driver for FastAPI |
| `DATABASE_URL_SYNC` | `postgresql://YOUR_OS_USER@localhost/bofi_db` | psycopg2 driver for Alembic |
| `JWT_SECRET` | `change-me-in-production-use-32-char-secret` | **Must change for production** |
| `JWT_ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | |
| `BCRYPT_ROUNDS` | `12` | |
| `ALLOWED_ORIGINS` | `["http://localhost:5173"]` | |
| `STOCK_CACHE_TTL` | `45` | Seconds; quotes are mocked, no external key needed |

---

## 8. Common Issues

### `createdb: error: connection to server failed`
PostgreSQL isn't running. Start it:
```bash
brew services start postgresql@15   # macOS
sudo systemctl start postgresql     # Linux
```

### `alembic upgrade head` fails with `role "markkendall" does not exist`
The default DATABASE_URL uses your macOS username. Either create that PG role:
```bash
createuser --superuser $(whoami)
```
Or set `DATABASE_URL` / `DATABASE_URL_SYNC` in `backend/.env` to use an existing role.

### `ValueError: password cannot be longer than 72 bytes`
bcrypt 4.x is installed. Fix:
```bash
pip install "bcrypt<4"
```

### `ModuleNotFoundError: No module named 'greenlet'`
```bash
pip install greenlet
```

### `ModuleNotFoundError: No module named 'email_validator'`
```bash
pip install "pydantic[email]" email-validator
```

### `ModuleNotFoundError: No module named 'psycopg2'`
```bash
pip install psycopg2-binary
```

### Frontend shows a blank page or 404 on API calls
Make sure the backend is running on port 8000 before starting the frontend. Vite's proxy requires the backend to be up.

### Port 8000 or 5173 already in use
```bash
# Find what's using port 8000
lsof -i :8000
# Kill it by PID
kill -9 <PID>
```

---

## 9. Making Schema Changes

If you modify any SQLAlchemy model in `backend/app/models/`, generate and apply a migration:

```bash
cd backend
source .venv/bin/activate

alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

Commit the generated file in `backend/alembic/versions/` alongside your model changes.

---

## Quick Reference

```bash
# Backend (from /backend with .venv active)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (from /frontend)
npm run dev

# Tests (from /backend with .venv active)
python -m pytest tests/ -v

# Type-check frontend (from /frontend)
npx tsc --noEmit

# Lint frontend (from /frontend)
npm run lint

# New migration (from /backend with .venv active)
alembic revision --autogenerate -m "description"
alembic upgrade head
```
