# 📊 АНАЛІЗ МОЖЛИВОСТЕЙ FACEBOOK API
## Токен: window.__accessToken

### ✅ **ПІДТВЕРДЖЕНІ МОЖЛИВОСТІ**

#### 👤 **Користувач**
- **ID**: `100009868933766`
- **Ім'я**: `Yaroslav Saienko`
- **Доступ**: Повний доступ до профілю

#### 📄 **Сторінки Facebook (1 сторінка)**
- `Saienko adved Yaroslav` (ID: `101467126026974`)
- **Можливості**: Керування контентом, публікації, статистика

#### 👥 **Групи Facebook (3 групи)**
1. `[FIRE] Financial Independence & Retire Early In Ukraine` (CLOSED)
2. `Клуб Выпускников Alter Ego` (SECRET)  
3. `Вінницький торговельно-економічний інститут ДТЕУ` (OPEN)
- **Можливості**: Публікації в групах, модерація (залежно від ролі)

#### 💰 **Рекламні акаунти (5 акаунтів)**
1. `act_2223092757723160` - "Yaroslav Saienko" (Активний - Status: 2)
2. `act_217517989290782` - "Box" (Обмежений - Status: 101)
3. `act_1134731164052453` - "Yaroslav Saienko" (Обмежений - Status: 101)
4. `act_454349026558989` - "454349026558989" (Активний - Status: 1)
5. `act_1821709308741909` - "Yaroslav Saienko" (Активний - Status: 1)

#### 🏢 **Business Managers (3 бізнеси)**
1. `1826076314143105` - "Yaroslav Saіenko"
2. `700100720988663` - "Mr.anatolievich ADV"
3. `170732548845595` - "Yaroslav adved Saienko"

---

### 🚀 **ЩО ВИ МОЖЕТЕ РОБИТИ**

#### 📝 **Створення та Публікації**
```javascript
// Публікація на сторінці
POST /101467126026974/feed
{
  "message": "Текст публікації",
  "link": "https://example.com",
  "access_token": "PAGE_ACCESS_TOKEN"
}

// Публікація в групах (якщо є права)
POST /GROUP_ID/feed
{
  "message": "Текст для групи"
}
```

#### 💡 **Рекламні операції**
- ✅ Створення рекламних кампаній
- ✅ Керування існуючими кампаніями  
- ✅ Аналіз статистики реклами
- ✅ Створення аудиторій
- ✅ Керування бюджетами

```javascript
// Створення кампанії
POST /act_2223092757723160/campaigns
{
  "name": "Нова кампанія",
  "objective": "LINK_CLICKS",
  "status": "PAUSED"
}

// Створення рекламного набору
POST /act_2223092757723160/adsets
{
  "name": "Рекламний набір",
  "campaign_id": "CAMPAIGN_ID",
  "billing_event": "IMPRESSIONS",
  "optimization_goal": "LINK_CLICKS",
  "bid_amount": 100,
  "daily_budget": 1000,
  "targeting": {...}
}
```

#### 📊 **Аналітика та Звіти**
```javascript
// Статистика сторінки
GET /101467126026974/insights
?metric=page_views,page_likes,page_follows

// Статистика реклами
GET /act_2223092757723160/insights
?fields=spend,impressions,clicks,ctr,cpm
&date_preset=last_30d
```

#### 🔄 **Автоматизація**
- ✅ Планування публікацій
- ✅ Автоматичні відповіді на коментарі
- ✅ Керування рекламними бюджетами
- ✅ Моніторинг показників

---

### ⚠️ **ОБМЕЖЕННЯ ТА ВАЖЛИВІ НОТАТКИ**

#### 🚫 **Недоступні операції**
- ❌ Debug токена (потребує app access token)
- ❌ Створення нових сторінок (тільки через Business Manager UI)
- ❌ Масовий збір даних користувачів (обмеження API)
- ❌ Доступ до приватних повідомлень інших користувачів

#### ⏰ **Тимчасові обмеження**
- **Термін дії токена**: ~24 години (`window.__accessTokenExpirySecondsRemaining=86400`)
- **Rate Limits**: 200 запитів/годину на користувача
- **Бюджетні обмеження**: Залежать від налаштувань рекламних акаунтів

#### 📋 **Статуси рекламних акаунтів**
- **Status 1**: Активний (3 акаунти)
- **Status 2**: Активний з перевіркою (1 акаунт)  
- **Status 101**: Обмежений доступ (2 акаунти)

---

### 🛠️ **ПРАКТИЧНІ ПРИКЛАДИ ВИКОРИСТАННЯ**

#### 1. **Автоматична публікація контенту**
```python
def publish_to_page(page_id, message, link=None):
    data = {
        'message': message,
        'access_token': page_access_token
    }
    if link:
        data['link'] = link
    
    response = requests.post(
        f'https://graph.facebook.com/v18.0/{page_id}/feed',
        data=data
    )
    return response.json()
```

#### 2. **Моніторинг рекламних кампаній**
```python
def get_campaign_stats(ad_account_id, date_range='last_7d'):
    response = requests.get(
        f'https://graph.facebook.com/v18.0/{ad_account_id}/campaigns',
        params={
            'access_token': access_token,
            'fields': 'name,status,insights{spend,impressions,clicks,ctr}',
            'date_preset': date_range
        }
    )
    return response.json()
```

#### 3. **Створення рекламної кампанії**
```python
def create_campaign(ad_account_id, name, objective='LINK_CLICKS'):
    response = requests.post(
        f'https://graph.facebook.com/v18.0/{ad_account_id}/campaigns',
        data={
            'name': name,
            'objective': objective,
            'status': 'PAUSED',
            'access_token': access_token
        }
    )
    return response.json()
```

---

### 🔒 **БЕЗПЕКА ТА РЕКОМЕНДАЦІЇ**

#### 🛡️ **Захист токена**
- ❗ **ВАЖЛИВО**: Токен дійсний тільки 24 години
- 🔄 Оновлюйте токен регулярно
- 🚫 Ніколи не публікуйте токен в коді
- 💾 Зберігайте в змінних середовища

#### 📊 **Rate Limiting**
```python
import time
from datetime import datetime, timedelta

class FacebookAPIClient:
    def __init__(self, access_token):
        self.access_token = access_token
        self.requests_count = 0
        self.hour_start = datetime.now()
    
    def make_request(self, url, params=None):
        # Перевіряємо ліміт
        if datetime.now() - self.hour_start > timedelta(hours=1):
            self.requests_count = 0
            self.hour_start = datetime.now()
        
        if self.requests_count >= 200:
            sleep_time = 3600 - (datetime.now() - self.hour_start).seconds
            time.sleep(sleep_time)
            self.requests_count = 0
            self.hour_start = datetime.now()
        
        self.requests_count += 1
        # Виконуємо запит...
```

#### ⚖️ **Дотримання правил**
- 📜 Дотримуйтесь Facebook Platform Policy
- 🎯 Не перевищуйте ліміти запитів
- 👥 Не збирайте персональні дані без згоди
- 📢 Дотримуйтесь правил рекламування

---

### 🎯 **ВИСНОВОК**

Ваш токен надає **ШИРОКІ МОЖЛИВОСТІ** для:
- ✅ Повноцінного керування рекламою (5 акаунтів)
- ✅ Управління контентом сторінки  
- ✅ Публікацій в групах
- ✅ Аналітики та звітності
- ✅ Автоматизації маркетингових процесів

**Рекомендація**: Цей токен ідеально підходить для створення повноцінної системи автоматизації Facebook маркетингу! 🚀