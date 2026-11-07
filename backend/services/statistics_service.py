"""收支统计业务逻辑。

模块负责人：成员 E（任务 05，收支统计）。

约定：
- 所有金额单位为「分」；结余 = 总收入 - 总支出。
- 只通过 database.connection.get_connection 访问数据库，
  不直接修改其他成员负责的 Repository / Service / 前端文件。
- 所有 SQL 条件均使用 ? 参数占位符，避免 SQL 注入。
"""

from database.connection import get_connection


def _build_where(
    start_date: str | None, end_date: str | None
) -> tuple[str, list]:
    """根据日期范围拼装 WHERE 子句与参数。

    返回 (where_clause, params)。where_clause 以 ' WHERE ' 开头或为空串。
    """
    clauses: list[str] = []
    params: list = []
    if start_date:
        clauses.append("date >= ?")
        params.append(start_date)
    if end_date:
        clauses.append("date <= ?")
        params.append(end_date)
    if clauses:
        return " WHERE " + " AND ".join(clauses), params
    return "", []


def get_summary(
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict:
    """返回 {"income": int, "expense": int, "balance": int}。

    - 使用 COALESCE 避免空表 / 无匹配记录时返回 NULL（统一返回 0）。
    - 支持按日期范围统计；无筛选条件时统计全部记录。
    - 金额为分，结余 = 总收入 - 总支出。
    """
    where, params = _build_where(start_date, end_date)
    sql = (
        "SELECT "
        "COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income, "
        "COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense "
        f"FROM records{where}"
    )
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        row = cur.fetchone()
        income = int(row["income"])
        expense = int(row["expense"])
    finally:
        conn.close()
    return {"income": income, "expense": expense, "balance": income - expense}


def get_category_totals(
    type: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    """按类别汇总金额，返回 [{"category": str, "total": int}, ...]。

    - 可选按收入 / 支出类型过滤（type = 'income' | 'expense'）。
    - 可选按日期范围过滤。
    - 使用 COALESCE 保证无记录时返回空列表而不是 NULL。
    - 结果按 total 降序、category 升序排序。
    """
    where, params = _build_where(start_date, end_date)
    if type:
        if where:
            where += " AND type = ?"
        else:
            where = " WHERE type = ?"
        params.append(type)

    sql = (
        "SELECT category, COALESCE(SUM(amount), 0) AS total "
        f"FROM records{where} "
        "GROUP BY category "
        "ORDER BY total DESC, category ASC"
    )
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
    finally:
        conn.close()
    return [{"category": r["category"], "total": int(r["total"])} for r in rows]
