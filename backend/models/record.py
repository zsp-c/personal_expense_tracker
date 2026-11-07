"""收支记录数据模型（Pydantic）。

模块负责人：成员 A（项目骨架），后续由各接口负责人补充。
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class RecordCreate(BaseModel):
    """新增记录的请求体。amount 单位为分。"""

    date: date
    type: Literal["income", "expense"]
    amount: int = Field(gt=0, description="金额，单位为分")
    category: str = Field(min_length=1, max_length=30)
    remark: str = Field(default="", max_length=200)


class RecordUpdate(RecordCreate):
    """修改记录的请求体。"""


class RecordResponse(RecordCreate):
    """返回给前端的记录。"""

    id: int
    created_at: str | None = None


class CategoryTotal(BaseModel):
    """类别统计结果。"""

    category: str
    total: int


class SummaryResponse(BaseModel):
    """收支汇总结果。金额单位为分。"""

    income: int
    expense: int
    balance: int
