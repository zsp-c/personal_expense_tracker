/* 历史账单列表：记录展示、筛选控件、删除交互 —— 模块负责人：成员 H */

(function () {
    const PAGE_SIZE = 10;

    let currentLimit = PAGE_SIZE;
    let displayedCount = 0;

    function readFilters() {
        const startDate = document.getElementById("filter-start-date");
        const endDate = document.getElementById("filter-end-date");
        const type = document.getElementById("filter-type");
        const category = document.getElementById("filter-category");

        return {
            start_date: startDate ? startDate.value : "",
            end_date: endDate ? endDate.value : "",
            type: type ? type.value : "",
            category: category ? category.value.trim() : "",
        };
    }

    async function loadRecords({ append = false } = {}) {
        if (!append) {
            currentLimit = PAGE_SIZE;
        } else {
            currentLimit += PAGE_SIZE;
        }

        const params = readFilters();
        params.limit = currentLimit;

        try {
            const records = await api.getRecords(params);

            if (append) {
                renderRecords(records.slice(displayedCount), true);
            } else {
                renderRecords(records, false);
            }

            displayedCount = records.length;

            const more = document.getElementById("load-more");
            if (more) {
                more.hidden = records.length < currentLimit;
            }

            setListMessage("");
        } catch (err) {
            setListMessage(err.message || "加载失败，请稍后重试");
        }
    }

    function renderRecords(records, append = false) {
        const tbody = document.getElementById("record-list-body");
        if (!tbody) return;

        if (!append) {
            tbody.textContent = "";
        }

        if (records.length === 0 && !append) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 6;
            cell.textContent = "暂无记录";
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }

        records.forEach((record) => {
            tbody.appendChild(createRecordRow(record));
        });
    }

    function createRecordRow(record) {
        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.textContent = record.date || "";
        row.appendChild(dateCell);

        const typeCell = document.createElement("td");
        typeCell.textContent = record.type === "income" ? "收入" : "支出";
        row.appendChild(typeCell);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = record.category || "";
        row.appendChild(categoryCell);

        const amountCell = document.createElement("td");
        const amountValue = fenToYuan(record.amount);
        if (record.type === "income") {
            amountCell.textContent = `+${amountValue}`;
            amountCell.className = "amount--income";
        } else {
            amountCell.textContent = `-${amountValue}`;
            amountCell.className = "amount--expense";
        }
        row.appendChild(amountCell);

        const remarkCell = document.createElement("td");
        remarkCell.textContent = record.remark || "";
        row.appendChild(remarkCell);

        const actionCell = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "button";
        deleteBtn.textContent = "删除";
        deleteBtn.addEventListener("click", () => handleDelete(record.id));
        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);

        return row;
    }

    async function handleDelete(id) {
        if (!confirm("确定删除这条记录吗？")) return;

        try {
            await api.deleteRecord(id);
            setListMessage("删除成功");
            displayedCount = 0;
            currentLimit = PAGE_SIZE;
            await loadRecords();
            refreshStatistics();
        } catch (err) {
            setListMessage(err.message || "删除失败，请稍后重试");
        }
    }

    function refreshStatistics() {
        try {
            const stats = window.StatisticsModule;
            if (!stats) return;
            if (typeof stats.loadSummary === "function") {
                stats.loadSummary();
            }
            if (typeof stats.loadCategoryStats === "function") {
                stats.loadCategoryStats();
            }
        } catch (_) {
            // 统计模块尚未实现时忽略，不影响列表功能
        }
    }

    function setListMessage(text) {
        const node = document.getElementById("records-message");
        if (node) node.textContent = text;
    }

    function initRecordList() {
        const apply = document.getElementById("filter-apply");
        const more = document.getElementById("load-more");

        if (apply) {
            apply.addEventListener("click", () => {
                loadRecords();
            });
        }

        if (more) {
            more.addEventListener("click", () => {
                loadRecords({ append: true });
            });
        }

        loadRecords();
    }

    window.RecordsListModule = {
        initRecordList,
        loadRecords,
        renderRecords,
        handleDelete,
    };
})();