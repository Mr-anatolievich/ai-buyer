#!/usr/bin/env python3
"""
Facebook XHR Network Requests Monitor
Симулює запити, які робить браузер при завантаженні Ads Manager
"""

import json
import sqlite3
import time
import urllib.request
import urllib.parse
import gzip
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

class FacebookXHRExtractor:
    """Клас для моніторингу XHR запитів до Facebook"""
    
    def __init__(self, cookies_data, user_agent, facebook_id):
        self.cookies_data = cookies_data
        self.user_agent = user_agent
        self.facebook_id = facebook_id
        
    def get_base_headers(self, additional_headers=None):
        """Базові заголовки для всіх запитів"""
        headers = {
            'User-Agent': self.user_agent,
            'Cookie': self.cookies_data,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,uk;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.facebook.com/adsmanager/',
            'Origin': 'https://www.facebook.com'
        }
        
        if additional_headers:
            headers.update(additional_headers)
            
        return headers
    
    def make_request(self, url, headers=None, method='GET', data=None, timeout=15):
        """Універсальний метод для HTTP запитів"""
        try:
            print(f"📡 Запит до: {url[:80]}...")
            
            if headers is None:
                headers = self.get_base_headers()
            
            request = urllib.request.Request(url, headers=headers, method=method)
            
            if data and method == 'POST':
                if isinstance(data, dict):
                    data = urllib.parse.urlencode(data).encode()
                request.data = data
            
            with urllib.request.urlopen(request, timeout=timeout) as response:
                content = response.read()
                
                # Розпаковуємо gzip якщо потрібно
                if response.headers.get('Content-Encoding') == 'gzip':
                    content = gzip.decompress(content)
                
                # Декодуємо з різними кодуваннями
                try:
                    text = content.decode('utf-8')
                except UnicodeDecodeError:
                    try:
                        text = content.decode('latin-1')
                    except UnicodeDecodeError:
                        text = content.decode('utf-8', errors='ignore')
                
                return {
                    'status': response.status,
                    'headers': dict(response.headers),
                    'content': text,
                    'length': len(text)
                }
                
        except Exception as e:
            print(f"❌ Помилка запиту до {url}: {e}")
            return None
    
    def monitor_network_requests(self):
        """Моніторинг мережевих запитів як в браузері"""
        print("🔍 Моніторимо мережеві запити...")
        
        # Список URL які браузер зазвичай завантажує
        network_requests = [
            # GraphQL API endpoints
            'https://www.facebook.com/api/graphql/',
            
            # AJAX endpoints  
            'https://www.facebook.com/ajax/bulk',
            'https://www.facebook.com/ajax/pagelet/generic.php/PageletAdsManagerRoot',
            
            # Ads Manager specific
            'https://www.facebook.com/adsmanager/manage/campaigns',
            'https://www.facebook.com/adsmanager/manage/campaigns/insights',
            'https://www.facebook.com/adsmanager/manage/adaccounts',
            
            # Business Manager
            'https://business.facebook.com/adsmanager/',
            'https://business.facebook.com/ajax/adsmanager/ad_accounts',
            
            # Tracking and events
            'https://www.facebook.com/tr/events/',
            'https://www.facebook.com/ajax/navigation/',
            
            # Internal APIs
            'https://www.facebook.com/adspayments/account_settings',
            'https://graph.facebook.com/me/adaccounts'
        ]
        
        results = []
        ad_account_data = []
        
        for url in network_requests:
            print(f"\n🎯 Тестуємо: {url}")
            
            # Спочатку GET запит
            response = self.make_request(url)
            
            if response:
                data = response['content']
                status = response['status']
                
                print(f"   Status: {status}, Length: {response['length']}")
                
                # Шукаємо дані про рекламні кабінети
                ad_account_patterns = [
                    'adAccount',
                    'account_id', 
                    'act_',
                    'campaign',
                    'impressions',
                    'spend',
                    'adset',
                    'creative'
                ]
                
                found_patterns = []
                for pattern in ad_account_patterns:
                    if pattern in data:
                        found_patterns.append(pattern)
                
                if found_patterns:
                    print(f"   ✅ Знайдено патерни: {', '.join(found_patterns)}")
                    
                    # Спробуємо витягнути JSON дані
                    extracted_data = self.extract_ad_data_from_response(data, url)
                    if extracted_data:
                        ad_account_data.extend(extracted_data)
                    
                    results.append({
                        'url': url,
                        'status': status,
                        'patterns_found': found_patterns,
                        'data_preview': data[:500] + '...' if len(data) > 500 else data,
                        'extracted_accounts': len(extracted_data) if extracted_data else 0
                    })
                else:
                    print(f"   ❌ Релевантні дані не знайдено")
            
            # Невелика затримка між запитами
            time.sleep(1)
        
        return {
            'requests_results': results,
            'ad_accounts': ad_account_data,
            'total_accounts_found': len(ad_account_data)
        }
    
    def extract_ad_data_from_response(self, data, url):
        """Витягування даних про рекламні кабінети з відповіді"""
        import re
        
        accounts = []
        
        try:
            # Спробуємо парсинг як JSON
            if data.strip().startswith('{') or data.strip().startswith('['):
                try:
                    json_data = json.loads(data)
                    accounts.extend(self.parse_json_for_accounts(json_data, url))
                except json.JSONDecodeError:
                    pass
            
            # Regex патерни для пошуку ID рекламних кабінетів
            patterns = [
                r'"adAccountID":"(\d+)"',
                r'"account_id":"(\d+)"',
                r'act_(\d+)',
                r'"id":"act_(\d+)"',
                r'"ad_account_id":"(\d+)"',
                r'account_id=(\d+)',
                r'adaccount_id=(\d+)'
            ]
            
            account_ids = set()
            
            for pattern in patterns:
                matches = re.findall(pattern, data)
                for match in matches:
                    if isinstance(match, tuple):
                        account_id = match[0] if match[0] else match[1]
                    else:
                        account_id = match
                    
                    if account_id and account_id.isdigit():
                        account_ids.add(account_id)
            
            # Створюємо об'єкти акаунтів
            for account_id in account_ids:
                accounts.append({
                    'id': f'act_{account_id}',
                    'account_id': account_id,
                    'name': f'Account {account_id}',
                    'source': f'xhr_monitoring_{url.split("/")[-1]}',
                    'extracted_from': url
                })
            
            if accounts:
                print(f"   📊 Витягнуто {len(accounts)} кабінетів з {url}")
            
        except Exception as e:
            print(f"   ⚠️ Помилка витягування з {url}: {e}")
        
        return accounts
    
    def parse_json_for_accounts(self, json_data, url):
        """Парсинг JSON даних для пошуку рекламних кабінетів"""
        accounts = []
        
        def recursive_search(obj, path=""):
            if isinstance(obj, dict):
                # Шукаємо ключі що вказують на рекламні кабінети
                if 'adaccounts' in obj or 'ad_accounts' in obj:
                    account_list = obj.get('adaccounts') or obj.get('ad_accounts')
                    if isinstance(account_list, list):
                        for acc in account_list:
                            if isinstance(acc, dict) and 'id' in acc:
                                accounts.append({
                                    'id': acc['id'],
                                    'account_id': acc['id'].replace('act_', ''),
                                    'name': acc.get('name', f'Account {acc["id"]}'),
                                    'status': acc.get('account_status'),
                                    'currency': acc.get('currency'),
                                    'source': f'json_parsing_{url.split("/")[-1]}',
                                    'extracted_from': url
                                })
                
                # Рекурсивний пошук в усіх полях
                for key, value in obj.items():
                    if isinstance(value, (dict, list)):
                        recursive_search(value, f"{path}.{key}")
                        
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    if isinstance(item, (dict, list)):
                        recursive_search(item, f"{path}[{i}]")
        
        try:
            recursive_search(json_data)
        except Exception as e:
            print(f"   ⚠️ Помилка JSON парсингу: {e}")
        
        return accounts
    
    def try_post_requests(self):
        """Спробуємо POST запити з додатковими параметрами"""
        print("\n🔄 Тестуємо POST запити...")
        
        post_endpoints = [
            {
                'url': 'https://www.facebook.com/api/graphql/',
                'data': {
                    'fb_dtsg': 'placeholder',  # Буде оновлено
                    'variables': '{}',
                    'doc_id': '2140584719566580'  # ID для ad accounts запиту
                }
            },
            {
                'url': 'https://www.facebook.com/ajax/bulk',
                'data': {
                    'fb_dtsg': 'placeholder',
                    '__a': '1',
                    '__req': '1',
                    '__be': '1',
                    '__pc': 'PHASED:DEFAULT'
                }
            }
        ]
        
        results = []
        
        for endpoint in post_endpoints:
            print(f"📡 POST до: {endpoint['url']}")
            
            headers = self.get_base_headers({
                'Content-Type': 'application/x-www-form-urlencoded'
            })
            
            response = self.make_request(
                endpoint['url'], 
                headers=headers, 
                method='POST', 
                data=endpoint['data']
            )
            
            if response:
                print(f"   Status: {response['status']}, Length: {response['length']}")
                
                if response['content'] and ('adAccount' in response['content'] or 'act_' in response['content']):
                    print("   ✅ Знайдено релевантні дані в POST відповіді")
                    results.append({
                        'url': endpoint['url'],
                        'method': 'POST',
                        'status': response['status'],
                        'has_ad_data': True,
                        'preview': response['content'][:300]
                    })
            
            time.sleep(1)
        
        return results


class XHRMonitoringHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler для XHR Monitoring backend"""
    
    def do_OPTIONS(self):
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
            self.handle_xhr_monitoring(account_id)
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
            'service': 'Facebook XHR Network Monitoring Backend',
            'version': '1.0',
            'description': 'Моніторинг XHR запитів для витягування Facebook рекламних кабінетів',
            'methods': ['GET Requests Simulation', 'POST Requests Simulation', 'JSON Data Extraction'],
            'endpoints': {
                'GET /': 'Інформація про API',
                'GET /api/facebook/accounts': 'Список Facebook акаунтів',
                'GET /api/facebook/accounts/{id}/adaccounts': 'XHR моніторинг рекламних кабінетів'
            },
            'status': 'active'
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
                    'access_token': row[3][:20] + '...' if row[3] else None,
                    'has_cookies': bool(row[4]),
                    'has_user_agent': bool(row[5]),
                    'cookies_length': len(row[4]) if row[4] else 0,
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
    
    def handle_xhr_monitoring(self, account_id):
        """XHR моніторинг для отримання рекламних кабінетів"""
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
                self.send_error_response(404, 'Facebook акаунт не знайдений')
                return
            
            facebook_id, name, access_token, cookies_data, user_agent = account_data
            
            print(f"🔍 XHR моніторинг для акаунта {account_id}")
            print(f"   FB ID: {facebook_id}")
            print(f"   Name: {name}")
            print(f"   Cookies: {'Є' if cookies_data else 'Відсутні'} ({len(cookies_data) if cookies_data else 0} символів)")
            print(f"   User Agent: {'Є' if user_agent else 'Відсутній'}")
            
            if not cookies_data:
                self.send_error_response(400, 'Cookies обов\'язкові для XHR моніторингу')
                return
            
            # Створюємо екстрактор і проводимо моніторинг
            extractor = FacebookXHRExtractor(
                cookies_data=cookies_data,
                user_agent=user_agent,
                facebook_id=facebook_id
            )
            
            # Моніторимо мережеві запити
            monitoring_results = extractor.monitor_network_requests()
            
            # Пробуємо POST запити
            post_results = extractor.try_post_requests()
            
            total_accounts = monitoring_results.get('total_accounts_found', 0)
            requests_tested = len(monitoring_results.get('requests_results', []))
            
            print(f"✅ XHR моніторинг завершено:")
            print(f"   Тестовано запитів: {requests_tested}")
            print(f"   Знайдено кабінетів: {total_accounts}")
            
            self.send_response(200)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'success',
                'account_id': account_id,
                'facebook_id': facebook_id,
                'method': 'xhr_monitoring',
                'requests_tested': requests_tested,
                'total_accounts_found': total_accounts,
                'monitoring_results': monitoring_results,
                'post_results': post_results
            }
            
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                
        except Exception as e:
            print(f"🚫 Помилка XHR моніторингу: {e}")
            self.send_error_response(500, f'XHR monitoring error: {str(e)}')
    
    def send_404(self):
        """Відправка 404 помилки"""
        self.send_response(404)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {'status': 'error', 'detail': 'Endpoint not found'}
        self.wfile.write(json.dumps(response).encode())
    
    def send_error_response(self, status_code, message):
        """Відправка помилки"""
        self.send_response(status_code)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {'status': 'error', 'detail': message}
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))


def main():
    server_address = ('localhost', 8002)  # Новий порт для XHR моніторингу
    httpd = HTTPServer(server_address, XHRMonitoringHandler)
    
    print("🔍 Facebook XHR Network Monitoring Backend запущений на http://localhost:8002")
    print("📡 Методи моніторингу:")
    print("   🎯 GET Requests - симуляція браузерних GET запитів")
    print("   📤 POST Requests - симуляція AJAX/GraphQL запитів")
    print("   🔍 JSON Extraction - витягування даних з JSON відповідей")
    print("   📊 Pattern Matching - пошук по regex патернах")
    print("📋 API endpoints:")
    print("   GET /                                      - Інформація про API")
    print("   GET /api/facebook/accounts                 - Список акаунтів")
    print("   GET /api/facebook/accounts/{id}/adaccounts - XHR моніторинг кабінетів")
    print("✅ Готовий до роботи!")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹️  Сервер зупинений")
        httpd.shutdown()


if __name__ == '__main__':
    main()