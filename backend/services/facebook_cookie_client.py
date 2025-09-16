"""
Facebook API Client через Cookies та UserAgent
Альтернатива офіційному Facebook Ads API для масштабування продукту
"""

import requests
import json
import time
import random
from typing import Dict, List, Any, Optional
from urllib.parse import urlencode
import logging
from datetime import datetime, timedelta
import re
from dataclasses import dataclass
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

@dataclass
class FacebookAccount:
    """Модель Facebook акаунта з мультитокеном"""
    id: str
    name: str
    access_token: str
    cookies: Dict[str, str]
    user_agent: str
    proxy: Optional[str] = None
    is_active: bool = True
    last_checked: Optional[datetime] = None

class FacebookCookieClient:
    """
    Facebook API клієнт через cookies замість офіційного App API
    Емулює браузерні запити для отримання даних кампаній
    """
    
    def __init__(self, account: FacebookAccount):
        self.account = account
        self.session = requests.Session()
        self.base_url = "https://adsmanager.facebook.com"
        self.graph_url = "https://graph.facebook.com"
        
        # Налаштування сесії
        self._setup_session()
        
    def _setup_session(self):
        """Налаштування HTTP сесії з cookies та headers"""
        
        # Встановлення cookies
        for name, value in self.account.cookies.items():
            self.session.cookies.set(name, value, domain='.facebook.com')
        
        # Встановлення headers для емуляції браузера
        self.session.headers.update({
            'User-Agent': self.account.user_agent,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        })
        
        # Проксі якщо є
        if self.account.proxy:
            proxy_parts = self.account.proxy.split(':')
            if len(proxy_parts) >= 2:
                proxy_dict = {
                    'http': f'http://{self.account.proxy}',
                    'https': f'http://{self.account.proxy}'
                }
                self.session.proxies.update(proxy_dict)
    
    def _make_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Виконання HTTP запиту з обробкою помилок та rate limiting"""
        
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                # Додаємо рандомну затримку для емуляції людської поведінки
                time.sleep(random.uniform(0.5, 2.0))
                
                response = self.session.request(method, url, **kwargs)
                
                if response.status_code == 429:  # Rate limit
                    wait_time = int(response.headers.get('Retry-After', 30))
                    logger.warning(f"Rate limit hit. Waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue
                    
                if response.status_code >= 400:
                    logger.error(f"HTTP Error {response.status_code}: {response.text}")
                
                return response
                
            except requests.RequestException as e:
                logger.error(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))
                else:
                    raise
        
        raise Exception(f"Failed to complete request after {max_retries} attempts")
    
    def test_connection(self) -> Dict[str, Any]:
        """Перевірка валідності акаунта та токена"""
        try:
            # Спроба отримати базову інформацію про користувача
            url = f"{self.graph_url}/me"
            params = {
                'access_token': self.account.access_token,
                'fields': 'id,name,email'
            }
            
            response = self._make_request('GET', url, params=params)
            
            if response.status_code == 200:
                user_data = response.json()
                return {
                    'success': True,
                    'user_id': user_data.get('id'),
                    'user_name': user_data.get('name'),
                    'email': user_data.get('email')
                }
            else:
                return {
                    'success': False,
                    'error': f"Invalid token or connection failed: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_ad_accounts(self) -> List[Dict[str, Any]]:
        """Отримання списку рекламних кабінетів"""
        try:
            url = f"{self.graph_url}/me/adaccounts"
            params = {
                'access_token': self.account.access_token,
                'fields': 'id,name,account_status,currency,timezone_name,amount_spent,balance,account_id',
                'limit': 100
            }
            
            response = self._make_request('GET', url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            else:
                logger.error(f"Failed to get ad accounts: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting ad accounts: {e}")
            return []
    
    def get_campaigns(self, ad_account_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Отримання списку кампаній"""
        try:
            url = f"{self.graph_url}/{ad_account_id}/campaigns"
            params = {
                'access_token': self.account.access_token,
                'fields': ','.join([
                    'id', 'name', 'status', 'objective', 'created_time', 'updated_time',
                    'start_time', 'stop_time', 'daily_budget', 'lifetime_budget',
                    'budget_remaining', 'configured_status', 'effective_status'
                ]),
                'limit': limit
            }
            
            response = self._make_request('GET', url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            else:
                logger.error(f"Failed to get campaigns: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting campaigns: {e}")
            return []
    
    def get_campaign_insights(self, campaign_id: str, 
                            date_preset: str = 'last_30d') -> Dict[str, Any]:
        """Отримання аналітики кампанії"""
        try:
            url = f"{self.graph_url}/{campaign_id}/insights"
            params = {
                'access_token': self.account.access_token,
                'date_preset': date_preset,
                'fields': ','.join([
                    'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'cpp',
                    'spend', 'reach', 'frequency', 'actions', 'cost_per_action_type',
                    'action_values', 'conversions', 'conversion_values', 'cost_per_conversion'
                ]),
                'level': 'campaign'
            }
            
            response = self._make_request('GET', url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                insights = data.get('data', [])
                return insights[0] if insights else {}
            else:
                logger.error(f"Failed to get campaign insights: {response.status_code}")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting campaign insights: {e}")
            return {}
    
    def get_ad_sets(self, campaign_id: str) -> List[Dict[str, Any]]:
        """Отримання груп оголошень"""
        try:
            url = f"{self.graph_url}/{campaign_id}/adsets"
            params = {
                'access_token': self.account.access_token,
                'fields': ','.join([
                    'id', 'name', 'status', 'configured_status', 'effective_status',
                    'created_time', 'updated_time', 'start_time', 'end_time',
                    'daily_budget', 'lifetime_budget', 'budget_remaining',
                    'bid_strategy', 'optimization_goal', 'targeting'
                ]),
                'limit': 100
            }
            
            response = self._make_request('GET', url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            else:
                logger.error(f"Failed to get ad sets: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting ad sets: {e}")
            return []
    
    def get_ads(self, adset_id: str) -> List[Dict[str, Any]]:
        """Отримання оголошень"""
        try:
            url = f"{self.graph_url}/{adset_id}/ads"
            params = {
                'access_token': self.account.access_token,
                'fields': ','.join([
                    'id', 'name', 'status', 'configured_status', 'effective_status',
                    'created_time', 'updated_time', 'creative', 'preview_shareable_link'
                ]),
                'limit': 100
            }
            
            response = self._make_request('GET', url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            else:
                logger.error(f"Failed to get ads: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting ads: {e}")
            return []
    
    def update_campaign_budget(self, campaign_id: str, daily_budget: float) -> bool:
        """Оновлення бюджету кампанії"""
        try:
            url = f"{self.graph_url}/{campaign_id}"
            data = {
                'access_token': self.account.access_token,
                'daily_budget': int(daily_budget * 100)  # Facebook очікує центи
            }
            
            response = self._make_request('POST', url, data=data)
            
            if response.status_code == 200:
                logger.info(f"Campaign {campaign_id} budget updated to ${daily_budget}")
                return True
            else:
                logger.error(f"Failed to update campaign budget: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating campaign budget: {e}")
            return False
    
    def pause_campaign(self, campaign_id: str) -> bool:
        """Зупинка кампанії"""
        try:
            url = f"{self.graph_url}/{campaign_id}"
            data = {
                'access_token': self.account.access_token,
                'status': 'PAUSED'
            }
            
            response = self._make_request('POST', url, data=data)
            
            if response.status_code == 200:
                logger.info(f"Campaign {campaign_id} paused")
                return True
            else:
                logger.error(f"Failed to pause campaign: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error pausing campaign: {e}")
            return False
    
    def resume_campaign(self, campaign_id: str) -> bool:
        """Відновлення кампанії"""
        try:
            url = f"{self.graph_url}/{campaign_id}"
            data = {
                'access_token': self.account.access_token,
                'status': 'ACTIVE'
            }
            
            response = self._make_request('POST', url, data=data)
            
            if response.status_code == 200:
                logger.info(f"Campaign {campaign_id} resumed")
                return True
            else:
                logger.error(f"Failed to resume campaign: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error resuming campaign: {e}")
            return False


class FacebookAccountManager:
    """Менеджер для роботи з кількома Facebook акаунтами"""
    
    def __init__(self):
        self.accounts: Dict[str, FacebookAccount] = {}
        self.clients: Dict[str, FacebookCookieClient] = {}
    
    def add_account_from_multitoken(self, account_id: str, name: str, multitoken: str) -> bool:
        """Додавання акаунта з мультитокена"""
        try:
            # Декодування мультитокена
            import base64
            decoded = json.loads(base64.b64decode(multitoken).decode('utf-8'))
            
            # Конвертація cookies з масиву в словник
            cookies_dict = {}
            for cookie in decoded.get('cookies', []):
                cookies_dict[cookie['name']] = cookie['value']
            
            account = FacebookAccount(
                id=account_id,
                name=name,
                access_token=decoded['token'],
                cookies=cookies_dict,
                user_agent=decoded['ua']
            )
            
            # Створення клієнта та перевірка підключення
            client = FacebookCookieClient(account)
            test_result = client.test_connection()
            
            if test_result['success']:
                self.accounts[account_id] = account
                self.clients[account_id] = client
                account.last_checked = datetime.now()
                
                logger.info(f"Account {name} added successfully")
                return True
            else:
                logger.error(f"Account {name} connection failed: {test_result['error']}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to add account from multitoken: {e}")
            return False
    
    def get_account_client(self, account_id: str) -> Optional[FacebookCookieClient]:
        """Отримання клієнта для конкретного акаунта"""
        return self.clients.get(account_id)
    
    def get_all_campaigns_data(self) -> Dict[str, Any]:
        """Отримання даних всіх кампаній з усіх акаунтів"""
        all_data = {}
        
        for account_id, client in self.clients.items():
            try:
                account_data = {
                    'ad_accounts': [],
                    'campaigns': [],
                    'total_spend': 0
                }
                
                # Отримання рекламних кабінетів
                ad_accounts = client.get_ad_accounts()
                account_data['ad_accounts'] = ad_accounts
                
                # Отримання кампаній для кожного кабінету
                for ad_account in ad_accounts:
                    ad_account_id = ad_account['id']
                    campaigns = client.get_campaigns(ad_account_id)
                    
                    for campaign in campaigns:
                        # Отримання аналітики кампанії
                        insights = client.get_campaign_insights(campaign['id'])
                        campaign['insights'] = insights
                        
                        # Додавання до загальної суми витрат
                        spend = float(insights.get('spend', 0))
                        account_data['total_spend'] += spend
                    
                    account_data['campaigns'].extend(campaigns)
                
                all_data[account_id] = account_data
                
            except Exception as e:
                logger.error(f"Error getting data for account {account_id}: {e}")
                all_data[account_id] = {'error': str(e)}
        
        return all_data
    
    def health_check_all_accounts(self) -> Dict[str, bool]:
        """Перевірка стану всіх акаунтів"""
        results = {}
        
        for account_id, client in self.clients.items():
            try:
                test_result = client.test_connection()
                results[account_id] = test_result['success']
                
                # Оновлення часу останньої перевірки
                if account_id in self.accounts:
                    self.accounts[account_id].last_checked = datetime.now()
                    self.accounts[account_id].is_active = test_result['success']
                    
            except Exception as e:
                logger.error(f"Health check failed for account {account_id}: {e}")
                results[account_id] = False
        
        return results