const auto = document.getElementById("auto");
browser.storage.local.get("auto").then(r => auto.checked = !!r.auto);
auto.addEventListener("change", () => browser.storage.local.set({ auto: auto.checked }));

document.getElementById("go").addEventListener("click", async () => {
  const win = await browser.windows.getCurrent();
  await browser.runtime.sendMessage({ type: "organize", windowId: win.id });
  window.close();
});
