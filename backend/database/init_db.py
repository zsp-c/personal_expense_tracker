"""数据库建表与初始化。

模块负责人：成员 B（数据库设计与初始化）。
"""

from database.connection import get_connection


def init_database() -> None:
    """创建数据表（幂等，可重复调用）。

    表结构与 docs/DEVELOPMENT_GUIDE.md 第 3.1 节保持一致：
    - type 仅允许 income / expense；
    - amount 为整数分，且必须大于 0；
    - created_at 默认使用数据库当前时间。
    """
    conn = get_connection()

    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                type TEXT NOT NULL
                    CHECK(type IN ('income', 'expense')),
                amount INTEGER NOT NULL
                    CHECK(amount > 0),
                category TEXT NOT NULL,
                remark TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        conn.commit()

    finally:
        conn.close()


if __name__ == "__main__":
    init_database()
    print("数据库初始化完成")
