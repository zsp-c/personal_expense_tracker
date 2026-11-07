/* 账单新增、展示、删除 —— 模块负责人：成员 G（表单）、成员 H（列表） */

(function () {
    "use strict";

    const PAGE_SIZE = 10;
    const TYPE_LABELS = { income: "收入", expense: "支出" };

    // 已加载条数，同时作为下一次“查看更多”的 offset，避免未使用的半成品状态
    let loadedCount = 0;
    let loading = false;

    function byId(id) {
        return document.getElementById(id);
    }

    function inputValue(id) {
        const node = byId(id);
        return node ? String(node.value || "").trim() : "";
    }

    /** 本地日期（YYYY-MM-DD），不使用 toISOString 以免时区偏移。 */
    function todayISO() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${now.getFullYear()}-${month}-${day}`;
    }

    /** 可见的状态提示：ok=true 时用绿色（.is-ok），否则用默认错误色。 */
    function setMessage(nodeId, text, ok) {
        const node = byId(nodeId);
        if (!node) return;
        node.textContent = text || "";
        node.classList.toggle("is-ok", Boolean(ok));
    }

    function errorText(error) {
        return error && error.message ? error.message : "未知错误";
    }

    /** 通知统计模块刷新（statistics.js 监听 document 上的 records:changed）。 */
    function notifyChanged() {
        document.dispatchEvent(new CustomEvent("records:changed"));
    }

    /** 读取列表筛选条件；空值不传，交给 api.js 的 buildQuery 忽略。 */
    function readFilters() {
        return {
            start_date: inputValue("filter-start-date") || undefined,
            end_date: inputValue("filter-end-date") || undefined,
            type: inputValue("filter-type") || undefined,
            category: inputValue("filter-category") || undefined,
        };
    }

    function setLoadMoreVisible(visible) {
        const more = byId("load-more");
        if (more) more.hidden = !visible;
    }

    /** 初始化新增记账表单。成员 G。 */
    function initRecordForm() {
        const form = byId("record-form-element");
        if (!form) return;

        const dateInput = byId("date");
        if (dateInput && !dateInput.value) dateInput.value = todayISO();

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const amountFen = yuanToFen(inputValue("amount"));
            const category = inputValue("category");

            if (!Number.isFinite(amountFen) || amountFen <= 0) {
                setMessage("form-message", "请输入大于 0 的金额", false);
                return;
            }
            if (!category) {
                setMessage("form-message", "请填写类别", false);
                return;
            }

            const payload = {
                date: inputValue("date") || todayISO(),
                type: inputValue("type") || "expense",
                amount: amountFen,
                category: category,
                remark: inputValue("remark"),
            };

            setMessage("form-message", "保存中…", true);
            try {
                await api.createRecord(payload);
                form.reset();
                if (dateInput) dateInput.value = todayISO();
                loadedCount = 0;
                await loadRecords({ message: "已保存，列表已刷新" });
                notifyChanged();
            } catch (error) {
                setMessage("form-message", "保存失败：" + errorText(error), false);
            }
        });
    }

    /** 加载账单列表。成员 H。 */
    async function loadRecords({ append = false, message = "" } = {}) {
        if (loading) return;
        loading = true;

        const offset = append ? loadedCount : 0;

        try {
            const records = await api.getRecords({
                ...readFilters(),
                limit: PAGE_SIZE,
                offset: offset,
            });

            renderRecords(records, append);
            loadedCount = offset + records.length;
            setLoadMoreVisible(records.length === PAGE_SIZE);

            if (message) {
                setMessage("records-message", message, true);
            } else if (records.length === 0 && !append) {
                setMessage("records-message", "没有符合条件的记录", false);
            } else if (records.length === 0 && append) {
                setMessage("records-message", "没有更多记录了", true);
            } else {
                setMessage("records-message", `已加载 ${loadedCount} 条记录`, true);
            }
        } catch (error) {
            setMessage("records-message", "加载失败：" + errorText(error), false);
        } finally {
            loading = false;
        }
    }

    /** 渲染账单行；文本统一使用 textContent。成员 H。 */
    function renderRecords(records, append = false) {
        const tbody = byId("record-list-body");
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

    /** 创建单行 DOM。成员 H。 */
    function createRecordRow(record) {
        const tr = document.createElement("tr");

        const addCell = (value) => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
            return td;
        };

        addCell(record.date || "");
        addCell(TYPE_LABELS[record.type] || record.type || "");
        addCell(record.category || "未分类");

        const amountCell = addCell("");
        const isIncome = record.type === "income";
        amountCell.className = isIncome ? "amount--income" : "amount--expense";
        amountCell.textContent =
            (isIncome ? "+" : "-") + fenToYuan(Math.abs(Number(record.amount) || 0));

        addCell(record.remark || "—");

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "button";
        deleteButton.textContent = "删除";
        deleteButton.addEventListener("click", () => {
            handleDelete(record.id);
        });
        actionCell.appendChild(deleteButton);
        tr.appendChild(actionCell);

        return tr;
    }

    /** 删除记录，需二次确认。成员 H。 */
    async function handleDelete(id) {
        if (!window.confirm("确定删除这条记录吗？")) return;

        try {
            await api.deleteRecord(id);
            loadedCount = 0;
            await loadRecords({ message: "已删除该记录" });
            notifyChanged();
        } catch (error) {
            setMessage("records-message", "删除失败：" + errorText(error), false);
        }
    }

    /** 初始化筛选按钮和“查看更多”。成员 H。 */
    function initRecordList() {
        const apply = byId("filter-apply");
        const more = byId("load-more");

        if (apply) {
            apply.addEventListener("click", () => {
                loadedCount = 0;
                loadRecords();
            });
        }

        if (more) {
            more.addEventListener("click", () => {
                loadRecords({ append: true });
            });
        }
    }

    window.RecordsModule = {
        initRecordForm,
        initRecordList,
        loadRecords,
        renderRecords,
        handleDelete,
    };
})();
