"""Pydantic schemas for Analytics entity."""

from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class TotalSpendingResponse(BaseModel):
    """Total spending summary response."""

    total_amount: Decimal
    total_count: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class CategorySpendingItem(BaseModel):
    """Spending breakdown per category."""

    category: str
    total_amount: Decimal
    percentage: float
    count: int


class CategoryBreakdownResponse(BaseModel):
    """Category breakdown response."""

    total_amount: Decimal
    categories: List[CategorySpendingItem]


class MonthlySpendingItem(BaseModel):
    """Monthly spending summary entry."""

    year: int
    month: int
    total_amount: Decimal
    count: int


class MonthlySummaryResponse(BaseModel):
    """Monthly summary response."""

    months: List[MonthlySpendingItem]
