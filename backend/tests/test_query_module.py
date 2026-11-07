"""成员 D 模块单元测试：记录查询与条件筛选。

覆盖：
- 默认排序（date DESC, id DESC）
- 日期区间、类型、类别筛选及组合筛选
- limit 默认值与上限截断、offset 翻页
- 单条查询与参数校验
- SQL 注入防护

两种运行方式：
    pytest tests/test_query_module.py
    python tests/test_query_module.py
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.connection import DB_PATH, get_connection
from database.init_db import init_database
from services import query_service

# 测试数据：6 条记录，覆盖同一天多条、收入/支出、多个类别。
SAMPLE_ROWS = [
    ("2026-11-01", "expense", 3550, "饮食", "午餐"),
    ("2026-11-01", "income", 100000, "奖学金", "助学金"),
    ("2026-11-03", "expense", 1200, "交通", "地铁"),
    ("2026-11-05", "income", 2000, "兼职", "周末"),
    ("2026-11-05", "expense", 8800, "购物", "日用品"),
    ("2026-11-07", "expense", 2500, "饮食", "早餐"),
]


def setup_data():
    """建库并写入测试数据。"""
    init_database()
    conn = get_connection()
    try:
        conn.executemany(
            "INSERT INTO records (date, type, amount, category, remark) VALUES (?, ?, ?, ?, ?)",
            SAMPLE_ROWS,
        )
        conn.commit()
    finally:
        conn.close()


def teardown_data():
    """删除测试数据库，不留个人测试数据。"""
    for suffix in ("", "-journal", "-wal", "-shm"):
        path = str(DB_PATH) + suffix
        if os.path.exists(path):
            os.remove(path)


# ---------------------------------------------------------------- 用例
def test_list_all_without_filters():
    """无筛选条件时返回全部记录。"""
    result = query_service.list_records()
    assert len(result) == len(SAMPLE_ROWS)


def test_default_order_by_date_and_id_desc():
    """默认按日期倒序；同一天按 id 倒序。"""
    result = query_service.list_records()
    assert result[0]["date"] == "2026-11-07"
    same_day = [r["id"] for r in result if r["date"] == "2026-11-05"]
    assert same_day == sorted(same_day, reverse=True)


def test_filter_by_date_range():
    """开始日期与结束日期区间筛选。"""
    result = query_service.list_records(start_date="2026-11-01", end_date="2026-11-03")
    assert len(result) == 3
    assert all("2026-11-01" <= r["date"] <= "2026-11-03" for r in result)


def test_filter_by_type():
    """按收入 / 支出类型筛选。"""
    income = query_service.list_records(type="income")
    expense = query_service.list_records(type="expense")
    assert len(income) == 2 and all(r["type"] == "income" for r in income)
    assert len(expense) == 4 and all(r["type"] == "expense" for r in expense)


def test_filter_by_category():
    """按类别精确筛选。"""
    result = query_service.list_records(category="饮食")
    assert len(result) == 2
    assert {r["category"] for r in result} == {"饮食"}


def test_filter_combined_conditions():
    """多个条件组合筛选。"""
    result = query_service.list_records(
        start_date="2026-11-01", end_date="2026-11-05", type="expense"
    )
    assert len(result) == 3
    result = query_service.list_records(type="expense", category="饮食")
    assert len(result) == 2


def test_limit_and_max_limit():
    """limit 生效，且超过上限被截断而不是报错。"""
    assert len(query_service.list_records(limit=2)) == 2
    assert len(query_service.list_records(limit=999)) <= 200


def test_offset_pagination():
    """offset 翻页，两页内容不重复。"""
    page1 = query_service.list_records(limit=3, offset=0)
    page2 = query_service.list_records(limit=3, offset=3)
    assert len(page1) == 3 and len(page2) == 3
    assert not ({r["id"] for r in page1} & {r["id"] for r in page2})


def test_get_single_record_and_fields():
    """按 id 查单条记录，返回字段与前端列表对齐。"""
    first = query_service.list_records(limit=1)[0]
    record = query_service.get_record(first["id"])
    assert record["id"] == first["id"]
    assert sorted(record.keys()) == sorted(
        ["id", "date", "type", "amount", "category", "remark", "created_at"]
    )


def test_get_missing_record_raises():
    """查询不存在的记录抛 ValueError（API 层转 400）。"""
    try:
        query_service.get_record(999999)
    except ValueError:
        return
    raise AssertionError("查询不存在的记录应当抛出 ValueError")


def test_invalid_parameters_raise():
    """非法日期、日期区间倒置、非法类型、空类别均应报错。"""
    cases = [
        {"start_date": "2026/11/01"},
        {"start_date": "2026-11-05", "end_date": "2026-11-01"},
        {"type": "transfer"},
        {"category": "   "},
    ]
    for kwargs in cases:
        try:
            query_service.list_records(**kwargs)
        except ValueError:
            continue
        raise AssertionError("参数 %r 应当抛出 ValueError" % kwargs)


def test_sql_injection_is_parameterized():
    """恶意参数被当作普通字符串，不会执行 SQL。"""
    result = query_service.list_records(category="'; DROP TABLE records; --")
    assert result == []
    assert len(query_service.list_records(limit=50)) >= len(SAMPLE_ROWS)


# ---------------------------------------------------------------- 独立运行
def main():
    setup_data()
    passed, failed = 0, 0
    try:
        for name, func in sorted(globals().items()):
            if name.startswith("test_") and callable(func):
                try:
                    func()
                    passed += 1
                    print("  [OK]   %s" % name)
                except AssertionError as exc:
                    failed += 1
                    print("  [FAIL] %s -> %s" % (name, exc))
    finally:
        teardown_data()
    print("\n=== 通过 %d / 失败 %d ===" % (passed, failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
