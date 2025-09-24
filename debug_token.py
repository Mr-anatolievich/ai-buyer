#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
import sys

def debug_facebook_token(token):
    """Детальне тестування Facebook токена"""
    
    print(f"🔍 Початок діагностики токена...")
    print(f"📝 Токен: {token[:20]}...")
    
    # Крок 1: Перевіряємо базову валідність токена
    print(f"\n=== КРОК 1: Базова перевірка токена ===")
    
    try:
        # Спрощений запит до /me без додаткових полів
        url = f"https://graph.facebook.com/v19.0/me?access_token={token}"
        print(f"🌐 URL: {url}")
        
        request = urllib.request.Request(url)
        request.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
        
        with urllib.request.urlopen(request) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"✅ Токен працює! User ID: {data.get('id')}, Name: {data.get('name', 'N/A')}")
            user_id = data.get('id')
            
    except urllib.error.HTTPError as e:
        error_data = e.read().decode('utf-8')
        print(f"❌ Крок 1 провалився: HTTP {e.code}")
        print(f"📋 Відповідь: {error_data}")
        return False
    except Exception as e:
        print(f"❌ Крок 1 провалився: {e}")
        return False
    
    # Крок 2: Перевіряємо debug інформацію токена
    print(f"\n=== КРОК 2: Debug інформація токена ===")
    
    try:
        debug_url = f"https://graph.facebook.com/debug_token?input_token={token}&access_token={token}"
        print(f"🌐 URL: {debug_url}")
        
        request = urllib.request.Request(debug_url)
        with urllib.request.urlopen(request) as response:
            debug_data = json.loads(response.read().decode('utf-8'))
            token_info = debug_data.get('data', {})
            
            print(f"✅ Debug інформація отримана:")
            print(f"   📱 App ID: {token_info.get('app_id')}")
            print(f"   👤 User ID: {token_info.get('user_id')}")
            print(f"   ⏰ Дійсний: {token_info.get('is_valid')}")
            print(f"   📅 Створено: {token_info.get('issued_at')}")
            print(f"   ⏳ Термін дії: {token_info.get('expires_at')}")
            print(f"   🔐 Тип: {token_info.get('type')}")
            print(f"   📋 Дозволи: {token_info.get('scopes', [])}")
            
    except Exception as e:
        print(f"❌ Крок 2 провалився: {e}")
    
    # Крок 3: Перевіряємо дозволи токена
    print(f"\n=== КРОК 3: Перевірка дозволів ===")
    
    try:
        perms_url = f"https://graph.facebook.com/v19.0/me/permissions?access_token={token}"
        print(f"🌐 URL: {perms_url}")
        
        request = urllib.request.Request(perms_url)
        with urllib.request.urlopen(request) as response:
            perms_data = json.loads(response.read().decode('utf-8'))
            
            print(f"✅ Дозволи отримані:")
            for perm in perms_data.get('data', []):
                status = "✅" if perm.get('status') == 'granted' else "❌"
                print(f"   {status} {perm.get('permission')}")
                
    except Exception as e:
        print(f"❌ Крок 3 провалився: {e}")
    
    # Крок 4: Тестуємо різні API endpoints
    print(f"\n=== КРОК 4: Тестування API endpoints ===")
    
    # Тест A: /me/accounts (Pages)
    print(f"\n🧪 Тест A: Facebook Pages (/me/accounts)")
    try:
        accounts_url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={token}"
        request = urllib.request.Request(accounts_url)
        with urllib.request.urlopen(request) as response:
            accounts_data = json.loads(response.read().decode('utf-8'))
            print(f"✅ Pages: {len(accounts_data.get('data', []))} знайдено")
            for page in accounts_data.get('data', [])[:3]:  # Показуємо тільки перші 3
                print(f"   📄 {page.get('name')} (ID: {page.get('id')})")
    except Exception as e:
        print(f"❌ Тест A провалився: {e}")
    
    # Тест B: /me/adaccounts
    print(f"\n🧪 Тест B: Ad Accounts (/me/adaccounts)")
    try:
        adaccounts_url = f"https://graph.facebook.com/v19.0/me/adaccounts?access_token={token}&fields=id,name,account_status"
        request = urllib.request.Request(adaccounts_url)
        with urllib.request.urlopen(request) as response:
            ad_data = json.loads(response.read().decode('utf-8'))
            print(f"✅ Ad Accounts: {len(ad_data.get('data', []))} знайдено")
            for account in ad_data.get('data', [])[:3]:
                print(f"   📊 {account.get('name')} (ID: {account.get('id')}, Status: {account.get('account_status')})")
    except Exception as e:
        print(f"❌ Тест B провалився: {e}")
    
    # Тест C: Businesses
    print(f"\n🧪 Тест C: Businesses (/me/businesses)")
    try:
        business_url = f"https://graph.facebook.com/v19.0/me/businesses?access_token={token}"
        request = urllib.request.Request(business_url)
        with urllib.request.urlopen(request) as response:
            business_data = json.loads(response.read().decode('utf-8'))
            print(f"✅ Businesses: {len(business_data.get('data', []))} знайдено")
            for business in business_data.get('data', [])[:3]:
                print(f"   🏢 {business.get('name')} (ID: {business.get('id')})")
    except Exception as e:
        print(f"❌ Тест C провалився: {e}")
    
    print(f"\n🎯 Діагностика завершена!")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Використання: python3 debug_token.py <FACEBOOK_TOKEN>")
        print("Приклад: python3 debug_token.py EAABs...")
        sys.exit(1)
    
    token = sys.argv[1]
    debug_facebook_token(token)