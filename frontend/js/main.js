/* 页面初始化与模块协调 —— 模块负责人：成员 F */

document.addEventListener("DOMContentLoaded", () => {
    // 各模块在自身文件中挂载到 window.XXXModule，按加载顺序初始化。
    if (window.RecordsModule) {
        window.RecordsModule.initRecordForm();
        window.RecordsModule.initRecordList();
    }

    if (window.StatisticsModule) {
        window.StatisticsModule.initStatistics();
    }

    // 列表首屏由 RecordsModule.initRecordList 内部触发，统计模块自行完成首次加载。

    // 导航高亮
    document.querySelectorAll(".topbar__nav a").forEach((link) => {
        link.addEventListener("click", () => {
            document.querySelectorAll(".topbar__nav a").forEach((item) => {
                item.classList.remove("is-active");
            });
            link.classList.add("is-active");
        });
    });
});
