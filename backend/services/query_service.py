"""查询与筛选业务逻辑。

模块负责人：成员 D。

支持条件：start_date、end_date、type、category、limit。
"""

from repositories import record_repository


def list_records(
    start_date: str | None = None,
    end_date: str | None = None,
    type: str | None = None,
    category: str | None = None,
    limit: int | None = None,
) -> list[dict]:
    """按条件查询记录列表。

    TODO(成员 D)：
    - 校验日期格式与区间（start_date <= end_date）。
    - 调用 record_repository.get_all_records。
    """
    raise NotImplementedError("待实现：成员 D")


def get_record(record_id: int) -> dict:
    """查询单条记录；不存在时抛出 ValueError。

    TODO(成员 D)：调用 record_repository.get_record_by_id。
    """
    raise NotImplementedError("待实现：成员 D")
