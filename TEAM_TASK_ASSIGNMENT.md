# 个人记账本系统——12 人团队任务分工文档

**项目名称：** 个人记账本系统（Personal Account Book）  
**项目版本：** V1.0  
**团队人数：** 12 人  
**技术栈：** HTML + CSS + JavaScript、Python + FastAPI、SQLite（Python 标准库 `sqlite3`）  
**项目目标：** 在规定时间内完成可运行、可演示、可验收的个人记账 Web 应用。

---

## 一、团队分工总览

本项目按模块拆分为后端、前端、测试与项目管理四个方向。每位成员必须实际完成至少一个模块，并通过自己的 Git 分支和提交记录体现工作成果。

| 编号 | 成员 | 负责方向 | 独立负责模块 | 主要交付物 |
|---|---|---|---|---|
| 01 | 成员 A | 项目集成 | 项目骨架、启动入口、集成协调 | 可启动的项目骨架、集成后的主程序 |
| 02 | 成员 B | 后端 | SQLite 数据库设计与初始化 | 数据库连接、建表和初始化代码 |
| 03 | 成员 C | 后端 | 收支记录新增与删除 | 记录写入、删除 Repository / Service |
| 04 | 成员 D | 后端 | 收支记录查询与筛选 | 查询 Repository / Service、筛选接口 |
| 05 | 成员 E | 后端 | 收支统计 | 汇总统计、类别统计接口 |
| 06 | 成员 F | 前端 | 页面整体结构与导航 | `index.html`、页面区域结构 |
| 07 | 成员 G | 前端 | 新增记账表单 | 表单交互、输入校验、提交逻辑 |
| 08 | 成员 H | 前端 | 历史账单列表 | 记录展示、筛选控件、删除交互 |
| 09 | 成员 I | 前端 | 仪表盘与统计展示 | 收支卡片、统计数据展示、图表（可选） |
| 10 | 成员 J | 测试 | 后端 API 测试 | API 测试用例、缺陷记录 |
| 11 | 成员 K | 测试与质量 | 前后端联调、异常与数据一致性测试 | 联调记录、验收清单、问题复测 |
| 12 | 成员 L | 文档与发布 | README、使用说明、演示与 Release 材料 | 项目文档、演示脚本、Release 说明 |

> 请将“成员 A～L”替换为团队真实姓名。若团队人数或成员能力不同，可以调整人员，但每个人必须保留清晰、可验收的独立模块。

---

## 二、全员必须遵守的统一约定

### 2.1 技术约定

- 前端：原生 HTML、CSS、JavaScript。
- 后端：Python、FastAPI、Pydantic。
- 数据库：SQLite，使用 Python 自带的 `sqlite3`，不额外安装数据库服务。
- 前后端通过 HTTP + JSON 通信。
- API 测试使用 FastAPI 自动生成的 `/docs` 页面。
- 图表库 ECharts 属于可选项，先完成基础功能。

### 2.2 数据库字段约定

表名：`records`

| 字段 | SQLite 类型 | 约束 / 说明 |
|---|---|---|
| `id` | INTEGER | 主键，自增 |
| `date` | TEXT | 必填，格式 `YYYY-MM-DD` |
| `type` | TEXT | 必填，只允许 `income` / `expense` |
| `amount` | INTEGER | 必填，必须大于 0，单位为“分” |
| `category` | TEXT | 必填，类别名称 |
| `remark` | TEXT | 可选，默认空字符串 |
| `created_at` | TEXT | 创建时间，默认 `CURRENT_TIMESTAMP` |

建表 SQL：

```sql
CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount INTEGER NOT NULL CHECK(amount > 0),
    category TEXT NOT NULL,
    remark TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**金额规则必须统一：**

- 前端输入和显示使用“元”。
- 前端提交前转换为“分”，例如 `35.50` 元转换为 `3550`。
- 后端和数据库内部统一使用整数“分”。
- 后端统计接口返回的金额也统一为“分”。
- 前端展示时除以 100 并保留两位小数。
- 不允许一部分接口传元、另一部分接口传分。

### 2.3 API 接口约定

所有成员按照以下路径和字段开发，不要各自另起一套接口。

| 功能 | 方法 | 路径 | 说明 |
|---|---|---|---|
| 新增记录 | POST | `/api/records/` | 新增收入或支出 |
| 查询记录 | GET | `/api/records/` | 支持日期、类型、类别、数量筛选 |
| 删除记录 | DELETE | `/api/records/{record_id}` | 删除指定记录 |
| 收支汇总 | GET | `/api/stats/summary` | 返回收入、支出、结余 |
| 类别统计 | GET | `/api/stats/category` | 按类别汇总金额 |

新增记录请求示例：

```json
{
  "date": "2026-11-07",
  "type": "expense",
  "amount": 3550,
  "category": "饮食",
  "remark": "午餐"
}
```

查询参数建议：

- `start_date`：开始日期。
- `end_date`：结束日期。
- `type`：`income` 或 `expense`。
- `category`：类别。
- `limit`：返回数量，默认 10，建议设置最大值。

汇总响应示例：

```json
{
  "income": 100000,
  "expense": 35500,
  "balance": 64500
}
```

以上金额单位均为分。

### 2.4 代码协作约定

- 每个人在自己的功能分支开发，不要多人同时直接修改同一个文件。
- 合并前先拉取最新主分支，解决冲突后再提交 PR。
- SQL 必须使用参数化查询，不允许直接拼接用户输入。
- 前端展示用户输入内容时优先使用 `textContent`，避免不安全的 HTML 拼接。
- 不要提交虚拟环境目录、缓存文件和本地数据库中的个人测试数据。
- 不允许伪造提交、代替他人完成模块或只提交空文件；提交记录必须对应真实完成的工作。

---

## 三、每位成员的详细任务

## 成员 A：项目骨架与集成负责人

**独立模块：项目骨架与应用集成**

### 具体任务

1. 创建项目根目录和前后端目录。
2. 建立统一目录结构。
3. 创建 FastAPI 主入口 `backend/main.py`。
4. 注册 records 和 statistics 两组 API 路由。
5. 配置 FastAPI lifespan，在服务启动时调用数据库初始化函数。
6. 配置开发阶段的 CORS。
7. 维护接口约定，协调各模块集成。
8. 负责合并 PR，解决集成冲突，但不得代替成员编写其负责模块。

### 负责文件

```text
backend/main.py
backend/requirements.txt
.gitignore
```

### 验收标准

- 在 `backend/` 目录执行 `uvicorn main:app --reload` 可以启动服务。
- 访问 `http://127.0.0.1:8000/docs` 可以打开 Swagger 页面。
- 数据库初始化函数能够在服务启动时被调用。
- records 和 statistics 路由可以正常注册。

### 建议分支与提交

```bash
git checkout -b feature/project-integration
git add backend/main.py backend/requirements.txt .gitignore
git commit -m "feat: initialize FastAPI application"
```

---

## 成员 B：SQLite 数据库模块负责人

**独立模块：数据库连接与初始化**

### 具体任务

1. 使用 `sqlite3` 建立数据库连接。
2. 将数据库文件放在 `backend/data/account_book.db`。
3. 实现 `get_connection()`。
4. 实现 `init_database()`。
5. 创建 `records` 表。
6. 设置 `row_factory`，使查询结果可按字段名访问。
7. 确保连接在操作结束后关闭。
8. 编写数据库初始化和基本增删查测试。

### 负责文件

```text
backend/database/__init__.py
backend/database/connection.py
backend/database/init_db.py
```

### 验收标准

- 首次运行时能够自动创建 `data/` 目录和数据库文件。
- 多次初始化不会重复创建表或报错。
- `records` 表字段和统一约定一致。
- 可以通过 Python 脚本插入并读取一条测试数据。
- 数据库文件不应被误提交为团队共享的测试数据。

### 建议分支与提交

```bash
git checkout -b feature/database
git add backend/database/
git commit -m "feat: implement SQLite database initialization"
```

---

## 成员 C：新增与删除记录模块负责人

**独立模块：收支记录写入与删除**

### 具体任务

1. 定义新增记录所需的 Pydantic 模型，或与成员 D 协商共用模型文件。
2. 实现新增记录的 Repository 方法。
3. 实现删除记录的 Repository 方法。
4. 在 Service 层处理新增和删除业务。
5. 对金额、类别、日期和类型进行校验。
6. 新增成功后返回记录 ID。
7. 删除不存在的记录时返回明确的 404 错误。

### 负责文件

```text
backend/models/record.py
backend/repositories/record_repository.py
backend/services/record_service.py
```

> `record.py` 和 `record_repository.py` 可能与成员 D 的查询工作有交集。开发前应明确由成员 C 建立基础文件和数据结构，成员 D 通过单独的查询模块扩展，或由成员 A 负责最终合并。不要两个人同时覆盖同一个文件。

### 验收标准

- 能够成功写入一条收入记录和一条支出记录。
- 金额为 0、负数或非法类型时不能入库。
- 删除指定 ID 后数据库中不再存在该记录。
- 删除不存在的 ID 时返回 404。
- SQL 使用 `?` 参数占位符。

### 建议分支与提交

```bash
git checkout -b feature/record-write
git add backend/models/ backend/repositories/ backend/services/
git commit -m "feat: implement record creation and deletion"
```

---

## 成员 D：记录查询与筛选模块负责人

**独立模块：账单查询与条件筛选**

### 具体任务

1. 实现查询全部记录的方法。
2. 默认按照日期倒序排列，同一天按 ID 倒序排列。
3. 支持开始日期和结束日期筛选。
4. 支持按收入 / 支出类型筛选。
5. 支持按类别筛选。
6. 支持 `limit` 限制返回数量，并限制最大值。
7. 处理无筛选条件和组合筛选条件。
8. 与成员 H 对齐前端列表所需字段。

### 负责文件

```text
backend/repositories/query_repository.py
backend/services/query_service.py
```

如团队决定将查询方法统一放在 `record_repository.py`，应先与成员 C 和成员 A 协商文件所有权。

### 验收标准

- 无筛选条件时能够查询全部记录。
- 日期范围筛选结果正确。
- 类型筛选结果正确。
- 类别筛选结果正确。
- 多个条件组合时结果正确。
- 默认或指定数量限制有效，不会无限返回大量记录。

### 建议分支与提交

```bash
git checkout -b feature/record-query
git add backend/repositories/query_repository.py backend/services/query_service.py
git commit -m "feat: implement record query and filters"
```

---

## 成员 E：收支统计模块负责人

**独立模块：收支汇总与类别统计**

### 具体任务

1. 实现总收入统计。
2. 实现总支出统计。
3. 实现结余计算。
4. 支持按日期范围统计。
5. 实现按类别汇总金额。
6. 支持按收入或支出类型统计类别。
7. 处理无记录时的统计结果，金额应返回 0 而不是 null。
8. 与成员 I 确认统计 API 的响应格式。

### 负责文件

```text
backend/services/statistics_service.py
backend/api/statistics.py
```

### 验收标准

使用以下测试数据：

- 工资收入 5000 元。
- 饮食支出 30 元。
- 交通支出 20 元。

预期统计：

```text
总收入：5000.00 元
总支出：50.00 元
结余：4950.00 元
```

后端响应中的金额应分别为 `500000`、`5000`、`495000`，单位为分。

### 建议分支与提交

```bash
git checkout -b feature/statistics
git add backend/services/statistics_service.py backend/api/statistics.py
git commit -m "feat: implement income and expense statistics"
```

---

## 成员 F：前端页面结构负责人

**独立模块：Web 页面骨架与导航**

### 具体任务

1. 创建主页面 `index.html`。
2. 划分仪表盘、记账表单、账单列表和统计区域。
3. 创建导航栏或页面切换入口。
4. 为各功能模块预留稳定的 DOM 容器和 ID。
5. 引入 CSS 和 JavaScript 文件。
6. 检查页面在常见桌面浏览器中的布局。

### 负责文件

```text
frontend/index.html
```

### 验收标准

- 浏览器打开页面时结构完整。
- 页面有清晰的功能区域。
- 表单、账单列表和统计区域有明确容器。
- 成员 G、H、I 可以按照约定的 DOM ID 接入功能。
- 不应在页面结构中写死虚假的统计结果作为真实数据。

### 建议分支与提交

```bash
git checkout -b feature/frontend-layout
git add frontend/index.html
git commit -m "feat: build main web page layout"
```

---

## 成员 G：新增记账表单负责人

**独立模块：收入与支出录入**

### 具体任务

1. 实现收入 / 支出类型切换。
2. 实现金额输入框。
3. 实现日期选择。
4. 实现类别选择。
5. 实现备注输入。
6. 对必填项和金额格式进行前端校验。
7. 将用户输入的元转换为整数分。
8. 调用 `POST /api/records/`。
9. 成功后提示用户，并通知列表和统计模块刷新。

### 负责文件

```text
frontend/js/record-form.js
```

### 验收标准

- 可以录入收入和支出。
- 金额为空、为负数或格式非法时给出提示。
- 35.50 元提交给后端时为 3550。
- 提交成功后显示成功反馈。
- 接口失败时显示错误提示，不应静默失败。

### 建议分支与提交

```bash
git checkout -b feature/record-form
git add frontend/js/record-form.js
git commit -m "feat: implement income and expense form"
```

---

## 成员 H：历史账单列表负责人

**独立模块：账单展示、筛选与删除**

### 具体任务

1. 调用 `GET /api/records/` 获取账单。
2. 展示日期、类型、金额、类别和备注。
3. 默认展示最近 10 条记录。
4. 实现日期范围筛选控件。
5. 实现类型和类别筛选控件。
6. 实现删除按钮。
7. 删除前进行二次确认。
8. 删除成功后刷新列表和相关统计数据。
9. 对空列表和接口错误提供友好提示。

### 负责文件

```text
frontend/js/records-list.js
```

### 验收标准

- 列表数据来自后端，不使用写死的模拟数据代替实际接口。
- 筛选条件能够正确传递到 API。
- 金额按元展示，保留两位小数。
- 删除操作能够真实删除数据库记录。
- 用户备注等文本使用安全的 DOM 文本接口展示。

### 建议分支与提交

```bash
git checkout -b feature/records-list
git add frontend/js/records-list.js
git commit -m "feat: implement transaction list and filters"
```

---

## 成员 I：仪表盘与统计展示负责人

**独立模块：收支概览与统计可视化**

### 具体任务

1. 调用 `GET /api/stats/summary`。
2. 展示总收入、总支出和结余。
3. 调用 `GET /api/stats/category`。
4. 展示不同类别的收入或支出汇总。
5. 支持日期范围变化后重新加载统计数据。
6. 将后端返回的分转换为元显示。
7. 如果时间允许，使用 ECharts 实现支出类别饼图或收支对比图。

### 负责文件

```text
frontend/js/statistics.js
```

### 验收标准

- 页面统计数字来自后端接口。
- 金额单位转换正确。
- 日期筛选变化后统计结果更新。
- 没有记录时展示 0 或空状态。
- 图表属于可选项，不能影响基础统计数字展示。

### 建议分支与提交

```bash
git checkout -b feature/dashboard-statistics
git add frontend/js/statistics.js
git commit -m "feat: implement dashboard statistics"
```

---

## 成员 J：后端 API 测试负责人

**独立模块：后端接口测试**

### 具体任务

1. 整理所有后端 API 的正常请求用例。
2. 测试新增收入和支出。
3. 测试查询、筛选和删除。
4. 测试统计接口。
5. 测试非法金额、非法类型和错误日期。
6. 测试删除不存在的记录。
7. 记录实际响应、预期响应和问题。
8. 将发现的问题反馈给对应开发成员。

### 负责文件

```text
backend/tests/test_records_api.py
backend/tests/test_statistics_api.py
```

可使用 FastAPI `TestClient` 和 `pytest`；若时间紧张，也可以先整理 Swagger `/docs` 手工测试用例和测试结果文档。

### 验收标准

- 每个核心接口至少有一个正常测试用例。
- 新增、删除和统计接口均有异常测试。
- 测试结果可复现。
- 缺陷有明确的复现步骤和预期结果。

### 建议分支与提交

```bash
git checkout -b test/backend-api
git add backend/tests/
git commit -m "test: add backend API tests"
```

---

## 成员 K：前后端联调与质量保障负责人

**独立模块：系统联调和端到端验收**

### 具体任务

1. 使用统一的启动方式运行前后端。
2. 检查浏览器能否正常访问 FastAPI。
3. 验证新增记录后列表是否更新。
4. 验证删除记录后统计是否更新。
5. 验证日期、类别和类型筛选。
6. 验证服务重启后数据仍然存在。
7. 检查金额元 / 分转换是否一致。
8. 记录页面错误、接口错误和数据不一致问题。
9. 对开发成员修复的问题进行复测。

### 负责文件

```text
docs/TEST_REPORT.md
```

也可以维护一份缺陷清单，记录问题、负责人、修复状态和复测结果。

### 验收标准

- 至少完成一条从前端新增到数据库保存、再到列表显示的完整流程。
- 至少完成一条删除后统计同步更新的流程。
- 完成核心功能验收清单。
- 严重问题已修复，未修复问题有明确记录。

### 建议分支与提交

```bash
git checkout -b test/integration
git add docs/TEST_REPORT.md
git commit -m "test: document integration and acceptance results"
```

---

## 成员 L：项目文档与发布负责人

**独立模块：项目说明、演示材料与 Release**

### 具体任务

1. 编写项目根目录 `README.md`。
2. 说明项目背景、功能和技术栈。
3. 编写环境安装步骤。
4. 编写前后端启动步骤。
5. 说明数据库文件的生成位置。
6. 整理项目截图或演示流程。
7. 编写 GitHub Release 说明。
8. 检查仓库中是否误提交 `.venv`、缓存和本地测试数据库。
9. 与成员 A 确认主分支代码状态后准备发布。

### 负责文件

```text
README.md
docs/USER_GUIDE.md
docs/RELEASE_NOTES.md
```

### 验收标准

- 新成员只看 README 就能启动项目。
- 文档中的命令与实际目录结构一致。
- Release 说明包含项目简介、主要功能、运行方式和已知问题。
- Release 对应的是已经提交并验证过的代码版本。

### 建议分支与提交

```bash
git checkout -b docs/project-documentation
git add README.md docs/
git commit -m "docs: add project and release documentation"
```

---

## 四、文件所有权与协作边界

为了避免多人修改同一个文件造成 Git 冲突，建议采用以下文件边界：

| 文件 / 目录 | 主负责人 | 协作说明 |
|---|---|---|
| `backend/main.py` | A | 其他成员通过路由模块提供 router |
| `backend/database/` | B | 其他成员只调用连接和初始化函数 |
| `backend/models/record.py` | C | D 提出查询需要的模型字段，不直接覆盖文件 |
| `backend/repositories/record_repository.py` | C | D 优先新建 `query_repository.py` |
| `backend/services/record_service.py` | C | D 使用独立 `query_service.py` |
| `backend/services/statistics_service.py` | E | 其他成员只通过 API 使用 |
| `backend/api/records.py` | C | A 负责集成，不重复实现业务 |
| `backend/api/statistics.py` | E | A 负责注册路由 |
| `frontend/index.html` | F | 其他前端成员先约定 DOM ID |
| `frontend/js/record-form.js` | G | 仅负责表单和新增请求 |
| `frontend/js/records-list.js` | H | 仅负责列表、筛选和删除 |
| `frontend/js/statistics.js` | I | 仅负责统计数据和图表 |
| `docs/TEST_REPORT.md` | K | 测试过程和缺陷状态 |
| `README.md`、发布文档 | L | 发布前与 A 核对 |

**特别注意：** 如果多人必须共同修改某个文件，应由文件主负责人先创建基础版本，其他成员通过小型 PR 提交修改，避免各自复制一份后整体覆盖。

---

## 五、推荐开发时间安排

以下是一个适用于短周期课程项目的相对时间安排，团队应根据实际截止时间调整。

| 阶段 | 主要工作 | 参与成员 | 阶段产物 |
|---|---|---|---|
| 第一阶段：规范确定 | 确认目录、数据库字段、API 和金额单位 | 全员，A 组织 | 接口约定、项目骨架 |
| 第二阶段：并行开发 | 后端模块和前端模块独立开发 | B～I | 可合并的功能分支 |
| 第三阶段：接口测试 | 后端接口测试和问题修复 | C、D、E、J | API 测试结果 |
| 第四阶段：前后端联调 | 页面接入 API，检查数据一致性 | A、F～I、K | 可演示系统 |
| 第五阶段：验收与发布 | 修复阻塞问题、完善文档、发布版本 | 全员，A、J、K、L 重点负责 | Release、演示材料 |

### 优先级原则

**必须优先完成：**

1. 数据库初始化。
2. 新增收入和支出。
3. 查询历史记录。
4. 删除记录。
5. 日期、类型和类别筛选。
6. 收支汇总统计。
7. 前后端联调。

**有余力再完成：**

- 编辑记录。
- ECharts 图表。
- CSV 导出。
- 月度趋势图。
- 预算管理。

如果进度落后，应先保证 P0 核心功能可运行，不要为了图表或动画牺牲基本记账功能。

---

## 六、GitHub 协作流程

### 6.1 克隆仓库

```bash
git clone <团队仓库地址>
cd personal-account-book
```

### 6.2 创建个人功能分支

```bash
git checkout main
git pull origin main
git checkout -b feature/your-module
```

### 6.3 提交真实完成的代码

```bash
git add <自己负责的文件>
git commit -m "feat: describe your completed work"
git push -u origin feature/your-module
```

### 6.4 创建 Pull Request

1. 在 GitHub 上创建 Pull Request。
2. 描述自己完成的模块。
3. 写明测试方式和测试结果。
4. 请成员 A 或指定审核人检查。
5. 通过后合并到主分支。

### 6.5 提交规范

建议使用：

```text
feat: 新增功能
fix: 修复问题
docs: 更新文档
test: 增加测试
refactor: 重构代码
style: 调整格式
```

提交应体现真实工作内容。不要为了增加提交数量而拆分无意义提交，也不要伪造其他成员的工作记录。

---

## 七、最终验收清单

### 后端

- [ ] FastAPI 能正常启动。
- [ ] SQLite 数据库能自动创建。
- [ ] 可以新增收入。
- [ ] 可以新增支出。
- [ ] 可以查询历史记录。
- [ ] 可以按日期筛选。
- [ ] 可以按类型筛选。
- [ ] 可以按类别筛选。
- [ ] 可以删除记录。
- [ ] 可以统计收入、支出和结余。
- [ ] 可以按类别统计。
- [ ] 非法数据会被拒绝。

### 前端

- [ ] 页面能够正常打开。
- [ ] 新增表单可用。
- [ ] 账单列表可用。
- [ ] 筛选控件可用。
- [ ] 删除操作可用。
- [ ] 收支概览可用。
- [ ] 金额显示正确。
- [ ] 错误提示清晰。

### 测试与发布

- [ ] 核心 API 已测试。
- [ ] 前后端主要流程已联调。
- [ ] 服务重启后数据仍然存在。
- [ ] README 能指导新成员启动项目。
- [ ] 每位成员都有真实的模块代码或测试 / 文档交付及对应提交记录。
- [ ] 所有已完成工作已合并到主分支。
- [ ] GitHub Release 已创建。

---

## 八、团队成员任务确认表

请团队负责人将真实姓名填入下表，并在任务完成后更新状态。

| 编号 | 成员姓名 | 负责模块 | 分支 / PR | 状态 | 验收人 |
|---|---|---|---|---|---|
| 01 |  | 项目骨架与集成 |  | 未开始 |  |
| 02 |  | SQLite 数据库 |  | 未开始 |  |
| 03 |  | 新增与删除记录 |  | 未开始 |  |
| 04 |  | 查询与筛选 |  | 未开始 |  |
| 05 |  | 收支统计 |  | 未开始 |  |
| 06 |  | 前端页面结构 |  | 未开始 |  |
| 07 |  | 新增记账表单 |  | 未开始 |  |
| 08 |  | 历史账单列表 |  | 未开始 |  |
| 09 |  | 仪表盘与统计展示 |  | 未开始 |  |
| 10 |  | 后端 API 测试 |  | 未开始 |  |
| 11 |  | 联调与质量保障 |  | 未开始 |  |
| 12 |  | 文档与发布 |  | 未开始 |  |

**完成定义：** 每个模块至少应有可检查的代码、测试结果或文档交付物；仅领取任务、创建空文件或提交无实际内容的代码，不视为完成。
