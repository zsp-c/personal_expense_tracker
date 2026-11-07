/* 账单新增、展示、删除 —— 模块负责人：成员 G（表单）、成员 H（列表） */

(function () {
    const PAGE_SIZE = 10;
    const CATEGORIES = {
        expense: ["饮食", "交通", "房租", "购物", "娱乐"],
        income: ["工资", "奖金", "兼职", "红包"],
    };

    let currentOffset = 0;

    /** 初始化新增记账表单。 */
    function initRecordForm() {
        const form = document.getElementById("record-form-element");
        if (!form) return;

        const typeField = form.elements.namedItem("type");
        let categoryField = form.elements.namedItem("category");
        const dateField = form.elements.namedItem("date");
        const submitButton = form.querySelector('button[type="submit"]');

        if (categoryField.tagName !== "SELECT") {
            const categorySelect = document.createElement("select");
            categorySelect.id = categoryField.id;
            categorySelect.name = categoryField.name;
            categorySelect.required = categoryField.required;
            categoryField.replaceWith(categorySelect);
            categoryField = categorySelect;
        }

        dateField.value = getLocalDateString();
        renderCategories(typeField.value, categoryField);
        typeField.addEventListener("change", () => {
            renderCategories(typeField.value, categoryField);
        });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const amountText = form.elements.namedItem("amount").value.trim();
            if (!/^\d+(?:\.\d{1,2})?$/.test(amountText)) {
                setFormMessage("金额格式错误，请输入最多两位小数的正数。");
                return;
            }

            const amount = yuanToFen(amountText);
            if (!Number.isSafeInteger(amount) || amount <= 0) {
                setFormMessage("金额必须大于 0，且不能超出可支持范围。");
                return;
            }

            const data = {
                date: dateField.value,
                type: typeField.value,
                category: categoryField.value,
                amount,
                remark: form.elements.namedItem("remark").value.trim(),
            };

            if (!data.date || !data.category) {
                setFormMessage("请填写日期并选择类别。");
                return;
            }

            if (submitButton) submitButton.disabled = true;
            setFormMessage("正在保存...");
            try {
                await api.createRecord(data);
                form.reset();
                dateField.value = getLocalDateString();
                renderCategories(typeField.value, categoryField);
                setFormMessage("添加成功。");

                const refreshResults = await Promise.allSettled([
                    refreshModule("RecordsModule", "loadRecords"),
                    refreshModule("StatisticsModule", "loadSummary"),
                    refreshModule("StatisticsModule", "loadCategoryStats"),
                ]);
                if (refreshResults.some((result) => result.status === "rejected")) {
                    setFormMessage("添加成功，但列表或统计刷新失败，请稍后重试。");
                }
            } catch (error) {
                setFormMessage(`添加失败：${error.message || "请求异常，请稍后重试。"}`);
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    function getLocalDateString() {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${today.getFullYear()}-${month}-${day}`;
    }

    function renderCategories(type, select) {
        select.textContent = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "请选择类别";
        select.appendChild(placeholder);

        CATEGORIES[type].forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }

    function refreshModule(moduleName, methodName) {
        const module = window[moduleName];
        if (!module || typeof module[methodName] !== "function") {
            return Promise.resolve();
        }
        return Promise.resolve().then(() => module[methodName]());
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

    function setFormMessage(text) {
        const node = document.getElementById("form-message");
        if (node) node.textContent = text;
    }

    window.RecordsModule = {
        initRecordForm,
        initRecordList,
        loadRecords,
        renderRecords,
        handleDelete,
    };
})();
