# 个人记账本系统（Personal Account Book）

基于 **FastAPI + SQLite + 原生 HTML/CSS/JavaScript** 的轻量级个人记账 Web 应用，支持收入与支出的记录、查询、筛选和统计。

## 项目结构

```text
personal-account-book/
├── backend/
│   ├── main.py                  # FastAPI 入口
│   ├── requirements.txt
│   ├── database/                # 连接与建表
│   ├── models/                  # Pydantic 数据模型
│   ├── repositories/            # SQL 数据访问
│   ├── services/                # 业务逻辑
│   ├── api/                     # HTTP 接口
│   └── data/                    # account_book.db（自动生成）
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/                      # api / records / statistics / main
├── docs/
│   ├── PRD.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── TEAM_TASK_ASSIGNMENT.md
├── .gitignore
└── README.md
```

## 运行方式

### 1. 启动后端

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / WSL
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

- API 地址：http://127.0.0.1:8000
- Swagger 文档：http://127.0.0.1:8000/docs

数据库 `backend/data/account_book.db` 会在服务启动时自动创建。

### 2. 启动前端

在项目根目录执行：

```bash
python -m http.server 5500 --directory frontend
```

访问 http://127.0.0.1:5500

## 统一约定

- **金额单位**：前端展示与输入使用「元」，提交前转换为「分」；后端与数据库内部统一使用整数「分」。
- **数据库字段**：`id / date / type / amount / category / remark / created_at`。
- **SQL**：必须使用 `?` 参数绑定。
- **分层**：API → Service → Repository → SQLite，API 层不写复杂 SQL。

详细规范见 [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)，需求见 [docs/PRD.md](docs/PRD.md)，分工见 [docs/TEAM_TASK_ASSIGNMENT.md](docs/TEAM_TASK_ASSIGNMENT.md)。

## 当前状态

项目骨架已建立：路由、分层、模型和前端页面结构已就位；标有 `TODO(成员 X)` 的函数为待实现模块，由对应负责人补全。
