"""Export all routers."""

from .analytics import router as analytics_router
from .auth import router as auth_router
from .budgets import router as budgets_router
from .expenses import router as expenses_router

__all__ = ["auth_router", "expenses_router", "budgets_router", "analytics_router"]
