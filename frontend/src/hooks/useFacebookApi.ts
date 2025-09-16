/**/**

 * API hooks for Facebook accounts management * API hooks for Facebook accounts management

 */ */



import { useState, useEffect, useCallback } from 'react';import { useState, useEffect } from 'react';



const API_BASE_URL = 'http://localhost:8001/api';const API_BASE_URL = 'http://localhost:8001/api';



export interface FacebookAccount {export interface FacebookAccount {

  id: number;  id: number;

  name: string;  name: string;

  facebook_id: string;  facebook_id: string;

  group_name?: string;  group_name?: string;

  status: 'active' | 'inactive' | 'banned';  status: 'active' | 'inactive' | 'banned';

  token_status: 'active' | 'expired' | 'invalid';  token_status: 'active' | 'expired' | 'invalid';

  access_token?: string;  access_token?: string;

  user_agent?: string;  user_agent?: string;

  cookies_data?: string;  cookies_data?: string;

  proxy_id?: number;  proxy_id?: number;

  balance?: string;  balance?: string;

  daily_limit?: string;  daily_limit?: string;

  cookies_loaded: boolean;  cookies_loaded: boolean;

  primary_cabinet?: string;  primary_cabinet?: string;

  primary_cabinet_id?: string;  primary_cabinet_id?: string;

  total_cabinets: number;  total_cabinets: number;

  created_at: string;  created_at: string;

  updated_at: string;  updated_at: string;

}}



export interface AdAccount {export interface AdAccount {

  id: number;  id: number;

  account_id: string;  account_id: string;

  name: string;  name: string;

  status: string;  status: string;

  currency: string;  currency: string;

  timezone?: string;  timezone?: string;

}}



export interface FacebookPage {export interface FacebookPage {

  id: number;  id: number;

  page_id: string;  page_id: string;

  name: string;  name: string;

  status: string;  status: string;

  category?: string;  category?: string;

}}



export interface FacebookAccountCreate {export interface FacebookAccountCreate {

  name: string;  name: string;

  facebook_id: string;  facebook_id: string;

  group_name?: string;  group_name?: string;

  status?: string;  status?: string;

  token_status?: string;  token_status?: string;

  access_token?: string;  access_token?: string;

  user_agent?: string;  user_agent?: string;

  cookies_data?: string;  cookies_data?: string;

  proxy_id?: number;  proxy_id?: number;

  balance?: string;  balance?: string;

  daily_limit?: string;  daily_limit?: string;

  cookies_loaded?: boolean;  cookies_loaded?: boolean;

  primary_cabinet?: string;  primary_cabinet?: string;

  primary_cabinet_id?: string;  primary_cabinet_id?: string;

  total_cabinets?: number;  total_cabinets?: number;

}}



export const useFacebookAccounts = (groupName?: string, status?: string) => {export const useFacebookAccounts = (groupName?: string, status?: string) => {

  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);

  const [loading, setLoading] = useState(true);  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);  const [error, setError] = useState<string | null>(null);



  const fetchAccounts = useCallback(async () => {  const fetchAccounts = async () => {

    try {    try {

      setLoading(true);      setLoading(true);

      setError(null);      setError(null);

            

      const params = new URLSearchParams();      const params = new URLSearchParams();

      if (groupName && groupName !== 'all') {      if (groupName && groupName !== 'all') {

        params.append('group_name', groupName);        params.append('group_name', groupName);

      }      }

      if (status) {      if (status) {

        params.append('status', status);        params.append('status', status);

      }      }

            

      const response = await fetch(`${API_BASE_URL}/facebook/accounts?${params}`);      const response = await fetch(`${API_BASE_URL}/facebook/accounts?${params}`);

            

      if (!response.ok) {      if (!response.ok) {

        throw new Error(`Failed to fetch accounts: ${response.statusText}`);        throw new Error(`Failed to fetch accounts: ${response.statusText}`);

      }      }

            

      const data = await response.json();      const data = await response.json();

      setAccounts(data);      setAccounts(data);

    } catch (err) {    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');

    } finally {    } finally {

      setLoading(false);      setLoading(false);

    }    }

  }, [groupName, status]);  };



  useEffect(() => {  useEffect(() => {

    fetchAccounts();    fetchAccounts();

  }, [fetchAccounts]);  }, [groupName, status]);



  const createAccount = async (accountData: FacebookAccountCreate): Promise<FacebookAccount> => {  const createAccount = async (accountData: FacebookAccountCreate): Promise<FacebookAccount> => {

    const response = await fetch(`${API_BASE_URL}/facebook/accounts`, {    const response = await fetch(`${API_BASE_URL}/facebook/accounts`, {

      method: 'POST',      method: 'POST',

      headers: {      headers: {

        'Content-Type': 'application/json',        'Content-Type': 'application/json',

      },      },

      body: JSON.stringify(accountData),      body: JSON.stringify(accountData),

    });    });



    if (!response.ok) {    if (!response.ok) {

      const errorData = await response.json();      const errorData = await response.json();

      throw new Error(errorData.detail || 'Failed to create account');      throw new Error(errorData.detail || 'Failed to create account');

    }    }



    const newAccount = await response.json();    const newAccount = await response.json();

    await fetchAccounts(); // Refresh the list    await fetchAccounts(); // Refresh the list

    return newAccount;    return newAccount;

  };  };



  const updateAccount = async (accountId: number, updates: Partial<FacebookAccountCreate>): Promise<FacebookAccount> => {  const updateAccount = async (accountId: number, updates: Partial<FacebookAccountCreate>): Promise<FacebookAccount> => {

    const response = await fetch(`${API_BASE_URL}/facebook/accounts/${accountId}`, {    const response = await fetch(`${API_BASE_URL}/facebook/accounts/${accountId}`, {

      method: 'PUT',      method: 'PUT',

      headers: {      headers: {

        'Content-Type': 'application/json',        'Content-Type': 'application/json',

      },      },

      body: JSON.stringify(updates),      body: JSON.stringify(updates),

    });    });



    if (!response.ok) {    if (!response.ok) {

      const errorData = await response.json();      const errorData = await response.json();

      throw new Error(errorData.detail || 'Failed to update account');      throw new Error(errorData.detail || 'Failed to update account');

    }    }



    const updatedAccount = await response.json();    const updatedAccount = await response.json();

    await fetchAccounts(); // Refresh the list    await fetchAccounts(); // Refresh the list

    return updatedAccount;    return updatedAccount;

  };  };



  const deleteAccount = async (accountId: number): Promise<void> => {  const deleteAccount = async (accountId: number): Promise<void> => {

    const response = await fetch(`${API_BASE_URL}/facebook/accounts/${accountId}`, {    const response = await fetch(`${API_BASE_URL}/facebook/accounts/${accountId}`, {

      method: 'DELETE',      method: 'DELETE',

    });    });



    if (!response.ok) {    if (!response.ok) {

      const errorData = await response.json();      const errorData = await response.json();

      throw new Error(errorData.detail || 'Failed to delete account');      throw new Error(errorData.detail || 'Failed to delete account');

    }    }



    await fetchAccounts(); // Refresh the list    await fetchAccounts(); // Refresh the list

  };  };



  return {  return {

    accounts,    accounts,

    loading,    loading,

    error,    error,

    refetch: fetchAccounts,    refetch: fetchAccounts,

    createAccount,    createAccount,

    updateAccount,    updateAccount,

    deleteAccount,    deleteAccount,

  };  };

};};



export const useAdAccounts = (facebookAccountId: number | null) => {export const useAdAccounts = (facebookAccountId: number | null) => {

  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);

  const [loading, setLoading] = useState(false);  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);  const [error, setError] = useState<string | null>(null);



  const fetchAdAccounts = useCallback(async () => {  const fetchAdAccounts = async () => {

    if (!facebookAccountId) {    if (!facebookAccountId) {

      setAdAccounts([]);      setAdAccounts([]);

      return;      return;

    }    }



    try {    try {

      setLoading(true);      setLoading(true);

      setError(null);      setError(null);

            

      const response = await fetch(`${API_BASE_URL}/facebook/accounts/${facebookAccountId}/ad-accounts`);      const response = await fetch(`${API_BASE_URL}/facebook/accounts/${facebookAccountId}/ad-accounts`);

            

      if (!response.ok) {      if (!response.ok) {

        throw new Error(`Failed to fetch ad accounts: ${response.statusText}`);        throw new Error(`Failed to fetch ad accounts: ${response.statusText}`);

      }      }

            

      const data = await response.json();      const data = await response.json();

      setAdAccounts(data);      setAdAccounts(data);

    } catch (err) {    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to fetch ad accounts');      setError(err instanceof Error ? err.message : 'Failed to fetch ad accounts');

    } finally {    } finally {

      setLoading(false);      setLoading(false);

    }    }

  }, [facebookAccountId]);  };



  useEffect(() => {  useEffect(() => {

    fetchAdAccounts();    fetchAdAccounts();

  }, [fetchAdAccounts]);  }, [facebookAccountId]);



  return {  return {

    adAccounts,    adAccounts,

    loading,    loading,

    error,    error,

    refetch: fetchAdAccounts,    refetch: fetchAdAccounts,

  };  };

};};



export const useFacebookPages = (facebookAccountId: number | null) => {export const useFacebookPages = (facebookAccountId: number | null) => {

  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);

  const [loading, setLoading] = useState(false);  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);  const [error, setError] = useState<string | null>(null);



  const fetchFacebookPages = useCallback(async () => {  const fetchFacebookPages = async () => {

    if (!facebookAccountId) {    if (!facebookAccountId) {

      setFacebookPages([]);      setFacebookPages([]);

      return;      return;

    }    }



    try {    try {

      setLoading(true);      setLoading(true);

      setError(null);      setError(null);

            

      const response = await fetch(`${API_BASE_URL}/facebook/accounts/${facebookAccountId}/pages`);      const response = await fetch(`${API_BASE_URL}/facebook/accounts/${facebookAccountId}/pages`);

            

      if (!response.ok) {      if (!response.ok) {

        throw new Error(`Failed to fetch Facebook pages: ${response.statusText}`);        throw new Error(`Failed to fetch Facebook pages: ${response.statusText}`);

      }      }

            

      const data = await response.json();      const data = await response.json();

      setFacebookPages(data);      setFacebookPages(data);

    } catch (err) {    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to fetch Facebook pages');      setError(err instanceof Error ? err.message : 'Failed to fetch Facebook pages');

    } finally {    } finally {

      setLoading(false);      setLoading(false);

    }    }

  }, [facebookAccountId]);  };



  useEffect(() => {  useEffect(() => {

    fetchFacebookPages();    fetchFacebookPages();

  }, [fetchFacebookPages]);  }, [facebookAccountId]);



  return {  return {

    facebookPages,    facebookPages,

    loading,    loading,

    error,    error,

    refetch: fetchFacebookPages,    refetch: fetchFacebookPages,

  };  };

};};



export const useFacebookGroups = () => {export const useFacebookGroups = () => {

  const [groups, setGroups] = useState<Array<{value: string, label: string}>>([]);  const [groups, setGroups] = useState<Array<{value: string, label: string}>>([]);

  const [loading, setLoading] = useState(true);  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);  const [error, setError] = useState<string | null>(null);



  useEffect(() => {  useEffect(() => {

    const fetchGroups = async () => {    const fetchGroups = async () => {

      try {      try {

        setLoading(true);        setLoading(true);

        setError(null);        setError(null);

                

        const response = await fetch(`${API_BASE_URL}/facebook/groups`);        const response = await fetch(`${API_BASE_URL}/facebook/groups`);

                

        if (!response.ok) {        if (!response.ok) {

          throw new Error(`Failed to fetch groups: ${response.statusText}`);          throw new Error(`Failed to fetch groups: ${response.statusText}`);

        }        }

                

        const data = await response.json();        const data = await response.json();

        setGroups([        setGroups([

          { value: 'all', label: 'Все' },          { value: 'all', label: 'Все' },

          { value: 'no', label: 'Без группы' },          { value: 'no', label: 'Без группы' },

          ...data          ...data

        ]);        ]);

      } catch (err) {      } catch (err) {

        setError(err instanceof Error ? err.message : 'Failed to fetch groups');        setError(err instanceof Error ? err.message : 'Failed to fetch groups');

      } finally {      } finally {

        setLoading(false);        setLoading(false);

      }      }

    };    };



    fetchGroups();    fetchGroups();

  }, []);  }, []);



  return { groups, loading, error };  return { groups, loading, error };

};};
};

// Hook для отримання даних кампаній
export function useFacebookCampaigns(apiService: FacebookApiService | null, enabled = true) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!apiService || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Отримуємо кампанії
      const campaignsResponse = await apiService.getCampaigns();
      
      // Для кожної кампанії отримуємо статистику
      const campaignsWithInsights = await Promise.all(
        campaignsResponse.data.map(async (campaign) => {
          try {
            const insightsResponse = await apiService.getCampaignInsights(campaign.id);
            const insights = insightsResponse.data[0]; // Беремо перший елемент статистики
            return apiService.convertToInternalFormat(campaign, insights);
          } catch (err) {
            console.warn(`Failed to fetch insights for campaign ${campaign.id}:`, err);
            return apiService.convertToInternalFormat(campaign);
          }
        })
      );

      setCampaigns(campaignsWithInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [apiService, enabled]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns
  };
}

// Hook для отримання даних ad sets
export function useFacebookAdSets(apiService: FacebookApiService | null, campaignId?: string, enabled = true) {
  const [adSets, setAdSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdSets = useCallback(async () => {
    if (!apiService || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const adSetsResponse = await apiService.getAdSets(campaignId);
      
      const adSetsWithInsights = await Promise.all(
        adSetsResponse.data.map(async (adSet) => {
          try {
            const insightsResponse = await apiService.getAdSetInsights(adSet.id);
            const insights = insightsResponse.data[0];
            return apiService.convertToInternalFormat(adSet, insights);
          } catch (err) {
            console.warn(`Failed to fetch insights for ad set ${adSet.id}:`, err);
            return apiService.convertToInternalFormat(adSet);
          }
        })
      );

      setAdSets(adSetsWithInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ad sets');
    } finally {
      setLoading(false);
    }
  }, [apiService, campaignId, enabled]);

  useEffect(() => {
    fetchAdSets();
  }, [fetchAdSets]);

  return {
    adSets,
    loading,
    error,
    refetch: fetchAdSets
  };
}

// Hook для отримання даних реклам
export function useFacebookAds(apiService: FacebookApiService | null, adSetId?: string, enabled = true) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    if (!apiService || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const adsResponse = await apiService.getAds(adSetId);
      
      const adsWithInsights = await Promise.all(
        adsResponse.data.map(async (ad) => {
          try {
            const insightsResponse = await apiService.getAdInsights(ad.id);
            const insights = insightsResponse.data[0];
            // Для реклам не можемо використовувати convertToInternalFormat, тому створюємо спрощений об'єкт
            return {
              id: ad.id,
              name: ad.name,
              status: ad.status,
              delivery: ad.effective_status === 'ACTIVE' ? 'ELIGIBLE' : 'PAUSED',
              // Додаємо базові метрики з insights
              ...(insights && {
                impressions: parseInt(insights.impressions || '0'),
                clicks: parseInt(insights.clicks || '0'),
                spend: parseFloat(insights.spend || '0'),
                ctr: parseFloat(insights.ctr || '0') / 100,
                cpc: parseFloat(insights.cpc || '0'),
                cpm: parseFloat(insights.cpm || '0'),
              })
            };
          } catch (err) {
            console.warn(`Failed to fetch insights for ad ${ad.id}:`, err);
            return {
              id: ad.id,
              name: ad.name,
              status: ad.status,
              delivery: ad.effective_status === 'ACTIVE' ? 'ELIGIBLE' : 'PAUSED',
            };
          }
        })
      );

      setAds(adsWithInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  }, [apiService, adSetId, enabled]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return {
    ads,
    loading,
    error,
    refetch: fetchAds
  };
}
