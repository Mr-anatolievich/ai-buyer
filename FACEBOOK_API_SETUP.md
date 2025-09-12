# Facebook Marketing API Integration

## Налаштування Facebook Marketing API

### 1. Створення Facebook App

1. Перейдіть на [Facebook Developers](https://developers.facebook.com/)
2. Увійдіть у свій обліковий запис Facebook
3. Натисніть "Мої програми" → "Створити програму"
4. Виберіть тип програми "Бізнес"
5. Заповніть назву програми та контактну інформацію

### 2. Додавання Marketing API

1. У панелі програми знайдіть "Marketing API"
2. Натисніть "Налаштувати"
3. Дотримуйтесь інструкцій для налаштування

### 3. Отримання Access Token

1. Перейдіть до Інструментів → Graph API Explorer
2. Виберіть вашу програму
3. Додайте необхідні дозволи:
   - `ads_read`
   - `ads_management` 
   - `business_management`
4. Згенеруйте токен доступу
5. Продовжте термін дії токена (Generate Long-Lived Token)

### 4. Знаходження Ad Account ID

1. Перейдіть у [Facebook Ads Manager](https://business.facebook.com/adsmanager)
2. У лівому верхньому куті знайдіть селектор акаунтів
3. ID акаунту буде у форматі "act_1234567890"
4. Використовуйте тільки числову частину (без "act_")

### 5. Налаштування у додатку

1. Відкрийте сторінку "Статистика"
2. Натисніть кнопку "Facebook API"
3. Введіть отримані дані:
   - Access Token
   - App ID
   - App Secret
   - Ad Account ID
4. Натисніть "Тестувати з'єднання" для перевірки
5. Збережіть конфігурацію

### 6. Дозволи Facebook API

Для повноцінної роботи потрібні наступні дозволи:

**Базові дозволи:**
- `ads_read` - читання даних реклами
- `ads_management` - управління рекламою
- `business_management` - управління бізнес-акаунтом

**Додаткові дозволи (опціонально):**
- `pages_read_engagement` - статистика сторінок
- `instagram_basic` - базовий доступ до Instagram
- `leads_retrieval` - отримання лідів

### 7. Обмеження та квоти

- **Rate Limits**: Facebook обмежує кількість запитів
- **Data Retention**: Дані старше 37 місяців недоступні
- **Costs**: Можуть застосовуватися обмеження залежно від типу акаунту

### 8. Безпека

⚠️ **ВАЖЛИВО:**
- Ніколи не ділітеся Access Token
- Використовуйте короткотривалі токени для розробки
- Регулярно оновлюйте токени
- Зберігайте App Secret у безпечному місці

### 9. Підтримувані метрики

Система отримує наступні метрики:
- **Охват та покази**: reach, impressions, frequency
- **Клики та CTR**: clicks, ctr, cpc, cpm
- **Конверсії**: purchases, conversions, cvr, cpa
- **Бюджет та витрати**: spend, budget
- **ROI метрики**: roas, revenue, aov

### 10. Troubleshooting

**Помилка аутентифікації:**
- Перевірте правильність Access Token
- Переконайтеся, що токен не минув термін дії
- Перевірте дозволи програми

**Помилка доступу до акаунту:**
- Переконайтеся, що ви маєте доступ до рекламного акаунту
- Перевірте правильність Ad Account ID
- Переконайтеся, що акаунт активний

**Помилки Rate Limit:**
- Зменшіть частоту запитів
- Використовуйте кешування
- Розгляньте можливість отримання Business Manager verification

### 11. Додаткові ресурси

- [Facebook Marketing API Documentation](https://developers.facebook.com/docs/marketing-api/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Facebook Business Help Center](https://www.facebook.com/business/help/)
