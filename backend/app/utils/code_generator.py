"""
Sequential, never-reused code generation (e.g. CUS000001, PRD000001).

Extracted from Module 5's customer_code logic so Module 6's product_code
doesn't reimplement the same algorithm — both call this one function.
"""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session


def generate_sequential_code(
    db: Session,
    *,
    model,
    code_column,
    prefix: str,
    digits: int = 6,
) -> str:
    """
    Generate the next sequential code for `model` (e.g. "PRD000042").

    Derived from the most recently inserted row's code (ordered by the
    model's `id`, which never decreases) and incrementing the numeric
    suffix. Soft-deleted rows are NOT excluded from this lookup — their
    row (and its code) still exists, so the next number always advances
    past it, guaranteeing a deleted record's code is never reused.
    """
    last_code = db.execute(
        select(code_column).order_by(model.id.desc()).limit(1)
    ).scalar_one_or_none()

    next_number = 1
    if last_code:
        match = re.search(r"(\d+)$", last_code)
        if match:
            next_number = int(match.group(1)) + 1

    return f"{prefix}{next_number:0{digits}d}"
