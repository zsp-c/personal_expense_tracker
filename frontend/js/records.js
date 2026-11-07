/* 账单新增、展示、删除 —— 模块负责人：成员 G（表单）、成员 H（列表） */

(function () {
    const PAGE_SIZE = 10;

    let currentOffset = 0;

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

                // 通知列表与统计模块刷新（statistics.js 监听该事件）
                document.dispatchEvent(new CustomEvent("records:changed"));
                window.dispatchEvent(new CustomEvent("records:changed"));
            } catch (error) {
                const message = error && error.name === "TypeError"
                    ? "无法连接后端服务，请确认后端已启动"
                    : (error && error.message) || "请稍后重试";
                setFormMessage(form, `保存失败：${message}`, "error");
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

    /** 加载账单列表。TODO(成员 H) */
    async function loadRecords({ append = false } = {}) {
        // TODO(成员 H)：
        // 1. 从筛选控件读取条件。
        // 2. 调用 api.getRecords({..., limit: PAGE_SIZE, offset: currentOffset})。
        // 3. renderRecords(records, append)。
        // 4. 记录数量小于 PAGE_SIZE 时隐藏“查看更多”。
        throw new Error("待实现：成员 H");
    }

    /** 渲染账单行。注意：文本统一用 textContent 写入。TODO(成员 H) */
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

    /** 创建单行 DOM。TODO(成员 H) */
    function createRecordRow(record) {
        // TODO(成员 H)：生成 <tr>，包含日期、类型、类别、金额、备注、删除按钮。
        // 删除按钮调用 handleDelete(record.id)。
        throw new Error("待实现：成员 H");
    }

    /** 删除记录，需二次确认。TODO(成员 H) */
    async function handleDelete(id) {
        // TODO(成员 H)：
        // 1. confirm("确定删除这条记录吗？")。
        // 2. api.deleteRecord(id)。
        // 3. 刷新列表和统计。
        throw new Error("待实现：成员 H");
    }

    /** 初始化筛选按钮和“查看更多”。TODO(成员 H) */
    function initRecordList() {
        const apply = document.getElementById("filter-apply");
        const more = document.getElementById("load-more");

        if (apply) {
            apply.addEventListener("click", () => {
                currentOffset = 0;
                loadRecords();
            });
        }

        if (more) {
            more.addEventListener("click", () => {
                loadRecords({ append: true });
            });
        }
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
    };
})();
