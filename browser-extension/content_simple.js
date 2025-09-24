// Facebook Ad Accounts Extractor - Content Script
console.log("Facebook Ad Accounts Extractor запущено");

function extractAccounts() {
  console.log("Пошук рекламних кабінетів...");

  const accounts = new Set();
  const html = document.documentElement.outerHTML;

  // Regex патерни
  const regex = /act_(\d{8,})/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    accounts.add("act_" + match[1]);
  }

  console.log("Знайдено кабінетів:", accounts.size);
  console.log("Список:", Array.from(accounts));

  if (accounts.size > 0) {
    alert(
      "Знайдено " +
        accounts.size +
        " кабінетів: " +
        Array.from(accounts).join(", ")
    );
  } else {
    alert("Кабінети не знайдено");
  }

  return Array.from(accounts);
}

// Запуск через 3 секунди
setTimeout(extractAccounts, 3000);

console.log("Extractor готовий");
