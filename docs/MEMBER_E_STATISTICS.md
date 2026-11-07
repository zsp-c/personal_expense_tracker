# 成员 E：收支统计模块负责人

**独立模块：收支汇总与类别统计（任务 05，后端）**

> 本文件用于明确模块 E 的负责范围与协作边界。请 Agent 与协作同学严格遵守下方「协作约束」，**不要改动本模块职责之外的任何文件**。

## 具体任务

1. 实现总收入统计。
2. 实现总支出统计。
3. 实现结余计算（结余 = 总收入 − 总支出）。
4. 支持按日期范围（开始日期 / 结束日期）统计。
5. 实现按类别汇总金额。
6. 支持按收入（`income`）或支出（`expense`）类型统计类别。
7. 处理无记录时的统计结果：金额统一返回 **0** 而不是 `null`，类别统计返回空列表 `[]`。
8. 与成员 I（仪表盘与统计展示）确认统计 API 的响应格式。

## 负责文件

```text
backend/services/statistics_service.py
backend/api/statistics.py
```

- `backend/services/statistics_service.py`：统计业务逻辑（汇总、类别统计），仅通过 `database.connection.get_connection()` 访问数据库。
- `backend/api/statistics.py`：统计接口层（`GET /api/stats/summary`、`GET /api/stats/category`），调用 Service 层，不写业务规则。

## 验收标准

使用以下测试数据（金额单位：元 → 分）：

- 工资收入 5000 元 → 500000 分
- 饮食支出 30 元 → 3000 分
- 交通支出 20 元 → 2000 分

预期统计（`GET /api/stats/summary`）：

```json
{ "income": 500000, "expense": 5000, "balance": 495000 }
```

- 空表时 `summary` 返回 `{ "income": 0, "expense": 0, "balance": 0 }`，不应返回 `null`。
- 类别统计按金额降序、类别升序排序。
- SQL 全部使用 `?` 参数占位符。

## 协作约束（重要）

> **给 Agent 与协作同学：**
>
> 1. **只修改本模块负责文件**（`backend/services/statistics_service.py`、`backend/api/statistics.py`）。
> 2. **不要改动其他成员负责的文件**，包括但不限于：
>    - 数据库层 `backend/database/`（成员 B）
>    - 记录增删 `backend/repositories/record_repository.py`、`backend/services/record_service.py`、`backend/models/record.py`（成员 C）
>    - 记录查询 `backend/services/query_service.py` 等（成员 D）
>    - 路由注册 `backend/main.py`（成员 A）
>    - 前端 `frontend/`（成员 F / G / H / I）
>    - 测试 `backend/tests/`（成员 J）、文档 `docs/TEST_REPORT.md`（成员 K）、`README.md` 等（成员 L）
> 3. 若发现**其他文件**存在问题（如数据库未初始化、路由未注册、前端未对接），**请直接告知对应负责人去修改**，不要由本 Agent 顺手改掉。
> 4. 提交时只 `git add` 上述两个负责文件；不要在提交中混入他人文件。

## 建议分支与提交

```bash
git checkout -b feature/statistics
git add backend/services/statistics_service.py backend/api/statistics.py
git commit -m "feat: implement income and expense statistics"
git push -u origin feature/statistics
# 合并到 dev
git checkout dev
git merge feature/statistics
git push origin dev
```
