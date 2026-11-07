/* ============================================================
   个人记账本 · 导航切换
   负责人：成员 F（页面整体结构与导航）
   职责：在「记录 / 查看 / 统计」三个区域之间切换，不涉及业务数据。
   ============================================================ */

(function () {
  "use strict";

  const tabs = Array.from(document.querySelectorAll(".nav-tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  if (tabs.length === 0 || panels.length === 0) {
    return;
  }

  function activate(sectionId) {
    const target = panels.find(function (panel) {
      return panel.id === sectionId;
    });

    if (!target) {
      return;
    }

    tabs.forEach(function (tab) {
      const isActive = tab.dataset.section === sectionId;

      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach(function (panel) {
      panel.hidden = panel.id !== sectionId;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activate(tab.dataset.section);
    });

    tab.addEventListener("keydown", function (event) {
      const index = tabs.indexOf(tab);
      let nextTab = null;

      if (event.key === "ArrowRight") {
        nextTab = tabs[(index + 1) % tabs.length];
      } else if (event.key === "ArrowLeft") {
        nextTab = tabs[(index - 1 + tabs.length) % tabs.length];
      }

      if (nextTab) {
        event.preventDefault();
        nextTab.focus();
        activate(nextTab.dataset.section);
      }
    });
  });

  // 支持通过地址栏 #section-stats 之类的锚点直接打开某个区域
  const hashTab = tabs.find(function (tab) {
    return tab.dataset.section === location.hash.replace("#", "");
  });

  const defaultTab =
    hashTab ||
    tabs.find(function (tab) {
      return tab.classList.contains("is-active");
    }) ||
    tabs[0];

  activate(defaultTab.dataset.section);
})();
