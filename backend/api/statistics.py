"""统计相关接口。

模块负责人：成员 E。

路由前缀：/api/stats
"""

from datetime import date

from fastapi import APIRouter, Query

from services import statistics_service

router = APIRouter(prefix="/api/stats", tags=["统计"])


@router.get("/summary")
def get_summary(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    """收支汇总（金额单位为分）。"""
    return statistics_service.get_summary(
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
    )


@router.get("/category")
def get_category_totals(
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    """按类别统计（金额单位为分）。"""
    return statistics_service.get_category_totals(
        type=type,
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
    )
