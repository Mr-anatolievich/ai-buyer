#!/usr/bin/env python3
"""
Тестування можливостей Facebook API з наданими токенами
"""

import requests
import json
from typing import Dict, List, Optional

class FacebookAPITester:
    def __init__(self, access_token: str, user_agent: str, cookies: List[Dict]):
        self.access_token = access_token
        self.user_agent = user_agent
        self.cookies = {cookie['name']: cookie['value'] for cookie in cookies}
        self.base_url = "https://graph.facebook.com/v18.0"
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': user_agent,
            'Accept': 'application/json',
            'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
        })
        
        # Встановлюємо cookies
        for cookie in cookies:
            self.session.cookies.set(
                cookie['name'], 
                cookie['value'], 
                domain=cookie['domain']
            )
    
    def test_token_validity(self) -> Dict:
        """Перевіряє чи дійсний токен"""
        try:
            response = self.session.get(
                f"{self.base_url}/me",
                params={
                    'access_token': self.access_token,
                    'fields': 'id,name'
                }
            )
            return {
                'valid': response.status_code == 200,
                'data': response.json(),
                'status_code': response.status_code
            }
        except Exception as e:
            return {'valid': False, 'error': str(e)}
    
    def get_token_permissions(self) -> Dict:
        """Отримує дозволи токена"""
        try:
            response = self.session.get(
                f"{self.base_url}/debug_token",
                params={
                    'input_token': self.access_token,
                    'access_token': self.access_token
                }
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_user_info(self) -> Dict:
        """Базова інформація користувача"""
        try:
            response = self.session.get(
                f"{self.base_url}/me",
                params={
                    'access_token': self.access_token,
                    'fields': 'id,name,email,first_name,last_name,picture,locale'
                }
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_pages(self) -> Dict:
        """Сторінки, якими керує користувач"""
        try:
            response = self.session.get(
                f"{self.base_url}/me/accounts",
                params={'access_token': self.access_token}
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_groups(self) -> Dict:
        """Групи користувача"""
        try:
            response = self.session.get(
                f"{self.base_url}/me/groups",
                params={'access_token': self.access_token}
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def test_posting_capability(self, page_id: str, page_token: str) -> Dict:
        """Тестує можливість публікації на сторінці"""
        try:
            response = self.session.post(
                f"{self.base_url}/{page_id}/feed",
                params={
                    'access_token': page_token,
                    'message': 'Test post from API - можна видалити'
                }
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    def get_ad_accounts(self) -> Dict:
        """Рекламні акаунти"""
        try:
            response = self.session.get(
                f"{self.base_url}/me/adaccounts",
                params={
                    'access_token': self.access_token,
                    'fields': 'id,name,account_status,business'
                }
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}

def main():
    # Новий токен з window.__accessToken
    access_token = "EAABsbCS1iHgBPTXd1oaRObDDlWlgqFaR9idoGh8Dis5YK8upTLpwkC5UrDonqeIlspZAccw1mOkEAW6OrbFxn0SMC9RZCjk9k5WtZC8OEUnJZBopWo03SjbPbxVdmSbuds8LxZCZAnLaX9ZCwNplaKnHOCgVSED1y1cBenHZA1Q2ZAnRtexyxOnhsiyL17ESZAZCG0kAZCLsZABbfM5lLFwnZBlgZDZD"
    
    user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
    
    cookies = [
        {"name": "c_user", "value": "100009868933766", "domain": ".facebook.com"},
        {"name": "xs", "value": "2%3ACqVMiZElsYwseQ%3A2%3A1758031310%3A-1%3A-1", "domain": ".facebook.com"},
        {"name": "datr", "value": "iG3JaJiD_OaWqUY-9g5Zuyrk", "domain": ".facebook.com"},
        {"name": "sb", "value": "jG3JaGZuTf6VyZjjYH4wf0GA", "domain": ".facebook.com"},
        {"name": "fr", "value": "0PVtTk6IrtgEYNedS.AWde18ckjvtnLKPW-HQLQPJl1KDQhAch_gBORo8Wz6XjBeuw1tQ.BoyW2I..AAA.0.0.BoyW3N.AWdVjyBB23L0oqm-kV3681y6n-I", "domain": ".facebook.com"}
    ]
    
    tester = FacebookAPITester(access_token, user_agent, cookies)
    
    print("=== ТЕСТУВАННЯ FACEBOOK API МОЖЛИВОСТЕЙ ===\n")
    
    # 1. Перевірка токена
    print("🔍 Перевірка дійсності токена...")
    token_test = tester.test_token_validity()
    print(f"Результат: {json.dumps(token_test, indent=2, ensure_ascii=False)}\n")
    
    # 2. Дозволи токена
    print("🔑 Дозволи токена...")
    permissions = tester.get_token_permissions()
    print(f"Результат: {json.dumps(permissions, indent=2, ensure_ascii=False)}\n")
    
    # 3. Інформація користувача
    print("👤 Інформація користувача...")
    user_info = tester.get_user_info()
    print(f"Результат: {json.dumps(user_info, indent=2, ensure_ascii=False)}\n")
    
    # 4. Сторінки
    print("📄 Керовані сторінки...")
    pages = tester.get_pages()
    print(f"Результат: {json.dumps(pages, indent=2, ensure_ascii=False)}\n")
    
    # 5. Групи
    print("👥 Групи користувача...")
    groups = tester.get_groups()
    print(f"Результат: {json.dumps(groups, indent=2, ensure_ascii=False)}\n")
    
    # 6. Рекламні акаунти
    print("💰 Рекламні акаунти...")
    ad_accounts = tester.get_ad_accounts()
    print(f"Результат: {json.dumps(ad_accounts, indent=2, ensure_ascii=False)}\n")

if __name__ == "__main__":
    main()