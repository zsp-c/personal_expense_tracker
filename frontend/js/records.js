/* 账单新增 —— 模块负责人：成员 G（表单） */

(function () {
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

    function setFormMessage(text) {
        const node = document.getElementById("form-message");
        if (node) node.textContent = text;
    }

    window.RecordsModule = {
        initRecordForm,
    };
})();