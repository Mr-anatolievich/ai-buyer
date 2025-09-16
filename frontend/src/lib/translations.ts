import type { Language } from '@/store/useAppStore';

export interface TranslationKeys {
  // Navigation
  dashboard: string;
  autoupload: string;
  statistics: string;
  creatives: string;
  aiAnalyst: string;
  accounts: string;
  facebookAccounts: string;
  team: string;
  autoRules: string;
  billings: string;
  console: string;
  settings: string;
  
  // Header
  profile: string;
  signOut: string;
  
  // Dashboard
  welcomeBack: string;
  campaignOverview: string;
  totalSpend: string;
  totalConversions: string;
  averageCPA: string;
  activeCampaigns: string;
  recentCampaigns: string;
  campaignName: string;
  status: string;
  spend: string;
  conversions: string;
  
  // Auto Upload
  createCampaign: string;
  campaign: string;
  adSet: string;
  ad: string;
  preview: string;
  templates: string;
  back: string;
  next: string;
  saveDraft: string;
  reset: string;
  
  // Campaign Step
  campaignDetails: string;
  campaignNameLabel: string;
  campaignNamePlaceholder: string;
  objective: string;
  budgetType: string;
  daily: string;
  lifetime: string;
  dailyBudget: string;
  
  // Ad Set Step
  adSetDetails: string;
  adSetNameLabel: string;
  adSetNamePlaceholder: string;
  targeting: string;
  location: string;
  locationPlaceholder: string;
  ageRange: string;
  gender: string;
  all: string;
  male: string;
  female: string;
  interests: string;
  interestsPlaceholder: string;
  
  // Ad Step
  adDetails: string;
  creative: string;
  primaryText: string;
  primaryTextPlaceholder: string;
  headline: string;
  headlinePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  uploadMedia: string;
  destination: string;
  websiteUrl: string;
  websiteUrlPlaceholder: string;
  callToAction: string;
  
  // Statistics
  statisticsOverview: string;
  campaigns: string;
  adSets: string;
  ads: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpa: string;
  
  // Creatives
  creativesLibrary: string;
  searchCreatives: string;
  allTypes: string;
  images: string;
  videos: string;
  highPerforming: string;
  
  // AI Analyst
  askAiAnalyst: string;
  askQuestionPlaceholder: string;
  suggestedQuestions: string;
  
  // Common
  loading: string;
  noData: string;
  error: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  view: string;
  search: string;
  filter: string;
  export: string;
}

const translations: Record<Language, TranslationKeys> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    autoupload: 'Auto Upload',
    statistics: 'Statistics',
    creatives: 'Creatives',
    aiAnalyst: 'AI Analyst',
    accounts: 'Accounts',
    facebookAccounts: 'Facebook Accounts',
    team: 'Team',
    autoRules: 'Auto Rules',
    billings: 'Billings',
    console: 'Console',
    settings: 'Settings',
    
    // Header
    profile: 'Profile',
    signOut: 'Sign Out',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    campaignOverview: 'Campaign Overview',
    totalSpend: 'Total Spend',
    totalConversions: 'Total Conversions',
    averageCPA: 'Average CPA',
    activeCampaigns: 'Active Campaigns',
    recentCampaigns: 'Recent Campaigns',
    campaignName: 'Campaign Name',
    status: 'Status',
    spend: 'Spend',
    conversions: 'Conversions',
    
    // Auto Upload
    createCampaign: 'Create Campaign',
    campaign: 'Campaign',
    adSet: 'Ad Set',
    ad: 'Ad',
    preview: 'Preview',
    templates: 'Templates',
    back: 'Back',
    next: 'Next',
    saveDraft: 'Save Draft',
    reset: 'Reset',
    
    // Campaign Step
    campaignDetails: 'Campaign Details',
    campaignNameLabel: 'Campaign Name',
    campaignNamePlaceholder: 'Enter campaign name',
    objective: 'Objective',
    budgetType: 'Budget Type',
    daily: 'Daily',
    lifetime: 'Lifetime',
    dailyBudget: 'Daily Budget',
    
    // Ad Set Step
    adSetDetails: 'Ad Set Details',
    adSetNameLabel: 'Ad Set Name',
    adSetNamePlaceholder: 'Enter ad set name',
    targeting: 'Targeting',
    location: 'Location',
    locationPlaceholder: 'Enter location',
    ageRange: 'Age Range',
    gender: 'Gender',
    all: 'All',
    male: 'Male',
    female: 'Female',
    interests: 'Interests',
    interestsPlaceholder: 'Enter interests (comma separated)',
    
    // Ad Step
    adDetails: 'Ad Details',
    creative: 'Creative',
    primaryText: 'Primary Text',
    primaryTextPlaceholder: 'Tell people what your ad is about...',
    headline: 'Headline',
    headlinePlaceholder: 'A short, catchy headline',
    description: 'Description',
    descriptionPlaceholder: 'Optional description',
    uploadMedia: 'Upload Media',
    destination: 'Destination',
    websiteUrl: 'Website URL',
    websiteUrlPlaceholder: 'https://example.com',
    callToAction: 'Call to Action',
    
    // Statistics
    statisticsOverview: 'Statistics Overview',
    campaigns: 'Campaigns',
    adSets: 'Ad Sets',
    ads: 'Ads',
    impressions: 'Impressions',
    clicks: 'Clicks',
    ctr: 'CTR',
    cpa: 'CPA',
    
    // Creatives
    creativesLibrary: 'Creatives Library',
    searchCreatives: 'Search creatives...',
    allTypes: 'All Types',
    images: 'Images',
    videos: 'Videos',
    highPerforming: 'High Performing',
    
    // AI Analyst
    askAiAnalyst: 'Ask AI Analyst',
    askQuestionPlaceholder: 'Ask about your campaigns performance...',
    suggestedQuestions: 'Suggested Questions',
    
    // Common
    loading: 'Loading...',
    noData: 'No data available',
    error: 'Error occurred',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
  },
  
  uk: {
    // Navigation
    dashboard: 'Панель управління',
    autoupload: 'Автозалив',
    statistics: 'Статистика',
    creatives: 'Креативи',
    aiAnalyst: 'ШІ Аналітик',
    accounts: 'Акаунти',
    facebookAccounts: 'Аккаунти Facebook',
    team: 'Команда',
    autoRules: 'Авто правила',
    billings: 'Біллінг',
    console: 'Консоль',
    settings: 'Налаштування',
    
    // Header
    profile: 'Профіль',
    signOut: 'Вийти',
    
    // Dashboard
    welcomeBack: 'Ласкаво просимо',
    campaignOverview: 'Огляд кампаній',
    totalSpend: 'Загальні витрати',
    totalConversions: 'Загальні конверсії',
    averageCPA: 'Середня CPA',
    activeCampaigns: 'Активні кампанії',
    recentCampaigns: 'Останні кампанії',
    campaignName: 'Назва кампанії',
    status: 'Статус',
    spend: 'Витрати',
    conversions: 'Конверсії',
    
    // Auto Upload
    createCampaign: 'Створити кампанію',
    campaign: 'Кампанія',
    adSet: 'Група оголошень',
    ad: 'Оголошення',
    preview: 'Перегляд',
    templates: 'Шаблони',
    back: 'Назад',
    next: 'Далі',
    saveDraft: 'Зберегти чернетку',
    reset: 'Скинути',
    
    // Campaign Step
    campaignDetails: 'Деталі кампанії',
    campaignNameLabel: 'Назва кампанії',
    campaignNamePlaceholder: 'Введіть назву кампанії',
    objective: 'Мета',
    budgetType: 'Тип бюджету',
    daily: 'Щоденний',
    lifetime: 'Довічний',
    dailyBudget: 'Щоденний бюджет',
    
    // Ad Set Step
    adSetDetails: 'Деталі групи оголошень',
    adSetNameLabel: 'Назва групи оголошень',
    adSetNamePlaceholder: 'Введіть назву групи оголошень',
    targeting: 'Таргетування',
    location: 'Локація',
    locationPlaceholder: 'Введіть локацію',
    ageRange: 'Віковий діапазон',
    gender: 'Стать',
    all: 'Всі',
    male: 'Чоловічий',
    female: 'Жіночий',
    interests: 'Інтереси',
    interestsPlaceholder: 'Введіть інтереси (через кому)',
    
    // Ad Step
    adDetails: 'Деталі оголошення',
    creative: 'Креатив',
    primaryText: 'Основний текст',
    primaryTextPlaceholder: 'Розкажіть людям про своє оголошення...',
    headline: 'Заголовок',
    headlinePlaceholder: 'Короткий, привабливий заголовок',
    description: 'Опис',
    descriptionPlaceholder: 'Додатковий опис',
    uploadMedia: 'Завантажити медіа',
    destination: 'Призначення',
    websiteUrl: 'URL веб-сайту',
    websiteUrlPlaceholder: 'https://example.com',
    callToAction: 'Заклик до дії',
    
    // Statistics
    statisticsOverview: 'Огляд статистики',
    campaigns: 'Кампанії',
    adSets: 'Групи оголошень',
    ads: 'Оголошення',
    impressions: 'Покази',
    clicks: 'Кліки',
    ctr: 'CTR',
    cpa: 'CPA',
    
    // Creatives
    creativesLibrary: 'Бібліотека креативів',
    searchCreatives: 'Пошук креативів...',
    allTypes: 'Всі типи',
    images: 'Зображення',
    videos: 'Відео',
    highPerforming: 'Високоефективні',
    
    // AI Analyst
    askAiAnalyst: 'Запитати ШІ Аналітика',
    askQuestionPlaceholder: 'Запитайте про ефективність ваших кампаній...',
    suggestedQuestions: 'Пропоновані питання',
    
    // Common
    loading: 'Завантаження...',
    noData: 'Дані відсутні',
    error: 'Виникла помилка',
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete: 'Видалити',
    edit: 'Редагувати',
    view: 'Переглянути',
    search: 'Пошук',
    filter: 'Фільтр',
    export: 'Експорт',
  },
  
  ru: {
    // Navigation
    dashboard: 'Панель управления',
    autoupload: 'Автозагрузка',
    statistics: 'Статистика',
    creatives: 'Креативы',
    aiAnalyst: 'ИИ Аналитик',
    accounts: 'Аккаунты',
    facebookAccounts: 'Аккаунты Facebook',
    team: 'Команда',
    autoRules: 'Авто правила',
    billings: 'Биллинг',
    console: 'Консоль',
    settings: 'Настройки',
    
    // Header
    profile: 'Профиль',
    signOut: 'Выйти',
    
    // Dashboard
    welcomeBack: 'Добро пожаловать',
    campaignOverview: 'Обзор кампаний',
    totalSpend: 'Общий расход',
    totalConversions: 'Общие конверсии',
    averageCPA: 'Средняя CPA',
    activeCampaigns: 'Активные кампании',
    recentCampaigns: 'Последние кампании',
    campaignName: 'Название кампании',
    status: 'Статус',
    spend: 'Расход',
    conversions: 'Конверсии',
    
    // Auto Upload
    createCampaign: 'Создать кампанию',
    campaign: 'Кампания',
    adSet: 'Группа объявлений',
    ad: 'Объявление',
    preview: 'Предпросмотр',
    templates: 'Шаблоны',
    back: 'Назад',
    next: 'Далее',
    saveDraft: 'Сохранить черновик',
    reset: 'Сбросить',
    
    // Campaign Step
    campaignDetails: 'Детали кампании',
    campaignNameLabel: 'Название кампании',
    campaignNamePlaceholder: 'Введите название кампании',
    objective: 'Цель',
    budgetType: 'Тип бюджета',
    daily: 'Ежедневный',
    lifetime: 'Пожизненный',
    dailyBudget: 'Ежедневный бюджет',
    
    // Ad Set Step
    adSetDetails: 'Детали группы объявлений',
    adSetNameLabel: 'Название группы объявлений',
    adSetNamePlaceholder: 'Введите название группы объявлений',
    targeting: 'Таргетирование',
    location: 'Локация',
    locationPlaceholder: 'Введите локацию',
    ageRange: 'Возрастной диапазон',
    gender: 'Пол',
    all: 'Все',
    male: 'Мужской',
    female: 'Женский',
    interests: 'Интересы',
    interestsPlaceholder: 'Введите интересы (через запятую)',
    
    // Ad Step
    adDetails: 'Детали объявления',
    creative: 'Креатив',
    primaryText: 'Основной текст',
    primaryTextPlaceholder: 'Расскажите людям о вашем объявлении...',
    headline: 'Заголовок',
    headlinePlaceholder: 'Короткий, привлекательный заголовок',
    description: 'Описание',
    descriptionPlaceholder: 'Дополнительное описание',
    uploadMedia: 'Загрузить медиа',
    destination: 'Назначение',
    websiteUrl: 'URL веб-сайта',
    websiteUrlPlaceholder: 'https://example.com',
    callToAction: 'Призыв к действию',
    
    // Statistics
    statisticsOverview: 'Обзор статистики',
    campaigns: 'Кампании',
    adSets: 'Группы объявлений',
    ads: 'Объявления',
    impressions: 'Показы',
    clicks: 'Клики',
    ctr: 'CTR',
    cpa: 'CPA',
    
    // Creatives
    creativesLibrary: 'Библиотека креативов',
    searchCreatives: 'Поиск креативов...',
    allTypes: 'Все типы',
    images: 'Изображения',
    videos: 'Видео',
    highPerforming: 'Высокоэффективные',
    
    // AI Analyst
    askAiAnalyst: 'Спросить ИИ Аналитика',
    askQuestionPlaceholder: 'Спросите об эффективности ваших кампаний...',
    suggestedQuestions: 'Предлагаемые вопросы',
    
    // Common
    loading: 'Загрузка...',
    noData: 'Данные отсутствуют',
    error: 'Произошла ошибка',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    view: 'Посмотреть',
    search: 'Поиск',
    filter: 'Фильтр',
    export: 'Экспорт',
  },
};

export function getTranslations(language: Language): TranslationKeys {
  return translations[language];
}

export function useTranslations() {
  const language = useAppStore(state => state.language);
  return getTranslations(language);
}

// Import useAppStore at the bottom to avoid circular dependency
import { useAppStore } from '@/store/useAppStore';