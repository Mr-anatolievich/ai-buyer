// Background script
console.log("🤖 AI-Buyer: Background script loaded");

let extractedData = null;

// Слухач повідомлень від content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Background received message:", request);

  if (request.action === "tokenFound") {
    // Зберігаємо знайдений токен
    chrome.storage.local.set({
      lastFoundToken: {
        token: request.token,
        timestamp: Date.now(),
        url: sender.tab?.url,
      },
    });

    // Оновлюємо badge
    chrome.action.setBadgeText({
      text: "✓",
      tabId: sender.tab?.id,
    });

    chrome.action.setBadgeBackgroundColor({
      color: "#28a745",
    });
  }
});

// Встановлення badge при активації таба
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);

  if (
    tab.url &&
    (tab.url.includes("facebook.com") ||
      tab.url.includes("business.facebook.com") ||
      tab.url.includes("adsmanager.facebook.com"))
  ) {
    chrome.action.setBadgeText({
      text: "🎯",
      tabId: tab.id,
    });

    chrome.action.setBadgeBackgroundColor({
      color: "#1877f2",
    });
  } else {
    chrome.action.setBadgeText({
      text: "",
      tabId: tab.id,
    });
  }
});

// Встановлення badge при завантаженні сторінки
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (
      tab.url.includes("facebook.com") ||
      tab.url.includes("business.facebook.com") ||
      tab.url.includes("adsmanager.facebook.com")
    ) {
      chrome.action.setBadgeText({
        text: "🎯",
        tabId: tabId,
      });

      chrome.action.setBadgeBackgroundColor({
        color: "#1877f2",
      });
    }
  }
});
