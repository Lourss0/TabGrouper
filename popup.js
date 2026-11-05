"use strict";

const auto = document.getElementById("auto");
const go = document.getElementById("go");

browser.storage.local.get("auto").then(r => { auto.checked = !!r.auto; });
auto.addEventListener("change", () => browser.storage.local.set({ auto: auto.checked }));

go.addEventListener("click", async () => {
  go.disabled = true;
  try {
    const win = await browser.windows.getCurrent();
    await browser.runtime.sendMessage({ type: "organize", windowId: win.id });
  } finally {
    window.close();
  }
});
