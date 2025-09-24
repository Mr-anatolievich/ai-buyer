#!/usr/bin/env python3
"""
Комплексна діагностика Facebook токена з розширеними перевірками
"""

import urllib.request
import urllib.parse
import json
import sys
import time

def test_token_comprehensive(token):
    """Комплексна діагностика Facebook токена"""
    
    print("🔍 === КОМПЛЕКСНА ДІАГНОСТИКА FACEBOOK ТОКЕНА ===\n")
    print(f"📝 Токен: {token[:20]}...{token[-10:]}")
    print(f"📏 Довжина: {len(token)} символів\n")
    
    # ===============================
    # КРОК 1: Базова перевірка токена
    # ===============================
    print("🔄 КРОК 1: Базова перевірка токена")
    try:
        url = "https://graph.facebook.com/v18.0/me"
        params = {'access_token': token}
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        with urllib.request.urlopen(request) as response:
            user_data = json.loads(response.read().decode('utf-8'))
            
        print(f"✅ Токен валідний!")
        print(f"   👤 Користувач: {user_data.get('name', 'N/A')}")
        print(f"   🆔 ID: {user_data.get('id', 'N/A')}")
        
        user_id = user_data.get('id')
        
    except urllib.error.HTTPError as e:
        error_data = e.read().decode('utf-8')
        try:
            error_json = json.loads(error_data)
            error_msg = error_json.get('error', {}).get('message', 'Unknown error')
            error_code = error_json.get('error', {}).get('code', 'Unknown')
        except:
            error_msg = error_data
            error_code = e.code
            
        print(f"❌ Токен невалідний: {error_msg} (код: {error_code})")
        
        if error_code == 190:
            print("💡 Рекомендація: Токен прострочений, згенеруйте новий")
        elif error_code == 1:
            print("💡 Рекомендація: Неправильний запит або токен. Перевірте формат токена")
            
        return False
        
    except Exception as e:
        print(f"❌ Помилка запиту: {e}")
        return False
    
    # ===============================
    # КРОК 2: Перевірка дозволів
    # ===============================
    print("\n🔄 КРОК 2: Перевірка дозволів токена")
    try:
        url = "https://graph.facebook.com/v18.0/me/permissions"
        params = {'access_token': token}
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        with urllib.request.urlopen(request) as response:
            perm_data = json.loads(response.read().decode('utf-8'))
            
        granted_perms = [p['permission'] for p in perm_data.get('data', []) if p.get('status') == 'granted']
        declined_perms = [p['permission'] for p in perm_data.get('data', []) if p.get('status') == 'declined']
        
        print(f"✅ Дозволи отримані!")
        print(f"📊 Всього дозволів: {len(perm_data.get('data', []))}")
        
        # Перевіряємо необхідні дозволи для рекламних кабінетів
        required_perms = ['ads_read', 'ads_management', 'business_management']
        
        print("\n📋 Необхідні дозволи для рекламних кабінетів:")
        for perm in required_perms:
            if perm in granted_perms:
                print(f"   ✅ {perm}: НАДАНО")
            elif perm in declined_perms:
                print(f"   ❌ {perm}: ВІДХИЛЕНО")
            else:
                print(f"   ⚠️ {perm}: НЕ ЗАПИТУВАЛОСЯ")
                
        ads_perms_granted = any(perm in granted_perms for perm in required_perms)
        
        if not ads_perms_granted:
            print("\n⚠️ Увага: Відсутні дозволи для роботи з рекламними кабінетами!")
            
    except Exception as e:
        print(f"❌ Помилка перевірки дозволів: {e}")
        ads_perms_granted = False
    
    # ===============================
    # КРОК 3: Спроба доступу до рекламних кабінетів
    # ===============================
    print("\n🔄 КРОК 3: Тестування доступу до рекламних кабінетів")
    
    # Метод 1: /me/adaccounts
    print("\n🧪 Метод 1: /me/adaccounts")
    try:
        url = "https://graph.facebook.com/v18.0/me/adaccounts"
        params = {
            'access_token': token,
            'fields': 'name,account_id,currency,account_status,timezone_name,balance'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        with urllib.request.urlopen(request) as response:
            ads_data = json.loads(response.read().decode('utf-8'))
            
        if 'data' in ads_data:
            print(f"✅ Успіх! Знайдено {len(ads_data['data'])} рекламних кабінетів:")
            for account in ads_data['data'][:5]:  # Показуємо перші 5
                print(f"   📊 {account.get('name', 'N/A')} (ID: {account.get('account_id', 'N/A')})")
                print(f"       Валюта: {account.get('currency', 'N/A')}, Статус: {account.get('account_status', 'N/A')}")
            
            if len(ads_data['data']) > 5:
                print(f"   ... та ще {len(ads_data['data']) - 5} кабінетів")
                
            return True
        else:
            print("⚠️ Немає даних про рекламні кабінети")
            
    except urllib.error.HTTPError as e:
        error_data = e.read().decode('utf-8')
        try:
            error_json = json.loads(error_data)
            error_msg = error_json.get('error', {}).get('message', 'Unknown error')
            error_code = error_json.get('error', {}).get('code', 'Unknown')
        except:
            error_msg = error_data
            error_code = e.code
            
        print(f"❌ Помилка: {error_msg} (код: {error_code})")
        
        if error_code == 200:
            print("💡 Рекомендація: Недостатньо дозволів. Додайте 'ads_read' при генерації токена")
        elif error_code == 190:
            print("💡 Рекомендація: Токен недійсний або прострочений")
            
    except Exception as e:
        print(f"❌ Помилка запиту: {e}")
    
    # Метод 2: Через бізнеси
    print("\n🧪 Метод 2: Через бізнес-акаунти")
    try:
        url = "https://graph.facebook.com/v18.0/me/businesses"
        params = {
            'access_token': token,
            'fields': 'name,id,created_time'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        with urllib.request.urlopen(request) as response:
            business_data = json.loads(response.read().decode('utf-8'))
            
        if 'data' in business_data and business_data['data']:
            print(f"✅ Знайдено {len(business_data['data'])} бізнес-акаунтів:")
            
            for business in business_data['data'][:3]:  # Перші 3 бізнеси
                print(f"   🏢 {business.get('name', 'N/A')} (ID: {business.get('id', 'N/A')})")
                
                # Спробуємо отримати рекламні кабінети бізнесу
                try:
                    biz_ads_url = f"https://graph.facebook.com/v18.0/{business['id']}/owned_ad_accounts"
                    biz_params = {
                        'access_token': token,
                        'fields': 'name,account_id,currency'
                    }
                    
                    biz_query = urllib.parse.urlencode(biz_params)
                    biz_full_url = f"{biz_ads_url}?{biz_query}"
                    
                    biz_request = urllib.request.Request(biz_full_url)
                    with urllib.request.urlopen(biz_request) as biz_response:
                        biz_ads_data = json.loads(biz_response.read().decode('utf-8'))
                        
                    if 'data' in biz_ads_data:
                        print(f"     📊 Рекламних кабінетів: {len(biz_ads_data['data'])}")
                        for acc in biz_ads_data['data'][:2]:
                            print(f"       - {acc.get('name', 'N/A')} ({acc.get('account_id', 'N/A')})")
                            
                except Exception as biz_e:
                    print(f"     ❌ Помилка отримання кабінетів: {biz_e}")
        else:
            print("⚠️ Бізнес-акаунти не знайдені або немає доступу")
            
    except Exception as e:
        print(f"❌ Помилка перевірки бізнесів: {e}")
    
    # ===============================
    # КРОК 4: Debug інформація токена
    # ===============================
    print("\n🔄 КРОК 4: Debug інформація токена")
    try:
        url = "https://graph.facebook.com/debug_token"
        params = {
            'input_token': token,
            'access_token': token
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        with urllib.request.urlopen(request) as response:
            debug_data = json.loads(response.read().decode('utf-8'))
            
        token_info = debug_data.get('data', {})
        
        print(f"✅ Debug інформація:")
        print(f"   🆔 App ID: {token_info.get('app_id', 'N/A')}")
        print(f"   👤 User ID: {token_info.get('user_id', 'N/A')}")
        print(f"   ⏰ Валідний: {token_info.get('is_valid', 'N/A')}")
        print(f"   🔐 Тип: {token_info.get('type', 'N/A')}")
        print(f"   📱 Платформа: {token_info.get('application', 'N/A')}")
        
        expires_at = token_info.get('expires_at')
        if expires_at:
            import datetime
            exp_date = datetime.datetime.fromtimestamp(expires_at)
            print(f"   ⏳ Термін дії до: {exp_date}")
        else:
            print(f"   ⏳ Термін дії: Не має терміну дії")
            
        scopes = token_info.get('scopes', [])
        if scopes:
            print(f"   📋 Дозволи в токені: {', '.join(scopes)}")
            
    except Exception as e:
        print(f"❌ Помилка debug інформації: {e}")
    
    print("\n🎯 === ЗАВЕРШЕННЯ ДІАГНОСТИКИ ===")
    return False

def main():
    if len(sys.argv) != 2:
        print("Використання: python3 comprehensive_token_test.py <FACEBOOK_TOKEN>")
        print("Приклад: python3 comprehensive_token_test.py EAABs...")
        sys.exit(1)
    
    token = sys.argv[1].strip()
    
    if not token:
        print("❌ Токен не може бути порожнім")
        sys.exit(1)
        
    if len(token) < 50:
        print("⚠️ Увага: Токен здається занадто коротким")
    
    # Запускаємо діагностику
    success = test_token_comprehensive(token)
    
    if success:
        print("\n🎉 Токен працює з рекламними кабінетами!")
        print("💡 Тепер ви можете оновити його в базі даних і тестувати API")
    else:
        print("\n❌ Токен не працює з рекламними кабінетами")
        print("💡 Згенеруйте новий токен з необхідними дозволами:")
        print("   - ads_read")
        print("   - business_management") 
        print("   - ads_management (опціонально)")

if __name__ == "__main__":
    main()