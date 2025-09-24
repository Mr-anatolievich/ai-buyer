#!/usr/bin/env python3
"""
Скрипт для тестування Facebook токенів
"""

import urllib.request
import json
import sys

def test_facebook_token(token):
    """Тестуємо Facebook токен"""
    try:
        # Перевіряємо токен
        print("🔍 Перевіряємо токен...")
        url = f"https://graph.facebook.com/v19.0/me?access_token={token}&fields=id,name"
        
        request = urllib.request.Request(url)
        with urllib.request.urlopen(request) as response:
            data = response.read()
            result = json.loads(data.decode('utf-8'))
            
        print(f"✅ Токен дійсний!")
        print(f"   Користувач: {result.get('name', 'Unknown')}")
        print(f"   ID: {result.get('id', 'Unknown')}")
        
        # Перевіряємо дозволи токена
        print("\n🔍 Перевіряємо дозволи токена...")
        permissions_url = f"https://graph.facebook.com/v19.0/me/permissions?access_token={token}"
        
        perm_request = urllib.request.Request(permissions_url)
        with urllib.request.urlopen(perm_request) as perm_response:
            perm_data = perm_response.read()
            perm_result = json.loads(perm_data.decode('utf-8'))
            
        print("📋 Дозволи токена:")
        for perm in perm_result.get('data', []):
            status = "✅" if perm.get('status') == 'granted' else "❌"
            print(f"   {status} {perm.get('permission')}")
            
        # Перевіряємо рекламні кабінети через /me/adaccounts
        print(f"\n🔍 Перевіряємо доступ до рекламних кабінетів через /me/adaccounts...")
        adaccounts_url = f"https://graph.facebook.com/v19.0/me/adaccounts?access_token={token}&fields=id,name,account_status,currency,timezone_name,business&limit=10"
        
        ad_request = urllib.request.Request(adaccounts_url)
        with urllib.request.urlopen(ad_request) as ad_response:
            ad_data = ad_response.read()
            ad_result = json.loads(ad_data.decode('utf-8'))
            
        if 'data' in ad_result and ad_result['data']:
            print(f"✅ Знайдено {len(ad_result['data'])} рекламних кабінетів:")
            for acc in ad_result['data']:
                print(f"   📊 {acc.get('name', 'Unknown')} (ID: {acc.get('id')}, Status: {acc.get('account_status', 'Unknown')})")
        else:
            print("❌ Рекламні кабінети не знайдені або немає доступу")
            
        return True
        
    except urllib.error.HTTPError as e:
        error_data = e.read().decode('utf-8')
        print(f"❌ Помилка HTTP {e.code}: {error_data}")
        return False
    except Exception as e:
        print(f"❌ Помилка: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Використання: python3 test_token.py <FACEBOOK_TOKEN>")
        print("Приклад: python3 test_token.py EAABs...")
        sys.exit(1)
    
    token = sys.argv[1]
    test_facebook_token(token)