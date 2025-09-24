#!/usr/bin/env python3
"""
Простий тест Facebook cookies
"""
import urllib.request
import urllib.parse

def test_facebook_cookies():
    # Ваші cookies
    cookies = 'datr=iG3JaJiD_OaWqUY-9g5Zuyrk; sb=jG3JaGZuTf6VyZjjYH4wf0GA; ps_l=1; ps_n=1; c_user=100009868933766'
    
    user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    
    # Спробуємо різні URL
    test_urls = [
        'https://www.facebook.com/',
        'https://m.facebook.com/',
        'https://www.facebook.com/me'
    ]
    
    for url in test_urls:
        try:
            print(f"\n🔍 Тестуємо: {url}")
            
            request = urllib.request.Request(url)
            request.add_header('User-Agent', user_agent)
            request.add_header('Cookie', cookies)
            request.add_header('Accept', 'text/html,application/xhtml+xml')
            request.add_header('Accept-Language', 'en-US,en;q=0.9')
            
            with urllib.request.urlopen(request, timeout=15) as response:
                print(f"✅ Status: {response.status}")
                print(f"📍 Final URL: {response.url}")
                
                # Читаємо початок контенту
                content = response.read(1000)
                content_str = content.decode('utf-8', errors='ignore')
                
                if 'login' in content_str.lower():
                    print("🔥 Перенаправляє на login - cookies не валідні")
                elif 'facebook' in content_str.lower():
                    print("✅ Успіх - Facebook відповів з контентом")
                    
                    # Шукаємо ознаки авторизації
                    if 'c_user' in content_str or 'profile' in content_str.lower():
                        print("🎉 Схоже ви авторизовані!")
                else:
                    print("❓ Незрозуміла відповідь")
                    
        except urllib.error.HTTPError as e:
            print(f"❌ HTTP Error {e.code}: {e.reason}")
        except Exception as e:
            print(f"❌ Помилка: {e}")

def test_ads_manager_access():
    """Тест доступу до Ads Manager без cookies"""
    print("\n" + "="*50)
    print("🎯 Тестуємо доступ до Ads Manager")
    print("="*50)
    
    # Базові заголовки
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    try:
        request = urllib.request.Request('https://www.facebook.com/adsmanager/')
        for key, value in headers.items():
            request.add_header(key, value)
            
        with urllib.request.urlopen(request, timeout=15) as response:
            print(f"✅ Status: {response.status}")
            print(f"📍 Final URL: {response.url}")
            
            content = response.read(2000).decode('utf-8', errors='ignore')
            
            if 'login' in content.lower():
                print("🔄 Перенаправляє на login (очікувано без cookies)")
            elif 'adsmanager' in content.lower():
                print("🎯 Ads Manager відповів")
            else:
                print("❓ Незрозуміла відповідь")
                
    except Exception as e:
        print(f"❌ Помилка доступу до Ads Manager: {e}")

if __name__ == '__main__':
    print("🧪 Тестуємо Facebook cookies...")
    test_facebook_cookies()
    test_ads_manager_access()