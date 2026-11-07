/* 统计与仪表盘展示 —— 模块负责人：成员 I */

(function () {
    /** 加载并渲染收支汇总。TODO(成员 I) */
    async function loadSummary() {
        // TODO(成员 I)：
        // 1. 读取 #stats-start-date / #stats-end-date（或复用列表筛选）。
        // 2. 调用 api.getSummary。
        // 3. renderSummary 更新 #total-income / #total-expense / #total-balance。
        throw new Error("待实现：成员 I");
    }

    /** 渲染汇总卡片。金额使用 fenToYuan。TODO(成员 I) */
    function renderSummary(summary) {
        const income = document.getElementById("total-income");
        const expense = document.getElementById("total-expense");
        const balance = document.getElementById("total-balance");

        if (income) income.textContent = `${fenToYuan(summary.income)} 元`;
        if (expense) expense.textContent = `${fenToYuan(summary.expense)} 元`;
        if (balance) balance.textContent = `${fenToYuan(summary.balance)} 元`;
    }

    /** 加载并渲染类别统计。TODO(成员 I) */
    async function loadCategoryStats() {
        // TODO(成员 I)：
        // 1. 调用 api.getCategoryTotals。
        // 2. renderCategoryStats 更新 #category-stats。
        throw new Error("待实现：成员 I");
    }

    /** 渲染类别统计列表；使用 textContent 防止 XSS。TODO(成员 I) */
    function renderCategoryStats(items) {
        const list = document.getElementById("category-stats");
        if (!list) return;

        list.textContent = "";

        if (items.length === 0) {
            const empty = document.createElement("li");
            empty.textContent = "暂无数据";
            list.appendChild(empty);
            return;
        }

        items.forEach((item) => {
            const li = document.createElement("li");
            const name = document.createElement("span");
            const total = document.createElement("span");

            name.textContent = item.category;
            total.textContent = `${fenToYuan(item.total)} 元`;

            li.append(name, total);
            list.appendChild(li);
        });
    }

    /** 初始化统计区域事件。TODO(成员 I) */
    function initStatistics() {
        const apply = document.getElementById("stats-apply");
        if (apply) {
            apply.addEventListener("click", () => {
                loadSummary();
                loadCategoryStats();
            });
        }
    }

    window.StatisticsModule = {
        initStatistics,
        loadSummary,
        renderSummary,
        loadCategoryStats,
        renderCategoryStats,
    };
})();
