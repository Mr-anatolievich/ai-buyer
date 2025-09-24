#!/usr/bin/env python3
"""
Facebook XHR Enhanced Pattern Extractor
Вдосконалений пошук даних в Facebook HTML з кращими паттернами
"""

import json
import sqlite3
import time
import urllib.request
import urllib.parse
import gzip
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

class FacebookEnhancedExtractor:
    """Вдосконалений екстрактор з кращими паттернами"""
    
    def __init__(self, cookies_data, user_agent, facebook_id):
        self.cookies_data = cookies_data
        self.user_agent = user_agent
        self.facebook_id = facebook_id
        
    def get_base_headers(self):
        """Базові заголовки"""
        return {
            'User-Agent': self.user_agent,
            'Cookie': self.cookies_data,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,uk;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'max-age=0'
        }
    
    def make_request(self, url, timeout=15):
        """HTTP запит з обробкою помилок"""
        try:
            print(f"📡 Запит: {url}")
            
            request = urllib.request.Request(url, headers=self.get_base_headers())
            
            with urllib.request.urlopen(request, timeout=timeout) as response:
                content = response.read()
                
                # Розпаковуємо gzip
                if response.headers.get('Content-Encoding') == 'gzip':
                    content = gzip.decompress(content)
                
                # Декодуємо текст
                try:
                    text = content.decode('utf-8')
                except UnicodeDecodeError:
                    text = content.decode('utf-8', errors='ignore')
                
                print(f"   ✅ Status: {response.status}, Length: {len(text):,}")
                return text
                
        except Exception as e:
            print(f"   ❌ Помилка: {e}")
            return None
    
    def enhanced_pattern_search(self, html_content, url):
        """Вдосконалений пошук патернів в HTML"""
        print(f"\n🔍 Аналізуємо HTML з {url}")
        print(f"   Розмір: {len(html_content):,} символів")
        
        findings = []
        
        # 1. Пошук JavaScript об'єктів з рекламними кабінетами
        js_patterns = [
            r'"adAccountId":\s*"(\d+)"',
            r'"account_id":\s*"(\d+)"', 
            r'"accountId":\s*"(\d+)"',
            r'"adaccount_id":\s*"(\d+)"',
            r'"id":\s*"act_(\d+)"',
            r'act_(\d+)',
            r'"entityID":\s*"(\d+)"',
            r'"advertiserAccountID":\s*"(\d+)"'
        ]
        
        account_ids = set()
        
        for pattern in js_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    account_id = match[0] if match[0] else match[1]
                else:
                    account_id = match
                
                if account_id and account_id.isdigit() and len(account_id) > 5:
                    account_ids.add(account_id)
        
        if account_ids:
            print(f"   ✅ Знайдено ID кабінетів: {list(account_ids)}")
            for acc_id in account_ids:
                findings.append({
                    'type': 'ad_account_id',
                    'id': f'act_{acc_id}',
                    'account_id': acc_id,
                    'source': 'regex_pattern',
                    'url': url
                })
        
        # 2. Пошук RequireJS модулів
        require_pattern = r'requireLazy\(\["([^"]*[Aa]d[^"]*)"[^\]]*\]'
        require_matches = re.findall(require_pattern, html_content)
        
        if require_matches:
            print(f"   📦 RequireJS модулі: {require_matches}")
            findings.append({
                'type': 'requirejs_modules',
                'modules': require_matches,
                'source': 'requirejs',
                'url': url
            })
        
        # 3. Пошук GraphQL запитів
        graphql_patterns = [
            r'"doc_id":\s*"?(\d+)"?',
            r'"documentID":\s*"?(\d+)"?',
            r'"queryID":\s*"?(\d+)"?'
        ]
        
        for pattern in graphql_patterns:
            matches = re.findall(pattern, html_content)
            if matches:
                print(f"   🔗 GraphQL документи: {matches}")
                findings.append({
                    'type': 'graphql_doc_ids',
                    'doc_ids': matches,
                    'source': 'graphql_pattern',
                    'url': url
                })
        
        # 4. Пошук DTSG токенів
        dtsg_pattern = r'"DTSGInitData"[^"]*"token":\s*"([^"]+)"'
        dtsg_matches = re.findall(dtsg_pattern, html_content)
        
        if dtsg_matches:
            print(f"   🔐 DTSG токени: {len(dtsg_matches)} знайдено")
            findings.append({
                'type': 'dtsg_tokens',
                'tokens': dtsg_matches,
                'source': 'dtsg_pattern',
                'url': url
            })
        
        # 5. Пошук конфігурації Ads Manager
        config_patterns = [
            r'"adsManagerConfig":\s*(\{[^}]+\})',
            r'"adAccountsData":\s*(\[[^\]]+\])',
            r'"campaignData":\s*(\{[^}]+\})'
        ]
        
        for pattern in config_patterns:
            matches = re.findall(pattern, html_content)
            if matches:
                print(f"   ⚙️ Конфігурація знайдена: {len(matches)} збігів")
                for match in matches:
                    try:
                        config_data = json.loads(match)
                        findings.append({
                            'type': 'ads_manager_config',
                            'config': config_data,
                            'source': 'config_pattern',
                            'url': url
                        })
                    except json.JSONDecodeError:
                        continue
        
        # 6. Пошук прихованих форм з токенами
        form_pattern = r'<input[^>]*name="([^"]*token[^"]*)"[^>]*value="([^"]*)"'
        form_matches = re.findall(form_pattern, html_content, re.IGNORECASE)
        
        if form_matches:
            print(f"   📝 Форми з токенами: {len(form_matches)}")
            findings.append({
                'type': 'form_tokens',
                'tokens': dict(form_matches),
                'source': 'form_pattern',
                'url': url
            })
        
        # 7. Пошук посилань на інші API ендпоінти
        api_pattern = r'"(/api/[^"]+)"'
        api_matches = re.findall(api_pattern, html_content)
        
        if api_matches:
            unique_apis = list(set(api_matches))
            print(f"   🔗 API ендпоінти: {len(unique_apis)}")
            findings.append({
                'type': 'api_endpoints',
                'endpoints': unique_apis,
                'source': 'api_pattern',
                'url': url
            })
        
        return findings
    
    def extract_comprehensive_data(self):
        """Комплексне витягування даних"""
        print("🚀 Запускаємо комплексне витягування...")
        
        # Список URL для аналізу
        urls_to_analyze = [
            'https://www.facebook.com/adsmanager/manage/campaigns',
            'https://www.facebook.com/adsmanager/manage/adaccounts', 
            'https://business.facebook.com/adsmanager/',
            'https://www.facebook.com/adsmanager/',
            'https://www.facebook.com/'  # Головна як fallback
        ]
        
        all_findings = []
        total_accounts = set()
        
        for url in urls_to_analyze:
            html_content = self.make_request(url)
            
            if html_content:
                findings = self.enhanced_pattern_search(html_content, url)
                all_findings.extend(findings)
                
                # Збираємо унікальні ID кабінетів
                for finding in findings:
                    if finding['type'] == 'ad_account_id':
                        total_accounts.add(finding['account_id'])
            
            # Затримка між запитами
            time.sleep(2)
        
        # Підсумок результатів
        result = {
            'facebook_id': self.facebook_id,
            'method': 'enhanced_pattern_extraction',
            'total_accounts_found': len(total_accounts),
            'account_ids': list(total_accounts),
            'detailed_findings': all_findings,
            'urls_analyzed': len(urls_to_analyze),
            'timestamp': time.time()
        }
        
        print(f"\n📊 Підсумок витягування:")
        print(f"   Проаналізовано URL: {len(urls_to_analyze)}")
        print(f"   Знайдено кабінетів: {len(total_accounts)}")
        print(f"   Всього знахідок: {len(all_findings)}")
        
        if total_accounts:
            print(f"   ID кабінетів: {list(total_accounts)}")
        
        return result


# Простий HTTP сервер для тестування
class EnhancedExtractorHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'service': 'Facebook Enhanced Pattern Extractor',
                'version': '2.0',
                'status': 'active'
            }
            self.wfile.write(json.dumps(response, indent=2).encode())
        
        elif self.path.startswith('/extract/'):
            account_id = self.path.split('/')[-1]
            
            # Отримуємо дані з бази
            try:
                conn = sqlite3.connect('ai_buyer.db')
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT facebook_id, cookies_data, user_agent 
                    FROM facebook_accounts WHERE id = ?
                """, (account_id,))
                
                account_data = cursor.fetchone()
                conn.close()
                
                if account_data:
                    facebook_id, cookies_data, user_agent = account_data
                    
                    extractor = FacebookEnhancedExtractor(
                        cookies_data=cookies_data,
                        user_agent=user_agent, 
                        facebook_id=facebook_id
                    )
                    
                    result = extractor.extract_comprehensive_data()
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(result, ensure_ascii=False, indent=2).encode())
                else:
                    self.send_error(404, 'Account not found')
                    
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)


def main():
    # Тестування з даними з бази
    try:
        conn = sqlite3.connect('ai_buyer.db')
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, facebook_id, cookies_data, user_agent 
            FROM facebook_accounts 
            WHERE facebook_id = '100009868933766'
        """)
        
        account_data = cursor.fetchone()
        conn.close()
        
        if account_data:
            account_id, facebook_id, cookies_data, user_agent = account_data
            
            print("🎯 Тестуємо вдосконалене витягування...")
            print(f"   Account ID: {account_id}")
            print(f"   Facebook ID: {facebook_id}")
            print(f"   Cookies: {'Є' if cookies_data else 'Відсутні'}")
            print(f"   User Agent: {'Є' if user_agent else 'Відсутній'}")
            
            extractor = FacebookEnhancedExtractor(
                cookies_data=cookies_data,
                user_agent=user_agent,
                facebook_id=facebook_id
            )
            
            result = extractor.extract_comprehensive_data()
            
            # Виводимо результат
            print(f"\n🎉 Результат:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
        else:
            print("❌ Акаунт не знайдений в базі")
            
    except Exception as e:
        print(f"❌ Помилка: {e}")


if __name__ == '__main__':
    main()