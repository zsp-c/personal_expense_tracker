"""查询与筛选业务逻辑。

模块负责人：成员 D。

支持条件：start_date、end_date、type、category、limit、offset。

职责边界：
- 这里做参数校验（日期格式、日期区间、类型、limit 上限）。
- SQL 全部在 repositories/query_repository.py 中参数化生成。
- 不直接访问数据库，也不处理 HTTP 请求对象；错误以 ValueError 抛出，
  由 main.py 的异常处理器统一转成 400。
"""

from datetime import date

from repositories import query_repository

# 允许的收支类型，与建表约束保持一致。
VALID_TYPES = ("income", "expense")


def _validate_date(value: str, field: str) -> str:
    """校验 YYYY-MM-DD 日期字符串，合法则原样返回。"""
    try:
        date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValueError(
            f"{field} 日期格式不正确，应为 YYYY-MM-DD，当前值：{value}"
        ) from None
    return value


def list_records(
    start_date: str | None = None,
    end_date: str | None = None,
    type: str | None = None,
    category: str | None = None,
    limit: int | None = None,
    offset: int = 0,
) -> list[dict]:
    """按条件查询记录列表。

    - start_date / end_date：YYYY-MM-DD，且开始日期不能晚于结束日期。
    - type：income（收入）或 expense（支出）。
    - category：按类别精确匹配。
    - limit：返回条数上限。未指定时取最近 DEFAULT_LIMIT 条；
      超过 MAX_LIMIT 会被截断而不是报错，避免前端误传导致整页加载失败。
    - offset：配合前端「查看更多」翻页。

    返回的每条记录包含 id / date / type / amount / category / remark / created_at，
    amount 单位为「分」。
    """
    if start_date:
        _validate_date(start_date, "start_date")
    if end_date:
        _validate_date(end_date, "end_date")
    if start_date and end_date and start_date > end_date:
        raise ValueError("start_date 不能晚于 end_date")
    if type and type not in VALID_TYPES:
        raise ValueError("type 只能是 income 或 expense")
    if category is not None and not category.strip():
        raise ValueError("category 不能为空字符串")

    if limit is None:
        effective_limit = query_repository.DEFAULT_LIMIT
    else:
        effective_limit = max(1, min(int(limit), query_repository.MAX_LIMIT))

    return query_repository.query_records(
        start_date=start_date,
        end_date=end_date,
        type=type,
        category=category,
        limit=effective_limit,
        offset=offset,
    )


def get_record(record_id: int) -> dict:
    """查询单条记录；不存在时抛出 ValueError。"""
    record = query_repository.fetch_record_by_id(record_id)
    if record is None:
        raise ValueError(f"记录不存在：{record_id}")
    return record
