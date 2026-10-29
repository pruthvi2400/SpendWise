"""Analytics and reporting router for SpendWise."""

from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, extract, func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.expense import Expense
from ..models.user import User
from ..schemas.analytics import (
    CategoryBreakdownResponse,
    CategorySpendingItem,
    MonthlySpendingItem,
    MonthlySummaryResponse,
    TotalSpendingResponse,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/total", response_model=TotalSpendingResponse)
def get_total_spending(
    start_date: Optional[date] = Query(None, description="Start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="End date filter (inclusive)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get total spending amount and transaction count with optional date range filters."""
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    result = db.query(func.sum(Expense.amount), func.count(Expense.id)).filter(
        Expense.user_id == current_user.id
    )
    if start_date:
        result = result.filter(Expense.expense_date >= start_date)
    if end_date:
        result = result.filter(Expense.expense_date <= end_date)

    total_sum, total_count = result.first()
    total_amount = total_sum if total_sum is not None else Decimal("0.00")

    return TotalSpendingResponse(
        total_amount=total_amount,
        total_count=total_count or 0,
        start_date=str(start_date) if start_date else None,
        end_date=str(end_date) if end_date else None,
    )


@router.get("/categories", response_model=CategoryBreakdownResponse)
def get_category_breakdown(
    start_date: Optional[date] = Query(None, description="Start date filter (inclusive)"),
    end_date: Optional[date] = Query(None, description="End date filter (inclusive)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get spending breakdown grouped by category with percentages."""
    query = db.query(
        Expense.category,
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
    ).filter(Expense.user_id == current_user.id)

    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    rows = query.group_by(Expense.category).all()

    grand_total = sum((row.total for row in rows), Decimal("0.00"))
    categories = []

    for row in rows:
        pct = float((row.total / grand_total) * 100) if grand_total > 0 else 0.0
        categories.append(
            CategorySpendingItem(
                category=row.category,
                total_amount=row.total,
                percentage=round(pct, 2),
                count=row.count,
            )
        )

    return CategoryBreakdownResponse(
        total_amount=grand_total,
        categories=categories,
    )


@router.get("/monthly", response_model=MonthlySummaryResponse)
def get_monthly_summary(
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Filter by year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get monthly spending aggregated by year and month."""
    query = db.query(
        extract("year", Expense.expense_date).label("yr"),
        extract("month", Expense.expense_date).label("mo"),
        func.sum(Expense.amount).label("total"),
        func.count(Expense.id).label("count"),
    ).filter(Expense.user_id == current_user.id)

    if year is not None:
        query = query.filter(extract("year", Expense.expense_date) == year)

    rows = query.group_by("yr", "mo").order_by(desc("yr"), desc("mo")).all()

    months = [
        MonthlySpendingItem(
            year=int(row.yr),
            month=int(row.mo),
            total_amount=row.total,
            count=row.count,
        )
        for row in rows
    ]

    return MonthlySummaryResponse(months=months)
