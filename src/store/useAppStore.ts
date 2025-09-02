import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type UserRole = 'Owner' | 'Admin' | 'Media Buyer' | 'Analyst' | 'Client-Viewer';
export type Language = 'en' | 'uk' | 'ru';
export type CampaignObjective = 'Conversions' | 'Traffic' | 'Engagement' | 'Leads' | 'Brand Awareness';
export type BudgetType = 'daily' | 'lifetime';
export type Gender = 'all' | 'male' | 'female';
export type CallToAction = 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'CONTACT_US' | 'DOWNLOAD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface CampaignDraft {
  name: string;
  objective: CampaignObjective;
  status: 'DRAFT';
  budgetType: BudgetType;
  dailyBudget: number;
  lifetimeBudget?: number;
}

export interface AdSetDraft {
  name: string;
  target: {
    location: string;
    ageRange: [number, number];
    gender: Gender;
    interests: string[];
  };
  placements: 'advantage_plus';
}

export interface AdDraft {
  creative: {
    primaryText: string;
    headline: string;
    description: string;
    media?: File | string;
  };
  destination: {
    websiteUrl: string;
  };
  callToAction: CallToAction;
}

export interface AppState {
  // User & Auth
  user: User | null;
  language: Language;
  
  // UI State
  sidebarCollapsed: boolean;
  aiAnalystOpen: boolean;
  
  // Autoupload Wizard
  currentStep: number;
  draft: {
    campaign: CampaignDraft;
    adSet: AdSetDraft;
    ad: AdDraft;
  };
  
  // Actions
  setUser: (user: User | null) => void;
  setLanguage: (language: Language) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAiAnalystOpen: (open: boolean) => void;
  
  // Wizard Actions
  setCurrentStep: (step: number) => void;
  updateCampaignDraft: (partial: Partial<CampaignDraft>) => void;
  updateAdSetDraft: (partial: Partial<AdSetDraft>) => void;
  updateAdDraft: (partial: Partial<AdDraft>) => void;
  resetDraft: () => void;
  
  // Validation
  validateStep: (step: number) => boolean;
}

const initialDraft = {
  campaign: {
    name: '',
    objective: 'Conversions' as CampaignObjective,
    status: 'DRAFT' as const,
    budgetType: 'daily' as BudgetType,
    dailyBudget: 50,
  },
  adSet: {
    name: '',
    target: {
      location: '',
      ageRange: [18, 65] as [number, number],
      gender: 'all' as Gender,
      interests: [],
    },
    placements: 'advantage_plus' as const,
  },
  ad: {
    creative: {
      primaryText: '',
      headline: '',
      description: '',
      media: undefined,
    },
    destination: {
      websiteUrl: '',
    },
    callToAction: 'LEARN_MORE' as CallToAction,
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: {
        id: '1',
        name: 'Demo User',
        email: 'demo@adsmanager.com',
        role: 'Admin',
        avatar: undefined,
      },
      language: 'uk',
      sidebarCollapsed: false,
      aiAnalystOpen: false,
      currentStep: 1,
      draft: initialDraft,
      
      // Actions
      setUser: (user) => set({ user }),
      setLanguage: (language) => set({ language }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setAiAnalystOpen: (open) => set({ aiAnalystOpen: open }),
      
      // Wizard Actions
      setCurrentStep: (step) => set({ currentStep: step }),
      updateCampaignDraft: (partial) =>
        set((state) => ({
          draft: {
            ...state.draft,
            campaign: { ...state.draft.campaign, ...partial },
          },
        })),
      updateAdSetDraft: (partial) =>
        set((state) => ({
          draft: {
            ...state.draft,
            adSet: { ...state.draft.adSet, ...partial },
          },
        })),
      updateAdDraft: (partial) =>
        set((state) => ({
          draft: {
            ...state.draft,
            ad: { ...state.draft.ad, ...partial },
          },
        })),
      resetDraft: () => set({ draft: initialDraft, currentStep: 1 }),
      
      // Validation
      validateStep: (step) => {
        const { draft } = get();
        
        switch (step) {
          case 1: // Campaign step
            return !!(
              draft.campaign.name.trim() &&
              draft.campaign.objective &&
              draft.campaign.budgetType &&
              (draft.campaign.budgetType === 'daily' ? draft.campaign.dailyBudget > 0 : true)
            );
          
          case 2: // Ad Set step
            return !!(
              draft.adSet.name.trim() &&
              draft.adSet.target.location.trim() &&
              draft.adSet.target.ageRange[0] >= 18 &&
              draft.adSet.target.ageRange[1] <= 65 &&
              draft.adSet.target.ageRange[0] <= draft.adSet.target.ageRange[1]
            );
          
          case 3: // Ad step
            const isValidUrl = (url: string) => {
              try {
                new URL(url);
                return true;
              } catch {
                return false;
              }
            };
            
            return !!(
              draft.ad.creative.primaryText.trim() &&
              draft.ad.creative.headline.trim() &&
              draft.ad.destination.websiteUrl.trim() &&
              isValidUrl(draft.ad.destination.websiteUrl)
            );
          
          default:
            return false;
        }
      },
    }),
    {
      name: 'ads-manager-store',
      partialize: (state) => ({
        user: state.user,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);