// Тестовий скрипт для перевірки Facebook API
// Запустіть цей скрипт у браузерній консолі для тестування

const ACCESS_TOKEN =
  "EAAK6iOQnyksBPcyaqKnpq3MxQjyGajXnUvnDZCpJs1w6ZBcCYOAGpdPUwfaFvZBZBbMGFFfd6YM09FsAVyjWqDIZA3CIJrePPVipuiR6557YReAhZBphDbq1ZBYS62GC03gfAT7hUtLypHTMx4310jbhW1LOBRG0ahCbP3XLIHkTmpUPalAZAyYA01qzk7kAkmhOQdZCeKZBwbmOgRamRxHybGZBFLR9LRZCFIsMlqadzou2jaSGW4hurPADCAZBBn1DG3P8ZD";

// 1. Перевірка інформації про користувача
async function testUserInfo() {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`
    );
    const data = await response.json();
    console.log("Інформація про користувача:", data);
    return data;
  } catch (error) {
    console.error("Помилка отримання інформації про користувача:", error);
  }
}

// 2. Отримання рекламних акаунтів
async function testAdAccounts() {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${ACCESS_TOKEN}`
    );
    const data = await response.json();
    console.log("Рекламні акаунти:", data);
    return data;
  } catch (error) {
    console.error("Помилка отримання рекламних акаунтів:", error);
  }
}

// 3. Тестування доступу до кампаній (замініть AD_ACCOUNT_ID на ваш)
async function testCampaigns(adAccountId) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns?fields=id,name,status,effective_status&access_token=${ACCESS_TOKEN}`
    );
    const data = await response.json();
    console.log("Кампанії:", data);
    return data;
  } catch (error) {
    console.error("Помилка отримання кампаній:", error);
  }
}

// 4. Перевірка дозволів токену
async function testTokenPermissions() {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${ACCESS_TOKEN}`
    );
    const data = await response.json();
    console.log("Дозволи токену:", data);
    return data;
  } catch (error) {
    console.error("Помилка перевірки дозволів:", error);
  }
}

// Запуск всіх тестів
async function runAllTests() {
  console.log("🚀 Початок тестування Facebook API...\n");

  console.log("1️⃣ Перевірка користувача...");
  const userInfo = await testUserInfo();

  console.log("\n2️⃣ Перевірка дозволів...");
  const permissions = await testTokenPermissions();

  console.log("\n3️⃣ Отримання рекламних акаунтів...");
  const adAccounts = await testAdAccounts();

  if (adAccounts && adAccounts.data && adAccounts.data.length > 0) {
    const firstAccountId = adAccounts.data[0].id.replace("act_", "");
    console.log(`\n4️⃣ Тестування кампаній для акаунту ${firstAccountId}...`);
    await testCampaigns(firstAccountId);
  }

  console.log("\n✅ Тестування завершено!");
}

// Запустити тести
runAllTests();
