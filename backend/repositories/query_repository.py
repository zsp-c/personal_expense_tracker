"""记录查询与条件筛选的数据访问。

模块负责人：成员 D（记录查询与筛选）。

约定：
- 只负责 SQL 查询，不写业务规则与参数校验（校验在 services/query_service.py）。
- 所有 SQL 使用 ? 参数占位符，绝不把用户输入拼进 SQL 文本。
- 每个函数自行获取并关闭连接。
- 返回字段与前端账单列表（成员 H）对齐：
  id / date / type / amount / category / remark / created_at。
  amount 统一为整数「分」，由前端负责除以 100 显示。
"""

from database.connection import get_connection

# 前端未指定 limit 时的默认返回条数。
DEFAULT_LIMIT = 10
# limit 的硬上限，防止一次请求把整张表拉走。
MAX_LIMIT = 200

_COLUMNS = "id, date, type, amount, category, remark, created_at"


def _build_where(
    start_date: str | None,
    end_date: str | None,
    type: str | None,
    category: str | None,
) -> tuple[str, list]:
    """把筛选条件拆成 WHERE 子句和参数列表。

    条件名与参数值始终分离：SQL 文本里只会出现 ? 占位符，
    用户输入永远作为参数传入，不参与字符串拼接。
    """
    conditions: list[str] = []
    params: list = []

    if start_date:
        conditions.append("date >= ?")
        params.append(start_date)
    if end_date:
        conditions.append("date <= ?")
        params.append(end_date)
    if type:
        conditions.append("type = ?")
        params.append(type)
    if category:
        conditions.append("category = ?")
        params.append(category)

    where = " WHERE " + " AND ".join(conditions) if conditions else ""
    return where, params


def query_records(
    start_date: str | None = None,
    end_date: str | None = None,
    type: str | None = None,
    category: str | None = None,
    limit: int | None = None,
    offset: int = 0,
) -> list[dict]:
    """按条件查询记录，默认按 date DESC, id DESC 排序。

    同一天的记录按 id 倒序，即后录入的排在前面。
    limit 为 None 表示不限制条数；offset 供前端「查看更多」翻页使用。
    """
    where, params = _build_where(start_date, end_date, type, category)

    sql = f"SELECT {_COLUMNS} FROM records{where} ORDER BY date DESC, id DESC"

    offset = max(int(offset), 0)
    if limit is not None:
        sql += " LIMIT ? OFFSET ?"
        params.extend([int(limit), offset])
    elif offset:
        # SQLite 中 LIMIT -1 表示不限制条数。
        sql += " LIMIT -1 OFFSET ?"
        params.append(offset)

    conn = get_connection()
    try:
        rows = conn.execute(sql, params).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def fetch_record_by_id(record_id: int) -> dict | None:
    """按 id 查询单条记录，不存在时返回 None。"""
    conn = get_connection()
    try:
        row = conn.execute(
            f"SELECT {_COLUMNS} FROM records WHERE id = ?", (record_id,)
        ).fetchone()
        return dict(row) if row is not None else None
    finally:
        conn.close()
