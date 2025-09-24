// Facebook Ad Accounts Extractor - Popup Script
console.log("🎯 Facebook Ad Accounts Extractor Popup завантажено");

class ExtractorPopup {
  constructor() {
    this.results = null;
    this.initializeUI();
    this.loadSavedResults();
  }

  initializeUI() {
    // Отримуємо елементи
    this.statusEl = document.getElementById("status");
    this.extractBtn = document.getElementById("extractBtn");
    this.sendBtn = document.getElementById("sendBtn");
    this.resultsEl = document.getElementById("results");
    this.sendResultsEl = document.getElementById("sendResults");
    this.errorEl = document.getElementById("error");

    // Додаємо обробники подій
    if (this.extractBtn) {
      this.extractBtn.addEventListener("click", () => this.extractNow());
    }

    if (this.sendBtn) {
      this.sendBtn.addEventListener("click", () => this.sendToBackend());
    }

    // Перевіряємо поточну сторінку
    this.checkCurrentTab();
  }

  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.url.includes("facebook.com")) {
        this.updateStatus(
          "success",
          "На сторінці Facebook",
          "Розширення готове до роботи"
        );

        if (tab.url.includes("adsmanager")) {
          this.updateStatus(
            "success",
            "На Ads Manager",
            "Ідеальна сторінка для витягування!"
          );
        }
      } else {
        this.updateStatus(
          "warning",
          "Не на Facebook",
          "Перейдіть на facebook.com для використання"
        );
      }

      // Оновлюємо інфо про поточну URL
      const currentUrlEl = document.getElementById("currentUrl");
      if (currentUrlEl) {
        currentUrlEl.textContent = tab.url;
      }
    } catch (error) {
      this.updateStatus(
        "error",
        "Помилка",
        "Не вдалося отримати інформацію про сторінку"
      );
    }
  }

  async extractNow() {
    this.extractBtn.disabled = true;
    this.extractBtn.textContent = "⏳ Витягування...";

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url.includes("facebook.com")) {
        throw new Error("Потрібно бути на сторінці Facebook");
      }

      // Відправляємо повідомлення до content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "EXTRACT_NOW",
      });

      if (response && response.success) {
        this.updateStatus(
          "success",
          "Витягування запущено",
          "Очікуйте результати..."
        );

        // Чекаємо результати
        setTimeout(() => this.loadSavedResults(), 2000);
      } else {
        throw new Error("Content script не відповідає");
      }
    } catch (error) {
      console.error("Помилка витягування:", error);
      this.updateStatus("error", "Помилка витягування", error.message);
    } finally {
      this.extractBtn.disabled = false;
      this.extractBtn.textContent = "🔍 Витягнути зараз";
    }
  }

  async loadSavedResults() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url.includes("facebook.com")) {
        return;
      }

      // Отримуємо збережені результати з content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "GET_RESULTS",
      });

      if (response && response.success && response.data) {
        this.results = response.data;
        this.displayResults(this.results);
      }
    } catch (error) {
      // Content script може не бути завантажений - це нормально
      console.log(
        "Не вдалося завантажити збережені результати:",
        error.message
      );
    }
  }

  displayResults(data) {
    if (!data || !data.accounts) {
      return;
    }

    console.log("📊 Відображаємо результати:", data);

    // Оновлюємо лічильник
    const countEl = document.getElementById("accountsCount");
    if (countEl) {
      countEl.textContent = data.total_accounts || 0;
    }

    // Список кабінетів
    const listEl = document.getElementById("accountsList");
    if (listEl) {
      if (data.accounts.length > 0) {
        listEl.innerHTML = data.accounts
          .map((account) => `<div class="account-item">🎯 ${account}</div>`)
          .join("");
      } else {
        listEl.innerHTML =
          '<div class="account-item" style="text-align: center; color: #6c757d;">Кабінети не знайдено</div>';
      }
    }

    // Джерела даних
    const sourcesEl = document.getElementById("sourcesInfo");
    if (sourcesEl && data.detailed_data) {
      const sources = [
        ...new Set(data.detailed_data.map((item) => item.source)),
      ];
      sourcesEl.innerHTML = sources
        .map(
          (source) =>
            `<span style="background: #e9ecef; padding: 2px 6px; border-radius: 3px; margin: 2px; font-size: 10px;">${source}</span>`
        )
        .join("");
    }

    // Показуємо результати та кнопку відправки
    if (this.resultsEl) {
      this.resultsEl.style.display = "block";
    }

    if (this.sendBtn && data.total_accounts > 0) {
      this.sendBtn.style.display = "inline-block";
    }

    // Оновлюємо статус
    if (data.total_accounts > 0) {
      this.updateStatus(
        "success",
        `Знайдено ${data.total_accounts} кабінетів`,
        "Готово до відправки!"
      );
    } else {
      this.updateStatus(
        "warning",
        "Кабінети не знайдено",
        "Спробуйте на сторінці Ads Manager"
      );
    }
  }

  async sendToBackend() {
    if (!this.results) {
      this.updateStatus("error", "Немає даних", "Спочатку витягніть дані");
      return;
    }

    this.sendBtn.disabled = true;
    this.sendBtn.textContent = "📤 Відправляємо...";

    try {
      const response = await fetch(
        "http://localhost:8000/api/facebook/extension-data",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.results),
        }
      );

      if (response.ok) {
        this.updateStatus(
          "success",
          "Успішно відправлено!",
          "Дані збережено в AI-Buyer"
        );
        if (this.sendResultsEl) {
          this.sendResultsEl.style.display = "block";
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Помилка відправки:", error);
      this.updateStatus(
        "error",
        "Помилка відправки",
        `Backend недоступний: ${error.message}`
      );
    } finally {
      this.sendBtn.disabled = false;
      this.sendBtn.textContent = "📤 Відправити";
    }
  }

  updateStatus(type, title, message) {
    if (!this.statusEl) return;

    this.statusEl.className = `status ${type}`;
    this.statusEl.innerHTML = `<strong>${title}</strong><br>${message}`;
  }

  showError(message) {
    if (this.errorEl) {
      const errorMessageEl = document.getElementById("errorMessage");
      if (errorMessageEl) {
        errorMessageEl.textContent = message;
      }
      this.errorEl.style.display = "block";
    }
  }
}

// Слухач повідомлень від content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Popup отримав повідомлення:", request);

  if (request.type === "AD_ACCOUNTS_EXTRACTED") {
    popup.results = request.data;
    popup.displayResults(request.data);
  }
});

// Ініціалізація при завантаженні DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Ініціалізація Popup");
  window.popup = new ExtractorPopup();
});

console.log("✅ Popup script завантажено");
