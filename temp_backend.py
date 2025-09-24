#!/usr/bin/env python3
"""
Тимчасовий простий бекенд для тестування фронтенда
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import sqlite3
import time
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import urllib.request
import urllib.error
import urllib.request
import urllib.error

# Простий CORS заголовок
CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:8080',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
}

# Ініціалізація бази даних
def init_db():
    conn = sqlite3.connect('ai_buyer.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Створюємо таблицю, якщо не існує
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS facebook_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            facebook_id TEXT,
            access_token TEXT,
            user_agent TEXT,
            cookies_data TEXT,
            group_name TEXT,
            proxy_id TEXT,
            status TEXT DEFAULT 'active',
            token_status TEXT DEFAULT 'active',
            balance TEXT DEFAULT 'Недоступно',
            daily_limit TEXT DEFAULT 'Недоступно',
            cookies_loaded INTEGER DEFAULT 0,
            primary_cabinet TEXT DEFAULT 'Основний кабінет',
            primary_cabinet_id TEXT DEFAULT 'main_cabinet_id',
            total_cabinets INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Функція для отримання Facebook ID з токена
def get_facebook_id_from_token(access_token):
    """
    Отримати Facebook ID з токена через Facebook Graph API
    """
    try:
        # Спробуємо різні endpoints
        endpoints = [
            f"https://graph.facebook.com/me?access_token={access_token}&fields=id,name",
            f"https://graph.facebook.com/v18.0/me?access_token={access_token}&fields=id,name",
            f"https://graph.facebook.com/v17.0/me?access_token={access_token}&fields=id,name"
        ]
        
        for i, url in enumerate(endpoints):
            try:
                print(f"🔄 Спроба {i+1}: {url[:80]}...")
                
                # Додаємо User-Agent для імітації браузера
                req = urllib.request.Request(url)
                req.add_header('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')
                
                with urllib.request.urlopen(req, timeout=15) as response:
                    data = json.loads(response.read().decode())
                    
                    print(f"✅ Отримано відповідь: {data}")
                    
                    if 'id' in data:
                        print(f"✅ Facebook ID отримано: {data['id']} для користувача: {data.get('name', 'Unknown')}")
                        return data['id']
                    else:
                        print(f"❌ Facebook ID не знайдено в відповіді: {data}")
                        continue
                        
            except urllib.error.HTTPError as e:
                error_data = e.read().decode()
                print(f"❌ HTTP помилка для endpoint {i+1}: {e.code} - {error_data}")
                continue
            except Exception as e:
                print(f"❌ Помилка для endpoint {i+1}: {e}")
                continue
        
        print("❌ Всі endpoints не спрацювали")
        return None
                
    except Exception as e:
        print(f"❌ Загальна помилка при отриманні Facebook ID: {e}")
        return None

class RequestHandler(BaseHTTPRequestHandler):
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
            # Extract account ID from path like /api/facebook/accounts/{id}/adaccounts
            account_id = parsed_path.path.split('/')[-2]
            self.handle_get_ad_accounts(account_id)
        else:
            self.send_error(404)

    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/facebook/accounts/from-token':
            self.handle_create_account()
        else:
            self.send_error(404)

    def do_PUT(self):
        parsed_path = urlparse(self.path)
        
        # Handle PUT /api/facebook/accounts/{id}
        if parsed_path.path.startswith('/api/facebook/accounts/'):
            account_id = parsed_path.path.split('/')[-1]
            self.handle_update_account(account_id)
        else:
            self.send_error(404)

    def do_DELETE(self):
        parsed_path = urlparse(self.path)
        
        # Handle DELETE /api/facebook/accounts/{id}
        if parsed_path.path.startswith('/api/facebook/accounts/'):
            account_id = parsed_path.path.split('/')[-1]
            self.handle_delete_account(account_id)
        else:
            self.send_error(404)

    def handle_get_accounts(self):
        try:
            conn = sqlite3.connect('ai_buyer.db')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM facebook_accounts ORDER BY created_at DESC')
            accounts = cursor.fetchall()
            
            result = []
            for account in accounts:
                result.append({
                    'id': str(account['id']),
                    'name': account['name'],
                    'facebook_id': account['facebook_id'] or 'N/A',
                    'group_name': account['group_name'],
                    'status': account['status'],
                    'token_status': account['token_status'],
                    'access_token': account['access_token'],
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
            
            self.send_response(200)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'success',
                'data': result
            }
            self.wfile.write(json.dumps(response).encode())
            
            conn.close()
            
        except Exception as e:
            self.send_error(500, f"Database error: {str(e)}")

    def handle_get_ad_accounts(self, account_id):
        try:
            # Валідуємо що account_id це число
            try:
                account_id = int(account_id)
            except ValueError:
                self.send_error(400, "Invalid account ID")
                return
            
            # Отримуємо інформацію про аккаунт з бази даних
            conn = sqlite3.connect('ai_buyer.db')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM facebook_accounts WHERE id = ?', (account_id,))
            account = cursor.fetchone()
            
            if not account:
                self.send_error(404, "Account not found")
                conn.close()
                return
            
            access_token = account['access_token']
            facebook_id = account['facebook_id']
            cookies_data = account['cookies_data']
            user_agent = account['user_agent']
            
            if not access_token:
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': 'No access token available for this account'
                }
                self.wfile.write(json.dumps(error_response).encode())
                conn.close()
                return
            
            # Спочатку перевіримо токен
            try:
                print(f"🔍 Перевіряємо токен для користувача {facebook_id}")
                token_check_url = f"https://graph.facebook.com/v19.0/me?access_token={access_token}&fields=id,name"
                token_request = urllib.request.Request(token_check_url)
                
                with urllib.request.urlopen(token_request) as token_response:
                    token_data = token_response.read()
                    token_result = json.loads(token_data.decode('utf-8'))
                    print(f"✅ Токен дійсний для користувача: {token_result.get('name', 'Unknown')} (ID: {token_result.get('id', 'Unknown')})")
                    
            except urllib.error.HTTPError as token_error:
                token_error_data = token_error.read().decode('utf-8')
                print(f"🚫 Токен недійсний: {token_error_data}")
                
                try:
                    token_error_json = json.loads(token_error_data)
                    token_error_msg = token_error_json.get('error', {}).get('message', 'Unknown token error')
                except:
                    token_error_msg = 'Failed to parse token error'
                
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': f'Токен доступу недійсний: {token_error_msg}',
                    'suggestion': 'Будь ласка, оновіть токен доступу в налаштуваннях аккаунта'
                }
                self.wfile.write(json.dumps(error_response).encode())
                conn.close()
                return
            
            # Використовуємо комплексний підхід для отримання рекламних кабінетів
            try:
                print(f"🔍 Використовуємо комплексний Facebook клієнт для користувача {facebook_id}")
                
                # Імпортуємо наш комплексний клієнт
                import sys
                import os
                sys.path.append(os.path.dirname(os.path.abspath(__file__)))
                
                from facebook_complex_client import FacebookAdsAccess
                
                # Створюємо клієнт з усіма даними
                fb_client = FacebookAdsAccess(
                    user_token=access_token,
                    cookies=cookies_data or '',
                    user_agent=user_agent or 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    facebook_id=facebook_id
                )
                
                print(f"📋 Параметри клієнта:")
                print(f"   - Token: {access_token[:20]}...")
                print(f"   - Cookies: {'Є' if cookies_data else 'Відсутні'}")
                print(f"   - User Agent: {user_agent[:50] if user_agent else 'За замовчуванням'}...")
                print(f"   - Facebook ID: {facebook_id}")
                
                # Додаємо синхронний метод до клієнта
                def sync_get_ad_accounts():
                    methods = [
                        ('Direct API', fb_client._try_direct_api_sync),
                        ('Full Headers API', fb_client._try_with_full_headers_sync),
                        ('Me Endpoint', fb_client._try_me_endpoint_sync),
                        ('Business Accounts', fb_client._try_business_accounts_sync),
                        ('Alternative Endpoint', fb_client._try_alternative_endpoint_sync)
                    ]
                    
                    last_error = None
                    
                    for method_name, method in methods:
                        try:
                            print(f"🔄 Спробуємо метод: {method_name}")
                            result = method()
                            
                            if result and ('data' in result or isinstance(result, dict)):
                                print(f"✅ Успіх з методом: {method_name}")
                                if 'data' in result:
                                    print(f"📊 Знайдено {len(result['data'])} рекламних кабінетів")
                                return {
                                    'status': 'success',
                                    'method': method_name,
                                    'data': result.get('data', result),
                                    'paging': result.get('paging', {})
                                }
                                
                        except Exception as e:
                            print(f"❌ Метод {method_name} провалився: {e}")
                            last_error = e
                            time.sleep(0.5)  # Коротка пауза між спробами
                            
                    return {
                        'status': 'error',
                        'message': f'Усі методи провалилися. Остання помилка: {last_error}',
                        'attempted_methods': [name for name, _ in methods]
                    }
                
                # Додаємо синхронні версії методів до клієнта
                fb_client._try_direct_api_sync = lambda: fb_client._sync_request(f"{fb_client.base_url}/me/adaccounts", {
                    'access_token': fb_client.user_token,
                    'fields': 'id,name,account_id,currency,account_status,timezone_name,business,spend_cap,daily_spend_limit,amount_spent,balance',
                    'limit': '50'
                })
                
                fb_client._try_with_full_headers_sync = lambda: fb_client._sync_request(f"{fb_client.base_url}/me/adaccounts", {
                    'access_token': fb_client.user_token,
                    'fields': 'id,name,account_id,currency,account_status,timezone_name,business',
                    'limit': '50'
                }, use_full_headers=True)
                
                fb_client._try_me_endpoint_sync = lambda: fb_client._sync_request(f"{fb_client.base_url}/me", {
                    'access_token': fb_client.user_token,
                    'fields': 'id,name,adaccounts{id,name,account_id,currency,account_status,timezone_name,business}',
                }, extract_adaccounts=True)
                
                fb_client._try_business_accounts_sync = lambda: fb_client._sync_business_request()
                
                fb_client._try_alternative_endpoint_sync = lambda: fb_client._sync_request(f"{fb_client.base_url}/{fb_client.facebook_id}/adaccounts", {
                    'access_token': fb_client.user_token,
                    'fields': 'id,name,account_id,currency,account_status,timezone_name',
                    'limit': '50'
                })
                
                api_result = sync_get_ad_accounts()
                
                if 'data' in api_result:
                    ad_accounts = []
                    for ad_account in api_result['data']:
                        # Конвертуємо дані з Facebook API в наш формат
                        formatted_account = {
                            'id': ad_account.get('id', ''),
                            'name': ad_account.get('name', 'Unknown'),
                            'account_status': ad_account.get('account_status', 'UNKNOWN'),
                            'currency': ad_account.get('currency', 'USD'),
                            'timezone': ad_account.get('timezone_name', 'UTC'),
                            'business': ad_account.get('business', {}).get('name', '') if ad_account.get('business') else '',
                            'spend_cap': ad_account.get('spend_cap', 0),
                            'daily_spend_limit': ad_account.get('daily_spend_limit', 0),
                            'amount_spent': ad_account.get('amount_spent', 0),
                            'balance': ad_account.get('balance', 0)
                        }
                        ad_accounts.append(formatted_account)
                    
                    self.send_response(200)
                    for key, value in CORS_HEADERS.items():
                        self.send_header(key, value)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    
                    response = {
                        'status': 'success',
                        'data': ad_accounts,
                        'account_info': {
                            'id': account['id'],
                            'name': account['name'],
                            'facebook_id': account['facebook_id']
                        }
                    }
                    self.wfile.write(json.dumps(response).encode())
                    
                else:
                    # Помилка API Facebook
                    error_msg = api_result.get('error', {}).get('message', 'Unknown Facebook API error')
                    self.send_response(400)
                    for key, value in CORS_HEADERS.items():
                        self.send_header(key, value)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    
                    error_response = {
                        'status': 'error',
                        'detail': f'Facebook API error: {error_msg}'
                    }
                    self.wfile.write(json.dumps(error_response).encode())
                    
            except urllib.error.HTTPError as e:
                error_response_data = e.read().decode('utf-8')
                print(f"🚫 Facebook API HTTP Error {e.code}: {error_response_data}")
                
                try:
                    error_json = json.loads(error_response_data)
                    error_details = error_json.get('error', {})
                    error_msg = error_details.get('message', 'Unknown error')
                    error_code = error_details.get('code', 'Unknown code')
                    error_subcode = error_details.get('error_subcode', '')
                    
                    detailed_msg = f"Facebook API Error {error_code}"
                    if error_subcode:
                        detailed_msg += f" (subcode: {error_subcode})"
                    detailed_msg += f": {error_msg}"
                    
                    # Додаткові поради для користувача
                    if error_code == 190:  # Invalid access token
                        detailed_msg += ". Токен доступу недійсний або застарілий. Будь ласка, оновіть токен."
                    elif error_code == 200:  # Permissions error
                        detailed_msg += ". Недостатньо дозволів. Перевірте дозволи токена."
                    elif 'ads_read' in str(error_msg).lower():
                        detailed_msg += ". Необхідний дозвіл 'ads_read' для доступу до рекламних кабінетів."
                        
                except:
                    detailed_msg = f'Failed to parse Facebook API error response: {error_response_data[:200]}'
                    
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': detailed_msg,
                    'facebook_error_raw': error_response_data if len(error_response_data) < 500 else error_response_data[:500] + '...'
                }
                self.wfile.write(json.dumps(error_response).encode())
                
            except Exception as api_error:
                self.send_response(500)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': f'API request error: {str(api_error)}'
                }
                self.wfile.write(json.dumps(error_response).encode())
            
            conn.close()
            
        except Exception as e:
            self.send_response(500)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'status': 'error',
                'detail': f'Server error: {str(e)}'
            }
            self.wfile.write(json.dumps(error_response).encode())

    def handle_create_account(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Валідація
            if not data.get('name') or not data.get('access_token'):
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': 'Name and access_token are required'
                }
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            conn = sqlite3.connect('ai_buyer.db')
            cursor = conn.cursor()
            
            # Парсимо cookies якщо вони передані як об'єкт
            cookies_str = None
            facebook_id_from_cookies = None
            
            if 'cookies' in data and data['cookies']:
                if isinstance(data['cookies'], list):
                    cookies_str = json.dumps(data['cookies'])
                    # Шукаємо c_user в cookies
                    for cookie in data['cookies']:
                        if cookie.get('name') == 'c_user':
                            facebook_id_from_cookies = cookie.get('value')
                            print(f"🍪 Знайдено Facebook ID в cookies: {facebook_id_from_cookies}")
                            break
                else:
                    cookies_str = str(data['cookies'])
            
            # Спочатку спробуємо отримати з токена
            facebook_id = get_facebook_id_from_token(data['access_token'])
            
            # Якщо не вдалося з токена, використаємо з cookies
            if not facebook_id and facebook_id_from_cookies:
                facebook_id = facebook_id_from_cookies
                print(f"📝 Використовуємо Facebook ID з cookies: {facebook_id}")
            
            if not facebook_id:
                # Відправляємо помилку з CORS заголовками
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': 'Unable to retrieve Facebook ID from the provided access token or cookies. Please check if the token is valid and has the required permissions.'
                }
                self.wfile.write(json.dumps(error_response).encode())
                conn.close()
                return
            
            # Вставляємо новий аккаунт
            cursor.execute('''
                INSERT INTO facebook_accounts 
                (name, facebook_id, access_token, user_agent, cookies_data, group_name, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['name'],
                facebook_id,
                data['access_token'],
                data.get('user_agent'),
                cookies_str,
                data.get('group_name'),
                datetime.datetime.now().isoformat()
            ))
            
            account_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            self.send_response(201)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'success',
                'data': {
                    'id': account_id,
                    'message': 'Account created successfully'
                }
            }
            self.wfile.write(json.dumps(response).encode())
            
        except json.JSONDecodeError:
            self.send_response(400)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'status': 'error',
                'detail': 'Invalid JSON data'
            }
            self.wfile.write(json.dumps(error_response).encode())
        except Exception as e:
            self.send_response(500)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'status': 'error',
                'detail': f'Server error: {str(e)}'
            }
            self.wfile.write(json.dumps(error_response).encode())

    def handle_delete_account(self, account_id):
        try:
            # Валідуємо що account_id це число
            try:
                account_id = int(account_id)
            except ValueError:
                self.send_error(400, "Invalid account ID")
                return
            
            conn = sqlite3.connect('ai_buyer.db')
            cursor = conn.cursor()
            
            # Перевіряємо чи існує аккаунт
            cursor.execute('SELECT id, name FROM facebook_accounts WHERE id = ?', (account_id,))
            account = cursor.fetchone()
            
            if not account:
                self.send_error(404, "Account not found")
                conn.close()
                return
            
            # Видаляємо аккаунт
            cursor.execute('DELETE FROM facebook_accounts WHERE id = ?', (account_id,))
            conn.commit()
            
            if cursor.rowcount == 0:
                self.send_error(404, "Account not found")
            else:
                self.send_response(200)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'success',
                    'message': f'Account "{account[1]}" deleted successfully'
                }
                self.wfile.write(json.dumps(response).encode())
            
            conn.close()
            
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")

    def handle_update_account(self, account_id):
        try:
            # Валідуємо що account_id це число
            try:
                account_id = int(account_id)
            except ValueError:
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': 'Invalid account ID'
                }
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            # Читаємо дані з запиту
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            conn = sqlite3.connect('ai_buyer.db')
            cursor = conn.cursor()
            
            # Перевіряємо чи існує аккаунт
            cursor.execute('SELECT * FROM facebook_accounts WHERE id = ?', (account_id,))
            account = cursor.fetchone()
            
            if not account:
                self.send_response(404)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': 'Account not found'
                }
                self.wfile.write(json.dumps(error_response).encode())
                conn.close()
                return
            
            # Готуємо дані для оновлення
            update_fields = []
            update_values = []
            
            # Оновлюємо тільки ті поля, що передані в запиті
            if 'name' in data and data['name'].strip():
                update_fields.append('name = ?')
                update_values.append(data['name'].strip())
            
            if 'token' in data and data['token'].strip():
                # Якщо передано новий токен, спробуємо витягнути з нього Facebook ID
                new_facebook_id = get_facebook_id_from_token(data['token'])
                
                update_fields.append('access_token = ?')
                update_values.append(data['token'])
                
                if new_facebook_id:
                    update_fields.append('facebook_id = ?')
                    update_values.append(new_facebook_id)
            
            if 'status' in data:
                update_fields.append('status = ?')
                update_values.append(data['status'])
            
            if 'tokenStatus' in data:
                update_fields.append('token_status = ?')
                update_values.append(data['tokenStatus'])
            
            if 'group' in data:
                update_fields.append('group_name = ?')
                update_values.append(data['group'] if data['group'] else None)
            
            if 'userAgent' in data:
                update_fields.append('user_agent = ?')
                update_values.append(data['userAgent'] if data['userAgent'].strip() else None)
            
            # Якщо нема полів для оновлення
            if not update_fields:
                self.send_response(400)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': 'No fields to update'
                }
                self.wfile.write(json.dumps(error_response).encode())
                conn.close()
                return
            
            # Додаємо updated_at
            update_fields.append('updated_at = ?')
            update_values.append(datetime.now().isoformat())
            
            # Додаємо account_id в кінець для WHERE умови
            update_values.append(account_id)
            
            # Створюємо запит
            sql = f"UPDATE facebook_accounts SET {', '.join(update_fields)} WHERE id = ?"
            
            cursor.execute(sql, update_values)
            conn.commit()
            
            if cursor.rowcount == 0:
                self.send_response(404)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    'status': 'error',
                    'detail': 'Account not found or no changes made'
                }
                self.wfile.write(json.dumps(error_response).encode())
            else:
                self.send_response(200)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'success',
                    'message': 'Account updated successfully'
                }
                self.wfile.write(json.dumps(response).encode())
            
            conn.close()
            
        except json.JSONDecodeError:
            self.send_response(400)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'status': 'error',
                'detail': 'Invalid JSON data'
            }
            self.wfile.write(json.dumps(error_response).encode())
        except Exception as e:
            self.send_response(500)
            for key, value in CORS_HEADERS.items():
                self.send_header(key, value)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'status': 'error',
                'detail': f'Server error: {str(e)}'
            }
            self.wfile.write(json.dumps(error_response).encode())

    def log_message(self, format, *args):
        # Виводимо логи запитів
        print(f"{self.address_string()} - [{self.log_date_time_string()}] {format % args}")

if __name__ == '__main__':
    init_db()
    server = HTTPServer(('localhost', 8000), RequestHandler)
    print("🚀 Тимчасовий бекенд запущений на http://localhost:8000")
    print("📋 API endpoints:")
    print("   GET    /api/facebook/accounts")
    print("   POST   /api/facebook/accounts/from-token")
    print("   DELETE /api/facebook/accounts/{id}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹️  Сервер зупинений")
        server.server_close()