"""Pydantic schemas for Budget entity."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BudgetCreate(BaseModel):
    """Payload for creating a budget limit."""

    category: str = Field(..., max_length=50, min_length=1)
    amount_limit: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)


class BudgetUpdate(BaseModel):
    """Payload for updating a budget limit."""

    amount_limit: Optional[Decimal] = Field(None, gt=0, max_digits=12, decimal_places=2)


class BudgetResponse(BaseModel):
    """Response schema for a budget."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    category: str
    amount_limit: Decimal
    month: int
    year: int
    created_at: datetime


class BudgetStatusResponse(BaseModel):
    """Spending vs Budget tracking status."""

    budget_id: int
    category: str
    month: int
    year: int
    amount_limit: Decimal
    total_spent: Decimal
    remaining: Decimal
    percentage_used: float
    is_over_budget: bool
