#!/usr/bin/env python3
"""
Facebook Ads Data Extractor з Browser Automation (Selenium)
Цей підхід імітує реального користувача в браузері
"""

import json
import sqlite3
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

class FacebookBrowserExtractor:
    """Клас для витягування Facebook рекламних кабінетів через Selenium"""
    
    def __init__(self, cookies_data, user_agent, facebook_id):
        self.cookies_data = cookies_data
        self.user_agent = user_agent
        self.facebook_id = facebook_id
        self.driver = None
        
    def setup_browser(self):
        """Налаштування Chrome браузера з cookies"""
        print("🔧 Налаштовуємо браузер...")
        
        chrome_options = Options()
        chrome_options.add_argument(f"--user-agent={self.user_agent}")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Для production можна додати headless режим
        # chrome_options.add_argument("--headless")
        
        try:
            # Використовуємо webdriver-manager для автоматичного завантаження ChromeDriver
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            
            print("✅ Браузер запущений")
            return True
        except Exception as e:
            print(f"❌ Помилка запуску браузера: {e}")
            return False
    
    def load_cookies(self):
        """Завантаження cookies в браузер"""
        print("🍪 Завантажуємо cookies...")
        
        try:
            # Спочатку йдемо на Facebook
            self.driver.get("https://www.facebook.com/")
            time.sleep(2)
            
            # Парсимо cookies з строки
            cookies_list = []
            if self.cookies_data:
                for cookie_pair in self.cookies_data.split(';'):
                    cookie_pair = cookie_pair.strip()
                    if '=' in cookie_pair:
                        name, value = cookie_pair.split('=', 1)
                        cookies_list.append({
                            'name': name.strip(),
                            'value': value.strip(),
                            'domain': '.facebook.com',
                            'path': '/'
                        })
            
            # Додаємо cookies в браузер
            for cookie in cookies_list:
                try:
                    self.driver.add_cookie(cookie)
                except Exception as e:
                    print(f"⚠️ Не вдалося додати cookie {cookie['name']}: {e}")
            
            print(f"✅ Завантажено {len(cookies_list)} cookies")
            
            # Перезавантажуємо сторінку з cookies
            self.driver.refresh()
            time.sleep(3)
            
            return True
            
        except Exception as e:
            print(f"❌ Помилка завантаження cookies: {e}")
            return False
    
    def check_login_status(self):
        """Перевірка чи увійшли в акаунт"""
        print("🔍 Перевіряємо статус авторизації...")
        
        try:
            # Шукаємо елементи, які вказують на авторизацію
            login_indicators = [
                '[data-testid="blue_bar_profile_link"]',  # Profile link
                '[role="navigation"]',  # Navigation bar
                '[data-testid="left_nav_menu_list"]'  # Left navigation menu
            ]
            
            for selector in login_indicators:
                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if element:
                        print("✅ Користувач авторизований")
                        return True
                except NoSuchElementException:
                    continue
            
            # Перевіряємо чи є форма входу
            login_form = self.driver.find_elements(By.CSS_SELECTOR, '[data-testid="royal_login_form"]')
            if login_form:
                print("❌ Потрібна авторизація - показується форма входу")
                return False
            
            print("❓ Статус авторизації невизначений")
            return False
            
        except Exception as e:
            print(f"❌ Помилка перевірки авторизації: {e}")
            return False
    
    def navigate_to_ads_manager(self):
        """Навігація до Ads Manager"""
        print("🎯 Переходимо в Ads Manager...")
        
        try:
            # Спробуємо різні способи дістатись Ads Manager
            ads_manager_urls = [
                "https://www.facebook.com/adsmanager/",
                "https://www.facebook.com/adsmanager/manage/campaigns",
                "https://business.facebook.com/adsmanager/"
            ]
            
            for url in ads_manager_urls:
                print(f"🔗 Пробуємо URL: {url}")
                self.driver.get(url)
                time.sleep(5)
                
                # Перевіряємо чи дійшли до Ads Manager
                if self.check_ads_manager_page():
                    print("✅ Успішно дійшли до Ads Manager")
                    return True
                    
            print("❌ Не вдалося дійти до Ads Manager")
            return False
            
        except Exception as e:
            print(f"❌ Помилка навігації в Ads Manager: {e}")
            return False
    
    def check_ads_manager_page(self):
        """Перевірка чи ми в Ads Manager"""
        try:
            # Шукаємо характерні елементи Ads Manager
            ads_manager_indicators = [
                '[data-testid="ads_manager"]',
                '[data-testid="campaign_table"]',
                'h1:contains("Ads Manager")',
                '[data-testid="create_campaign_button"]',
                '.ads-manager-container'
            ]
            
            for selector in ads_manager_indicators:
                try:
                    if ':contains(' in selector:
                        # Для text содержащих селекторов используем XPath
                        xpath = f"//h1[contains(text(), 'Ads Manager')]"
                        element = self.driver.find_elements(By.XPATH, xpath)
                    else:
                        element = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    if element:
                        return True
                except:
                    continue
                    
            # Перевіряємо URL
            current_url = self.driver.current_url
            if 'adsmanager' in current_url or 'business.facebook.com' in current_url:
                return True
                
            return False
            
        except Exception as e:
            print(f"⚠️ Помилка перевірки Ads Manager: {e}")
            return False
    
    def extract_ad_accounts(self):
        """Витягування рекламних кабінетів"""
        print("📊 Витягуємо рекламні кабінети...")
        
        ad_accounts = []
        
        try:
            # Метод 1: Шукаємо в DOM елементах
            accounts_from_dom = self.extract_from_dom()
            if accounts_from_dom:
                ad_accounts.extend(accounts_from_dom)
            
            # Метод 2: Шукаємо в JavaScript об'єктах
            accounts_from_js = self.extract_from_javascript()
            if accounts_from_js:
                ad_accounts.extend(accounts_from_js)
            
            # Метод 3: Шукаємо в Network requests
            accounts_from_network = self.extract_from_network()
            if accounts_from_network:
                ad_accounts.extend(accounts_from_network)
            
            # Прибираємо дублікати
            unique_accounts = {}
            for account in ad_accounts:
                account_id = account.get('account_id') or account.get('id')
                if account_id:
                    unique_accounts[account_id] = account
            
            final_accounts = list(unique_accounts.values())
            print(f"✅ Знайдено {len(final_accounts)} унікальних рекламних кабінетів")
            
            return final_accounts
            
        except Exception as e:
            print(f"❌ Помилка витягування кабінетів: {e}")
            return []
    
    def extract_from_dom(self):
        """Витягування з DOM елементів"""
        print("🔍 Шукаємо в DOM елементах...")
        
        accounts = []
        
        try:
            # Чекаємо завантаження сторінки
            time.sleep(5)
            
            # Різні селектори для ad account елементів
            selectors = [
                '[data-testid*="account"]',
                '[data-testid*="adaccount"]',
                '.account-selector',
                '[role="option"]',
                '.dropdown-item'
            ]
            
            for selector in selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    print(f"   Знайдено {len(elements)} елементів за селектором: {selector}")
                    
                    for element in elements:
                        try:
                            text = element.text.strip()
                            data_testid = element.get_attribute('data-testid') or ''
                            
                            if text and ('act_' in text or 'account' in text.lower()):
                                # Спробуємо витягнути ID з тексту
                                import re
                                account_id_match = re.search(r'act_(\d+)', text)
                                if account_id_match:
                                    account_id = account_id_match.group(1)
                                    accounts.append({
                                        'id': f'act_{account_id}',
                                        'account_id': account_id,
                                        'name': text,
                                        'source': 'dom_extraction'
                                    })
                                    
                        except Exception as e:
                            continue
                            
                except Exception as e:
                    continue
            
            return accounts
            
        except Exception as e:
            print(f"❌ Помилка DOM extraction: {e}")
            return []
    
    def extract_from_javascript(self):
        """Витягування з JavaScript об'єктів на сторінці"""
        print("🔍 Шукаємо в JavaScript об'єктах...")
        
        accounts = []
        
        try:
            # Виконуємо JavaScript для пошуку даних
            js_script = """
            var accounts = [];
            
            // Шукаємо в глобальних об'єктах
            if (window.__INITIAL_DATA__) {
                var data = JSON.stringify(window.__INITIAL_DATA__);
                var matches = data.match(/act_(\\d+)/g);
                if (matches) {
                    matches.forEach(function(match) {
                        var id = match.replace('act_', '');
                        accounts.push({
                            id: match,
                            account_id: id,
                            name: 'Account ' + id,
                            source: 'javascript_global'
                        });
                    });
                }
            }
            
            // Шукаємо в localStorage
            try {
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    var value = localStorage.getItem(key);
                    if (value && value.includes('act_')) {
                        var matches = value.match(/act_(\\d+)/g);
                        if (matches) {
                            matches.forEach(function(match) {
                                var id = match.replace('act_', '');
                                accounts.push({
                                    id: match,
                                    account_id: id,
                                    name: 'Account ' + id,
                                    source: 'localStorage'
                                });
                            });
                        }
                    }
                }
            } catch (e) {}
            
            return accounts;
            """
            
            js_accounts = self.driver.execute_script(js_script)
            if js_accounts:
                accounts.extend(js_accounts)
                print(f"   Знайдено {len(js_accounts)} кабінетів в JavaScript")
            
            return accounts
            
        except Exception as e:
            print(f"❌ Помилка JavaScript extraction: {e}")
            return []
    
    def extract_from_network(self):
        """Витягування з мережевих запитів (логи браузера)"""
        print("🔍 Шукаємо в мережевих запитах...")
        
        accounts = []
        
        try:
            # Отримуємо логи браузера
            logs = self.driver.get_log('performance')
            
            for log in logs:
                try:
                    message = json.loads(log['message'])
                    if 'Network.responseReceived' in message.get('method', ''):
                        response = message.get('params', {}).get('response', {})
                        url = response.get('url', '')
                        
                        if 'graphql' in url or 'adaccount' in url:
                            print(f"   Знайдено релевантний запит: {url[:100]}...")
                            
                except Exception as e:
                    continue
            
            return accounts
            
        except Exception as e:
            print(f"❌ Помилка Network extraction: {e}")
            return []
    
    def cleanup(self):
        """Закриття браузера"""
        if self.driver:
            print("🧹 Закриваємо браузер...")
            try:
                self.driver.quit()
            except:
                pass
    
    def extract_data(self):
        """Головний метод витягування даних"""
        try:
            # 1. Налаштування браузера
            if not self.setup_browser():
                return None
            
            # 2. Завантаження cookies
            if not self.load_cookies():
                return None
            
            # 3. Перевірка авторизації
            if not self.check_login_status():
                return None
            
            # 4. Навігація в Ads Manager
            if not self.navigate_to_ads_manager():
                return None
            
            # 5. Витягування рекламних кабінетів
            ad_accounts = self.extract_ad_accounts()
            
            return {
                'data': ad_accounts,
                'method': 'browser_automation',
                'facebook_id': self.facebook_id
            }
            
        except Exception as e:
            print(f"❌ Загальна помилка: {e}")
            return None
        finally:
            self.cleanup()


class BrowserAutomationHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler для Browser Automation backend"""
    
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
            'service': 'Facebook Browser Automation Backend',
            'version': '4.0',
            'description': 'Backend для витягування Facebook рекламних кабінетів через Selenium WebDriver',
            'methods': ['DOM Extraction', 'JavaScript Extraction', 'Network Monitoring'],
            'requirements': ['Chrome/Chromium Browser', 'ChromeDriver'],
            'endpoints': {
                'GET /': 'Інформація про API',
                'GET /api/facebook/accounts': 'Список Facebook акаунтів',
                'GET /api/facebook/accounts/{id}/adaccounts': 'Рекламні кабінети через браузер'
            },
            'status': 'ready'
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
    
    def handle_get_ad_accounts(self, account_id):
        """Отримання рекламних кабінетів через Browser Automation"""
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
            
            print(f"🤖 Обробляємо акаунт {account_id} через браузер")
            print(f"   FB ID: {facebook_id}")
            print(f"   Name: {name}")
            print(f"   Cookies: {'Є' if cookies_data else 'Відсутні'} ({len(cookies_data) if cookies_data else 0} символів)")
            print(f"   User Agent: {'Є' if user_agent else 'Відсутній'}")
            
            if not cookies_data:
                self.send_error_response(400, 'Cookies обов\'язкові для browser automation')
                return
            
            # Створюємо екстрактор і витягуємо дані
            extractor = FacebookBrowserExtractor(
                cookies_data=cookies_data,
                user_agent=user_agent,
                facebook_id=facebook_id
            )
            
            # Витягуємо дані про рекламні кабінети
            ads_data = extractor.extract_data()
            
            if ads_data:
                method = ads_data.get('method', 'unknown')
                data_count = len(ads_data.get('data', []))
                print(f"✅ Успішно витягнуто {data_count} кабінетів методом: {method}")
                
                self.send_response(200)
                for key, value in CORS_HEADERS.items():
                    self.send_header(key, value)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'success',
                    'account_id': account_id,
                    'facebook_id': facebook_id,
                    'method': method,
                    'count': data_count,
                    'data': ads_data
                }
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            else:
                self.send_error_response(400, 'Не вдалося отримати дані про рекламні кабінети')
                
        except Exception as e:
            print(f"🚫 Помилка обробки ad accounts: {e}")
            self.send_error_response(500, f'Browser automation error: {str(e)}')
    
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
    server_address = ('localhost', 8001)  # Використовуємо інший порт
    httpd = HTTPServer(server_address, BrowserAutomationHandler)
    
    print("🤖 Facebook Browser Automation Backend v4.0 запущений на http://localhost:8001")
    print("📋 Методи витягування:")
    print("   1️⃣ DOM Extraction - пошук в DOM елементах")
    print("   2️⃣ JavaScript Extraction - пошук в JS об'єктах")
    print("   3️⃣ Network Monitoring - аналіз мережевих запитів")
    print("📋 API endpoints:")
    print("   GET /                                      - Інформація про API")
    print("   GET /api/facebook/accounts                 - Список акаунтів")
    print("   GET /api/facebook/accounts/{id}/adaccounts - Рекламні кабінети")
    print("⚠️  Для роботи потрібно встановити: pip install selenium")
    print("⚠️  І ChromeDriver: brew install chromedriver (macOS)")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹️  Сервер зупинений")
        httpd.shutdown()


if __name__ == '__main__':
    main()