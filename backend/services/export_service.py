"""账单导出为 Excel（xlsx）。

职责：把筛选后的账单记录拼成 xlsx 文件流，由 api/records.py 的导出接口返回。
约定：
- 金额在数据库里是整数「分」，导出时转成元并保留两位小数。
- 日期按 YYYY-MM-DD 原样输出，类型转成中文「收入 / 支出」。
- 只负责生成文件，不处理 HTTP 响应头；参数校验复用 query_service。
"""

from datetime import datetime
from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from services import query_service

# 导出文件的 MIME 类型（xlsx 标准类型）
XLSX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

# 表头文案与列宽
_COLUMNS = (
    ("日期", 13),
    ("类型", 8),
    ("类别", 14),
    ("金额（元）", 14),
    ("备注", 36),
)

_TYPE_LABELS = {"income": "收入", "expense": "支出"}


def build_filename(now: datetime | None = None) -> str:
    """导出文件名：账单_YYYYMMDD.xlsx"""
    current = now or datetime.now()
    return f"账单_{current:%Y%m%d}.xlsx"


def export_records(
    start_date: str | None = None,
    end_date: str | None = None,
    type: str | None = None,
    category: str | None = None,
) -> tuple[bytes, str]:
    """按条件导出全部匹配记录，返回 (xlsx 文件内容, 文件名)。"""
    records = query_service.list_all_records(
        start_date=start_date,
        end_date=end_date,
        type=type,
        category=category,
    )

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "账单"

    # 表头：深蓝底白字，冻结首行，便于滚动时保持可见
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="1A5FA8")
    for index, (title, width) in enumerate(_COLUMNS, start=1):
        cell = sheet.cell(row=1, column=index, value=title)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        sheet.column_dimensions[get_column_letter(index)].width = width
    sheet.row_dimensions[1].height = 22
    sheet.freeze_panes = "A2"

    # 数据行：金额由「分」转「元」，数值格式固定两位小数
    for row_index, record in enumerate(records, start=2):
        sheet.cell(row=row_index, column=1, value=record.get("date") or "")
        sheet.cell(
            row=row_index,
            column=2,
            value=_TYPE_LABELS.get(record.get("type"), record.get("type") or ""),
        )
        sheet.cell(row=row_index, column=3, value=record.get("category") or "")
        amount_cell = sheet.cell(
            row=row_index,
            column=4,
            value=round((record.get("amount") or 0) / 100, 2),
        )
        amount_cell.number_format = "0.00"
        sheet.cell(row=row_index, column=5, value=record.get("remark") or "")

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue(), build_filename()
