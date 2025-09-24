#!/usr/bin/env python3
"""
Facebook Raw Data Analyzer
Зберігає сирі HTML відповіді для ручного аналізу
"""

import json
import sqlite3
import time
import urllib.request
import gzip
import os

def save_raw_facebook_data():
    """Зберігаємо сирі дані Facebook для аналізу"""
    
    # Отримуємо дані з бази
    conn = sqlite3.connect('ai_buyer.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT facebook_id, cookies_data, user_agent 
        FROM facebook_accounts WHERE facebook_id = '100009868933766'
    """)
    
    account_data = cursor.fetchone()
    conn.close()
    
    if not account_data:
        print("❌ Акаунт не знайдений")
        return
    
    facebook_id, cookies_data, user_agent = account_data
    
    headers = {
        'User-Agent': user_agent,
        'Cookie': cookies_data,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    }
    
    # URL для тестування
    urls = {
        'ads_manager_campaigns': 'https://www.facebook.com/adsmanager/manage/campaigns',
        'ads_manager_accounts': 'https://www.facebook.com/adsmanager/manage/adaccounts',
        'business_ads_manager': 'https://business.facebook.com/adsmanager/',
        'facebook_main': 'https://www.facebook.com/'
    }
    
    # Створюємо папку для збереження
    os.makedirs('facebook_raw_data', exist_ok=True)
    
    results = {}
    
    for name, url in urls.items():
        print(f"📡 Завантажуємо: {name} ({url})")
        
        try:
            request = urllib.request.Request(url, headers=headers)
            
            with urllib.request.urlopen(request, timeout=15) as response:
                content = response.read()
                
                # Розпаковуємо gzip
                if response.headers.get('Content-Encoding') == 'gzip':
                    content = gzip.decompress(content)
                
                # Декодуємо
                try:
                    html = content.decode('utf-8')
                except UnicodeDecodeError:
                    html = content.decode('utf-8', errors='ignore')
                
                # Зберігаємо файл
                filename = f'facebook_raw_data/{name}.html'
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(html)
                
                print(f"   ✅ Збережено: {filename} ({len(html):,} символів)")
                
                # Базовий аналіз
                analysis = {
                    'url': url,
                    'status': response.status,
                    'size': len(html),
                    'filename': filename,
                    'contains_act_': 'act_' in html,
                    'contains_adaccount': 'adaccount' in html.lower(),
                    'contains_campaign': 'campaign' in html.lower(),
                    'contains_dtsg': 'DTSGInitData' in html,
                    'contains_requirejs': 'requireLazy' in html,
                    'contains_graphql': 'graphql' in html.lower()
                }
                
                results[name] = analysis
                
                # Пошук всіх числових ID (потенційні account ID)
                import re
                numeric_ids = re.findall(r'\b\d{8,20}\b', html)
                unique_ids = list(set(numeric_ids))
                
                if len(unique_ids) > 0:
                    print(f"   🔢 Знайдено числових ID: {len(unique_ids)}")
                    # Зберігаємо перші 20 для аналізу
                    analysis['numeric_ids'] = unique_ids[:20]
                
                print()
                
        except Exception as e:
            print(f"   ❌ Помилка: {e}")
            results[name] = {'error': str(e)}
        
        time.sleep(2)  # Затримка між запитами
    
    # Зберігаємо аналіз
    with open('facebook_raw_data/analysis.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("📊 ПІДСУМОК АНАЛІЗУ:")
    for name, data in results.items():
        if 'error' not in data:
            print(f"\n{name}:")
            print(f"   Розмір: {data['size']:,} символів")
            print(f"   Містить 'act_': {data['contains_act_']}")
            print(f"   Містить 'adaccount': {data['contains_adaccount']}")
            print(f"   Містить 'campaign': {data['contains_campaign']}")
            print(f"   Містить DTSG: {data['contains_dtsg']}")
            print(f"   Містить RequireJS: {data['contains_requirejs']}")
            print(f"   Містить GraphQL: {data['contains_graphql']}")
            
            if 'numeric_ids' in data:
                print(f"   Числові ID: {data['numeric_ids'][:5]}...")


def analyze_saved_files():
    """Аналізуємо збережені файли більш детально"""
    
    if not os.path.exists('facebook_raw_data'):
        print("❌ Папка facebook_raw_data не знайдена. Спочатку запустіть save_raw_facebook_data()")
        return
    
    print("🔍 ДЕТАЛЬНИЙ АНАЛІЗ ЗБЕРЕЖЕНИХ ФАЙЛІВ:")
    
    for filename in os.listdir('facebook_raw_data'):
        if filename.endswith('.html'):
            filepath = os.path.join('facebook_raw_data', filename)
            
            print(f"\n📄 Аналізуємо: {filename}")
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Детальний пошук патернів
            import re
            
            patterns = {
                'Facebook IDs (100...)': r'\b100\d{12,15}\b',
                'Ad Account IDs (act_)': r'act_\d+',  
                'Account IDs (числові)': r'"account_id":\s*"?(\d+)"?',
                'Entity IDs': r'"entityID":\s*"?(\d+)"?',
                'Page IDs': r'"pageID":\s*"?(\d+)"?',
                'Business IDs': r'"businessID":\s*"?(\d+)"?',
                'DTSG Tokens': r'"DTSGInitData"[^"]*"token":\s*"([^"]{10,})"',
                'API Endpoints': r'"/api/[^"]*"',
                'GraphQL Doc IDs': r'"doc_id":\s*"?(\d+)"?',
                'RequireJS Modules': r'requireLazy\(\["([^"]*Ad[^"]*)"'
            }
            
            for pattern_name, pattern in patterns.items():
                matches = re.findall(pattern, content, re.IGNORECASE)
                unique_matches = list(set(matches))
                
                if unique_matches:
                    print(f"   {pattern_name}: {len(unique_matches)} знайдено")
                    # Показуємо перші кілька збігів
                    for match in unique_matches[:3]:
                        if len(str(match)) > 50:
                            print(f"     - {str(match)[:47]}...")
                        else:
                            print(f"     - {match}")
                    if len(unique_matches) > 3:
                        print(f"     ... і ще {len(unique_matches) - 3}")


if __name__ == '__main__':
    print("🔍 Facebook Raw Data Analyzer")
    print("1️⃣ Завантажуємо сирі дані...")
    save_raw_facebook_data()
    
    print("\n2️⃣ Аналізуємо збережені файли...")
    analyze_saved_files()
    
    print(f"\n📁 Дані збережено в папці: facebook_raw_data/")
    print("💡 Можете відкрити HTML файли в браузері для візуального аналізу")