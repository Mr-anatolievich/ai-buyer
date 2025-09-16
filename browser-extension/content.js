// Content script для витягування токенів з Facebook
console.log("🤖 AI-Buyer: Content script loaded on", window.location.href);

// Функція для витягування Access Token з Facebook
function extractAccessToken() {
  console.log("🔍 Шукаємо Access Token...");

  // Метод 1: З localStorage
  const storageKeys = Object.keys(localStorage);
  for (const key of storageKeys) {
    try {
      const value = localStorage.getItem(key);
      if (value && value.includes("EAAB")) {
        const tokenMatch = value.match(/EAAB[A-Za-z0-9-_]+/);
        if (tokenMatch) {
          console.log("✅ Token знайдено в localStorage");
          return tokenMatch[0];
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Метод 2: З sessionStorage
  const sessionKeys = Object.keys(sessionStorage);
  for (const key of sessionKeys) {
    try {
      const value = sessionStorage.getItem(key);
      if (value && value.includes("EAAB")) {
        const tokenMatch = value.match(/EAAB[A-Za-z0-9-_]+/);
        if (tokenMatch) {
          console.log("✅ Token знайдено в sessionStorage");
          return tokenMatch[0];
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Метод 3: З глобальних змінних
  try {
    if (window.require && window.require.cache) {
      const modules = Object.values(window.require.cache);
      for (const module of modules) {
        if (module && module.exports) {
          const moduleStr = JSON.stringify(module.exports);
          if (moduleStr.includes("EAAB")) {
            const tokenMatch = moduleStr.match(/EAAB[A-Za-z0-9-_]+/);
            if (tokenMatch) {
              console.log("✅ Token знайдено в require.cache");
              return tokenMatch[0];
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }

  // Метод 4: З DOM елементів
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    if (script.textContent && script.textContent.includes("EAAB")) {
      const tokenMatch = script.textContent.match(/EAAB[A-Za-z0-9-_]+/);
      if (tokenMatch) {
        console.log("✅ Token знайдено в script тегах");
        return tokenMatch[0];
      }
    }
  }

  // Метод 5: З мета тегів
  const metaTags = document.querySelectorAll("meta");
  for (const meta of metaTags) {
    if (meta.content && meta.content.includes("EAAB")) {
      const tokenMatch = meta.content.match(/EAAB[A-Za-z0-9-_]+/);
      if (tokenMatch) {
        console.log("✅ Token знайдено в meta тегах");
        return tokenMatch[0];
      }
    }
  }

  console.log("❌ Token не знайдено");
  return null;
}

// Функція для витягування всіх cookies
function extractCookies() {
  const cookies = document.cookie.split(";").map((cookie) => {
    const [name, value] = cookie.trim().split("=");
    return {
      name: name,
      value: value || "",
      domain: window.location.hostname,
      path: "/",
      secure: window.location.protocol === "https:",
      httpOnly: false,
      sameSite: "no_restriction",
    };
  });

  console.log(`🍪 Знайдено ${cookies.length} cookies`);
  return cookies;
}

// Функція для отримання UserAgent
function getUserAgent() {
  const userAgent = navigator.userAgent;
  console.log("🌐 UserAgent:", userAgent);
  return userAgent;
}

// Функція для створення мультитокена
function createMultiToken(token, cookies, userAgent) {
  const multiToken = {
    cookies: cookies,
    ua: userAgent,
    token: token,
  };

  return btoa(JSON.stringify(multiToken));
}

// Слухач повідомлень від popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Отримано повідомлення:", request);

  if (request.action === "extractData") {
    try {
      const token = extractAccessToken();
      const cookies = extractCookies();
      const userAgent = getUserAgent();

      if (token) {
        const multiToken = createMultiToken(token, cookies, userAgent);

        sendResponse({
          success: true,
          data: {
            token: token,
            cookies: cookies,
            userAgent: userAgent,
            multiToken: multiToken,
            url: window.location.href,
          },
        });
      } else {
        sendResponse({
          success: false,
          error:
            "Access Token не знайдено. Переконайтеся, що ви авторизовані в Facebook Ads Manager.",
        });
      }
    } catch (error) {
      console.error("❌ Помилка витягування даних:", error);
      sendResponse({
        success: false,
        error: "Помилка витягування даних: " + error.message,
      });
    }
  }

  return true; // Allows async response
});

// Автоматичне витягування при завантаженні сторінки
window.addEventListener("load", () => {
  setTimeout(() => {
    const token = extractAccessToken();
    if (token) {
      console.log("🎉 Token автоматично знайдено при завантаженні сторінки");
      chrome.runtime.sendMessage({
        action: "tokenFound",
        token: token,
      });
    }
  }, 3000);
});
