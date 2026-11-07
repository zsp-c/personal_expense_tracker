"""记账相关接口。

模块负责人：成员 C（增删）、成员 D（查询）。

路由前缀：/api/records
"""

from datetime import date

from fastapi import APIRouter, HTTPException, Query

from models.record import RecordCreate, RecordUpdate
from services import query_service, record_service

router = APIRouter(prefix="/api/records", tags=["记账管理"])


@router.post("/")
def create_record(data: RecordCreate):
    """新增记录。"""
    record_id = record_service.create_record(data)
    return {"id": record_id, "message": "添加成功"}


@router.get("/")
def list_records(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
    category: str | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1),
):
    """按条件查询记录列表。"""
    return query_service.list_records(
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        type=type,
        category=category,
        limit=limit,
    )


@router.get("/{record_id}")
def get_record(record_id: int):
    """查询单条记录。"""
    return query_service.get_record(record_id)


@router.put("/{record_id}")
def update_record(record_id: int, data: RecordUpdate):
    """修改记录。"""
    try:
        record_service.update_record(record_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": "修改成功"}


@router.delete("/{record_id}")
def remove_record(record_id: int):
    """删除记录。"""
    try:
        record_service.delete_record(record_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": "删除成功"}
