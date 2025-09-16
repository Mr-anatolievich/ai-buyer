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
  const aibuyerUrlInput = document.getElementById("aibuyerUrl");
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
      
      console.log("🔍 Початок витягування даних...");

      // Спочатку перевіряємо, чи є збережений токен
      const storageData = await chrome.storage.local.get(['lastFoundToken']);
      console.log("💾 Збережені дані:", storageData);
      
      let token = null;
      let userAgent = navigator.userAgent;

      if (storageData.lastFoundToken && storageData.lastFoundToken.token) {
        const tokenAge = Date.now() - storageData.lastFoundToken.timestamp;
        if (tokenAge < 300000) { // 5 хвилин
          token = storageData.lastFoundToken.token;
          console.log("✅ Використовуємо збережений токен");
        }
      }

      // Якщо немає збереженого токена, спробуємо витягти з content script
      if (!token) {
        console.log("🔍 Спробуємо витягти новий токен...");
        
        // Спочатку перевіряємо, чи завантажений content script
        let response;
        try {
          console.log("📞 Ping content script...");
          response = await Promise.race([
            chrome.tabs.sendMessage(currentTab.id, { action: "ping" }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
          ]);
          console.log("✅ Content script відповів:", response);
        } catch (error) {
          console.log("❌ Content script не відповідає:", error.message);

          // Спробуємо інжектувати content script вручну
          try {
            console.log("💉 Інжектуємо content script...");
            await chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              files: ["content.js"],
            });

            // Дамо час на ініціалізацію
            await new Promise((resolve) => setTimeout(resolve, 2000));
            console.log("✅ Content script інжектований");
          } catch (injectError) {
            console.error("❌ Помилка інжекції content script:", injectError);
          }
        }

        // Відправляємо повідомлення в content script
        try {
          console.log("📤 Запитуємо дані з content script...");
          response = await Promise.race([
            chrome.tabs.sendMessage(currentTab.id, { action: "extractData" }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout extracting data")), 5000))
          ]);
          console.log("📥 Отримано відповідь:", response);
          
          if (response && response.success && response.data.token) {
            token = response.data.token;
            userAgent = response.data.userAgent || userAgent;
            console.log("✅ Токен витягнуто з content script");
          }
        } catch (error) {
          console.error("❌ Помилка зв'язку з content script:", error);
          // Не викидаємо помилку, спробуємо використати дані з DOM напряму
        }
      }

      // Якщо все ще немає токена, покажемо помилку
      if (!token) {
        throw new Error("Токен не знайдений. Переконайтеся, що ви авторизовані в Facebook Ads Manager.");
      }

      // Отримуємо cookies через Chrome API
      console.log("🍪 Отримуємо cookies...");
      const cookies = await chrome.cookies.getAll({
        domain: ".facebook.com",
      });
      console.log(`✅ Отримано ${cookies.length} cookies`);

      loading.style.display = "none";

      // Готуємо дані
      currentData = {
        token: token,
        cookies: cookies,
        userAgent: userAgent,
        url: currentTab.url
      };

      // Показуємо інформацію
      tokenPreview.textContent = currentData.token.substring(0, 50) + "...";
      userAgentPreview.textContent = currentData.userAgent;
      cookiesCount.textContent = `${currentData.cookies.length} cookies`;

      tokenInfo.style.display = "block";
      status.className = "status success";
      status.textContent = "✅ Дані успішно витягнуто!";
      
      console.log("🎉 Витягування завершено успішно!");

    } catch (error) {
      console.error("❌ Помилка:", error);
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

      // Отримуємо URL з поля вводу або використовуємо автовизначення
      const customUrl = aibuyerUrlInput.value.trim();

      if (customUrl) {
        // Збережемо користувацький URL
        chrome.storage.local.set({ aibuyerUrl: customUrl });

        // Видаляємо кінцевий слеш якщо він є, щоб уникнути подвійного слеша
        const baseUrl = customUrl.replace(/\/$/, "");
        const fullUrl = `${baseUrl}/accounts/add?multitoken=${encodeURIComponent(
          multiToken
        )}`;
        chrome.tabs.create({ url: fullUrl });
      } else {
        // Автовизначення: спробуємо знайти працюючий сервер
        const possibleUrls = [
          `http://localhost:8080/accounts/add?multitoken=${encodeURIComponent(
            multiToken
          )}`,
          `http://localhost:3000/accounts/add?multitoken=${encodeURIComponent(
            multiToken
          )}`,
          `http://localhost:5173/accounts/add?multitoken=${encodeURIComponent(
            multiToken
          )}`,
          `http://localhost:4173/accounts/add?multitoken=${encodeURIComponent(
            multiToken
          )}`,
        ];

        let workingUrl = null;
        for (const url of possibleUrls) {
          try {
            const baseUrl = url.split("/accounts")[0];
            const response = await fetch(baseUrl, {
              method: "HEAD",
              signal: AbortSignal.timeout(2000), // 2 секунди timeout
            });
            if (response.ok || response.status === 404) {
              // 404 означає що сервер працює
              workingUrl = url;
              break;
            }
          } catch (error) {
            continue; // Спробуємо наступний URL
          }
        }

        if (workingUrl) {
          chrome.tabs.create({ url: workingUrl });
        } else {
          // Якщо жоден сервер не відповідає, використовуємо стандартний порт
          chrome.tabs.create({ url: possibleUrls[0] });
        }
      }
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

  // Перевірка збережених даних та автоматичне заповнення
  chrome.storage.local.get(["lastFoundToken", "aibuyerUrl"], async (result) => {
    if (result.lastFoundToken) {
      const data = result.lastFoundToken;
      const age = Date.now() - data.timestamp;

      if (age < 300000) { // 5 хвилин
        console.log("🎉 Знайдено свіжий токен, показуємо автоматично!");
        
        // Отримуємо cookies
        const cookies = await chrome.cookies.getAll({
          domain: ".facebook.com",
        });
        
        // Заповнюємо дані автоматично
        currentData = {
          token: data.token,
          cookies: cookies,
          userAgent: navigator.userAgent,
          url: data.url
        };
        
        // Показуємо інформацію
        tokenPreview.textContent = currentData.token.substring(0, 50) + "...";
        userAgentPreview.textContent = currentData.userAgent;
        cookiesCount.textContent = `${currentData.cookies.length} cookies`;

        tokenInfo.style.display = "block";
        status.className = "status success";
        status.textContent = "🎉 Токен знайдено автоматично та готовий до використання!";
        extractBtn.disabled = false;
      }
    }

    // Завантажуємо збережений URL
    if (result.aibuyerUrl) {
      aibuyerUrlInput.value = result.aibuyerUrl;
    }
  });
});
