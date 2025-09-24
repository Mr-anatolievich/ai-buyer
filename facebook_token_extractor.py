#!/usr/bin/env python3
"""
Facebook Access Token Extractor inspired by FBTool.pro approach
Extracts access tokens from Facebook pages for API usage
"""
import sqlite3
import requests
import json
import time
from urllib.parse import parse_qs, urlparse

class FacebookTokenExtractor:
    def __init__(self, db_path='ai_buyer.db'):
        self.db_path = db_path
        self.session = requests.Session()
        
    def get_user_cookies(self, facebook_id='100009868933766'):
        """Get user cookies from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT cookies_data, user_agent 
                FROM facebook_accounts 
                WHERE facebook_id = ?
            """, (facebook_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                cookies_str, user_agent = result
                # Parse cookies string into dict
                cookies_dict = {}
                for cookie in cookies_str.split('; '):
                    if '=' in cookie:
                        key, value = cookie.split('=', 1)
                        cookies_dict[key] = value
                
                return cookies_dict, user_agent
            return None, None
            
        except Exception as e:
            print(f"Database error: {e}")
            return None, None
    
    def extract_token_from_page(self, url="https://www.facebook.com/adsmanager/"):
        """Extract access token from Facebook page similar to FBTool.pro extension"""
        cookies, user_agent = self.get_user_cookies()
        if not cookies:
            print("❌ No cookies found in database")
            return None
            
        headers = {
            'User-Agent': user_agent or 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        try:
            print(f"🔍 Extracting token from {url}")
            response = self.session.get(url, headers=headers, cookies=cookies, timeout=30)
            
            if response.status_code != 200:
                print(f"❌ HTTP {response.status_code}: {response.text[:200]}")
                return None
                
            html_content = response.text
            
            # Token extraction patterns (similar to FBTool.pro)
            token_patterns = [
                r'"accessToken":"([^"]+)"',
                r'"access_token":"([^"]+)"',
                r'accessToken=([^&"\s]+)',
                r'access_token=([^&"\s]+)',
                r'EAAG[0-9A-Za-z]+',  # Facebook app access token pattern
                r'EAA[0-9A-Za-z_-]{100,}',  # Extended access token pattern
            ]
            
            import re
            for pattern in token_patterns:
                matches = re.findall(pattern, html_content)
                if matches:
                    token = matches[0]
                    if len(token) > 50:  # Valid tokens are usually long
                        print(f"✅ Found access token: {token[:20]}...{token[-10:]}")
                        return token
            
            # Try to find DTSG token for API calls
            dtsg_patterns = [
                r'"DTSGInitialData",\[\],\{"token":"([^"]+)"',
                r'DTSGInitData.*?"token":"([^"]+)"',
                r'"dtsg":\{"token":"([^"]+)"'
            ]
            
            for pattern in dtsg_patterns:
                matches = re.findall(pattern, html_content)
                if matches:
                    dtsg = matches[0]
                    print(f"✅ Found DTSG token: {dtsg[:20]}...{dtsg[-10:]}")
                    return dtsg
            
            print("❌ No access token found in page")
            return None
            
        except Exception as e:
            print(f"❌ Token extraction error: {e}")
            return None
    
    def get_ad_accounts_with_token(self, access_token):
        """Get ad accounts using access token (FBTool.pro approach)"""
        if not access_token:
            return None
            
        try:
            # Facebook Marketing API endpoint
            url = f"https://graph.facebook.com/v18.0/me/adaccounts"
            
            params = {
                'access_token': access_token,
                'fields': 'account_id,name,account_status,currency,business'
            }
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                accounts = data.get('data', [])
                
                print(f"✅ Found {len(accounts)} ad accounts via API:")
                for account in accounts:
                    account_id = account.get('account_id', 'N/A')
                    name = account.get('name', 'N/A')
                    status = account.get('account_status', 'N/A')
                    print(f"   • act_{account_id}: {name} ({status})")
                
                return accounts
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text[:300]}")
                return None
                
        except Exception as e:
            print(f"❌ API request error: {e}")
            return None
    
    def run_extraction(self):
        """Run complete extraction process"""
        print("🚀 Starting FBTool.pro-inspired token extraction")
        
        # Step 1: Extract access token from page
        token = self.extract_token_from_page()
        
        if token:
            # Step 2: Use token to get ad accounts via API
            accounts = self.get_ad_accounts_with_token(token)
            
            if accounts:
                print(f"\n✅ Successfully extracted {len(accounts)} ad accounts!")
                return accounts
            else:
                print("\n❌ Could not get accounts via API")
                return None
        else:
            print("\n❌ Could not extract access token")
            return None

def main():
    extractor = FacebookTokenExtractor()
    result = extractor.run_extraction()
    
    if result:
        print("\n🎉 Extraction completed successfully!")
    else:
        print("\n💥 Extraction failed - trying alternative method...")
        
        # Fallback: Browser extension approach
        print("\n📋 Alternative: Use browser extension approach")
        print("1. Install Chrome extension manually")
        print("2. Navigate to https://www.facebook.com/adsmanager/")
        print("3. Look for access tokens in Network tab or use our content.js")

if __name__ == "__main__":
    main()