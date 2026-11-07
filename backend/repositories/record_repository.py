"""records 表的数据访问。

模块负责人：成员 C（新增/删除）、成员 D（查询/筛选）。

约定：
- 只负责 SQL 增删改查，不写业务规则。
- 所有 SQL 必须使用 ? 参数占位符。
- 每个函数自行获取并关闭连接。
"""

from database.connection import get_connection


def insert_record(data: dict) -> int:
    """插入一条记录，返回新记录 id。

    data 字段：date(str, YYYY-MM-DD), type, amount, category, remark
    """
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO records (date, type, amount, category, remark)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                data["date"],
                data["type"],
                data["amount"],
                data["category"],
                data["remark"],
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_all_records(
    start_date: str | None = None,
    end_date: str | None = None,
    type: str | None = None,
    category: str | None = None,
    limit: int | None = None,
) -> list[dict]:
    """按条件查询记录，默认按 date DESC, id DESC 排序。"""
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

    sql = "SELECT * FROM records"
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY date DESC, id DESC"

    if limit is not None:
        sql += " LIMIT ?"
        params.append(int(limit))

    conn = get_connection()
    try:
        rows = conn.execute(sql, params).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_record_by_id(record_id: int) -> dict | None:
    """按 id 查询单条记录，不存在返回 None。"""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM records WHERE id = ?",
            (record_id,),
        ).fetchone()
        return dict(row) if row is not None else None
    finally:
        conn.close()


def update_record(record_id: int, data: dict) -> bool:
    """更新记录，返回是否更新成功（用 rowcount 判断）。"""
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            UPDATE records
            SET date = ?, type = ?, amount = ?, category = ?, remark = ?
            WHERE id = ?
            """,
            (
                data["date"],
                data["type"],
                data["amount"],
                data["category"],
                data["remark"],
                record_id,
            ),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def delete_record(record_id: int) -> bool:
    """删除记录，返回是否删除成功（用 rowcount 判断）。"""
    conn = get_connection()
    try:
        cursor = conn.execute(
            "DELETE FROM records WHERE id = ?",
            (record_id,),
        )
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
