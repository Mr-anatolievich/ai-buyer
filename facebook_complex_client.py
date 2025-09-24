#!/usr/bin/env python3
"""
Facebook API Client з комплексним підходом
Використовує user token, user agent, Facebook ID та cookies для доступу до рекламних кабінетів
"""

import urllib.request
import urllib.parse
import json
import re
import time
from typing import Dict, Optional, List, Any

class FacebookAdsAccess:
    """Комплексний клієнт для доступу до Facebook рекламних кабінетів"""
    
    def __init__(self, user_token: str, cookies: str, user_agent: str, facebook_id: str):
        self.user_token = user_token
        self.cookies = cookies
        self.user_agent = user_agent
        self.facebook_id = facebook_id
        self.base_url = 'https://graph.facebook.com/v19.0'
        
        # Витягуємо параметри з cookies
        self.cookie_params = self._extract_from_cookies(cookies)
        
    def _extract_from_cookies(self, cookies: str) -> Dict[str, str]:
        """Витягує важливі параметри з cookies"""
        cookie_obj = {}
        if cookies:
            for cookie in cookies.split(';'):
                if '=' in cookie:
                    key, value = cookie.strip().split('=', 1)
                    cookie_obj[key] = value
        
        return {
            'session_id': cookie_obj.get('xs', cookie_obj.get('c_user', '')),
            'dtsg': cookie_obj.get('fb_dtsg', ''),
            'lsd': cookie_obj.get('lsd', ''),
            'spin': cookie_obj.get('spin', ''),
            'datr': cookie_obj.get('datr', ''),
            'sb': cookie_obj.get('sb', '')
        }
    
    def _get_common_headers(self, referer: str = None) -> Dict[str, str]:
        """Створює загальні заголовки для запитів"""
        headers = {
            'User-Agent': self.user_agent,
            'Cookie': self.cookies,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        if referer:
            headers['Referer'] = referer
            headers['Origin'] = 'https://www.facebook.com'
            
        if self.cookie_params.get('dtsg'):
            headers['X-FB-DTSG'] = self.cookie_params['dtsg']
        if self.cookie_params.get('lsd'):
            headers['X-FB-LSD'] = self.cookie_params['lsd']
            
        return headers
    
    async def get_ad_accounts(self) -> Dict[str, Any]:
        """Отримує рекламні кабінети використовуючи різні методи"""
        
        methods = [
            ('Direct API', self._try_direct_api),
            ('Full Headers API', self._try_with_full_headers),
            ('Me Endpoint', self._try_me_endpoint),
            ('Business Accounts', self._try_business_accounts),
            ('Alternative Endpoint', self._try_alternative_endpoint)
        ]
        
        last_error = None
        
        for method_name, method in methods:
            try:
                print(f"🔄 Спробуємо метод: {method_name}")
                result = await method()
                
                if result and 'data' in result:
                    print(f"✅ Успіх з методом: {method_name}")
                    print(f"📊 Знайдено {len(result['data'])} рекламних кабінетів")
                    return {
                        'status': 'success',
                        'method': method_name,
                        'data': result['data'],
                        'paging': result.get('paging', {})
                    }
                elif result and 'error' not in result:
                    print(f"⚠️ Метод {method_name}: отримано дані без поля 'data'")
                    return {
                        'status': 'success', 
                        'method': method_name,
                        'data': result
                    }
                    
            except Exception as e:
                print(f"❌ Метод {method_name} провалився: {e}")
                last_error = e
                time.sleep(1)  # Пауза між спробами
                
        # Якщо всі методи провалилися
        return {
            'status': 'error',
            'message': f'Усі методи провалилися. Остання помилка: {last_error}',
            'attempted_methods': [name for name, _ in methods]
        }
    
    async def _try_direct_api(self) -> Optional[Dict]:
        """Метод 1: Прямий API запит"""
        url = f"{self.base_url}/me/adaccounts"
        params = {
            'access_token': self.user_token,
            'fields': 'id,name,account_id,currency,account_status,timezone_name,business,spend_cap,daily_spend_limit,amount_spent,balance',
            'limit': '50'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        request.add_header('User-Agent', self.user_agent)
        
        with urllib.request.urlopen(request) as response:
            data = response.read()
            return json.loads(data.decode('utf-8'))
    
    async def _try_with_full_headers(self) -> Optional[Dict]:
        """Метод 2: API запит з повними заголовками"""
        url = f"{self.base_url}/me/adaccounts"
        params = {
            'access_token': self.user_token,
            'fields': 'id,name,account_id,currency,account_status,timezone_name,business',
            'limit': '50'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        headers = self._get_common_headers('https://www.facebook.com/adsmanager/')
        
        request = urllib.request.Request(full_url)
        for key, value in headers.items():
            request.add_header(key, value)
            
        with urllib.request.urlopen(request) as response:
            data = response.read()
            return json.loads(data.decode('utf-8'))
    
    async def _try_me_endpoint(self) -> Optional[Dict]:
        """Метод 3: Запит через /me з підзапитом adaccounts"""
        url = f"{self.base_url}/me"
        params = {
            'access_token': self.user_token,
            'fields': 'id,name,adaccounts{id,name,account_id,currency,account_status,timezone_name,business}',
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        headers = self._get_common_headers()
        
        request = urllib.request.Request(full_url)
        for key, value in headers.items():
            request.add_header(key, value)
            
        with urllib.request.urlopen(request) as response:
            data = response.read()
            result = json.loads(data.decode('utf-8'))
            
            # Переформатуємо результат
            if 'adaccounts' in result and 'data' in result['adaccounts']:
                return result['adaccounts']
            return result
    
    async def _try_business_accounts(self) -> Optional[Dict]:
        """Метод 4: Через бізнес акаунти"""
        # Спершу отримуємо бізнеси
        url = f"{self.base_url}/me/businesses"
        params = {
            'access_token': self.user_token,
            'fields': 'id,name'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        headers = self._get_common_headers()
        request = urllib.request.Request(full_url)
        for key, value in headers.items():
            request.add_header(key, value)
            
        with urllib.request.urlopen(request) as response:
            data = response.read()
            businesses = json.loads(data.decode('utf-8'))
            
        # Якщо є бізнеси, отримуємо їх рекламні кабінети
        all_accounts = []
        for business in businesses.get('data', []):
            try:
                business_url = f"{self.base_url}/{business['id']}/owned_ad_accounts"
                business_params = {
                    'access_token': self.user_token,
                    'fields': 'id,name,account_id,currency,account_status'
                }
                
                business_query = urllib.parse.urlencode(business_params)
                business_full_url = f"{business_url}?{business_query}"
                
                business_request = urllib.request.Request(business_full_url)
                for key, value in headers.items():
                    business_request.add_header(key, value)
                    
                with urllib.request.urlopen(business_request) as business_response:
                    business_data = business_response.read()
                    business_accounts = json.loads(business_data.decode('utf-8'))
                    all_accounts.extend(business_accounts.get('data', []))
                    
            except Exception as e:
                print(f"⚠️ Не вдалося отримати кабінети для бізнесу {business['id']}: {e}")
                
        return {'data': all_accounts} if all_accounts else None
    
    async def _try_alternative_endpoint(self) -> Optional[Dict]:
        """Метод 5: Альтернативний endpoint"""
        url = f"{self.base_url}/{self.facebook_id}/adaccounts"
        params = {
            'access_token': self.user_token,
            'fields': 'id,name,account_id,currency,account_status,timezone_name',
            'limit': '50'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        headers = self._get_common_headers()
        
        request = urllib.request.Request(full_url)
        for key, value in headers.items():
            request.add_header(key, value)
            
        with urllib.request.urlopen(request) as response:
            data = response.read()
            return json.loads(data.decode('utf-8'))


def test_facebook_access():
    """Тестова функція для перевірки доступу"""
    
    # Тестові дані (замініть на реальні)
    test_data = {
        'user_token': 'EAABs...ваш_токен',
        'cookies': 'datr=...; sb=...; c_user=...; xs=...',
        'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'facebook_id': '100009868933766'
    }
    
    print("🧪 Тестування Facebook доступу...")
    
    client = FacebookAdsAccess(
        test_data['user_token'],
        test_data['cookies'], 
        test_data['user_agent'],
        test_data['facebook_id']
    )
    
    print("🔍 Витягнуті параметри з cookies:")
    for key, value in client.cookie_params.items():
        if value:
            print(f"   {key}: {value[:20]}..." if len(value) > 20 else f"   {key}: {value}")
    
    # В реальному застосунку тут буде await client.get_ad_accounts()
    print("✅ Клієнт ініціалізовано успішно!")
    
    return client

    def _sync_request(self, url: str, params: Dict[str, str], use_full_headers: bool = False, extract_adaccounts: bool = False) -> Optional[Dict]:
        """Синхронна версія запиту"""
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        
        if use_full_headers:
            headers = self._get_common_headers('https://www.facebook.com/adsmanager/')
            for key, value in headers.items():
                request.add_header(key, value)
        else:
            request.add_header('User-Agent', self.user_agent)
            if self.cookies:
                request.add_header('Cookie', self.cookies)
        
        with urllib.request.urlopen(request) as response:
            data = response.read()
            result = json.loads(data.decode('utf-8'))
            
            if extract_adaccounts and 'adaccounts' in result:
                return result['adaccounts']
            return result
    
    def _sync_business_request(self) -> Optional[Dict]:
        """Синхронна версія запиту через бізнес акаунти"""
        try:
            # Отримуємо бізнеси
            businesses_result = self._sync_request(f"{self.base_url}/me/businesses", {
                'access_token': self.user_token,
                'fields': 'id,name'
            })
            
            all_accounts = []
            for business in businesses_result.get('data', []):
                try:
                    business_accounts = self._sync_request(
                        f"{self.base_url}/{business['id']}/owned_ad_accounts", 
                        {
                            'access_token': self.user_token,
                            'fields': 'id,name,account_id,currency,account_status'
                        }
                    )
                    all_accounts.extend(business_accounts.get('data', []))
                except Exception as e:
                    print(f"⚠️ Не вдалося отримати кабінети для бізнесу {business['id']}: {e}")
                    
            return {'data': all_accounts} if all_accounts else None
            
        except Exception as e:
            print(f"❌ Помилка запиту бізнес акаунтів: {e}")
            return None

if __name__ == "__main__":
    test_facebook_access()