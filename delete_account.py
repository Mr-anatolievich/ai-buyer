#!/usr/bin/env python3
import sqlite3
import sys

db_path = 'ai_buyer.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Показуємо поточні акаунти
cursor.execute('SELECT id, name, facebook_id FROM facebook_accounts')
accounts = cursor.fetchall()
print("Поточні акаунти:")
for account in accounts:
    print(f"  ID: {account[0]}, Name: {account[1]}, Facebook ID: {account[2]}")

# Питаємо який акаунт видалити
if len(sys.argv) > 1:
    account_id = int(sys.argv[1])
else:
    account_id = 1  # За замовчуванням видаляємо перший акаунт

print(f"\nВидаляю акаунт з ID: {account_id}")

# Видаляємо акаунт
cursor.execute('DELETE FROM facebook_accounts WHERE id = ?', (account_id,))
conn.commit()

if cursor.rowcount > 0:
    print(f"✅ Акаунт з ID {account_id} успішно видалений")
else:
    print(f"❌ Акаунт з ID {account_id} не знайдений")

# Показуємо оновлений список
cursor.execute('SELECT id, name, facebook_id FROM facebook_accounts')
accounts = cursor.fetchall()
print(f"\nЗалишилось акаунтів: {len(accounts)}")
for account in accounts:
    print(f"  ID: {account[0]}, Name: {account[1]}, Facebook ID: {account[2]}")

conn.close()