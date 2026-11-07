"""记账业务逻辑：新增、修改、删除。

模块负责人：成员 C。

约定：
- 只调用 Repository，不直接访问数据库。
- 不处理 HTTP 请求对象；错误以异常形式抛出，由 API 层转换。
"""

from models.record import RecordCreate, RecordUpdate
from repositories import record_repository


def create_record(data: RecordCreate) -> int:
    """新增一条记录，返回记录 id。

    TODO(成员 C)：调用 record_repository.insert_record。
    """
    raise NotImplementedError("待实现：成员 C")


def update_record(record_id: int, data: RecordUpdate) -> None:
    """修改一条记录；记录不存在时抛出 ValueError。

    TODO(成员 C)：先查询存在性，再调用 update_record。
    """
    raise NotImplementedError("待实现：成员 C")


def delete_record(record_id: int) -> None:
    """删除一条记录；记录不存在时抛出 ValueError。

    TODO(成员 C)：调用 repository.delete_record，失败时抛出异常。
    """
    raise NotImplementedError("待实现：成员 C")
