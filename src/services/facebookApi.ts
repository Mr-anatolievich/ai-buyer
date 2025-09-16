interface FacebookConfig {
  accessToken: string;
  appId: string;
  appSecret: string;
  adAccountId: string;
}

interface FacebookTargeting {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: Record<string, unknown>;
  interests?: Array<{ id: string; name: string }>;
  custom_audiences?: Array<{ id: string; name: string }>;
}

interface FacebookRequestParams {
  access_token?: string;
  fields?: string;
  filtering?: string;
  time_range?: {
    since: string;
    until: string;
  };
  breakdowns?: string;
  [key: string]: string | number | boolean | object | undefined;
}

interface FacebookInsights {
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  frequency: string;
  ctr: string;
  cpc: string;
  cpm: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  action_values?: Array<{
    action_type: string;
    value: string;
  }>;
}

interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy: string;
  created_time: string;
  updated_time: string;
  insights?: {
    data: FacebookInsights[];
  };
}

interface FacebookAdSet {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy: string;
  targeting?: FacebookTargeting;
  insights?: {
    data: FacebookInsights[];
  };
}

interface FacebookAd {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  adset_id: string;
  creative?: {
    id: string;
    name: string;
  };
  insights?: {
    data: FacebookInsights[];
  };
}

interface InternalCampaignData {
  id: string;
  name: string;
  status: string;
  delivery: string;
  bid_strategy: string;
  budget: {
    type: string;
    amount: number;
    currency: string;
  };
  results: {
    value: number;
    type: string;
  };
  reach: number;
  impressions: number;
  frequency: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  conversions: number;
  cvr: number;
  cpa: number;
  revenue: number;
  roas: number;
  aov: number;
  ends: string | null;
  learning: boolean;
  issues: string[];
  ai_decision: {
    rec: string;
    budget_change: number;
    confidence: number;
    why: string[];
  };
  hasChildren: boolean;
}

class FacebookApiService {
  private config: FacebookConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: FacebookConfig) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string, params: FacebookRequestParams = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Додаємо access_token до параметрів
    params.access_token = this.config.accessToken;
    
    // Додаємо параметри до URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook API Error: ${error.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Facebook API request failed:', error);
      throw error;
    }
  }

  // Отримання кампаній
  async getCampaigns(params?: {
    fields?: string[];
    filtering?: Record<string, unknown>;
    time_range?: {
      since: string;
      until: string;
    };
  }): Promise<{ data: FacebookCampaign[] }> {
    const defaultFields = [
      'id',
      'name', 
      'status',
      'effective_status',
      'daily_budget',
      'lifetime_budget',
      'bid_strategy',
      'created_time',
      'updated_time'
    ];

    const fields = params?.fields || defaultFields;
    
    const requestParams: FacebookRequestParams = {
      fields: fields.join(',')
    };

    if (params?.filtering) {
      requestParams.filtering = JSON.stringify(params.filtering);
    }

    return this.makeRequest<{ data: FacebookCampaign[] }>(
      `/act_${this.config.adAccountId}/campaigns`,
      requestParams
    );
  }

  // Отримання статистики кампаній
  async getCampaignInsights(campaignId: string, params?: {
    time_range?: {
      since: string;
      until: string;
    };
    breakdown?: string[];
  }): Promise<{ data: FacebookInsights[] }> {
    const fields = [
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      'ctr',
      'cpc',
      'cpm',
      'actions',
      'action_values'
    ];

    const requestParams: FacebookRequestParams = {
      fields: fields.join(','),
      time_range: params?.time_range || {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      }
    };

    if (params?.breakdown) {
      requestParams.breakdowns = params.breakdown.join(',');
    }

    return this.makeRequest<{ data: FacebookInsights[] }>(
      `/${campaignId}/insights`,
      requestParams
    );
  }

  // Отримання ad sets
  async getAdSets(campaignId?: string, params?: {
    fields?: string[];
    time_range?: {
      since: string;
      until: string;
    };
  }): Promise<{ data: FacebookAdSet[] }> {
    const defaultFields = [
      'id',
      'name',
      'status',
      'effective_status',
      'campaign_id',
      'daily_budget',
      'lifetime_budget',
      'bid_strategy',
      'targeting'
    ];

    const fields = params?.fields || defaultFields;
    const endpoint = campaignId 
      ? `/${campaignId}/adsets`
      : `/act_${this.config.adAccountId}/adsets`;

    return this.makeRequest<{ data: FacebookAdSet[] }>(
      endpoint,
      {
        fields: fields.join(',')
      }
    );
  }

  // Отримання статистики ad sets
  async getAdSetInsights(adSetId: string, params?: {
    time_range?: {
      since: string;
      until: string;
    };
  }): Promise<{ data: FacebookInsights[] }> {
    const fields = [
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      'ctr',
      'cpc',
      'cpm',
      'actions',
      'action_values'
    ];

    const requestParams: FacebookRequestParams = {
      fields: fields.join(','),
      time_range: params?.time_range || {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      }
    };

    return this.makeRequest<{ data: FacebookInsights[] }>(
      `/${adSetId}/insights`,
      requestParams
    );
  }

  // Отримання реклам
  async getAds(adSetId?: string, params?: {
    fields?: string[];
  }): Promise<{ data: FacebookAd[] }> {
    const defaultFields = [
      'id',
      'name',
      'status',
      'effective_status',
      'adset_id',
      'creative'
    ];

    const fields = params?.fields || defaultFields;
    const endpoint = adSetId 
      ? `/${adSetId}/ads`
      : `/act_${this.config.adAccountId}/ads`;

    return this.makeRequest<{ data: FacebookAd[] }>(
      endpoint,
      {
        fields: fields.join(',')
      }
    );
  }

  // Отримання статистики реклам
  async getAdInsights(adId: string, params?: {
    time_range?: {
      since: string;
      until: string;
    };
  }): Promise<{ data: FacebookInsights[] }> {
    const fields = [
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      'ctr',
      'cpc',
      'cpm',
      'actions',
      'action_values'
    ];

    const requestParams: FacebookRequestParams = {
      fields: fields.join(','),
      time_range: params?.time_range || {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      }
    };

    return this.makeRequest<{ data: FacebookInsights[] }>(
      `/${adId}/insights`,
      requestParams
    );
  }

  // Допоміжний метод для конвертації Facebook даних в наш формат
  convertToInternalFormat(facebookData: FacebookCampaign | FacebookAdSet, insights?: FacebookInsights): InternalCampaignData {
    const getActionValue = (actionType: string, field: 'actions' | 'action_values' = 'actions') => {
      if (!insights || !insights[field]) return 0;
      const action = insights[field]?.find(a => a.action_type === actionType);
      return action ? parseFloat(action.value) : 0;
    };

    const spend = insights ? parseFloat(insights.spend || '0') : 0;
    const impressions = insights ? parseInt(insights.impressions || '0') : 0;
    const clicks = insights ? parseInt(insights.clicks || '0') : 0;
    const reach = insights ? parseInt(insights.reach || '0') : 0;
    const frequency = insights ? parseFloat(insights.frequency || '0') : 0;
    
    const purchases = getActionValue('purchase');
    const purchaseValue = getActionValue('purchase', 'action_values');
    
    const ctr = insights ? parseFloat(insights.ctr || '0') / 100 : 0; // Facebook повертає у відсотках
    const cpc = insights ? parseFloat(insights.cpc || '0') : 0;
    const cpm = insights ? parseFloat(insights.cpm || '0') : 0;
    
    const cvr = clicks > 0 ? purchases / clicks : 0;
    const cpa = purchases > 0 ? spend / purchases : 0;
    const roas = spend > 0 ? purchaseValue / spend : 0;
    const aov = purchases > 0 ? purchaseValue / purchases : 0;

    return {
      id: facebookData.id,
      name: facebookData.name,
      status: facebookData.status,
      delivery: facebookData.effective_status === 'ACTIVE' ? 'ELIGIBLE' : 'PAUSED',
      bid_strategy: facebookData.bid_strategy || 'LOWEST_COST',
      budget: {
        type: facebookData.daily_budget ? 'DAILY' : 'LIFETIME',
        amount: parseFloat(facebookData.daily_budget || facebookData.lifetime_budget || '0'),
        currency: 'USD'
      },
      results: {
        value: purchases,
        type: 'PURCHASE'
      },
      reach,
      impressions,
      frequency,
      clicks,
      ctr,
      cpc,
      cpm,
      spend,
      conversions: purchases,
      cvr,
      cpa,
      revenue: purchaseValue,
      roas,
      aov,
      ends: null,
      learning: false,
      issues: [],
      ai_decision: {
        rec: roas >= 1.3 ? 'SCALE' : 'OPTIMIZE',
        budget_change: roas >= 1.3 ? 0.2 : 0,
        confidence: 0.75,
        why: [`ROAS ${roas.toFixed(2)}`, `CTR ${(ctr * 100).toFixed(2)}%`, `CPA $${cpa.toFixed(2)}`]
      },
      hasChildren: false
    };
  }
}

export { FacebookApiService, type FacebookConfig, type FacebookCampaign, type FacebookAdSet, type FacebookAd, type FacebookInsights };
