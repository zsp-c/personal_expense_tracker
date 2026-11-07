/* 账单新增、展示、删除 —— 模块负责人：成员 G（表单）、成员 H（列表） */

(function () {
    const PAGE_SIZE = 10;

    let currentOffset = 0;

    /** 初始化新增记账表单。TODO(成员 G) */
    function initRecordForm() {
        const form = document.getElementById("record-form-element");
        if (!form) return;

        // TODO(成员 G)：
        // 1. 默认日期设为今天。
        // 2. 拦截 submit，读取字段。
        // 3. amount 使用 yuanToFen 转成分。
        // 4. 调用 api.createRecord。
        // 5. 成功后清空表单、刷新列表和统计。
        // 6. 失败时在 #form-message 展示错误。
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            setFormMessage("待实现：成员 G");
        });
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
