"""Budgets and spending tracking router for SpendWise."""

from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.budget import Budget
from ..models.expense import Expense
from ..models.user import User
from ..schemas.budget import (
    BudgetCreate,
    BudgetResponse,
    BudgetStatusResponse,
    BudgetUpdate,
)

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or set a budget limit for a category in a specific month and year."""
    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category == budget_data.category,
            Budget.month == budget_data.month,
            Budget.year == budget_data.year,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget for this category and month/year already exists. Use PUT to update.",
        )

    budget = Budget(
        user_id=current_user.id,
        category=budget_data.category,
        amount_limit=budget_data.amount_limit,
        month=budget_data.month,
        year=budget_data.year,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.get("", response_model=List[BudgetResponse])
def list_budgets(
    month: Optional[int] = Query(None, ge=1, le=12, description="Filter by month"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="Filter by year"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List budgets for the authenticated user with optional month/year filters."""
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    if month is not None:
        query = query.filter(Budget.month == month)
    if year is not None:
        query = query.filter(Budget.year == year)
    return query.order_by(Budget.year.desc(), Budget.month.desc(), Budget.category).all()


@router.get("/{budget_id}/status", response_model=BudgetStatusResponse)
def get_budget_status(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Track spending against a specific budget."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    # Calculate total spent in this category for the given month and year
    total_spent_res = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == current_user.id,
            Expense.category == budget.category,
            extract("month", Expense.expense_date) == budget.month,
            extract("year", Expense.expense_date) == budget.year,
        )
        .scalar()
    )

    total_spent = total_spent_res if total_spent_res is not None else Decimal("0.00")
    remaining = budget.amount_limit - total_spent
    percentage_used = float((total_spent / budget.amount_limit) * 100) if budget.amount_limit > 0 else 0.0
    is_over_budget = total_spent > budget.amount_limit

    return BudgetStatusResponse(
        budget_id=budget.id,
        category=budget.category,
        month=budget.month,
        year=budget.year,
        amount_limit=budget.amount_limit,
        total_spent=total_spent,
        remaining=remaining,
        percentage_used=round(percentage_used, 2),
        is_over_budget=is_over_budget,
    )


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a budget's amount limit."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    if budget_data.amount_limit is not None:
        budget.amount_limit = budget_data.amount_limit

    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a budget limit."""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return None
