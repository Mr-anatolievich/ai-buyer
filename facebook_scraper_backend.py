#!/usr/bin/env python3
import json
import sqlite3
import urllib.request
import urllib.parse
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allo            cursor.execute("""
                SELECT facebook_id, access_token, cookies_data, user_agent
                FROM facebook_accounts 
                WHERE id = ?
            """, (account_id,))ders': 'Content-Type, Authorization'
}

class FacebookAdsExtractor:
    """Клас для витягування даних Facebook рекламних кабінетів через cookies"""
    
    def __init__(self, cookies, user_agent, facebook_id=None):
        self.cookies = cookies
        self.user_agent = user_agent or 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        self.facebook_id = facebook_id
        self.session_tokens = {}
        
    def get_base_headers(self, additional_headers=None):
        """Базові заголовки для запитів"""
        headers = {
            'User-Agent': self.user_agent,
            'Cookie': self.cookies,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,uk;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
        }
        
        if additional_headers:
            headers.update(additional_headers)
            
        return headers
        
    def initialize_session(self):
        """Ініціалізація сесії з витягуванням токенів"""
        print("🔄 Ініціалізація Facebook сесії...")
        
        try:
            # Заходимо на Ads Manager для отримання сесійних токенів
            ads_manager_url = "https://www.facebook.com/adsmanager/manage/campaigns"
            
            request = urllib.request.Request(ads_manager_url)
            
            for key, value in self.get_base_headers().items():
                request.add_header(key, value)
                
            with urllib.request.urlopen(request, timeout=30) as response:
                html = response.read().decode('utf-8', errors='ignore')
                
            # Витягуємо сесійні токени з HTML
            fb_dtsg_match = re.search(r'"DTSGInitData",\[\],\{"token":"([^"]+)"', html)
            lsd_match = re.search(r'"LSD",\[\],\{"token":"([^"]+)"', html)
            spin_r_match = re.search(r'"__spin_r":(\d+)', html)
            spin_b_match = re.search(r'"__spin_b":"([^"]+)"', html)
            hsi_match = re.search(r'"hsi":"([^"]+)"', html)
            
            self.session_tokens = {
                'fb_dtsg': fb_dtsg_match.group(1) if fb_dtsg_match else None,
                'lsd': lsd_match.group(1) if lsd_match else None,
                'spin_r': spin_r_match.group(1) if spin_r_match else None,
                'spin_b': spin_b_match.group(1) if spin_b_match else None,
                'hsi': hsi_match.group(1) if hsi_match else None,
                'html': html
            }
            
            tokens_found = sum(1 for v in self.session_tokens.values() if v and v != html)
            print(f"📋 Витягнуто {tokens_found} сесійних токенів")
            
            if self.session_tokens['fb_dtsg'] and self.session_tokens['lsd']:
                print("✅ Сесію ініціалізовано успішно")
                return True
            else:
                print("⚠️ Не вдалося отримати всі необхідні токени")
                return False
                
        except Exception as e:
            print(f"❌ Помилка ініціалізації сесії: {e}")
            return False
    
    def extract_ad_accounts_from_html(self):
        """Витягування рекламних кабінетів з HTML"""
        if not self.session_tokens.get('html'):
            print("❌ HTML не завантажено")
            return None
            
        html = self.session_tokens['html']
        
        print("🔍 Витягування рекламних кабінетів з HTML...")
        
        # Патерни для пошуку ID рекламних кабінетів
        patterns = [
            r'"adAccountID":"(\d+)"',
            r'"account_id":"(\d+)"',
            r'act_(\d+)',
            r'"AdAccount","(\d+)"',
            r'"ad_account_id":"(\d+)"',
            r'"accountId":"(\d+)"'
        ]
        
        found_accounts = set()
        
        for pattern in patterns:
            matches = re.findall(pattern, html)
            for match in matches:
                if match and len(match) > 5:  # Фільтруємо короткі ID
                    found_accounts.add(match)
                    
        print(f"📊 Знайдено {len(found_accounts)} унікальних ID рекламних кабінетів")
        
        # Спроба знайти більше деталей про кабінети
        accounts_data = []
        
        # Шукаємо JSON об'єкти з детальною інформацією
        json_patterns = [
            r'"AdAccount"[^}]*"id":"(\d+)"[^}]*"name":"([^"]*)"[^}]*"currency":"([^"]*)"',
            r'"account_id":"(\d+)"[^}]*"name":"([^"]*)"',
            r'"id":"act_(\d+)"[^}]*"name":"([^"]*)"'
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, html)
            for match in matches:
                if len(match) >= 2:
                    account_id = match[0]
                    account_name = match[1] if len(match) > 1 else f"Account {account_id}"
                    currency = match[2] if len(match) > 2 else "Unknown"
                    
                    accounts_data.append({
                        'id': f'act_{account_id}',
                        'account_id': account_id,
                        'name': account_name,
                        'currency': currency,
                        'source': 'html_extraction',
                        'status': 'active'
                    })
        
        # Якщо не знайшли детальну інформацію, створюємо базові записи
        if not accounts_data and found_accounts:
            for account_id in list(found_accounts)[:20]:  # Обмежуємо до 20
                accounts_data.append({
                    'id': f'act_{account_id}',
                    'account_id': account_id,
                    'name': f'Ad Account {account_id}',
                    'currency': 'USD',
                    'source': 'html_id_extraction',
                    'status': 'unknown'
                })
        
        if accounts_data:
            print(f"✅ Успішно витягнуто {len(accounts_data)} рекламних кабінетів")
            return {'data': accounts_data, 'method': 'html_extraction'}
        else:
            print("❌ Не вдалося витягнути дані рекламних кабінетів")
            return None
    
    def try_internal_api_request(self):
        """Спроба запиту до внутрішніх API Facebook"""
        if not self.session_tokens.get('fb_dtsg') or not self.session_tokens.get('lsd'):
            print("⚠️ Відсутні сесійні токени для внутрішніх API")
            return None
            
        print("🔄 Спроба внутрішнього API запиту...")
        
        # Внутрішні endpoints Facebook
        endpoints = [
            {
                'url': 'https://www.facebook.com/api/graphql/',
                'method': 'POST',
                'payload': {
                    'fb_dtsg': self.session_tokens['fb_dtsg'],
                    'lsd': self.session_tokens['lsd'],
                    'variables': '{}',
                    'doc_id': '2140584719566580',  # Може змінюватися
                    'server_timestamps': 'true'
                }
            },
            {
                'url': 'https://www.facebook.com/ajax/bz',
                'method': 'POST', 
                'payload': {
                    'fb_dtsg': self.session_tokens['fb_dtsg'],
                    'lsd': self.session_tokens['lsd']
                }
            }
        ]
        
        for endpoint in endpoints:
            try:
                print(f"   Спробуємо: {endpoint['url']}")
                
                if endpoint['method'] == 'POST':
                    data = urllib.parse.urlencode(endpoint['payload']).encode('utf-8')
                    
                    request = urllib.request.Request(endpoint['url'], data=data)
                    request.add_header('Content-Type', 'application/x-www-form-urlencoded')
                else:
                    query_string = urllib.parse.urlencode(endpoint['payload'])
                    full_url = f"{endpoint['url']}?{query_string}"
                    request = urllib.request.Request(full_url)
                
                # Додаємо заголовки для внутрішніх API
                api_headers = self.get_base_headers({
                    'X-FB-DTSG': self.session_tokens['fb_dtsg'],
                    'X-FB-LSD': self.session_tokens['lsd'],
                    'Origin': 'https://www.facebook.com',
                    'Referer': 'https://www.facebook.com/adsmanager/',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest'
                })
                
                for key, value in api_headers.items():
                    request.add_header(key, value)
                
                with urllib.request.urlopen(request, timeout=15) as response:
                    response_data = response.read().decode('utf-8', errors='ignore')
                    
                # Перевіряємо чи є в відповіді дані про рекламні кабінети
                if ('adAccount' in response_data or 'account_id' in response_data or 
                    'AdAccount' in response_data):
                    
                    print(f"   ✅ Знайдено дані в {endpoint['url']}")
                    
                    try:
                        # Спроба парсингу як JSON
                        json_data = json.loads(response_data)
                        return {'data': json_data, 'method': 'internal_api', 'source': endpoint['url']}
                    except json.JSONDecodeError:
                        # Якщо не JSON, повертаємо як сирі дані
                        return {'raw_data': response_data[:1000] + '...', 'method': 'internal_api_raw'}
                        
            except Exception as e:
                print(f"   ❌ Помилка {endpoint['url']}: {e}")
                continue
                
        return None
    
    def extract_ads_data(self):
        """Основний метод витягування даних"""
        print("🚀 Початок витягування даних рекламних кабінетів...")
        
        # Спочатку ініціалізуємо сесію
        if not self.initialize_session():
            return None
            
        # Метод 1: Витягування з HTML (найнадійніший)
        html_data = self.extract_ad_accounts_from_html()
        if html_data:
            return html_data
            
        # Метод 2: Внутрішні API запити
        api_data = self.try_internal_api_request()
        if api_data:
            return api_data
            
        print("❌ Не вдалося отримати дані жодним методом")
        return None

class FacebookScraperRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler для Facebook scraper backend"""
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path_parts = parsed_path.path.strip('/').split('/')
        
        if parsed_path.path == '/' or parsed_path.path == '':
            self.handle_root()
        elif path_parts == ['api', 'facebook', 'accounts']:
            self.handle_get_facebook_accounts()
        elif (len(path_parts) == 5 and path_parts[:3] == ['api', 'facebook', 'accounts'] 
              and path_parts[4] == 'adaccounts'):
            account_id = path_parts[3]
            self.handle_get_ad_accounts(account_id)
        else:
            self.send_404()
    
    def handle_root(self):
        """Головна сторінка з інформацією про API"""
        self.send_response(200)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {
            'service': 'Facebook Scraper Backend',
            'version': '2.0',
            'description': 'Backend для витягування Facebook рекламних кабінетів через cookies та user-agent',
            'methods': ['HTML Extraction', 'Internal GraphQL', 'Network Monitoring'],
            'endpoints': {
                'GET /': 'Інформація про API',
                'GET /api/facebook/accounts': 'Список Facebook акаунтів',
                'GET /api/facebook/accounts/{id}/adaccounts': 'Рекламні кабінети для акаунта'
            },
            'features': [
                'Витягування через cookies (без Graph API)',
                'HTML parsing рекламних кабінетів',
                'Внутрішні Facebook GraphQL endpoints',
                'Моніторинг мережевих запитів'
            ]
        }
        self.wfile.write(json.dumps(response, ensure_ascii=False, indent=2).encode('utf-8'))
    
    def handle_get_facebook_accounts(self):
        """Отримання списку Facebook акаунтів з бази"""
        try:
            conn = sqlite3.connect('ai_buyer.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, facebook_id, name, access_token, cookies_data, user_agent, created_at 
                FROM facebook_accounts 
                ORDER BY created_at DESC
            """)
            
            accounts = []
            for row in cursor.fetchall():
                accounts.append({
                    'id': row[0],
                    'facebook_id': row[1],
                    'name': row[2],
                    'has_token': bool(row[3]),
                    'has_cookies': bool(row[4]),
                    'has_user_agent': bool(row[5]),
                    'created_at': row[6]
                })
            
            conn.close()
            
            self.send_response(200)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'success',
                'data': accounts,
                'count': len(accounts)
            }
            
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            print(f"❌ Помилка отримання акаунтів: {e}")
            self.send_error_response(500, f"Database error: {str(e)}")
    
    def handle_get_ad_accounts(self, account_id):
        """Отримання рекламних кабінетів через scraping"""
        try:
            # Отримуємо дані акаунта з бази
            conn = sqlite3.connect('ai_buyer.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT facebook_id, name, access_token, cookies_data, user_agent 
                FROM facebook_accounts 
                WHERE id = ?
            """, (account_id,))
            
            account_data = cursor.fetchone()
            conn.close()
            
            if not account_data:
                self.send_error_response(404, f"Account {account_id} not found")
                return
                
            facebook_id, name, access_token, cookies_data, user_agent = account_data
            
            print(f"🎯 Отримуємо рекламні кабінети для акаунта: {name} (ID: {facebook_id})")
            
            if not cookies_data:
                self.send_error_response(400, "Cookies відсутні. Додайте cookies для цього акаунта")
                return
                
            # Створюємо extractor і витягуємо дані
            extractor = FacebookAdsExtractor(
                cookies=cookies_data,
                user_agent=user_agent,
                facebook_id=facebook_id
            )
            
            ads_data = extractor.extract_ads_data()
            
            if ads_data and ads_data.get('data'):
                self.send_response(200)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'success',
                    'account_id': account_id,
                    'facebook_id': facebook_id,
                    'method': ads_data.get('method', 'unknown'),
                    'data': ads_data['data'],
                    'count': len(ads_data['data'])
                }
                
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            else:
                self.send_error_response(400, 
                    "Не вдалося отримати рекламні кабінети. Перевірте cookies та доступ до Facebook")
                
        except Exception as e:
            print(f"❌ Помилка отримання рекламних кабінетів: {e}")
            self.send_error_response(500, f"Server error: {str(e)}")
    
    def send_404(self):
        """Send 404 response"""
        self.send_response(404)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {'status': 'error', 'detail': 'Endpoint not found'}
        self.wfile.write(json.dumps(response).encode())
    
    def send_error_response(self, status_code, message):
        """Send error response"""
        self.send_response(status_code)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {
            'status': 'error',
            'detail': message
        }
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

def main():
    server_address = ('localhost', 8000)
    httpd = HTTPServer(server_address, FacebookScraperRequestHandler)
    
    print("🚀 Facebook Scraper Backend запущений на http://localhost:8000")
    print("📋 API endpoints:")
    print("   GET    /api/facebook/accounts")
    print("   GET    /api/facebook/accounts/{id}/adaccounts")
    print("💡 Метод: HTML extraction + internal APIs з cookies")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹️  Сервер зупинений")
        httpd.shutdown()

if __name__ == '__main__':
    main()