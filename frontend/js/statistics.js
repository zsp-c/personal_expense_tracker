/* 统计与仪表盘展示 —— 模块负责人：成员 I
 *
 * 职责：读取 /api/stats/summary 与 /api/stats/category，渲染收支概览、
 *       类别汇总与 CSS 条形图；支持日期范围与收支类型筛选。
 *
 * 设计约束（团队约定）：
 *   1. 金额在接口与数据库内部统一为整数「分」，展示前用 fenToYuan 转元。
 *   2. 不重复实现 fetch，统一使用 api.js 的 api.getSummary / api.getCategoryTotals。
 *   3. 本文件只改自己，不修改 index.html / api.js / main.js / 任何 CSS 文件。
 *   4. 所有文本使用 textContent 写入，不拼接不可信 HTML。
 *   5. 图表为纯 CSS 条形图，不引外部库，断网也能演示。
 *
 * 降级说明：后端统计接口不可用时（服务未启动 / 请求失败 / api.js 未加载），
 *   自动切换到内置「演示记录」并用本地纯函数现场聚合，保证单独打开页面也能演示。
 *   页面会显式标注数据来源，绝不把演示数据伪装成接口返回。
 *   接口恢复可用后，无需改动本文件即自动切回实时数据。
 */
(function () {
    "use strict";

    var STYLE_ID = "st-dashboard-style";
    var BADGE_ID = "st-source-badge";
    var SWITCH_ID = "st-category-type";
    var NOTE_ID = "st-category-note";
    var REFRESH_EVENT = "records:changed";

    /* ---------------- 内置演示记录（原始流水，单位：分） ----------------
     * 注意：这里是「原始记录」，统计结果一律由 computeSummary /
     * computeCategoryTotals 现场计算，不写死任何汇总数字。
     * ------------------------------------------------------------------ */
    var DEMO_RECORDS = [
        { date: "2026-10-15", type: "income",  amount: 480000, category: "工资", remark: "10 月工资" },
        { date: "2026-10-28", type: "expense", amount: 3200,   category: "饮食", remark: "上月餐费" },
        { date: "2026-11-01", type: "income",  amount: 500000, category: "工资", remark: "11 月工资" },
        { date: "2026-11-02", type: "expense", amount: 3000,   category: "饮食", remark: "早餐" },
        { date: "2026-11-02", type: "expense", amount: 2000,   category: "交通", remark: "公交" },
        { date: "2026-11-03", type: "expense", amount: 4550,   category: "饮食", remark: "午餐" },
        { date: "2026-11-04", type: "expense", amount: 12900,  category: "购物", remark: "日用品" },
        { date: "2026-11-05", type: "income",  amount: 80000,  category: "兼职", remark: "项目报酬" },
        { date: "2026-11-06", type: "expense", amount: 150000, category: "居住", remark: "房租" },
        { date: "2026-11-07", type: "expense", amount: 6800,   category: "饮食", remark: "周末聚餐" },
        { date: "2026-11-07", type: "expense", amount: 2500,   category: "交通", remark: "打车" }
    ];

    var categoryType = "expense";   // 类别汇总当前展示的收支类型
    var initialized = false;
    var lastError = null;

    /* ---------------------------- 基础工具 ---------------------------- */

    function toYuan(value) {
        if (typeof fenToYuan === "function") {
            return fenToYuan(value);
        }
        return (safeNumber(value) / 100).toFixed(2);
    }

    function safeNumber(value) {
        var n = Number(value);
        return isFinite(n) ? n : 0;
    }

    function text(node, value) {
        node.textContent = String(value);
        return node;
    }

    function el(tag, className, value) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (value !== undefined && value !== null) text(node, value);
        return node;
    }

    function byId(id) {
        return document.getElementById ? document.getElementById(id) : null;
    }

    /* ---------------------- 纯计算函数（可独立测试） ---------------------- */

    /** 按 ISO 日期字符串筛选；空条件视为不限。 */
    function filterRecords(records, startDate, endDate) {
        var list = Array.isArray(records) ? records : [];
        return list.filter(function (row) {
            if (!row || typeof row.date !== "string") return false;
            if (startDate && row.date < startDate) return false;
            if (endDate && row.date > endDate) return false;
            return true;
        });
    }

    /** 返回 {income, expense, balance}，单位分；空数据返回 0 而不是 null。 */
    function computeSummary(records) {
        var income = 0;
        var expense = 0;
        (Array.isArray(records) ? records : []).forEach(function (row) {
            if (!row) return;
            var amount = safeNumber(row.amount);
            if (row.type === "income") income += amount;
            else if (row.type === "expense") expense += amount;
        });
        return { income: income, expense: expense, balance: income - expense };
    }

    /** 按类别汇总，返回 [{category, total}]，按金额降序。 */
    function computeCategoryTotals(records, type) {
        var totals = {};
        (Array.isArray(records) ? records : []).forEach(function (row) {
            if (!row) return;
            if (type && row.type !== type) return;
            var name = String(row.category || "未分类");
            totals[name] = safeNumber(totals[name]) + safeNumber(row.amount);
        });
        return Object.keys(totals)
            .map(function (name) {
                return { category: name, total: totals[name] };
            })
            .sort(function (a, b) {
                return b.total - a.total || a.category.localeCompare(b.category);
            });
    }

    /** 为类别列表附加占该类型总额的百分比。 */
    function withRatio(items) {
        var list = Array.isArray(items) ? items : [];
        var sum = list.reduce(function (acc, item) {
            return acc + safeNumber(item.total);
        }, 0);
        return list.map(function (item) {
            var total = safeNumber(item.total);
            return {
                category: String(item.category || "未分类"),
                total: total,
                percent: sum > 0 ? (total / sum) * 100 : 0
            };
        });
    }

    function formatPercent(value) {
        return (Math.round(safeNumber(value) * 10) / 10).toFixed(1);
    }

    /** 归一化接口返回，避免字段缺失导致 NaN 或页面报错。 */
    function normalizeSummary(raw) {
        var data = raw || {};
        var income = safeNumber(data.income);
        var expense = safeNumber(data.expense);
        var balance = data.balance === undefined || data.balance === null
            ? income - expense
            : safeNumber(data.balance);
        return { income: income, expense: expense, balance: balance };
    }

    function normalizeItems(raw) {
        var list = Array.isArray(raw) ? raw : [];
        return list
            .map(function (item) {
                return {
                    category: String((item && item.category) || "未分类"),
                    total: safeNumber(item && item.total)
                };
            })
            .sort(function (a, b) {
                return b.total - a.total || a.category.localeCompare(b.category);
            });
    }

    /* ---------------------------- 数据来源 ---------------------------- */

    function hasApi() {
        return typeof api === "object" && api !== null &&
            typeof api.getSummary === "function" &&
            typeof api.getCategoryTotals === "function";
    }

    function readFilters() {
        var start = byId("stats-start-date");
        var end = byId("stats-end-date");
        return {
            start_date: start && start.value ? start.value : "",
            end_date: end && end.value ? end.value : ""
        };
    }

    /**
     * 优先走后端真实接口；接口未启动 / 未实现 / 报错时降级为本地演示记录。
     * 返回 {summary, items, mode, error}。
     */
    async function loadData(filters) {
        var f = filters || readFilters();
        var params = {
            start_date: f.start_date || undefined,
            end_date: f.end_date || undefined
        };

        if (hasApi()) {
            try {
                var summaryRaw = await api.getSummary(params);
                var categoryRaw = await api.getCategoryTotals({
                    type: categoryType,
                    start_date: params.start_date,
                    end_date: params.end_date
                });
                lastError = null;
                return {
                    summary: normalizeSummary(summaryRaw),
                    items: normalizeItems(categoryRaw),
                    mode: "live",
                    error: null
                };
            } catch (error) {
                lastError = error;
            }
        } else {
            lastError = new Error("api.js 未加载");
        }

        var rows = filterRecords(DEMO_RECORDS, f.start_date, f.end_date);
        return {
            summary: computeSummary(rows),
            items: computeCategoryTotals(rows, categoryType),
            mode: "demo",
            error: lastError
        };
    }

    /* ---------------------------- 样式注入 ---------------------------- */
    /* 只作用于 st- 前缀类名，使用页面已有 CSS 变量并给出兜底值，
       因此 theme.css 是否引入都不影响显示。 */

    var INLINE_CSS = `
.st-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin: -4px 0 16px;
    padding: 5px 12px;
    font-size: 12px;
    line-height: 1.5;
    border-radius: 999px;
    color: #0e6b4f;
    background: #e7f6ef;
    border: 1px solid #bfe6d3;
}
.st-badge--demo {
    color: #8a5a12;
    background: #fff5e2;
    border-color: #f0d6a2;
}
.st-badge__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #0e8a63;
}
.st-badge--demo .st-badge__dot { background: #d58a16; }

.st-type-switch {
    display: inline-flex;
    gap: 6px;
    margin: 0 0 12px;
}
.st-type-switch button {
    padding: 6px 16px;
    font: inherit;
    font-size: 13px;
    color: var(--color-muted, #6b7280);
    background: #fff;
    border: 1px solid var(--color-border, #e2e5ea);
    border-radius: 999px;
    cursor: pointer;
}
.st-type-switch button.st-is-active {
    color: #fff;
    background: var(--color-primary, #2563eb);
    border-color: var(--color-primary, #2563eb);
}
.st-note {
    margin: 0 0 10px;
    font-size: 12px;
    color: var(--color-muted, #6b7280);
}

.category-list li.st-bar-item,
.category-list li.st-bar-empty {
    display: block;
    padding: 10px 14px;
}
.category-list li.st-bar-empty {
    color: var(--color-muted, #6b7280);
    text-align: center;
}
.st-bar-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 7px;
    font-size: 14px;
}
.st-bar-name {
    color: var(--color-text, #1f2933);
    font-weight: 500;
}
.st-bar-value {
    color: var(--color-primary, #2563eb) !important;
    font-weight: 600 !important;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
.st-bar-track {
    height: 9px;
    border-radius: 999px;
    background: #eef3f9;
    overflow: hidden;
}
.st-bar-fill {
    height: 100%;
    min-width: 2px;
    border-radius: 999px;
    background: var(--color-expense, #dc2626);
    transition: width 0.25s ease;
}
.st-bar-fill--income { background: var(--color-income, #16a34a); }

/* .chart 在仓库样式里被固定为 320/340px，内容少时底部会留出大片空白；
   渲染完成后改为高度自适应，空态仍保留最小高度。 */
.chart.st-chart-ready {
    height: auto;
    min-height: 190px;
}
.st-chart {
    display: grid;
    gap: 10px;
    padding: 18px 20px;
}
.st-chart__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text, #1f2933);
}
.st-chart__row {
    display: grid;
    grid-template-columns: 76px 1fr 112px;
    align-items: center;
    gap: 12px;
    font-size: 13px;
}
.st-chart__label { color: var(--color-muted, #6b7280); }
.st-chart__track {
    height: 18px;
    border-radius: 6px;
    background: #eef3f9;
    overflow: hidden;
}
.st-chart__fill {
    height: 100%;
    min-width: 2px;
    border-radius: 6px;
    background: var(--color-primary, #2563eb);
    transition: width 0.25s ease;
}
.st-chart__fill--income  { background: var(--color-income, #16a34a); }
.st-chart__fill--expense { background: var(--color-expense, #dc2626); }
.st-chart__fill--negative { background: #b45309; }
.st-chart__value {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--color-text, #1f2933);
}
.st-chart__note {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-muted, #6b7280);
}
.st-chart__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 150px;
    height: 100%;
    color: var(--color-muted, #6b7280);
    font-size: 13px;
}
@media (max-width: 640px) {
    .st-chart__row { grid-template-columns: 60px 1fr 92px; gap: 8px; }
    .st-chart { padding: 14px; }
}
`;

    function ensureStyles() {
        if (!document.head || byId(STYLE_ID)) return;
        var style = el("style");
        style.id = STYLE_ID;
        text(style, INLINE_CSS);
        document.head.appendChild(style);
    }

    /* ---------------------------- 渲染逻辑 ---------------------------- */

    /** 收支概览三张卡片。 */
    function renderSummary(summary) {
        var data = normalizeSummary(summary);
        var income = byId("total-income");
        var expense = byId("total-expense");
        var balance = byId("total-balance");

        if (income) text(income, toYuan(data.income) + " 元");
        if (expense) text(expense, toYuan(data.expense) + " 元");
        if (balance) text(balance, toYuan(data.balance) + " 元");
    }

    /** 类别汇总（CSS 横条图 + 占比）。 */
    function renderCategoryStats(items) {
        var list = byId("category-stats");
        if (!list) return;

        var rows = withRatio(normalizeItems(items));
        list.textContent = "";

        if (rows.length === 0) {
            list.appendChild(el("li", "st-bar-empty", "暂无数据"));
            return;
        }

        rows.forEach(function (item) {
            var li = el("li", "st-bar-item");
            var head = el("div", "st-bar-head");
            head.appendChild(el("span", "st-bar-name", item.category));
            head.appendChild(el(
                "span",
                "st-bar-value",
                toYuan(item.total) + " 元 · " + formatPercent(item.percent) + "%"
            ));

            var track = el("div", "st-bar-track");
            var fill = el("div", "st-bar-fill" +
                (categoryType === "income" ? " st-bar-fill--income" : ""));
            fill.style.width = Math.max(0, Math.min(100, item.percent)) + "%";
            track.appendChild(fill);

            li.appendChild(head);
            li.appendChild(track);
            list.appendChild(li);
        });
    }

    /** 收支结构对比图（CSS 条形图，两种数据源下都可用）。 */
    function renderChart(summary) {
        var chart = byId("chart");
        if (!chart) return;

        var data = normalizeSummary(summary);
        chart.textContent = "";
        chart.hidden = false;
        if (chart.classList) chart.classList.add("st-chart-ready");

        if (data.income === 0 && data.expense === 0) {
            chart.appendChild(el("div", "st-chart__empty", "暂无数据，添加记录后展示收支对比"));
            return;
        }

        var max = Math.max(data.income, data.expense, Math.abs(data.balance), 1);
        var wrap = el("div", "st-chart");
        wrap.appendChild(el("div", "st-chart__title", "收支结构对比"));

        [
            { label: "总收入", value: data.income, cls: "st-chart__fill--income" },
            { label: "总支出", value: data.expense, cls: "st-chart__fill--expense" },
            {
                label: "当前结余",
                value: data.balance,
                cls: data.balance < 0 ? "st-chart__fill--negative" : ""
            }
        ].forEach(function (row) {
            var line = el("div", "st-chart__row");
            line.appendChild(el("div", "st-chart__label", row.label));

            var track = el("div", "st-chart__track");
            var fill = el("div", "st-chart__fill" + (row.cls ? " " + row.cls : ""));
            fill.style.width = Math.max(0, Math.min(100, Math.abs(row.value) / max * 100)) + "%";
            track.appendChild(fill);

            line.appendChild(track);
            line.appendChild(el("div", "st-chart__value", toYuan(row.value) + " 元"));
            wrap.appendChild(line);
        });

        var rate = data.income > 0 ? (data.balance / data.income) * 100 : null;
        wrap.appendChild(el(
            "div",
            "st-chart__note",
            rate === null
                ? "当前筛选范围内没有收入记录"
                : "结余率 " + formatPercent(rate) + "%（结余 ÷ 总收入）· 条长按三项中最大值归一"
        ));

        chart.appendChild(wrap);
    }

    /** 数据来源标识：实时接口 / 演示数据，绝不混淆。 */
    function renderBadge(data) {
        var section = byId("statistics");
        if (!section) return;

        var badge = byId(BADGE_ID);
        if (!badge) {
            badge = el("div", "st-badge");
            badge.id = BADGE_ID;
            badge.appendChild(el("span", "st-badge__dot"));
            badge.appendChild(el("span", "st-badge__text"));
            var title = section.querySelector ? section.querySelector(".card__title") : null;
            if (title && title.nextSibling) {
                section.insertBefore(badge, title.nextSibling);
            } else {
                section.insertBefore(badge, section.firstChild);
            }
        }

        var isDemo = data && data.mode === "demo";
        badge.className = "st-badge" + (isDemo ? " st-badge--demo" : "");
        var label = badge.querySelector ? badge.querySelector(".st-badge__text") : null;
        var message = isDemo
            ? "演示数据 · 后端统计接口未连接，已自动降级"
            : "实时数据 · 来自后端 /api/stats";
        if (label) text(label, message);

        var reason = isDemo && data.error && data.error.message
            ? "降级原因：" + data.error.message
            : message;
        badge.title = reason;
    }

    function renderError(error) {
        renderBadge({ mode: "demo", error: error });
    }

    /* ---------------------------- 加载入口 ---------------------------- */

    /** 只加载并渲染汇总卡片与对比图。 */
    async function loadSummary() {
        var data = await loadData(readFilters());
        renderSummary(data.summary);
        renderChart(data.summary);
        renderBadge(data);
        return data;
    }

    /** 只加载并渲染类别汇总。 */
    async function loadCategoryStats() {
        var data = await loadData(readFilters());
        renderCategoryStats(data.items);
        renderBadge(data);
        return data;
    }

    /**
     * 一次取数、统一渲染。供页面初始化、筛选变化以及
     * 成员 G/H 在新增 / 删除成功后触发的 records:changed 事件调用。
     */
    async function refresh() {
        try {
            var data = await loadData(readFilters());
            renderSummary(data.summary);
            renderCategoryStats(data.items);
            renderChart(data.summary);
            renderBadge(data);
            return data;
        } catch (error) {
            renderError(error);
            return null;
        }
    }

    /* ---------------------------- 交互初始化 ---------------------------- */

    function ensureTypeSwitch() {
        var list = byId("category-stats");
        if (!list || !list.parentNode || byId(SWITCH_ID)) return;

        var wrap = el("div", "st-type-switch");
        wrap.id = SWITCH_ID;

        [
            { key: "expense", label: "支出类别" },
            { key: "income", label: "收入类别" }
        ].forEach(function (option) {
            var button = el("button", categoryType === option.key ? "st-is-active" : "", option.label);
            button.type = "button";
            button.setAttribute("data-type", option.key);
            button.addEventListener("click", function () {
                if (categoryType === option.key) return;
                categoryType = option.key;
                wrap.querySelectorAll("button").forEach(function (item) {
                    item.className = item.getAttribute("data-type") === categoryType
                        ? "st-is-active" : "";
                });
                loadCategoryStats();
            });
            wrap.appendChild(button);
        });

        var note = el("p", "st-note", "按金额降序 · 百分比为占该类型总额");
        note.id = NOTE_ID;
        list.parentNode.insertBefore(wrap, list);
        list.parentNode.insertBefore(note, list);
    }

    function bind(id, handler) {
        var node = byId(id);
        if (node && node.addEventListener) node.addEventListener("change", handler);
    }

    function initStatistics() {
        if (initialized) return;
        initialized = true;

        ensureStyles();
        ensureTypeSwitch();

        var apply = byId("stats-apply");
        if (apply && apply.addEventListener) {
            apply.addEventListener("click", refresh);
        }

        bind("stats-start-date", refresh);
        bind("stats-end-date", refresh);

        // 新增 / 删除记录后，其他模块既可派发 records:changed，
        // 也可直接调用本模块导出的 loadSummary / loadCategoryStats / refresh。
        if (document.addEventListener) {
            document.addEventListener(REFRESH_EVENT, refresh);
        }

        // 首次加载由 main.js 统一调用 initStatistics 触发，避免双启动。
        return refresh();
    }

    /* ---------------------------- 模块导出 ---------------------------- */

    if (typeof window !== "undefined") {
        window.StatisticsModule = {
            initStatistics: initStatistics,
            loadSummary: loadSummary,
            renderSummary: renderSummary,
            loadCategoryStats: loadCategoryStats,
            renderCategoryStats: renderCategoryStats,
            refresh: refresh,
            renderChart: renderChart,
            __internals: {
                DEMO_RECORDS: DEMO_RECORDS,
                filterRecords: filterRecords,
                computeSummary: computeSummary,
                computeCategoryTotals: computeCategoryTotals,
                withRatio: withRatio,
                normalizeSummary: normalizeSummary,
                normalizeItems: normalizeItems,
                toYuan: toYuan,
                formatPercent: formatPercent,
                readFilters: readFilters,
                loadData: loadData,
                setCategoryType: function (type) { categoryType = type; },
                getCategoryType: function () { return categoryType; }
            }
        };
    }
})();
