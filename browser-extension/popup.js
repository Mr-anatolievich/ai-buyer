// Popup script
document.addEventListener("DOMContentLoaded", async () => {
  const extractBtn = document.getElementById("extractBtn");
  const loading = document.getElementById("loading");
  const status = document.getElementById("status");
  const tokenInfo = document.getElementById("tokenInfo");
  const tokenPreview = document.getElementById("tokenPreview");
  const userAgentPreview = document.getElementById("userAgentPreview");
  const cookiesCount = document.getElementById("cookiesCount");
  const copyMultiTokenBtn = document.getElementById("copyMultiTokenBtn");
  const sendToAIBuyerBtn = document.getElementById("sendToAIBuyerBtn");
  const copySuccess = document.getElementById("copySuccess");

  let currentData = null;

  // Перевірка поточної вкладки
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  if (
    currentTab.url.includes("facebook.com") ||
    currentTab.url.includes("business.facebook.com") ||
    currentTab.url.includes("adsmanager.facebook.com")
  ) {
    status.className = "status success";
    status.textContent = "✅ Facebook сторінка знайдена";
    extractBtn.disabled = false;
  } else {
    status.className = "status error";
    status.textContent = "❌ Потрібно відкрити Facebook Ads Manager";
    extractBtn.disabled = true;
  }

  // Обробник кнопки витягування
  extractBtn.addEventListener("click", async () => {
    try {
      extractBtn.disabled = true;
      loading.style.display = "block";
      status.className = "status warning";
      status.textContent = "⏳ Витягуємо дані...";

      // Отримуємо cookies через Chrome API
      const cookies = await chrome.cookies.getAll({
        domain: ".facebook.com",
      });

      // Відправляємо повідомлення в content script
      const response = await chrome.tabs.sendMessage(currentTab.id, {
        action: "extractData",
      });

      loading.style.display = "none";

      if (response && response.success) {
        currentData = {
          ...response.data,
          cookies: cookies, // Використовуємо cookies з Chrome API
        };

        // Показуємо інформацію
        tokenPreview.textContent = currentData.token.substring(0, 50) + "...";
        userAgentPreview.textContent = currentData.userAgent;
        cookiesCount.textContent = `${currentData.cookies.length} cookies`;

        tokenInfo.style.display = "block";
        status.className = "status success";
        status.textContent = "✅ Дані успішно витягнуто!";
      } else {
        status.className = "status error";
        status.textContent =
          "❌ " + (response?.error || "Помилка витягування даних");
        extractBtn.disabled = false;
      }
    } catch (error) {
      console.error("Помилка:", error);
      loading.style.display = "none";
      status.className = "status error";
      status.textContent = "❌ Помилка: " + error.message;
      extractBtn.disabled = false;
    }
  });

  // Обробник копіювання мультитокена
  copyMultiTokenBtn.addEventListener("click", async () => {
    if (!currentData) return;

    try {
      const multiToken = createMultiToken(
        currentData.token,
        currentData.cookies,
        currentData.userAgent
      );

      await navigator.clipboard.writeText(multiToken);

      copySuccess.style.display = "block";
      setTimeout(() => {
        copySuccess.style.display = "none";
      }, 3000);
    } catch (error) {
      console.error("Помилка копіювання:", error);
      alert("Помилка копіювання в буфер обміну");
    }
  });

  // Обробник відправки в AI-Buyer
  sendToAIBuyerBtn.addEventListener("click", async () => {
    if (!currentData) return;

    try {
      const multiToken = createMultiToken(
        currentData.token,
        currentData.cookies,
        currentData.userAgent
      );

      // Відкриваємо AI-Buyer з автозаповненням
      const aibuyerUrl = `http://localhost:3000/accounts/add?multitoken=${encodeURIComponent(
        multiToken
      )}`;
      chrome.tabs.create({ url: aibuyerUrl });
    } catch (error) {
      console.error("Помилка відправки:", error);
      alert("Помилка відправки в AI-Buyer");
    }
  });

  // Функція створення мультитокена
  function createMultiToken(token, cookies, userAgent) {
    const multiTokenData = {
      cookies: cookies.map((cookie) => ({
        domain: cookie.domain,
        expirationDate: cookie.expirationDate,
        hostOnly: cookie.hostOnly,
        httpOnly: cookie.httpOnly,
        name: cookie.name,
        path: cookie.path,
        sameSite: cookie.sameSite || "no_restriction",
        secure: cookie.secure,
        session: cookie.session,
        storeId: cookie.storeId || "0",
        value: cookie.value,
      })),
      ua: userAgent,
      token: token,
    };

    return btoa(JSON.stringify(multiTokenData));
  }

  // Перевірка збережених даних
  chrome.storage.local.get(["lastFoundToken"], (result) => {
    if (result.lastFoundToken) {
      const data = result.lastFoundToken;
      const age = Date.now() - data.timestamp;

      if (age < 300000) {
        // 5 хвилин
        status.className = "status success";
        status.textContent = "🎉 Останній токен знайдено автоматично!";
      }
    }
  });
});
