#!/usr/bin/env python3
import sqlite3

# Повний токен
token = "EAABsbCS1iHgBPjQA35bfhtlVZBZByfoyhM9aQMNZBiv746QIps3X8TPt1FTkr7jgvvZBTZAgarxOHuuwMfyHOqGmSqFg1SZBPZCOjFQIZBaZBIU0EJh7cZAlqhFtHkSUpJNKXgXjNzLTWe1qH5DNQXE2kZBdkZA0w4UZC5TBvAg0BjTZAnOoZBD0yZAwPDD27hQKhHkunkYwHgZDZD"

print(f"Довжина токена: {len(token)}")

# Підключаємося до бази даних
conn = sqlite3.connect('ai_buyer.db')
cursor = conn.cursor()

# Вставляємо новий запис
cursor.execute("""
    INSERT INTO facebook_accounts (
        name, facebook_id, group_name, status, token_status, access_token,
        user_agent, cookies_data, proxy_id, balance, daily_limit,
        cookies_loaded, primary_cabinet, primary_cabinet_id, total_cabinets
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    "Yaroslav Saienko Test",      # name
    "100009868933766",            # facebook_id
    "Main",                       # group_name
    "active",                     # status
    "active",                     # token_status
    token,                        # access_token (повний токен)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",  # user_agent
    "",                           # cookies_data
    None,                         # proxy_id
    "0",                          # balance
    "100",                        # daily_limit
    0,                            # cookies_loaded
    "",                           # primary_cabinet
    "",                           # primary_cabinet_id
    0                             # total_cabinets
))

# Зберігаємо зміни
conn.commit()

# Перевіряємо що вставилося
cursor.execute("SELECT id, name, facebook_id, LENGTH(access_token) as token_len FROM facebook_accounts ORDER BY id DESC LIMIT 1")
result = cursor.fetchone()
print(f"Створено запис: ID={result[0]}, Name={result[1]}, FB_ID={result[2]}, Token_Length={result[3]}")

# Закриваємо з'єднання
conn.close()

print("✅ Готово!")