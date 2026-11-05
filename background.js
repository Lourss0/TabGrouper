"use strict";

const AUTO_DEBOUNCE_MS = 700;

// "www.github.com" -> "github.com"; non-web pages (about:, moz-extension:, ...) group by protocol.
function siteOf(url = "") {
  try {
    const u = new URL(url);
    return u.protocol.startsWith("http") ? u.hostname.replace(/^www\./, "") : u.protocol;
  } catch {
    return "other";
  }
}

const running = new Set(); // windows currently being organized (prevents overlapping runs)

async function organize(windowId) {
  if (running.has(windowId)) return;
  running.add(windowId);
  try {
    // Unpinned, visible tabs only (hidden = e.g. other Zen workspaces).
    const tabs = (await browser.tabs.query({ windowId, hidden: false, pinned: false }))
      .sort((a, b) => a.index - b.index);
    if (!tabs.length) return;

    // Map keeps insertion order = order of each site's first appearance.
    const groups = new Map();
    for (const t of tabs) {
      const key = siteOf(t.url);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(t.id);
    }

    const target = [...groups.values()].flat();
    const alreadySorted = target.every((id, i) => id === tabs[i].id);
    if (alreadySorted) return; // nothing to do, avoids pointless tab flicker

    await browser.tabs.move(target, { windowId, index: tabs[0].index });
  } finally {
    running.delete(windowId);
  }
}

let badgeTimer;
async function organizeWithBadge(windowId) {
  clearTimeout(badgeTimer);
  try {
    const id = windowId ?? (await browser.windows.getCurrent()).id;
    await organize(id);
    await browser.action.setBadgeBackgroundColor({ color: "#2e7d32" });
    await browser.action.setBadgeText({ text: "OK" });
  } catch (e) {
    console.error("TabGrouper:", e);
    await browser.action.setBadgeBackgroundColor({ color: "#c62828" });
    await browser.action.setBadgeText({ text: "ERR" });
  }
  badgeTimer = setTimeout(() => browser.action.setBadgeText({ text: "" }), 1500);
}

// Keyboard shortcut
browser.commands.onCommand.addListener(cmd => {
  if (cmd === "organize") organizeWithBadge();
});

// Popup button
browser.runtime.onMessage.addListener(msg => {
  if (msg?.type === "organize") return organizeWithBadge(msg.windowId);
});

// Right-click the toolbar button: toggle auto-organize.
// Menus are created in onInstalled (event pages restart often; creating at top level would throw duplicate-ID errors).
browser.runtime.onInstalled.addListener(async () => {
  const { auto } = await browser.storage.local.get("auto");
  await browser.menus.removeAll();
  browser.menus.create({
    id: "auto",
    type: "checkbox",
    checked: !!auto,
    title: "Auto-organize new tabs",
    contexts: ["action"]
  });
});

browser.menus.onClicked.addListener(info => {
  if (info.menuItemId === "auto") browser.storage.local.set({ auto: info.checked });
});

// Keep the menu checkbox in sync when the popup checkbox changes the setting.
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.auto) {
    browser.menus.update("auto", { checked: !!changes.auto.newValue }).catch(() => {});
  }
});

// Auto-organize: only wakes up when a tab's URL actually changes.
const timers = {};
browser.tabs.onUpdated.addListener(async (_id, _change, tab) => {
  const { auto } = await browser.storage.local.get("auto");
  if (!auto) return;
  clearTimeout(timers[tab.windowId]);
  timers[tab.windowId] = setTimeout(() => organize(tab.windowId).catch(console.error), AUTO_DEBOUNCE_MS);
}, { properties: ["url"] });
