/* 账单新增、展示、删除 —— 模块负责人：成员 G（表单）、成员 H（列表） */

(function () {
    "use strict";

    const PAGE_SIZE = 10;

    // 当前已显示的记录条数，作为下一页的起点
    let currentOffset = 0;
    // 后端是否还有更多数据
    let hasMore = false;
    // 防止重复请求（加载中再次点击筛选 / 查看更多）
    let loading = false;
    // 防止重复导出
    let exporting = false;

    /** 初始化新增记账表单 —— 成员 G */
    function initRecordForm() {
        const form = document.getElementById("record-form-element");
        if (!form) return;

        const typeInput = document.getElementById("type");
        const amountInput = document.getElementById("amount");
        const dateInput = document.getElementById("date");
        const categoryInput = document.getElementById("category");
        const remarkInput = document.getElementById("remark");
        const submitButton = form.querySelector('button[type="submit"]');

        // 日期默认今天，且不允许选择未来日期
        const today = toISODate(new Date());
        if (dateInput) {
            dateInput.value = today;
            dateInput.max = today;
        }

        syncTypeState(form, typeInput);

        if (typeInput) {
            typeInput.addEventListener("change", () => {
                syncTypeState(form, typeInput);
            });
        }

        [
            [amountInput, "amount"],
            [dateInput, "date"],
            [categoryInput, "category"],
        ].forEach(([input, key]) => {
            if (!input) return;
            input.addEventListener("input", () => clearFieldError(form, key));
            input.addEventListener("change", () => clearFieldError(form, key));
        });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (submitButton && submitButton.disabled) return;

            const fields = { typeInput, amountInput, dateInput, categoryInput, remarkInput };
            const result = validateRecord(fields);

            if (!result.valid) {
                Object.keys(result.errors).forEach((key) => {
                    setFieldError(form, key, result.errors[key]);
                });
                setFormMessage(form, "请先修正标红的字段", "error");
                const firstInvalid = form.querySelector(".form__field.is-invalid input, .form__field.is-invalid select");
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            setSubmitting(submitButton, true);
            setFormMessage(form, "正在保存…");

            try {
                if (typeof api === "undefined" || typeof api.createRecord !== "function") {
                    throw new Error("API 未加载，无法保存");
                }

                await api.createRecord({
                    type: result.data.type,
                    amount: result.data.amount,
                    date: result.data.date,
                    category: result.data.category,
                    remark: result.data.remark,
                });

                // 只清空金额和备注，日期与类别保留，方便连续记账
                if (amountInput) amountInput.value = "";
                if (remarkInput) remarkInput.value = "";
                clearFieldError(form, "amount");

                setFormMessage(
                    form,
                    `保存成功：${result.data.date} ${result.data.category} ${result.data.amountYuan.toFixed(2)} 元`,
                    "success"
                );

                // 列表回到第一页重新加载，刚保存的记录会出现在最前面
                currentOffset = 0;
                loadRecords();

                // 通知概览与统计模块刷新（statistics.js 监听该事件）
                document.dispatchEvent(new CustomEvent("records:changed"));
                window.dispatchEvent(new CustomEvent("records:changed"));
            } catch (error) {
                console.error("[records] 保存失败", error);
                setFormMessage(form, `保存失败：${describeError(error, "请稍后重试")}`, "error");
            } finally {
                setSubmitting(submitButton, false);
            }
        });
    }

    /** 表单校验：金额、日期、类别，返回 {valid, data, errors} */
    function validateRecord(fields) {
        const errors = {};
        const { typeInput, amountInput, dateInput, categoryInput, remarkInput } = fields;

        const type = typeInput && typeInput.value === "income" ? "income" : "expense";

        const amountText = amountInput ? amountInput.value.trim() : "";
        let amountYuan = 0;
        if (!amountText) {
            errors.amount = "请输入金额";
        } else if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
            errors.amount = "金额格式不正确，最多两位小数";
        } else {
            amountYuan = Number(amountText);
            if (!(amountYuan > 0)) errors.amount = "金额必须大于 0";
        }

        const date = dateInput ? dateInput.value : "";
        const today = toISODate(new Date());
        if (!date) {
            errors.date = "请选择日期";
        } else if (date > today) {
            errors.date = "日期不能晚于今天";
        }

        const category = categoryInput ? categoryInput.value.trim() : "";
        if (!category) errors.category = "请选择类别";

        const valid = Object.keys(errors).length === 0;

        return {
            valid,
            errors,
            data: valid
                ? {
                    type,
                    amount: yuanToFen(amountYuan),
                    amountYuan,
                    date,
                    category,
                    remark: remarkInput ? remarkInput.value.trim() : "",
                }
                : null,
        };
    }

    /** 本地日期转 YYYY-MM-DD，避免时区导致日期偏移 */
    function toISODate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    /** 收支类型切换时同步表单配色状态 */
    function syncTypeState(form, typeInput) {
        if (!form) return;
        const isIncome = typeInput && typeInput.value === "income";
        form.classList.toggle("is-income", Boolean(isIncome));
        form.classList.toggle("is-expense", !isIncome);
    }

    /** 字段级错误：显示提示并标记字段 */
    function setFieldError(form, key, message) {
        const field = form.querySelector(`.form__field--${key}`);
        const errorNode = document.getElementById(`${key}-error`);
        if (field) field.classList.add("is-invalid");
        if (errorNode) {
            errorNode.textContent = message;
            errorNode.hidden = false;
        }
    }

    /** 清除单个字段的错误状态 */
    function clearFieldError(form, key) {
        const field = form.querySelector(`.form__field--${key}`);
        const errorNode = document.getElementById(`${key}-error`);
        if (field) field.classList.remove("is-invalid");
        if (errorNode) {
            errorNode.textContent = "";
            errorNode.hidden = true;
        }
    }

    /** 提交中禁用按钮，防止重复点击 */
    function setSubmitting(button, submitting) {
        if (!button) return;
        if (submitting) {
            button.dataset.idleText = button.textContent;
            button.textContent = "保存中…";
            button.disabled = true;
        } else {
            button.textContent = button.dataset.idleText || "保存";
            button.disabled = false;
        }
    }

    /** 读取筛选条件，参数名与后端 GET /api/records/ 保持一致 */
    function readFilters() {
        const valueOf = (id) => {
            const node = document.getElementById(id);
            return node ? node.value.trim() : "";
        };

        return {
            start_date: valueOf("filter-start-date"),
            end_date: valueOf("filter-end-date"),
            type: valueOf("filter-type"),
            category: valueOf("filter-category"),
        };
    }

    /**
     * 统一错误文案：超时 / 跨域 / 后端 detail 交给 api.js 的 describeApiError 区分，
     * 这里只做兜底，避免 api.js 未加载时连提示都拿不到。
     */
    function describeError(error, fallback) {
        if (typeof describeApiError === "function") return describeApiError(error, fallback);
        return (error && error.message) || fallback;
    }

    /** 列表区提示：统一用 #records-message，不只在控制台报错 */
    function setRecordsMessage(text, tone) {
        const node = document.getElementById("records-message");
        if (!node) return;
        node.textContent = text;
        node.classList.remove("form__message--success", "form__message--error");
        if (tone === "success") node.classList.add("form__message--success");
        if (tone === "error") node.classList.add("form__message--error");
    }

    /** 控制“查看更多”按钮显隐 */
    function toggleLoadMore(show) {
        const more = document.getElementById("load-more");
        if (more) more.hidden = !show;
    }

    /** 空状态 / 失败占位行 */
    function renderPlaceholder(tbody, text) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.textContent = text;
        row.appendChild(cell);
        tbody.appendChild(row);
    }

    /** 追加数据前先移除占位行 */
    function clearPlaceholder(tbody) {
        const cell = tbody.querySelector("td[colspan]");
        if (cell && cell.parentNode) cell.parentNode.remove();
    }

    /**
     * 加载账单列表。
     * 后端 GET /api/records/ 只接受 start_date / end_date / type / category / limit，
     * 没有暴露 offset（service 与 repository 内部支持，但路由层未透传），
     * 因此这里先取到 offset + PAGE_SIZE 条，再在本地切片出当前页。
     */
    async function loadRecords({ append = false } = {}) {
        const tbody = document.getElementById("record-list-body");
        if (!tbody) return;
        if (loading) return;

        const filters = readFilters();

        // 客户端先拦一次日期区间，避免用一个必然 400 的请求打扰后端
        if (filters.start_date && filters.end_date && filters.start_date > filters.end_date) {
            setRecordsMessage("开始日期不能晚于结束日期", "error");
            hasMore = false;
            toggleLoadMore(false);
            return;
        }

        const offset = append ? currentOffset : 0;

        loading = true;
        setRecordsMessage(append ? "正在加载更多…" : "正在加载…");

        try {
            if (typeof api === "undefined" || typeof api.getRecords !== "function") {
                throw new Error("API 未加载，无法获取记录");
            }

            const rows = await api.getRecords({ ...filters, limit: offset + PAGE_SIZE });
            const page = rows.slice(offset, offset + PAGE_SIZE);

            currentOffset = offset + page.length;
            hasMore = rows.length >= offset + PAGE_SIZE;

            if (page.length === 0 && append) {
                hasMore = false;
                toggleLoadMore(false);
                setRecordsMessage("没有更多记录了", "success");
                return;
            }

            renderRecords(page, append);

            if (page.length === 0) {
                setRecordsMessage("暂无记录", "success");
            } else if (hasMore) {
                setRecordsMessage(`已显示 ${currentOffset} 条记录，可继续加载更多`);
            } else {
                setRecordsMessage(`已显示全部 ${currentOffset} 条记录`, "success");
            }

            toggleLoadMore(hasMore);
        } catch (error) {
            console.error("[records] 加载列表失败", error);
            setRecordsMessage(`加载失败：${describeError(error, "请稍后重试")}`, "error");

            if (!append) {
                // 首次/重新筛选失败时清掉旧数据，避免展示过期结果
                tbody.textContent = "";
                renderPlaceholder(tbody, "加载失败，请稍后重试");
                currentOffset = 0;
            }

            hasMore = false;
            toggleLoadMore(false);
        } finally {
            loading = false;
        }
    }

    /** 渲染账单行。注意：文本统一用 textContent 写入 */
    function renderRecords(records, append = false) {
        const tbody = document.getElementById("record-list-body");
        if (!tbody) return;

        if (!append) {
            tbody.textContent = "";
        } else {
            clearPlaceholder(tbody);
        }

        if (records.length === 0) {
            if (!append) renderPlaceholder(tbody, "暂无记录");
            return;
        }

        records.forEach((record) => {
            tbody.appendChild(createRecordRow(record));
        });
    }

    /** 创建单行 DOM：日期、类型、类别、金额、备注、删除按钮 */
    function createRecordRow(record) {
        const row = document.createElement("tr");
        if (record.id !== undefined && record.id !== null) {
            row.dataset.id = String(record.id);
        }

        const isIncome = record.type === "income";

        const dateCell = document.createElement("td");
        dateCell.textContent = record.date || "";
        row.appendChild(dateCell);

        // 类型用色块标签，与 style.css 里的 tag 体系一致
        const typeCell = document.createElement("td");
        const tag = document.createElement("span");
        tag.className = isIncome ? "tag tag--income" : "tag tag--expense";
        tag.textContent = isIncome ? "收入" : "支出";
        typeCell.appendChild(tag);
        row.appendChild(typeCell);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = record.category || "未分类";
        row.appendChild(categoryCell);

        // 金额由「分」转「元」展示：收入绿色带 +，支出红色带 -
        const amountCell = document.createElement("td");
        amountCell.className = "is-num";
        const amountText = document.createElement("span");
        amountText.className = isIncome ? "amount--income" : "amount--expense";
        amountText.textContent = (isIncome ? "+" : "-") + fenToYuan(record.amount);
        amountCell.appendChild(amountText);
        row.appendChild(amountCell);

        const remarkCell = document.createElement("td");
        remarkCell.textContent = record.remark || "—";
        row.appendChild(remarkCell);

        const actionCell = document.createElement("td");
        actionCell.className = "is-action";
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "button button--danger";
        deleteButton.textContent = "删除";
        deleteButton.addEventListener("click", () => handleDelete(record.id, deleteButton));
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        return row;
    }

    /** 删除记录：先确认，再调 deleteRecord，成功后刷新列表与概览统计 */
    async function handleDelete(id, button) {
        if (id === undefined || id === null) return;
        if (!window.confirm("确定删除这条记录吗？删除后不可恢复。")) return;

        const originalText = button ? button.textContent : "";
        if (button) {
            button.disabled = true;
            button.textContent = "删除中…";
        }
        setRecordsMessage("正在删除…");

        try {
            if (typeof api === "undefined" || typeof api.deleteRecord !== "function") {
                throw new Error("API 未加载，无法删除");
            }
            await api.deleteRecord(id);
        } catch (error) {
            console.error("[records] 删除失败", error);
            setRecordsMessage(`删除失败：${describeError(error, "请稍后重试")}`, "error");
            if (button) {
                button.disabled = false;
                button.textContent = originalText || "删除";
            }
            return;
        }

        // 从第一页重新加载，被删的行随之消失，分页状态也保持一致
        currentOffset = 0;
        await loadRecords();
        setRecordsMessage("已删除该记录", "success");

        // 通知概览与统计模块刷新（statistics.js 监听该事件）
        document.dispatchEvent(new CustomEvent("records:changed"));
        window.dispatchEvent(new CustomEvent("records:changed"));
    }

    /** 导出文件名，与后端 Content-Disposition 里的命名保持一致 */
    function exportFileName() {
        const now = new Date();
        const pad = (value) => String(value).padStart(2, "0");
        return `账单_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.xlsx`;
    }

    /** 导出 Excel：按当前筛选条件请求 xlsx，再用临时 <a download> 触发下载 */
    async function handleExport(button) {
        if (exporting) return;

        const filters = readFilters();
        if (filters.start_date && filters.end_date && filters.start_date > filters.end_date) {
            setRecordsMessage("开始日期不能晚于结束日期", "error");
            return;
        }

        exporting = true;
        const originalText = button ? button.textContent : "";
        if (button) {
            button.disabled = true;
            button.textContent = "导出中…";
        }
        setRecordsMessage("正在导出 Excel…");

        try {
            if (typeof api === "undefined" || typeof api.exportRecords !== "function") {
                throw new Error("API 未加载，无法导出");
            }

            const blob = await api.exportRecords(filters);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = exportFileName();
            document.body.appendChild(link);
            link.click();
            link.remove();
            // 下载触发后释放对象 URL，避免占用内存
            setTimeout(() => URL.revokeObjectURL(url), 0);

            setRecordsMessage("导出成功，已开始下载", "success");
        } catch (error) {
            console.error("[records] 导出失败", error);
            setRecordsMessage(`导出失败：${describeError(error, "请稍后重试")}`, "error");
        } finally {
            exporting = false;
            if (button) {
                button.disabled = false;
                button.textContent = originalText || "导出 Excel";
            }
        }
    }

    /** 初始化筛选按钮、“查看更多”，并拉取第一页 */
    function initRecordList() {
        const apply = document.getElementById("filter-apply");
        const more = document.getElementById("load-more");
        const exportButton = document.getElementById("export-excel");

        if (exportButton) {
            exportButton.addEventListener("click", () => handleExport(exportButton));
        }

        if (apply) {
            apply.addEventListener("click", () => {
                currentOffset = 0;
                loadRecords();
            });
        }

        if (more) {
            more.hidden = true;
            more.addEventListener("click", () => {
                loadRecords({ append: true });
            });
        }

        // 在筛选输入框里按回车等价于点「筛选」
        ["filter-start-date", "filter-end-date", "filter-category"].forEach((id) => {
            const input = document.getElementById(id);
            if (!input) return;
            input.addEventListener("keydown", (event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                if (apply) {
                    apply.click();
                } else {
                    currentOffset = 0;
                    loadRecords();
                }
            });
        });

        // 首屏自动加载第一页
        return loadRecords();
    }

    /** 表单顶部/底部反馈：使用现有的 #form-message，不新造提示组件 */
    function setFormMessage(form, text, tone) {
        const node = document.getElementById("form-message");
        if (!node) return;
        node.textContent = text;
        node.classList.remove("form__message--success", "form__message--error");
        if (tone === "success") node.classList.add("form__message--success");
        if (tone === "error") node.classList.add("form__message--error");
    }

    window.RecordsModule = {
        initRecordForm,
        initRecordList,
        loadRecords,
        renderRecords,
        handleDelete,
        handleExport,
    };
})();
