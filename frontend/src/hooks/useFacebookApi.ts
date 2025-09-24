import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

export interface FacebookAccount {
  id: number;
  name: string;
  facebook_id: string;
  group_name?: string;
  status: 'active' | 'inactive' | 'banned';
  token_status: 'active' | 'expired' | 'invalid';
  access_token?: string;
  user_agent?: string;
  cookies_data?: string;
  proxy_id?: number;
  balance?: string;
  daily_limit?: string;
  cookies_loaded: boolean;
  primary_cabinet?: string;
  primary_cabinet_id?: string;
  total_cabinets: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export function useFacebookAccounts() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/facebook/accounts`);
      const data: ApiResponse<FacebookAccount[]> = await response.json();
      
      if (data.status === 'success') {
        setAccounts(data.data);
      } else {
        setError(data.message || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
  };
}

// Mock hook for Facebook API service (for backwards compatibility)
export function useFacebookApi() {
  return {
    apiService: null,
    isConfigured: false
  };
}

// Mock hook for Facebook campaigns
export function useFacebookCampaigns() {
  return {
    campaigns: [],
    loading: false,
    error: null,
    refetch: () => {}
  };
}

// Mock hook for Facebook ad sets
export function useFacebookAdSets() {
  return {
    adSets: [],
    loading: false,
    error: null,
    refetch: () => {}
  };
}

// Mock hook for Facebook ads
export function useFacebookAds() {
  return {
    ads: [],
    loading: false,
    error: null,
    refetch: () => {}
  };
}