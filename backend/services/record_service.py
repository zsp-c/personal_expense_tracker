"""记账业务逻辑：新增、修改、删除。

模块负责人：成员 C。

约定：
- 只调用 Repository，不直接访问数据库。
- 不处理 HTTP 请求对象；错误以异常形式抛出，由 API 层转换。
"""

from models.record import RecordCreate, RecordUpdate
from repositories import record_repository


def create_record(data: RecordCreate) -> int:
    """新增一条记录，返回记录 id。"""
    record_data = {
        "date": data.date.isoformat(),
        "type": data.type,
        "amount": data.amount,
        "category": data.category,
        "remark": data.remark,
    }
    return record_repository.insert_record(record_data)


def update_record(record_id: int, data: RecordUpdate) -> None:
    """修改一条记录；记录不存在时抛出 ValueError。"""
    record_data = {
        "date": data.date.isoformat(),
        "type": data.type,
        "amount": data.amount,
        "category": data.category,
        "remark": data.remark,
    }
    success = record_repository.update_record(record_id, record_data)
    if not success:
        raise ValueError(f"记录 id={record_id} 不存在")


def delete_record(record_id: int) -> None:
    """删除一条记录；记录不存在时抛出 ValueError。"""
    success = record_repository.delete_record(record_id)
    if not success:
        raise ValueError(f"记录 id={record_id} 不存在")
