"""记账相关接口。

模块负责人：成员 C（增删）、成员 D（查询）。

路由前缀：/api/records
"""

from datetime import date
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from models.record import RecordCreate, RecordUpdate
from services import export_service, query_service, record_service

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


@router.get("/export")
def export_records(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
    category: str | None = Query(default=None),
):
    """按当前筛选条件导出账单为 Excel（xlsx）。

    注意：本路由必须写在 /{record_id} 之前，否则 "export" 会被当成记录 id。
    """
    content, filename = export_service.export_records(
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        type=type,
        category=category,
    )
    # 中文文件名用 RFC 5987 的 filename* 形式，同时保留 ASCII 兜底
    disposition = (
        "attachment; filename=\"records.xlsx\"; "
        f"filename*=UTF-8''{quote(filename)}"
    )
    return Response(
        content=content,
        media_type=export_service.XLSX_MEDIA_TYPE,
        headers={
            "Content-Disposition": disposition,
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
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
