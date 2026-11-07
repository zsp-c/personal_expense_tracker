/* 账单新增、展示、删除 —— 模块负责人：成员 G（表单）、成员 H（列表） */

(function () {
    "use strict";

    const PAGE_SIZE = 10;


    // 已加载条数，同时作为下一次“查看更多”的 offset，避免未使用的半成品状态
    let loadedCount = 0;
    let loading = false;
