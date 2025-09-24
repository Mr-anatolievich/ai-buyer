# 🔑 Інструкція з отримання валідного Facebook токена

## Проблема
Поточний токен `EAABsbCS1iHgBPjQA35bfht...` не працює з Facebook Graph API.
Facebook повертає помилку: `{"error":{"message":"Invalid request.","type":"OAuthException","code":1}}`

## Причини чому токен може не працювати:
1. **Термін дії вичерпався** - User Access Tokens зазвичай діють 1-2 години
2. **Неправильні дозволи** - токен не має дозволу `ads_read` для доступу до рекламних кабінетів
3. **Тип токена** - потрібен User Access Token з правильними scope
4. **Facebook App налаштування** - app може бути не налаштований для Business API

## ✅ Як отримати валідний токен:

### Спосіб 1: Facebook Graph API Explorer (Найлегший)
1. Перейдіть на https://developers.facebook.com/tools/explorer/
2. Оберіть вашу Facebook App
3. У полі "Permissions" додайте:
   - `ads_read` (для читання рекламних кабінетів)
   - `business_management` (для управління бізнес-акаунтами)
   - `pages_read_engagement` (якщо потрібен доступ до сторінок)
4. Натисніть "Generate Access Token"
5. Авторизуйтесь і надайте дозволи
6. Скопіюйте отриманий токен

### Спосіб 2: Facebook Business Manager
1. Перейдіть в Facebook Business Manager
2. Налаштування → Системи → Бізнес-інтеграції
3. Створіть системного користувача з правами `ads_read`
4. Згенеруйте токен для системного користувача

### Спосіб 3: OAuth 2.0 Flow (Програмний)
```javascript
// URL для авторизації
const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?
  client_id={app-id}&
  redirect_uri={redirect-uri}&
  scope=ads_read,business_management&
  response_type=code`;

// Після авторизації обміняйте code на access_token
const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?
  client_id={app-id}&
  client_secret={app-secret}&
  redirect_uri={redirect-uri}&
  code={authorization-code}`;
```

## 🧪 Тестування нового токена:

Після отримання нового токена, протестуйте його:

```bash
# 1. Збережіть токен у змінну
export FB_TOKEN="ваш_новий_токен"

# 2. Протестуйте базовий доступ
curl "https://graph.facebook.com/v19.0/me?access_token=$FB_TOKEN"

# 3. Протестуйте доступ до рекламних кабінетів
curl "https://graph.facebook.com/v19.0/me/adaccounts?access_token=$FB_TOKEN&fields=id,name,account_status"

# 4. Перевірте дозволи
curl "https://graph.facebook.com/v19.0/me/permissions?access_token=$FB_TOKEN"
```

## 🚀 Коли отримаєте валідний токен:

1. Запустіть наш скрипт для тестування:
```bash
python3 debug_token.py НОВИЙ_ТОКЕН
```

2. Якщо тест пройде успішно, оновіть базу даних:
```bash
python3 -c "
import sqlite3
token = 'НОВИЙ_ТОКЕН'
conn = sqlite3.connect('ai_buyer.db')
conn.execute('UPDATE facebook_accounts SET access_token = ? WHERE id = 8', (token,))
conn.commit()
print('✅ Токен оновлено!')
"
```

3. Перезапустіть backend і тестуйте функціонал рекламних кабінетів

## 📋 Необхідні дозволи для роботи:
- `ads_read` - читання рекламних кабінетів
- `business_management` - управління бізнес-акаунтами  
- `pages_read_engagement` - доступ до сторінок (опціонально)

## ⚠️ Важливо:
- User Access Tokens мають короткий термін дії (1-2 години)
- Для продакшн використовуйте Long-lived tokens або системних користувачів
- Переконайтесь що ваша Facebook App має доступ до Marketing API