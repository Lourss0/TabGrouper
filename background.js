function siteOf(url) {
  try {
    const u = new URL(url);
    return u.protocol.startsWith("http") ? u.hostname.replace(/^www\./, "") : u.protocol;
  } catch { return "other"; }
}

async function organize(windowId) {
  // Ignore hidden tabs (e.g. other Zen workspaces)
  const tabs = (await browser.tabs.query({ windowId, hidden: false })).sort((a, b) => a.index - b.index);
  const groups = new Map(); // insertion order = order of first appearance
  for (const t of tabs.filter(t => !t.pinned)) {
    const key = siteOf(t.url);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t.id);
  }
  const ids = [...groups.values()].flat();
  const first = tabs.find(t => !t.pinned);
  if (ids.length && first) await browser.tabs.move(ids, { windowId, index: first.index });
}

async function organizeCurrent() {
  try {
    const win = await browser.windows.getCurrent();
    await organize(win.id);
    browser.action.setBadgeText({ text: "OK" });
  } catch (e) {
    console.error(e);
    browser.action.setBadgeText({ text: "ERR" });
  }
  setTimeout(() => browser.action.setBadgeText({ text: "" }), 1500);
}

browser.action.onClicked.addListener(organizeCurrent);
browser.commands.onCommand.addListener(cmd => { if (cmd === "organize") organizeCurrent(); });

// Right-click the toolbar button to toggle auto-organize
browser.storage.local.get("auto").then(({ auto }) => {
  browser.menus.create({
    id: "auto", type: "checkbox", checked: !!auto,
    title: "Auto-organize new tabs", contexts: ["action"]
  });
});
browser.menus.onClicked.addListener(info => {
  if (info.menuItemId === "auto") browser.storage.local.set({ auto: info.checked });
});

const timers = {};
browser.tabs.onUpdated.addListener(async (id, change, tab) => {
  if (!change.url) return;
  const { auto } = await browser.storage.local.get("auto");
  if (!auto) return;
  clearTimeout(timers[tab.windowId]);
  timers[tab.windowId] = setTimeout(() => organize(tab.windowId), 700);
});
