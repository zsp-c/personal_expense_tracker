"""records 表的数据访问。

模块负责人：成员 C（新增/删除）、成员 D（查询/筛选）。

约定：
- 只负责 SQL 增删改查，不写业务规则。
- 所有 SQL 必须使用 ? 参数占位符。
- 每个函数自行获取并关闭连接。
"""

from database.connection import get_connection


def insert_record(data) -> int:
    """插入一条记录，返回新记录 id。

    TODO(成员 C)：实现 INSERT，字段顺序与建表语句一致。
    """
    raise NotImplementedError("待实现：成员 C")


def get_all_records(
    start_date: str | None = None,
    end_date: str | None = None,
    type: str | None = None,
    category: str | None = None,
    limit: int | None = None,
) -> list[dict]:
    """按条件查询记录，默认按 date DESC, id DESC 排序。

    TODO(成员 D)：动态拼接 WHERE 条件，全部使用参数绑定。
    """
    raise NotImplementedError("待实现：成员 D")


def get_record_by_id(record_id: int) -> dict | None:
    """按 id 查询单条记录，不存在返回 None。

    TODO(成员 D)：实现单条查询。
    """
    raise NotImplementedError("待实现：成员 D")


def update_record(record_id: int, data) -> bool:
    """更新记录，返回是否更新成功。

    TODO(成员 C)：实现 UPDATE。
    """
    raise NotImplementedError("待实现：成员 C")


def delete_record(record_id: int) -> bool:
    """删除记录，返回是否删除成功。

    TODO(成员 C)：实现 DELETE，用 cursor.rowcount > 0 判断。
    """
    raise NotImplementedError("待实现：成员 C")
