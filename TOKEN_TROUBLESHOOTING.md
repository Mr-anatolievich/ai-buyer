# 🔧 Покрокова інструкція отримання валідного Facebook токена

## Метод 1: Facebook Graph API Explorer (РЕКОМЕНДОВАНИЙ)

1. **Перейдіть на Graph API Explorer**: https://developers.facebook.com/tools/explorer/

2. **Налаштуйте параметри**:
   - Facebook App: Оберіть вашу app
   - User or Page: Оберіть "User Token"
   - Permissions: Додайте ці дозволи:
     ```
     ads_read
     ads_management
     business_management
     pages_read_engagement
     ```

3. **Згенеруйте токен**:
   - Натисніть "Generate Access Token"
   - Авторизуйтесь у Facebook
   - Надайте всі запитані дозволи

4. **Перевірте токен**:
   - У полі буде новий токен
   - Натисніть "Submit" щоб перевірити
   - Якщо працює - скопіюйте токен

## Метод 2: Через Facebook Business Manager

1. **Перейдіть в Business Settings**: https://business.facebook.com/settings/

2. **Системні користувачі**:
   - Users → System Users
   - Натисніть "Add" для створення системного користувача
   - Назвіть його "API User"

3. **Призначте дозволи**:
   - Оберіть системного користувача
   - Add Assets → Apps → Оберіть вашу app
   - Надайте права: "Ads management standard access"

4. **Згенеруйте токен**:
   - Натисніть "Generate New Token"
   - Оберіть потрібні дозволи: ads_read, business_management
   - Збережіть токен (він не expire)

## Метод 3: Перевірте що ваша App має доступ

1. **Facebook App Dashboard**: https://developers.facebook.com/apps/

2. **App Review**:
   - Перейдіть в App Review → Permissions and features
   - Перевірте статус цих дозволів:
     - `ads_read` - має бути "Approved" або "In development"
     - `business_management` - має бути доступний

3. **Marketing API**:
   - Products → Marketing API
   - Переконайтесь що Marketing API додано до app

## ⚠️ Важливі перевірки:

### Перевірка 1: App Type
- Standard apps можуть тестувати з обмеженими даними
- Business apps мають повний доступ

### Перевірка 2: Verification
- Деякі дозволи потребують Business Verification
- Перевірте статус верифікації в Business Manager

### Перевірка 3: Rate Limits
- Нові токени можуть мати тимчасові обмеження
- Зачекайте 5-10 хвилин після створення

## 🧪 Тест токена після отримання:

```bash
# Базовий тест
curl "https://graph.facebook.com/v19.0/me?access_token=ВАШ_ТОКЕН"

# Тест дозволів
curl "https://graph.facebook.com/v19.0/me/permissions?access_token=ВАШ_ТОКЕН"

# Тест рекламних кабінетів
curl "https://graph.facebook.com/v19.0/me/adaccounts?access_token=ВАШ_ТОКЕН&fields=id,name"
```

Якщо базовий тест не працює - проблема з токеном або app налаштуваннями.