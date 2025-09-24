#!/usr/bin/env python3
"""
Простий Facebook API backend з покращеними заголовками
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import sqlite3
import urllib.request
import urllib.parse
from urllib.parse import urlparse, parse_qs

CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:8081',  # Оновлений порт frontend
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
}

class SimpleRequestHandler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        self.send_response(200)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.end_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/facebook/accounts':
            self.handle_get_accounts()
        elif parsed_path.path.startswith('/api/facebook/accounts/') and parsed_path.path.endswith('/adaccounts'):
            account_id = parsed_path.path.split('/')[-2]
            self.handle_get_ad_accounts(account_id)
        else:
            self.send_error(404)
            
    def handle_get_accounts(self):
        """Отримання списку Facebook акаунтів"""
        try:
            conn = sqlite3.connect('ai_buyer.db')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM facebook_accounts WHERE status = "active"')
            accounts = cursor.fetchall()
            
            accounts_list = []
            for account in accounts:
                accounts_list.append({
                    'id': str(account['id']),
                    'name': account['name'],
                    'facebook_id': account['facebook_id'],
                    'group_name': account['group_name'],
                    'status': account['status'],
                    'token_status': account['token_status'],
                    'access_token': account['access_token'],  # Тимчасово для дебагу
                    'user_agent': account['user_agent'],
                    'cookies_data': account['cookies_data'],
                    'proxy_id': account['proxy_id'],
                    'balance': account['balance'],
                    'daily_limit': account['daily_limit'],
                    'cookies_loaded': bool(account['cookies_loaded']),
                    'primary_cabinet': account['primary_cabinet'],
                    'primary_cabinet_id': account['primary_cabinet_id'],
                    'total_cabinets': account['total_cabinets'],
                    'created_at': account['created_at'],
                    'updated_at': account['updated_at']
                })
            
            conn.close()
            
            self.send_response(200)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'success',
                'data': accounts_list
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_error(500, str(e))
            
    def handle_get_ad_accounts(self, account_id):
        """Отримання рекламних кабінетів Facebook акаунта"""
        try:
            # Отримуємо дані акаунта з бази
            conn = sqlite3.connect('ai_buyer.db')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM facebook_accounts WHERE id = ?', (account_id,))
            account = cursor.fetchone()
            
            if not account:
                conn.close()
                self.send_error(404, "Account not found")
                return
                
            access_token = account['access_token']
            facebook_id = account['facebook_id']
            cookies_data = account['cookies_data']
            user_agent = account['user_agent']
            
            conn.close()
            
            if not access_token:
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'error',
                    'detail': 'No access token available for this account'
                }
                self.wfile.write(json.dumps(response).encode())
                return
            
            print(f"🔍 Отримуємо рекламні кабінети для акаунта {facebook_id}")
            print(f"📋 Token: {access_token[:20] if access_token else 'Відсутній'}...")
            print(f"📋 Cookies: {'Є' if cookies_data else 'Відсутні'}")
            print(f"📋 User Agent: {user_agent[:50] if user_agent else 'За замовчуванням'}...")
            
            # Спробуємо різні методи
            success = False
            api_result = None
            
            methods = [
                ('Simple /me/adaccounts', self.try_simple_me_adaccounts),
                ('Full headers /me/adaccounts', self.try_full_headers_me_adaccounts), 
                ('Alternative /{id}/adaccounts', self.try_alternative_id_adaccounts),
                ('Me with subfields', self.try_me_with_subfields),
                ('Check token app info', self.try_check_token_app),
                ('Business accounts access', self.try_business_accounts_extended),
                ('Internal GraphQL approach', self.try_internal_graphql_approach)
            ]
            
            for method_name, method_func in methods:
                try:
                    print(f"🔄 Спробуємо: {method_name}")
                    result = method_func(access_token, facebook_id, cookies_data, user_agent)
                    
                    if result and 'error' not in result:
                        print(f"✅ Успіх з методом: {method_name}")
                        
                        # Нормалізуємо результат
                        if 'data' in result:
                            accounts_count = len(result['data'])
                        elif 'adaccounts' in result and 'data' in result['adaccounts']:
                            result = result['adaccounts']
                            accounts_count = len(result['data'])
                        else:
                            accounts_count = 0
                            
                        print(f"📊 Знайдено {accounts_count} рекламних кабінетів")
                        api_result = result
                        success = True
                        break
                    else:
                        error_msg = result.get('error', {}).get('message', 'Unknown error') if result else 'No result'
                        print(f"❌ {method_name} провалився: {error_msg}")
                        
                except Exception as e:
                    print(f"❌ Помилка в {method_name}: {e}")
                    continue
            
            if success and api_result:
                self.send_response(200)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'success',
                    'account_id': account_id,
                    'facebook_id': facebook_id,
                    'data': api_result
                }
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            else:
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'error',
                    'detail': 'Не вдалося отримати рекламні кабінети жодним методом',
                    'suggestion': 'Перевірте токен доступу та його дозволи (ads_read)'
                }
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                
        except Exception as e:
            print(f"🚫 Загальна помилка: {e}")
            self.send_response(500)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'error',
                'detail': f'Server error: {str(e)}'
            }
            self.wfile.write(json.dumps(response).encode())
    
    def try_simple_me_adaccounts(self, access_token, facebook_id, cookies_data, user_agent):
        """Простий запит до /me/adaccounts"""
        url = "https://graph.facebook.com/v19.0/me/adaccounts"
        params = {
            'access_token': access_token,
            'fields': 'id,name,account_id,currency,account_status,timezone_name',
            'limit': '50'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (compatible; FacebookAPI/1.0)')
        
        with urllib.request.urlopen(request) as response:
            data = response.read()
            return json.loads(data.decode('utf-8'))
    
    def try_full_headers_me_adaccounts(self, access_token, facebook_id, cookies_data, user_agent):
        """Запит з повними заголовками до /me/adaccounts"""
        url = "https://graph.facebook.com/v19.0/me/adaccounts"
        params = {
            'access_token': access_token,
            'fields': 'id,name,account_id,currency,account_status,timezone_name,business',
            'limit': '50'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        
        # Повні заголовки
        request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36')
        request.add_header('Accept', 'application/json, text/plain, */*')
        request.add_header('Accept-Language', 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7')
        request.add_header('Accept-Encoding', 'gzip, deflate, br')
        request.add_header('Connection', 'keep-alive')
        request.add_header('Sec-Fetch-Dest', 'empty')
        request.add_header('Sec-Fetch-Mode', 'cors') 
        request.add_header('Sec-Fetch-Site', 'cross-site')
        request.add_header('Cache-Control', 'no-cache')
        request.add_header('Pragma', 'no-cache')
        
        if cookies_data:
            request.add_header('Cookie', cookies_data)
            request.add_header('Referer', 'https://www.facebook.com/adsmanager/')
            request.add_header('Origin', 'https://www.facebook.com')
        
        with urllib.request.urlopen(request) as response:
            data = response.read()
            return json.loads(data.decode('utf-8'))
    
    def try_alternative_id_adaccounts(self, access_token, facebook_id, cookies_data, user_agent):
        """Запит до /{facebook_id}/adaccounts"""
        url = f"https://graph.facebook.com/v19.0/{facebook_id}/adaccounts"
        params = {
            'access_token': access_token,
            'fields': 'id,name,account_id,currency,account_status,timezone_name',
            'limit': '50'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (compatible; FacebookAPI/1.0)')
        
        if cookies_data:
            request.add_header('Cookie', cookies_data)
        
        with urllib.request.urlopen(request) as response:
            data = response.read()
            return json.loads(data.decode('utf-8'))
    
    def try_me_with_subfields(self, access_token, facebook_id, cookies_data, user_agent):
        """Запит до /me з підзапитом adaccounts"""
        url = "https://graph.facebook.com/v19.0/me"
        params = {
            'access_token': access_token,
            'fields': 'id,name,adaccounts{id,name,account_id,currency,account_status,timezone_name}'
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (compatible; FacebookAPI/1.0)')
        
        if cookies_data:
            request.add_header('Cookie', cookies_data)
        
        with urllib.request.urlopen(request) as response:
            data = response.read()
            result = json.loads(data.decode('utf-8'))
            
            # Повертаємо тільки adaccounts частину
            if 'adaccounts' in result:
                return result['adaccounts']
            return result

    def try_check_token_app(self, access_token, facebook_id, cookies_data, user_agent):
        """Перевірка інформації про додаток токена"""
        url = "https://graph.facebook.com/v19.0/app"
        params = {'access_token': access_token}
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        
        request = urllib.request.Request(full_url)
        request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (compatible; FacebookAPI/1.0)')
        
        if cookies_data:
            request.add_header('Cookie', cookies_data)
            
        with urllib.request.urlopen(request) as response:
            data = response.read()
            app_info = json.loads(data.decode('utf-8'))
            
        print(f"📱 App Info: {app_info.get('name', 'Unknown')} (ID: {app_info.get('id', 'Unknown')})")
        
        # Після перевірки app, спробуємо через цей же додаток отримати adaccounts
        ads_url = "https://graph.facebook.com/v19.0/me/adaccounts"
        ads_params = {
            'access_token': access_token,
            'fields': 'id,name,account_id,currency,account_status'
        }
        
        ads_query_string = urllib.parse.urlencode(ads_params)
        ads_full_url = f"{ads_url}?{ads_query_string}"
        
        ads_request = urllib.request.Request(ads_full_url)
        ads_request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (compatible; FacebookAPI/1.0)')
        
        if cookies_data:
            ads_request.add_header('Cookie', cookies_data)
            
        with urllib.request.urlopen(ads_request) as ads_response:
            ads_data = ads_response.read()
            return json.loads(ads_data.decode('utf-8'))

    def try_business_accounts_extended(self, access_token, facebook_id, cookies_data, user_agent):
        """Розширений запит через бізнес акаунти з cookies"""
        try:
            # Спочатку отримуємо бізнеси
            businesses_url = "https://graph.facebook.com/v19.0/me/businesses"
            businesses_params = {
                'access_token': access_token,
                'fields': 'name,id,created_time'
            }
            
            query_string = urllib.parse.urlencode(businesses_params)
            full_url = f"{businesses_url}?{query_string}"
            
            request = urllib.request.Request(full_url)
            request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
            request.add_header('Accept', 'application/json, text/plain, */*')
            request.add_header('Accept-Language', 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7')
            request.add_header('Accept-Encoding', 'gzip, deflate, br')
            request.add_header('Connection', 'keep-alive')
            
            if cookies_data:
                request.add_header('Cookie', cookies_data)
                request.add_header('Referer', 'https://www.facebook.com/adsmanager/')
                request.add_header('Origin', 'https://www.facebook.com')
                request.add_header('Sec-Fetch-Dest', 'empty')
                request.add_header('Sec-Fetch-Mode', 'cors')
                request.add_header('Sec-Fetch-Site', 'same-origin')
            
            with urllib.request.urlopen(request) as response:
                business_data = response.read()
                businesses = json.loads(business_data.decode('utf-8'))
                
            print(f"🏢 Знайдено {len(businesses.get('data', []))} бізнес-акаунтів")
            
            all_accounts = []
            for business in businesses.get('data', []):
                try:
                    # Отримуємо ad accounts для кожного бізнесу
                    biz_ads_url = f"https://graph.facebook.com/v19.0/{business['id']}/owned_ad_accounts"
                    biz_params = {
                        'access_token': access_token,
                        'fields': 'id,name,account_id,currency,account_status,business'
                    }
                    
                    biz_query = urllib.parse.urlencode(biz_params)
                    biz_full_url = f"{biz_ads_url}?{biz_query}"
                    
                    biz_request = urllib.request.Request(biz_full_url)
                    biz_request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
                    
                    if cookies_data:
                        biz_request.add_header('Cookie', cookies_data)
                        
                    with urllib.request.urlopen(biz_request) as biz_response:
                        biz_data = biz_response.read()
                        biz_accounts = json.loads(biz_data.decode('utf-8'))
                        
                    for account in biz_accounts.get('data', []):
                        account['business_name'] = business.get('name', 'Unknown')
                        all_accounts.append(account)
                        
                    print(f"   📊 {business.get('name', 'Unknown')}: {len(biz_accounts.get('data', []))} кабінетів")
                    
                except Exception as biz_e:
                    print(f"⚠️ Помилка для бізнесу {business.get('id')}: {biz_e}")
                    
            return {'data': all_accounts} if all_accounts else None
            
        except Exception as e:
            print(f"❌ Помилка бізнес акаунтів: {e}")
            return None

    def try_internal_graphql_approach(self, access_token, facebook_id, cookies_data, user_agent):
        """Підхід через внутрішні Facebook GraphQL endpoints"""
        if not cookies_data:
            print("⚠️ Cookies потрібні для внутрішнього GraphQL підходу")
            return None
            
        try:
            # Спочатку отримуємо Ads Manager сторінку для витягування токенів
            print("🔍 Отримуємо session токени з Ads Manager...")
            
            ads_manager_url = "https://www.facebook.com/adsmanager/manage/campaigns"
            
            request = urllib.request.Request(ads_manager_url)
            request.add_header('User-Agent', user_agent or 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
            request.add_header('Cookie', cookies_data)
            request.add_header('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
            request.add_header('Accept-Language', 'en-US,en;q=0.5')
            request.add_header('Connection', 'keep-alive')
            request.add_header('Upgrade-Insecure-Requests', '1')
            
            with urllib.request.urlopen(request) as response:
                html = response.read().decode('utf-8')
                
            # Витягуємо токени з HTML
            import re
            
            fb_dtsg_match = re.search(r'"DTSGInitData",\[\],\{"token":"([^"]+)"', html)
            lsd_match = re.search(r'"LSD",\[\],\{"token":"([^"]+)"', html)
            
            fb_dtsg = fb_dtsg_match.group(1) if fb_dtsg_match else None
            lsd = lsd_match.group(1) if lsd_match else None
            
            print(f"📋 Витягнуті токени: fb_dtsg={'Є' if fb_dtsg else 'Відсутній'}, lsd={'Є' if lsd else 'Відсутній'}")
            
            if not fb_dtsg or not lsd:
                print("❌ Не вдалося витягнути необхідні токени")
                return None
                
            # Витягуємо ad account IDs з HTML
            ad_account_patterns = [
                r'"adAccountID":"(\d+)"',
                r'"account_id":"(\d+)"',
                r'act_(\d+)'
            ]
            
            found_accounts = set()
            for pattern in ad_account_patterns:
                matches = re.findall(pattern, html)
                found_accounts.update(matches)
                
            print(f"📊 Знайдено {len(found_accounts)} ID рекламних кабінетів у HTML")
            
            # Формуємо результат
            accounts_data = []
            for account_id in list(found_accounts)[:10]:  # Обмежуємо до 10 для тесту
                accounts_data.append({
                    'id': f'act_{account_id}',
                    'account_id': account_id,
                    'name': f'Account {account_id}',
                    'source': 'html_extraction',
                    'status': 'unknown'
                })
                
            if accounts_data:
                return {'data': accounts_data}
            else:
                return None
                
        except Exception as e:
            print(f"❌ Помилка internal GraphQL підходу: {e}")
            return None

def main():
    server_address = ('localhost', 8000)
    httpd = HTTPServer(server_address, SimpleRequestHandler)
    
    print("🚀 Простий Facebook API backend запущений на http://localhost:8000")
    print("📋 API endpoints:")
    print("   GET    /api/facebook/accounts")
    print("   GET    /api/facebook/accounts/{id}/adaccounts")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹️  Сервер зупинений")
        httpd.shutdown()

if __name__ == '__main__':
    main()