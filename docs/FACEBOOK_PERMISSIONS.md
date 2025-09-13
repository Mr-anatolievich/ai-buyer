# Додавання дозволів для Facebook Marketing API

## Поточні дозволи
✅ `business_management` - granted  
✅ `public_profile` - granted  
❌ `ads_read` - **ПОТРІБНО ДОДАТИ**  
❌ `ads_management` - **ПОТРІБНО ДОДАТИ**

## Як додати необхідні дозволи

### Метод 1: Через Graph API Explorer (Рекомендований)

1. Перейдіть на [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Виберіть вашу програму (App ID: 768047059552843)
3. У полі "Permissions" додайте:
   - `ads_read`
   - `ads_management`
4. Натисніть "Generate Access Token"
5. Пройдіть авторизацію та надайте дозволи
6. Скопіюйте новий токен

### Метод 2: Через URL авторизації

Перейдіть за цим посиланням (замініть YOUR_APP_ID на ваш):

```
https://www.facebook.com/v18.0/dialog/oauth?
  client_id=768047059552843&
  redirect_uri=https://localhost:3000&
  scope=ads_read,ads_management,business_management&
  response_type=token
```

### Метод 3: Програмно через JavaScript SDK

```javascript
FB.login(function(response) {
  if (response.authResponse) {
    console.log('Welcome! Fetching your information...');
    console.log('Access Token:', response.authResponse.accessToken);
  } else {
    console.log('User cancelled login or did not fully authorize.');
  }
}, {scope: 'ads_read,ads_management,business_management'});
```

## Які дозволи потрібні для різних операцій

### Базові операції:
- **ads_read** - читання даних реклами, кампаній, статистики
- **business_management** - доступ до бізнес-менеджера

### Розширені операції:
- **ads_management** - створення/редагування кампаній
- **pages_read_engagement** - статистика сторінок
- **instagram_basic** - базовий доступ до Instagram

## Що ви зможете робити після додавання дозволів:

### ✅ З поточними дозволами (`business_management`):
- Отримувати інформацію про користувача
- Перевіряти статус бізнес-акаунту

### 🔄 Після додавання `ads_read`:
- Переглядати рекламні акаунти
- Отримувати список кампаній
- Переглядати статистику кампаній/ad sets/реклам
- Експортувати звіти

### 🚀 Після додавання `ads_management`:
- Створювати нові кампанії
- Редагувати існуючі кампанії
- Змінювати бюджети
- Вмикати/вимикати кампанії
- Керувати таргетингом

## Тест після додавання дозволів

Після отримання нового токену з правильними дозволами, запустіть:

```bash
curl -X GET "https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency&access_token=YOUR_NEW_TOKEN"
```

## Безпека токенів

⚠️ **ВАЖЛИВО:**
- Токени мають обмежений термін дії (зазвичай 1-2 години)
- Для продакшну використовуйте довготривалі токени
- Ніколи не публікуйте токени у відкритому коді
- Регулярно оновлюйте токени

## Додаткова інформація

- [Facebook Login Permissions](https://developers.facebook.com/docs/permissions/reference)
- [Marketing API Permissions](https://developers.facebook.com/docs/marketing-api/overview/authorization)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)