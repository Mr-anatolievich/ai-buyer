#!/usr/bin/env python3
"""
Практичний приклад використання вашого Facebook токена
Демонструє всі підтверджені можливості
"""

import requests
import json
from datetime import datetime, timedelta

class FacebookAPIManager:
    def __init__(self, access_token):
        self.access_token = access_token
        self.base_url = "https://graph.facebook.com/v18.0"
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json'
        })
        
        # Встановлюємо cookies для кращої сумісності
        cookies = {
            'c_user': '100009868933766',
            'xs': '2%3ACqVMiZElsYwseQ%3A2%3A1758031310%3A-1%3A-1',
            'datr': 'iG3JaJiD_OaWqUY-9g5Zuyrk',
            'fr': '0PVtTk6IrtgEYNedS.AWde18ckjvtnLKPW-HQLQPJl1KDQhAch_gBORo8Wz6XjBeuw1tQ.BoyW2I..AAA.0.0.BoyW3N.AWdVjyBB23L0oqm-kV3681y6n-I'
        }
        
        for name, value in cookies.items():
            self.session.cookies.set(name, value, domain='.facebook.com')
    
    def get_user_info(self):
        """Отримати інформацію про користувача"""
        response = self.session.get(
            f"{self.base_url}/me",
            params={
                'access_token': self.access_token,
                'fields': 'id,name,email,first_name,last_name'
            }
        )
        return response.json()
    
    def get_managed_pages(self):
        """Отримати керовані сторінки"""
        response = self.session.get(
            f"{self.base_url}/me/accounts",
            params={
                'access_token': self.access_token,
                'fields': 'id,name,access_token,category,fan_count'
            }
        )
        return response.json()
    
    def get_ad_accounts(self):
        """Отримати рекламні акаунти"""
        response = self.session.get(
            f"{self.base_url}/me/adaccounts",
            params={
                'access_token': self.access_token,
                'fields': 'id,name,account_status,amount_spent,balance,currency,timezone_name'
            }
        )
        return response.json()
    
    def get_ad_account_insights(self, ad_account_id, date_preset='last_7d'):
        """Отримати статистику рекламного акаунту"""
        response = self.session.get(
            f"{self.base_url}/{ad_account_id}/insights",
            params={
                'access_token': self.access_token,
                'fields': 'spend,impressions,clicks,ctr,cpm,reach',
                'date_preset': date_preset
            }
        )
        return response.json()
    
    def get_campaigns(self, ad_account_id):
        """Отримати кампанії рекламного акаунту"""
        response = self.session.get(
            f"{self.base_url}/{ad_account_id}/campaigns",
            params={
                'access_token': self.access_token,
                'fields': 'id,name,status,objective,created_time,updated_time'
            }
        )
        return response.json()
    
    def get_businesses(self):
        """Отримати бізнеси користувача"""
        response = self.session.get(
            f"{self.base_url}/me/businesses",
            params={
                'access_token': self.access_token,
                'fields': 'id,name,verification_status,created_time'
            }
        )
        return response.json()
    
    def post_to_page(self, page_id, page_access_token, message, link=None):
        """Опублікувати пост на сторінці"""
        data = {
            'message': message,
            'access_token': page_access_token
        }
        if link:
            data['link'] = link
            
        response = self.session.post(
            f"{self.base_url}/{page_id}/feed",
            data=data
        )
        return response.json()
    
    def get_page_insights(self, page_id, page_access_token, metrics='page_views,page_likes'):
        """Отримати статистику сторінки"""
        response = self.session.get(
            f"{self.base_url}/{page_id}/insights",
            params={
                'access_token': page_access_token,
                'metric': metrics,
                'period': 'week'
            }
        )
        return response.json()
    
    def get_user_groups(self):
        """Отримати групи користувача"""
        response = self.session.get(
            f"{self.base_url}/me/groups",
            params={
                'access_token': self.access_token,
                'fields': 'id,name,privacy,description,member_count'
            }
        )
        return response.json()

def main():
    # Ваш токен
    access_token = "EAABsbCS1iHgBPTXd1oaRObDDlWlgqFaR9idoGh8Dis5YK8upTLpwkC5UrDonqeIlspZAccw1mOkEAW6OrbFxn0SMC9RZCjk9k5WtZC8OEUnJZBopWo03SjbPbxVdmSbuds8LxZCZAnLaX9ZCwNplaKnHOCgVSED1y1cBenHZA1Q2ZAnRtexyxOnhsiyL17ESZAZCG0kAZCLsZABbfM5lLFwnZBlgZDZD"
    
    fb = FacebookAPIManager(access_token)
    
    print("🚀 === ДЕМОНСТРАЦІЯ МОЖЛИВОСТЕЙ FACEBOOK API ===\n")
    
    # 1. Інформація користувача
    print("👤 1. Інформація користувача:")
    user_info = fb.get_user_info()
    print(f"   Ім'я: {user_info.get('name', 'N/A')}")
    print(f"   ID: {user_info.get('id', 'N/A')}\n")
    
    # 2. Керовані сторінки
    print("📄 2. Керовані сторінки:")
    pages = fb.get_managed_pages()
    if 'data' in pages:
        for page in pages['data']:
            print(f"   📋 {page.get('name', 'N/A')} (ID: {page.get('id', 'N/A')})")
            print(f"      Категорія: {page.get('category', 'N/A')}")
            print(f"      Підписники: {page.get('fan_count', 'N/A')}")
    print()
    
    # 3. Рекламні акаунти
    print("💰 3. Рекламні акаунти:")
    ad_accounts = fb.get_ad_accounts()
    if 'data' in ad_accounts:
        for account in ad_accounts['data']:
            print(f"   💳 {account.get('name', 'N/A')} (ID: {account.get('id', 'N/A')})")
            print(f"      Статус: {account.get('account_status', 'N/A')}")
            print(f"      Баланс: {account.get('balance', 'N/A')} {account.get('currency', 'USD')}")
            print(f"      Витрачено: {account.get('amount_spent', 'N/A')} {account.get('currency', 'USD')}")
            
            # Отримуємо статистику за тиждень
            insights = fb.get_ad_account_insights(account['id'])
            if 'data' in insights and insights['data']:
                insight = insights['data'][0]
                print(f"      📊 Статистика (7 днів):")
                print(f"         Витрати: {insight.get('spend', '0')} USD")
                print(f"         Покази: {insight.get('impressions', '0')}")
                print(f"         Кліки: {insight.get('clicks', '0')}")
            print()
    
    # 4. Бізнеси
    print("🏢 4. Бізнес-менеджери:")
    businesses = fb.get_businesses()
    if 'data' in businesses:
        for business in businesses['data']:
            print(f"   🏗️ {business.get('name', 'N/A')} (ID: {business.get('id', 'N/A')})")
            print(f"      Верифікація: {business.get('verification_status', 'N/A')}")
    print()
    
    # 5. Групи
    print("👥 5. Групи користувача:")
    groups = fb.get_user_groups()
    if 'data' in groups:
        for group in groups['data']:
            print(f"   👥 {group.get('name', 'N/A')}")
            print(f"      Приватність: {group.get('privacy', 'N/A')}")
            print(f"      Учасників: {group.get('member_count', 'N/A')}")
    print()
    
    # 6. Приклад публікації (якщо є сторінка)
    if 'data' in pages and pages['data']:
        page = pages['data'][0]
        page_id = page['id']
        page_token = page['access_token']
        
        print(f"📝 6. Приклад публікації на сторінці '{page['name']}':")
        print("   (Тестова публікація - можна видалити)")
        
        # Створюємо тестовий пост
        test_message = f"🤖 Тестова публікація через API - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        post_result = fb.post_to_page(page_id, page_token, test_message)
        if 'id' in post_result:
            print(f"   ✅ Пост створено! ID: {post_result['id']}")
        else:
            print(f"   ❌ Помилка: {post_result}")
    
    print("\n🎉 Демонстрація завершена!")
    print("\n📋 ВИСНОВОК:")
    print("✅ Ваш токен має широкі можливості для:")
    print("   - Читання всієї інформації про акаунти, сторінки, групи")
    print("   - Публікації контенту на сторінках")
    print("   - Аналізу рекламних показників") 
    print("   - Керування бізнес-активами")
    print("   - Моніторингу та звітності")

if __name__ == "__main__":
    main()