#!/usr/bin/env python3
import sqlite3
import os

db_path = 'ai_buyer.db'
if not os.path.exists(db_path):
    print(f"База даних {db_path} не знайдена")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Перевіряємо структуру таблиці
cursor.execute("PRAGMA table_info(facebook_accounts)")
columns = cursor.fetchall()
print("Структура таблиці facebook_accounts:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# Перевіряємо дані
cursor.execute('SELECT * FROM facebook_accounts')
accounts = cursor.fetchall()
print(f"\nВсього акаунтів: {len(accounts)}")
for i, account in enumerate(accounts, 1):
    print(f"\nАкаунт #{i}:")
    print(f"  ID: {account[0]}")
    print(f"  Name: {account[1]}")
    print(f"  Email: {account[2]}")
    if len(account) > 3:
        print(f"  Primary BM: {account[3]}")
    if len(account) > 4:
        print(f"  Created: {account[4]}")

conn.close()