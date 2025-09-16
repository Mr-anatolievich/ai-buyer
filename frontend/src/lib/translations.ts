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
  campaignObjective: string;
  selectObjective: string;
  specialAdCategories: string;
  selectCategories: string;
  
  // Ad Set Step
  adSetDetails: string;
  adSetName: string;
  adSetNamePlaceholder: string;
  audience: string;
  locations: string;
  ageRange: string;
  gender: string;
  interests: string;
  behaviors: string;
  budget: string;
  schedule: string;
  
  // Ad Step
  adDetails: string;
  adName: string;
  adNamePlaceholder: string;
  adFormat: string;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  website: string;
  
  // Statistics
  performance: string;
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
  
  // Facebook Accounts
  addAccount: string;
  accountName: string;
  accountNamePlaceholder: string;
  accessToken: string;
  accessTokenPlaceholder: string;
  userAgent: string;
  userAgentPlaceholder: string;
  cookies: string;
  cookiesPlaceholder: string;
  group: string;
  selectGroup: string;
  proxy: string;
  selectProxy: string;
  actionName: string;
  actionStatus: string;
  actionCreatedAt: string;
  actionUpdatedAt: string;
  actionAdAccount: string;
  actionCampaign: string;
  actionAdSet: string;
  actionAd: string;
  actionCreative: string;
  statusActive: string;
  statusPending: string;
  statusStopped: string;
  statusPaused: string;
  statusError: string;
  statusSuccess: string;
  statusFailed: string;
  statusProcessing: string;
  statusQueued: string;
  statusCancelled: string;
  statusCompleted: string;
  statusWarning: string;
  statusUnknown: string;
  actions: string;
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
    welcomeBack: 'Welcome Back',
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
    campaignObjective: 'Campaign Objective',
    selectObjective: 'Select Objective',
    specialAdCategories: 'Special Ad Categories',
    selectCategories: 'Select Categories',
    
    // Ad Set Step
    adSetDetails: 'Ad Set Details',
    adSetName: 'Ad Set Name',
    adSetNamePlaceholder: 'Enter ad set name',
    audience: 'Audience',
    locations: 'Locations',
    ageRange: 'Age Range',
    gender: 'Gender',
    interests: 'Interests',
    behaviors: 'Behaviors',
    budget: 'Budget',
    schedule: 'Schedule',
    
    // Ad Step
    adDetails: 'Ad Details',
    adName: 'Ad Name',
    adNamePlaceholder: 'Enter ad name',
    adFormat: 'Ad Format',
    headline: 'Headline',
    primaryText: 'Primary Text',
    description: 'Description',
    callToAction: 'Call to Action',
    website: 'Website',
    
    // Statistics
    performance: 'Performance',
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
    
    // Facebook Accounts
    addAccount: 'Add Account',
    accountName: 'Account Name',
    accountNamePlaceholder: 'Enter account name',
    accessToken: 'Access Token',
    accessTokenPlaceholder: 'Enter access token',
    userAgent: 'User Agent',
    userAgentPlaceholder: 'Enter user agent',
    cookies: 'Cookies',
    cookiesPlaceholder: 'Enter cookies',
    group: 'Group',
    selectGroup: 'Select Group',
    proxy: 'Proxy',
    selectProxy: 'Select Proxy',
    actionName: 'Action',
    actionStatus: 'Status',
    actionCreatedAt: 'Created At',
    actionUpdatedAt: 'Updated At',
    actionAdAccount: 'Ad Account',
    actionCampaign: 'Campaign',
    actionAdSet: 'Ad Set',
    actionAd: 'Ad',
    actionCreative: 'Creative',
    statusActive: 'Active',
    statusPending: 'Pending',
    statusStopped: 'Stopped',
    statusPaused: 'Paused',
    statusError: 'Error',
    statusSuccess: 'Success',
    statusFailed: 'Failed',
    statusProcessing: 'Processing',
    statusQueued: 'Queued',
    statusCancelled: 'Cancelled',
    statusCompleted: 'Completed',
    statusWarning: 'Warning',
    statusUnknown: 'Unknown',
    actions: 'Actions',
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
    preview: 'Попередній перегляд',
    templates: 'Шаблони',
    back: 'Назад',
    next: 'Далі',
    saveDraft: 'Зберегти чернетку',
    reset: 'Скинути',
    
    // Campaign Step
    campaignDetails: 'Деталі кампанії',
    campaignNameLabel: 'Назва кампанії',
    campaignNamePlaceholder: 'Введіть назву кампанії',
    campaignObjective: 'Мета кампанії',
    selectObjective: 'Оберіть мету',
    specialAdCategories: 'Спеціальні категорії реклами',
    selectCategories: 'Оберіть категорії',
    
    // Ad Set Step
    adSetDetails: 'Деталі групи оголошень',
    adSetName: 'Назва групи оголошень',
    adSetNamePlaceholder: 'Введіть назву групи оголошень',
    audience: 'Аудиторія',
    locations: 'Локації',
    ageRange: 'Віковий діапазон',
    gender: 'Стать',
    interests: 'Інтереси',
    behaviors: 'Поведінка',
    budget: 'Бюджет',
    schedule: 'Розклад',
    
    // Ad Step
    adDetails: 'Деталі оголошення',
    adName: 'Назва оголошення',
    adNamePlaceholder: 'Введіть назву оголошення',
    adFormat: 'Формат оголошення',
    headline: 'Заголовок',
    primaryText: 'Основний текст',
    description: 'Опис',
    callToAction: 'Заклик до дії',
    website: 'Веб-сайт',
    
    // Statistics
    performance: 'Ефективність',
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
    suggestedQuestions: 'Рекомендовані питання',
    
    // Common
    loading: 'Завантаження...',
    noData: 'Немає даних',
    error: 'Виникла помилка',
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete: 'Видалити',
    edit: 'Редагувати',
    view: 'Переглянути',
    search: 'Пошук',
    filter: 'Фільтр',
    export: 'Експорт',
    
    // Facebook Accounts
    addAccount: 'Додати аккаунт',
    accountName: 'Назва аккаунта',
    accountNamePlaceholder: 'Введіть назву аккаунта',
    accessToken: 'Токен доступу',
    accessTokenPlaceholder: 'Введіть токен доступу',
    userAgent: 'User Agent',
    userAgentPlaceholder: 'Введіть User Agent',
    cookies: 'Cookies',
    cookiesPlaceholder: 'Введіть cookies',
    group: 'Група',
    selectGroup: 'Оберіть групу',
    proxy: 'Проксі',
    selectProxy: 'Оберіть проксі',
    actionName: 'Дія',
    actionStatus: 'Статус',
    actionCreatedAt: 'Створено',
    actionUpdatedAt: 'Оновлено',
    actionAdAccount: 'Рекламний аккаунт',
    actionCampaign: 'Кампанія',
    actionAdSet: 'Група оголошень',
    actionAd: 'Оголошення',
    actionCreative: 'Креатив',
    statusActive: 'Активний',
    statusPending: 'Очікує',
    statusStopped: 'Зупинено',
    statusPaused: 'Призупинено',
    statusError: 'Помилка',
    statusSuccess: 'Успішно',
    statusFailed: 'Не вдалося',
    statusProcessing: 'Обробляється',
    statusQueued: 'В черзі',
    statusCancelled: 'Скасовано',
    statusCompleted: 'Завершено',
    statusWarning: 'Попередження',
    statusUnknown: 'Невідомо',
    actions: 'Дії',
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
    campaignObjective: 'Цель кампании',
    selectObjective: 'Выберите цель',
    specialAdCategories: 'Специальные категории рекламы',
    selectCategories: 'Выберите категории',
    
    // Ad Set Step
    adSetDetails: 'Детали группы объявлений',
    adSetName: 'Название группы объявлений',
    adSetNamePlaceholder: 'Введите название группы объявлений',
    audience: 'Аудитория',
    locations: 'Локации',
    ageRange: 'Возрастной диапазон',
    gender: 'Пол',
    interests: 'Интересы',
    behaviors: 'Поведение',
    budget: 'Бюджет',
    schedule: 'Расписание',
    
    // Ad Step
    adDetails: 'Детали объявления',
    adName: 'Название объявления',
    adNamePlaceholder: 'Введите название объявления',
    adFormat: 'Формат объявления',
    headline: 'Заголовок',
    primaryText: 'Основной текст',
    description: 'Описание',
    callToAction: 'Призыв к действию',
    website: 'Веб-сайт',
    
    // Statistics
    performance: 'Производительность',
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
    askQuestionPlaceholder: 'Спросите о производительности ваших кампаний...',
    suggestedQuestions: 'Рекомендуемые вопросы',
    
    // Common
    loading: 'Загрузка...',
    noData: 'Нет данных',
    error: 'Произошла ошибка',
    save: 'Сохранить',
    cancel: 'Отменить',
    delete: 'Удалить',
    edit: 'Редактировать',
    view: 'Просмотреть',
    search: 'Поиск',
    filter: 'Фильтр',
    export: 'Экспорт',
    
    // Facebook Accounts
    addAccount: 'Добавить аккаунт',
    accountName: 'Название аккаунта',
    accountNamePlaceholder: 'Введите название аккаунта',
    accessToken: 'Токен доступа',
    accessTokenPlaceholder: 'Введите токен доступа',
    userAgent: 'User Agent',
    userAgentPlaceholder: 'Введите User Agent',
    cookies: 'Cookies',
    cookiesPlaceholder: 'Введите cookies',
    group: 'Группа',
    selectGroup: 'Выберите группу',
    proxy: 'Прокси',
    selectProxy: 'Выберите прокси',
    actionName: 'Действие',
    actionStatus: 'Статус',
    actionCreatedAt: 'Создано',
    actionUpdatedAt: 'Обновлено',
    actionAdAccount: 'Рекламный аккаунт',
    actionCampaign: 'Кампания',
    actionAdSet: 'Группа объявлений',
    actionAd: 'Объявление',
    actionCreative: 'Креатив',
    statusActive: 'Активный',
    statusPending: 'Ожидает',
    statusStopped: 'Остановлен',
    statusPaused: 'Приостановлен',
    statusError: 'Ошибка',
    statusSuccess: 'Успешно',
    statusFailed: 'Не удалось',
    statusProcessing: 'Обрабатывается',
    statusQueued: 'В очереди',
    statusCancelled: 'Отменено',
    statusCompleted: 'Завершено',
    statusWarning: 'Предупреждение',
    statusUnknown: 'Неизвестно',
    actions: 'Действия',
  },
};

export function getTranslation(key: keyof TranslationKeys, language: Language): string {
  return translations[language][key] || translations['en'][key] || key;
}

export function useTranslations(language: Language) {
  return {
    t: (key: keyof TranslationKeys) => getTranslation(key, language),
    translations: translations[language],
  };
}

export default translations;