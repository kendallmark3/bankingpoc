import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.routers import auth, profile, accounts, stocks

app = FastAPI(title="Bank of Intent API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def attach_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    request_id = request.headers.get("X-Request-ID", "")
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred", "details": []}, "request_id": request_id},
    )

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(accounts.router)
app.include_router(stocks.router)


@app.get("/v1/health")
async def health():
    return {"status": "ok", "service": "Bank of Intent API"}
