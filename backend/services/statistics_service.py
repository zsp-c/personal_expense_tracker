"""收支统计业务逻辑。

模块负责人：成员 E。

所有金额单位为分；结余 = 总收入 - 总支出。
"""


def get_summary(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict:
    """返回 {"income": int, "expense": int, "balance": int}。

    TODO(成员 E)：
    - 使用 COALESCE 避免空表返回 NULL。
    - 支持日期范围筛选。
    """
    raise NotImplementedError("待实现：成员 E")


def get_category_totals(
    type: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    """按类别汇总，返回 [{"category": str, "total": int}, ...]。

    TODO(成员 E)：GROUP BY category，按 total 降序。
    """
    raise NotImplementedError("待实现：成员 E")
