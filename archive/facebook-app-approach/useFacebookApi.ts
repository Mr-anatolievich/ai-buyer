import { useState, useEffect, useCallback } from 'react';
import { FacebookApiService, type FacebookConfig } from '@/services/facebookApi';

// Hook для конфігурації Facebook API
export function useFacebookApi(config?: FacebookConfig) {
  const [apiService, setApiService] = useState<FacebookApiService | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (config) {
      const service = new FacebookApiService(config);
      setApiService(service);
      setIsConfigured(true);
    }
  }, [config]);

  return { apiService, isConfigured };
}

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
