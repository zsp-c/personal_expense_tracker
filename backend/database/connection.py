"""SQLite 连接管理。

模块负责人：成员 B（数据库设计与初始化）。
"""

import sqlite3
from pathlib import Path

DB_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "account_book.db"
)


def get_connection() -> sqlite3.Connection:
    """创建并返回一个数据库连接。

    约定：
    - 使用 Path 定位数据库文件，避免受启动目录影响。
    - row_factory 设为 sqlite3.Row，便于按字段名访问结果。
    - 调用方负责在 finally 中关闭连接。
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    return conn
