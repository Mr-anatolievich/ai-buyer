#!/usr/bin/env python3
"""
Скрипт для оновлення Facebook токена в базі даних
"""
import sqlite3

def update_facebook_token():
    # Запитуємо новий токен у користувача
    print("🔑 Оновлення Facebook токена")
    print("Отримайте новий токен на: https://developers.facebook.com/tools/explorer/")
    print("Необхідні дозволи: ads_read, business_management")
    print()
    
    new_token = input("Введіть новий токен: ").strip()
    
    if not new_token:
        print("❌ Токен не може бути порожнім")
        return
    
    if len(new_token) < 50:
        print("❌ Токен здається занадто коротким")
        return
        
    # Оновлюємо в базі даних
    conn = sqlite3.connect('ai_buyer.db')
    cursor = conn.cursor()
    
    cursor.execute('UPDATE facebook_accounts SET access_token = ?, token_status = "active" WHERE id = 8', (new_token,))
    conn.commit()
    
    # Перевіряємо оновлення
    cursor.execute('SELECT id, name, LENGTH(access_token) as token_length FROM facebook_accounts WHERE id = 8')
    result = cursor.fetchone()
    
    conn.close()
    
    if result:
        print(f"✅ Токен оновлено!")
        print(f"   Account ID: {result[0]}")
        print(f"   Name: {result[1]}")
        print(f"   Token length: {result[2]} символів")
        print()
        print("🧪 Тепер протестуйте:")
        print("   curl 'http://localhost:8000/api/facebook/accounts/8/adaccounts'")
    else:
        print("❌ Помилка оновлення")

if __name__ == "__main__":
    update_facebook_token()