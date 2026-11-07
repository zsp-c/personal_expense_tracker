/* 页面初始化与模块协调 —— 模块负责人：成员 F */

(function () {
    "use strict";

    const messages = [];
    let banner = null;

    /** 页面级错误提示：任何初始化异常都显示在页面顶部，不只丢进控制台。 */
    function showGlobalError(text) {
        if (!text || messages.indexOf(text) !== -1) return;
        messages.push(text);

        const layout = document.querySelector("main.layout");
        if (!layout) return;

        if (!banner) {
            banner = document.createElement("div");
            banner.id = "global-error";
            banner.className = "global-error";
            banner.setAttribute("role", "alert");
            layout.insertBefore(banner, layout.firstChild);
        }
        banner.textContent = messages.join("；");
    }

    // 导航高亮：统一在这里绑定一次，统计模块由下面的 initStatistics 初始化
    function initNavigation() {
        document.querySelectorAll(".topbar__nav a").forEach((link) => {
            link.addEventListener("click", () => {
                document.querySelectorAll(".topbar__nav a").forEach((item) => {
                    item.classList.remove("is-active");
                });
                link.classList.add("is-active");
            });
        });
    }

    /** 记录模块：只在首页存在，未加载该脚本（如统计页）时跳过。 */
    async function initRecords() {
        if (!window.RecordsModule) return;
        try {
            window.RecordsModule.initRecordForm();
            window.RecordsModule.initRecordList();
            await window.RecordsModule.loadRecords();
        } catch (error) {
            showGlobalError("记录模块初始化失败：" + (error && error.message ? error.message : error));
        }
    }

    /** 统计模块：只在统计页存在，由本函数作为唯一初始化入口。 */
    async function initStatistics() {
        if (!window.StatisticsModule) return;
        try {
            await window.StatisticsModule.initStatistics();
        } catch (error) {
            showGlobalError("统计模块初始化失败：" + (error && error.message ? error.message : error));
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initNavigation();
        initRecords();
        initStatistics();
    });
})();
