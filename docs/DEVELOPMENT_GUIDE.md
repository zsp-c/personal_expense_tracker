# 个人记账本系统——项目代码指导文档

**项目技术栈：** Python + FastAPI + SQLite + HTML/CSS/JavaScript  
**文档版本：** V1.0

本文档用于指导团队成员进行项目开发，统一项目结构、代码规范、数据库设计、接口协议和开发流程。

---

## 1. 项目整体架构

采用前后端分离架构。

```text
                 用户浏览器
                     |
                     | HTTP 请求
                     v
          HTML + CSS + JavaScript
                     |
                     | fetch()
                     v
                FastAPI
                     |
                     v
                 API 层
                     |
                     v
                Service 层
                     |
                     v
              Repository 层
                     |
                     v
                 SQLite
```

各层职责：

| 层级 | 主要职责 |
|---|---|
| Frontend | 页面展示、表单交互、发送 HTTP 请求 |
| API | 接收请求、校验参数、返回响应 |
| Service | 实现业务逻辑 |
| Repository | 执行数据库增删改查 |
| Database | 创建数据库连接、初始化数据表 |

基本原则：

- API 层不直接编写复杂 SQL。
- Service 层负责业务规则。
- Repository 层负责数据库访问。
- 前端不能直接访问 SQLite。
- 所有金额统一使用整数分作为后端和数据库内部单位。

## 2. 项目目录结构

建议采用以下目录：

```text
personal-account-book/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   └── init_db.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── record.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── record_repository.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── record_service.py
│   │   ├── query_service.py
│   │   └── statistics_service.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── records.py
│   │   └── statistics.py
│   │
│   └── data/
│       └── account_book.db
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── records.js
│       ├── statistics.js
│       └── main.js
│
├── docs/
│   ├── PRD.md
│   └── DEVELOPMENT_GUIDE.md
│
├── .gitignore
└── README.md
```

说明：

- `database/`：数据库连接与初始化。
- `models/`：请求数据模型和响应数据模型。
- `repositories/`：数据库访问。
- `services/`：业务逻辑。
- `api/`：HTTP API 接口。
- `frontend/`：Web 页面和交互逻辑。
- `docs/`：项目需求和开发说明。

`data/account_book.db` 在程序首次运行时自动生成，不需要团队成员手动创建。

## 3. 数据库设计

### 3.1 数据表

数据库名称：`account_book.db`  
数据表名称：`records`

建表 SQL：

```sql
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
);
```

### 3.2 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER | 主键，自增 |
| date | TEXT | 日期，格式 YYYY-MM-DD |
| type | TEXT | income 或 expense |
| amount | INTEGER | 金额，单位：分 |
| category | TEXT | 收支类别 |
| remark | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

### 3.3 金额存储规范

数据库中不能使用浮点数存储金额。

| 用户输入 | 数据库存储 |
|---|---:|
| 10.00 元 | 1000 |
| 35.50 元 | 3550 |
| 100.99 元 | 10099 |

前端输入金额后，转换为分：

```javascript
const amountInFen = Math.round(Number(amount) * 100);
```

前端展示金额时：

```javascript
const amountInYuan = (amountInFen / 100).toFixed(2);
```

所有后端接口中的 `amount` 字段均使用分作为单位。

## 4. 后端代码规范

### 4.1 数据库连接模块

文件：`backend/database/connection.py`

参考实现：

```python
import sqlite3
from pathlib import Path

DB_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "account_book.db"
)


def get_connection():
    DB_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    conn.execute("PRAGMA foreign_keys = ON")

    return conn
```

说明：

- 使用 `Path(__file__)` 定位数据库，避免因启动目录不同导致数据库路径错误。
- `row_factory` 允许通过字段名称访问查询结果。
- 每次数据库操作完成后都应关闭连接。

### 4.2 数据库初始化模块

文件：`backend/database/init_db.py`

参考实现：

```python
from database.connection import get_connection


def init_database():
    conn = get_connection()

    try:
        conn.execute("""
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
        """)

        conn.commit()

    finally:
        conn.close()
```

### 4.3 数据模型

文件：`backend/models/record.py`

参考实现：

```python
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class RecordCreate(BaseModel):
    date: date

    type: Literal["income", "expense"]

    amount: int = Field(
        gt=0,
        description="金额，单位为分"
    )

    category: str = Field(
        min_length=1,
        max_length=30
    )

    remark: str = Field(
        default="",
        max_length=200
    )


class RecordUpdate(RecordCreate):
    pass


class RecordResponse(RecordCreate):
    id: int
```

注意：

- `Literal` 限制收支类型。
- `Field(gt=0)` 限制金额必须大于 0。
- 日期由 Pydantic 自动校验。
- `amount` 的单位是分，不是元。

### 4.4 Repository 数据访问层

文件：`backend/repositories/record_repository.py`

负责：

- 新增记录。
- 查询全部记录。
- 根据 ID 查询记录。
- 删除记录。
- 更新记录。
- 按条件筛选记录。

参考新增方法：

```python
from database.connection import get_connection


def insert_record(data):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO records
            (date, type, amount, category, remark)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                data.date.isoformat(),
                data.type,
                data.amount,
                data.category,
                data.remark
            )
        )

        conn.commit()

        return cursor.lastrowid

    finally:
        conn.close()
```

参考查询方法：

```python
def get_all_records():
    conn = get_connection()

    try:
        rows = conn.execute(
            """
            SELECT *
            FROM records
            ORDER BY date DESC, id DESC
            """
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        conn.close()
```

参考删除方法：

```python
def delete_record(record_id):
    conn = get_connection()

    try:
        cursor = conn.execute(
            "DELETE FROM records WHERE id = ?",
            (record_id,)
        )

        conn.commit()

        return cursor.rowcount > 0

    finally:
        conn.close()
```

注意：SQL 必须使用 `?` 参数占位符，不能将用户输入直接拼接进 SQL 字符串。

### 4.5 Service 业务逻辑层

文件：`backend/services/record_service.py`

负责：

- 调用 Repository。
- 处理新增记录业务。
- 处理修改记录业务。
- 处理删除记录业务。
- 处理业务规则和异常。

Service 不应直接处理 HTTP 请求对象。

文件：`backend/services/statistics_service.py`

负责：

- 计算总收入。
- 计算总支出。
- 计算结余。
- 按类别统计。
- 按日期统计。

参考统计 SQL：

```sql
SELECT
    COALESCE(
        SUM(CASE WHEN type = 'income'
            THEN amount ELSE 0 END),
        0
    ) AS income,

    COALESCE(
        SUM(CASE WHEN type = 'expense'
            THEN amount ELSE 0 END),
        0
    ) AS expense

FROM records;
```

注意：

- `COALESCE` 用于避免没有记录时返回 NULL。
- SQLite 的 `SUM` 结果仍然以分为单位。
- 结余 = 总收入 - 总支出。

### 4.6 API 接口层

文件：`backend/api/records.py`

负责定义记账相关 HTTP 接口。

参考实现：

```python
from fastapi import APIRouter, HTTPException

from models.record import RecordCreate
from repositories.record_repository import (
    insert_record,
    get_all_records,
    delete_record
)

router = APIRouter(
    prefix="/api/records",
    tags=["记账管理"]
)


@router.post("/")
def create_record(data: RecordCreate):
    record_id = insert_record(data)

    return {
        "id": record_id,
        "message": "添加成功"
    }


@router.get("/")
def list_records():
    return get_all_records()


@router.delete("/{record_id}")
def remove_record(record_id: int):

    if not delete_record(record_id):
        raise HTTPException(
            status_code=404,
            detail="记录不存在"
        )

    return {
        "message": "删除成功"
    }
```

实际开发中，查询接口应继续扩展日期、类别、类型和数量限制参数，并通过 Service 层完成业务处理。

## 5. API 接口规范

前后端开发必须遵循统一接口协议。

### 5.1 新增记录

**请求**

```http
POST /api/records/
Content-Type: application/json
```

请求体：

```json
{
    "date": "2026-11-07",
    "type": "expense",
    "amount": 3550,
    "category": "饮食",
    "remark": "午餐"
}
```

成功响应：

```json
{
    "id": 1,
    "message": "添加成功"
}
```

### 5.2 查询记录

**请求**

```http
GET /api/records/
```

建议支持以下查询参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| start_date | string | 开始日期 |
| end_date | string | 结束日期 |
| type | string | income 或 expense |
| category | string | 类别 |
| limit | integer | 返回数量 |

示例：

```http
GET /api/records/?type=expense&category=饮食&limit=10
```

### 5.3 删除记录

**请求**

```http
DELETE /api/records/1
```

成功响应：

```json
{
    "message": "删除成功"
}
```

### 5.4 收支汇总

**请求**

```http
GET /api/stats/summary
```

支持参数：

- `start_date`
- `end_date`

成功响应：

```json
{
    "income": 100000,
    "expense": 35500,
    "balance": 64500
}
```

上述金额均为分。

### 5.5 类别统计

**请求**

```http
GET /api/stats/category?type=expense
```

参考响应：

```json
[
    {
        "category": "饮食",
        "total": 35500
    },
    {
        "category": "交通",
        "total": 12000
    }
]
```

## 6. FastAPI 主程序

文件：`backend/main.py`

参考实现：

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.init_db import init_database
from api.records import router as records_router
from api.statistics import router as statistics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield


app = FastAPI(
    title="个人记账本 API",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(records_router)
app.include_router(statistics_router)
```

数据库将在 FastAPI 启动时自动初始化。

## 7. 前端开发规范

### 7.1 页面结构

`frontend/index.html` 负责页面整体结构。

建议包含：

- 顶部导航栏。
- 收支概览区域。
- 新增记账表单。
- 历史账单列表。
- 统计展示区域。

### 7.2 API 请求封装

文件：`frontend/js/api.js`

统一封装请求：

```javascript
const API_BASE = "http://127.0.0.1:8000";


async function request(path, options = {}) {
    const response = await fetch(
        `${API_BASE}${path}`,
        {
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        }
    );

    if (!response.ok) {
        const error = await response.json();

        throw new Error(
            error.detail || "请求失败"
        );
    }

    return response.json();
}


const api = {
    getRecords(params = {}) {
        const query = new URLSearchParams(params);

        return request(
            `/api/records/?${query.toString()}`
        );
    },

    createRecord(data) {
        return request("/api/records/", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    deleteRecord(id) {
        return request(`/api/records/${id}`, {
            method: "DELETE"
        });
    },

    getSummary(params = {}) {
        const query = new URLSearchParams(params);

        return request(
            `/api/stats/summary?${query.toString()}`
        );
    }
};
```

### 7.3 前端模块职责

| 文件 | 职责 |
|---|---|
| api.js | 统一管理 HTTP 请求 |
| records.js | 新增、删除和展示账单 |
| statistics.js | 获取和展示统计信息 |
| main.js | 页面初始化和模块协调 |
| style.css | 页面样式 |

前端开发要求：

- 不要在每个页面模块中重复编写 fetch 请求。
- 用户输入金额时转换成分后再发送。
- 显示金额时将分转换成元。
- 用户输入的备注等内容使用 `textContent` 展示，避免直接拼接不可信 HTML。
- API 请求失败时向用户展示错误信息。

## 8. 开发环境配置

### 8.1 安装 Python 依赖

进入后端目录：

```bash
cd backend
```

创建虚拟环境：

```bash
python -m venv .venv
```

激活虚拟环境：

Windows：

```powershell
.venv\Scripts\activate
```

Linux / WSL：

```bash
source .venv/bin/activate
```

安装依赖：

```bash
pip install fastapi uvicorn
```

`requirements.txt`：

```text
fastapi
uvicorn
```

SQLite 是 Python 标准库的一部分，不需要额外安装。

### 8.2 启动后端

在 `backend/` 目录执行：

```bash
uvicorn main:app --reload
```

后端地址：

```text
http://127.0.0.1:8000
```

Swagger API 文档：

```text
http://127.0.0.1:8000/docs
```

### 8.3 启动前端

在项目根目录执行：

```bash
python -m http.server 5500 --directory frontend
```

前端访问地址：

```text
http://127.0.0.1:5500
```

## 9. 团队协作与模块分工

建议根据实际人数分配模块。以下以四人团队为例。

| 成员 | 负责模块 | 主要文件 |
|---|---|---|
| 成员 A | 数据库和记录管理 | database/、repositories/、record_service.py |
| 成员 B | 查询和统计 | query_service.py、statistics_service.py、statistics API |
| 成员 C | 后端接口与系统集成 | main.py、records API、接口联调 |
| 成员 D | Web 前端 | frontend/ |

注意：

- 每个人必须实际负责并完成自己的模块。
- 不要直接修改其他成员尚未完成的代码。
- 接口字段、路径、金额单位必须提前统一。
- 发生冲突时先沟通，再进行合并。
- 每位成员都应有自己的真实代码提交记录。

### 9.1 Git 分支建议

```text
main
│
├── feature/database
├── feature/record
├── feature/statistics
└── feature/frontend
```

创建分支：

```bash
git checkout -b feature/record
```

提交代码：

```bash
git add .
git commit -m "feat: implement record management"
```

推送分支：

```bash
git push -u origin feature/record
```

完成后通过 GitHub Pull Request 合并到主分支。

### 9.2 Commit Message 规范

建议使用以下格式：

```text
feat: 新增功能
fix: 修复问题
docs: 更新文档
refactor: 重构代码
test: 增加测试
style: 调整代码格式
```

示例：

```bash
git commit -m "feat: add income and expense records"
git commit -m "feat: implement category statistics"
git commit -m "fix: correct amount conversion"
git commit -m "docs: update API documentation"
```

## 10. 测试要求

### 10.1 功能测试

至少测试：

- 新增收入。
- 新增支出。
- 查询所有记录。
- 查询最近 10 条记录。
- 按类别筛选。
- 按日期范围筛选。
- 删除记录。
- 统计收入和支出。
- 统计类别金额。

### 10.2 异常测试

至少测试：

- 金额为 0。
- 金额为负数。
- 非法收支类型。
- 日期格式错误。
- 类别为空。
- 删除不存在的记录。
- 后端服务未启动时前端的提示。

### 10.3 数据一致性测试

例如新增：

- 工资收入：5000 元。
- 饮食支出：30 元。
- 交通支出：20 元。

预期结果：

```text
总收入：5000.00 元
总支出：50.00 元
当前结余：4950.00 元
```

## 11. GitHub Release 发布

项目完成后：

1. 检查主分支代码。
2. 确认前后端可以正常启动。
3. 测试主要功能。
4. 更新 README.md。
5. 提交所有已经完成的修改。
6. 在 GitHub 创建 Release。

建议版本号：

```text
v1.0.0
```

Release 标题：

```text
个人记账本系统 V1.0.0
```

Release 说明应包含：

- 项目简介。
- 已实现功能。
- 技术栈。
- 运行方法。
- 已知问题。

## 12. 开发顺序建议

### 第一阶段：确定规范

- 确认目录结构。
- 确认数据库字段。
- 确认 API 路径。
- 确认金额单位。

### 第二阶段：实现后端

- 创建 SQLite 数据库。
- 实现新增、查询、删除。
- 实现筛选功能。
- 实现统计功能。
- 使用 Swagger 测试接口。

### 第三阶段：实现前端

- 完成页面布局。
- 封装 API 请求。
- 实现新增记录表单。
- 实现历史记录展示。
- 实现统计数据展示。

### 第四阶段：联调和测试

- 前后端联调。
- 检查金额转换。
- 测试数据持久化。
- 修复异常。
- 完善页面。

### 第五阶段：发布

- 合并代码。
- 更新 README。
- 发布 GitHub Release。

## 13. 项目完成检查清单

- [ ] 数据库可以自动初始化。
- [ ] 可以新增收入记录。
- [ ] 可以新增支出记录。
- [ ] 可以查询历史记录。
- [ ] 可以删除记录。
- [ ] 可以按日期筛选。
- [ ] 可以按类别筛选。
- [ ] 可以统计总收入。
- [ ] 可以统计总支出。
- [ ] 可以计算结余。
- [ ] 前端可以正常调用后端 API。
- [ ] 数据在服务重启后仍然存在。
- [ ] README 包含完整运行说明。
- [ ] 每位成员有真实的模块开发和提交记录。
- [ ] GitHub Release 已发布。
