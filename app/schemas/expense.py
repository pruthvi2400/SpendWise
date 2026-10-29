"""Pydantic schemas for Expense entity."""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    """Payload for creating an expense."""

    title: str = Field(..., max_length=150, min_length=1)
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    category: str = Field(..., max_length=50, min_length=1)
    description: Optional[str] = None
    expense_date: date


class ExpenseUpdate(BaseModel):
    """Payload for updating an expense."""

    title: Optional[str] = Field(None, max_length=150, min_length=1)
    amount: Optional[Decimal] = Field(None, gt=0, max_digits=12, decimal_places=2)
    category: Optional[str] = Field(None, max_length=50, min_length=1)
    description: Optional[str] = None
    expense_date: Optional[date] = None


class ExpenseResponse(BaseModel):
    """Response schema for an expense."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    amount: Decimal
    category: str
    description: Optional[str] = None
    expense_date: date
    created_at: datetime


class ExpenseListResponse(BaseModel):
    """Paginated list of expenses."""

    items: List[ExpenseResponse]
    total: int
    page: int
    limit: int
    total_pages: int
