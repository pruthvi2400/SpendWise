
"""Main FastAPI application for SpendWise."""

from fastapi import FastAPI, HTTPException

from .database import check_db_connection
from .routers import analytics_router, auth_router, budgets_router, expenses_router

app = FastAPI(
    title="SpendWise API",
    description="Expense Analytics & Budget Tracking REST API built with FastAPI, SQLAlchemy 2.x, and PostgreSQL.",
    version="1.0.0",
)

# Register routers
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(expenses_router)
app.include_router(budgets_router)
app.include_router(analytics_router)


@app.get("/", tags=["Root"])
def home():
    return {
        "message": "Welcome to SpendWise API!",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


@app.get("/health/db", tags=["Health"])
def db_health():
    """Health check that verifies the PostgreSQL database is reachable."""
    if not check_db_connection():
        raise HTTPException(status_code=503, detail="Database is unavailable")
    return {"status": "healthy", "database": "connected"}

