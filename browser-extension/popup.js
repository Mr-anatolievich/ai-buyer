document.addEventListener('DOMContentLoaded', function() {// Popup script

    const extractBtn = document.getElementById('extractBtn');document.addEventListener("DOMContentLoaded", async () => {

    const refreshBtn = document.getElementById('refreshBtn');  const extractBtn = document.getElementById("extractBtn");

    const copyAllBtn = document.getElementById('copyAllBtn');  const loading = document.getElementById("loading");

    const tokensDiv = document.getElementById('tokens');  const status = document.getElementById("status");

    const accountsDiv = document.getElementById('accounts');  const tokenInfo = document.getElementById("tokenInfo");

    const statusDiv = document.getElementById('status');  const tokenPreview = document.getElementById("tokenPreview");

    const lastUpdateSpan = document.getElementById('lastUpdate');  const userAgentPreview = document.getElementById("userAgentPreview");

    const pageInfoSpan = document.getElementById('pageInfo');  const cookiesCount = document.getElementById("cookiesCount");

      const copyMultiTokenBtn = document.getElementById("copyMultiTokenBtn");

    let currentData = null;  const sendToAIBuyerBtn = document.getElementById("sendToAIBuyerBtn");

      const aibuyerUrlInput = document.getElementById("aibuyerUrl");

    function updateStatus(message, type = 'info') {  const copySuccess = document.getElementById("copySuccess");

        statusDiv.className = `status ${type}`;

        statusDiv.textContent = message;  let currentData = null;

    }

      // Перевірка поточної вкладки

    function formatTime(timestamp) {  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!timestamp) return 'Never';  const currentTab = tabs[0];

        const date = new Date(timestamp);

        return date.toLocaleTimeString();  if (

    }    currentTab.url.includes("facebook.com") ||

        currentTab.url.includes("business.facebook.com") ||

    function displayTokens(tokens) {    currentTab.url.includes("adsmanager.facebook.com")

        if (!tokens || tokens.length === 0) {  ) {

            tokensDiv.innerHTML = '<div class="status error">No access tokens found</div>';    status.className = "status success";

            return;    status.textContent = "✅ Facebook сторінка знайдена";

        }    extractBtn.disabled = false;

          } else {

        tokensDiv.innerHTML = tokens.map(token => {    status.className = "status error";

            const shortToken = token.length > 40 ?     status.textContent = "❌ Потрібно відкрити Facebook Ads Manager";

                `${token.substring(0, 20)}...${token.substring(token.length - 10)}` :     extractBtn.disabled = true;

                token;  }

            

            return `  // Обробник кнопки витягування

                <div class="token" onclick="copyToClipboard('${token}')" title="Click to copy">  extractBtn.addEventListener("click", async () => {

                    ${shortToken}    try {

                    <button class="copy-btn" onclick="event.stopPropagation(); copyToClipboard('${token}')">Copy</button>      extractBtn.disabled = true;

                </div>      loading.style.display = "block";

            `;      status.className = "status warning";

        }).join('');      status.textContent = "⏳ Витягуємо дані...";

    }

          console.log("🔍 Початок витягування даних...");

    function displayAccounts(htmlAccounts, apiAccounts) {

        const allAccounts = new Set();      // Спочатку перевіряємо, чи є збережений токен

              const storageData = await chrome.storage.local.get(["lastFoundToken"]);

        // Add HTML accounts      console.log("💾 Збережені дані:", storageData);

        if (htmlAccounts && htmlAccounts.length > 0) {

            htmlAccounts.forEach(acc => allAccounts.add(acc));      let token = null;

        }      let userAgent = navigator.userAgent;

        

        // Add API accounts      if (storageData.lastFoundToken && storageData.lastFoundToken.token) {

        const apiAccountsData = [];        const tokenAge = Date.now() - storageData.lastFoundToken.timestamp;

        if (apiAccounts && apiAccounts.length > 0) {        if (tokenAge < 300000) {

            apiAccounts.forEach(acc => {          // 5 хвилин

                const accountId = `act_${acc.account_id}`;          token = storageData.lastFoundToken.token;

                allAccounts.add(accountId);          console.log("✅ Використовуємо збережений токен");

                apiAccountsData.push(acc);        }

            });      }

        }

              // Якщо немає збереженого токена, спробуємо витягти з content script

        if (allAccounts.size === 0) {      if (!token) {

            accountsDiv.innerHTML = '<div class="status error">No ad accounts found</div>';        console.log("🔍 Спробуємо витягти новий токен...");

            return;

        }        // Спочатку перевіряємо, чи завантажений content script

                let response;

        let html = '';        try {

                  console.log("📞 Ping content script...");

        // Display API accounts with details          response = await Promise.race([

        if (apiAccountsData.length > 0) {            chrome.tabs.sendMessage(currentTab.id, { action: "ping" }),

            html += apiAccountsData.map(acc => `            new Promise((_, reject) =>

                <div class="account">              setTimeout(() => reject(new Error("Timeout")), 3000)

                    <div>            ),

                        <div>act_${acc.account_id}</div>          ]);

                        <div class="account-name">${acc.name || 'N/A'} | ${acc.currency || 'N/A'} | ${acc.account_status || 'N/A'}</div>          console.log("✅ Content script відповів:", response);

                    </div>        } catch (error) {

                    <button class="copy-btn" onclick="copyToClipboard('act_${acc.account_id}')">Copy</button>          console.log("❌ Content script не відповідає:", error.message);

                </div>

            `).join('');          // Спробуємо інжектувати content script вручну

        }          try {

                    console.log("💉 Інжектуємо content script...");

        // Display HTML-only accounts            await chrome.scripting.executeScript({

        const htmlOnlyAccounts = Array.from(allAccounts).filter(acc =>               target: { tabId: currentTab.id },

            !apiAccountsData.some(api => `act_${api.account_id}` === acc)              files: ["content.js"],

        );            });

        

        if (htmlOnlyAccounts.length > 0) {            // Дамо час на ініціалізацію

            html += htmlOnlyAccounts.map(acc => `            await new Promise((resolve) => setTimeout(resolve, 2000));

                <div class="account">            console.log("✅ Content script інжектований");

                    <div>          } catch (injectError) {

                        <div>${acc}</div>            console.error("❌ Помилка інжекції content script:", injectError);

                        <div class="account-name">Found in HTML</div>          }

                    </div>        }

                    <button class="copy-btn" onclick="copyToClipboard('${acc}')">Copy</button>

                </div>        // Відправляємо повідомлення в content script

            `).join('');        try {

        }          console.log("📤 Запитуємо дані з content script...");

                  response = await Promise.race([

        accountsDiv.innerHTML = html;            chrome.tabs.sendMessage(currentTab.id, { action: "extractData" }),

    }            new Promise((_, reject) =>

                  setTimeout(

    function loadStoredData() {                () => reject(new Error("Timeout extracting data")),

        if (chrome && chrome.storage) {                5000

            chrome.storage.local.get(['lastExtraction'], function(result) {              )

                if (result.lastExtraction) {            ),

                    currentData = result.lastExtraction;          ]);

                    displayData(currentData);          console.log("📥 Отримано відповідь:", response);

                    lastUpdateSpan.textContent = formatTime(currentData.timestamp);

                    updateStatus('✅ Loaded cached data', 'success');          if (response && response.success && response.data.token) {

                }            token = response.data.token;

            });            userAgent = response.data.userAgent || userAgent;

        }            console.log("✅ Токен витягнуто з content script");

    }          }

            } catch (error) {

    function displayData(data) {          console.error("❌ Помилка зв'язку з content script:", error);

        if (!data) return;          // Не викидаємо помилку, спробуємо використати дані з DOM напряму

                }

        // Display tokens      }

        const tokens = [];

        if (data.accessToken) tokens.push(data.accessToken);      // Якщо все ще немає токена, покажемо помилку

        if (data.dtsgToken) tokens.push(data.dtsgToken);      if (!token) {

        displayTokens(tokens);        throw new Error(

                  "Токен не знайдений. Переконайтеся, що ви авторизовані в Facebook Ads Manager."

        // Display accounts        );

        displayAccounts(data.adAccounts, data.apiAccounts);      }

        

        // Update copy button      // Отримуємо cookies через Chrome API

        copyAllBtn.disabled = !tokens.length && !data.adAccounts?.length;      console.log("🍪 Отримуємо cookies...");

    }      const cookies = await chrome.cookies.getAll({

            domain: ".facebook.com",

    function getCurrentTab() {      });

        return new Promise((resolve) => {      console.log(`✅ Отримано ${cookies.length} cookies`);

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

                resolve(tabs[0]);      loading.style.display = "none";

            });

        });      // Готуємо дані

    }      currentData = {

            token: token,

    async function runExtraction() {        cookies: cookies,

        updateStatus('🔍 Extracting data...', 'info');        userAgent: userAgent,

        extractBtn.disabled = true;        url: currentTab.url,

              };

        try {

            const tab = await getCurrentTab();      // Показуємо інформацію

                  tokenPreview.textContent = currentData.token.substring(0, 50) + "...";

            if (!tab.url.includes('facebook.com')) {      userAgentPreview.textContent = currentData.userAgent;

                updateStatus('❌ Please navigate to facebook.com first', 'error');      cookiesCount.textContent = `${currentData.cookies.length} cookies`;

                extractBtn.disabled = false;

                return;      tokenInfo.style.display = "block";

            }      status.className = "status success";

                  status.textContent = "✅ Дані успішно витягнуто!";

            // Execute extraction directly

            chrome.tabs.executeScript(tab.id, {      console.log("🎉 Витягування завершено успішно!");

                code: `    } catch (error) {

                    if (typeof window.fbExtractor !== 'undefined') {      console.error("❌ Помилка:", error);

                        window.fbExtractor.runCompleteExtraction();      loading.style.display = "none";

                    } else {      status.className = "status error";

                        // Fallback extraction      status.textContent = "❌ Помилка: " + error.message;

                        const accounts = new Set();      extractBtn.disabled = false;

                        const pageHTML = document.documentElement.outerHTML;    }

                          });

                        const patterns = [

                            /act_(\\d{8,})/g,  // Обробник копіювання мультитокена

                            /"adAccountID":\\s*"(\\d{8,})"/g,  copyMultiTokenBtn.addEventListener("click", async () => {

                            /"account_id":\\s*"(\\d{8,})"/g    if (!currentData) return;

                        ];

                            try {

                        patterns.forEach(pattern => {      const multiToken = createMultiToken(

                            let match;        currentData.token,

                            while ((match = pattern.exec(pageHTML)) !== null) {        currentData.cookies,

                                const accountId = match[1];        currentData.userAgent

                                if (accountId && accountId.length >= 8) {      );

                                    accounts.add('act_' + accountId);

                                }      await navigator.clipboard.writeText(multiToken);

                            }

                        });      copySuccess.style.display = "block";

                              setTimeout(() => {

                        ({adAccounts: Array.from(accounts), accessToken: null, dtsgToken: null});        copySuccess.style.display = "none";

                    }      }, 3000);

                `    } catch (error) {

            }, function(result) {      console.error("Помилка копіювання:", error);

                if (result && result[0]) {      alert("Помилка копіювання в буфер обміну");

                    currentData = {    }

                        ...result[0],  });

                        timestamp: Date.now()

                    };  // Обробник відправки в AI-Buyer

                    displayData(currentData);  sendToAIBuyerBtn.addEventListener("click", async () => {

                    lastUpdateSpan.textContent = formatTime(Date.now());    if (!currentData) return;

                    

                    // Store data    try {

                    if (chrome && chrome.storage) {      const multiToken = createMultiToken(

                        chrome.storage.local.set({lastExtraction: currentData});        currentData.token,

                    }        currentData.cookies,

                            currentData.userAgent

                    const totalItems = [      );

                        currentData.accessToken ? 1 : 0,

                        currentData.dtsgToken ? 1 : 0,      // Отримуємо URL з поля вводу або використовуємо автовизначення

                        currentData.adAccounts ? currentData.adAccounts.length : 0      const customUrl = aibuyerUrlInput.value.trim();

                    ].reduce((a, b) => a + b, 0);

                          if (customUrl) {

                    updateStatus(`✅ Found ${totalItems} items`, 'success');        // Збережемо користувацький URL

                } else {        chrome.storage.local.set({ aibuyerUrl: customUrl });

                    updateStatus('❌ No data extracted', 'error');

                }        // Видаляємо кінцевий слеш якщо він є, щоб уникнути подвійного слеша

                        const baseUrl = customUrl.replace(/\/$/, "");

                extractBtn.disabled = false;        const fullUrl = `${baseUrl}/accounts/add?multitoken=${encodeURIComponent(

            });          multiToken

                    )}`;

        } catch (error) {        chrome.tabs.create({ url: fullUrl });

            console.error('Extraction error:', error);      } else {

            updateStatus('❌ Extraction failed', 'error');        // Автовизначення: спробуємо знайти працюючий сервер

            extractBtn.disabled = false;        const possibleUrls = [

        }          `http://localhost:8082/accounts/add?multitoken=${encodeURIComponent(

    }            multiToken

              )}`,

    function copyAllData() {          `http://localhost:8080/accounts/add?multitoken=${encodeURIComponent(

        if (!currentData) {            multiToken

            updateStatus('❌ No data to copy', 'error');          )}`,

            return;          `http://localhost:3000/accounts/add?multitoken=${encodeURIComponent(

        }            multiToken

                  )}`,

        const output = {          `http://localhost:5173/accounts/add?multitoken=${encodeURIComponent(

            timestamp: new Date().toISOString(),            multiToken

            accessToken: currentData.accessToken,          )}`,

            dtsgToken: currentData.dtsgToken,          `http://localhost:4173/accounts/add?multitoken=${encodeURIComponent(

            adAccounts: currentData.totalAccounts || currentData.adAccounts,            multiToken

            apiAccounts: currentData.apiAccounts          )}`,

        };        ];

        

        const text = JSON.stringify(output, null, 2);        let workingUrl = null;

        copyToClipboard(text);        for (const url of possibleUrls) {

        updateStatus('✅ All data copied to clipboard!', 'success');          try {

    }            const baseUrl = url.split("/accounts")[0];

                const response = await fetch(baseUrl, {

    // Event listeners              method: "HEAD",

    extractBtn.addEventListener('click', runExtraction);              signal: AbortSignal.timeout(2000), // 2 секунди timeout

    refreshBtn.addEventListener('click', loadStoredData);            });

    copyAllBtn.addEventListener('click', copyAllData);            if (response.ok || response.status === 404) {

                  // 404 означає що сервер працює

    // Update page info              workingUrl = url;

    getCurrentTab().then(tab => {              break;

        if (tab && tab.url) {            }

            if (tab.url.includes('facebook.com')) {          } catch (error) {

                if (tab.url.includes('adsmanager')) {            continue; // Спробуємо наступний URL

                    pageInfoSpan.textContent = '📊 Ads Manager';          }

                } else if (tab.url.includes('business')) {        }

                    pageInfoSpan.textContent = '🏢 Business Manager';

                } else {        if (workingUrl) {

                    pageInfoSpan.textContent = '📘 Facebook';          chrome.tabs.create({ url: workingUrl });

                }        } else {

            } else {          // Якщо жоден сервер не відповідає, використовуємо стандартний порт

                pageInfoSpan.textContent = '❌ Not Facebook';          chrome.tabs.create({ url: possibleUrls[0] });

            }        }

        }      }

    });    } catch (error) {

          console.error("Помилка відправки:", error);

    // Load stored data on popup open      alert("Помилка відправки в AI-Buyer");

    loadStoredData();    }

});  });



// Global copy function  // Функція створення мультитокена

function copyToClipboard(text) {  function createMultiToken(token, cookies, userAgent) {

    if (navigator.clipboard) {    const multiTokenData = {

        navigator.clipboard.writeText(text).then(() => {      cookies: cookies.map((cookie) => ({

            console.log('✅ Copied to clipboard:', text.substring(0, 50) + '...');        domain: cookie.domain,

        }).catch(err => {        expirationDate: cookie.expirationDate,

            console.error('❌ Copy failed:', err);        hostOnly: cookie.hostOnly,

        });        httpOnly: cookie.httpOnly,

    } else {        name: cookie.name,

        // Fallback        path: cookie.path,

        const textArea = document.createElement('textarea');        sameSite: cookie.sameSite || "no_restriction",

        textArea.value = text;        secure: cookie.secure,

        document.body.appendChild(textArea);        session: cookie.session,

        textArea.select();        storeId: cookie.storeId || "0",

        document.execCommand('copy');        value: cookie.value,

        document.body.removeChild(textArea);      })),

        console.log('✅ Copied to clipboard (fallback)');      ua: userAgent,

    }      token: token,

}    };

    return btoa(JSON.stringify(multiTokenData));
  }

  // Перевірка збережених даних та автоматичне заповнення
  chrome.storage.local.get(["lastFoundToken", "aibuyerUrl"], async (result) => {
    if (result.lastFoundToken) {
      const data = result.lastFoundToken;
      const age = Date.now() - data.timestamp;

      if (age < 300000) {
        // 5 хвилин
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
          url: data.url,
        };

        // Показуємо інформацію
        tokenPreview.textContent = currentData.token.substring(0, 50) + "...";
        userAgentPreview.textContent = currentData.userAgent;
        cookiesCount.textContent = `${currentData.cookies.length} cookies`;

        tokenInfo.style.display = "block";
        status.className = "status success";
        status.textContent =
          "🎉 Токен знайдено автоматично та готовий до використання!";
        extractBtn.disabled = false;
      }
    }

    // Завантажуємо збережений URL
    if (result.aibuyerUrl) {
      aibuyerUrlInput.value = result.aibuyerUrl;
    }
  });
});
